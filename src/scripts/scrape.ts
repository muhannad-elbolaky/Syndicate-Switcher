import { firefox } from "playwright-firefox";
import fetchSettings from "../data/fetch_settings.json";
import { formatNames } from "../utils/formatNames";
import { filterItems } from "../utils/filterItems";
import { delay } from "../utils/delay";

type Standing = [
	{
		id: string;
		name: string;
		selector: string;
		price: number;
	},
];

const fetchSettingsTyped = fetchSettings as Standing;

for (const standing of fetchSettingsTyped) {
	// ? Launch the browser and create context
	const browser = await firefox.launch({
		headless: process.env.IS_HEADLESS === "true" ? true : false,
	});

	const context = await browser.newContext({
		viewport: { width: 1080, height: 720 },
		isMobile: false,
	});

	const page = await context.newPage();

	try {
		await page.goto(`${process.env.BASE_WIKI_URI}${standing.id}`, {
			timeout: 120000,
		});

		// ? Wait for the toggle element to appear and click to expand
		await page.waitForSelector(`.mw-customtoggle-${standing.selector}`);
		await page.click(`.mw-customtoggle-${standing.selector}`);

		// ? Wait for a brief moment for content to load after expanding
		await page.waitForTimeout(1000);

		// ? Extract titles of the cards using XPath
		const cardTitles = await page.$$eval(
			`//*[@id="mw-customcollapsible-${standing.selector}"]/div/div/div/a/span`,
			(elements) => elements.map((el) => el.textContent),
		);

		const formatedNames = formatNames(cardTitles);
		const items = await filterItems(formatedNames, standing.price);

		await Bun.write(
			`src/data/items/${standing.id}.json`,
			JSON.stringify(items, null, 2),
		);
	} catch (error) {
		console.error("Error during scraping:", error);
	} finally {
		await browser.close();
		await delay(20000);
	}
}
