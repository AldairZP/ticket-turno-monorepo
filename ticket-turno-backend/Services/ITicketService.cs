using ticket_turno.DTOs;
using ticket_turno.Models;

namespace ticket_turno.Services;

public interface ITicketService
{
    Task<TicketGenerationResult> GenerateTicketAsync(GenerateTicketRequestDto request, CancellationToken cancellationToken = default);

    Task<TicketGenerationResult> UpdateTicketAsync(UpdateTicketRequestDto request, CancellationToken cancellationToken = default);

    Task<TicketResponseDto?> GetByCurpAsync(string curp, CancellationToken cancellationToken = default);

    Task<TicketResponseDto?> GetByCurpAndTurnAsync(string curp, int numeroTurno, CancellationToken cancellationToken = default);

    Task<bool> UpdateStatusAsync(int ticketId, TicketStatus status, CancellationToken cancellationToken = default);

    Task<DashboardStatusSummaryDto> GetDashboardStatusAsync(int? municipioId, CancellationToken cancellationToken = default);
}
