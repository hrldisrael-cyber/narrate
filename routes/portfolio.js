const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");
const { getPrices } = require("../services/okx");

const STARTING_BALANCE = 10000;

async function ensureWallet(user_id) {
    const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();

    if (data) return data;

    const { data: created, error } = await supabase
        .from("wallets")
        .insert([{ user_id, balance: STARTING_BALANCE }])
        .select()
        .single();

    if (error) throw new Error(error.message);

    return created;
}

// GET /portfolio/:user_id  -> balance, live positions with PnL, trade history
router.get("/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const wallet = await ensureWallet(user_id);

        const { data: positions, error: posError } = await supabase
            .from("positions")
            .select("*")
            .eq("user_id", user_id);

        if (posError) throw new Error(posError.message);

        let livePositions = [];
        let positionsValue = 0;
        let totalPnl = 0;

        if (positions.length > 0) {
            const ids = [...new Set(positions.map(p => p.token_id))];
            const prices = await getPrices(ids);

            livePositions = positions.map(p => {
                const currentPrice = prices[p.token_id]?.usd ?? p.entry_price;
                const value = p.amount * currentPrice;
                const cost = p.amount * p.entry_price;
                const pnl = value - cost;
                const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

                positionsValue += value;
                totalPnl += pnl;

                return {
                    ...p,
                    current_price: currentPrice,
                    value,
                    pnl,
                    pnl_percent: pnlPercent
                };
            });
        }

        const { data: trades, error: tradeError } = await supabase
            .from("trades")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (tradeError) throw new Error(tradeError.message);

        const equity = wallet.balance + positionsValue;

        res.json({
            balance: wallet.balance,
            positions_value: positionsValue,
            equity,
            total_pnl: totalPnl,
            positions: livePositions,
            trades
        });
    } catch (err) {
        console.error(err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// POST /portfolio/:user_id/buy  -> spend USD to buy a token at the live price
router.post("/:user_id/buy", async (req, res) => {
    try {
        const { user_id } = req.params;
        const { token_id, symbol, name, amount_usd } = req.body;

        if (!token_id || !amount_usd || amount_usd <= 0) {
            return res.status(400).json({
                error: "token_id and a positive amount_usd are required"
            });
        }

        const wallet = await ensureWallet(user_id);

        if (wallet.balance < amount_usd) {
            return res.status(400).json({
                error: "Insufficient balance"
            });
        }

        const prices = await getPrices([token_id]);
        const price = prices[token_id]?.usd;

        if (!price) {
            return res.status(400).json({
                error: "Could not fetch current price for this token"
            });
        }

        const amountBought = amount_usd / price;
        const newBalance = wallet.balance - amount_usd;

        const { error: walletError } = await supabase
            .from("wallets")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("user_id", user_id);

        if (walletError) throw new Error(walletError.message);

        const { data: existing } = await supabase
            .from("positions")
            .select("*")
            .eq("user_id", user_id)
            .eq("token_id", token_id)
            .maybeSingle();

        if (existing) {
            const newAmount = existing.amount + amountBought;
            const newEntryPrice =
                ((existing.amount * existing.entry_price) + (amountBought * price)) / newAmount;

            const { error: updateError } = await supabase
                .from("positions")
                .update({ amount: newAmount, entry_price: newEntryPrice })
                .eq("id", existing.id);

            if (updateError) throw new Error(updateError.message);
        } else {
            const { error: insertError } = await supabase
                .from("positions")
                .insert([{
                    user_id,
                    token_id,
                    symbol,
                    name,
                    amount: amountBought,
                    entry_price: price
                }]);

            if (insertError) throw new Error(insertError.message);
        }

        const { error: tradeError } = await supabase
            .from("trades")
            .insert([{
                user_id,
                token_id,
                symbol,
                side: "buy",
                amount: amountBought,
                price,
                total: amount_usd
            }]);

        if (tradeError) throw new Error(tradeError.message);

        res.json({ success: true, amount_bought: amountBought, price });
    } catch (err) {
        console.error(err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// POST /portfolio/:user_id/sell  -> sell a percentage of a position at the live price
router.post("/:user_id/sell", async (req, res) => {
    try {
        const { user_id } = req.params;
        const { token_id, symbol, percent } = req.body;

        if (!token_id || !percent || percent <= 0 || percent > 100) {
            return res.status(400).json({
                error: "token_id and a percent (1-100) are required"
            });
        }

        const { data: existing, error: posError } = await supabase
            .from("positions")
            .select("*")
            .eq("user_id", user_id)
            .eq("token_id", token_id)
            .maybeSingle();

        if (posError) throw new Error(posError.message);
        if (!existing) {
            return res.status(400).json({
                error: "No open position for this token"
            });
        }

        const prices = await getPrices([token_id]);
        const price = prices[token_id]?.usd;

        if (!price) {
            return res.status(400).json({
                error: "Could not fetch current price for this token"
            });
        }

        const amountToSell = existing.amount * (percent / 100);
        const proceeds = amountToSell * price;
        const remainingAmount = existing.amount - amountToSell;

        const wallet = await ensureWallet(user_id);
        const newBalance = wallet.balance + proceeds;

        const { error: walletError } = await supabase
            .from("wallets")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("user_id", user_id);

        if (walletError) throw new Error(walletError.message);

        if (remainingAmount <= 0.00000001) {
            const { error: deleteError } = await supabase
                .from("positions")
                .delete()
                .eq("id", existing.id);

            if (deleteError) throw new Error(deleteError.message);
        } else {
            const { error: updateError } = await supabase
                .from("positions")
                .update({ amount: remainingAmount })
                .eq("id", existing.id);

            if (updateError) throw new Error(updateError.message);
        }

        const { error: tradeError } = await supabase
            .from("trades")
            .insert([{
                user_id,
                token_id,
                symbol,
                side: "sell",
                amount: amountToSell,
                price,
                total: proceeds
            }]);

        if (tradeError) throw new Error(tradeError.message);

        res.json({ success: true, amount_sold: amountToSell, proceeds, price });
    } catch (err) {
        console.error(err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;
