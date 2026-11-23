<script setup lang="ts">
import type { AppId } from '@/bridge';

defineProps<{ id: AppId; size?: number }>();

const gradients: Record<AppId, [string, string]> = {
  chat: ['#34d399', '#059669'],
  moments: ['#fb7185', '#e11d48'],
  peek: ['#818cf8', '#4f46e5'],
  draw: ['#c084fc', '#7c3aed'],
  gallery: ['#38bdf8', '#2563eb'],
  roles: ['#fbbf24', '#ea580c'],
  engines: ['#2dd4bf', '#0284c7'],
  logs: ['#60a5fa', '#1d4ed8'],
  settings: ['#94a3b8', '#475569'],
};
</script>

<template>
  <div
    class="relative flex items-center justify-center rounded-[15px] overflow-hidden select-none shadow-lg"
    :style="{
      width: (size || 56) + 'px',
      height: (size || 56) + 'px',
      background: `linear-gradient(145deg, ${gradients[id][0]}, ${gradients[id][1]})`,
      boxShadow: '0 10px 22px -8px rgba(0,0,0,0.38), inset 0 1.5px 1px rgba(255,255,255,0.62), inset 0 -1px 1px rgba(0,0,0,0.18)',
    }"
  >
    <!-- Liquid Glass Specular Glare -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: linear-gradient(155deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 44%, transparent 55%, rgba(255,255,255,0.14) 100%);"
    />

    <!-- Chat -->
    <svg v-if="id === 'chat'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.84 2 11.5c0 2.52 1.32 4.78 3.4 6.32-.16 1.2-.72 2.28-1.36 3.04-.18.22-.04.56.25.56 1.72 0 3.38-.58 4.62-1.48.98.26 2.02.4 3.09.4 5.52 0 10-3.84 10-8.84S17.52 3 12 3z" />
    </svg>

    <!-- Moments -->
    <svg v-else-if="id === 'moments'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 5 7.5M21 12a9 9 0 0 1-7.5 5M12 21a9 9 0 0 1-5-7.5M3 12a9 9 0 0 1 7.5-5" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>

    <!-- Peek -->
    <svg v-else-if="id === 'peek'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>

    <!-- Draw -->
    <svg v-else-if="id === 'draw'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6-4.6-1.9 4.6-1.9L12 3z" fill="currentColor" stroke="none" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M5 15l.7 1.6L7.3 17.3 5.7 18 5 19.6 4.3 18 2.7 17.3l1.6-.7L5 15z" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>

    <!-- Gallery -->
    <svg v-else-if="id === 'gallery'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3.5" />
      <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 15.5l-4.5-4.5-6.5 6.5-2.5-2.5L3 19.5" />
    </svg>

    <!-- Roles -->
    <svg v-else-if="id === 'roles'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 19.5c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5c0 .8-.7 1.5-1.5 1.5H6c-.8 0-1.5-.7-1.5-1.5z" />
    </svg>

    <!-- Engines -->
    <svg v-else-if="id === 'engines'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>

    <!-- Logs -->
    <svg v-else-if="id === 'logs'" class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>

    <!-- Settings -->
    <svg v-else class="w-7 h-7 text-white drop-shadow-sm relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  </div>
</template>
