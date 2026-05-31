import type { RaffleNumber } from "../types";

export type RaffleNumbersChangedEvent = {
  type: "raffle_numbers_changed";
  raffle_id: string;
  event: "reserved" | "sold" | "released";
  numbers: number[];
  status: RaffleNumber["status"];
  reserved_until?: string | null;
  reservation_id?: string | null;
  purchase_id?: string | null;
};

export const getRealtimeWebsocketUrl = () => {
  const value = import.meta.env.VITE_REALTIME_WS_URL;
  return typeof value === "string" && value.trim() ? value.trim().replace(/\/$/, "") : "";
};
