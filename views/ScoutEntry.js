import { supabase } from "../app.js";
import Auth from "./Auth.js";

const TBA_KEY = "0n75QTuNDDuPGQ42UG8GDbxmVlPGtCMnd67fSCcH04AgVMSWwgJPCdtRwjiKYO9b";
const TEAM = "frc7250";
const TBA = "https://www.thebluealliance.com/api/v3";

async function tba(endpoint) {
    const res = await fetch(`${TBA}${endpoint}`, {
        headers: { "X-TBA-Auth-Key": TBA_KEY }
    });
    if (!res.ok) throw new Error(`TBA ${res.status}: ${endpoint}`);
    return res.json();
}

async function fetchEventTeams() {
    const events = await tba(`/team/${TEAM}/events/2026`);
    const allTeams = new Map();
    await Promise.all(events.map(async event => {
        try {
            const teams = await tba(`/event/${event.key}/teams/simple`);
            teams.forEach(t => allTeams.set(t.team_number, t));
        } catch (_) {}
    }));
    return [...allTeams.values()].sort((a, b) => a.team_number - b.team_number);
}

const FIELDS = [
    {
        section: "Autonomous",
        fields: [
            { key: "Auto Coral L1",     label: "Coral L1",     type: "number",   min: 0, default: 0 },
            { key: "Auto Coral L2",     label: "Coral L2",     type: "number",   min: 0, default: 0 },
            { key: "Auto Coral L3",     label: "Coral L3",     type: "number",   min: 0, default: 0 },
            { key: "Auto Coral L4",     label: "Coral L4",     type: "number",   min: 0, default: 0 },
            { key: "Auto Algae Net",    label: "Algae (Net)",  type: "number",   min: 0, default: 0 },
            { key: "Auto Algae Proc",   label: "Algae (Proc)", type: "number",   min: 0, default: 0 },
            { key: "Auto Mobility",     label: "Mobility",     type: "checkbox", default: false },
        ]
    },
    {
        section: "Teleop",
        fields: [
            { key: "Teleop Coral L1",   label: "Coral L1",     type: "number", min: 0, default: 0 },
            { key: "Teleop Coral L2",   label: "Coral L2",     type: "number", min: 0, default: 0 },
            { key: "Teleop Coral L3",   label: "Coral L3",     type: "number", min: 0, default: 0 },
            { key: "Teleop Coral L4",   label: "Coral L4",     type: "number", min: 0, default: 0 },
            { key: "Teleop Algae Net",  label: "Algae (Net)",  type: "number", min: 0, default: 0 },
            { key: "Teleop Algae Proc", label: "Algae (Proc)", type: "number", min: 0, default: 0 },
        ]
    },
    {
        section: "Endgame",
        fields: [
            {
                key: "Climb", label: "Climb Result", type: "select",
                options: ["None", "Park", "Shallow Hang", "Deep Hang"], default: "None"
            },
        ]
    },
    {
        section: "Qualitative",
        fields: [
            {
                key: "Defense Rating", label: "Defense Rating", type: "select",
                options: ["N/A", "1 – Poor", "2 – Below Avg", "3 – Average", "4 – Good", "5 – Excellent"],
                default: "N/A"
            },
            { key: "Fouls", label: "Fouls", type: "number",   min: 0, default: 0 },
            { key: "Notes", label: "Notes", type: "textarea", default: "" },
        ]
    }
];

function defaultValues() {
    const vals = {};
    FIELDS.forEach(s => s.fields.forEach(f => { vals[f.key] = f.default ?? ""; }));
    return vals;
}

// ── Field renderers ──────────────────────────────────────────────
function counterHTML(key, label, min = 0, value = 0) {
    return `
        <div class="scout-field">
            <label class="scout-label">${label}</label>
            <div class="counter-wrap">
                <button class="counter-btn" data-action="dec" data-key="${key}" type="button">−</button>
                <span class="counter-val" id="val-${CSS.escape(key)}">${value}</span>
                <button class="counter-btn" data-action="inc" data-key="${key}" type="button">+</button>
            </div>
            <input type="hidden" name="${key}" id="input-${CSS.escape(key)}" value="${value}" data-min="${min}">
        </div>`;
}

function checkboxHTML(key, label, checked = false) {
    return `
        <div class="scout-field scout-field--checkbox">
            <label class="scout-label">${label}</label>
            <label class="toggle-wrap">
                <input type="checkbox" name="${key}" id="input-${CSS.escape(key)}" ${checked ? "checked" : ""}>
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
        </div>`;
}

function selectHTML(key, label, options, selected = "") {
    const opts = options.map(o => `<option value="${o}" ${o === selected ? "selected" : ""}>${o}</option>`).join("");
    return `
        <div class="scout-field">
            <label class="scout-label" for="input-${CSS.escape(key)}">${label}</label>
            <select class="scout-select" name="${key}" id="input-${CSS.escape(key)}">${opts}</select>
        </div>`;
}

function textareaHTML(key, label, value = "") {
    return `
        <div class="scout-field scout-field--full">
            <label class="scout-label" for="input-${CSS.escape(key)}">${label}</label>
            <textarea class="scout-textarea" name="${key}" id="input-${CSS.escape(key)}" rows="3" placeholder="Observations, strategy notes…">${value}</textarea>
        </div>`;
}

function fieldHTML(f, values) {
    const v = values[f.key] ?? f.default ?? "";
    switch (f.type) {
        case "number":   return counterHTML(f.key, f.label, f.min ?? 0, v);
        case "checkbox": return checkboxHTML(f.key, f.label, v);
        case "select":   return selectHTML(f.key, f.label, f.options, v);
        case "textarea": return textareaHTML(f.key, f.label, v);
        default:         return "";
    }
}

function sectionHTML(section, values) {
    return `
        <div class="scout-section">
            <div class="scout-section-label">${section.section}</div>
            <div class="scout-fields">
                ${section.fields.map(f => fieldHTML(f, values)).join("")}
            </div>
        </div>`;
}

function readForm(container) {
    const data = {};
    FIELDS.forEach(s => s.fields.forEach(f => {
        const el = container.querySelector(`[name="${f.key}"]`);
        if (!el) return;
        if (f.type === "checkbox")    data[f.key] = el.checked ? 1 : 0;
        else if (f.type === "number") data[f.key] = parseInt(el.value, 10) || 0;
        else                          data[f.key] = el.value;
    }));
    return data;
}

function showToast(msg, type = "success") {
    let toast = document.getElementById("scout-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "scout-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `scout-toast ${type} visible`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

function bindCounters(container) {
    container.querySelectorAll(".counter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;
            const input = container.querySelector(`#input-${CSS.escape(key)}`);
            const display = container.querySelector(`#val-${CSS.escape(key)}`);
            const min = parseInt(input.dataset.min ?? "0", 10);
            let val = parseInt(input.value, 10) || 0;
            val += btn.dataset.action === "inc" ? 1 : -1;
            if (val < min) val = min;
            input.value = val;
            display.textContent = val;
        });
    });
}

// ── Find the app's main content container ───────────────────────
function getAppRoot() {
    return document.querySelector("#app-content")
        ?? document.querySelector(".app")
        ?? document.body;
}

// ── Render scout form HTML for a logged-in user ──────────────────
async function renderScoutForm(user) {
    let teams = [];
    let teamLoadErr = null;
    try { teams = await fetchEventTeams(); }
    catch (e) { teamLoadErr = e.message; }

    const teamOptions = teamLoadErr
        ? `<option value="">Failed to load teams</option>`
        : [
            `<option value="">— Select a team —</option>`,
            ...teams.map(t => `<option value="${t.team_number}">${t.team_number}${t.nickname ? ` · ${t.nickname}` : ""}</option>`)
          ].join("");

    const values = defaultValues();

    return `
        <div class="page">
            <div class="page-header">
                <div class="page-header-row">
                    <div>
                        <h1 class="page-title">Scout Entry</h1>
                        <p class="page-subtitle">Team 7250 · 2026 Season</p>
                    </div>
                    <div class="auth-status">
                        <span class="auth-user-pill">${user.email}</span>
                        <button class="btn btn-ghost btn-sm" id="signout-btn">Sign Out</button>
                    </div>
                </div>
            </div>

            <form id="scout-form" class="scout-form" autocomplete="off">
                <div class="scout-meta-bar">
                    <div class="scout-meta-field">
                        <label class="scout-label" for="scout-team">Team Scouted</label>
                        <select class="scout-select scout-select--team" id="scout-team" name="Team Number" required>
                            ${teamOptions}
                        </select>
                    </div>
                    <div class="scout-meta-field">
                        <label class="scout-label" for="scout-match">Match #</label>
                        <input class="scout-input" type="number" id="scout-match" name="Match Number" min="1" placeholder="e.g. 12">
                    </div>
                    <div class="scout-meta-field">
                        <label class="scout-label" for="scout-scouter">Scouter</label>
                        <input class="scout-input" type="text" id="scout-scouter" name="Scouter" placeholder="Your name">
                    </div>
                </div>

                ${FIELDS.map(s => sectionHTML(s, values)).join("")}

                <div class="scout-actions">
                    <button type="button" id="scout-reset" class="btn btn-ghost">Reset</button>
                    <button type="submit" id="scout-submit" class="btn btn-primary">
                        <span id="submit-label">Submit Entry</span>
                    </button>
                </div>
            </form>
        </div>`;
}

// ── Mount auth page (reusable helper) ────────────────────────────
function mountAuth(root) {
    root.innerHTML = Auth({
        onSuccess: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            root.innerHTML = await renderScoutForm(session.user);
            bindScoutForm();
        }
    });
}

// ── Bind all scout form interactivity ───────────────────────────
function bindScoutForm() {
    const form = document.getElementById("scout-form");
    if (!form) return;

    bindCounters(form);

    // Sign out → back to auth page
    document.getElementById("signout-btn")?.addEventListener("click", async () => {
        await supabase.auth.signOut();
        mountAuth(getAppRoot());
    });

    // Reset
    document.getElementById("scout-reset")?.addEventListener("click", () => {
        if (!confirm("Reset all fields?")) return;
        const vals = defaultValues();
        FIELDS.forEach(s => s.fields.forEach(f => {
            const el = form.querySelector(`[name="${f.key}"]`);
            if (!el) return;
            if (f.type === "checkbox") el.checked = !!vals[f.key];
            else el.value = vals[f.key] ?? "";
            const display = form.querySelector(`#val-${CSS.escape(f.key)}`);
            if (display) display.textContent = vals[f.key] ?? 0;
        }));
        form.querySelector("#scout-team").value = "";
        form.querySelector("#scout-match").value = "";
        form.querySelector("#scout-scouter").value = "";
    });

    // Submit
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const teamNum = form.querySelector("#scout-team").value;
        if (!teamNum) { showToast("Please select a team.", "error"); return; }

        const submitBtn = document.getElementById("scout-submit");
        const label = document.getElementById("submit-label");
        submitBtn.disabled = true;
        label.textContent = "Saving…";

        const matchNum = form.querySelector("#scout-match").value;
        const scouter  = form.querySelector("#scout-scouter").value;
        const fieldData = readForm(form);

        const row = {
            "Team Number": parseInt(teamNum, 10),
            ...(matchNum ? { "Match Number": parseInt(matchNum, 10) } : {}),
            ...(scouter  ? { "Scouter": scouter }                    : {}),
            ...fieldData
        };

        try {
            const { error } = await supabase.from("scoutsheet").insert([row]);
            if (error) throw error;
            showToast(`✓ Entry saved for Team ${teamNum}`, "success");
            // Soft-reset numeric/boolean fields; keep team/match for fast re-entry
            FIELDS.forEach(s => s.fields.forEach(f => {
                if (f.type === "number" || f.type === "checkbox") {
                    const el = form.querySelector(`[name="${f.key}"]`);
                    if (el) {
                        el.value = f.default ?? 0;
                        if (f.type === "checkbox") el.checked = !!f.default;
                    }
                    const display = form.querySelector(`#val-${CSS.escape(f.key)}`);
                    if (display) display.textContent = f.default ?? 0;
                }
            }));
        } catch (err) {
            showToast(`Error: ${err.message}`, "error");
        } finally {
            submitBtn.disabled = false;
            label.textContent = "Submit Entry";
        }
    });
}

// ── Main export ─────────────────────────────────────────────────
export default async function ScoutEntry() {
    // Auth guard: check for an active session before rendering anything
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // No session → show auth page; onSuccess swaps in the form
        setTimeout(() => {
            const root = getAppRoot();
            // The Auth page is already rendered as our return value,
            // but we need to wire up the onSuccess swap after DOM is ready.
            // Re-mount so the callback has a live root reference.
            mountAuth(root);
        }, 0);

        // Return auth HTML immediately so the router has something to paint
        return Auth({ onSuccess: () => {} }); // callbacks wired by mountAuth above
    }

    // Signed in → render the form
    const formHTML = await renderScoutForm(session.user);
    setTimeout(() => bindScoutForm(), 0);
    return formHTML;
}