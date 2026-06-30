<script setup lang="ts">
import {computed, nextTick, ref, useTemplateRef, watch} from 'vue';
import {process} from "./processData.ts";
import raw from "../assets/fullflow.xlsx.json";
import {DEFAULT_CELL_HEIGHT, DEFAULT_CELL_WIDTH} from "./constants.ts";
import {type ApiDocumentData, SheetType} from "./types.ts";

const data = process(raw as unknown as ApiDocumentData);
const sheetIndex = ref(0);

const sheet = computed(() => data.sheets[sheetIndex.value]);

const wrapper = useTemplateRef('wrapper');
const canvas = useTemplateRef('canvas')

const height = computed(() => wrapper.value?.clientHeight ?? 0);
const width = computed(() => wrapper.value?.clientWidth ?? 0);

const headerColor = '#f9fafb';
const gridColor = '#d0d7de';
const headerTextColor = '#6b7280';

// let xScroll = 0;
// let yScroll = 0;
let columnOffset = 35;
let rowOffset = 24;

const drawHeaders = (ctx: CanvasRenderingContext2D) => {
	if (!(height.value && width.value)) return;

	ctx.fillStyle = headerColor;
	ctx.fillRect(0, 0, width.value, rowOffset);
	ctx.fillRect(0, 0, columnOffset, height.value);
};

type Column = { index: number, width: number };
type Row = { index: number, height: number };

const getColumnName = (column: Column) => {
	let columnIndex = column.index;
	let columnName = '';
	while (columnIndex > 0) {
		const remainder = (columnIndex - 1) % 26;
		columnName = String.fromCharCode(65 + remainder) + columnName;
		columnIndex = Math.floor((columnIndex - 1) / 26);
	}

	return columnName;
};

const drawColumn = (ctx: CanvasRenderingContext2D, x: number, column: Column): number => {
	const line = x + 0.5;

	ctx.beginPath();
	ctx.moveTo(line, 0)
	ctx.lineTo(line, height.value!)
	ctx.stroke();

	const name = getColumnName(column);
	const textCenter = line + (column.width / 2) + 1;
	ctx.fillText(name, textCenter, 20, column.width);

	return x + column.width + 1;
};

const drawColumns = (ctx: CanvasRenderingContext2D, columns: (Column | undefined)[]) => {
	let x = columnOffset;
	let i = 0;
	while (x < width.value) {
		const column = columns[i++] ?? { width: DEFAULT_CELL_WIDTH, index: i };
		x = drawColumn(ctx, x, column);
	}
}

const drawRow = (ctx: CanvasRenderingContext2D, y: number, row: Row): number => {
	const line = y + 0.5;

	ctx.beginPath();
	ctx.moveTo(0, line);
	ctx.lineTo(width.value!, line);
	ctx.stroke();

	const name = (row.index + 1).toString()
	const textCenter = columnOffset / 2;
	ctx.fillText(name, textCenter,  y + 16, columnOffset);

	return y + row.height + 1;
}

const drawRows = (ctx: CanvasRenderingContext2D, rows: (Row | undefined)[]) => {
	let y = rowOffset;
	let i = 0;
	while (y < height.value) {
		const row = rows[i++] ?? { index: i, height: DEFAULT_CELL_HEIGHT };
		y = drawRow(ctx, y, row);
	}
}

const drawGrid = (ctx: CanvasRenderingContext2D) => {
	if (!(height.value && width.value)) return;

	if (sheet.value.type !== SheetType.Worksheet) return;

	ctx.strokeStyle = gridColor;
	ctx.fillStyle = headerTextColor;
	ctx.font = '16px ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
	ctx.textAlign = 'center'

	drawColumns(ctx, sheet.value.columns);
	drawRows(ctx, sheet.value.rows);
}

watch([width, height], async (_, __) => {
	console.info('Triggering Draw', _, __);
	await nextTick();

	const ctx = canvas.value?.getContext("2d");
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
