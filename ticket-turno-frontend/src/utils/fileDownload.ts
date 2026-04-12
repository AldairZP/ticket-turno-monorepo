import type { AxiosResponse } from "axios";

function getFilenameFromContentDisposition(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = headerValue.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return null;
}

export function downloadPdfFromResponse(
  response: AxiosResponse<Blob>,
  fallbackFilename: string,
) {
  const contentDisposition = response.headers["content-disposition"] ?? null;
  const filename =
    getFilenameFromContentDisposition(contentDisposition) ?? fallbackFilename;

  const fileBlob = new Blob([response.data], { type: "application/pdf" });
  const fileUrl = URL.createObjectURL(fileBlob);

  const anchor = document.createElement("a");
  anchor.href = fileUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(fileUrl);
}
