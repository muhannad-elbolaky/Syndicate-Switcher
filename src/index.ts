import axios from "axios";
import inquirer from "inquirer";
import inquirerPrompt from "inquirer-autocomplete-prompt";

import fetchSettings from "./data/fetch_settings.json";
import Chipper from "./data/items/Chipper.json";
import New_Loka from "./data/items/New_Loka.json";
import Red_Veil from "./data/items/Red_Veil.json";
import The_Perrin_Sequence from "./data/items/The_Perrin_Sequence.json";

import { writeFile } from "fs/promises";
import { resolve } from "path";
import { existsSync, writeFileSync } from "fs";

type Items = Array<{
	item_name: string;
	url_name: string;
	id: string;
	price?: number;
}>;

const items: Items = [
	...Chipper,
	...New_Loka,
	...Red_Veil,
	...The_Perrin_Sequence,
];

const BASE_URL = "https://api.warframe.market/v1";

type TokenData = {
	authorization: string;
	username: string;
};
let tokenData: TokenData;

const tokenFile = resolve(__dirname, "./data/token_data.json");

if (existsSync(tokenFile)) {
	tokenData = require("./data/token_data.json");
} else {
	const initialData = {
		authorization: "",
		username: "",
	};
	writeFileSync(tokenFile, JSON.stringify(initialData, null, 2));
	console.log("D create token");

	await createToken();
	process.exit(0);
}

console.clear();
// ? Utils
const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));
inquirer.registerPrompt("autocomplete", inquirerPrompt);
const removeDuplicates = (array: Items) => {
	return array.filter((item, index) => array.indexOf(item) === index);
};

const choices = fetchSettings.map((item) => {
	return {
		name: item.name,
		value: item.id,
	};
});

const { syndicates } = await inquirer.prompt({
	type: "checkbox",
	message: "Select Syndicates",
	name: "syndicates",
	choices,
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
		authorization: tokenData.authorization,
	},
});

// ! Decide what to show on website
let modsToAdd: any[] = [];
if (syndicates.includes("Chipper")) {
	modsToAdd = modsToAdd.concat(Chipper.map((mod) => mod.id));
	console.log(
		`✨ Added \x1b[33m${Chipper.length}\x1b[32m Chipper\x1b[0m mods to the queue!`,
	);
}
if (syndicates.includes("New_Loka")) {
	modsToAdd = modsToAdd.concat(New_Loka.map((mod) => mod.id));
	console.log(
		`✨ Added \x1b[33m${New_Loka.length}\x1b[32m New Loka\x1b[0m mods to the queue!`,
	);
}
if (syndicates.includes("Red_Veil")) {
	modsToAdd = modsToAdd.concat(Red_Veil.map((mod) => mod.id));
	console.log(
		`✨ Added \x1b[33m${Red_Veil.length}\x1b[31m Red Veil\x1b[0m mods to the queue!`,
	);
}
if (syndicates.includes("The_Perrin_Sequence")) {
	modsToAdd = modsToAdd.concat(The_Perrin_Sequence.map((mod) => mod.id));
	console.log(
		`✨ Added \x1b[33m${The_Perrin_Sequence.length}\x1b[36m The Perrin Sequence\x1b[0m mods to the queue!`,
	);
}

modsToAdd = removeDuplicates(modsToAdd);
const syndiArray = [
	...Chipper.map((el) => el.id),
	...New_Loka.map((el) => el.id),
	...Red_Veil.map((el) => el.id),
	...The_Perrin_Sequence.map((el) => el.id),
];
console.log(`\n- Preparing finished! -\n`);

// ! remove every thing
const orders = await market
	.get(`profile/${tokenData.username}/orders`)
	.then((orders) => {
		return orders.data.payload.sell_orders;
	})
	.catch(async (err) => {
		console.log("A create token", err);

		await createToken();
	});

for (const order of orders) {
	if (syndiArray.includes(order.item.id)) {
		await timer(Number(process.env.DELAY));
		console.log("❌ " + order.item.en.item_name + " \x1b[31mdeleted\x1b[0m!");
		const del = async () => {
			await market.delete("profile/orders/" + order.id).catch(async (err) => {
				console.log(err.response.status);
				if (err.response.status === 401) {
					console.log("B create token");

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
	await timer(Number(process.env.DELAY));
	console.log(
		"✅ " +
			items.find((item) => item.id === mod)?.item_name +
			" \x1b[32madded\x1b[0m!",
	);
	const add = async () => {
		await market
			.post("/profile/orders", {
				order_type: "sell",
				item_id: mod,
				platinum: items.find((item) => item.id === mod)?.price || process.env.PRICE,
				visible: true,
				quantity: 7,
				rank: 0,
			})
			.catch(async (err) => {
				if (err.response.status === 401) {
					console.log("C create token");

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

async function createToken() {
	console.log(
		"\x1b[31m -- Error: No token found, \x1b[33m Don't worry I'll create one... --",
	);

	const signin = await axios({
		method: "post",
		url: `${BASE_URL}/auth/signin`,
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
			2,
		),
	);

	console.log(
		"\x1b[32m -- Done! please try again it should work fine this time -- \x1b[0m",
	);
	process.exit();
}
