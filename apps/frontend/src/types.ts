export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type RaffleCreate = {
  title: string;
  description?: string;
  ticket_price: number;
  currency: string;
  total_tickets: number;
  draw_at: string;
  number_start: number;
  number_padding?: number | null;
  status?: string;
  owner_id?: string | null;
};

export type RaffleUpdate = {
  title?: string;
  description?: string | null;
  ticket_price?: number;
  total_tickets?: number;
  draw_at?: string | null;
  status?: string;
};

export type Raffle = {
  id: string;
  title: string;
  description?: string | null;
  ticket_price: string;
  currency: string;
  total_tickets: number;
  tickets_sold: number;
  tickets_reserved: number;
  status: string;
  draw_at?: string | null;
  winner_ticket_id?: string | null;
  number_start: number;
  number_end: number;
  number_padding?: number | null;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type RaffleNumber = {
  number: number;
  label: string;
  status: "available" | "reserved" | "sold";
  reserved_until?: string | null;
};

export type RaffleNumbersResponse = {
  raffle_id: string;
  number_start: number;
  number_end: number;
  number_padding?: number | null;
  total_numbers: number;
  offset: number;
  limit: number;
  counts: Record<string, number>;
  numbers: RaffleNumber[];
};

export type ReservationRequest = {
  participant: {
    name: string;
    email?: string;
  };
  numbers: number[];
  ttl_minutes?: number;
};

export type ReservationResponse = {
  reservation_id: string;
  participant_id: string;
  raffle_id: string;
  numbers: number[];
  expires_at: string;
  ticket_price: string;
  currency: string;
  total_price: string;
};

export type PurchaseConfirmRequest = {
  reservation_id: string;
  participant_id?: string;
  payment_method?: string;
};

export type PurchaseConfirmResponse = {
  purchase_id: string;
  raffle_id: string;
  participant_id: string;
  numbers: number[];
  total_price: string;
  currency: string;
  status: string;
  created_at: string;
};

export type DrawResponse = {
  raffle_id: string;
  winner_ticket_id: string;
  winner_participant_id: string;
  winning_number: number;
};

export type Purchase = {
  purchase_id: string;
  raffle_id: string;
  raffle_title: string;
  raffle_status: string;
  numbers: number[];
  total_price: string;
  currency: string;
  status: string;
  payment_method?: string | null;
  created_at: string;
};
