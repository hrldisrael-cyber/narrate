const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// Get comments for a post
router.get("/:postId", async (req, res) => {

    const { postId } = req.params;

    const { data, error } = await supabase
        .from("comments")
        .select(`
            id,
            content,
            created_at,
            users(username, cred)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    res.json(data);

});

// Create comment
router.post("/", async (req, res) => {

    const { post_id, user_id, content } = req.body;

    const { data, error } = await supabase
        .from("comments")
        .insert([
            {
                post_id,
                user_id,
                content
            }
        ])
        .select();

    if (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    res.json(data);

});

module.exports = router;
