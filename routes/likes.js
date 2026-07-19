const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// Toggle like on a post (like if not liked, unlike if already liked)
router.post("/", async (req, res) => {
    const { post_id, user_id } = req.body;

    if (!post_id || !user_id) {
        return res.status(400).json({
            error: "post_id and user_id are required"
        });
    }

    const { data: existing, error: findError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .maybeSingle();

    if (findError) {
        return res.status(400).json({
            error: findError.message
        });
    }

    if (existing) {
        const { error: deleteError } = await supabase
            .from("likes")
            .delete()
            .eq("id", existing.id);

        if (deleteError) {
            return res.status(400).json({
                error: deleteError.message
            });
        }

        return res.json({ liked: false });
    }

    const { error: insertError } = await supabase
        .from("likes")
        .insert([{ post_id, user_id }]);

    if (insertError) {
        return res.status(400).json({
            error: insertError.message
        });
    }

    res.json({ liked: true });
});

module.exports = router;
