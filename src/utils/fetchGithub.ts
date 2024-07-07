import axios from "axios";
import { delay } from "./delay";

export const fetchGithub = async (
	itemNames: string[],
	price?: number,
): Promise<{ [key: string]: any }[]> => {
	let items: { [key: string]: any }[] = [];

	for (const itemName of itemNames) {
		const githubFileUrl = `${process.env.WFM_ITEMs_PATH}${itemName}.json`;
		const response = await axios.get(githubFileUrl).catch(() => {});
		if (!response) continue;

		await delay(Number(process.env.GITHUB_FETCH_DELAY));

		console.log(
			`${response.data.i18n.en.item_name} ${
				response.data.tags.includes("mod") ? "✔️" : "❌"
			}`,
		);

		try {
			if (!response.data.tags.includes("mod")) continue;

			const item = {
				id: response.data._id || "",
				item_name: response.data.i18n.en.item_name || "",
				url_name: response.data.url_name || "",
				price,
			};
			items.push(item);
		} catch {
			continue;
		}
	}

	return items;
};
