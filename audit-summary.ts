// audit-summary.ts
const raw = await Deno.readTextFile("results.json");
const reports: any[] = JSON.parse(raw);

const issues = new Map<string, Set<string>>();

for (const report of reports) {
    const audits = report.audits ?? {};
    for (const [auditId, audit] of Object.entries(audits)) {
        if (audit.score === 1 || audit.score === null) continue;

        const details = audit.details;
        if (!details?.items) continue;

        for (const item of details.items) {
            const selector =
                item.node?.selector ||
                item.node?.snippet ||
                item.node?.nodeLabel ||
                JSON.stringify(item.node); // fallback

            if (!selector) continue;

            if (!issues.has(auditId)) issues.set(auditId, new Set());
            issues.get(auditId)?.add(selector);
        }
    }
}

// Print summary
for (const [auditId, nodes] of issues.entries()) {
    console.log(`${auditId}: ${nodes.size} unique element(s)`);
}

// Optional: write to CSV
const rows = [["id", "count"]];
for (const [auditId, nodes] of issues.entries()) {
    rows.push([auditId, String(nodes.size)]);
}
await Deno.writeTextFile("summary.csv", rows.map(r => r.join(",")).join("\n"));
console.log("✅ Saved summary.csv");
