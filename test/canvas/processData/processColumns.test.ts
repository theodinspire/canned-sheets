import { assert, describe, expect, it } from 'vitest';
import {
	type ApiColumnData,
	type ApiDocumentData,
	type ApiWorksheetSheetData,
	type Column,
	type DocumentData,
	SheetType,
	type WorksheetSheet,
} from '@/canvas/types.ts';
import { DEFAULT_CELL_WIDTH } from '@/canvas/constants.ts';
import { defaultWorksheet } from '../testHelpers.ts';
import { process } from '@/canvas/processData.ts';

const buildColumn = (index: number, width: number = DEFAULT_CELL_WIDTH): ApiColumnData => ({
	index,
	width,
	cssClass: '',
});

type ColumnArrayBuilder = ((length: number) => ApiColumnData[]) &
	((indexArray: number[]) => ApiColumnData[]);

const createColumnArray: ColumnArrayBuilder = (input: number | number[]) => {
	const array =
		typeof input === 'number' ?
			Array(input)
				.fill(0)
				.map((_, i) => i)
		:	input;
	return array.map(buildColumn);
};

const sheetWithColumns = (columns: ApiColumnData[]): ApiWorksheetSheetData => ({
	...defaultWorksheet,
	columns,
});

const stubDocument = (columns: ApiColumnData[]): ApiDocumentData => ({
	sheets: [sheetWithColumns(columns)],
});

const getWorksheet = (document: ApiDocumentData, index: number = 0): WorksheetSheet => {
	const sheet = process(document).sheets[index];
	if (sheet === undefined || sheet['$type'] !== SheetType.Worksheet) return assert.fail();
	return sheet;
};

describe('No columns', () => {
	const document = stubDocument([]);

	const processedSheet = getWorksheet(document);
	const actual = processedSheet.columns;

	it('returns an empty array of columns', () => {
		expect(actual).toEqual([]);
	});
});

describe('Single Column at index 0', () => {
	const columns = createColumnArray(1);
	const document = stubDocument(columns);

	const processedSheet = getWorksheet(document);
	const actual = processedSheet.columns;

	it('returns a single column', () => {
		expect(actual.length).toBe(1);
		expect(actual[0]).toEqual({
			...columns[0],
			widthOffset: 0,
			hidden: false,
		});
	});
});

describe.each([1, 3, 7])('Given a single column at index %i', (index) => {
	const apiColumns = createColumnArray([index]);
	const document = stubDocument(apiColumns);

	const processedSheet = getWorksheet(document);
	const actual = processedSheet.columns;

	it(`returns ${index + 1} columns`, () => {
		expect(actual.length).toBe(index + 1);
		expect(actual[index]).toEqual({
			...apiColumns[0],
			widthOffset: index * DEFAULT_CELL_WIDTH,
			hidden: false,
		});
	});
});
