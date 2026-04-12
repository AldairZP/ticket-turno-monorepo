namespace ticket_turno.Services.Auth;

public class AdminAuthOptions
{
    public string Username { get; set; } = "admin";

    public string Password { get; set; } = "Admin123*";

    public string JwtIssuer { get; set; } = "ticket-turno-backend";

    public string JwtAudience { get; set; } = "ticket-turno-admin";

    public string JwtKey { get; set; } = "ChangeThisJwtKeyForProductionAtLeast32Chars";

    public int AccessTokenMinutes { get; set; } = 120;

    public int CaptchaExpirationMinutes { get; set; } = 5;
}
