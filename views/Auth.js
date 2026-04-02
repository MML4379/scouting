import { supabase } from "../app.js";

function showToast(msg, type = "success") {
    let toast = document.getElementById("auth-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "auth-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `scout-toast ${type} visible`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 4000);
}

export default function Auth({ onSuccess } = {}) {
    const html = `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-brand">
                    <span class="auth-brand-number">7250</span>
                    <span class="auth-brand-dot">·</span>
                    <span class="auth-brand-name">ScoutNet</span>
                </div>
                <p class="auth-tagline">Sign in to submit scouting data</p>

                <div class="auth-field">
                    <label class="auth-label" for="signin-email">Email</label>
                    <input class="auth-input" type="email" id="signin-email" placeholder="user@oscodaschools.org" autocomplete="email">
                </div>
                <div class="auth-field">
                    <label class="auth-label" for="signin-password">Password</label>
                    <input class="auth-input" type="password" id="signin-password" placeholder="••••••••" autocomplete="current-password">
                </div>
                <button class="auth-submit" id="signin-btn" type="button">
                    <span id="signin-label">Sign In</span>
                </button>
            </div>
        </div>
    `;

    setTimeout(() => {
        const attempt = async () => {
            const email    = document.getElementById("signin-email").value.trim();
            const password = document.getElementById("signin-password").value;
            if (!email || !password) { showToast("Please fill in all fields.", "error"); return; }

            const btn = document.getElementById("signin-btn");
            const lbl = document.getElementById("signin-label");
            btn.disabled = true; lbl.textContent = "Signing in…";

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                showToast(error.message, "error");
                btn.disabled = false; lbl.textContent = "Sign In";
            } else {
                onSuccess?.();
            }
        };

        document.getElementById("signin-btn")?.addEventListener("click", attempt);

        document.getElementById("signin-password")?.addEventListener("keydown", e => {
            if (e.key === "Enter") attempt();
        });
        document.getElementById("signin-email")?.addEventListener("keydown", e => {
            if (e.key === "Enter") document.getElementById("signin-password").focus();
        });
    }, 0);

    return html;
}