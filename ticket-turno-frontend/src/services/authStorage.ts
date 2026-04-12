const ADMIN_TOKEN_KEY = "ticket_turno_admin_access_token";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(accessToken: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
