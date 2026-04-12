using ticket_turno.DTOs;
using ticket_turno.Services.Auth;
using ticket_turno.Services.Exceptions;

namespace ticket_turno.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/auth").WithTags("Admin Auth");

        group.MapGet("/captcha", GetCaptcha)
            .Produces<CaptchaChallengeDto>();

        group.MapPost("/login", Login)
            .Produces<AdminLoginResponseDto>()
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status400BadRequest);

        return group;
    }

    private static IResult GetCaptcha(ICaptchaService captchaService)
    {
        var challenge = captchaService.GenerateChallenge();
        return Results.Ok(challenge);
    }

    private static IResult Login(
        AdminLoginRequestDto request,
        IAdminAuthService authService)
    {
        var validationErrors = EndpointValidation.ValidateModel(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        try
        {
            var response = authService.Login(request);
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
}
