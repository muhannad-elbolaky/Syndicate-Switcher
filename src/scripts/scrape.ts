import {firefox} from "playwright-firefox";
import fetchSettings from "../data/fetch_settings.json";
import {formatNames} from "../utils/formatNames";
import {filterItems} from "../utils/filterItems";
import {delay} from "../utils/delay";

type Standing = [
    {
        id: string;
        name: string;
        selector: string;
        price: number;
    }
];

const fetchSettingsTyped = fetchSettings as Standing;

(async () => {
    console.log("🚀 Starting scrape process for all standings...");

    for (const standing of fetchSettingsTyped) {
        console.log(`\n🔎 === Processing ${standing.name} (ID: ${standing.id}) ===`);

        // Launching browser
        console.log("🌐 Launching browser...");
        const browser = await firefox.launch({
            headless: process.env.IS_HEADLESS === "true",
        });
        console.log("🟢 Browser launched.");

        const context = await browser.newContext({
            viewport: {width: 1080, height: 720},
            isMobile: false,
        });
        console.log("🖼️  Context created.");

        const page = await context.newPage();
        console.log("📄 New page opened.");

        try {
            // Navigation
            const url = `${process.env.BASE_WIKI_URI}${standing.id}`;
            console.log(`🔗 Navigating to URL: ${url}`);
            await page.goto(url, {timeout: 120000});
            console.log("🟢 Page loaded.");

            // Toggle section
            const toggleSelector = `.mw-customtoggle-${standing.selector}`;
            console.log("🔄 Waiting for toggle selector...");
            await page.waitForSelector(toggleSelector);
            console.log(`🟢 Toggle found: ${toggleSelector}`);

            console.log("🔘 Clicking toggle to expand...");
            await page.click(toggleSelector);
            console.log("🟢 Toggle clicked.");

            console.log("⏳ Waiting for content to load...");
            await page.waitForTimeout(1000);

            // Read cards
            const containerSelector = `#mw-customcollapsible-${standing.selector}`;
            console.log(`🔍 Locating cards inside: ${containerSelector}`);
            await page.waitForSelector(containerSelector);

            const cards = page.locator(
                `${containerSelector} .flex-container > div[style*="position:relative"]`
            );

            const count = await cards.count();
            console.log(`📦 Found ${count} cards.`);

            const names: string[] = [];

            for (let i = 0; i < count; i++) {
                const nameSpan = cards
                    .nth(i)
                    .locator('div[style*="bottom:0px"] a span');
                const text = (await nameSpan.textContent())?.trim();
                if (text) {
                    names.push(text);
                    console.log(`  • [${i + 1}] ${text}`);
                }
            }

            // Clean & Filter
            console.log("🧽 Formatting names...");
            const formattedNames = formatNames(names);

            console.log(`💰 Filtering items with price ≥ ${standing.price}p...`);
            const items = await filterItems(formattedNames, standing.price);
            console.log(`📉 Filtered down to ${items.length} items.`);

            // Write output
            const outputPath = `src/data/items/${standing.id}.json`;
            console.log(`💾 Writing items to file: ${outputPath}`);
            await Bun.write(outputPath, JSON.stringify(items, null, 2));
            console.log("📁 Write complete.");
        } catch (error) {
            console.error("❌ Error during scraping:", error);
        } finally {
            // Teardown
            console.log("🛑 Closing browser...");
            await browser.close();
            console.log("🟢 Browser closed.");

            console.log("⏱️ Delaying before next search (20s)...");
            await delay(20000);
            console.log("🕒 Delay finished.");
        }
    }

    console.log("🏁 All standings processed. Scraping complete.");
})();
