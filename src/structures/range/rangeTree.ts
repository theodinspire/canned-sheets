import type { GridOffset } from '@/structures/utilities.ts';

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

	find(i: number): GridOffset | undefined {
		if (i < this.start || i >= this.end) return undefined;
		return this.root?.find(i) ?? undefined;
	}
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
