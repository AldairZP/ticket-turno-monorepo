using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Models;

public class CapacidadAtencionDiaria
{
    public int Id { get; set; }

    public DayOfWeek DiaSemana { get; set; }

    [Range(1, int.MaxValue)]
    public int CapacidadMaxima { get; set; }

    public int OficinaRegionalId { get; set; }

    public OficinaRegional OficinaRegional { get; set; } = null!;
}
