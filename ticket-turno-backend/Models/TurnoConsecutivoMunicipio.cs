using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Models;

public class TurnoConsecutivoMunicipio
{
    [Key]
    public int MunicipioId { get; set; }

    public int UltimoNumero { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public Municipio Municipio { get; set; } = null!;
}
