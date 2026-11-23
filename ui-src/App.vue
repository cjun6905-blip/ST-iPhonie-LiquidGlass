<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { usePhoneStore, type AppId } from '@/bridge';
import LiquidWallpaper from '@/components/LiquidWallpaper.vue';
import AppIcons from '@/components/AppIcons.vue';
import ControlCenter from '@/components/ControlCenter.vue';

const store = usePhoneStore();

const appComponents: Record<AppId, ReturnType<typeof defineAsyncComponent>> = {
  chat: defineAsyncComponent(() => import('@/apps/ChatApp.vue')),
  moments: defineAsyncComponent(() => import('@/apps/MomentsApp.vue')),
  peek: defineAsyncComponent(() => import('@/apps/PeekApp.vue')),
  draw: defineAsyncComponent(() => import('@/apps/DrawApp.vue')),
  gallery: defineAsyncComponent(() => import('@/apps/GalleryApp.vue')),
  roles: defineAsyncComponent(() => import('@/apps/RolesApp.vue')),
  engines: defineAsyncComponent(() => import('@/apps/EnginesApp.vue')),
  settings: defineAsyncComponent(() => import('@/apps/SettingsApp.vue')),
};

const gridApps: Array<{ id: AppId; label: string }> = [
  { id: 'chat', label: '聊天' },
  { id: 'moments', label: '动态' },
  { id: 'peek', label: '查手机' },
  { id: 'draw', label: '绘图' },
  { id: 'gallery', label: '相册' },
  { id: 'roles', label: '角色' },
  { id: 'engines', label: '引擎' },
  { id: 'settings', label: '设置' },
];

const dockApps: AppId[] = ['chat', 'moments', 'draw', 'settings'];

// Live clock
const now = ref(new Date());
let clockTimer: number | null = null;

onMounted(() => {
  clockTimer = window.setInterval(() => { now.value = new Date(); }, 10000);
});
onUnmounted(() => {
  if (clockTimer) window.clearInterval(clockTimer);
});

const timeText = computed(() =>
  now.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
);
const dateText = computed(() =>
  now.value.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
);

// Desktop floating drag support via ST-iPhonie host bridge
let dragging = false;
function onDragStart(e: PointerEvent) {
  if ((e.target as HTMLElement)?.closest('button')) return;
  dragging = true;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  store.api.panelDrag?.('start', e.screenX, e.screenY);
}
function onDragMove(e: PointerEvent) {
  if (!dragging) return;
  store.api.panelDrag?.('move', e.screenX, e.screenY);
}
function onDragEnd(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  store.api.panelDrag?.('end', e.screenX, e.screenY);
}
function onDragReset() {
  store.api.panelDrag?.('reset', 0, 0);
}

const planningLatest = ref(false);
async function quickPlanLatest() {
  if (planningLatest.value) return;
  planningLatest.value = true;
  try {
    const ok = await store.api.planLatestPictures();
    store.notify(ok ? '已为最新楼层规划插图（零冲突）' : '未挑出新画面', ok ? 'success' : 'info');
  } catch (e: any) {
    store.notify(e?.message || '配图失败', 'error');
  } finally {
    planningLatest.value = false;
  }
}

const islandExpanded = computed(() => !!store.toast || store.drawQueueCount > 0);
const isPearlLight = computed(() => store.wallpaper === 'pearl' && !store.isDark);
</script>

<template>
  <div
    class="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 select-none"
    :class="store.isDark ? 'dark-glass' : ''"
  >
    <!-- Desktop Floating Drag Bar -->
    <div
      v-if="store.isFloating"
      class="w-full max-w-[392px] flex items-center justify-between px-3 py-1.5 mb-1.5 rounded-full lg-glass text-xs cursor-grab active:cursor-grabbing"
      title="按住拖动，双击复位"
      @pointerdown="onDragStart"
      @pointermove="onDragMove"
      @pointerup="onDragEnd"
      @pointercancel="onDragEnd"
      @dblclick="onDragReset"
    >
      <div class="flex items-center gap-2 opacity-85 font-medium">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <span>ST-iPhonie</span>
        <span v-if="store.isMock" class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/25 text-amber-200">预览</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          class="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 transition cursor-pointer"
          title="切换窗口大小"
          @click="store.toggleSize()"
        >
          {{ store.panelSizeLabel }}
        </button>
        <button
          class="w-5 h-5 rounded-full bg-white/15 hover:bg-red-500/80 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="关闭小手机"
          @click="store.closePhone()"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- iPhone Titanium Bezel Chassis -->
    <div
      class="relative w-full h-full max-w-[392px] max-h-[820px] flex-1 rounded-[46px] p-[6px] shadow-[0_28px_60px_-14px_rgba(0,0,0,0.55)]"
      :style="{ background: 'var(--lg-bezel)' }"
    >
      <!-- Inner Screen -->
      <div
        class="relative w-full h-full rounded-[40px] overflow-hidden flex flex-col"
        :style="{ background: 'var(--lg-bezel-inner)' }"
      >
        <!-- Animated Liquid Glass Wallpaper -->
        <LiquidWallpaper :wallpaper="store.wallpaper" :dark="store.isDark" />

        <!-- Status Bar -->
        <header
          class="relative z-30 flex items-center justify-between px-6 pt-3 pb-1 text-[12px] font-semibold shrink-0"
          :class="isPearlLight && !store.activeApp ? 'text-slate-800' : 'text-white'"
        >
          <span class="tracking-tight w-14">{{ timeText }}</span>

          <!-- Dynamic Island -->
          <button
            class="relative flex items-center justify-center gap-2 px-3 rounded-full bg-black/90 text-white border border-white/15 shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-all duration-300 cursor-pointer overflow-hidden"
            :style="{
              minWidth: islandExpanded ? '185px' : '94px',
              maxWidth: '215px',
              height: islandExpanded ? '30px' : '26px',
            }"
            @click="store.toast ? (store.toast = null) : (store.controlCenterOpen = !store.controlCenterOpen)"
          >
            <template v-if="store.toast">
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="store.toast.kind === 'error' ? 'bg-red-400' : store.toast.kind === 'success' ? 'bg-emerald-400' : 'bg-sky-400'"
              />
              <span class="text-[11px] font-medium truncate">{{ store.toast.text }}</span>
            </template>
            <template v-else-if="store.drawQueueCount > 0">
              <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
              <span class="text-[11px] font-medium">正在出图 · {{ store.drawQueueCount }}</span>
            </template>
            <template v-else>
              <span class="w-2.5 h-2.5 rounded-full bg-[#121622] border border-white/10 ml-auto mr-0.5" />
            </template>
          </button>

          <!-- Control Center Trigger -->
          <button
            class="w-14 flex items-center justify-end gap-1.5 opacity-90 hover:opacity-100 cursor-pointer"
            title="打开控制中心"
            @click="store.controlCenterOpen = !store.controlCenterOpen"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 18 12" fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="15" y="0" width="3" height="12" rx="1" />
            </svg>
            <span class="inline-block w-5 h-2.5 rounded-[3px] border border-current p-[1.5px]">
              <span class="block w-full h-full rounded-[1.5px] bg-current" />
            </span>
          </button>
        </header>

        <!-- Home Screen -->
        <main
          v-show="!store.activeApp && !store.locked"
          class="relative z-10 flex-1 flex flex-col justify-between px-5 pt-3 pb-4 overflow-hidden"
        >
          <!-- Top Hero Glass Widget -->
          <div class="space-y-4">
            <div class="lg-glass rounded-[28px] p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="text-[11px] font-medium opacity-65 tracking-wide uppercase">
                    {{ store.space?.name || 'SillyTavern' }}
                  </div>
                  <div class="text-2xl font-bold tracking-tight mt-0.5 leading-none">
                    {{ timeText }}
                  </div>
                  <div class="text-xs opacity-70 mt-1">{{ dateText }}</div>
                </div>
                <div class="flex flex-col items-end gap-1.5">
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                    :class="store.settings?.draw?.enabled
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-500/15 border-white/25 opacity-70'"
                  >
                    {{ store.settings?.draw?.enabled ? '零冲突出图 · 开' : '正文出图 · 关' }}
                  </span>
                  <button
                    class="lg-pill px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer"
                    :disabled="planningLatest"
                    @click="quickPlanLatest"
                  >
                    {{ planningLatest ? '构思中…' : '✦ 给最新楼配图' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- App Grid (4 x 2) -->
            <div class="grid grid-cols-4 gap-y-5 gap-x-2 pt-2">
              <button
                v-for="app in gridApps"
                :key="app.id"
                class="group flex flex-col items-center gap-1.5 cursor-pointer focus:outline-none"
                @click="store.openApp(app.id)"
              >
                <div class="relative transition-transform duration-200 group-hover:scale-105 group-active:scale-90">
                  <AppIcons :id="app.id" :size="56" />
                  <span
                    v-if="app.id === 'chat' && store.unreadCount > 0"
                    class="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md border border-white/40"
                  >
                    {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
                  </span>
                </div>
                <span
                  class="text-[11.5px] font-medium tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                  :class="isPearlLight ? 'text-slate-800 drop-shadow-none' : 'text-white/95'"
                >
                  {{ app.label }}
                </span>
              </button>
            </div>
          </div>

          <!-- Floating Liquid Glass Dock -->
          <nav class="lg-glass rounded-[30px] px-4 py-3 flex items-center justify-between mx-1 mb-1">
            <button
              v-for="id in dockApps"
              :key="id"
              class="relative transition-transform duration-200 hover:scale-108 active:scale-90 cursor-pointer"
              @click="store.openApp(id)"
            >
              <AppIcons :id="id" :size="52" />
              <span
                v-if="id === 'chat' && store.unreadCount > 0"
                class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
              >
                {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
              </span>
            </button>
          </nav>
        </main>

        <!-- Active App Window -->
        <Transition name="app-zoom">
          <section
            v-if="store.activeApp && !store.locked"
            class="absolute inset-0 z-20 flex flex-col pt-11 pb-5"
            :style="{
              background: 'var(--lg-app-bg)',
              backdropFilter: 'blur(38px) saturate(190%)',
              WebkitBackdropFilter: 'blur(38px) saturate(190%)',
            }"
          >
            <component :is="appComponents[store.activeApp]" class="flex-1 min-h-0 flex flex-col" />
          </section>
        </Transition>

        <!-- Lock Screen -->
        <Transition name="sheet-up">
          <div
            v-if="store.locked"
            class="absolute inset-0 z-30 flex flex-col items-center justify-between py-16 px-6 text-white cursor-pointer"
            style="background: rgba(6, 10, 22, 0.25); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
            @click="store.locked = false"
          >
            <div class="text-center mt-4">
              <div class="text-sm font-medium opacity-85">{{ dateText }}</div>
              <div class="text-7xl font-bold tracking-tight mt-1 drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
                {{ timeText }}
              </div>
            </div>
            <div class="lg-pill px-5 py-2 rounded-full text-xs font-medium text-white/90">
              轻点屏幕解锁
            </div>
          </div>
        </Transition>

        <!-- Control Center Overlay -->
        <ControlCenter />

        <!-- Home Indicator -->
        <div class="absolute bottom-1.5 inset-x-0 z-50 flex justify-center pointer-events-none">
          <button
            class="w-32 h-1.5 rounded-full transition-all duration-200 pointer-events-auto cursor-pointer hover:w-36"
            :class="store.isDark || !store.activeApp ? 'bg-white/75 hover:bg-white' : 'bg-slate-900/40 hover:bg-slate-900/70'"
            title="返回桌面"
            @click="store.locked ? (store.locked = false) : store.goHome()"
          />
        </div>
      </div>
    </div>
  </div>
</template>
