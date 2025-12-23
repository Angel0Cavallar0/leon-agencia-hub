export const isDefined = <T>(value: T | null | undefined): value is T => value !== null && value !== undefined;

export const formatDate = (value?: string | number | Date, locale: string = "pt-BR"): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Intl.DateTimeFormat(locale).format(date);
};

export const formatCurrency = (amount: number, locale: string = "pt-BR", currency: string = "BRL"): string => {
  return Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
};
