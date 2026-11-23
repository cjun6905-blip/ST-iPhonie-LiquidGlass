<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePhoneStore, type WallpaperId } from '@/bridge';

const store = usePhoneStore();
const busy = ref(false);
const showLogs = ref(false);
const logs = ref<any[]>([]);

const draw = computed(() => store.settings?.draw || {});
const general = computed(() => store.settings?.general || {});
const sync = computed(() => store.settings?.sync || {});

function patchDraw(patch: Record<string, any>) {
  store.api.saveDraw(patch);
  store.refreshState();
}

function patchGeneral(patch: Record<string, any>) {
  store.api.updateGeneral(patch);
  store.refreshState();
}

async function planLatestNow() {
  if (busy.value) return;
  busy.value = true;
  try {
    const ok = await store.api.planLatestPictures();
    store.notify(ok ? '已为最新回复规划无冲突插图' : '未挑出新画面', ok ? 'success' : 'info');
  } catch (e: any) {
    store.notify(e?.message || '规划失败', 'error');
  } finally {
    busy.value = false;
  }
}

async function clearAllChatPics() {
  if (!confirm('确定清空当前聊天生成的所有插图文件吗？')) return;
  const r = await store.api.clearChatPictures();
  store.notify(`已清理 ${r?.count || 0} 张插图`);
}

async function toggleSync() {
  const next = !sync.value.enabled;
  store.api.saveSync({ enabled: next });
  store.refreshState();
  if (next) {
    try {
      await store.api.syncNow();
      store.notify('已同步到酒馆文件', 'success');
    } catch (e: any) {
      store.notify(e?.message || '同步失败', 'error');
    }
  }
}

function openLogs() {
  logs.value = store.api.getRequestLogs?.() || [];
  showLogs.value = true;
}

const wallpapers: Array<{ id: WallpaperId; label: string }> = [
  { id: 'aurora', label: '极光' },
  { id: 'ocean', label: '深海' },
  { id: 'twilight', label: '暮霞' },
  { id: 'pearl', label: '珍珠' },
  { id: 'obsidian', label: '曜黑' },
];
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
        <h1 class="text-lg font-bold tracking-tight">设置</h1>
      </div>
      <span class="text-[11px] opacity-55">Liquid Glass</span>
    </header>

    <div class="flex-1 lg-scroll px-3 pb-5 space-y-3.5 text-sm">
      <!-- Zero-Conflict Story Picture Settings -->
      <section class="lg-glass rounded-[24px] p-4 space-y-3">
        <div>
          <div class="font-bold text-sm">正文配图（零冲突模式）</div>
          <div class="text-[11px] opacity-65 mt-0.5">插图独立存储在楼层元数据中，绝不改写正文原文，与其他正则/状态栏 0 冲突</div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs font-medium">启用正文配图</span>
          <button class="lg-switch" :data-on="!!draw.enabled" @click="patchDraw({ enabled: !draw.enabled })" />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs font-medium">回复后自动出图</span>
          <button class="lg-switch" :data-on="draw.auto !== false" @click="patchDraw({ auto: draw.auto === false })" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium">跳过 GPT / 扣点生图确认</div>
            <div class="text-[10.5px] opacity-60">开启后 GPT 生图与付费中转直接出图，不再弹窗确认</div>
          </div>
          <button class="lg-switch" :data-on="!!draw.skipPaidConfirm" @click="patchDraw({ skipPaidConfirm: !draw.skipPaidConfirm })" />
        </div>

        <div class="space-y-1.5">
          <div class="text-xs font-medium">插图展示位置</div>
          <div class="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/10 dark:bg-white/10 text-xs">
            <button
              class="py-1.5 rounded-xl font-semibold transition cursor-pointer"
              :class="(draw.placement || 'anchor') === 'anchor' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
              @click="patchDraw({ placement: 'anchor' })"
            >
              段落智能锚点
            </button>
            <button
              class="py-1.5 rounded-xl font-semibold transition cursor-pointer"
              :class="draw.placement === 'bottom' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
              @click="patchDraw({ placement: 'bottom' })"
            >
              纯楼层底部画廊
            </button>
          </div>
          <div class="text-[10.5px] opacity-55">「段落智能锚点」在找不到对应段落（如被前端美化正则重写）时会自动降级到楼层底部。</div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs font-medium">选中正文文字生图</span>
          <button class="lg-switch" :data-on="draw.selectionDraw !== false" @click="patchDraw({ selectionDraw: draw.selectionDraw === false })" />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs font-medium">图片默认收起为胶囊</span>
          <button class="lg-switch" :data-on="!!draw.fold" @click="patchDraw({ fold: !draw.fold })" />
        </div>

        <div class="flex gap-2 pt-1">
          <button class="lg-btn-primary flex-1 py-2 rounded-2xl text-xs font-semibold cursor-pointer" :disabled="busy" @click="planLatestNow">
            {{ busy ? '构思中…' : '✦ 给最新回复配图' }}
          </button>
          <button class="lg-pill px-3 py-2 rounded-2xl text-xs text-red-500 cursor-pointer" @click="clearAllChatPics">
            清空插图
          </button>
        </div>
      </section>

      <!-- Appearance -->
      <section class="lg-glass rounded-[24px] p-4 space-y-3">
        <div class="font-bold text-sm">外观与液态玻璃</div>
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/10 dark:bg-white/10 text-xs">
          <button
            v-for="t in (['system', 'light', 'dark'] as const)"
            :key="t"
            class="py-1.5 rounded-xl font-semibold transition cursor-pointer"
            :class="(store.settings?.theme || 'system') === t ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
            @click="store.setTheme(t)"
          >
            {{ t === 'system' ? '跟随系统' : t === 'light' ? '浅色玻璃' : '暗黑玻璃' }}
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="w in wallpapers"
            :key="w.id"
            class="lg-pill px-3 py-1 rounded-full text-xs cursor-pointer"
            :style="store.wallpaper === w.id ? { background: 'var(--lg-accent-soft)', borderColor: 'var(--lg-accent)' } : {}"
            @click="store.setWallpaper(w.id)"
          >
            {{ w.label }}
          </button>
        </div>
        <div class="flex items-center justify-between pt-1">
          <span class="text-xs font-medium">显示页面悬浮入口球</span>
          <button class="lg-switch" :data-on="general.floatingEnabled !== false" @click="patchGeneral({ floatingEnabled: general.floatingEnabled === false })" />
        </div>
      </section>

      <!-- Sync & Diagnostics -->
      <section class="lg-glass rounded-[24px] p-4 space-y-3">
        <div class="font-bold text-sm">同步与调试</div>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium">保存到酒馆（跨设备同步）</div>
            <div class="text-[10.5px] opacity-60">聊天记录、动态与设置同步到酒馆 user/files</div>
          </div>
          <button class="lg-switch" :data-on="!!sync.enabled" @click="toggleSync" />
        </div>
        <button class="lg-pill w-full py-2 rounded-2xl text-xs font-medium cursor-pointer" @click="store.openApp('logs')">
          打开完整请求日志 App
        </button>
      </section>
    </div>

    <!-- Logs Modal -->
    <div v-if="showLogs" class="absolute inset-0 z-30 flex items-end p-3" style="background: rgba(0,0,0,0.4); backdrop-filter: blur(10px);" @click.self="showLogs = false">
      <div class="w-full h-[78%] lg-glass-strong rounded-[28px] p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm">请求日志 ({{ logs.length }})</span>
          <div class="flex gap-2 text-xs">
            <button class="opacity-70 cursor-pointer" @click="store.api.clearRequestLogs?.(); logs = []">清空</button>
            <button class="font-semibold cursor-pointer" @click="showLogs = false">关闭</button>
          </div>
        </div>
        <div class="flex-1 lg-scroll space-y-2 text-[11px]">
          <div v-if="!logs.length" class="text-center opacity-55 py-8">暂无日志</div>
          <div v-for="l in logs" :key="l.id" class="p-2.5 rounded-2xl bg-black/10 dark:bg-white/10 space-y-1">
            <div class="flex items-center justify-between font-semibold">
              <span>{{ l.source }}</span>
              <span :class="l.level === 'error' ? 'text-red-400' : 'opacity-60'">{{ l.state }}</span>
            </div>
            <div class="opacity-70 break-all">{{ typeof l.response === 'string' ? l.response.slice(0, 180) : JSON.stringify(l.response || '').slice(0, 180) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
