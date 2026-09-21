import type { ApiColumnData, ApiRowData, CellCoordinates } from '@/canvas/types.ts';

export const defaultRowHeight = 20;
export const defaultColumnWidth = 64;

const defaultApiRowItem = (index: number): ApiRowData => ({
	index,
	height: defaultRowHeight,
	cells: [],
	cssClass: '',
});

const defaultApiColumnItem = (index: number): ApiColumnData => ({
	index,
	width: defaultColumnWidth,
	cssClass: '',
});

const fillOutAxis = <T extends ApiRowData | ApiColumnData>(
	items: T[],
	generator: (index: number) => T,
): T[] => {
	const filled = Array<T>(items[items.length - 1]!.index + 1);
	if (items.length <= 0) return [];

	let lastIndex = 0;

	for (const item of items) {
		for (lastIndex; lastIndex < item.index; ++lastIndex) {
			filled[lastIndex] = generator(lastIndex);
		}
		filled[lastIndex++] = item;
	}

	return filled;
};

export const fillOutRows = (items: ApiRowData[]): ApiRowData[] =>
	fillOutAxis(items, defaultApiRowItem);

export const fillOutColumns = (items: ApiColumnData[]): ApiColumnData[] =>
	fillOutAxis(items, defaultApiColumnItem);

export type GridOffset = {
	index: number;
	start: number;
	size: number;
	end: number;
};

export const toRowOffsets = (items: ApiRowData[]): GridOffset[] => {
	if (items.length <= 0) return [];

	const filled = fillOutRows(items);
	const offsets = Array<GridOffset>(filled.length);

	offsets[0] = {
		index: 0,
		start: 0,
		size: filled[0]!.height,
		end: filled[0]!.height,
	};

	for (const item of filled.slice(1)) {
		const { index, height: size } = item;
		offsets[index] = {
			index,
			size,
			start: offsets[index - 1]!.end,
			end: offsets[index - 1]!.end + size,
		};
	}

	return offsets;
};
