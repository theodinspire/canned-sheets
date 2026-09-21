import type { CellCoordinates } from '@/canvas/types.ts';

const cellNamePattern = /^(?<columnName>[A-Za-z]+)(?<rowName>\d+)$/;

type CellMatchedRegExpExecArray = RegExpExecArray & {
	groups: { columnName: string; rowName: string };
};

const columnNameByIndex = new Map<number, string>();
const indexByColumnName = new Map<string, number>();

export const getColumnIndex = (columnName: string): number => {
	columnName = columnName.toUpperCase();

	const fromMap = indexByColumnName.get(columnName);
	if (fromMap !== undefined) return fromMap;

	const A = 'A'.charCodeAt(0);

	let value = 0;
	for (let i = 0; i < columnName.length; i++) {
		value = value * 26 + (columnName.charCodeAt(i) - A + 1);
	}

	return value - 1;
};

const isCellNameMatch = (match: RegExpExecArray | null): match is CellMatchedRegExpExecArray =>
	match?.groups !== undefined && 'columnName' in match.groups && 'rowName' in match.groups;

export const cellNameToIndices = (name: string): CellCoordinates => {
	const match = cellNamePattern.exec(name);

	if (!isCellNameMatch(match)) throw new Error(`Could not parse "${name}" into cell coordinates`);

	const { columnName, rowName } = match.groups;

	const row = Number.parseInt(rowName) - 1;
	const column = getColumnIndex(columnName);

	return { row, column };
};

export const getColumnName = ({ index }: { index: number }) => {
	let columnName = columnNameByIndex.get(index) ?? '';
	if (columnName !== '') return columnName;

	let columnIndex = index + 1;

	while (columnIndex > 0) {
		const remainder = (columnIndex - 1) % 26;
		columnName = String.fromCharCode(65 + remainder) + columnName;
		columnIndex = Math.floor((columnIndex - 1) / 26);
	}

	columnNameByIndex.set(index, columnName);
	indexByColumnName.set(columnName, index);

	return columnName;
};
