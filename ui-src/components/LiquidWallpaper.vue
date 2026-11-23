<script setup lang="ts">
import type { WallpaperId } from '@/bridge';

defineProps<{ wallpaper: WallpaperId; dark: boolean }>();

const palettes: Record<WallpaperId, { bg: string; orbs: [string, string, string] }> = {
  aurora: {
    bg: 'linear-gradient(160deg, #0b132b 0%, #1c2541 48%, #2a1f4d 100%)',
    orbs: ['radial-gradient(circle, #38bdf8, transparent 70%)', 'radial-gradient(circle, #a855f7, transparent 70%)', 'radial-gradient(circle, #34d399, transparent 70%)'],
  },
  ocean: {
    bg: 'linear-gradient(165deg, #07192f 0%, #0d3b66 52%, #1d6f8a 100%)',
    orbs: ['radial-gradient(circle, #22d3ee, transparent 70%)', 'radial-gradient(circle, #3b82f6, transparent 70%)', 'radial-gradient(circle, #6ee7b7, transparent 70%)'],
  },
  twilight: {
    bg: 'linear-gradient(160deg, #1b102c 0%, #431c53 48%, #852b5e 100%)',
    orbs: ['radial-gradient(circle, #fb7185, transparent 70%)', 'radial-gradient(circle, #f59e0b, transparent 70%)', 'radial-gradient(circle, #c084fc, transparent 70%)'],
  },
  pearl: {
    bg: 'linear-gradient(160deg, #dbeafe 0%, #ede9fe 48%, #fce7f3 100%)',
    orbs: ['radial-gradient(circle, #93c5fd, transparent 70%)', 'radial-gradient(circle, #f9a8d4, transparent 70%)', 'radial-gradient(circle, #a5f3fc, transparent 70%)'],
  },
  obsidian: {
    bg: 'linear-gradient(160deg, #05070d 0%, #111827 52%, #1e1b4b 100%)',
    orbs: ['radial-gradient(circle, #4f46e5, transparent 70%)', 'radial-gradient(circle, #0284c7, transparent 70%)', 'radial-gradient(circle, #64748b, transparent 70%)'],
  },
};
</script>

<template>
  <div class="absolute inset-0 overflow-hidden pointer-events-none select-none" :style="{ background: palettes[wallpaper].bg }">
    <div
      class="lg-orb"
      :style="{
        width: '280px', height: '280px', top: '-60px', left: '-60px',
        background: palettes[wallpaper].orbs[0],
      }"
    />
    <div
      class="lg-orb lg-orb-2"
      :style="{
        width: '300px', height: '300px', top: '32%', right: '-90px',
        background: palettes[wallpaper].orbs[1],
      }"
    />
    <div
      class="lg-orb lg-orb-3"
      :style="{
        width: '260px', height: '260px', bottom: '-70px', left: '12%',
        background: palettes[wallpaper].orbs[2],
      }"
    />
    <!-- Subtle prism sheen -->
    <div
      class="absolute inset-0"
      :style="{
        background: dark
          ? 'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.08), transparent 60%)'
          : 'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.22), transparent 60%)',
      }"
    />
  </div>
</template>
