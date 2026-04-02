import { supabase } from "../app.js";

// ── Toast (reuse pattern from ScoutEntry) ────────────────────────
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

// ── Main export ──────────────────────────────────────────────────
// onSuccess: callback invoked after a successful sign-in/sign-up
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

                <!-- Tab switcher -->
                <div class="auth-tabs" id="auth-tabs">
                    <button class="auth-tab active" data-tab="signin">Sign In</button>
                    <button class="auth-tab" data-tab="signup">Sign Up</button>
                </div>

                <!-- Sign In form -->
                <div class="auth-form-wrap" id="tab-signin">
                    <div class="auth-field">
                        <label class="auth-label" for="signin-email">Email</label>
                        <input class="auth-input" type="email" id="signin-email" placeholder="you@team7250.com" autocomplete="email">
                    </div>
                    <div class="auth-field">
                        <label class="auth-label" for="signin-password">Password</label>
                        <input class="auth-input" type="password" id="signin-password" placeholder="••••••••" autocomplete="current-password">
                    </div>
                    <button class="auth-submit" id="signin-btn" type="button">
                        <span id="signin-label">Sign In</span>
                    </button>
                </div>

                <!-- Sign Up form -->
                <div class="auth-form-wrap hidden" id="tab-signup">
                    <div class="auth-field">
                        <label class="auth-label" for="signup-email">Email</label>
                        <input class="auth-input" type="email" id="signup-email" placeholder="you@team7250.com" autocomplete="email">
                    </div>
                    <div class="auth-field">
                        <label class="auth-label" for="signup-password">Password</label>
                        <input class="auth-input" type="password" id="signup-password" placeholder="Min. 6 characters" autocomplete="new-password">
                    </div>
                    <div class="auth-field">
                        <label class="auth-label" for="signup-confirm">Confirm Password</label>
                        <input class="auth-input" type="password" id="signup-confirm" placeholder="••••••••" autocomplete="new-password">
                    </div>
                    <button class="auth-submit" id="signup-btn" type="button">
                        <span id="signup-label">Create Account</span>
                    </button>
                </div>

            </div>
        </div>
    `;

    setTimeout(() => {
        // ── Tab switching ──────────────────────────────────────
        document.querySelectorAll(".auth-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                const target = tab.dataset.tab;
                document.getElementById("tab-signin").classList.toggle("hidden", target !== "signin");
                document.getElementById("tab-signup").classList.toggle("hidden", target !== "signup");
            });
        });

        // ── Sign In ────────────────────────────────────────────
        document.getElementById("signin-btn")?.addEventListener("click", async () => {
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
                showToast("Signed in!", "success");
                onSuccess?.();
            }
        });

        // ── Sign Up ────────────────────────────────────────────
        document.getElementById("signup-btn")?.addEventListener("click", async () => {
            const email    = document.getElementById("signup-email").value.trim();
            const password = document.getElementById("signup-password").value;
            const confirm  = document.getElementById("signup-confirm").value;

            if (!email || !password || !confirm) { showToast("Please fill in all fields.", "error"); return; }
            if (password !== confirm)             { showToast("Passwords do not match.", "error"); return; }
            if (password.length < 6)              { showToast("Password must be at least 6 characters.", "error"); return; }

            const btn = document.getElementById("signup-btn");
            const lbl = document.getElementById("signup-label");
            btn.disabled = true; lbl.textContent = "Creating account…";

            const { error } = await supabase.auth.signUp({ email, password });

            if (error) {
                showToast(error.message, "error");
                btn.disabled = false; lbl.textContent = "Create Account";
            } else {
                showToast("Account created! Check your email to confirm, then sign in.", "success");
                // Switch to sign-in tab
                document.querySelector('[data-tab="signin"]').click();
                btn.disabled = false; lbl.textContent = "Create Account";
            }
        });

        // ── Allow Enter key to submit ──────────────────────────
        document.getElementById("tab-signin")?.addEventListener("keydown", e => {
            if (e.key === "Enter") document.getElementById("signin-btn").click();
        });
        document.getElementById("tab-signup")?.addEventListener("keydown", e => {
            if (e.key === "Enter") document.getElementById("signup-btn").click();
        });

    }, 0);

    return html;
}