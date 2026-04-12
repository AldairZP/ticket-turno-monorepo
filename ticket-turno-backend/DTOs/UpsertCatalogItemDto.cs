using System.ComponentModel.DataAnnotations;

namespace ticket_turno.DTOs;

public class UpsertCatalogItemDto
{
    [Required]
    [MaxLength(180)]
    public string Nombre { get; set; } = string.Empty;

    public int? OficinaRegionalId { get; set; }
}
