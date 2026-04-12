using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ticket_turno.DTOs;
using ticket_turno.Services.Exceptions;

namespace ticket_turno.Services.Auth;

public class AdminAuthService(
    AdminAuthOptions options,
    ICaptchaService captchaService) : IAdminAuthService
{
    private readonly AdminAuthOptions _options = options;
    private readonly ICaptchaService _captchaService = captchaService;

    public AdminLoginResponseDto Login(AdminLoginRequestDto request)
    {
        var captchaIsValid = _captchaService.ValidateAnswer(request.CaptchaToken, request.CaptchaAnswer);

        if (!captchaIsValid)
        {
            throw new BusinessRuleException("Captcha invalido o expirado.");
        }

        var usernameIsValid = string.Equals(request.Username.Trim(), _options.Username, StringComparison.Ordinal);
        var passwordIsValid = string.Equals(request.Password, _options.Password, StringComparison.Ordinal);

        if (!usernameIsValid || !passwordIsValid)
        {
            throw new BusinessRuleException("Credenciales invalidas.");
        }

        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(Math.Max(10, _options.AccessTokenMinutes));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.JwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, _options.Username),
            new Claim(ClaimTypes.Name, _options.Username),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var jwtToken = new JwtSecurityToken(
            issuer: _options.JwtIssuer,
            audience: _options.JwtAudience,
            claims: claims,
            notBefore: now,
            expires: expiresAt,
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(jwtToken);

        return new AdminLoginResponseDto
        {
            AccessToken = accessToken,
            ExpiresAtUtc = expiresAt
        };
    }
}
