import { getAdminToken } from "./authStorage";
import { httpClient } from "./httpClient";
import type {
  AdminCaptchaResponseDto,
  AdminLoginRequestDto,
  AdminLoginResponseDto,
  DashboardStatusSummaryDto,
  MessageErrorResponse,
  TicketStatus,
} from "../types/api";

function getAdminHeaders() {
  const token = getAdminToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function getAdminCaptcha() {
  const { data } = await httpClient.get<AdminCaptchaResponseDto>(
    "/api/admin/auth/captcha",
  );

  return data;
}

export async function loginAdmin(payload: AdminLoginRequestDto) {
  const { data } = await httpClient.post<AdminLoginResponseDto>(
    "/api/admin/auth/login",
    payload,
  );

  return data;
}

export async function getDashboardSummary(municipioId?: number) {
  const { data } = await httpClient.get<DashboardStatusSummaryDto>(
    "/api/admin/tickets/dashboard",
    {
      params: municipioId ? { municipioId } : undefined,
      headers: getAdminHeaders(),
    },
  );

  return data;
}

export async function updateAdminTicketStatus(
  ticketId: number,
  estatus: TicketStatus,
) {
  const { data } = await httpClient.patch<MessageErrorResponse>(
    `/api/admin/tickets/${ticketId}/estatus`,
    { estatus },
    {
      headers: getAdminHeaders(),
    },
  );

  return data;
}
