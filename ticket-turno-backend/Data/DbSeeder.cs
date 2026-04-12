using Microsoft.EntityFrameworkCore;
using ticket_turno.Models;

namespace ticket_turno.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext, CancellationToken cancellationToken = default)
    {
        await EnsureSchemaCompatibilityAsync(dbContext, cancellationToken);

        if (await dbContext.OficinasRegionales.AnyAsync(cancellationToken))
        {
            return;
        }

        var oficinaNorte = new OficinaRegional { Nombre = "Oficina Regional Norte" };
        var oficinaCentro = new OficinaRegional { Nombre = "Oficina Regional Centro" };
        var oficinaSur = new OficinaRegional { Nombre = "Oficina Regional Sur" };

        dbContext.OficinasRegionales.AddRange(oficinaNorte, oficinaCentro, oficinaSur);

        var municipios = new[]
        {
            new Municipio { Nombre = "Monterrey", OficinaRegional = oficinaNorte },
            new Municipio { Nombre = "San Nicolas", OficinaRegional = oficinaNorte },
            new Municipio { Nombre = "Guadalajara", OficinaRegional = oficinaCentro },
            new Municipio { Nombre = "Zapopan", OficinaRegional = oficinaCentro },
            new Municipio { Nombre = "Merida", OficinaRegional = oficinaSur },
            new Municipio { Nombre = "Cancun", OficinaRegional = oficinaSur }
        };

        dbContext.Municipios.AddRange(municipios);

        dbContext.NivelesEducativos.AddRange(
            new NivelEducativo { Nombre = "Primaria" },
            new NivelEducativo { Nombre = "Secundaria" },
            new NivelEducativo { Nombre = "Preparatoria" },
            new NivelEducativo { Nombre = "Licenciatura" },
            new NivelEducativo { Nombre = "Posgrado" });

        dbContext.Asuntos.AddRange(
            new Asunto { Nombre = "Inscripcion" },
            new Asunto { Nombre = "Entrega de documentos" },
            new Asunto { Nombre = "Aclaracion de expediente" },
            new Asunto { Nombre = "Tramite general" });

        await dbContext.SaveChangesAsync(cancellationToken);

        var capacidades = new List<CapacidadAtencionDiaria>();
        var diasHabiles = new[]
        {
            DayOfWeek.Monday,
            DayOfWeek.Tuesday,
            DayOfWeek.Wednesday,
            DayOfWeek.Thursday,
            DayOfWeek.Friday
        };

        foreach (var oficina in new[] { oficinaNorte, oficinaCentro, oficinaSur })
        {
            capacidades.AddRange(diasHabiles.Select(dia => new CapacidadAtencionDiaria
            {
                OficinaRegionalId = oficina.Id,
                DiaSemana = dia,
                CapacidadMaxima = 60
            }));
        }

        dbContext.CapacidadesAtencionDiaria.AddRange(capacidades);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureSchemaCompatibilityAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            IF COL_LENGTH('Tickets', 'Estatus') IS NULL
            BEGIN
                ALTER TABLE Tickets
                ADD Estatus nvarchar(20) NOT NULL CONSTRAINT DF_Tickets_Estatus DEFAULT ('Pendiente');
            END
            """,
            cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            IF COL_LENGTH('Tickets', 'FechaUltimaActualizacionUtc') IS NULL
            BEGIN
                ALTER TABLE Tickets
                ADD FechaUltimaActualizacionUtc datetime2 NULL;
            END
            """,
            cancellationToken);

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            IF NOT EXISTS (
                SELECT 1
                FROM sys.indexes
                WHERE name = 'IX_Tickets_Estatus'
                  AND object_id = OBJECT_ID('Tickets')
            )
            BEGIN
                CREATE INDEX IX_Tickets_Estatus ON Tickets (Estatus);
            END
            """,
            cancellationToken);
    }
}
