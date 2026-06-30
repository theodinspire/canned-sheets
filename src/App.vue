<script setup lang="ts">
import SheetCanvas from './canvas/SheetCanvas.vue';
</script>

<template>
	<div class="base w-screen h-screen flex items-center justify-center">
		<SheetCanvas />
	</div>
</template>

<style scoped>
.base {
	--amaranth-pink: #f19cba;
	--coronation-blue: #5b55a0;
	--opal-blue: #0c3b68;

	background: linear-gradient(var(--coronation-blue), var(--amaranth-pink) 50%);
}
</style>
