import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export function extractApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "Ocurrio un error inesperado.";
  }

  const responseData = error.response?.data as unknown;

  if (responseData && typeof responseData === "object") {
    const responseWithMessage = responseData as { message?: unknown };
    if (typeof responseWithMessage.message === "string") {
      return responseWithMessage.message;
    }

    const responseWithErrors = responseData as {
      errors?: Record<string, string[]>;
    };

    if (responseWithErrors.errors) {
      const firstErrorList = Object.values(responseWithErrors.errors).find(
        (value) => Array.isArray(value) && value.length > 0,
      );

      if (firstErrorList?.[0]) {
        return firstErrorList[0];
      }
    }
  }

  if (error.response?.status === 401) {
    return "Sesion expirada o no autorizada.";
  }

  return "No fue posible completar la solicitud.";
}
