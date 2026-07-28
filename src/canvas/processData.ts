import {
	type ApiColumnData,
	type ApiDocumentData,
	type ApiSheetData,
	type Column,
	SheetType,
} from './types.ts';
import { RangeTree } from '@/structures/range/rangeTree.ts';
import type { GridOffset } from '@/structures/utilities.ts';

const processColumns = (columns: ApiColumnData[]): Column[] => {
	const ary = Array<Column>(columns.map((x) => x.index).reduce((p, c) => Math.max(p, c), 0) + 1);

	let widthOffset = 0;

	return columns
		.toSorted((left, right) => left.index - right.index)
		.map((c) => {
			const column: Column = {
				...c,
				widthOffset,
				hidden: false,
			};
			widthOffset += c.width;
			return column;
		});
};

const processSheet = (s: ApiSheetData) => {
	if (s.$type === SheetType.Chart) return { ...s };

	const rows = s.rows.map((r) => ({
		index: r.index,
		height: r.height,
	}));

	const columns = processColumns(s.columns);

	return {
		type: s.$type,
		name: s.name,
		index: s.index,
		rows,
		columns,
	};
};

export const process = (raw: ApiDocumentData) => {
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
