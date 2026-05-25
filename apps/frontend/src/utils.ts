export const RAFFLE_STATUS_LABELS: Record<string, string> = {
  open: "Activa",
  active: "Activa",
  published: "Activa",
  closed: "Finalizada",
  completed: "Finalizada",
  drawn: "Sorteada",
  cancelled: "Cancelada",
  draft: "Borrador",
};

export const isRaffleOpen = (status: string) => ["open", "active", "published"].includes(status);

export const isRaffleCompleted = (status: string) => ["closed", "completed", "drawn"].includes(status);

export const statusChipColor = (status: string) => {
  if (isRaffleOpen(status)) {
    return "success" as const;
  }
  if (isRaffleCompleted(status)) {
    return "info" as const;
  }
  if (status === "cancelled") {
    return "error" as const;
  }
  return "default" as const;
};

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Sin fecha";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatCurrency = (amount: number | string, currency = "COP") => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};
