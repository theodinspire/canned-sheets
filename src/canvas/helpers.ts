export const getColumnName = (column: { index: number }) => {
	let columnIndex = column.index + 1;
	let columnName = '';
	while (columnIndex > 0) {
		const remainder = (columnIndex - 1) % 26;
		columnName = String.fromCharCode(65 + remainder) + columnName;
		columnIndex = Math.floor((columnIndex - 1) / 26);
	}

	return columnName;
};
