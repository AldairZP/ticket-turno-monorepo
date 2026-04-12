using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Models;

public class Municipio
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Nombre { get; set; } = string.Empty;

    public int OficinaRegionalId { get; set; }

    public OficinaRegional OficinaRegional { get; set; } = null!;

    public TurnoConsecutivoMunicipio? TurnoConsecutivo { get; set; }

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
