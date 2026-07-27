import { describe, expect, it } from 'vitest';
import {
	defaultColumnWidth,
	defaultRowHeight,
	fillOutColumns,
	fillOutRows,
	GridOffset,
	toRowOffsets,
} from '../../src/structures/utilities';
import { ApiColumnData, ApiRowData } from '../../src/canvas/types';

const firstSourceRow: ApiRowData = {
	index: 0,
	height: 37,
	cells: [],
	cssClass: '',
};

const tenthSourceRow: ApiRowData = {
	index: 9,
	height: 23,
	cells: [],
	cssClass: '',
};

const firstSourceColumn: ApiColumnData = {
	index: 0,
	width: 83,
	cssClass: '',
};

const eleventhSourceColumn: ApiColumnData = {
	index: 10,
	width: 37,
	cssClass: '',
};

describe('fillOutRow', () => {
	it('Dense list is unchanged', () => {
		const source = [firstSourceRow];
		const actual = fillOutRows(source);

		expect(actual).toEqual(source);
	});

	it('Sparse list is filled out', () => {
		const source = [firstSourceRow, tenthSourceRow];
		const expected = [
			firstSourceRow,
			...Array(8)
				.keys()
				.map(
					(x): ApiRowData => ({ index: x + 1, height: defaultRowHeight, cells: [], cssClass: '' }),
				),
			tenthSourceRow,
		];

		const actual = fillOutRows(source);
		expect(actual).toEqual(expected);
	});
});

describe('fillOutColumn', () => {
	it('Dense list is unchanged', () => {
		const source = [firstSourceColumn];
		const actual = fillOutColumns(source);

		expect(actual).toEqual(source);
	});

	it('Sparse list is filled out', () => {
		const source = [firstSourceColumn, eleventhSourceColumn];
		const expected = [
			firstSourceColumn,
			...Array(9)
				.keys()
				.map((x): ApiColumnData => ({ index: x + 1, width: defaultColumnWidth, cssClass: '' })),
			eleventhSourceColumn,
		];

		const actual = fillOutColumns(source);
		expect(actual).toEqual(expected);
	});
});

describe('toRowOffsets', () => {
	it('Single item at zero has end equaling height', () => {
		const expected: GridOffset[] = [
			{
				index: 0,
				start: 0,
				end: firstSourceRow.height,
				size: firstSourceRow.height,
			},
		];

		const actual = toRowOffsets([firstSourceRow]);

		expect(actual).toEqual(expected);
	});

	it('Single not at zero has expected elements', () => {
		const item: ApiRowData = {
			index: 10,
			height: 23,
			cells: [],
			cssClass: '',
		};

		const expected = [
			...Array(item.index)
				.keys()
				.map(
					(index): GridOffset => ({
						index,
						start: index * defaultRowHeight,
						end: (index + 1) * defaultRowHeight,
						size: defaultRowHeight,
					}),
				),
			{
				index: item.index,
				size: item.height,
				start: item.index * defaultRowHeight,
				end: item.index * defaultRowHeight + item.height,
			},
		];

		const actual = toRowOffsets([item]);

		expect(actual).toEqual(expected);
	});
});
