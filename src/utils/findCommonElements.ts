export const findCommonElements = (
	array1: string[],
	array2: string[],
): string[] => {
	const set1 = new Set(array1);
	const set2 = new Set(array2);

	const intersection = Array.from(set1).filter((element) => set2.has(element));

	return intersection;
};
