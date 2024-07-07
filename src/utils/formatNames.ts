export const formatNames = (names: (string | null)[]): string[] => {
	return names
		.filter(
			(name): name is string =>
				typeof name === "string" &&
				!name.toLowerCase().includes("sigil") &&
				!name.toLowerCase().includes("relic pack"),
		)
		.map((name) => name.replace(/\([^)]*\)/g, "").trim())
		.filter((name) => name.length > 0);
};
