import { supabase } from "../app.js";

const TBA_KEY = "0n75QTuNDDuPGQ42UG8GDbxmVlPGtCMnd67fSCcH04AgVMSWwgJPCdtRwjiKYO9b";
const TEAM = "frc7250";

async function tba(endpoint) {
    const res = await fetch(`https://www.thebluealliance.com/api/v3${endpoint}`, { headers: { "X-TBA-Auth-Key": TBA_KEY } });
    return res.ok ? res.json() : null;
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
            let totalWins = 0, totalLosses = 0, totalTies = 0, totalRP = 0, matchesPlayed = 0, totalScore = 0;
            
            Object.values(statuses || {}).forEach(status => {
                if (status && status.qual) {
                    totalWins += status.qual.ranking.record.wins;
                    totalLosses += status.qual.ranking.record.losses;
                    totalTies += status.qual.ranking.record.ties;
                    totalRP += (status.qual.ranking.sort_orders[0] * status.qual.ranking.matches_played) || 0; // Avg RP * matches
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
                <div class="scout-meta-bar" style="margin-bottom: 2rem; grid-template-columns: repeat(4, 1fr);">
                    <div class="scout-meta-field"><label class="scout-label">Overall Record</label><span class="mono">${totalWins}-${totalLosses}-${totalTies}</span></div>
                    <div class="scout-meta-field"><label class="scout-label">Est. Total RP</label><span class="mono">${Math.round(totalRP)}</span></div>
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

                if (matchHeader) {
                    const matchKey = matchHeader.dataset.match;
                    const eventKey = matchHeader.dataset.event;
                    const matchData = allMatches.find(m => m.key === matchKey);
                    
                    // Fetch local scouting data for all teams in match
                    const teams = [...matchData.alliances.red.team_keys, ...matchData.alliances.blue.team_keys].map(k => k.replace('frc',''));
                    const { data: localData } = await supabase.from(eventKey).select('*').in('Team Number', teams);

                    alert(`Showing Alliance Summary for ${matchKey}\n(Implement detailed modal HTML here using localData: ${JSON.stringify(localData?.length || 0)} rows found in ${eventKey})`);
                }

                if (teamPill) {
                    e.stopPropagation();
                    const team = teamPill.dataset.team;
                    const eventKey = teamPill.dataset.event;
                    const { data } = await supabase.from(eventKey).select('*').eq('Team Number', team);
                    alert(`Team ${team} data from table ${eventKey}:\n${JSON.stringify(data || 'No data')}`);
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