using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Models;

public class Ticket
{
    public int Id { get; set; }

    [Required]
    [MaxLength(18)]
    public string Curp { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Paterno { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Materno { get; set; }

    [Required]
    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Celular { get; set; } = string.Empty;

    [Required]
    [MaxLength(180)]
    [EmailAddress]
    public string Correo { get; set; } = string.Empty;

    public int NumeroTurno { get; set; }

    public DateTime FechaAtencion { get; set; }

    public DateTime FechaRegistroUtc { get; set; }

    public Guid DocumentoAutenticacion { get; set; }

    public TicketStatus Estatus { get; set; } = TicketStatus.Pendiente;

    public DateTime? FechaUltimaActualizacionUtc { get; set; }

    public int NivelEducativoId { get; set; }

    public NivelEducativo NivelEducativo { get; set; } = null!;

    public int MunicipioId { get; set; }

    public Municipio Municipio { get; set; } = null!;

    public int AsuntoId { get; set; }

    public Asunto Asunto { get; set; } = null!;
}