import { type ApiWorksheetSheetData, SheetType } from '@/canvas/types.ts';
import { DEFAULT_CELL_HEIGHT, DEFAULT_CELL_WIDTH } from '@/canvas/constants.ts';

export const defaultWorksheet: Readonly<ApiWorksheetSheetData> = Object.freeze({
	$type: SheetType.Worksheet,
	columns: [
		{
			index: 0,
			width: DEFAULT_CELL_WIDTH,
			cssClass: '',
		},
	],
	comments: [],
	cssClass: '',
	cssClassDictionary: {},
	headerFooters: [],
	index: 0,
	maxColumn: 0,
	maxRow: 0,
	name: 'An Sheet',
	rows: [
		{
			index: 0,
			height: DEFAULT_CELL_HEIGHT,
			cssClass: '',
			cells: [],
		},
	],
	sheetObjects: [],
});
