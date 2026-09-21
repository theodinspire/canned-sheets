<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { columnsToRanges, process, rowsToRanges } from './processData.ts';
import raw from '../assets/fullflow.xlsx.json';
import { type ApiDocumentData, type Cell, SheetType } from './types.ts';
import { getColumnName } from '@/canvas/helpers.ts';
import type { GridOffset } from '@/structures/utilities.ts';

const data = process(raw as unknown as ApiDocumentData);
const sheetIndex = ref(0);

const xScroll = ref(0);
const yScroll = ref(0);
const columnOffset = computed(() => 35);
const rowOffset = computed(() => 24);

const sheet = computed(() => data.sheets[sheetIndex.value]);

const wrapper = useTemplateRef('wrapper');
const canvas = useTemplateRef('canvas');

const height = computed(() => wrapper.value?.clientHeight ?? 0);
const width = computed(() => wrapper.value?.clientWidth ?? 0);

const columnTree = computed(() => {
	const columns = sheet.value && 'columns' in sheet.value ? sheet.value.columns : [];
	return columnsToRanges(columns);
});

const activeColumns = computed(() =>
	columnTree.value.getRange.from(xScroll.value).for(width.value),
);

const rowTree = computed(() => {
	const rows = sheet.value && 'rows' in sheet.value ? sheet.value.rows : [];
	return rowsToRanges(rows);
});

const activeRows = computed(() => rowTree.value.getRange.from(yScroll.value).for(height.value));

const activeCells = computed(() => {
	const rowStart = activeRows.value?.at(0)?.index ?? 0;
	const rowEnd = activeRows.value?.at(-1)?.index ?? 0;

	const columnStart = activeColumns.value?.at(0)?.index ?? 0;
	const columnEnd = activeColumns.value?.at(-1)?.index ?? 0;

	if (!(sheet.value && 'rows' in sheet.value)) return [];

	return sheet.value.rows
		.filter((r) => rowStart <= r.index && r.index <= rowEnd)
		.flatMap((r) => r.cells.filter((c) => columnStart <= c.column && c.column <= columnEnd));
});

const headerColor = '#f9fafb';
const gridColor = '#d0d7de';
const headerTextColor = '#6b7280';

const drawHeaders = (ctx: CanvasRenderingContext2D) => {
	if (!(height.value && width.value)) return;

	ctx.fillStyle = headerColor;
	ctx.fillRect(0, 0, width.value, rowOffset.value);
	ctx.fillRect(0, 0, columnOffset.value, height.value);
};

const drawColumnWithScroll = (ctx: CanvasRenderingContext2D, column: GridOffset) => {
	const x = columnOffset.value - xScroll.value + column.start;

	const line = x + 0.5;

	const name = getColumnName(column);
	const textCenter = line + column.size / 2 + 1;

	ctx.fillText(name, textCenter, 20, column.size);

	if (x <= columnOffset.value || x >= width.value) return ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(line, 0);
	ctx.lineTo(line, height.value!);
	ctx.stroke();
};

const drawColumnsFromTree = (ctx: CanvasRenderingContext2D) => {
	// Left line
	const line = columnOffset.value + 0.5;
	ctx.beginPath();
	ctx.moveTo(line, 0);
	ctx.lineTo(line, height.value!);
	ctx.stroke();

	// Columns
	for (const column of activeColumns.value) drawColumnWithScroll(ctx, column);
};

const drawRowWithScroll = (ctx: CanvasRenderingContext2D, row: GridOffset) => {
	const y = rowOffset.value - yScroll.value + row.start;

	const line = y + 0.5;

	const name = (row.index + 1).toString();

	const textCenterX = columnOffset.value / 2;
	const textCenterY = line + row.size / 2 + 1;

	ctx.fillText(name, textCenterX, textCenterY, rowOffset.value);

	if (y <= rowOffset.value || y >= height.value) return ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(0, line);
	ctx.lineTo(width.value!, line);
	ctx.stroke();
};

const drawCell = (ctx: CanvasRenderingContext2D, cell: Cell) => {
	if (sheet.value?.$type !== 'Worksheet') return;
	const row = sheet.value.rows[cell.row];
	const column = sheet.value.columns[cell.column];

	const x = columnOffset.value + column!.widthOffset + 2;
	const y = rowOffset.value + row!.heightOffset + row!.height - 0.5;

	ctx.fillText(cell.value, x, y);
	ctx.stroke();
};

const drawCells = (ctx: CanvasRenderingContext2D) => {
	ctx.save();
	ctx.fillStyle = '#000000';

	for (const cell of activeCells.value) drawCell(ctx, cell);
	ctx.restore();
};

const drawRowsFromTree = (ctx: CanvasRenderingContext2D) => {
	// Top line
	const line = rowOffset.value + 0.5;
	ctx.beginPath();
	ctx.moveTo(0, line);
	ctx.lineTo(width.value!, line);
	ctx.stroke();

	// Rows
	const baseLine = ctx.textBaseline;
	ctx.textBaseline = 'middle';

	for (const row of activeRows.value) drawRowWithScroll(ctx, row);

	ctx.textBaseline = baseLine;
};

const drawGrid = (ctx: CanvasRenderingContext2D) => {
	if (!(height.value && width.value)) return;

	if (!sheet.value) return;
	if (sheet.value['$type'] !== SheetType.Worksheet) return;

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(
		columnOffset.value,
		rowOffset.value,
		width.value - columnOffset.value,
		height.value - rowOffset.value,
	);

	ctx.strokeStyle = gridColor;
	ctx.fillStyle = headerTextColor;
	ctx.font =
		'16px ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
	ctx.textAlign = 'center';

	drawColumnsFromTree(ctx);
	drawRowsFromTree(ctx);

	ctx.textAlign = 'left';
	drawCells(ctx);
};

watch([width, height, xScroll, yScroll], async ([w, h, x, y]) => {
	console.info('Triggering Draw', w, h, 'X scroll:', x, 'Y scroll', y);
	await nextTick();

	const ctx = canvas.value?.getContext('2d');
	if (!ctx) return;

	drawHeaders(ctx);
	drawGrid(ctx);
});
</script>

<template>
	<div class="wrapper w-3/4 h-5/6 bg-white" ref="wrapper">
		<canvas :height="height" :width="width" ref="canvas"></canvas>
	</div>
</template>

<style scoped></style>
