import { supabase } from "@/lib/supabase/client";

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

// Get exchange rate
export async function getExchangeRate(fromCurrency: string, toCurrency: string) {
  try {
    if (fromCurrency === toCurrency) return 1;

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", fromCurrency)
      .eq("to_currency", toCurrency)
      .single();

    if (error) return null;
    return data?.rate || null;
  } catch (error) {
    console.error("Get exchange rate error:", error);
    return null;
  }
}

// Convert amount between currencies
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
) {
  try {
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    if (!rate) return null;

    return Math.round(amount * rate * 100) / 100;
  } catch (error) {
    console.error("Currency conversion error:", error);
    return null;
  }
}

// Update exchange rates (from external API)
export async function updateExchangeRates(rates: Record<string, number>) {
  try {
    const updates = Object.entries(rates).map(([pair, rate]) => {
      const [from, to] = pair.split("_");
      return {
        from_currency: from,
        to_currency: to,
        rate,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from("exchange_rates")
      .upsert(updates);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Update exchange rates error:", error);
    throw error;
  }
}

// Get supported currencies
export async function getSupportedCurrencies() {
  try {
    const { data, error } = await supabase
      .from("currencies")
      .select("*");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get currencies error:", error);
    return [];
  }
}

export default {
  getExchangeRate,
  convertCurrency,
  updateExchangeRates,
  getSupportedCurrencies,
};
