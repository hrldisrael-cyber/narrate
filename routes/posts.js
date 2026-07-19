const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// Create a post
router.post("/", async (req, res) => {
    const { user_id, content } = req.body;

    const { data, error } = await supabase
        .from("posts")
        .insert([
            {
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

// Get all posts
router.get("/", async (req, res) => {
    const { user_id } = req.query;

    const { data, error } = await supabase
        .from("posts")
        .select(`
    id,
    content,
    created_at,
    users:users!posts_user_id_fkey (
        username,
        cred
    ),
    likes ( count ),
    comments ( count )
`)
    .order("created_at", { ascending: false });
    if (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    let likedPostIds = new Set();

    if (user_id) {
        const { data: userLikes } = await supabase
            .from("likes")
            .select("post_id")
            .eq("user_id", user_id);

        if (userLikes) {
            likedPostIds = new Set(userLikes.map(l => l.post_id));
        }
    }

    const posts = data.map(post => ({
        ...post,
        like_count: post.likes?.[0]?.count ?? 0,
        comment_count: post.comments?.[0]?.count ?? 0,
        liked: likedPostIds.has(post.id)
    }));

    res.json(posts);
});

module.exports = router;
