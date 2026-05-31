export const formatMoney = (value: string | number, currency = "COP") => {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) {
    return `${value} ${currency}`;
  }
  if (currency === "COP") {
    return `$${new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 0,
    }).format(numeric)}`;
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "Sin fecha";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("es-CO");
};
