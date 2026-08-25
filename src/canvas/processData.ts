import {
	type ApiColumnData,
	type ApiDocumentData,
	type ApiSheetData,
	type Column,
	type DocumentData,
	type Row,
	type Sheet,
	SheetType,
} from './types.ts';
import { RangeTree } from '@/structures/range/rangeTree.ts';
import type { GridOffset } from '@/structures/utilities.ts';
import { DEFAULT_CELL_HEIGHT, DEFAULT_CELL_WIDTH } from '@/canvas/constants.ts';

const emptyColumn = (index: number, widthOffset: number): Column => ({
	index,
	width: DEFAULT_CELL_WIDTH,
	cssClass: '',
	widthOffset,
	hidden: false,
});

const createEmptyColumns = (startIndex: number, startOffset: number, count: number): Column[] => {
	const toColumn = (_x: number, n: number): Column =>
		emptyColumn(startIndex + n, startOffset + n * DEFAULT_CELL_WIDTH);
	return Array(count).fill(0).map(toColumn);
};

const nextWidthOffset = (c?: Column) => (c ? c.widthOffset + c.width : 0);

const toColumn = (c: ApiColumnData, previous?: Column): Column => ({
	...c,
	widthOffset: nextWidthOffset(previous),
	hidden: false,
});

const processColumns = (columns: ApiColumnData[]): Column[] => {
	const sorted = columns.toSorted((l, r) => l.index - r.index);
	const ary = Array<Column>((sorted.at(-1)?.index ?? -1) + 1);

	let widthOffset = 0;
	let nextIndex = 0;

	for (const apiColumn of sorted) {
		const missingCount = apiColumn.index - nextIndex;
		const missingColumns = createEmptyColumns(nextIndex, widthOffset, missingCount);

		const previous = missingColumns.at(-1) ?? ary.at(-1);
		const column = toColumn(apiColumn, previous);

		ary.splice(nextIndex, missingColumns.length + 1, ...missingColumns, column);

		nextIndex = column.index + 1;
		widthOffset = nextWidthOffset(column);
	}

	return ary;
};

const processSheet = (s: ApiSheetData): Sheet => {
	if (s.$type === SheetType.Chart) return { ...s };

	const rows = s.rows.map(
		(r, i): Row => ({
			...r,
			heightOffset: i * DEFAULT_CELL_HEIGHT,
			hidden: false,
		}),
	);

	const columns = processColumns(s.columns);

	return {
		...s,
		rows,
		columns,
		comments: [],
		sheetObjects: [],
		columnOffset: 0,
		cssClass: '',
		cssClassDictionary: {},
		maxColumn: columns.length,
		maxRow: rows.length,
	};
};

export const process = (raw: ApiDocumentData): DocumentData => {
	return {
		sheets: raw.sheets.map(processSheet),
	};
};

const columnToOffset = (column: Column): GridOffset => ({
	index: column.index,
	start: column.widthOffset,
	end: column.widthOffset + column.width,
	size: column.width,
});

export const columnsToRanges = (columns: Column[]): RangeTree => {
	const gridOffsets = columns.map(columnToOffset);
	return new RangeTree(gridOffsets);
};
