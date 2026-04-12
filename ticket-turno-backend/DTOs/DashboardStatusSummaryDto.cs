namespace ticket_turno.DTOs;

public class DashboardStatusSummaryDto
{
    public bool FiltradoPorMunicipio { get; set; }

    public int? MunicipioId { get; set; }

    public string? Municipio { get; set; }

    public int TotalSolicitudes { get; set; }

    public int Pendientes { get; set; }

    public int Resueltas { get; set; }

    public decimal PorcentajePendientes { get; set; }

    public decimal PorcentajeResueltas { get; set; }

    public IReadOnlyList<DashboardMunicipioStatusDto> PorMunicipio { get; set; } = Array.Empty<DashboardMunicipioStatusDto>();
}

public class DashboardMunicipioStatusDto
{
    public int MunicipioId { get; set; }

    public string Municipio { get; set; } = string.Empty;

    public int TotalSolicitudes { get; set; }

    public int Pendientes { get; set; }

    public int Resueltas { get; set; }
}
