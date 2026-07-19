const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// Buy
router.post("/buy", async (req, res) => {

    const {
        user_id,
        token,
        symbol,
        quantity,
        price
    } = req.body;

    const total = quantity * price;

    const { data: portfolio } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user_id)
        .single();

    if (!portfolio)
        return res.status(404).json({
            error: "Portfolio not found"
        });

    if (portfolio.balance < total)
        return res.status(400).json({
            error: "Insufficient balance"
        });

    await supabase
        .from("paper_trades")
        .insert([{
            user_id,
            token,
            symbol,
            side: "BUY",
            quantity,
            price,
            total
        }]);

    res.json({
        success: true
    });

});

module.exports = router;
