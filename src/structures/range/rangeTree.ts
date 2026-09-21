import type { GridOffset } from '@/structures/utilities.ts';

type GetRangeBaseMethod = (start: number, end: number) => GridOffset[];

interface RangeGetter extends GetRangeBaseMethod {
	from: (start: number) => {
		to: (end: number) => GridOffset[];
		for: (width: number) => GridOffset[];
	};
}

const makeRangeGetter = (f: GetRangeBaseMethod) => {
	const handler: ProxyHandler<GetRangeBaseMethod> = {
		get: function (target: GetRangeBaseMethod, prop, receiver, ...rest: []) {
			if (prop === 'from')
				return ((start: number) => ({
					to: (end: number) => target(start, end),
					for: (width: number) => target(start, start + width),
				})) as RangeGetter['from'];

			return Reflect.get(target, prop, receiver, ...rest);
		},
	};

	return new Proxy(f, handler) as RangeGetter;
};

export class RangeTree {
	private readonly items: GridOffset[];
	private readonly root: RangeTreeNode | undefined = undefined;

	private get start(): number {
		return this.root?.start ?? 0;
	}
	private get end(): number {
		return this.root?.end ?? 0;
	}

	constructor(items: GridOffset[]) {
		this.items = items;
		if (this.items.length === 0) return;
		this.root = createNode(this.items);
	}

	/**
	 *
	 * @param i
	 */
	find(i: number): GridOffset | undefined {
		if (i < this.start || i >= this.end) return undefined;
		return this.root?.find(i) ?? undefined;
	}

	private fromStartToEnd(start: number, end: number): GridOffset[] {
		if (start >= this.end) return [];
		if (end < this.start) return [];

		const a = this.find(start)?.index ?? 0;
		const b = this.find(end)?.index ?? this.items.length;

		const [left, right] = a <= b ? [a, b] : [b, a];

		return this.items.slice(left, right + 1);
	}

	getRange = makeRangeGetter((start, end) => this.fromStartToEnd(start, end));
}

interface RangeTreeNode {
	find(i: number): GridOffset | undefined;
	get start(): number;
	get end(): number;
}

class RangeTreeLeaf implements RangeTreeNode {
	private readonly leaf: GridOffset;

	get start() {
		return this.leaf.start;
	}
	get end() {
		return this.leaf.end;
	}

	constructor(item: GridOffset) {
		this.leaf = item;
	}

	find(_i: number): GridOffset | undefined {
		return this.leaf;
	}
}

class RangeTreeBranch implements RangeTreeNode {
	private readonly left: RangeTreeNode;
	private readonly right: RangeTreeNode;

	get start(): number {
		return this.left.start;
	}
	get end(): number {
		return this.right.end;
	}

	private get mid() {
		return this.right.start;
	}

	constructor(items: GridOffset[]) {
		const mid = Math.floor(items.length / 2);
		this.left = createNode(items.slice(0, mid));
		this.right = createNode(items.slice(mid));
	}

	find(i: number): GridOffset | undefined {
		if (i >= this.mid) return this.right.find(i);
		return i >= this.mid ? this.right.find(i) : this.left.find(i);
	}
}

const createNode = (items: GridOffset[]): RangeTreeNode => {
	if (items.length == 1) return new RangeTreeLeaf(items[0]!);
	if (items.length > 1) return new RangeTreeBranch(items);
	throw new Error('Cannot build a range tree node from an empty collection');
};
