export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT (Abuja)",
];

export const GLOBAL_LOCATIONS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "India",
  "Brazil",
  "Australia",
  "Global",
  "Japan",
  "Mexico",
  "South Africa",
  "China",
  "Spain",
  "Italy",
];

// Use Nigerian states as default locations
export const LOCATIONS = NIGERIAN_STATES;

export const PRODUCT_CATEGORIES = [
  "Nigerian Classics",
  "Fast Food",
  "Soups & Stews",
  "Rice & Swallow",
  "Seafood",
  "Vegetarian",
  "Desserts",
  "Drinks",
];

export type CurrencyOption = {
  code: string;
  label: string;
  locale: string;
  symbol: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", label: "USD - $", locale: "en-US", symbol: "$" },
  { code: "EUR", label: "EUR - €", locale: "de-DE", symbol: "€" },
  { code: "GBP", label: "GBP - £", locale: "en-GB", symbol: "£" },
  { code: "NGN", label: "NGN - ₦", locale: "en-NG", symbol: "₦" },
  { code: "JPY", label: "JPY - ¥", locale: "ja-JP", symbol: "¥" },
];

export const DEFAULT_CURRENCY = "USD";

export function getCurrencyOption(code: string) {
  return CURRENCY_OPTIONS.find((option) => option.code === code) ?? CURRENCY_OPTIONS[0];
}

export function calculateDeliveryFee(location: string | undefined, subtotal: number) {
  const lowerLocation = location?.toLowerCase() ?? "";
  let baseFee = 500; // Base fee in Naira

  // Nigerian states - lower fees
  if (NIGERIAN_STATES.some((state) => lowerLocation.includes(state.toLowerCase()))) {
    baseFee = 500;
  }
  // International locations
  else if (["united states", "canada", "united kingdom", "australia", "europe"].some((region) => lowerLocation.includes(region))) {
    baseFee = 3000;
  } else if (["india", "brazil", "global", "south africa", "china", "japan", "mexico"].some((region) => lowerLocation.includes(region))) {
    baseFee = 2000;
  }

  if (subtotal >= 50000) {
    return Math.max(0, baseFee - 200);
  }

  return baseFee;
}

export function formatCurrency(value: number, currencyCode = DEFAULT_CURRENCY, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
