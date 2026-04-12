using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ticket_turno.Data;
using ticket_turno.DTOs;
using ticket_turno.Models;
using ticket_turno.Services.Documents;
using ticket_turno.Services.Exceptions;

namespace ticket_turno.Services;

public class TicketService(
    AppDbContext dbContext,
    IDocumentFactory documentFactory,
    ILogger<TicketService> logger) : ITicketService
{
    private const int MaxConcurrencyRetries = 3;

    private readonly AppDbContext _dbContext = dbContext;
    private readonly IDocumentFactory _documentFactory = documentFactory;
    private readonly ILogger<TicketService> _logger = logger;

    public async Task<TicketGenerationResult> GenerateTicketAsync(GenerateTicketRequestDto request, CancellationToken cancellationToken = default)
    {
        var curp = request.Curp.Trim().ToUpperInvariant();
        ValidateFechaAtencion(request.FechaAtencion);

        var municipio = await _dbContext.Municipios
            .AsNoTracking()
            .Include(x => x.OficinaRegional)
            .SingleOrDefaultAsync(x => x.Id == request.MunicipioId, cancellationToken)
            ?? throw new BusinessRuleException("El municipio seleccionado no existe.");

        var nivelEducativo = await _dbContext.NivelesEducativos
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.NivelEducativoId, cancellationToken)
            ?? throw new BusinessRuleException("El nivel educativo seleccionado no existe.");

        var asunto = await _dbContext.Asuntos
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.AsuntoId, cancellationToken)
            ?? throw new BusinessRuleException("El asunto seleccionado no existe.");

        var ticket = await GenerateTicketWithConcurrencyControlAsync(request, curp, municipio.OficinaRegionalId, cancellationToken);

        var fullTicket = await _dbContext.Tickets
            .AsNoTracking()
            .Include(x => x.NivelEducativo)
            .Include(x => x.Asunto)
            .Include(x => x.Municipio)
                .ThenInclude(x => x.OficinaRegional)
            .SingleAsync(x => x.Id == ticket.Id, cancellationToken);

        var response = MapToResponse(fullTicket);
        var documentData = MapToPdfModel(fullTicket);
        var pdfBytes = _documentFactory.CreateTicketPdf(documentData);

        return new TicketGenerationResult
        {
            PdfBytes = pdfBytes,
            FileName = $"ticket-{curp}-{ticket.NumeroTurno}.pdf",
            Ticket = response
        };
    }

    public async Task<TicketGenerationResult> UpdateTicketAsync(UpdateTicketRequestDto request, CancellationToken cancellationToken = default)
    {
        var curp = request.Curp.Trim().ToUpperInvariant();
        ValidateFechaAtencion(request.FechaAtencion);

        var ticket = await _dbContext.Tickets
            .Include(x => x.NivelEducativo)
            .Include(x => x.Asunto)
            .Include(x => x.Municipio)
                .ThenInclude(x => x.OficinaRegional)
            .SingleOrDefaultAsync(
                x => x.Curp == curp && x.NumeroTurno == request.NumeroTurno,
                cancellationToken)
            ?? throw new BusinessRuleException("No se encontro solicitud para la CURP y numero de turno proporcionados.");

        var nivelEducativo = await _dbContext.NivelesEducativos
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.NivelEducativoId, cancellationToken)
            ?? throw new BusinessRuleException("El nivel educativo seleccionado no existe.");

        var asunto = await _dbContext.Asuntos
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.AsuntoId, cancellationToken)
            ?? throw new BusinessRuleException("El asunto seleccionado no existe.");

        await EnsureCapacityAvailabilityForUpdateAsync(ticket, request.FechaAtencion, cancellationToken);

        ticket.Nombre = request.Nombre.Trim();
        ticket.Paterno = request.Paterno.Trim();
        ticket.Materno = request.Materno?.Trim();
        ticket.Telefono = request.Telefono.Trim();
        ticket.Celular = request.Celular.Trim();
        ticket.Correo = request.Correo.Trim().ToLowerInvariant();
        ticket.FechaAtencion = request.FechaAtencion;
        ticket.NivelEducativoId = request.NivelEducativoId;
        ticket.AsuntoId = request.AsuntoId;
        ticket.FechaUltimaActualizacionUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var updatedTicket = await _dbContext.Tickets
            .AsNoTracking()
            .Include(x => x.NivelEducativo)
            .Include(x => x.Asunto)
            .Include(x => x.Municipio)
                .ThenInclude(x => x.OficinaRegional)
            .SingleAsync(x => x.Id == ticket.Id, cancellationToken);

        var response = MapToResponse(updatedTicket);
        var documentData = MapToPdfModel(updatedTicket);
        var pdfBytes = _documentFactory.CreateTicketPdf(documentData);

        return new TicketGenerationResult
        {
            PdfBytes = pdfBytes,
            FileName = $"ticket-{curp}-{updatedTicket.NumeroTurno}.pdf",
            Ticket = response
        };
    }

    public async Task<TicketResponseDto?> GetByCurpAsync(string curp, CancellationToken cancellationToken = default)
    {
        var normalizedCurp = curp.Trim().ToUpperInvariant();

        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .Include(x => x.NivelEducativo)
            .Include(x => x.Asunto)
            .Include(x => x.Municipio)
                .ThenInclude(x => x.OficinaRegional)
            .Where(x => x.Curp == normalizedCurp)
            .OrderByDescending(x => x.FechaRegistroUtc)
            .FirstOrDefaultAsync(cancellationToken);

        return ticket is null ? null : MapToResponse(ticket);
    }

    public async Task<TicketResponseDto?> GetByCurpAndTurnAsync(string curp, int numeroTurno, CancellationToken cancellationToken = default)
    {
        var normalizedCurp = curp.Trim().ToUpperInvariant();

        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .Include(x => x.NivelEducativo)
            .Include(x => x.Asunto)
            .Include(x => x.Municipio)
                .ThenInclude(x => x.OficinaRegional)
            .SingleOrDefaultAsync(
                x => x.Curp == normalizedCurp && x.NumeroTurno == numeroTurno,
                cancellationToken);

        return ticket is null ? null : MapToResponse(ticket);
    }

    public async Task<bool> UpdateStatusAsync(int ticketId, TicketStatus status, CancellationToken cancellationToken = default)
    {
        var ticket = await _dbContext.Tickets
            .SingleOrDefaultAsync(x => x.Id == ticketId, cancellationToken);

        if (ticket is null)
        {
            return false;
        }

        ticket.Estatus = status;
        ticket.FechaUltimaActualizacionUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<DashboardStatusSummaryDto> GetDashboardStatusAsync(int? municipioId, CancellationToken cancellationToken = default)
    {
        if (municipioId.HasValue)
        {
            var municipio = await _dbContext.Municipios
                .AsNoTracking()
                .SingleOrDefaultAsync(x => x.Id == municipioId.Value, cancellationToken)
                ?? throw new BusinessRuleException("El municipio seleccionado no existe.");

            var summary = await _dbContext.Tickets
                .AsNoTracking()
                .Where(x => x.MunicipioId == municipioId.Value)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Pendientes = g.Count(x => x.Estatus == TicketStatus.Pendiente),
                    Resueltas = g.Count(x => x.Estatus == TicketStatus.Resuelto)
                })
                .FirstOrDefaultAsync(cancellationToken);

            var total = summary?.Total ?? 0;
            var pendientes = summary?.Pendientes ?? 0;
            var resueltas = summary?.Resueltas ?? 0;

            return new DashboardStatusSummaryDto
            {
                FiltradoPorMunicipio = true,
                MunicipioId = municipio.Id,
                Municipio = municipio.Nombre,
                TotalSolicitudes = total,
                Pendientes = pendientes,
                Resueltas = resueltas,
                PorcentajePendientes = CalculatePercentage(pendientes, total),
                PorcentajeResueltas = CalculatePercentage(resueltas, total),
                PorMunicipio =
                [
                    new DashboardMunicipioStatusDto
                    {
                        MunicipioId = municipio.Id,
                        Municipio = municipio.Nombre,
                        TotalSolicitudes = total,
                        Pendientes = pendientes,
                        Resueltas = resueltas
                    }
                ]
            };
        }

        var grouped = await _dbContext.Tickets
            .AsNoTracking()
            .GroupBy(x => new { x.MunicipioId, x.Municipio.Nombre })
            .Select(g => new DashboardMunicipioStatusDto
            {
                MunicipioId = g.Key.MunicipioId,
                Municipio = g.Key.Nombre,
                TotalSolicitudes = g.Count(),
                Pendientes = g.Count(x => x.Estatus == TicketStatus.Pendiente),
                Resueltas = g.Count(x => x.Estatus == TicketStatus.Resuelto)
            })
            .OrderBy(x => x.Municipio)
            .ToListAsync(cancellationToken);

        var totalSolicitudes = grouped.Sum(x => x.TotalSolicitudes);
        var totalPendientes = grouped.Sum(x => x.Pendientes);
        var totalResueltas = grouped.Sum(x => x.Resueltas);

        return new DashboardStatusSummaryDto
        {
            FiltradoPorMunicipio = false,
            MunicipioId = null,
            Municipio = null,
            TotalSolicitudes = totalSolicitudes,
            Pendientes = totalPendientes,
            Resueltas = totalResueltas,
            PorcentajePendientes = CalculatePercentage(totalPendientes, totalSolicitudes),
            PorcentajeResueltas = CalculatePercentage(totalResueltas, totalSolicitudes),
            PorMunicipio = grouped
        };
    }

    private async Task<Ticket> GenerateTicketWithConcurrencyControlAsync(
        GenerateTicketRequestDto request,
        string curp,
        int oficinaRegionalId,
        CancellationToken cancellationToken)
    {
        for (var retry = 1; retry <= MaxConcurrencyRetries; retry++)
        {
            await using var transaction = await _dbContext.Database
                .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            try
            {
                await EnsureCapacityAvailabilityAsync(oficinaRegionalId, request.FechaAtencion, cancellationToken);

                var consecutivo = await _dbContext.TurnosConsecutivosMunicipio
                    .SingleOrDefaultAsync(x => x.MunicipioId == request.MunicipioId, cancellationToken);

                if (consecutivo is null)
                {
                    consecutivo = new TurnoConsecutivoMunicipio
                    {
                        MunicipioId = request.MunicipioId,
                        UltimoNumero = 0
                    };

                    _dbContext.TurnosConsecutivosMunicipio.Add(consecutivo);
                }

                consecutivo.UltimoNumero++;

                var ticket = new Ticket
                {
                    Curp = curp,
                    Nombre = request.Nombre.Trim(),
                    Paterno = request.Paterno.Trim(),
                    Materno = request.Materno?.Trim(),
                    Telefono = request.Telefono.Trim(),
                    Celular = request.Celular.Trim(),
                    Correo = request.Correo.Trim().ToLowerInvariant(),
                    NumeroTurno = consecutivo.UltimoNumero,
                    FechaAtencion = request.FechaAtencion,
                    FechaRegistroUtc = DateTime.UtcNow,
                    FechaUltimaActualizacionUtc = null,
                    DocumentoAutenticacion = Guid.NewGuid(),
                    Estatus = TicketStatus.Pendiente,
                    NivelEducativoId = request.NivelEducativoId,
                    MunicipioId = request.MunicipioId,
                    AsuntoId = request.AsuntoId
                };

                _dbContext.Tickets.Add(ticket);
                await _dbContext.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return ticket;
            }
            catch (BusinessRuleException)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
            catch (DbUpdateConcurrencyException ex) when (retry < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Conflicto de concurrencia al generar turno. Reintento {Retry}", retry);
                await transaction.RollbackAsync(cancellationToken);
                _dbContext.ChangeTracker.Clear();
            }
            catch (DbUpdateException ex) when (IsRetryableDbConflict(ex) && retry < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Conflicto de base de datos al generar turno. Reintento {Retry}", retry);
                await transaction.RollbackAsync(cancellationToken);
                _dbContext.ChangeTracker.Clear();
            }
        }

        throw new BusinessRuleException("No fue posible generar el turno por concurrencia. Intenta nuevamente.");
    }

    private async Task EnsureCapacityAvailabilityAsync(int oficinaRegionalId, DateTime fechaAtencion, CancellationToken cancellationToken)
    {
        var fechaInicio = fechaAtencion.Date;
        var fechaFin = fechaInicio.AddDays(1);

        var capacidad = await _dbContext.CapacidadesAtencionDiaria
            .SingleOrDefaultAsync(
                x => x.OficinaRegionalId == oficinaRegionalId && x.DiaSemana == fechaInicio.DayOfWeek,
                cancellationToken);

        if (capacidad is null)
        {
            throw new BusinessRuleException("No existe una capacidad configurada para esa oficina regional y dia de atencion.");
        }

        var turnosAgendados = await _dbContext.Tickets
            .CountAsync(
                x => x.Municipio.OficinaRegionalId == oficinaRegionalId
                     && x.FechaAtencion >= fechaInicio
                     && x.FechaAtencion < fechaFin,
                cancellationToken);

        if (turnosAgendados >= capacidad.CapacidadMaxima)
        {
            throw new BusinessRuleException("La oficina regional ya alcanzo su capacidad maxima de atencion para ese dia.");
        }
    }

    private async Task EnsureCapacityAvailabilityForUpdateAsync(Ticket ticket, DateTime nuevaFechaAtencion, CancellationToken cancellationToken)
    {
        var cambiaFecha = ticket.FechaAtencion.Date != nuevaFechaAtencion.Date;

        if (!cambiaFecha)
        {
            return;
        }

        await EnsureCapacityAvailabilityAsync(ticket.Municipio.OficinaRegionalId, nuevaFechaAtencion, cancellationToken);
    }

    private static bool IsRetryableDbConflict(DbUpdateException ex)
    {
        if (ex.InnerException is SqlException sqlException)
        {
            return sqlException.Number is 1205 or 2601 or 2627;
        }

        var message = ex.InnerException?.Message ?? ex.Message;
        return message.Contains("IX_Tickets_MunicipioId_NumeroTurno", StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidateFechaAtencion(DateTime fechaAtencion)
    {
        if (fechaAtencion < DateTime.Now)
        {
            throw new BusinessRuleException("La fecha de atencion no puede estar en el pasado.");
        }
    }

    private static TicketResponseDto MapToResponse(Ticket ticket)
    {
        return new TicketResponseDto
        {
            Curp = ticket.Curp,
            NombreCompleto = BuildFullName(ticket.Nombre, ticket.Paterno, ticket.Materno),
            Telefono = ticket.Telefono,
            Celular = ticket.Celular,
            Correo = ticket.Correo,
            NumeroTurno = ticket.NumeroTurno,
            FechaAtencion = ticket.FechaAtencion,
            DocumentoAutenticacion = ticket.DocumentoAutenticacion,
            Estatus = ticket.Estatus.ToString(),
            NivelEducativo = ticket.NivelEducativo.Nombre,
            Municipio = ticket.Municipio.Nombre,
            OficinaRegional = ticket.Municipio.OficinaRegional.Nombre,
            Asunto = ticket.Asunto.Nombre
        };
    }

    private static TicketPdfModel MapToPdfModel(Ticket ticket)
    {
        return new TicketPdfModel
        {
            Curp = ticket.Curp,
            NombreCompleto = BuildFullName(ticket.Nombre, ticket.Paterno, ticket.Materno),
            Telefono = ticket.Telefono,
            Celular = ticket.Celular,
            Correo = ticket.Correo,
            NumeroTurno = ticket.NumeroTurno,
            FechaAtencion = ticket.FechaAtencion,
            DocumentoAutenticacion = ticket.DocumentoAutenticacion,
            Estatus = ticket.Estatus.ToString(),
            NivelEducativo = ticket.NivelEducativo.Nombre,
            Municipio = ticket.Municipio.Nombre,
            OficinaRegional = ticket.Municipio.OficinaRegional.Nombre,
            Asunto = ticket.Asunto.Nombre
        };
    }

    private static decimal CalculatePercentage(int value, int total)
    {
        if (total == 0)
        {
            return 0;
        }

        return Math.Round((decimal)value * 100m / total, 2, MidpointRounding.AwayFromZero);
    }

    private static string BuildFullName(string nombre, string paterno, string? materno)
    {
        return string.Join(" ", new[] { nombre, paterno, materno }
            .Where(x => !string.IsNullOrWhiteSpace(x)));
    }
}
