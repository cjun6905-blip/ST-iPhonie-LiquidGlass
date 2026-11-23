<script setup lang="ts">
import { computed } from 'vue';
import { usePhoneStore } from '@/bridge';

const props = defineProps<{ name: string; size?: number; src?: string }>();
const store = usePhoneStore();

const imgUrl = computed(() => props.src || store.avatarFor(props.name));
const initial = computed(() => (props.name || '?').trim().slice(0, 1).toUpperCase());

const hue = computed(() => {
  let h = 210;
  for (const ch of props.name || '') h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
});
</script>

<template>
  <div
    class="rounded-full overflow-hidden flex items-center justify-center shrink-0 font-semibold text-white select-none border border-white/40 shadow-sm"
    :style="{
      width: (size || 40) + 'px',
      height: (size || 40) + 'px',
      fontSize: Math.round((size || 40) * 0.42) + 'px',
      background: imgUrl ? 'transparent' : `linear-gradient(135deg, hsl(${hue}, 76%, 58%), hsl(${(hue + 38) % 360}, 72%, 48%))`,
    }"
  >
    <img v-if="imgUrl" :src="imgUrl" :alt="name" class="w-full h-full object-cover" />
    <span v-else>{{ initial }}</span>
  </div>
</template>
