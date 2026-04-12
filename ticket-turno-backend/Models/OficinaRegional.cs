using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Models;

public class OficinaRegional
{
    public int Id { get; set; }

    [Required]
    [MaxLength(160)]
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Municipio> Municipios { get; set; } = new List<Municipio>();

    public ICollection<CapacidadAtencionDiaria> CapacidadesAtencion { get; set; } = new List<CapacidadAtencionDiaria>();
}
