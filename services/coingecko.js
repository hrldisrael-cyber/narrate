const axios = require("axios");

const BASE_URL = "https://api.coingecko.com/api/v3";

// List of coins with live price, market cap, FDV, volume, 24h change
async function getMarkets({ page = 1, perPage = 100 } = {}) {
    const response = await axios.get(`${BASE_URL}/coins/markets`, {
        params: {
            vs_currency: "usd",
            order: "market_cap_desc",
            per_page: perPage,
            page,
            sparkline: false,
            price_change_percentage: "24h"
        }
    });

    return response.data;
}

// Full detail for a single token (used for the token page / modal)
async function getTokenDetail(id) {
    const response = await axios.get(`${BASE_URL}/coins/${id}`, {
        params: {
            localization: false,
            tickers: true,
            market_data: true,
            community_data: false,
            developer_data: false
        }
    });

    return response.data;
}

// Historical price data for charting (days: 1, 7, 30, 90, 365, "max")
async function getTokenChart(id, days = 7) {
    const response = await axios.get(`${BASE_URL}/coins/${id}/market_chart`, {
        params: { vs_currency: "usd", days }
    });

    return response.data; // { prices, market_caps, total_volumes }
}

// Batch live price lookup for multiple token ids at once (used for portfolio positions)
async function getPrices(ids) {
    const response = await axios.get(`${BASE_URL}/simple/price`, {
        params: {
            ids: ids.join(","),
            vs_currencies: "usd"
        }
    });

    return response.data; // { [id]: { usd: price } }
}

module.exports = {
    getMarkets,
    getTokenDetail,
    getTokenChart,
    getPrices
};
