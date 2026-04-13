import { supabase } from "../app.js";

export default function Auth({ onSuccess } = {}) {
    if (document.getElementById("auth-modal-backdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "auth-modal-backdrop";
    backdrop.className = "modal-backdrop open";
    backdrop.style.zIndex = "1000";

    backdrop.innerHTML = `
        <div class="auth-card" role="dialog" style="position: relative; z-index: 1001; margin: auto;">
            <div class="auth-brand">
                <span class="auth-brand-number">Team 7250</span>
            </div>
            <p class="auth-tagline">Sign in to view and submit scouting data.</p>
            <div class="auth-field">
                <label class="auth-label" for="signin-email">Email</label>
                <input class="auth-input" type="email" id="signin-email" placeholder="user@oscodaschools.org">
            </div>
            <div class="auth-field">
                <label class="auth-label" for="signin-password">Password</label>
                <input class="auth-input" type="password" id="signin-password" placeholder="••••••••">
            </div>
            <button class="auth-submit" id="signin-btn" type="button">
                <span id="signin-label">Sign In</span>
            </button>
        </div>
    `;
    document.body.appendChild(backdrop);

    const attempt = async () => {
        const email = document.getElementById("signin-email").value.trim();
        const password = document.getElementById("signin-password").value;
        if (!email || !password) return alert("Please fill in all fields.");

        document.getElementById("signin-btn").disabled = true;
        document.getElementById("signin-label").textContent = "Signing in…";

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            alert(error.message);
            document.getElementById("signin-btn").disabled = false;
            document.getElementById("signin-label").textContent = "Sign In";
        } else {
            backdrop.remove();
            onSuccess?.();
        }
    };

    document.getElementById("signin-btn").addEventListener("click", attempt);
    document.getElementById("signin-password").addEventListener("keydown", e => { if (e.key === "Enter") attempt(); });
}