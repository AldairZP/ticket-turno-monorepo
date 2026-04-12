namespace ticket_turno.Services.Documents;

public class TicketPdfModel
{
    public string Curp { get; set; } = string.Empty;

    public string NombreCompleto { get; set; } = string.Empty;

    public string Telefono { get; set; } = string.Empty;

    public string Celular { get; set; } = string.Empty;

    public string Correo { get; set; } = string.Empty;

    public int NumeroTurno { get; set; }

    public DateTime FechaAtencion { get; set; }

    public Guid DocumentoAutenticacion { get; set; }

    public string Estatus { get; set; } = string.Empty;

    public string NivelEducativo { get; set; } = string.Empty;

    public string Municipio { get; set; } = string.Empty;

    public string OficinaRegional { get; set; } = string.Empty;

    public string Asunto { get; set; } = string.Empty;
}
