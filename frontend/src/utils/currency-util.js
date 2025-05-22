
export const formatCurrency = (amount, currency = "USD") => {
  if (amount === null || amount === undefined) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};


export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return "";

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};
