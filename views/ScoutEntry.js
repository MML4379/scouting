import { supabase } from "../app.js";
import Auth from "../components/Auth.js";

function getAppRoot() { return document.getElementById("app") || document.body; }

async function renderScoutForm() {
    return `
        <div class="page">
            <h1 class="page-title">Scout Entry</h1>
            <form id="scout-form" class="scout-form" style="margin-top: 1.5rem;">
                
                <div class="scout-meta-bar" style="grid-template-columns: 1fr 1fr;">
                    <div class="scout-field">
                        <label class="scout-label">Target Event ID (Table Name)</label>
                        <input class="scout-input" type="text" id="event-id" required placeholder="e.g. 2026milac">
                    </div>
                    <div class="scout-field scout-field--checkbox" style="border: none;">
                        <label class="scout-label">Resubmission (Update Existing)</label>
                        <label class="toggle-wrap">
                            <input type="checkbox" id="is-resubmit">
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Team Info</div>
                    <div class="scout-fields">
                        <div class="scout-field"><label class="scout-label">Team Number</label><input class="scout-input req" type="number" id="team-num" required min="1"></div>
                        <div class="scout-field"><label class="scout-label">Team Name</label><input class="scout-input req" type="text" id="team-name" required></div>
                        <div class="scout-field"><label class="scout-label">Team Location</label><input class="scout-input req" type="text" id="team-loc" required></div>
                        <div class="scout-field"><label class="scout-label">Robot Name</label><input class="scout-input req" type="text" id="bot-name" required></div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Robot Capabilities</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Drive Train</label>
                            <select class="scout-select req" id="drive-train" required>
                                <option value="">Select...</option><option value="swerve">Swerve</option><option value="tank">Tank</option><option value="mechanum">Mechanum</option><option value="other">Other</option>
                            </select>
                        </div>
                        <div class="scout-field"><label class="scout-label">Fire Rate (balls/sec)</label><input class="scout-input req" type="number" step="any" id="fire-rate" required min="0"></div>
                        <div class="scout-field"><label class="scout-label">Ball Capacity</label><input class="scout-input req" type="number" step="any" id="ball-cap" required min="0"></div>
                        <div class="scout-field">
                            <label class="scout-label">Intake Type</label>
                            <select class="scout-select req" id="intake-type" required>
                                <option value="">Select...</option><option value="Over">Over</option><option value="Under">Under</option><option value="Both">Both</option><option value="N/A">N/A</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Pick up Method</label>
                            <select class="scout-select req" id="pickup" required>
                                <option value="">Select...</option><option value="Human Player">Human Player</option><option value="Ground">Ground</option><option value="Both">Both</option><option value="N/A">N/A</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Climb & Auton</div>
                    <div class="scout-fields">
                        <div class="scout-field scout-field--checkbox"><label class="scout-label">L1 Climb</label><input type="checkbox" id="c-l1"></div>
                        <div class="scout-field scout-field--checkbox"><label class="scout-label">L2 Climb</label><input type="checkbox" id="c-l2"></div>
                        <div class="scout-field scout-field--checkbox"><label class="scout-label">L3 Climb</label><input type="checkbox" id="c-l3"></div>
                        <div class="scout-field scout-field--checkbox"><label class="scout-label">Auton Climb</label><input type="checkbox" id="c-auton"></div>
                        
                        <div class="scout-field"><label class="scout-label">Time to Climb (s)</label><input class="scout-input req" type="number" step="any" id="climb-time" required min="0"></div>
                        <div class="scout-field">
                            <label class="scout-label">Area to Climb</label>
                            <select class="scout-select req" id="climb-area" required>
                                <option value="">Select...</option><option value="Center">Center</option><option value="Outside Left">Outside Left</option><option value="Outside Right">Outside Right</option><option value="Outside Left and Right">Outside Left and Right</option><option value="All Sides">All Sides</option><option value="N/A">N/A</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Match & Experience</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Pref Starting Spot</label>
                            <select class="scout-select req" id="pref-start" required>
                                <option value="">Select...</option><option value="Left">Left</option><option value="Right">Right</option><option value="Center">Center</option><option value="No Preference">No Preference</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Driver Exp</label>
                            <select class="scout-select req" id="driver-exp" required>
                                <option value="">Select...</option><option value="1">1 year or less</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option><option value="5">5+ years</option>
                            </select>
                        </div>
                        <div class="scout-field"><label class="scout-label">Match Type</label>
                            <select class="scout-select req" id="match-type" required><option value="">Select...</option><option value="qm">Quals (qm)</option><option value="sf">Playoff (sf)</option><option value="f">Finals (f)</option></select>
                        </div>
                        <div class="scout-field"><label class="scout-label">Match #</label><input class="scout-input req" type="number" id="match-num" required></div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" id="submit-btn" style="margin-top: 1rem;">Submit Data</button>
            </form>
        </div>
    `;
}

function bindForm() {
    const resubmitToggle = document.getElementById("is-resubmit");
    const reqFields = document.querySelectorAll(".req");

    // Toggle required fields on resubmit
    resubmitToggle.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        reqFields.forEach(f => {
            // Keep Team Number and Event ID required so we can look up the record
            if (f.id !== "team-num" && f.id !== "event-id") {
                f.required = !isChecked;
            }
        });
    });

    document.getElementById("scout-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("submit-btn");
        btn.disabled = true;
        btn.textContent = "Processing...";

        const eventId = document.getElementById("event-id").value;
        const teamNum = document.getElementById("team-num").value;
        const isResubmit = resubmitToggle.checked;
        const matchStr = `${document.getElementById("match-type").value}${document.getElementById("match-num").value}`;

        const getVal = (id) => {
            const val = document.getElementById(id).value;
            return val === "" ? null : val; // Return null if empty so DB ignores it on update
        };

        let payload = {
            "Team Number": parseInt(teamNum),
            "Team Name": getVal("team-name"),
            "Team Location": getVal("team-loc"),
            "Robot Name": getVal("bot-name"),
            "Drive Train": getVal("drive-train"),
            "Fire rate": getVal("fire-rate") ? parseFloat(getVal("fire-rate")) : null,
            "Ball capacity": getVal("ball-cap") ? parseFloat(getVal("ball-cap")) : null,
            "Over/Under Intake": getVal("intake-type"),
            "L1 Climb": document.getElementById("c-l1").checked,
            "L2 Climb": document.getElementById("c-l2").checked,
            "L3 Climb": document.getElementById("c-l3").checked,
            "Pick up Method": getVal("pickup"),
            "Time to Climb": getVal("climb-time") ? parseFloat(getVal("climb-time")) : null,
            "Area to Climb": getVal("climb-area"),
            "Preferred Starting Spot": getVal("pref-start"),
            "Driver Experience": getVal("driver-exp") ? parseInt(getVal("driver-exp")) : null,
            "Auton Climb": document.getElementById("c-auton").checked,
        };

        // Remove nulls so we don't overwrite existing data on a resubmit update
        Object.keys(payload).forEach(key => { if (payload[key] === null) delete payload[key]; });

        try {
            if (isResubmit) {
                // Fetch existing
                const { data: existing, error: fetchErr } = await supabase.from(eventId).select("*").eq("Team Number", teamNum).single();
                if (fetchErr) throw new Error(`Could not find existing team ${teamNum} in table ${eventId} to resubmit.`);

                // Merge matches: if existing.Match is "qm10", new match becomes "qm10, qm66"
                const existingMatches = existing.Match ? existing.Match.split(', ') : [];
                if (matchStr !== "null" && !existingMatches.includes(matchStr)) {
                    existingMatches.push(matchStr);
                }
                payload.Match = existingMatches.join(', ');

                const { error: upErr } = await supabase.from(eventId).update(payload).eq("Team Number", teamNum);
                if (upErr) throw upErr;
                alert("Resubmission successful!");

            } else {
                payload.Match = matchStr === "null" ? "" : matchStr;
                const { error: inErr } = await supabase.from(eventId).insert([payload]);
                if (inErr) throw inErr;
                alert("New entry saved!");
            }
            document.getElementById("scout-form").reset();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.textContent = "Submit Data";
        }
    });
}

export default async function ScoutEntry() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        setTimeout(() => {
            Auth({
                onSuccess: async () => {
                    const { data: { session: newSession } } = await supabase.auth.getSession();
                    if (newSession) {
                        getAppRoot().innerHTML = await renderScoutForm();
                        bindForm();
                    }
                }
            });
        }, 0);

        return `<div class="page"><h1 class="page-title">Auth Required</h1><p>Please log in.</p></div>`;
    }

    const formHTML = await renderScoutForm();
    setTimeout(() => bindForm(), 0);
    return formHTML;
}