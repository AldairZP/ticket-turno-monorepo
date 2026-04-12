using ticket_turno.DTOs;

namespace ticket_turno.Services.Auth;

public interface IAdminAuthService
{
    AdminLoginResponseDto Login(AdminLoginRequestDto request);
}
