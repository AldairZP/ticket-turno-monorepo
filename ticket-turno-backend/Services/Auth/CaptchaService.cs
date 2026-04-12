using System.Collections.Concurrent;
using System.Security.Cryptography;
using ticket_turno.DTOs;

namespace ticket_turno.Services.Auth;

public class CaptchaService : ICaptchaService
{
    private readonly ConcurrentDictionary<string, CaptchaEntry> _entries = new(StringComparer.Ordinal);
    private readonly AdminAuthOptions _options;

    public CaptchaService(AdminAuthOptions options)
    {
        _options = options;
    }

    public CaptchaChallengeDto GenerateChallenge()
    {
        CleanupExpired();

        var left = RandomNumberGenerator.GetInt32(1, 20);
        var right = RandomNumberGenerator.GetInt32(1, 20);

        var operations = new[] { "+", "-" };
        var operation = operations[RandomNumberGenerator.GetInt32(0, operations.Length)];

        var expected = operation == "+" ? left + right : left - right;
        var token = Guid.NewGuid().ToString("N");
        var expiresAt = DateTime.UtcNow.AddMinutes(Math.Max(1, _options.CaptchaExpirationMinutes));

        _entries[token] = new CaptchaEntry
        {
            ExpectedAnswer = expected.ToString(),
            ExpiresAtUtc = expiresAt
        };

        return new CaptchaChallengeDto
        {
            CaptchaToken = token,
            Prompt = $"{left} {operation} {right} = ?",
            ExpiresAtUtc = expiresAt
        };
    }

    public bool ValidateAnswer(string captchaToken, string answer)
    {
        CleanupExpired();

        if (!_entries.TryRemove(captchaToken, out var entry))
        {
            return false;
        }

        if (entry.ExpiresAtUtc < DateTime.UtcNow)
        {
            return false;
        }

        return string.Equals(entry.ExpectedAnswer, answer.Trim(), StringComparison.Ordinal);
    }

    private void CleanupExpired()
    {
        var now = DateTime.UtcNow;

        foreach (var kvp in _entries)
        {
            if (kvp.Value.ExpiresAtUtc < now)
            {
                _entries.TryRemove(kvp.Key, out _);
            }
        }
    }

    private sealed class CaptchaEntry
    {
        public required string ExpectedAnswer { get; init; }

        public DateTime ExpiresAtUtc { get; init; }
    }
}
