using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Models;

public class NivelEducativo
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}