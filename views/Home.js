import { supabase } from "../app.js";

export default async function Home() {
    const { data, error } = await supabase.from("scoutsheet").select("*");

    if (error) {
        return `<div class="page"><p class="state-msg error">Error loading data: ${error.message}</p></div>`;
    }

    if (!data || data.length === 0) {
        return `<div class="page"><p class="state-msg">No data found.</p></div>`;
    }

    const columns = Object.keys(data[0]);
    const headerRow = columns.map(col => `<th>${col}</th>`).join("");

    const buildRows = (rows) =>
        rows.length === 0
            ? `<tr><td colspan="${columns.length}" class="state-msg">No matching results.</td></tr>`
            : rows.map(row =>
                `<tr>${columns.map(col => {
                    const val = row[col] ?? "";
                    return `<td>${val === "" ? `<span class="null-cell">—</span>` : val}</td>`;
                }).join("")}</tr>`
            ).join("");

    const allRows = buildRows(data);

    // Attach search logic after render
    setTimeout(() => {
        const input = document.getElementById("sn-search");
        const tbody = document.getElementById("sn-tbody");

        input?.addEventListener("input", () => {
            const q = input.value.toLowerCase().trim();
            const filtered = q
                ? data.filter(row =>
                    columns.some(col => String(row[col] ?? "").toLowerCase().includes(q))
                )
                : data;
            tbody.innerHTML = buildRows(filtered);
        });
    }, 0);

    return `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Scout Sheet</h1>
            </div>
            <div class="search-bar">
                <input
                    id="sn-search"
                    type="text"
                    placeholder="Search across all columns…"
                    autocomplete="off"
                />
            </div>
            <div class="table-wrap">
                <table class="sn-pro">
                    <thead><tr>${headerRow}</tr></thead>
                    <tbody id="sn-tbody">${allRows}</tbody>
                </table>
            </div>
        </div>
    `;
}