import {
	type ApiCell,
	type ApiColumnData,
	type ApiRowData,
	type ApiSheetData,
	type Cell,
	type Column,
	type Row,
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

class ColumnSpan implements RangeWrapper<Column> {
	readonly #column: Column;
	readonly #end: number;

	constructor(column: Column) {
		this.#column = column;
		this.#end = column.widthOffset + column.width;
	}

	get index() {
		return this.#column.index;
	}

	get start() {
		return this.#column.widthOffset;
	}

	get end() {
		return this.#end;
	}

	get size() {
		return this.#column.width;
	}

	get value() {
		return this.#column;
	}
}

const columnToRange = (column: Column) => new ColumnSpan(column);

export const columnsToRanges = (columns: Column[]): RangeTree<ColumnSpan> => {
	const gridOffsets = columns.map(columnToRange);
	return new RangeTree(gridOffsets);
};

class RowSpan implements RangeWrapper<Row> {
	readonly #row: Row;
	readonly #end: number;

	constructor(row: Row) {
		this.#row = row;
		this.#end = row.heightOffset + row.height;
	}

	get index() {
		return this.#row.index;
	}

	get start() {
		return this.#row.heightOffset;
	}

	get end() {
		return this.#end;
	}

	get size() {
		return this.#row.height;
	}

	get value() {
		return this.#row;
	}
}

const rowToRange = (row: Row) => new RowSpan(row);

export const rowsToRanges = (rows: Row[]): RangeTree<RowSpan> => {
	const gridOffsets = rows.map(rowToRange);
	return new RangeTree(gridOffsets);
};

export default class WorksheetModel {
	#cells: Map<string, Cell>;
	#rows: RangeTree<RowSpan>;
	#columns: RangeTree<ColumnSpan>;

	constructor(data: ApiSheetData) {
		if (data.$type !== SheetType.Worksheet)
			throw new Error('Cannot create a worksheet model out of chart sheet data');

		const rowData = data.rows.map(apiRowToRow);

		this.#rows = rowsToRanges(rowData);
		this.#columns = columnsToRanges(processColumns(data.columns));

		this.#cells = new Map(rowData.flatMap((r) => r.cells).map((c) => [c.name, c]));
	}

	getGrid(top: number, left: number, bottom: number, right: number): { rows: Row[], columns: Column[] } {
		return {
			rows: this.#rows.getRange.from(top).to(bottom).map(x => x.value),
			columns: this.#columns.getRange.from(left).to(right).map(x => x.value),
		}
	}

	getCell(cellName: string) {
		return this.#cells.get(cellName);
	}
}
