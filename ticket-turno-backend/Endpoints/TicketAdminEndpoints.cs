using ticket_turno.DTOs;
using ticket_turno.Models;
using ticket_turno.Services;
using ticket_turno.Services.Exceptions;

namespace ticket_turno.Endpoints;

public static class TicketAdminEndpoints
{
    public static RouteGroupBuilder MapTicketAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/tickets")
            .WithTags("Admin Tickets")
            .RequireAuthorization("AdminOnly");

        group.MapGet("/dashboard", GetDashboardAsync)
            .Produces<DashboardStatusSummaryDto>()
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPatch("/{ticketId:int}/estatus", UpdateStatusAsync)
            .Produces(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        return group;
    }

    private static async Task<IResult> GetDashboardAsync(
        int? municipioId,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await ticketService.GetDashboardStatusAsync(municipioId, cancellationToken);
            return Results.Ok(response);
        }
        catch (BusinessRuleException ex)
        {
            return Results.BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    private static async Task<IResult> UpdateStatusAsync(
        int ticketId,
        UpdateTicketStatusRequestDto request,
        ITicketService ticketService,
        CancellationToken cancellationToken)
    {
        var validationErrors = EndpointValidation.ValidateModel(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        if (!Enum.TryParse<TicketStatus>(request.Estatus, true, out var status))
        {
            return Results.BadRequest(new
            {
                message = "Estatus invalido. Debe ser Pendiente o Resuelto."
            });
        }

        var updated = await ticketService.UpdateStatusAsync(ticketId, status, cancellationToken);

        return updated
            ? Results.Ok(new { message = "Estatus actualizado correctamente." })
            : Results.NotFound(new { message = "No se encontro el ticket solicitado." });
    }
}
