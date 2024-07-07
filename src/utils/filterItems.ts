import { fetchGithub } from "./fetchGithub";
import { findCommonElements } from "./findCommonElements";
import { getWarframeMarketData } from "./getWarframeMarketData";

export const filterItems = async (
	wikiNames: string[],
	price?: number,
): Promise<{ [key: string]: any }[]> => {
	const wfmItems = await getWarframeMarketData();
	const unfilterItems = findCommonElements(wfmItems, wikiNames);
	const filteredItems = await fetchGithub(unfilterItems, price);
	return filteredItems;
};
