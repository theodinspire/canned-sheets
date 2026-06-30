import {type ApiColumnData, type ApiDocumentData, type ApiSheetData, SheetType} from "./types.ts";

const processColumns = (columns: ApiColumnData[]): ({ width: number, index: number} | undefined)[] => {
	const ary = [] as ({ width: number, index: number } | undefined)[];
	ary.length = columns.map(x => x.index).reduce((p, c) => Math.max(p, c), 0) + 1;

	for (const column of columns) {
		ary[column.index] = column
	}

	return ary;
}

const processSheet = (s: ApiSheetData) => {
	if (s.$type === SheetType.Chart) return { ...s };

	const rows = s.rows.map(r => ({
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
}

export const process = (raw: ApiDocumentData) => {
	return {
		sheets: raw.sheets.map(processSheet),
	};
};