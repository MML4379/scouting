import { supabase } from "../app.js";

const TBA_KEY = "0n75QTuNDDuPGQ42UG8GDbxmVlPGtCMnd67fSCcH04AgVMSWwgJPCdtRwjiKYO9b";
const TEAM = "frc7250";

async function tba(endpoint) {
    const res = await fetch(`https://www.thebluealliance.com/api/v3${endpoint}`, { headers: { "X-TBA-Auth-Key": TBA_KEY } });
    return res.ok ? res.json() : null;
}

// Modal function
function openModal(title, htmlContent) {
    let backdrop = document.getElementById("sn-modal-backdrop");
    
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "sn-modal-backdrop";
        backdrop.className = "modal-backdrop open";
        backdrop.style.zIndex = "200";
        document.body.appendChild(backdrop);
    } else {
        backdrop.classList.add("open");
    }

    backdrop.innerHTML = `
        <div class="modal" role="dialog" style="margin: auto; z-index: 201;">
            <div class="modal-header">
                <span class="modal-title">${title}</span>
                <button class="modal-close" id="sn-modal-close">✕</button>
            </div>
            <div class="modal-body" id="sn-modal-body">
                ${htmlContent}
            </div>
        </div>
    `;

    document.getElementById("sn-modal-close").addEventListener("click", () => {
        backdrop.classList.remove("open");
    });

    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) backdrop.classList.remove("open");
    });
}

export default async function Match() {
    setTimeout(async () => {
        try {
            const [events, statuses, districts] = await Promise.all([
                tba(`/team/${TEAM}/events/2026`),
                tba(`/team/${TEAM}/events/2026/statuses`),
                tba(`/team/${TEAM}/districts`)
            ]);

            // Calculate overall record, RP, Avg Score
            let totalWins = 0, totalLosses = 0, totalTies = 0, totalRP = 0;
            
            Object.values(statuses || {}).forEach(status => {
                if (status && status.qual) {
                    totalWins += status.qual.ranking.record.wins;
                    totalLosses += status.qual.ranking.record.losses;
                    totalTies += status.qual.ranking.record.ties;
                    // TBA exposes Avg RP as sort_orders[0]. Multiply by matches played for exact RP.
                    const avgRP = status.qual.ranking.sort_orders[0] || 0;
                    const played = status.qual.ranking.matches_played || 0;
                    totalRP += (avgRP * played); 
                }
            });

            // Get State Ranking
            let stateRankStr = "N/A";
            if (districts && districts.length > 0) {
                const currentDistrict = districts.find(d => d.year === 2026) || districts[0];
                const rankData = await tba(`/district/${currentDistrict.key}/rankings`);
                const teamRank = rankData?.find(r => r.team_key === TEAM);
                if (teamRank) stateRankStr = `#${teamRank.rank} in ${currentDistrict.abbreviation.toUpperCase()}`;
            }

            document.getElementById("team-stats").innerHTML = `
                <div class="scout-meta-bar" style="margin-bottom: 2rem; grid-template-columns: repeat(3, 1fr);">
                    <div class="scout-meta-field"><label class="scout-label">Overall Record</label><span class="mono">${totalWins}-${totalLosses}-${totalTies}</span></div>
                    <div class="scout-meta-field"><label class="scout-label">Total RP</label><span class="mono">${Math.round(totalRP)}</span></div>
                    <div class="scout-meta-field"><label class="scout-label">State Ranking</label><span class="mono">${stateRankStr}</span></div>
                </div>
            `;

            // Load Matches
            let allMatches = [];
            for (const ev of events) {
                const m = await tba(`/team/${TEAM}/event/${ev.key}/matches`);
                if (m) allMatches.push(...m.map(match => ({ ...match, event_key: ev.key })));
            }
            
            allMatches.sort((a, b) => a.actual_time - b.actual_time);

            const renderMatches = (matches) => matches.map(m => `
                <div class="match-card" style="margin-bottom: 1rem;">
                    <div class="match-card-header clickable" data-match="${m.key}" data-event="${m.event_key}">
                        <span class="match-label">${m.key.split('_')[1].toUpperCase()} @ ${m.event_key}</span>
                    </div>
                    <div class="match-alliances">
                        <div class="alliance-block red"><div class="alliance-teams">${m.alliances.red.team_keys.map(k=>`<span class="team-pill red" data-team="${k.replace('frc','')}" data-event="${m.event_key}">${k.replace('frc','')}</span>`).join('')}</div><div class="alliance-score">${m.alliances.red.score}</div></div>
                        <div class="alliance-block blue"><div class="alliance-teams">${m.alliances.blue.team_keys.map(k=>`<span class="team-pill blue" data-team="${k.replace('frc','')}" data-event="${m.event_key}">${k.replace('frc','')}</span>`).join('')}</div><div class="alliance-score">${m.alliances.blue.score}</div></div>
                    </div>
                </div>
            `).join("");

            const listContainer = document.getElementById("match-list");
            listContainer.innerHTML = renderMatches(allMatches);

            // Search logic
            document.getElementById("match-search").addEventListener("input", (e) => {
                const q = e.target.value.toLowerCase();
                const filtered = allMatches.filter(m => m.key.toLowerCase().includes(q));
                listContainer.innerHTML = renderMatches(filtered);
            });

            // Modals logic
            document.body.addEventListener('click', async (e) => {
                const matchHeader = e.target.closest('.match-card-header');
                const teamPill = e.target.closest('.team-pill');

                // MATCH SUMMARY MODAL
                if (matchHeader) {
                    const matchKey = matchHeader.dataset.match;
                    const eventKey = matchHeader.dataset.event;
                    const matchData = allMatches.find(m => m.key === matchKey);
                    
                    openModal(`Alliance Summary · ${matchKey}`, `<p class="state-msg">Fetching match data...</p>`);

                    const teams = [...matchData.alliances.red.team_keys, ...matchData.alliances.blue.team_keys].map(k => k.replace('frc',''));
                    const { data: localData } = await supabase.from(eventKey).select('*').in('Team Number', teams);

                    let modalHtml = '';
                    ['red', 'blue'].forEach(color => {
                        const allianceTeams = matchData.alliances[color].team_keys.map(k => k.replace('frc', ''));
                        const score = matchData.alliances[color].score;
                        
                        modalHtml += `
                            <div class="alliance-modal-block ${color}">
                                <div class="alliance-modal-header">
                                    <span>${color.toUpperCase()} ALLIANCE</span>
                                    <span class="alliance-modal-score">${score} pts</span>
                                </div>
                        `;

                        allianceTeams.forEach(team => {
                            const tData = (localData || []).find(d => String(d['Team Number']) === team);
                            modalHtml += `<div class="match-team-block">
                                <div class="match-team-label ${color}">Team ${team}</div>`;
                            
                            if (tData) {
                                modalHtml += `
                                    <div class="modal-table-wrap">
                                        <table class="sn-pro modal-table">
                                            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                                            <tbody>
                                                <tr><td>Drive Train</td><td>${tData['Drive Train'] || '—'}</td></tr>
                                                <tr><td>Auton Climb</td><td>${tData['Auton Climb'] ? 'Yes' : 'No'}</td></tr>
                                                <tr><td>Fire Rate</td><td>${tData['Fire rate'] !== null ? tData['Fire rate'] + ' b/s' : '—'}</td></tr>
                                                <tr><td>Ball Capacity</td><td>${tData['Ball capacity'] !== null ? tData['Ball capacity'] : '—'}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                `;
                            } else {
                                modalHtml += `<p class="no-scout">No scouting data logged.</p>`;
                            }
                            modalHtml += `</div>`;
                        });
                        modalHtml += `</div>`;
                    });

                    document.getElementById("sn-modal-body").innerHTML = modalHtml;
                }

                // TEAM SUMMARY MODAL
                if (teamPill) {
                    e.stopPropagation();
                    const team = teamPill.dataset.team;
                    const eventKey = teamPill.dataset.event;
                    
                    openModal(`Team ${team} Data`, `<p class="state-msg">Fetching team data...</p>`);

                    const { data } = await supabase.from(eventKey).select('*').eq('Team Number', team);
                    
                    if (!data || data.length === 0) {
                        document.getElementById("sn-modal-body").innerHTML = `<p class="state-msg">No scouting data logged for Team ${team} at this event.</p>`;
                        return;
                    }

                    const teamData = data[0]; 
                    const skipKeys = ["id", "created_at"];
                    
                    const rows = Object.keys(teamData)
                        .filter(k => !skipKeys.includes(k))
                        .map(k => `<tr><td>${k}</td><td class="mono">${teamData[k] !== null && teamData[k] !== "" ? teamData[k] : '—'}</td></tr>`)
                        .join("");

                    document.getElementById("sn-modal-body").innerHTML = `
                        <div class="modal-table-wrap">
                            <table class="sn-pro modal-table">
                                <thead><tr><th>Field</th><th>Recorded Value</th></tr></thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                    `;
                }
            });

        } catch (err) {
            document.getElementById("team-stats").innerHTML = `<p class="state-msg error">Error loading data: ${err.message}</p>`;
        }
    }, 0);

    return `
        <div class="page">
            <h1 class="page-title">Team 7250 Match Reports</h1>
            <div id="team-stats"><p class="state-msg">Loading stats...</p></div>
            <div class="search-bar">
                <input id="match-search" type="text" placeholder="Search matches (e.g. qm22)..." autocomplete="off"/>
            </div>
            <div id="match-list"></div>
        </div>
    `;
}