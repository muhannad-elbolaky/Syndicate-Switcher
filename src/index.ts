require("dotenv").config();
import axios from "axios";
import inquirer from "inquirer";
import inquirerPrompt from "inquirer-autocomplete-prompt";
import fuzzy from "fuzzy";
import { items } from "./data/items.json";
import { authorization, username } from "./data/token_data.json";
import { NEW_LOKA, RED_VEIL, THE_PERRIN_SEQUENCE, ARBITERS_OF_HEXIS } from "./data/mods.json";
import { writeFile } from "fs/promises";
import { resolve } from "path";

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
			...ARBITERS_OF_HEXIS.map((a) => a.item_name),
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
			if (ARBITERS_OF_HEXIS.find((m) => m.item_name === mod)) syndis.push("\x1b[33mArbiters Of Hexis\x1b[0m");
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
			{
				name: "Arbiters Of Hexis",
				value: "ARBITERS_OF_HEXIS",
			},
		],
	});

	// ? Create manager
	const market = axios.create({
		baseURL: process.env.BASE_URL,
		timeout: 1000,
		headers: {
			"content-type": "application/json",
			accept: "application/json",
			platform: "pc",
			language: "en",
			authorization,
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
	if (syndicates.includes("ARBITERS_OF_HEXIS")) {
		modsToAdd = modsToAdd.concat(ARBITERS_OF_HEXIS.map((mod) => mod.id));
		console.log(
			`✨ Added \x1b[33m${ARBITERS_OF_HEXIS.length}\x1b[33m Arbiters Of Hexis\x1b[0m mods to the queue!`
		);
	}
	modsToAdd = removeDuplicates(modsToAdd);
	const syndiArray = [
		...NEW_LOKA.map((el) => el.id),
		...RED_VEIL.map((el) => el.id),
		...THE_PERRIN_SEQUENCE.map((el) => el.id),
		...ARBITERS_OF_HEXIS.map((el) => el.id),
	];
	console.log(`\n- Preparing finished! -\n`);

	// ! remove every thing
	const orders = await market
		.get(`profile/${username}/orders`)
		.then((orders) => {
			return orders.data.payload.sell_orders;
		})
		.catch(async (err) => {
			await createToken();
		});

	for (const order of orders) {
		if (syndiArray.includes(order.item.id)) {
			await timer(process.env.DELAY);
			console.log("❌ " + order.item.en.item_name + " \x1b[31mdeleted\x1b[0m!");
			const del = async () => {
				await market.delete("profile/orders/" + order.id).catch(async (err) => {
					console.log(err.response.status);
					if (err.response.status === 401) {
						await createToken();
					}
					setTimeout(async () => {
						await del();
					}, 1000);
					console.log("failed 503 and retrying");
				});
			};
			del();
		}
	}
	console.log(`\n- Deleting finished! -\n`);
	// ? Add new cards
	for (const mod of modsToAdd) {
		await timer(process.env.DELAY);
		console.log("✅ " + items.find((item) => item.id === mod)?.item_name + " \x1b[32madded\x1b[0m!");
		const add = async () => {
			await market
				.post("/profile/orders", {
					order_type: "sell",
					item_id: mod,
					platinum: process.env.PRICE,
					visible: true,
					quantity: 1,
					rank: 0,
				})
				.catch(async (err) => {
					if (err.response.status === 401) {
						await createToken();
					}
					setTimeout(async () => {
						await add();
					}, 1000);
					console.log("failed 503 and retrying");
				});
		};
		add();
	}
	console.log(`\n- Adding finished! -\n`);
})();

async function createToken() {
	console.log("\x1b[31m -- Error: No token found, \x1b[33m Don't worry I'll create one... --");

	const signin = await axios({
		method: "post",
		url: `${process.env.BASE_URL}/auth/signin`,
		data: {
			auth_type: "header",
			email: process.env.EMAIL,
			password: process.env.PASSWORD,
		},
		headers: {
			Authorization: "JWT",
			language: "en",
			accept: "application/json",
			platform: "pc",
			auth_type: "header",
		},
	});
	const { authorization } = signin.headers;
	const username = signin.data.payload.user.ingame_name;
	await writeFile(
		resolve(__dirname, "./data/token_data.json"),
		JSON.stringify(
			{
				authorization,
				username,
			},
			null,
			2
		)
	);

	console.log("\x1b[32m -- Done! please try again it should work fine this time -- \x1b[0m");
	process.exit();
}
