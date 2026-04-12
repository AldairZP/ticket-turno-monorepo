using ticket_turno.DTOs;

namespace ticket_turno.Services;

public class TicketGenerationResult
{
    public required byte[] PdfBytes { get; init; }

    public required string FileName { get; init; }

    public required TicketResponseDto Ticket { get; init; }
}
