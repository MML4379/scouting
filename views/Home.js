import { supabase } from "../app.js";

const TBA_KEY = "0n75QTuNDDuPGQ42UG8GDbxmVlPGtCMnd67fSCcH04AgVMSWwgJPCdtRwjiKYO9b";
const TEAM = "frc7250";

async function fetchEvents() {
    const res = await fetch(`https://www.thebluealliance.com/api/v3/team/${TEAM}/events/2026`, { headers: { "X-TBA-Auth-Key": TBA_KEY } });
    return res.json();
}

export default async function Home() {
    setTimeout(async () => {
        const events = await fetchEvents();
        const eventSelect = document.getElementById("event-selector");
        
        events.forEach(e => {
            const opt = document.createElement("option");
            opt.value = e.key;
            opt.textContent = `${e.name} (${e.key})`;
            eventSelect.appendChild(opt);
        });

        eventSelect.addEventListener("change", async (e) => {
            const eventId = e.target.value;
            const container = document.getElementById("data-container");
            if (!eventId) { container.innerHTML = ""; return; }

            container.innerHTML = `<p class="state-msg">Loading data from table '${eventId}'...</p>`;
            
            // Looks for the table titled the same as the event ID
            const { data, error } = await supabase.from(eventId).select("*");

            if (error) {
                container.innerHTML = `<p class="state-msg error">Could not load table '${eventId}'. Ensure it exists in Supabase. Details: ${error.message}</p>`;
                return;
            }

            if (!data || data.length === 0) {
                container.innerHTML = `<p class="state-msg">No scouting data found for this event yet.</p>`;
                return;
            }

            const columns = Object.keys(data[0]);
            const headerRow = columns.map(col => `<th>${col}</th>`).join("");
            
            const buildRows = (rows) => rows.map(row => 
                `<tr>${columns.map(col => `<td>${row[col] ?? "—"}</td>`).join("")}</tr>`
            ).join("");

            container.innerHTML = `
                <div class="search-bar" style="margin-top: 1rem;">
                    <input id="raw-search" type="text" placeholder="Search raw data..." autocomplete="off"/>
                </div>
                <div class="table-wrap">
                    <table class="sn-pro">
                        <thead><tr>${headerRow}</tr></thead>
                        <tbody id="raw-tbody">${buildRows(data)}</tbody>
                    </table>
                </div>
            `;

            document.getElementById("raw-search")?.addEventListener("input", (ev) => {
                const q = ev.target.value.toLowerCase().trim();
                const filtered = q ? data.filter(r => columns.some(c => String(r[c]).toLowerCase().includes(q))) : data;
                document.getElementById("raw-tbody").innerHTML = buildRows(filtered);
            });
        });
    }, 0);

    return `
        <div class="page">
            <h1 class="page-title">Scouting Data</h1>
            <p class="page-subtitle">Select an event to view its corresponding database table.</p>
            <select class="scout-select" id="event-selector" style="max-width: 400px; margin-top: 1rem;">
                <option value="">-- Select Event --</option>
            </select>
            <div id="data-container"></div>
        </div>
    `;
}