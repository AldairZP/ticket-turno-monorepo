namespace ticket_turno.DTOs;

public class CaptchaChallengeDto
{
    public string CaptchaToken { get; set; } = string.Empty;

    public string Prompt { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }
}
