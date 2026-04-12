using ticket_turno.DTOs;
using ticket_turno.Services;
using ticket_turno.Services.Exceptions;

namespace ticket_turno.Endpoints;

public static class TicketEndpoints
{
    public static RouteGroupBuilder MapTicketEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tickets").WithTags("Tickets");

        group.MapPost("/generar", GenerateTicketAsync)
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/actualizar", UpdateTicketAsync)
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/{curp}", GetTicketByCurpAsync)
            .Produces<TicketResponseDto>()
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/{curp}/{numeroTurno:int}", GetTicketByCurpAndTurnAsync)
            .Produces<TicketResponseDto>()
            .Produces(StatusCodes.Status404NotFound);

        return group;
    }

    private static async Task<IResult> GenerateTicketAsync(
        GenerateTicketRequestDto request,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        var validationErrors = EndpointValidation.ValidateModel(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        try
        {
            var generated = await ticketService.GenerateTicketAsync(request, cancellationToken);
            return Results.File(generated.PdfBytes, "application/pdf", generated.FileName);
        }
        catch (BusinessRuleException ex)
        {
            return Results.BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    private static async Task<IResult> UpdateTicketAsync(
        UpdateTicketRequestDto request,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        var validationErrors = EndpointValidation.ValidateModel(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        try
        {
            var updated = await ticketService.UpdateTicketAsync(request, cancellationToken);
            return Results.File(updated.PdfBytes, "application/pdf", updated.FileName);
        }
        catch (BusinessRuleException ex)
        {
            if (ex.Message.Contains("No se encontro solicitud", StringComparison.OrdinalIgnoreCase))
            {
                return Results.NotFound(new
                {
                    message = ex.Message
                });
            }

            return Results.BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    private static async Task<IResult> GetTicketByCurpAsync(
        string curp,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(curp))
        {
            return Results.BadRequest(new
            {
                message = "La CURP es obligatoria."
            });
        }

        var ticket = await ticketService.GetByCurpAsync(curp, cancellationToken);

        return ticket is null
            ? Results.NotFound(new { message = "No se encontro ticket para la CURP proporcionada." })
            : Results.Ok(ticket);
    }

    private static async Task<IResult> GetTicketByCurpAndTurnAsync(
        string curp,
        int numeroTurno,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(curp) || numeroTurno <= 0)
        {
            return Results.BadRequest(new
            {
                message = "La CURP y el numero de turno son obligatorios."
            });
        }

        var ticket = await ticketService.GetByCurpAndTurnAsync(curp, numeroTurno, cancellationToken);

        return ticket is null
            ? Results.NotFound(new { message = "No se encontro solicitud para la CURP y numero de turno proporcionados." })
            : Results.Ok(ticket);
    }
}