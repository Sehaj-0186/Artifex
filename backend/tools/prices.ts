import { z } from "zod";

export const getEthPriceUsd = async (): Promise<string> => {
  const fetchedPrice = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).catch((error) => {
    throw new Error("Error fetching data from the tx service:" + error);
  });

  const ethPriceData = await fetchedPrice.json();
  const ethPriceUsd = ethPriceData?.ethereum?.usd;

  // Format the price with 2 decimal places and thousands separators
  return `The current price of 1 ETH is $${Number(ethPriceUsd).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} USD`;
};

export const getEthPriceUsdMetadata = {
  name: "getEthPriceUsd",
  description: "Call to get the price of ETH in USD.",
  schema: z.object({}),
};
