interface RangeNode<T> {
	start: number,
	end: number
}

interface RangeBranch<T> extends RangeNode<T> {
	left: RangeNode<T>
	right: RangeNode<T>
}
