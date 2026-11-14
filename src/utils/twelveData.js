import { MarketDataApi, CreateConfig } from "@twelvedata/twelvedata-node";
import { ApiError } from "./ApiError.js";

const config = CreateConfig(process.env.TWELVEDATA_API_KEY);
const api = new MarketDataApi(config);

export async function getStockPrice(symbol) {
  const response = await api.getPrice({ symbol });

  const price = Number(response.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new ApiError(500,`Invalid stock price for ${symbol}`);
  }

  return price;
}



