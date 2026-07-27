import { describe, expect, it } from 'vitest';
import { type GridOffset } from '@/structures/utilities.ts';
import { RangeTree } from '@/structures/range/rangeTree.ts';

const makeOffset = (index: number, start: number, end: number): GridOffset => ({
	index,
	start,
	end,
	size: end - start,
});

const pairUp = <T>(items: T[]): [T, T][] => {
	return items
		.map((item, index, array) => {
			if (index + 1 === array.length) return null;
			return [item, array[index + 1]];
		})
		.slice(0, -1) as [T, T][];
};

const pairsToOffsets = ([start, end]: [number, number], index: number): GridOffset =>
	makeOffset(index, start, end);

const isPair = (x: [number, number] | number): x is [number, number] => x instanceof Array;
const arePairs = (a: [number, number][] | number[]): a is [number, number][] =>
	a[0] === undefined ? false : isPair(a[0]);

const numbersToOffsets = (items: number[] | [number, number][]): GridOffset[] => {
	if (items.length <= 1) return [];

	const pairs = arePairs(items) ? items : pairUp(items);

	return pairs.map(pairsToOffsets);
};

const midpoint = (a: number, b: number) => Math.floor((a + b) / 2);

describe('Single node', () => {
	type Example = {
		index: number;
		start: number;
		end: number;
		before: number;
		within: number;
		after: number;
	};

	describe.each`
		index  | start  | end    | before | within | after
		${0}   | ${0}   | ${10}  | ${-5}  | ${5}   | ${15}
		${1}   | ${100} | ${110} | ${95}  | ${105} | ${115}
		${12}  | ${1}   | ${3}   | ${0}   | ${2}   | ${4}
		${123} | ${-10} | ${0}   | ${-15} | ${-5}  | ${5}
	`(
		'Given a node of index $index starting at $start and ending at $end',
		({ index, start, end, before, within, after }: Example) => {
			const offset = makeOffset(index, start, end);
			const tree = new RangeTree([offset]);

			it('The start value will return the node', () => {
				const actual = tree.find(start);
				expect(actual).toBe(offset);
			});

			it('The end value will return undefined', () => {
				const actual = tree.find(end);
				expect(actual).toBeUndefined();
			});

			it('A value between the end and the start will return the node', () => {
				const actual = tree.find(within);
				expect(actual).toBe(offset);
			});

			it('A value before the start will return undefined', () => {
				const actual = tree.find(before);
				expect(actual).toBeUndefined();
			});

			it('A value after the end will return undefined', () => {
				const actual = tree.find(after);
				expect(actual).toBeUndefined();
			});
		},
	);
});

describe('Multiple Nodes', () => {
	describe.for([{ endpoints: [0, 10, 20] }, { endpoints: [-4, -2, 0, 2, 4] }])(
		'Given a set of offsets covering the intervals bounded by $endpoints',
		({ endpoints }) => {
			const pairs = pairUp(endpoints);
			const offsets = numbersToOffsets(pairs);
			const tree = new RangeTree(offsets);

			it.for(pairs)(
				'The midpoint between %i and %i returns the expected offset',
				([start, end]) => {
					const mid = midpoint(start, end);
					const actual = tree.find(mid);
					expect(actual).toHaveProperty('start', start);
					expect(actual).toHaveProperty('end', end);
					expect(actual).toHaveProperty('size', end - start);
				},
			);

			it.for(pairs)(' The start point returns node with self', ([start, end]) => {
				const actual = tree.find(start);
				expect(actual).toHaveProperty('start', start);
				expect(actual).toHaveProperty('end', end);
				expect(actual).toHaveProperty('size', end - start);
			});

			it.for(pairs.slice(0, -1))('The end points return the next item', ([_, end]) => {
				const actual = tree.find(end);
				expect(actual).toHaveProperty('start', end);
			});

			it('The last point returns undefined', () => {
				const actual = tree.find(endpoints.at(-1)!);
				expect(actual).toBeUndefined();
			});
		},
	);
});
