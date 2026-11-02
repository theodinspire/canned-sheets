import {
	type ApiCell,
	type ApiColumnData,
	type ApiDocumentData,
	type ApiRowData,
	type ApiSheetData,
	type Cell,
	type Column,
	type DocumentData,
	type Row,
	type Sheet,
	SheetType,
} from '@/canvas/types.ts';
import { DEFAULT_CELL_HEIGHT, DEFAULT_CELL_WIDTH } from '@/canvas/constants.ts';
import { cellNameToIndices } from '@/canvas/helpers.ts';
import RangeTree, { type RangeWrapper } from '@/structures/range/rangeTree.ts';

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

const apiCellToCell = (apiCell: ApiCell): Cell => {
	return {
		...apiCell,
		...cellNameToIndices(apiCell.name),
	};
};

const apiRowToRow = (apiRow: ApiRowData, index: number): Row => {
	return {
		...apiRow,
		heightOffset: index * DEFAULT_CELL_HEIGHT,
		hidden: false,
		cells: apiRow.cells.map(apiCellToCell),
	};
};

const processSheet = (s: ApiSheetData): Sheet => {
	if (s.$type === SheetType.Chart) return { ...s };

	const rows = s.rows.map(apiRowToRow);

	const columns = processColumns(s.columns);

	return {
		...s,
		rows,
		columns,
		comments: [],
		sheetObjects: [],
		columnOffset: 0,
		maxColumn: columns.length,
		maxRow: rows.length,
	};
};

export const process = (raw: ApiDocumentData): DocumentData => {
	return {
		sheets: raw.sheets.map(processSheet),
	};
};

const columnToOffset = (column: Column): RangeWrapper<Column> => ({
	index: column.index,
	start: column.widthOffset,
	end: column.widthOffset + column.width,
	size: column.width,
	value: column,
});

export const columnsToRanges = (columns: Column[]): RangeTree<RangeWrapper<Column>> => {
	const gridOffsets = columns.map(columnToOffset);
	return new RangeTree(gridOffsets);
};

const rowToOffset = (row: Row): RangeWrapper<Row> => ({
	index: row.index,
	start: row.heightOffset,
	end: row.heightOffset + row.height,
	size: row.height,
	value: row,
});

export const rowsToRanges = (rows: Row[]): RangeTree<RangeWrapper<Row>> => {
	const gridOffsets = rows.map(rowToOffset);
	return new RangeTree(gridOffsets);
};

export default class WorksheetModel {
	#cells: Map<string, Cell>;
	#rows: Row[];
	#columns: Column[];

	constructor(data: ApiSheetData) {
		if (data.$type !== SheetType.Worksheet)
			throw new Error('Cannot create a worksheet model out of chart sheet data');

		this.#rows = data.rows.map(apiRowToRow);
		this.#columns = processColumns(data.columns);

		this.#rows.flatMap((r) => r.cells);

		this.#cells = new Map(this.#rows.flatMap((r) => r.cells).map((c) => [c.name, c]));
	}
}
