import { supabase } from "../app.js";

const TBA_KEY = "0n75QTuNDDuPGQ42UG8GDbxmVlPGtCMnd67fSCcH04AgVMSWwgJPCdtRwjiKYO9b";
const TEAM = "frc7250";
const TBA = "https://www.thebluealliance.com/api/v3";

// ── TBA helper ──────────────────────────────────────────────────
async function tba(endpoint) {
    const res = await fetch(`${TBA}${endpoint}`, {
        headers: { "X-TBA-Auth-Key": TBA_KEY }
    });
    if (!res.ok) throw new Error(`TBA ${res.status}: ${endpoint}`);
    return res.json();
}

// ── Supabase: fetch scouting rows for one or many teams ─────────
async function fetchScoutData(teamNumbers) {
    const nums = Array.isArray(teamNumbers) ? teamNumbers : [teamNumbers];
    const { data, error } = await supabase
        .from("scoutsheet")
        .select("*")
        .in("Team Number", nums);
    if (error) throw error;
    return data ?? [];
}

// ── Aggregate numeric columns across rows ───────────────────────
function aggregate(rows) {
    if (!rows.length) return null;
    const skip = new Set(["Team Number", "id", "created_at"]);
    const cols = Object.keys(rows[0]).filter(k => !skip.has(k));
    const stats = {};
    for (const col of cols) {
        const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        if (!vals.length) continue;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const max = Math.max(...vals);
        stats[col] = { avg: avg.toFixed(2), max, count: vals.length };
    }
    return stats;
}

// ── Modal ───────────────────────────────────────────────────────
function createModal() {
    if (document.getElementById("sn-modal")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "sn-modal";
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
        <div class="modal" role="dialog">
            <div class="modal-header">
                <span class="modal-title" id="modal-title"></span>
                <button class="modal-close" id="modal-close">✕</button>
            </div>
            <div class="modal-body" id="modal-body">
                <p class="state-msg">Loading…</p>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);

    const close = () => backdrop.classList.remove("open");
    document.getElementById("modal-close").addEventListener("click", close);
    backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

function openModal(title, html) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = html;
    document.getElementById("sn-modal").classList.add("open");
}

// ── Render scouting data for a single team ──────────────────────
function renderTeamModal(teamNum, rows) {
    if (!rows.length) return `<p class="state-msg">No scouting data for team ${teamNum}.</p>`;

    const skip = new Set(["Team Number", "id", "created_at"]);
    const cols = Object.keys(rows[0]).filter(k => !skip.has(k));
    const stats = aggregate(rows);

    const summaryRows = stats
        ? Object.entries(stats).map(([col, s]) => `
            <tr>
                <td>${col}</td>
                <td class="mono">${s.avg}</td>
                <td class="mono">${s.max}</td>
                <td class="mono">${s.count}</td>
            </tr>`).join("")
        : "";

    const rawRows = rows.map(row => `
        <tr>${cols.map(col => {
            const val = row[col] ?? "";
            return `<td>${val === "" ? `<span class="null-cell">—</span>` : val}</td>`;
        }).join("")}</tr>
    `).join("");

    return `
        <div class="modal-section-label">Summary (${rows.length} entr${rows.length === 1 ? "y" : "ies"})</div>
        <div class="modal-table-wrap">
            <table class="sn-pro modal-table">
                <thead><tr>
                    <th>Metric</th><th>Avg</th><th>Max</th><th>Entries</th>
                </tr></thead>
                <tbody>${summaryRows || `<tr><td colspan="4" class="state-msg">No numeric data.</td></tr>`}</tbody>
            </table>
        </div>
        <div class="modal-section-label" style="margin-top:1.25rem">Raw Entries</div>
        <div class="modal-table-wrap">
            <table class="sn-pro modal-table">
                <thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
                <tbody>${rawRows}</tbody>
            </table>
        </div>
    `;
}

// ── Render match modal (both alliances) ─────────────────────────
function renderMatchModal(match, scoutData) {
    const alliances = ["red", "blue"];

    const sections = alliances.map(color => {
        const teams = match.alliances[color].team_keys.map(k => k.replace("frc", ""));
        const score = match.alliances[color].score;
        const won = match.winning_alliance === color;

        const teamSections = teams.map(num => {
            const rows = scoutData.filter(r => String(r["Team Number"]) === String(num));
            const stats = aggregate(rows);

            const statRows = stats
                ? Object.entries(stats).map(([col, s]) => `
                    <tr>
                        <td>${col}</td>
                        <td class="mono">${s.avg}</td>
                        <td class="mono">${s.max}</td>
                    </tr>`).join("")
                : "";

            const rawRows = rows.length
                ? (() => {
                    const skip = new Set(["Team Number", "id", "created_at"]);
                    const cols = Object.keys(rows[0]).filter(k => !skip.has(k));
                    return rows.map(row => `
                        <tr>${cols.map(col => {
                            const val = row[col] ?? "";
                            return `<td>${val === "" ? `<span class="null-cell">—</span>` : val}</td>`;
                        }).join("")}</tr>
                    `).join("");
                })()
                : "";

            const skip = new Set(["Team Number", "id", "created_at"]);
            const rawCols = rows.length ? Object.keys(rows[0]).filter(k => !skip.has(k)) : [];

            return `
                <div class="match-team-block">
                    <div class="match-team-label ${color}">Team ${num}${num === "7250" ? " (us)" : ""}</div>
                    ${!rows.length ? `<p class="no-scout">No scouting data.</p>` : `
                        <div class="modal-section-label" style="font-size:0.7rem">Summary</div>
                        <div class="modal-table-wrap">
                            <table class="sn-pro modal-table">
                                <thead><tr><th>Metric</th><th>Avg</th><th>Max</th></tr></thead>
                                <tbody>${statRows || `<tr><td colspan="3" class="state-msg">No numeric data.</td></tr>`}</tbody>
                            </table>
                        </div>
                        <div class="modal-section-label" style="font-size:0.7rem;margin-top:0.75rem">Raw Entries</div>
                        <div class="modal-table-wrap">
                            <table class="sn-pro modal-table">
                                <thead><tr>${rawCols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
                                <tbody>${rawRows}</tbody>
                            </table>
                        </div>
                    `}
                </div>
            `;
        }).join("");

        return `
            <div class="alliance-modal-block ${color}${won ? " won" : ""}">
                <div class="alliance-modal-header">
                    <span class="alliance-modal-label">${color.toUpperCase()} ALLIANCE</span>
                    <span class="alliance-modal-score">${score ?? "?"} pts${won ? " 🏆" : ""}</span>
                </div>
                ${teamSections}
            </div>
        `;
    }).join("");

    return sections;
}

// ── Alliance helpers ─────────────────────────────────────────────
function allianceColor(alliances, teamKey) {
    if (alliances.red?.team_keys?.includes(teamKey)) return "red";
    if (alliances.blue?.team_keys?.includes(teamKey)) return "blue";
    return null;
}

// ── Match card ───────────────────────────────────────────────────
function renderMatch(match, scoutRows) {
    const red = match.alliances.red;
    const blue = match.alliances.blue;
    const winner = match.winning_alliance;
    const ourColor = allianceColor(match.alliances, TEAM);
    const weWon = ourColor && ourColor === winner;
    const weLost = ourColor && winner && ourColor !== winner;

    const teamPill = (key, color) => {
        const num = key.replace("frc", "");
        const isUs = key === TEAM;
        const hasData = scoutRows.some(r => String(r["Team Number"]) === num);
        return `<span 
            class="team-pill ${color}${isUs ? " us" : ""}${hasData ? " has-data" : ""}" 
            data-team="${num}"
            title="${hasData ? "Click to view scouting data" : "No scouting data"}"
        >${num}</span>`;
    };

    const allianceBlock = (alliance, color, score) => {
        const won = winner === color;
        return `
            <div class="alliance-block ${color}${won ? " won" : ""}">
                <div class="alliance-teams">
                    ${alliance.team_keys.map(k => teamPill(k, color)).join("")}
                </div>
                <div class="alliance-score">${score ?? "?"}</div>
            </div>
        `;
    };

    const matchLabel = match.comp_level === "qm"
        ? `Qual ${match.match_number}`
        : `${match.comp_level.toUpperCase()} ${match.set_number}-${match.match_number}`;

    const resultTag = weWon
        ? `<span class="result-tag win">W</span>`
        : weLost
        ? `<span class="result-tag loss">L</span>`
        : winner === "tie" || winner === ""
        ? `<span class="result-tag tie">T</span>`
        : `<span class="result-tag pending">—</span>`;

    const matchId = match.key;

    return `
        <div class="match-card" data-match-key="${matchId}">
            <div class="match-card-header clickable" data-match-key="${matchId}">
                <span class="match-label">${matchLabel}</span>
                ${resultTag}
            </div>
            <div class="match-alliances">
                ${allianceBlock(red, "red", red.score)}
                ${allianceBlock(blue, "blue", blue.score)}
            </div>
        </div>
    `;
}

function renderEvent(event, matches, scoutRows) {
    const sorted = [...matches].sort((a, b) => {
        const order = { qm: 0, ef: 1, qf: 2, sf: 3, f: 4 };
        const lvlDiff = (order[a.comp_level] ?? 9) - (order[b.comp_level] ?? 9);
        if (lvlDiff !== 0) return lvlDiff;
        if (a.match_number !== b.match_number) return a.match_number - b.match_number;
        return a.set_number - b.set_number;
    });

    return `
        <div class="event-section">
            <div class="event-header">
                <div>
                    <div class="event-name">${event.name}</div>
                    <div class="event-meta">${event.city}, ${event.state_prov} · Week ${event.week != null ? event.week + 1 : "?"}</div>
                </div>
                <span class="event-key">${event.key}</span>
            </div>
            <div class="match-grid">
                ${sorted.length
                    ? sorted.map(m => renderMatch(m, scoutRows)).join("")
                    : `<p class="state-msg">No matches yet.</p>`}
            </div>
        </div>
    `;
}

// ── Wire up click handlers after render ─────────────────────────
function bindEvents(allMatches, scoutRows) {
    // Team pill → single team modal
    document.querySelectorAll(".team-pill[data-team]").forEach(pill => {
        pill.addEventListener("click", async e => {
            e.stopPropagation();
            const num = pill.dataset.team;
            openModal(`Team ${num} · Scouting Data`, `<p class="state-msg">Loading…</p>`);
            try {
                const rows = await fetchScoutData(num);
                document.getElementById("modal-body").innerHTML = renderTeamModal(num, rows);
            } catch (err) {
                document.getElementById("modal-body").innerHTML =
                    `<p class="state-msg error">Error: ${err.message}</p>`;
            }
        });
    });

    // Match header → match modal
    document.querySelectorAll(".match-card-header.clickable").forEach(header => {
        header.addEventListener("click", async () => {
            const key = header.dataset.matchKey;
            const match = allMatches.find(m => m.key === key);
            if (!match) return;

            const label = match.comp_level === "qm"
                ? `Qual ${match.match_number}`
                : `${match.comp_level.toUpperCase()} ${match.set_number}-${match.match_number}`;

            openModal(`${label} · Alliance Breakdown`, `<p class="state-msg">Loading…</p>`);
            try {
                const teamNums = [
                    ...match.alliances.red.team_keys,
                    ...match.alliances.blue.team_keys
                ].map(k => k.replace("frc", ""));
                const rows = await fetchScoutData(teamNums);
                document.getElementById("modal-body").innerHTML = renderMatchModal(match, rows);
            } catch (err) {
                document.getElementById("modal-body").innerHTML =
                    `<p class="state-msg error">Error: ${err.message}</p>`;
            }
        });
    });
}

// ── Main export ─────────────────────────────────────────────────
export default async function MatchReports() {
    try {
        const events = await tba(`/team/${TEAM}/events/2025`);
        events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        const matchResults = await Promise.all(
            events.map(e => tba(`/team/${TEAM}/event/${e.key}/matches`).catch(() => []))
        );

        const allMatches = matchResults.flat();
        const allTeamNums = [...new Set(
            allMatches.flatMap(m => [
                ...m.alliances.red.team_keys,
                ...m.alliances.blue.team_keys
            ].map(k => k.replace("frc", "")))
        )];

        const scoutRows = allTeamNums.length ? await fetchScoutData(allTeamNums) : [];

        const sections = events
            .map((event, i) => renderEvent(event, matchResults[i], scoutRows))
            .join("");

        setTimeout(() => {
            createModal();
            bindEvents(allMatches, scoutRows);
        }, 0);

        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Match Reports</h1>
                    <p class="page-subtitle">Team 7250 · 2025 Season</p>
                </div>
                ${sections || `<p class="state-msg">No events found for this season.</p>`}
            </div>
        `;
    } catch (err) {
        return `<div class="page"><p class="state-msg error">Failed to load: ${err.message}</p></div>`;
    }
}