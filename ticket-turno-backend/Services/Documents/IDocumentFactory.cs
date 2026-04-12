namespace ticket_turno.Services.Documents;

public interface IDocumentFactory
{
    byte[] CreateTicketPdf(TicketPdfModel model);
}
