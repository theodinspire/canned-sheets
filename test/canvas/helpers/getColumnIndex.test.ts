import { describe, expect, it } from 'vitest';
import { getColumnIndex } from '@/canvas/helpers.ts';

describe.each`
	columnIndex | columnName
	${0}        | ${'A'}
	${26}       | ${'AA'}
	${14}       | ${'O'}
	${90}       | ${'CM'}
	${1434}     | ${'BCE'}
`('Given the column name $columnName', ({ columnName, columnIndex }) => {
	it(`getColumnIndex produces the index ${columnIndex}`, async () => {
		const actual = getColumnIndex(columnName);
		expect(actual).toEqual(columnIndex);
	});

	it('Repeated calls produce the same result', async () => {
		const first = getColumnIndex(columnName);
		const second = getColumnIndex(columnName);

		expect(first).toEqual(second);
	});
});
