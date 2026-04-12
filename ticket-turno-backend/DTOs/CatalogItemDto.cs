namespace ticket_turno.DTOs;

public class CatalogItemDto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public int? OficinaRegionalId { get; set; }

    public string? OficinaRegional { get; set; }
}
