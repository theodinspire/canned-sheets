import { describe, expect, it } from 'vitest';
import { getColumnName } from '@/canvas/helpers.ts';

describe.each`
	index | expected
	${0}  | ${'A'}
	${25} | ${'Z'}
	${26} | ${'AA'}
`('Given a column at index $index', ({ index, expected }) => {
	const actual = getColumnName({ index });

	it('should have expected name', () => {
		expect(actual).toBe(expected);
	});
});
