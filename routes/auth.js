const express = require("express");
const router = express.Router();

const supabase = require("../services/auth");

router.post("/signup", async (req, res) => {

    const {
        email,
        password,
        username
    } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error)
        return res.status(400).json({
            error: error.message
        });

    await supabase
        .from("profiles")
        .insert([
            {
                id: data.user.id,
                username,
                display_name: username
            }
        ]);

    res.json({
        success: true,
        user: data.user
    });

});

router.post("/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password
        });

    if (error)
        return res.status(400).json({
            error: error.message
        });

    res.json(data);

});

module.exports = router;
