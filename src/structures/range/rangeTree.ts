import type { GridOffset } from '@/structures/utilities.ts';

export interface Rangeable {
	readonly index: number;
	readonly start: number;
	readonly end: number;
	readonly size: number;
}

export interface RangeWrapper<T> extends Rangeable {
	readonly value: T;
}

type GetRangeBaseMethod<T extends Rangeable> = (start: number, end: number) => T[];

interface RangeGetter<T extends Rangeable> extends GetRangeBaseMethod<T> {
	from: (start: number) => {
		to: (end: number) => T[];
		for: (width: number) => T[];
	};
}

interface RangeTreeNode<T extends Rangeable> {
	find(i: number): T | undefined;
	get start(): number;
	get end(): number;
}

class RangeTreeLeaf<T extends Rangeable> implements RangeTreeNode<T> {
	private readonly leaf: T;

	get start() {
		return this.leaf.start;
	}
	get end() {
		return this.leaf.end;
	}

	constructor(item: T) {
		this.leaf = item;
	}

	find(_i: number): T | undefined {
		return this.leaf;
	}
}

const createNode = <T extends Rangeable>(items: T[]): RangeTreeNode<T> => {
	if (items.length == 1) return new RangeTreeLeaf(items[0]!);
	if (items.length > 1) return new RangeTreeBranch(items);
	throw new Error('Cannot build a range tree node from an empty collection');
};

class RangeTreeBranch<T extends Rangeable> implements RangeTreeNode<T> {
	readonly #left: RangeTreeNode<T>;
	readonly #right: RangeTreeNode<T>;

	get start(): number {
		return this.#left.start;
	}
	get end(): number {
		return this.#right.end;
	}

	get #mid() {
		return this.#right.start;
	}

	constructor(items: T[]) {
		const mid = Math.floor(items.length / 2);
		this.#left = createNode(items.slice(0, mid));
		this.#right = createNode(items.slice(mid));
	}

	find(i: number): T | undefined {
		if (i >= this.#mid) return this.#right.find(i);
		return i >= this.#mid ? this.#right.find(i) : this.#left.find(i);
	}
}

const makeRangeGetter = <T extends Rangeable>(f: GetRangeBaseMethod<T>) => {
	const handler: ProxyHandler<GetRangeBaseMethod<T>> = {
		get: function (target: GetRangeBaseMethod<T>, prop, receiver, ...rest: []) {
			if (prop === 'from')
				return ((start: number) => ({
					to: (end: number) => target(start, end),
					for: (width: number) => target(start, start + width),
				})) as RangeGetter<T>['from'];

			return Reflect.get(target, prop, receiver, ...rest);
		},
	};

	return new Proxy(f, handler) as RangeGetter<T>;
};

export default class RangeTree<T extends Rangeable> {
	readonly #items: T[];
	readonly #root: RangeTreeNode<T> | undefined = undefined;

	private get start(): number {
		return this.#root?.start ?? 0;
	}
	private get end(): number {
		return this.#root?.end ?? 0;
	}

	constructor(items: T[]) {
		this.#items = items;
		if (this.#items.length === 0) return;
		this.#root = createNode(this.#items);
	}

	find(i: number): GridOffset | undefined {
		if (i < this.start || i >= this.end) return undefined;
		return this.#root?.find(i) ?? undefined;
	}

	private fromStartToEnd(start: number, end: number): T[] {
		if (start >= this.end) return [];
		if (end < this.start) return [];

		const a = this.find(start)?.index ?? 0;
		const b = this.find(end)?.index ?? this.#items.length;

		const [left, right] = a <= b ? [a, b] : [b, a];

		return this.#items.slice(left, right + 1);
	}

	getRange = makeRangeGetter((start, end) => this.fromStartToEnd(start, end));
}
