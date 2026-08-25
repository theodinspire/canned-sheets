<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { columnsToRanges, process } from './processData.ts';
import raw from '../assets/fullflow.xlsx.json';
import { DEFAULT_CELL_HEIGHT, DEFAULT_CELL_WIDTH } from './constants.ts';
import {
	type ApiDocumentData,
	type BaseColumn,
	type BaseRow,
	type Column,
	SheetType,
} from './types.ts';
import { getColumnName } from '@/canvas/helpers.ts';
import type { GridOffset } from '@/structures/utilities.ts';

const data = process(raw as unknown as ApiDocumentData);
const sheetIndex = ref(0);

const sheet = computed(() => data.sheets[sheetIndex.value]);

const wrapper = useTemplateRef('wrapper');
const canvas = useTemplateRef('canvas');

const height = computed(() => wrapper.value?.clientHeight ?? 0);
const width = computed(() => wrapper.value?.clientWidth ?? 0);

const columnTree = computed(() => {
	const columns = sheet.value && 'columns' in sheet.value ? sheet.value.columns : [];
	return columnsToRanges(columns);
});

const headerColor = '#f9fafb';
const gridColor = '#d0d7de';
const headerTextColor = '#6b7280';

const xScroll = ref(0);
const yScroll = ref(0);
const columnOffset = computed(() => 35);
const rowOffset = computed(() => 24);

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
	const columns = columnTree.value.getRange.from(xScroll.value).withWidth(width.value);
	for (const column of columns) drawColumnWithScroll(ctx, column);
};

const drawRow = (ctx: CanvasRenderingContext2D, y: number, row: BaseRow): number => {
	const line = y + 0.5;

	ctx.beginPath();
	ctx.moveTo(0, line);
	ctx.lineTo(width.value!, line);
	ctx.stroke();

	const name = (row.index + 1).toString();
	const textCenter = columnOffset.value / 2;
	ctx.fillText(name, textCenter, y + 16, columnOffset.value);

	return y + row.height + 1;
};

const drawRows = (ctx: CanvasRenderingContext2D, rows: (BaseRow | undefined)[]) => {
	let y = rowOffset.value;
	let i = 0;
	while (y < height.value) {
		const row = rows[i++] ?? { index: i, height: DEFAULT_CELL_HEIGHT };
		y = drawRow(ctx, y, row);
	}
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

	// drawColumns(ctx, sheet.value.columns);
	drawColumnsFromTree(ctx);
	drawRows(ctx, sheet.value.rows);
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
