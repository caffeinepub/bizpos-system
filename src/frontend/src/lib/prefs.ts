// Reads bizpos_user_prefs from localStorage with defaults
export interface UserPrefs {
  compactTables: boolean;
  showTooltips: boolean;
  notifLowStock: boolean;
  notifPendingApprovals: boolean;
  notifSales: boolean;
  dateFormat: string; // "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"
  currency: string; // "PKR" | "USD" | "EUR" | "GBP" | "AED" | "SAR"
}

const DEFAULTS: UserPrefs = {
  compactTables: false,
  showTooltips: true,
  notifLowStock: true,
  notifPendingApprovals: true,
  notifSales: false,
  dateFormat: "DD/MM/YYYY",
  currency: "PKR",
};

export function getPrefs(): UserPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem("bizpos_user_prefs") || "{}");
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "PKR",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED",
  SAR: "SAR",
};

export function formatCurrency(amount: number, currency?: string): string {
  const cur = currency ?? getPrefs().currency;
  const sym = CURRENCY_SYMBOLS[cur] ?? cur;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  // For symbolic currencies put symbol before, for code currencies after or before with space
  if (["$", "€", "£"].includes(sym)) return `${sym}${formatted}`;
  return `${sym} ${formatted}`;
}

export function formatDate(
  date: Date | string | null | undefined,
  dateFormat?: string,
): string {
  if (!date) return "";
  const fmt = dateFormat ?? getPrefs().dateFormat;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  if (fmt === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  if (fmt === "YYYY-MM-DD") return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`; // default DD/MM/YYYY
}
