import axios from "axios";
import { authorization, username } from "../data/token_data.json";

const BASE_URL = "https://api.warframe.market/v1";

// Create manager
const market = axios.create({
	baseURL: BASE_URL,
	timeout: 1000,
	headers: {
		"content-type": "application/json",
		accept: "application/json",
		platform: "pc",
		language: "en",
		authorization,
	},
});

const delay = async (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

(async () => {
	try {
		while (true) {
			const response = await market.get(`/profile/${username}/orders`);
			const orders = response.data.payload.sell_orders;

			for (const order of orders) {
				// Hide the order
				await market.put(`/profile/orders/${order.id}`, {
					order_id: order.id,
					visible: false,
				});

				// Wait for the specified delay
				await delay(1000);

				// Show the order
				await market.put(`/profile/orders/${order.id}`, {
					order_id: order.id,
					visible: true,
				});

				console.log(`✅ ${order.item.en.item_name} Refreshed!`);
			}

			console.log("===============");

			// Wait for the interval period before processing again
			await delay(2 * 60 * 1000);
		}
	} catch (error) {
		console.error("Error fetching orders:", error);
	}
})();
