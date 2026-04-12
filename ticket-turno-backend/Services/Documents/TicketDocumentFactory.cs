using NetBarcode;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ticket_turno.Services.Documents;

public class TicketDocumentFactory : IDocumentFactory
{
    public byte[] CreateTicketPdf(TicketPdfModel model)
    {
        var qrBytes = BuildQr(model.Curp);
        var barcodeBytes = BuildBarcode(model.DocumentoAutenticacion.ToString("N"));

        return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A6);
                    page.Margin(16);
                    page.DefaultTextStyle(text => text.FontSize(10));

                    page.Content().Column(column =>
                    {
                        column.Spacing(8);

                        column.Item()
                            .Text("Comprobante de Turno")
                            .SemiBold()
                            .FontSize(16)
                            .AlignCenter();

                        column.Item()
                            .Text($"Turno #{model.NumeroTurno}")
                            .Bold()
                            .FontSize(22)
                            .AlignCenter();

                        column.Item().LineHorizontal(1);

                        column.Item().Text(text =>
                        {
                            text.Span("CURP: ").SemiBold();
                            text.Span(model.Curp);
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Nombre: ").SemiBold();
                            text.Span(model.NombreCompleto);
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Fecha de atencion: ").SemiBold();
                            text.Span(model.FechaAtencion.ToString("dd/MM/yyyy HH:mm"));
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Estatus: ").SemiBold();
                            text.Span(model.Estatus);
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Asunto: ").SemiBold();
                            text.Span(model.Asunto);
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Nivel educativo: ").SemiBold();
                            text.Span(model.NivelEducativo);
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Municipio: ").SemiBold();
                            text.Span(model.Municipio);
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Oficina regional: ").SemiBold();
                            text.Span(model.OficinaRegional);
                        });

                        column.Item().LineHorizontal(1);

                        column.Item()
                            .Text("Valida este turno con el QR (CURP)")
                            .FontSize(9)
                            .AlignCenter();

                        column.Item().AlignCenter().Image(qrBytes).FitWidth();

                        column.Item()
                            .Text("Codigo de barras de autenticacion")
                            .FontSize(9)
                            .AlignCenter();

                        column.Item().AlignCenter().Image(barcodeBytes).FitWidth();

                        column.Item()
                            .Text($"Token: {model.DocumentoAutenticacion}")
                            .FontSize(8);

                        column.Item().Text("Documento optimizado para lectura en pantalla movil.")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Darken2)
                            .AlignCenter();
                    });
                });
            })
            .GeneratePdf();
    }

    private static byte[] BuildQr(string curp)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(curp, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrData);
        return qrCode.GetGraphic(10);
    }

    private static byte[] BuildBarcode(string token)
    {
        var barcode = new Barcode(token, NetBarcode.Type.Code128, showLabel: false, width: 520, height: 130);
        return barcode.GetByteArray();
    }
}
