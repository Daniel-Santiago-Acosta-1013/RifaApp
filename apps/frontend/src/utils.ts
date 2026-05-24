export const RAFFLE_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  completed: "Finalizada",
  cancelled: "Cancelada",
  draft: "Borrador",
};

export const statusChipColor = (status: string) => {
  switch (status) {
    case "active":
      return "success" as const;
    case "completed":
      return "info" as const;
    case "cancelled":
      return "error" as const;
    default:
      return "default" as const;
  }
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
