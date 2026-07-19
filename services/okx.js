const axios = require("axios");

const BASE_URL = "https://www.okx.com";

// Live tickers for every {quote}-quoted spot pair on OKX. Public endpoint —
// no API key needed. Sorted by 24h volume since OKX doesn't expose market
// cap (that's aggregator data, not exchange data).
async function getMarkets({ quote = "USDT", limit = 150 } = {}) {
    const response = await axios.get(`${BASE_URL}/api/v5/market/tickers`, {
        params: { instType: "SPOT" }
    });

    if (response.data?.code !== "0") {
        throw new Error(`OKX API error: ${response.data?.msg || "unknown OKX error"} (code ${response.data?.code})`);
    }

    const tickers = response.data?.data || [];

    return tickers
        .filter(t => t.instId.endsWith(`-${quote}`) && parseFloat(t.last) > 0)
        .map(t => {
            const [base, target] = t.instId.split("-");
            const last = parseFloat(t.last);
            const open24h = parseFloat(t.open24h);
            const changePercent = open24h > 0 ? ((last - open24h) / open24h) * 100 : 0;

            return {
                id: t.instId,
                base,
                target,
                symbol: base,
                name: base,
                current_price: last,
                high_24h: parseFloat(t.high24h),
                low_24h: parseFloat(t.low24h),
                total_volume: parseFloat(t.volCcy24h),
                price_change_percentage_24h: changePercent,
                image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${base.toLowerCase()}.png`
            };
        })
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, limit);
}

// Single instrument's live ticker
async function getTokenDetail(instId) {
    const response = await axios.get(`${BASE_URL}/api/v5/market/tickers`, {
        params: { instType: "SPOT" }
    });

    const tickers = response.data?.data || [];

    return tickers.find(t => t.instId === instId) || null;
}

// Historical candles for charting.
// bar: 1m, 5m, 15m, 1H, 4H, 1D, 1W (OKX format)
async function getTokenChart(instId, bar = "1D", limit = 200) {
    const response = await axios.get(`${BASE_URL}/api/v5/market/candles`, {
        params: { instId, bar, limit }
    });

    // Each candle: [ts, open, high, low, close, vol, volCcy, volCcyQuote, confirm]
    return response.data?.data || [];
}

// Batch live price lookup for multiple instIds at once (used for portfolio positions)
async function getPrices(instIds) {
    const response = await axios.get(`${BASE_URL}/api/v5/market/tickers`, {
        params: { instType: "SPOT" }
    });

    const tickers = response.data?.data || [];
    const map = {};

    instIds.forEach(id => {
        const ticker = tickers.find(t => t.instId === id);
        if (ticker) {
            map[id] = { usd: parseFloat(ticker.last) };
        }
    });

    return map;
}

module.exports = {
    getMarkets,
    getTokenDetail,
    getTokenChart,
    getPrices
};
