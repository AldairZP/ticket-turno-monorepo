import type { AxiosResponse } from "axios";
import { httpClient } from "./httpClient";
import type {
  GenerateTicketRequestDto,
  TicketResponseDto,
  UpdateTicketRequestDto,
} from "../types/api";

const PDF_RESPONSE_TYPE = { responseType: "blob" as const };

export function generateTicket(payload: GenerateTicketRequestDto) {
  return httpClient.post<Blob, AxiosResponse<Blob>>(
    "/api/tickets/generar",
    payload,
    PDF_RESPONSE_TYPE,
  );
}

export function updateTicket(payload: UpdateTicketRequestDto) {
  return httpClient.put<Blob, AxiosResponse<Blob>>(
    "/api/tickets/actualizar",
    payload,
    PDF_RESPONSE_TYPE,
  );
}

export async function getLatestTicketByCurp(curp: string) {
  const { data } = await httpClient.get<TicketResponseDto>(
    `/api/tickets/${encodeURIComponent(curp)}`,
  );

  return data;
}

export async function getTicketByCurpAndTurn(
  curp: string,
  numeroTurno: number,
) {
  const { data } = await httpClient.get<TicketResponseDto>(
    `/api/tickets/${encodeURIComponent(curp)}/${numeroTurno}`,
  );

  return data;
}
