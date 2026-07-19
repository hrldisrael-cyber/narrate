const express = require("express");
const router = express.Router();

const { getMarkets, getTokenDetail, getTokenChart } = require("../services/coingecko");

// GET /tokens?page=1&perPage=100  -> market list (search/sort handled client-side)
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 100;

        const markets = await getMarkets({ page, perPage });

        res.json(markets);
    } catch (err) {
        console.error(err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// GET /tokens/:id  -> full detail for a single token
router.get("/:id", async (req, res) => {
    try {
        const detail = await getTokenDetail(req.params.id);

        res.json(detail);
    } catch (err) {
        console.error(err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// GET /tokens/:id/chart?days=7  -> price history for charting
router.get("/:id/chart", async (req, res) => {
    try {
        const days = req.query.days || 7;

        const chart = await getTokenChart(req.params.id, days);

        res.json(chart);
    } catch (err) {
        console.error(err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;
