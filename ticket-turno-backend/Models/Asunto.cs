using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Models;

public class Asunto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(180)]
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
