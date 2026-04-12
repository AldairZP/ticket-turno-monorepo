using System.ComponentModel.DataAnnotations;

namespace ticket_turno.DTOs;

public class UpdateTicketRequestDto
{
    [Required]
    [StringLength(18, MinimumLength = 18)]
    [RegularExpression("^[A-Z0-9]{18}$", ErrorMessage = "La CURP debe contener 18 caracteres alfanumericos en mayusculas.")]
    public string Curp { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int NumeroTurno { get; set; }

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
    [EmailAddress]
    [MaxLength(180)]
    public string Correo { get; set; } = string.Empty;

    [Required]
    public DateTime FechaAtencion { get; set; }

    [Range(1, int.MaxValue)]
    public int NivelEducativoId { get; set; }

    [Range(1, int.MaxValue)]
    public int AsuntoId { get; set; }
}
