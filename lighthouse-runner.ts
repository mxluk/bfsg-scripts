// lighthouse-runner.ts
const urls = (await Deno.readTextFile("urls.txt"))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const results: unknown[] = [];

for (const url of urls) {
    console.log(`Running Lighthouse for ${url}...`);

    const slug = url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]/gi, "_");
    const outPath = `tmp-${slug}.json`;

    const p = Deno.run({
        cmd: [
            "lighthouse",
            url,
            "--output=json",
            `--output-path=${outPath}`,
            "--only-categories=accessibility",
            "--quiet",
            "--chrome-flags=--headless"
        ],
        stdout: "null",
        stderr: "piped",
    });

    const { success } = await p.status();
    if (!success) {
        const error = new TextDecoder().decode(await p.stderrOutput());
        console.warn(`Failed for ${url}: ${error}`);
        continue;
    }

    try {
        const report = JSON.parse(await Deno.readTextFile(outPath));
        results.push({
            url,
            audits: report.audits,
            score: report.categories.accessibility.score
        });
        await Deno.remove(outPath);
    } catch (e) {
        console.warn(`Failed to parse or clean up ${outPath}:`, e);
    }
}

await Deno.writeTextFile("results.json", JSON.stringify(results, null, 2));
console.log(`✅ Saved ${results.length} reports to results.json`);
