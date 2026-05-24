import type { Page } from "@playwright/test";
import type {
  Purchase,
  Raffle,
  RaffleCreate,
  RaffleNumber,
  RaffleNumbersResponse,
  ReservationRequest,
  ReservationResponse,
  PurchaseConfirmRequest,
  PurchaseConfirmResponse,
  User,
} from "../src/types";

type MockState = {
  user: User;
  raffles: Raffle[];
  numbersByRaffleId: Record<string, RaffleNumber[]>;
  purchasesByParticipant: Record<string, Purchase[]>;
  reservationsById: Record<string, ReservationResponse>;
  idCounters: {
    raffle: number;
    reservation: number;
    purchase: number;
    participant: number;
  };
};

const createId = (state: MockState, key: keyof MockState["idCounters"], prefix: string) => {
  const value = state.idCounters[key];
  state.idCounters[key] += 1;
  return `${prefix}-${value}`;
};

const padNumber = (value: number, padding?: number | null) => {
  if (!padding) {
    return String(value);
  }
  return String(value).padStart(padding, "0");
};

const createNumbers = (raffle: Raffle, count = 20): RaffleNumber[] => {
  const start = raffle.number_start;
  const total = Math.min(count, raffle.total_tickets);
  return Array.from({ length: total }, (_, index) => {
    const number = start + index;
    return {
      number,
      label: padNumber(number, raffle.number_padding),
      status: "available",
      reserved_until: null,
    };
  });
};

const buildNumbersResponse = (raffle: Raffle, numbers: RaffleNumber[], offset = 0, limit?: number) => {
  const sliced = limit ? numbers.slice(offset, offset + limit) : numbers.slice(offset);
  const counts = sliced.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const response: RaffleNumbersResponse = {
    raffle_id: raffle.id,
    number_start: raffle.number_start,
    number_end: raffle.number_end,
    number_padding: raffle.number_padding ?? null,
    total_numbers: raffle.total_tickets,
    offset,
    limit: limit ?? sliced.length,
    counts,
    numbers: sliced,
  };

  return response;
};

const createBaseRaffles = (ownerId: string): Raffle[] => {
  const now = new Date("2024-01-01T12:00:00.000Z").toISOString();
  return [
    {
      id: "raffle-100",
      title: "Rifa iPhone 15",
      description: "Sorteo demo de tecnologia.",
      ticket_price: "5000",
      currency: "COP",
      total_tickets: 100,
      tickets_sold: 12,
      tickets_reserved: 3,
      status: "open",
      draw_at: new Date("2024-12-20T20:00:00.000Z").toISOString(),
      winner_ticket_id: null,
      number_start: 0,
      number_end: 99,
      number_padding: 2,
      owner_id: ownerId,
      created_at: now,
      updated_at: now,
    },
    {
      id: "raffle-200",
      title: "Rifa viaje Cartagena",
      description: "Plan de fin de semana todo incluido.",
      ticket_price: "10000",
      currency: "COP",
      total_tickets: 200,
      tickets_sold: 200,
      tickets_reserved: 0,
      status: "closed",
      draw_at: new Date("2024-06-15T20:00:00.000Z").toISOString(),
      winner_ticket_id: "A-200",
      number_start: 1,
      number_end: 200,
      number_padding: null,
      owner_id: ownerId,
      created_at: now,
      updated_at: now,
    },
  ];
};

export const createMockState = (): MockState => {
  const user: User = {
    id: "user-123",
    name: "Demo User",
    email: "demo@rifaapp.local",
    created_at: new Date("2024-01-01T00:00:00.000Z").toISOString(),
  };

  const raffles = createBaseRaffles(user.id);
  const numbersByRaffleId: Record<string, RaffleNumber[]> = {};
  raffles.forEach((raffle) => {
    numbersByRaffleId[raffle.id] = createNumbers(raffle);
  });

  return {
    user,
    raffles,
    numbersByRaffleId,
    purchasesByParticipant: {},
    reservationsById: {},
    idCounters: {
      raffle: 300,
      reservation: 1,
      purchase: 1,
      participant: 1,
    },
  };
};

const jsonResponse = (data: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});

const parseJsonBody = (raw?: string | null) => {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const updateNumberStatus = (numbers: RaffleNumber[], selected: number[], status: RaffleNumber["status"]) => {
  const selectedSet = new Set(selected);
  return numbers.map((item) =>
    selectedSet.has(item.number)
      ? {
          ...item,
          status,
          reserved_until: status === "reserved" ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
        }
      : item,
  );
};

const countStatus = (numbers: RaffleNumber[], status: RaffleNumber["status"]) =>
  numbers.filter((item) => item.status === status).length;

export const setupMockApi = async (page: Page, state: MockState) => {
  if (process.env.E2E_USE_LIVE_API === "true") {
    return;
  }

  await page.route(/.*\/rifa-?app-read\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/.*\/rifa-?app-read/, "");

    if (request.method() === "GET" && path === "/raffles") {
      const status = url.searchParams.get("status");
      const items = status ? state.raffles.filter((raffle) => raffle.status === status) : state.raffles;
      return route.fulfill(jsonResponse(items));
    }

    const raffleMatch = path.match(/^\/raffles\/([^/]+)$/);
    if (request.method() === "GET" && raffleMatch) {
      const raffle = state.raffles.find((item) => item.id === raffleMatch[1]);
      if (!raffle) {
        return route.fulfill(jsonResponse({ message: "Raffle not found" }, 404));
      }
      return route.fulfill(jsonResponse(raffle));
    }

    const numbersMatch = path.match(/^\/raffles\/([^/]+)\/numbers/);
    if (request.method() === "GET" && numbersMatch) {
      const raffleId = numbersMatch[1];
      const raffle = state.raffles.find((item) => item.id === raffleId);
      const numbers = state.numbersByRaffleId[raffleId];
      if (!raffle || !numbers) {
        return route.fulfill(jsonResponse({ message: "Numbers not found" }, 404));
      }
      const offset = Number(url.searchParams.get("offset") || 0);
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? Number(limitParam) : undefined;
      const response = buildNumbersResponse(raffle, numbers, offset, limit);
      return route.fulfill(jsonResponse(response));
    }

    const purchasesMatch = path.match(/^\/participants\/([^/]+)\/purchases$/);
    if (request.method() === "GET" && purchasesMatch) {
      const participantId = purchasesMatch[1];
      const purchases = state.purchasesByParticipant[participantId] || [];
      return route.fulfill(jsonResponse(purchases));
    }

    return route.fulfill(jsonResponse({ message: "Not found" }, 404));
  });

  await page.route(/.*\/rifa-?app-write\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/.*\/rifa-?app-write/, "");
    const raw = request.postData();

    if (request.method() === "POST" && path === "/auth/login") {
      return route.fulfill(jsonResponse(state.user));
    }

    if (request.method() === "POST" && path === "/auth/register") {
      const payload = parseJsonBody(raw) as { name?: string; email?: string } | null;
      if (payload?.name) {
        state.user.name = payload.name;
      }
      if (payload?.email) {
        state.user.email = payload.email;
      }
      return route.fulfill(jsonResponse(state.user));
    }

    if (request.method() === "POST" && path === "/raffles") {
      const payload = parseJsonBody(raw) as RaffleCreate | null;
      if (!payload) {
        return route.fulfill(jsonResponse({ message: "Invalid payload" }, 400));
      }
      const id = createId(state, "raffle", "raffle");
      const now = new Date().toISOString();
      const numberStart = payload.number_start ?? 0;
      const totalTickets = payload.total_tickets ?? 0;
      const numberEnd = numberStart + Math.max(0, totalTickets - 1);
      const created: Raffle = {
        id,
        title: payload.title,
        description: payload.description ?? null,
        ticket_price: String(payload.ticket_price),
        currency: payload.currency || "COP",
        total_tickets: payload.total_tickets,
        tickets_sold: 0,
        tickets_reserved: 0,
        status: payload.status || "open",
        draw_at: payload.draw_at ?? null,
        winner_ticket_id: null,
        number_start: numberStart,
        number_end: numberEnd,
        number_padding: payload.number_padding ?? null,
        owner_id: payload.owner_id ?? state.user.id,
        created_at: now,
        updated_at: now,
      };
      state.raffles = [created, ...state.raffles];
      state.numbersByRaffleId[created.id] = createNumbers(created);
      return route.fulfill(jsonResponse(created));
    }

    const updateMatch = path.match(/^\/raffles\/([^/]+)$/);
    if (request.method() === "PATCH" && updateMatch) {
      const raffle = state.raffles.find((item) => item.id === updateMatch[1]);
      if (!raffle) {
        return route.fulfill(jsonResponse({ message: "Raffle not found" }, 404));
      }
      const payload = parseJsonBody(raw) as Partial<Raffle> | null;
      Object.assign(raffle, payload || {});
      raffle.updated_at = new Date().toISOString();
      return route.fulfill(jsonResponse(raffle));
    }

    if (request.method() === "DELETE" && updateMatch) {
      const raffleId = updateMatch[1];
      state.raffles = state.raffles.filter((item) => item.id !== raffleId);
      delete state.numbersByRaffleId[raffleId];
      return route.fulfill(jsonResponse({ status: "deleted", raffle_id: raffleId }));
    }

    const reserveMatch = path.match(/^\/raffles\/([^/]+)\/reservations$/);
    if (request.method() === "POST" && reserveMatch) {
      const raffleId = reserveMatch[1];
      const raffle = state.raffles.find((item) => item.id === raffleId);
      const numbers = state.numbersByRaffleId[raffleId];
      if (!raffle || !numbers) {
        return route.fulfill(jsonResponse({ message: "Raffle not found" }, 404));
      }
      const payload = parseJsonBody(raw) as ReservationRequest | null;
      if (!payload) {
        return route.fulfill(jsonResponse({ message: "Invalid payload" }, 400));
      }
      const reservationId = createId(state, "reservation", "reservation");
      const participantId = createId(state, "participant", "participant");
      const totalPrice = String(Number(raffle.ticket_price) * payload.numbers.length);
      const reservation: ReservationResponse = {
        reservation_id: reservationId,
        participant_id: participantId,
        raffle_id: raffleId,
        numbers: payload.numbers,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        ticket_price: raffle.ticket_price,
        currency: raffle.currency,
        total_price: totalPrice,
      };
      state.reservationsById[reservationId] = reservation;
      state.numbersByRaffleId[raffleId] = updateNumberStatus(numbers, payload.numbers, "reserved");
      raffle.tickets_reserved = countStatus(state.numbersByRaffleId[raffleId], "reserved");
      return route.fulfill(jsonResponse(reservation));
    }

    const confirmMatch = path.match(/^\/raffles\/([^/]+)\/confirm$/);
    if (request.method() === "POST" && confirmMatch) {
      const raffleId = confirmMatch[1];
      const raffle = state.raffles.find((item) => item.id === raffleId);
      const numbers = state.numbersByRaffleId[raffleId];
      if (!raffle || !numbers) {
        return route.fulfill(jsonResponse({ message: "Raffle not found" }, 404));
      }
      const payload = parseJsonBody(raw) as PurchaseConfirmRequest | null;
      if (!payload?.reservation_id) {
        return route.fulfill(jsonResponse({ message: "Invalid payload" }, 400));
      }
      const reservation = state.reservationsById[payload.reservation_id];
      if (!reservation) {
        return route.fulfill(jsonResponse({ message: "Reservation not found" }, 404));
      }
      const purchaseId = createId(state, "purchase", "purchase");
      const purchase: PurchaseConfirmResponse = {
        purchase_id: purchaseId,
        raffle_id: raffleId,
        participant_id: reservation.participant_id,
        numbers: reservation.numbers,
        total_price: reservation.total_price,
        currency: reservation.currency,
        status: "confirmed",
        created_at: new Date().toISOString(),
      };

      state.numbersByRaffleId[raffleId] = updateNumberStatus(numbers, reservation.numbers, "sold");
      raffle.tickets_sold = countStatus(state.numbersByRaffleId[raffleId], "sold");
      raffle.tickets_reserved = countStatus(state.numbersByRaffleId[raffleId], "reserved");
      delete state.reservationsById[payload.reservation_id];

      const purchases = state.purchasesByParticipant[reservation.participant_id] || [];
      const purchaseItem: Purchase = {
        purchase_id: purchaseId,
        raffle_id: raffleId,
        raffle_title: raffle.title,
        raffle_status: raffle.status,
        numbers: reservation.numbers,
        total_price: reservation.total_price,
        currency: reservation.currency,
        status: "confirmed",
        payment_method: payload.payment_method || "demo",
        created_at: purchase.created_at,
      };
      state.purchasesByParticipant[reservation.participant_id] = [purchaseItem, ...purchases];

      return route.fulfill(jsonResponse(purchase));
    }

    const releaseMatch = path.match(/^\/raffles\/([^/]+)\/release$/);
    if (request.method() === "POST" && releaseMatch) {
      const raffleId = releaseMatch[1];
      const raffle = state.raffles.find((item) => item.id === raffleId);
      const numbers = state.numbersByRaffleId[raffleId];
      if (!raffle || !numbers) {
        return route.fulfill(jsonResponse({ message: "Raffle not found" }, 404));
      }
      const payload = parseJsonBody(raw) as { reservation_id?: string } | null;
      if (!payload?.reservation_id) {
        return route.fulfill(jsonResponse({ message: "Invalid payload" }, 400));
      }
      const reservation = state.reservationsById[payload.reservation_id];
      if (reservation) {
        state.numbersByRaffleId[raffleId] = updateNumberStatus(numbers, reservation.numbers, "available");
        delete state.reservationsById[payload.reservation_id];
      }
      raffle.tickets_reserved = countStatus(state.numbersByRaffleId[raffleId], "reserved");
      return route.fulfill(jsonResponse({ status: "released", released: reservation?.numbers.length || 0 }));
    }

    return route.fulfill(jsonResponse({ message: "Not found" }, 404));
  });
};
