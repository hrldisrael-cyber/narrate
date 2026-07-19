const API = "http://localhost:3000";

// Replace this with your own user ID if you create another account.
const USER_ID = "c16e1a62-baa9-4848-b175-46d4c4e7f123";

let activeCommentPostId = null;
let allMarkets = [];
let currentMarketFilter = "all";
let activeTokenId = null;
let activeTokenSymbol = null;
let activeTokenName = null;

/* =========================================================
   PAGE NAVIGATION (no reloads)
========================================================= */
function goToPage(page, navEl) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const target = navEl || document.querySelector(`.nav-item[data-page="${page}"]`);
    if (target) target.classList.add("active");

    if (page === "markets" && allMarkets.length === 0) {
        loadMarkets();
    }

    if (page === "profile") {
        loadPortfolio();
    }
}

/* =========================================================
   FEED
========================================================= */
async function loadFeed() {
    const res = await fetch(`${API}/posts?user_id=${USER_ID}`);
    const posts = await res.json();

    const feed = document.getElementById("feed");
    feed.innerHTML = "";

    posts.forEach(post => {
        const initial = post.users?.username?.[0]?.toUpperCase() ?? "?";

        feed.innerHTML += `
            <div class="post">
                <div class="post-header">
                    <div class="user">
                        <div class="avatar">${initial}</div>
                        <div>
                            <div class="username">@${post.users?.username ?? "unknown"}</div>
                            <div class="cred">⭐ ${post.users?.cred ?? 0} Cred</div>
                        </div>
                    </div>
                </div>

                <p class="post-content">${escapeHtml(post.content)}</p>

                <div class="post-actions">
                    <span class="action like ${post.liked ? "active" : ""}"
                          onclick="toggleLike('${post.id}', this)">
                        ♥ <span class="like-count">${post.like_count}</span>
                    </span>
                    <span class="action" onclick="openCommentModal('${post.id}')">
                        💬 <span class="comment-count">${post.comment_count}</span>
                    </span>
                    <span class="action">⚔️ Challenge</span>
                </div>
            </div>
        `;
    });
}

// Create post
async function createPost() {
    const content = document.getElementById("content").value.trim();

    if (!content) return;

    await fetch(`${API}/posts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: USER_ID,
            content
        })
    });

    document.getElementById("content").value = "";

    loadFeed();
}

/* =========================================================
   LIKES
========================================================= */
async function toggleLike(postId, el) {
    // optimistic update
    const countEl = el.querySelector(".like-count");
    const wasActive = el.classList.contains("active");
    const currentCount = parseInt(countEl.textContent, 10) || 0;

    el.classList.toggle("active");
    countEl.textContent = wasActive ? currentCount - 1 : currentCount + 1;

    try {
        const res = await fetch(`${API}/likes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId, user_id: USER_ID })
        });

        if (!res.ok) throw new Error("like failed");
    } catch (err) {
        // revert on failure
        el.classList.toggle("active");
        countEl.textContent = currentCount;
    }
}

/* =========================================================
   COMMENTS
========================================================= */
function openCommentModal(postId) {
    activeCommentPostId = postId;
    document.getElementById("commentModal").classList.add("open");
    loadComments(postId);
}

function closeCommentModal() {
    document.getElementById("commentModal").classList.remove("open");
    activeCommentPostId = null;
}

async function loadComments(postId) {
    const list = document.getElementById("commentList");
    list.innerHTML = `<div class="comment-loading">Loading...</div>`;

    const res = await fetch(`${API}/comments/${postId}`);
    const comments = await res.json();

    list.innerHTML = "";

    if (comments.length === 0) {
        list.innerHTML = `<div class="comment-empty">No comments yet. Be the first.</div>`;
        return;
    }

    comments.forEach(c => {
        list.innerHTML += `
            <div class="comment">
                <span class="comment-username">@${c.users?.username ?? "unknown"}</span>
                <span class="comment-content">${escapeHtml(c.content)}</span>
            </div>
        `;
    });
}

async function submitComment() {
    const input = document.getElementById("commentInput");
    const content = input.value.trim();

    if (!content || !activeCommentPostId) return;

    try {
        const res = await fetch(`${API}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                post_id: activeCommentPostId,
                user_id: USER_ID,
                content
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Comment failed to save", "error");
            return;
        }

        input.value = "";
        loadComments(activeCommentPostId);
        loadFeed(); // refresh comment counts in background
    } catch (err) {
        showToast("Something went wrong. Check your connection.", "error");
    }
}

/* =========================================================
   MARKETS
========================================================= */
async function loadMarkets() {
    const list = document.getElementById("marketList");
    list.innerHTML = `<div class="comment-loading">Loading markets...</div>`;

    try {
        const res = await fetch(`${API}/tokens?limit=150`);
        const data = await res.json();

        if (!res.ok) {
            list.innerHTML = `<div class="comment-empty">Server error: ${escapeHtml(data.error || "unknown error")}</div>`;
            return;
        }

        allMarkets = data;
        renderMarkets();
    } catch (err) {
        list.innerHTML = `<div class="comment-empty">Network error: ${escapeHtml(err.message)}</div>`;
    }
}

function setMarketFilter(filter, el) {
    currentMarketFilter = filter;
    document.querySelectorAll(".market-tab").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
    renderMarkets();
}

function filterMarkets() {
    renderMarkets();
}

function renderMarkets() {
    const list = document.getElementById("marketList");
    const query = document.getElementById("marketSearch").value.trim().toLowerCase();

    let coins = [...allMarkets];

    if (currentMarketFilter === "gainers") {
        coins = coins
            .filter(c => c.price_change_percentage_24h > 0)
            .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    } else if (currentMarketFilter === "losers") {
        coins = coins
            .filter(c => c.price_change_percentage_24h < 0)
            .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    } else if (currentMarketFilter === "trending") {
        coins = coins
            .slice()
            .sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0))
            .slice(0, 20);
    }

    if (query) {
        coins = coins.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.symbol.toLowerCase().includes(query)
        );
    }

    list.innerHTML = "";

    coins.forEach(coin => {
        const changeClass = coin.price_change_percentage_24h >= 0 ? "up" : "down";
        const changeSign = coin.price_change_percentage_24h >= 0 ? "+" : "";

        list.innerHTML += `
            <div class="token-row" onclick="openTokenModal('${coin.id}')">
                <img class="token-icon" src="${coin.image}" alt="${coin.symbol}"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="token-icon-fallback">${coin.symbol.charAt(0)}</div>
                <div class="token-info">
                    <div class="token-name">${coin.name}</div>
                    <div class="token-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
                <div class="token-price-block">
                    <div class="token-price">$${formatPrice(coin.current_price)}</div>
                    <div class="token-change ${changeClass}">${changeSign}${coin.price_change_percentage_24h?.toFixed(2)}%</div>
                </div>
            </div>
        `;
    });
}

async function openTokenModal(id) {
    const coin = allMarkets.find(c => c.id === id);
    if (!coin) return;

    activeTokenId = coin.id;
    activeTokenSymbol = coin.symbol;
    activeTokenName = coin.name;

    document.getElementById("tokenModalTitle").textContent = `${coin.name} / ${coin.target}`;

    document.getElementById("tokenStats").innerHTML = `
        <div class="stat-row"><span>Price</span><span>$${formatPrice(coin.current_price)}</span></div>
        <div class="stat-row"><span>24h Volume</span><span>$${formatLargeNumber(coin.total_volume)}</span></div>
        <div class="stat-row"><span>24h High</span><span>$${formatPrice(coin.high_24h)}</span></div>
        <div class="stat-row"><span>24h Low</span><span>$${formatPrice(coin.low_24h)}</span></div>
    `;

    document.getElementById("tokenModal").classList.add("open");

    // Guaranteed match: OKX is both our data source and our chart source,
    // so the symbol always exists — no guessing, no fallback needed.
    const tvSymbol = `OKX:${coin.base}${coin.target}`;
    loadTradingViewWidget(tvSymbol);
}

function closeTokenModal() {
    document.getElementById("tokenModal").classList.remove("open");
    document.getElementById("tokenModalBox").classList.remove("fullscreen");
}

function toggleChartFullscreen() {
    document.getElementById("tokenModalBox").classList.toggle("fullscreen");
}

function loadTradingViewWidget(symbol) {
    const container = document.getElementById("tvWidgetContainer");
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify({
        autosize: true,
        symbol: symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        allow_symbol_change: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        calendar: false,
        support_host: "https://www.tradingview.com"
    });

    container.appendChild(script);
}

/* =========================================================
   TOAST NOTIFICATIONS
========================================================= */
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/* =========================================================
   TRADING (paper trading — market orders only for now)
========================================================= */
async function buyToken() {
    const amountInput = document.getElementById("tradeAmount");
    const amountUsd = parseFloat(amountInput.value);

    if (!amountUsd || amountUsd <= 0) {
        showToast("Enter a valid USD amount", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/portfolio/${USER_ID}/buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token_id: activeTokenId,
                symbol: activeTokenSymbol,
                name: activeTokenName,
                amount_usd: amountUsd
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Buy failed", "error");
            return;
        }

        showToast(`${activeTokenSymbol.toUpperCase()} bought · $${amountUsd.toFixed(2)}`, "success");
        amountInput.value = "";
    } catch (err) {
        showToast("Something went wrong. Check your connection.", "error");
    }
}

async function sellToken() {
    try {
        const res = await fetch(`${API}/portfolio/${USER_ID}/sell`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token_id: activeTokenId,
                symbol: activeTokenSymbol,
                percent: 100
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Sell failed", "error");
            return;
        }

        showToast(`${activeTokenSymbol.toUpperCase()} sold · $${data.proceeds.toFixed(2)}`, "success");
    } catch (err) {
        showToast("Something went wrong. Check your connection.", "error");
    }
}

/* =========================================================
   PORTFOLIO
========================================================= */
async function loadPortfolio() {
    const res = await fetch(`${API}/portfolio/${USER_ID}`);
    const data = await res.json();

    document.getElementById("pfBalance").textContent = `$${data.balance.toFixed(2)}`;
    document.getElementById("pfEquity").textContent = `$${data.equity.toFixed(2)}`;

    const pnlEl = document.getElementById("pfPnl");
    pnlEl.textContent = `${data.total_pnl >= 0 ? "+" : ""}$${data.total_pnl.toFixed(2)}`;
    pnlEl.className = data.total_pnl >= 0 ? "pnl-up" : "pnl-down";

    const posList = document.getElementById("positionsList");
    posList.innerHTML = "";

    if (data.positions.length === 0) {
        posList.innerHTML = `<div class="comment-empty">No open positions yet. Buy a token from Markets to get started.</div>`;
    } else {
        data.positions.forEach(p => {
            const pnlClass = p.pnl >= 0 ? "pnl-up" : "pnl-down";

            posList.innerHTML += `
                <div class="position-row">
                    <div>
                        <div class="token-name">${p.symbol.toUpperCase()}</div>
                        <div class="token-symbol">${p.amount.toFixed(6)} @ $${formatPrice(p.entry_price)}</div>
                    </div>
                    <div class="token-price-block">
                        <div class="token-price">$${p.value.toFixed(2)}</div>
                        <div class="${pnlClass}">${p.pnl >= 0 ? "+" : ""}$${p.pnl.toFixed(2)} (${p.pnl_percent.toFixed(2)}%)</div>
                    </div>
                </div>
            `;
        });
    }

    const historyList = document.getElementById("tradeHistory");
    historyList.innerHTML = "";

    if (data.trades.length === 0) {
        historyList.innerHTML = `<div class="comment-empty">No trades yet.</div>`;
    } else {
        data.trades.forEach(t => {
            historyList.innerHTML += `
                <div class="trade-row">
                    <span class="trade-side ${t.side}">${t.side.toUpperCase()}</span>
                    <span>${t.amount.toFixed(6)} ${t.symbol.toUpperCase()}</span>
                    <span>$${formatPrice(t.price)}</span>
                </div>
            `;
        });
    }
}

/* =========================================================
   HELPERS
========================================================= */
function formatPrice(value) {
    if (value == null) return "0";
    if (value < 1) return value.toFixed(6);
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatLargeNumber(value) {
    if (value == null) return "N/A";
    if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
    if (value >= 1e3) return (value / 1e3).toFixed(2) + "K";
    return value.toString();
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// Load feed when page opens
loadFeed();
