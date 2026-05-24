import type {
  Purchase,
  PurchaseConfirmRequest,
  PurchaseConfirmResponse,
  RaffleCreate,
  RaffleUpdate,
  RaffleNumbersResponse,
  Raffle,
  ReservationRequest,
  ReservationResponse,
  User,
} from "../types";

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

const request = async <T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new ApiError(message || "Request failed", response.status);
  }

  return response.json() as Promise<T>;
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

export const updateRaffle = (raffleId: string, payload: RaffleUpdate, userId?: string) =>
  request<Raffle>(API_WRITE_BASE_URL, `/raffles/${raffleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: userId ? { "X-User-Id": userId } : undefined,
  });

export const deleteRaffle = (raffleId: string, userId?: string) =>
  request<{ status: string; raffle_id: string }>(API_WRITE_BASE_URL, `/raffles/${raffleId}`, {
    method: "DELETE",
    headers: userId ? { "X-User-Id": userId } : undefined,
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

export { ApiError };
