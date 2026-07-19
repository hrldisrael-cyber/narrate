const axios = require("axios");

async function getTokens() {
    const response = await axios.get(
        "https://api.dexscreener.com/token-profiles/latest/v1"
    );

    return response.data;
}

module.exports = {
    getTokens,
};
