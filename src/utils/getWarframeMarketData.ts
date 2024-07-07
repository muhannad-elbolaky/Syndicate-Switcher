import axios from "axios";

export const getWarframeMarketData = async (): Promise<string[]> => {
	const apiUrl = "https://api.warframe.market/v1/items";

	try {
		const response = await axios.get(apiUrl);

		if (response.status === 200) {
			const items = response.data.payload.items;
			const itemNames = items.map((item: any) => item.item_name);
			return itemNames;
		} else {
			console.error(
				`Failed to fetch data: ${response.status} - ${response.statusText}`,
			);
			return [];
		}
	} catch (error) {
		console.error("Error fetching data:", error);
		throw error;
	}
};
