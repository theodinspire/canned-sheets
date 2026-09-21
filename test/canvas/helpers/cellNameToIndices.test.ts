import { expect, it } from 'vitest';
import { cellNameToIndices } from '@/canvas/helpers.ts';

it.each`
	row      | column  | cellName
	${0}     | ${0}    | ${'A1'}
	${9_999} | ${26}   | ${'AA10000'}
	${14}    | ${14}   | ${'O15'}
	${54}    | ${90}   | ${'CM55'}
	${1024}  | ${1434} | ${'BCE1025'}
`(
	'`cellNameToIndices` produces cell coordinates equal to { row: $row, column: $column } for cell name "$cellName"',
	({ row, column, cellName }) => {
		const actual = cellNameToIndices(cellName);
		expect(actual).toEqual({ row, column });
	},
);
