import axios from "axios";
import { token } from "./settings.json";
import { items } from "./items.json";
import { NEW_LOKA, RED_VEIL, THE_PERRIN_SEQUENCE } from "./mods.json";
import inquirer from "inquirer";
import inquirerPrompt from "inquirer-autocomplete-prompt";
import fuzzy from "fuzzy";

const BASE_URL = "https://api.warframe.market/v1";
const DELAY = 500;

(async () => {
	console.clear();
	// ? Utils
	const timer = (ms) => new Promise((res) => setTimeout(res, ms));
	inquirer.registerPrompt("autocomplete", inquirerPrompt);
	const removeDuplicates = (array: string[]) => {
		return array.filter((item, index) => array.indexOf(item) === index);
	};

	const { todo } = await inquirer.prompt({
		type: "confirm",
		message: "Do you want to search mods?",
		name: "todo",
	});

	console.clear();
	if (todo) {
		const array = removeDuplicates([
			...NEW_LOKA.map((a) => a.item_name),
			...RED_VEIL.map((a) => a.item_name),
			...THE_PERRIN_SEQUENCE.map((a) => a.item_name),
		]);

		const searchAlgorithm = (answers, input = "") => {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(fuzzy.filter(input, array).map((el) => el.original));
				}, Math.random() * 470 + 30);
			});
		};

		const searchMods = async () => {
			const { mod } = await inquirer.prompt({
				// @ts-ignore
				type: "autocomplete",
				name: "mod",
				message: "Mod name:",
				source: searchAlgorithm,
			});

			console.clear();
			const syndis: string[] = [];
			console.log("\n\x1b[33mMod is available in:\x1b[0m\n");
			if (NEW_LOKA.find((m) => m.item_name === mod)) syndis.push("\x1b[32mNew Loka\x1b[0m");
			if (RED_VEIL.find((m) => m.item_name === mod)) syndis.push("\x1b[31mRed Veil\x1b[0m");
			if (THE_PERRIN_SEQUENCE.find((m) => m.item_name === mod))
				syndis.push("\x1b[36mThe Perrin Sequence\x1b[0m");
			console.log(syndis.join(" - "));
			console.log("\n");
			searchMods();
		};

		searchMods();

		return;
	}

	const { syndicates } = await inquirer.prompt({
		type: "checkbox",
		message: "Select Syndicates",
		name: "syndicates",
		choices: [
			{
				name: "New LOKA",
				value: "NEW_LOKA",
			},
			{
				name: "Red Veil",
				value: "RED_VEIL",
			},
			{
				name: "The Perrin Sequence",
				value: "THE_PERRIN_SEQUENCE",
			},
		],
	});

	// ? Create manager
	const market = axios.create({
		baseURL: BASE_URL,
		timeout: 1000,
		headers: {
			"content-type": "application/json",
			accept: "application/json",
			platform: "pc",
			language: "en",
			authorization: `JWT ${token}`,
		},
	});

	// ! Decide what to show on website
	let modsToAdd: string[] = [];
	if (syndicates.includes("NEW_LOKA")) {
		modsToAdd = modsToAdd.concat(NEW_LOKA.map((mod) => mod.id));
		console.log(`✨ Added \x1b[33m${NEW_LOKA.length}\x1b[32m New Loka\x1b[0m mods to the queue!`);
	}
	if (syndicates.includes("RED_VEIL")) {
		modsToAdd = modsToAdd.concat(RED_VEIL.map((mod) => mod.id));
		console.log(`✨ Added \x1b[33m${RED_VEIL.length}\x1b[31m Red Veil\x1b[0m mods to the queue!`);
	}
	if (syndicates.includes("THE_PERRIN_SEQUENCE")) {
		modsToAdd = modsToAdd.concat(THE_PERRIN_SEQUENCE.map((mod) => mod.id));
		console.log(
			`✨ Added \x1b[33m${THE_PERRIN_SEQUENCE.length}\x1b[36m The Perrin Sequence\x1b[0m mods to the queue!`
		);
	}
	modsToAdd = removeDuplicates(modsToAdd);
	const syndiArray = [
		...NEW_LOKA.map((el) => el.id),
		...RED_VEIL.map((el) => el.id),
		...THE_PERRIN_SEQUENCE.map((el) => el.id),
	];
	console.log(`\n- Preparing finished! -\n`);

	// ! remove every thing
	const orders = await market.get("profile/Major.Amari/orders").then((orders) => {
		return orders.data.payload.sell_orders;
	});
	for (const order of orders) {
		if (syndiArray.includes(order.item.id)) {
			await timer(DELAY);
			console.log("❌ " + order.item.en.item_name + " \x1b[31mdeleted\x1b[0m!");
			const del = async () => {
				await market.delete("profile/orders/" + order.id).catch(async (err) => {
					del();
					console.log("failed 503 and retrying");
				});
			};
			del();
		}
	}
	console.log(`\n- Deleting finished! -\n`);
	// ? Add new cards
	for (const mod of modsToAdd) {
		await timer(DELAY);
		console.log("✅ " + items.find((item) => item.id === mod)?.item_name + " \x1b[32madded\x1b[0m!");
		const add = async () => {
			await market
				.post("/profile/orders", {
					order_type: "sell",
					item_id: mod,
					platinum: 15,
					visible: true,
					quantity: 1,
					rank: 0,
				})
				.catch(async (err) => {
					add();
				});
		};
		add();
	}
	console.log(`\n- Adding finished! -\n`);
})();

// const items = await market.get("/items");
// console.log(items.data.payload);

// JSON.stringify(items.data.payload);

// fs.writeFile("output.json", JSON.stringify(items.data.payload), "utf8", function (err) {
// 	if (err) {
// 		console.log("An error occured while writing JSON Object to File.");
// 		return console.log(err);
// 	}

// 	console.log("JSON file has been saved.");
// });
