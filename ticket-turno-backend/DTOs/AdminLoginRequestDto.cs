using System.ComponentModel.DataAnnotations;

namespace ticket_turno.DTOs;

public class AdminLoginRequestDto
{
    [Required]
    [MaxLength(80)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string CaptchaToken { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string CaptchaAnswer { get; set; } = string.Empty;
}
