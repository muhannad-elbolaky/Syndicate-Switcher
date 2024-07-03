import axios from "axios";
import { authorization, username } from "./data/token_data.json";

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
		setInterval(async () => {
			const response = await market.get(`/profile/${username}/orders`);
			const orders = response.data.payload.sell_orders;

			for (const order of orders) {
				const changedOrder = await market.put(`/profile/orders/${order.id}`, {
					order_id: order.id,
					visible: false,
				});

				await delay(1000);

				await market.put(`/profile/orders/${order.id}`, {
					order_id: order.id,
					visible: true,
				});

				console.log(
					`✅ ${changedOrder.data.payload.order.item.en.item_name} Refeshed!`,
				);
			}

			console.log("===============");
		}, 3 * 60 * 1000);
	} catch (error) {
		console.error("Error fetching orders:", error);
	}
})();
