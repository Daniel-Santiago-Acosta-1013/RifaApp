import type {
  Purchase,
  PurchaseConfirmRequest,
  PurchaseConfirmResponse,
  DrawResponse,
  RaffleCreate,
  RaffleUpdate,
  RaffleNumbersResponse,
  Raffle,
  ReservationRequest,
  ReservationResponse,
  User,
} from "../types";
import { getAuthToken } from "../auth/token";

const getRequiredEnv = (key: "VITE_API_READ_BASE_URL" | "VITE_API_WRITE_BASE_URL") => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`${key} is required. Define it in the .env file.`);
  }
  return value.replace(/\/$/, "");
};

const API_READ_BASE_URL = getRequiredEnv("VITE_API_READ_BASE_URL");
const API_WRITE_BASE_URL = getRequiredEnv("VITE_API_WRITE_BASE_URL");

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const parseError = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (typeof data?.detail === "string") {
      return data.detail;
    }
    if (typeof data?.detail?.message === "string") {
      return data.detail.message;
    }
    if (typeof data?.message === "string") {
      return data.message;
    }
    return JSON.stringify(data);
  }
  const text = await response.text();
  return text || response.statusText || "Request failed";
};

const REQUEST_TIMEOUT_MS = 10000;

const request = async <T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Authorization")) {
    const token = await getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const message = await parseError(response);
      throw new ApiError(message || "Request failed", response.status);
    }

    return response.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("La solicitud tardó demasiado. Intenta de nuevo.", 0);
    }
    throw new ApiError("Error de conexion. Verifica tu red e intenta de nuevo.", 0);
  }
};

export const listRaffles = (status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<Raffle[]>(API_READ_BASE_URL, `/raffles${query}`);
};

export const getRaffle = (id: string) => request<Raffle>(API_READ_BASE_URL, `/raffles/${id}`);

export const createRaffle = (payload: RaffleCreate) =>
  request<Raffle>(API_WRITE_BASE_URL, "/raffles", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateRaffle = (raffleId: string, payload: RaffleUpdate) =>
  request<Raffle>(API_WRITE_BASE_URL, `/raffles/${raffleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteRaffle = (raffleId: string) =>
  request<{ status: string; raffle_id: string }>(API_WRITE_BASE_URL, `/raffles/${raffleId}`, {
    method: "DELETE",
  });

export const getRaffleNumbers = (raffleId: string, offset = 0, limit?: number) => {
  const query = new URLSearchParams();
  if (offset) {
    query.set("offset", String(offset));
  }
  if (limit) {
    query.set("limit", String(limit));
  }
  const suffix = query.toString();
  return request<RaffleNumbersResponse>(
    API_READ_BASE_URL,
    `/raffles/${raffleId}/numbers${suffix ? `?${suffix}` : ""}`,
  );
};

export const reserveNumbers = (raffleId: string, payload: ReservationRequest) =>
  request<ReservationResponse>(API_WRITE_BASE_URL, `/raffles/${raffleId}/reservations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const confirmPurchase = (raffleId: string, payload: PurchaseConfirmRequest) =>
  request<PurchaseConfirmResponse>(API_WRITE_BASE_URL, `/raffles/${raffleId}/confirm`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const releaseReservation = (raffleId: string, reservation_id: string) =>
  request<{ status: string; released: number }>(API_WRITE_BASE_URL, `/raffles/${raffleId}/release`, {
    method: "POST",
    body: JSON.stringify({ reservation_id }),
  });

export const drawRaffle = (raffleId: string) =>
  request<DrawResponse>(API_WRITE_BASE_URL, `/raffles/${raffleId}/draw`, {
    method: "POST",
  });

export const listPurchases = (participantId: string) =>
  request<Purchase[]>(API_READ_BASE_URL, `/participants/${participantId}/purchases`);

export const registerUser = (payload: { name: string; email: string; password: string }) =>
  request<User>(API_WRITE_BASE_URL, "/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginUser = (payload: { email: string; password: string }) =>
  request<User>(API_WRITE_BASE_URL, "/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getCurrentUser = () => request<User>(API_WRITE_BASE_URL, "/auth/me");

export { ApiError };
