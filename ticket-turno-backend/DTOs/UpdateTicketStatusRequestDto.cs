using System.ComponentModel.DataAnnotations;

namespace ticket_turno.DTOs;

public class UpdateTicketStatusRequestDto
{
    [Required]
    [RegularExpression("^(Pendiente|Resuelto)$", ErrorMessage = "El estatus solo puede ser Pendiente o Resuelto.")]
    public string Estatus { get; set; } = string.Empty;
}
