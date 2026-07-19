require("dotenv").config();

const express = require("express");

const tokenRoutes = require("./routes/tokens");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const likeRoutes = require("./routes/likes");
const portfolioRoutes = require("./routes/portfolio");
const supabase = require("./services/supabase");

const app = express();

app.use(express.json());
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/splash.html");
});
app.use(express.static("public"));

app.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*");

        res.json({
            status: "Narrate API Running 🚀",
            database: error ? error.message : "Connected",
            users: data
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

app.use("/tokens", tokenRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);
app.use("/likes", likeRoutes);
app.use("/portfolio", portfolioRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
