import { supabase } from "../app.js";

export default async function Home() {
    const { data, error } = await supabase.from("scoutsheet").select("*");

    if (error) {
        return `<div class="page"><p>Error loading data: ${error.message}</p></div>`;
    }

    if (!data || data.length === 0) {
        return `<div class="page"><p>No data found.</p></div>`;
    }

    // Build headers from the first row's keys
    const columns = Object.keys(data[0]);
    const headerRow = columns.map(col => `<th>${col}</th>`).join("");

    // Build data rows
    const bodyRows = data.map(row =>
        `<tr>${columns.map(col => `<td>${row[col] ?? ""}</td>`).join("")}</tr>`
    ).join("");

    return `
        <div class="page">
            <table class="sn-pro">
                <thead><tr>${headerRow}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </div>
    `;
}