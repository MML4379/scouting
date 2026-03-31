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

function allianceColor(teams, teamKey) {
    const red = teams.red?.team_keys ?? [];
    const blue = teams.blue?.team_keys ?? [];
    if (red.includes(teamKey)) return "red";
    if (blue.includes(teamKey)) return "blue";
    return null;
}

function renderMatch(match) {
    const red = match.alliances.red;
    const blue = match.alliances.blue;
    const winner = match.winning_alliance;
    const ourColor = allianceColor(match.alliances, TEAM);
    const weWon = ourColor && ourColor === winner;
    const weLost = ourColor && winner && ourColor !== winner;

    const teamPill = (key, color) => {
        const num = key.replace("frc", "");
        const isUs = key === TEAM;
        return `<span class="team-pill ${color}${isUs ? " us" : ""}">${num}</span>`;
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

    return `
        <div class="match-card">
            <div class="match-card-header">
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

function renderEvent(event, matches) {
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
                    <div class="event-meta">${event.city}, ${event.state_prov} · Week ${event.week + 1 ?? "?"}</div>
                </div>
                <span class="event-key">${event.key}</span>
            </div>
            <div class="match-grid">
                ${sorted.length ? sorted.map(renderMatch).join("") : `<p class="state-msg">No matches yet.</p>`}
            </div>
        </div>
    `;
}

export default async function MatchReports() {
    try {
        const events = await tba(`/team/${TEAM}/events/2025`);
        events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        const matchResults = await Promise.all(
            events.map(e =>
                tba(`/team/${TEAM}/event/${e.key}/matches`)
                    .catch(() => [])
            )
        );

        const sections = events
            .map((event, i) => renderEvent(event, matchResults[i]))
            .join("");

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
        return `<div class="page"><p class="state-msg error">Failed to load match data: ${err.message}</p></div>`;
    }
}