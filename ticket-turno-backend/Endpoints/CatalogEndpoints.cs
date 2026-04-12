using Microsoft.EntityFrameworkCore;
using ticket_turno.Data;
using ticket_turno.DTOs;

namespace ticket_turno.Endpoints;

public static class CatalogEndpoints
{
    public static RouteGroupBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/catalogos")
            .WithTags("Admin Catalogos")
            .RequireAuthorization("AdminOnly");

        group.MapGet("/{catalogKind}", ListAsync)
            .Produces<List<CatalogItemDto>>()
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("/{catalogKind}", CreateAsync)
            .Produces<CatalogItemDto>()
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{catalogKind}/{itemId:int}", UpdateAsync)
            .Produces<CatalogItemDto>()
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapDelete("/{catalogKind}/{itemId:int}", DeleteAsync)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        return group;
    }

    private static async Task<IResult> ListAsync(
        string catalogKind,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        return catalogKind.ToLowerInvariant() switch
        {
            "niveles-educativos" => Results.Ok(await dbContext.NivelesEducativos
                .AsNoTracking()
                .OrderBy(x => x.Nombre)
                .Select(x => new CatalogItemDto
                {
                    Id = x.Id,
                    Nombre = x.Nombre
                })
                .ToListAsync(cancellationToken)),

            "asuntos" => Results.Ok(await dbContext.Asuntos
                .AsNoTracking()
                .OrderBy(x => x.Nombre)
                .Select(x => new CatalogItemDto
                {
                    Id = x.Id,
                    Nombre = x.Nombre
                })
                .ToListAsync(cancellationToken)),

            "municipios" => Results.Ok(await dbContext.Municipios
                .AsNoTracking()
                .Include(x => x.OficinaRegional)
                .OrderBy(x => x.Nombre)
                .Select(x => new CatalogItemDto
                {
                    Id = x.Id,
                    Nombre = x.Nombre,
                    OficinaRegionalId = x.OficinaRegionalId,
                    OficinaRegional = x.OficinaRegional.Nombre
                })
                .ToListAsync(cancellationToken)),

            _ => Results.BadRequest(new { message = "Catalogo invalido." })
        };
    }

    private static async Task<IResult> CreateAsync(
        string catalogKind,
        UpsertCatalogItemDto request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationErrors = EndpointValidation.ValidateModel(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        var nombre = request.Nombre.Trim();
        if (string.IsNullOrWhiteSpace(nombre))
        {
            return Results.BadRequest(new { message = "El nombre es obligatorio." });
        }

        return catalogKind.ToLowerInvariant() switch
        {
            "niveles-educativos" => await CreateNivelEducativoAsync(nombre, dbContext, cancellationToken),
            "asuntos" => await CreateAsuntoAsync(nombre, dbContext, cancellationToken),
            "municipios" => await CreateMunicipioAsync(nombre, request.OficinaRegionalId, dbContext, cancellationToken),
            _ => Results.BadRequest(new { message = "Catalogo invalido." })
        };
    }

    private static async Task<IResult> UpdateAsync(
        string catalogKind,
        int itemId,
        UpsertCatalogItemDto request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationErrors = EndpointValidation.ValidateModel(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        if (itemId <= 0)
        {
            return Results.BadRequest(new { message = "El identificador es invalido." });
        }

        var nombre = request.Nombre.Trim();
        if (string.IsNullOrWhiteSpace(nombre))
        {
            return Results.BadRequest(new { message = "El nombre es obligatorio." });
        }

        return catalogKind.ToLowerInvariant() switch
        {
            "niveles-educativos" => await UpdateNivelEducativoAsync(itemId, nombre, dbContext, cancellationToken),
            "asuntos" => await UpdateAsuntoAsync(itemId, nombre, dbContext, cancellationToken),
            "municipios" => await UpdateMunicipioAsync(itemId, nombre, request.OficinaRegionalId, dbContext, cancellationToken),
            _ => Results.BadRequest(new { message = "Catalogo invalido." })
        };
    }

    private static async Task<IResult> DeleteAsync(
        string catalogKind,
        int itemId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (itemId <= 0)
        {
            return Results.BadRequest(new { message = "El identificador es invalido." });
        }

        return catalogKind.ToLowerInvariant() switch
        {
            "niveles-educativos" => await DeleteNivelEducativoAsync(itemId, dbContext, cancellationToken),
            "asuntos" => await DeleteAsuntoAsync(itemId, dbContext, cancellationToken),
            "municipios" => await DeleteMunicipioAsync(itemId, dbContext, cancellationToken),
            _ => Results.BadRequest(new { message = "Catalogo invalido." })
        };
    }

    private static async Task<IResult> CreateNivelEducativoAsync(
        string nombre,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var duplicate = await dbContext.NivelesEducativos
            .AsNoTracking()
            .AnyAsync(x => x.Nombre == nombre, cancellationToken);

        if (duplicate)
        {
            return Results.BadRequest(new { message = "Ya existe un nivel educativo con ese nombre." });
        }

        var entity = new Models.NivelEducativo { Nombre = nombre };
        dbContext.NivelesEducativos.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new CatalogItemDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre
        });
    }

    private static async Task<IResult> CreateAsuntoAsync(
        string nombre,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var duplicate = await dbContext.Asuntos
            .AsNoTracking()
            .AnyAsync(x => x.Nombre == nombre, cancellationToken);

        if (duplicate)
        {
            return Results.BadRequest(new { message = "Ya existe un asunto con ese nombre." });
        }

        var entity = new Models.Asunto { Nombre = nombre };
        dbContext.Asuntos.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new CatalogItemDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre
        });
    }

    private static async Task<IResult> CreateMunicipioAsync(
        string nombre,
        int? oficinaRegionalId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!oficinaRegionalId.HasValue || oficinaRegionalId.Value <= 0)
        {
            return Results.BadRequest(new { message = "Para municipios, oficinaRegionalId es obligatorio." });
        }

        var office = await dbContext.OficinasRegionales
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == oficinaRegionalId.Value, cancellationToken);

        if (office is null)
        {
            return Results.BadRequest(new { message = "La oficina regional seleccionada no existe." });
        }

        var duplicate = await dbContext.Municipios
            .AsNoTracking()
            .AnyAsync(x => x.OficinaRegionalId == oficinaRegionalId.Value && x.Nombre == nombre, cancellationToken);

        if (duplicate)
        {
            return Results.BadRequest(new { message = "Ya existe un municipio con ese nombre en la oficina regional seleccionada." });
        }

        var entity = new Models.Municipio
        {
            Nombre = nombre,
            OficinaRegionalId = oficinaRegionalId.Value
        };

        dbContext.Municipios.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new CatalogItemDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            OficinaRegionalId = entity.OficinaRegionalId,
            OficinaRegional = office.Nombre
        });
    }

    private static async Task<IResult> UpdateNivelEducativoAsync(
        int itemId,
        string nombre,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.NivelesEducativos
            .SingleOrDefaultAsync(x => x.Id == itemId, cancellationToken);

        if (entity is null)
        {
            return Results.NotFound(new { message = "No se encontro el nivel educativo solicitado." });
        }

        var duplicate = await dbContext.NivelesEducativos
            .AsNoTracking()
            .AnyAsync(x => x.Id != itemId && x.Nombre == nombre, cancellationToken);

        if (duplicate)
        {
            return Results.BadRequest(new { message = "Ya existe un nivel educativo con ese nombre." });
        }

        entity.Nombre = nombre;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new CatalogItemDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre
        });
    }

    private static async Task<IResult> UpdateAsuntoAsync(
        int itemId,
        string nombre,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.Asuntos
            .SingleOrDefaultAsync(x => x.Id == itemId, cancellationToken);

        if (entity is null)
        {
            return Results.NotFound(new { message = "No se encontro el asunto solicitado." });
        }

        var duplicate = await dbContext.Asuntos
            .AsNoTracking()
            .AnyAsync(x => x.Id != itemId && x.Nombre == nombre, cancellationToken);

        if (duplicate)
        {
            return Results.BadRequest(new { message = "Ya existe un asunto con ese nombre." });
        }

        entity.Nombre = nombre;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new CatalogItemDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre
        });
    }

    private static async Task<IResult> UpdateMunicipioAsync(
        int itemId,
        string nombre,
        int? oficinaRegionalId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!oficinaRegionalId.HasValue || oficinaRegionalId.Value <= 0)
        {
            return Results.BadRequest(new { message = "Para municipios, oficinaRegionalId es obligatorio." });
        }

        var entity = await dbContext.Municipios
            .SingleOrDefaultAsync(x => x.Id == itemId, cancellationToken);

        if (entity is null)
        {
            return Results.NotFound(new { message = "No se encontro el municipio solicitado." });
        }

        var office = await dbContext.OficinasRegionales
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == oficinaRegionalId.Value, cancellationToken);

        if (office is null)
        {
            return Results.BadRequest(new { message = "La oficina regional seleccionada no existe." });
        }

        var duplicate = await dbContext.Municipios
            .AsNoTracking()
            .AnyAsync(x => x.Id != itemId && x.OficinaRegionalId == oficinaRegionalId.Value && x.Nombre == nombre, cancellationToken);

        if (duplicate)
        {
            return Results.BadRequest(new { message = "Ya existe un municipio con ese nombre en la oficina regional seleccionada." });
        }

        entity.Nombre = nombre;
        entity.OficinaRegionalId = oficinaRegionalId.Value;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new CatalogItemDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            OficinaRegionalId = entity.OficinaRegionalId,
            OficinaRegional = office.Nombre
        });
    }

    private static async Task<IResult> DeleteNivelEducativoAsync(
        int itemId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.NivelesEducativos
            .SingleOrDefaultAsync(x => x.Id == itemId, cancellationToken);

        if (entity is null)
        {
            return Results.NotFound(new { message = "No se encontro el nivel educativo solicitado." });
        }

        var inUse = await dbContext.Tickets
            .AsNoTracking()
            .AnyAsync(x => x.NivelEducativoId == itemId, cancellationToken);

        if (inUse)
        {
            return Results.BadRequest(new { message = "No se puede eliminar porque el nivel educativo esta en uso." });
        }

        dbContext.NivelesEducativos.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteAsuntoAsync(
        int itemId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.Asuntos
            .SingleOrDefaultAsync(x => x.Id == itemId, cancellationToken);

        if (entity is null)
        {
            return Results.NotFound(new { message = "No se encontro el asunto solicitado." });
        }

        var inUse = await dbContext.Tickets
            .AsNoTracking()
            .AnyAsync(x => x.AsuntoId == itemId, cancellationToken);

        if (inUse)
        {
            return Results.BadRequest(new { message = "No se puede eliminar porque el asunto esta en uso." });
        }

        dbContext.Asuntos.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteMunicipioAsync(
        int itemId,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.Municipios
            .SingleOrDefaultAsync(x => x.Id == itemId, cancellationToken);

        if (entity is null)
        {
            return Results.NotFound(new { message = "No se encontro el municipio solicitado." });
        }

        var inUse = await dbContext.Tickets
            .AsNoTracking()
            .AnyAsync(x => x.MunicipioId == itemId, cancellationToken);

        if (inUse)
        {
            return Results.BadRequest(new { message = "No se puede eliminar porque el municipio esta en uso." });
        }

        dbContext.Municipios.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }
}
