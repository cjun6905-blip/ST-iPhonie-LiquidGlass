<script setup lang="ts">
import { computed } from 'vue';
import { usePhoneStore, type WallpaperId } from '@/bridge';

const store = usePhoneStore();

const wallpapers: Array<{ id: WallpaperId; label: string; dot: string }> = [
  { id: 'aurora', label: '极光', dot: 'linear-gradient(135deg,#38bdf8,#a855f7)' },
  { id: 'ocean', label: '深海', dot: 'linear-gradient(135deg,#22d3ee,#2563eb)' },
  { id: 'twilight', label: '暮霞', dot: 'linear-gradient(135deg,#fb7185,#f59e0b)' },
  { id: 'pearl', label: '珍珠', dot: 'linear-gradient(135deg,#bfdbfe,#fbcfe8)' },
  { id: 'obsidian', label: '曜黑', dot: 'linear-gradient(135deg,#4f46e5,#1e293b)' },
];

const drawEnabled = computed(() => !!store.settings?.draw?.enabled);
const placement = computed(() => store.settings?.draw?.placement === 'bottom' ? 'bottom' : 'anchor');

function toggleDraw() {
  store.api.saveDraw({ enabled: !drawEnabled.value });
  store.refreshState();
  store.notify(!drawEnabled.value ? '已开启正文自动配图' : '已关闭正文自动配图');
}

function togglePlacement() {
  const next = placement.value === 'anchor' ? 'bottom' : 'anchor';
  store.api.saveDraw({ placement: next });
  store.refreshState();
  store.notify(next === 'anchor' ? '插图模式：智能段落锚点（零冲突）' : '插图模式：楼层底部画廊');
}
</script>

<template>
  <Transition name="sheet-up">
    <div
      v-if="store.controlCenterOpen"
      class="absolute inset-0 z-40 flex flex-col p-4 pt-12"
      style="background: rgba(8, 12, 24, 0.36); backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);"
      @click.self="store.controlCenterOpen = false"
    >
      <div class="lg-glass-strong rounded-[28px] p-4 space-y-4 text-sm">
        <div class="flex items-center justify-between">
          <span class="font-semibold tracking-tight opacity-90">控制中心</span>
          <button
            class="lg-pill px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
            @click="store.controlCenterOpen = false"
          >
            完成
          </button>
        </div>

        <!-- Quick Toggles Grid -->
        <div class="grid grid-cols-2 gap-2.5">
          <button
            class="lg-pill rounded-2xl p-3 text-left flex flex-col gap-1 cursor-pointer"
            :style="drawEnabled ? { background: 'var(--lg-accent-soft)', borderColor: 'var(--lg-accent)' } : {}"
            @click="toggleDraw"
          >
            <span class="text-xs opacity-70">正文生图</span>
            <span class="font-semibold text-sm">{{ drawEnabled ? '已开启' : '已关闭' }}</span>
          </button>

          <button
            class="lg-pill rounded-2xl p-3 text-left flex flex-col gap-1 cursor-pointer"
            @click="togglePlacement"
          >
            <span class="text-xs opacity-70">插图位置（零冲突）</span>
            <span class="font-semibold text-sm">{{ placement === 'anchor' ? '段落锚点' : '底部画廊' }}</span>
          </button>
        </div>

        <!-- Theme Selector -->
        <div class="space-y-1.5">
          <div class="text-xs opacity-65 px-1">液态玻璃外观</div>
          <div class="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/10 dark:bg-white/10">
            <button
              v-for="t in (['system', 'light', 'dark'] as const)"
              :key="t"
              class="py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
              :class="(store.settings?.theme || 'system') === t ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-75 hover:opacity-100'"
              @click="store.setTheme(t)"
            >
              {{ t === 'system' ? '跟随系统' : t === 'light' ? '浅色玻璃' : '暗黑玻璃' }}
            </button>
          </div>
        </div>

        <!-- Wallpaper Picker -->
        <div class="space-y-1.5">
          <div class="text-xs opacity-65 px-1">动态壁纸</div>
          <div class="flex items-center justify-between gap-2">
            <button
              v-for="w in wallpapers"
              :key="w.id"
              class="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition cursor-pointer"
              :class="store.wallpaper === w.id ? 'bg-white/25 ring-1 ring-white/60' : 'opacity-75 hover:opacity-100'"
              @click="store.setWallpaper(w.id)"
            >
              <span class="w-7 h-7 rounded-full shadow-inner border border-white/50" :style="{ background: w.dot }" />
              <span class="text-[11px]">{{ w.label }}</span>
            </button>
          </div>
        </div>

        <!-- Window Actions -->
        <div class="flex items-center gap-2 pt-1">
          <button
            v-if="store.isFloating"
            class="lg-pill flex-1 py-2 rounded-2xl text-xs font-medium cursor-pointer"
            @click="store.toggleSize()"
          >
            窗口大小：{{ store.panelSizeLabel }}
          </button>
          <button
            class="lg-pill flex-1 py-2 rounded-2xl text-xs font-medium cursor-pointer"
            @click="store.controlCenterOpen = false; store.locked = true"
          >
            锁定屏幕
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
