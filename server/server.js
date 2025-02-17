
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const session = require("express-session");

const app = express();
app.use(cors());
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

const DISCORD_CLIENT_ID = "YOUR_CLIENT_ID";
const DISCORD_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3000/auth/discord/callback";

// Redirect to Discord OAuth
app.get("/auth/discord", (req, res) => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(authUrl);
});

// Handle OAuth Callback
app.get("/auth/discord/callback", async (req, res) => {
    const code = req.query.code;
    try {
        const tokenResponse = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: REDIRECT_URI
        }).toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        req.session.user = userResponse.data;
        res.redirect("/tasks");
    } catch (error) {
        res.status(500).send("Error logging in with Discord.");
    }
});

app.get("/tasks", (req, res) => {
    if (!req.session.user) return res.redirect("/auth/discord");
    res.send(`Welcome, ${req.session.user.username}! Complete your tasks.`);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
