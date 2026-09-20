// ===== GLOBALS =====
let currentUser = null;
let bugs = JSON.parse(localStorage.getItem("bugs") || "[]");
let captchaAnswer = null;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    const onLoginPage = !!document.getElementById("loginForm");

    if (onLoginPage) {
        setupCaptcha();
    } else {
        enforceAuth();
        initDashboard();
    }
});

// ===== AUTH =====
function enforceAuth() {
    if (localStorage.getItem("logged_in") !== "true") {
        window.location.href = "login.html";
        return;
    }
}

// ===== CAPTCHA =====
function setupCaptcha() {
    captchaAnswer = Math.floor(Math.random() * 10) + 1;
    const el = document.getElementById("captchaText");
    el.textContent = `What is ${captchaAnswer} + 2?`;
}

// ===== LOGIN (PLAIN PASSWORD) =====
const storedUser = "admin";
const storedPass = "1234";

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const captchaInput = Number(document.getElementById("captcha").value);
    const msgEl = document.getElementById("msg");

    msgEl.textContent = "";

    if (captchaInput !== captchaAnswer + 2) {
        msgEl.textContent = "CAPTCHA incorrect.";
        return;
    }

    if (username === storedUser && password === storedPass) {
        localStorage.setItem("logged_in", "true");
        localStorage.setItem("username", username);
        localStorage.setItem("role", role);
        window.location.href = "index.html";
    } else {
        msgEl.textContent = "Invalid username or password.";
    }
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem("logged_in");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}

// ===== DASHBOARD INIT =====
function initDashboard() {
    currentUser = {
        username: localStorage.getItem("username"),
        role: localStorage.getItem("role")
    };

    const userEl = document.getElementById("currentUser");
    userEl.textContent = `${currentUser.username} (${currentUser.role})`;

    renderBugs();
    updateDashboard();
}

// ===== SANITIZE =====
function sanitize(text) {
    return text.replace(/[<>]/g, "");
}

// ===== BUG CREATION =====
function addBug() {
    const title = sanitize(document.getElementById("bugTitle").value.trim());
    const description = sanitize(document.getElementById("bugDescription").value.trim());
    const priority = document.getElementById("bugPriority").value;
    const severity = document.getElementById("bugSeverity").value;

    if (!title) {
        alert("Bug title is required.");
        return;
    }

    const bug = {
        id: Date.now(),
        title,
        description,
        priority,
        severity,
        status: "Open",
        reporter: currentUser.username,
        comments: []
    };

    bugs.push(bug);
    localStorage.setItem("bugs", JSON.stringify(bugs));

    document.getElementById("bugTitle").value = "";
    document.getElementById("bugDescription").value = "";
    document.getElementById("bugPriority").value = "Low";
    document.getElementById("bugSeverity").value = "Minor";

    renderBugs();
    updateDashboard();
}

// ===== RENDER BUGS =====
function renderBugs() {
    const list = document.getElementById("bugList");
    list.innerHTML = "";

    bugs.forEach(bug => {
        const div = document.createElement("div");
        div.className = "bug" + (bug.status === "Resolved" ? " resolved" : "");

        div.innerHTML = `
            <div class="bug-header">
                <div class="bug-title">${bug.title}</div>
                <div class="badges">
                    <span class="badge">${bug.priority}</span>
                    <span class="badge">${bug.severity}</span>
                    <span class="badge">${bug.status}</span>
                </div>
            </div>
            <div class="bug-body">
                <p>${bug.description || "<i>No description</i>"}</p>
                <p><small>Reported by: ${bug.reporter}</small></p>
            </div>
            <div class="comments">
                <strong>Comments:</strong>
                ${bug.comments.length
                    ? bug.comments.map(c => `
                        <div class="comment">
                            <div class="comment-author">${c.author}</div>
                            <div>${c.text}</div>
                        </div>
                    `).join("")
                    : "<p><i>No comments yet</i></p>"
                }
                <div class="comment-input">
                    <input type="text" placeholder="Add a comment"
                        onkeydown="if(event.key==='Enter') addComment(${bug.id}, this.value, this)">
                    <button onclick="addComment(${bug.id}, this.previousElementSibling.value, this.previousElementSibling)">Post</button>
                </div>
            </div>
            <div class="bug-footer">
                <button onclick="resolveBug(${bug.id})">Resolve</button>
                <button onclick="deleteBug(${bug.id})">Delete</button>
            </div>
        `;

        list.appendChild(div);
    });
}

// ===== BUG ACTIONS =====
function resolveBug(id) {
    const bug = bugs.find(b => b.id === id);
    bug.status = "Resolved";
    localStorage.setItem("bugs", JSON.stringify(bugs));
    renderBugs();
    updateDashboard();
}

function deleteBug(id) {
    bugs = bugs.filter(b => b.id !== id);
    localStorage.setItem("bugs", JSON.stringify(bugs));
    renderBugs();
    updateDashboard();
}

// ===== COMMENTS =====
function addComment(id, text, inputEl) {
    const trimmed = sanitize((text || "").trim());
    if (!trimmed) return;

    const bug = bugs.find(b => b.id === id);
    bug.comments.push({
        author: currentUser.username,
        text: trimmed
    });

    localStorage.setItem("bugs", JSON.stringify(bugs));
    inputEl.value = "";
    renderBugs();
}

// ===== DASHBOARD =====
function updateDashboard() {
    document.getElementById("totalBugs").textContent = bugs.length;
    document.getElementById("openBugs").textContent = bugs.filter(b => b.status === "Open").length;
    document.getElementById("resolvedBugs").textContent = bugs.filter(b => b.status === "Resolved").length;

    document.getElementById("lowPriority").textContent = bugs.filter(b => b.priority === "Low").length;
    document.getElementById("mediumPriority").textContent = bugs.filter(b => b.priority === "Medium").length;
    document.getElementById("highPriority").textContent = bugs.filter(b => b.priority === "High").length;

    document.getElementById("minorSeverity").textContent = bugs.filter(b => b.severity === "Minor").length;
    document.getElementById("majorSeverity").textContent = bugs.filter(b => b.severity === "Major").length;
    document.getElementById("criticalSeverity").textContent = bugs.filter(b => b.severity === "Critical").length;
}
