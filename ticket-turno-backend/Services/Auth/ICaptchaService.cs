using ticket_turno.DTOs;

namespace ticket_turno.Services.Auth;

public interface ICaptchaService
{
    CaptchaChallengeDto GenerateChallenge();

    bool ValidateAnswer(string captchaToken, string answer);
}
