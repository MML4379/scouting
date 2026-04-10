import { supabase } from "../app.js";
import Auth from "../components/Auth.js";

const TBA_KEY = "0n75QTuNDDuPGQ42UG8GDbxmVlPGtCMnd67fSCcH04AgVMSWwgJPCdtRwjiKYO9b";
const TEAM = "frc7250";

function getAppRoot() { return document.getElementById("app") || document.body; }

async function fetchEvents() {
    try {
        const res = await fetch(`https://www.thebluealliance.com/api/v3/team/${TEAM}/events/2026`, { headers: { "X-TBA-Auth-Key": TBA_KEY } });
        return res.ok ? await res.json() : [];
    } catch {
        return [];
    }
}

async function renderScoutForm() {
    const events = await fetchEvents();
    const eventOptions = events.length
        ? events.map(e => `<option value="${e.key}">${e.name} (${e.key})</option>`).join('')
        : `<option value="">No events found</option>`;

    return `
        <div class="page">
            <div class="page-header-row">
                <h1 class="page-title">Scout Entry</h1>

                <div class="auth-tabs" style="width: 300px; margin-bottom: 0;">
                    <button class="auth-tab active" id="tab-pit" type="button">Pit Scouting</button>
                    <button class="auth-tab" id="tab-stands" type="button">Stands Scouting</button>
                </div>
            </div>

            <form id="form-pit" class="scout-form" style="margin-top: 1.5rem; display: flex;">
                <div class="scout-meta-bar">
                    <div class="scout-meta-field">
                        <label class="scout-label">Event</label>
                        <select class="scout-select" id="pit-event-id" required>
                            <option value="">Select Event...</option>
                            ${eventOptions}
                        </select>
                    </div>
                    <div class="scout-meta-field">
                        <label class="scout-label">Scouter Name</label>
                        <input class="scout-input" type="text" id="pit-scouter" required placeholder="Your name">
                    </div>
                    <div class="scout-meta-field">
                        <label class="scout-label">Resubmission</label>
                        <label class="toggle-wrap">
                            <input type="checkbox" id="pit-is-resubmit">
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        </label>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Team Info</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Team Number</label>
                            <input class="scout-input req-pit" type="number" id="pit-team-num" required min="1">
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Team Name</label>
                            <input class="scout-input req-pit" type="text" id="pit-team-name" required>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Team Location</label>
                            <input class="scout-input req-pit" type="text" id="pit-team-loc" required>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Robot Name</label>
                            <input class="scout-input req-pit" type="text" id="pit-bot-name" required>
                        </div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Robot Capabilities</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Drive Train</label>
                            <select class="scout-select req-pit" id="pit-drive-train" required>
                                <option value="">Select...</option>
                                <option value="Swerve">Swerve</option>
                                <option value="Tank">Tank</option>
                                <option value="Mechanum">Mechanum</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Fire Rate (Ball/Second)</label>
                            <input class="scout-input req-pit" type="number" step="any" id="pit-fire-rate" required min="0">
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Ball Capacity</label>
                            <input class="scout-input req-pit" type="number" id="pit-ball-cap" required min="0">
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Intake Type</label>
                            <select class="scout-select req-pit" id="pit-intake-type" required>
                                <option value="">Select...</option>
                                <option value="Over Bumper">Over Bumper</option>
                                <option value="Under Bumper">Under Bumper</option>
                                <option value="Both">Both</option>
                                <option value="Other">Other</option>
                                <option value="N/A">N/A</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Pick Up Method</label>
                            <select class="scout-select req-pit" id="pit-pickup" required>
                                <option value="">Select...</option>
                                <option value="Human Player">Human Player</option>
                                <option value="Ground">Ground</option>
                                <option value="Both">Both</option>
                                <option value="N/A">N/A</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Cycles</label>
                            <input class="scout-input req-pit" type="number" step="any" id="pit-cycles" required min="0">
                        </div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Climb &amp; Auton</div>
                    <div class="scout-fields">
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">L1</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="pit-c-l1">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">L2</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="pit-c-l2">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">L3</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="pit-c-l3">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">Auton Climb</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="pit-c-auton">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Time to Climb (s)</label>
                            <input class="scout-input req-pit" type="number" step="any" id="pit-climb-time" required min="0">
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Climb Area</label>
                            <select class="scout-select req-pit" id="pit-climb-area" required>
                                <option value="">Select...</option>
                                <option value="Center">Center</option>
                                <option value="Depot">Depot</option>
                                <option value="HP">HP</option>
                                <option value="Depot and HP">Depot and HP</option>
                                <option value="All">All</option>
                                <option value="N/A">N/A</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Experience &amp; Strategy</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Pref Start Spot</label>
                            <select class="scout-select req-pit" id="pit-pref-start" required>
                                <option value="">Select...</option>
                                <option value="Depot Side">Depot Side</option>
                                <option value="Human Player Side">Human Player Side</option>
                                <option value="Center">Center</option>
                                <option value="No Preference">No Preference</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Driver Exp</label>
                            <select class="scout-select req-pit" id="pit-driver-exp" required>
                                <option value="">Select...</option>
                                <option value="1">1 year or less</option>
                                <option value="2">2 years</option>
                                <option value="3">3 years</option>
                                <option value="4">4 years</option>
                                <option value="5">5+ years</option>
                            </select>
                        </div>
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">Defense?</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="pit-defense">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" id="btn-submit-pit" style="margin-top: 1rem;">Submit Pit Data</button>
            </form>

            <form id="form-stands" class="scout-form" style="margin-top: 1.5rem; display: none;">
                <div class="scout-meta-bar">
                    <div class="scout-meta-field">
                        <label class="scout-label">Event</label>
                        <select class="scout-select" id="stands-event-id" required>
                            <option value="">Select Event...</option>
                            ${eventOptions}
                        </select>
                    </div>
                    <div class="scout-meta-field">
                        <label class="scout-label">Scouter Name</label>
                        <input class="scout-input" type="text" id="stands-scouter" required placeholder="Your name">
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Match Details</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Team Number</label>
                            <input class="scout-input" type="number" id="stands-team-num" required min="1">
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Match Type</label>
                            <select class="scout-select" id="stands-match-type" required>
                                <option value="">Select...</option>
                                <option value="qm">Quals (qm)</option>
                                <option value="sf">Playoff (sf)</option>
                                <option value="f">Finals (f)</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Match #</label>
                            <input class="scout-input" type="number" id="stands-match-num" required min="1">
                        </div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Auto</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Auto Start</label>
                            <select class="scout-select" id="stands-auto-start" required>
                                <option value="">Select...</option>
                                <option value="Center">Center</option>
                                <option value="Depot Side">Depot Side</option>
                                <option value="Human Player Side">Human Player Side</option>
                            </select>
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Auto End</label>
                            <select class="scout-select" id="stands-auto-end" required>
                                <option value="">Select...</option>
                                <option value="Mid">Mid</option>
                                <option value="Depot">Depot</option>
                                <option value="Human Player">Human Player</option>
                                <option value="Climb">Climb</option>
                                <option value="Just Shoot">Just Shoot</option>
                                <option value="None">None</option>
                            </select>
                        </div>
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">Auto Success?</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="stands-auto-success">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="scout-section">
                    <div class="scout-section-label">Teleop</div>
                    <div class="scout-fields">
                        <div class="scout-field">
                            <label class="scout-label">Cycles</label>
                            <input class="scout-input" type="number" id="stands-cycles" required min="0">
                        </div>
                        <div class="scout-field">
                            <label class="scout-label">Climb</label>
                            <select class="scout-select" id="stands-climb" required>
                                <option value="">Select...</option>
                                <option value="L1">L1</option>
                                <option value="L2">L2</option>
                                <option value="L3">L3</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">Defended?</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="stands-defended">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                        <div class="scout-field scout-field--checkbox">
                            <label class="scout-label">Broke Down?</label>
                            <label class="toggle-wrap">
                                <input type="checkbox" id="stands-broke-down">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                        <div class="scout-field scout-field--full" style="padding-bottom: 1.5rem;">
                            <label class="scout-label">Shot Consistency (1-10)</label>
                            <div style="display: flex; gap: 1.5rem; align-items: center; margin-top: 0.5rem;">
                                <input type="range" id="stands-shot-consist" min="1" max="10" value="5" style="flex: 1; cursor: pointer;">
                                <span id="stands-shot-val" class="mono" style="font-size: 1.2rem; font-weight: 600; color: var(--orange);">5</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" id="btn-submit-stands" style="margin-top: 1rem;">Submit Match Data</button>
            </form>
        </div>
    `;
}

function bindForm() {
    const tabPit    = document.getElementById("tab-pit");
    const tabStands = document.getElementById("tab-stands");
    const formPit   = document.getElementById("form-pit");
    const formStands = document.getElementById("form-stands");

    tabPit.addEventListener("click", () => {
        tabPit.classList.add("active");
        tabStands.classList.remove("active");
        formPit.style.display = "flex";
        formStands.style.display = "none";
    });

    tabStands.addEventListener("click", () => {
        tabStands.classList.add("active");
        tabPit.classList.remove("active");
        formStands.style.display = "flex";
        formPit.style.display = "none";
    });

    const shotSlider    = document.getElementById("stands-shot-consist");
    const shotSliderVal = document.getElementById("stands-shot-val");
    shotSlider.addEventListener("input", (e) => { shotSliderVal.textContent = e.target.value; });

    const resubmitToggle = document.getElementById("pit-is-resubmit");
    const reqFields = document.querySelectorAll(".req-pit");

    resubmitToggle.addEventListener("change", (e) => {
        reqFields.forEach(f => { f.required = !e.target.checked; });
    });

    formPit.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submit-pit");
        btn.disabled = true;
        btn.textContent = "Processing...";

        const eventId   = document.getElementById("pit-event-id").value;
        const teamNum   = parseInt(document.getElementById("pit-team-num").value);
        const scouter   = document.getElementById("pit-scouter").value.trim();
        const isResubmit = resubmitToggle.checked;

        const getVal = (id) => {
            const v = document.getElementById(id).value;
            return v === "" ? null : v;
        };

        let payload = {
            "Team Number":           teamNum,
            "Team Name":             getVal("pit-team-name"),
            "Team Location":         getVal("pit-team-loc"),
            "Robot Name":            getVal("pit-bot-name"),
            "Drive Train":           getVal("pit-drive-train"),
            "Fire Rate (Ball/Second)": getVal("pit-fire-rate") !== null ? parseFloat(getVal("pit-fire-rate")) : null,
            "Ball Capacity":         getVal("pit-ball-cap")   !== null ? parseFloat(getVal("pit-ball-cap"))   : null,
            "Intake Type":           getVal("pit-intake-type"),
            "Pick Up Method":        getVal("pit-pickup"),
            "Cycles":                getVal("pit-cycles")     !== null ? parseFloat(getVal("pit-cycles"))     : null,
            "L1":                    document.getElementById("pit-c-l1").checked,
            "L2":                    document.getElementById("pit-c-l2").checked,
            "L3":                    document.getElementById("pit-c-l3").checked,
            "Auton Climb":           document.getElementById("pit-c-auton").checked,
            "Time to Climb":         getVal("pit-climb-time") !== null ? parseFloat(getVal("pit-climb-time")) : null,
            "Climb Area":            getVal("pit-climb-area"),
            "Pref Start Spot":       getVal("pit-pref-start"),
            "Driver Exp":            getVal("pit-driver-exp") !== null ? parseInt(getVal("pit-driver-exp"))   : null,
            "Defense?":              document.getElementById("pit-defense").checked,
        };

        Object.keys(payload).forEach(k => { if (payload[k] === null) delete payload[k]; });

        try {
            if (isResubmit) {
                const { data: existing, error: fetchErr } = await supabase
                    .from(`${eventId}-pit`).select("*").eq("Team Number", teamNum).single();
                if (fetchErr) throw new Error(`Could not find team ${teamNum} in table ${eventId} to resubmit.`);

                const existingScouters = existing.Scouters ? existing.Scouters.split(", ") : [];
                if (!existingScouters.includes(scouter)) existingScouters.push(scouter);
                payload.Scouters = existingScouters.join(", ");

                const { error: upErr } = await supabase
                    .from(`${eventId}-pit`).update(payload).eq("Team Number", teamNum);
                if (upErr) throw upErr;
                alert("Pit resubmission successful!");
            } else {
                payload.Scouters = scouter;
                const { error: inErr } = await supabase.from(`${eventId}-pit`).insert([payload]);
                if (inErr) throw inErr;
                alert("New pit entry saved!");
            }

            const cachedEvent   = document.getElementById("pit-event-id").value;
            const cachedScouter = document.getElementById("pit-scouter").value;
            formPit.reset();
            document.getElementById("pit-event-id").value  = cachedEvent;
            document.getElementById("pit-scouter").value   = cachedScouter;

        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.textContent = "Submit Pit Data";
        }
    });

    formStands.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submit-stands");
        btn.disabled = true;
        btn.textContent = "Processing...";

        const eventId  = document.getElementById("stands-event-id").value;
        const matchStr = `${document.getElementById("stands-match-type").value}${document.getElementById("stands-match-num").value}`;
        const climbVal = document.getElementById("stands-climb").value;

        const payload = {
            "Team Number":     parseInt(document.getElementById("stands-team-num").value),
            "Match":           matchStr,
            "Scouters":        document.getElementById("stands-scouter").value.trim(),
            "Auto Start":      document.getElementById("stands-auto-start").value,
            "Auto End":        document.getElementById("stands-auto-end").value,
            "Auto Success":    document.getElementById("stands-auto-success").checked,
            "Cycles":          parseInt(document.getElementById("stands-cycles").value),
            "Climb":           climbVal,
            "Climbed?":        ["L1", "L2", "L3"].includes(climbVal), // Logic added here
            "Defended?":       document.getElementById("stands-defended").checked,
            "Broke Down?":     document.getElementById("stands-broke-down").checked,
            "Shot Consistency": parseInt(document.getElementById("stands-shot-consist").value),
        };

        try {
            const { error: inErr } = await supabase.from(`${eventId}-stands`).insert([payload]);
            if (inErr) throw inErr;
            alert(`Match ${matchStr} data saved successfully!`);

            const cachedEvent   = document.getElementById("stands-event-id").value;
            const cachedScouter = document.getElementById("stands-scouter").value;
            const cachedType    = document.getElementById("stands-match-type").value;
            formStands.reset();
            document.getElementById("stands-event-id").value    = cachedEvent;
            document.getElementById("stands-scouter").value     = cachedScouter;
            document.getElementById("stands-match-type").value  = cachedType;
            shotSliderVal.textContent = "5";

        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.textContent = "Submit Match Data";
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
