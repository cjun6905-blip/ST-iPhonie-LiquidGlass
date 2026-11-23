<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePhoneStore } from '@/bridge';

interface LogEntry {
  id: string;
  at: number;
  source: string;
  level: 'info' | 'warn' | 'error';
  state: string;
  duration?: number;
  request?: unknown;
  response?: unknown;
}

const store = usePhoneStore();
const logs = ref<LogEntry[]>([]);
const levelFilter = ref<'all' | 'error' | 'warn' | 'info'>('all');
const query = ref('');
const expandedId = ref<string | null>(null);

function loadLogs() {
  logs.value = (store.api.getRequestLogs?.() || []) as LogEntry[];
}

function clearLogs() {
  if (!logs.value.length) return;
  if (!confirm('确定清空全部请求日志吗？')) return;
  store.api.clearRequestLogs?.();
  logs.value = [];
  expandedId.value = null;
  store.notify('日志已清空');
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return logs.value.filter(l => {
    if (levelFilter.value !== 'all' && l.level !== levelFilter.value) return false;
    if (!q) return true;
    const hay = `${l.source} ${l.state} ${formatPayload(l.request)} ${formatPayload(l.response)}`.toLowerCase();
    return hay.includes(q);
  });
});

function formatPayload(v: unknown): string {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function formatTime(at?: number): string {
  if (!at) return '';
  return new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

async function copyEntry(l: LogEntry) {
  const text = [
    `[${formatTime(l.at)}] ${l.source} (${l.level}) - ${l.state}${l.duration ? ` (${l.duration}ms)` : ''}`,
    l.request !== undefined ? `--- REQUEST ---\n${formatPayload(l.request)}` : '',
    l.response !== undefined ? `--- RESPONSE ---\n${formatPayload(l.response)}` : '',
  ].filter(Boolean).join('\n\n');
  try {
    await navigator.clipboard.writeText(text);
    store.notify('已复制该条日志', 'success');
  } catch {
    store.notify('复制失败，请手动选中文本', 'error');
  }
}

onMounted(loadLogs);
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
        <h1 class="text-lg font-bold tracking-tight">日志</h1>
        <span class="text-xs opacity-55">({{ filtered.length }})</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs">
        <button class="lg-pill px-2.5 py-1 rounded-full cursor-pointer" @click="loadLogs">刷新</button>
        <button class="lg-pill px-2.5 py-1 rounded-full text-red-500 cursor-pointer" @click="clearLogs">清空</button>
      </div>
    </header>

    <!-- Search & Level Filters -->
    <div class="px-3 pb-2 space-y-2 shrink-0">
      <input
        v-model="query"
        type="text"
        placeholder="搜索来源、状态、提示词或报错…"
        class="w-full h-9 px-3.5 rounded-full text-xs outline-none border border-[var(--lg-glass-border)]"
        style="background: var(--lg-input-bg); color: var(--lg-text);"
      />
      <div class="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/10 dark:bg-white/10 text-[11px]">
        <button
          v-for="f in ([['all', '全部'], ['error', '错误'], ['warn', '警告'], ['info', '正常']] as const)"
          :key="f[0]"
          class="py-1 rounded-xl font-semibold transition cursor-pointer"
          :class="levelFilter === f[0] ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
          @click="levelFilter = f[0]"
        >
          {{ f[1] }}
        </button>
      </div>
    </div>

    <!-- Log List -->
    <div class="flex-1 lg-scroll px-3 pb-4 space-y-2">
      <div v-if="!filtered.length" class="lg-glass rounded-3xl p-8 text-center text-xs opacity-65 mt-4">
        {{ logs.length ? '没有匹配的日志记录' : '暂无请求日志，发消息或生图后这里会记录完整请求与响应' }}
      </div>

      <article
        v-for="l in filtered"
        :key="l.id"
        class="lg-glass rounded-[20px] p-3 space-y-1.5 text-xs"
      >
        <button
          class="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
          @click="expandedId = expandedId === l.id ? null : l.id"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="l.level === 'error' ? 'bg-red-500' : l.level === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'"
            />
            <span class="font-semibold truncate">{{ l.source || '请求' }}</span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0 text-[10.5px] opacity-60">
            <span v-if="l.duration">{{ l.duration }}ms</span>
            <span>{{ formatTime(l.at) }}</span>
            <span>{{ expandedId === l.id ? '▾' : '▸' }}</span>
          </div>
        </button>

        <div class="text-[11.5px] opacity-80 break-words">{{ l.state }}</div>

        <!-- Expanded Request / Response Inspector -->
        <div v-if="expandedId === l.id" class="pt-2 mt-1 border-t border-[var(--lg-divider)] space-y-2">
          <div class="flex justify-end">
            <button class="lg-pill px-2.5 py-0.5 rounded-full text-[11px] cursor-pointer" @click="copyEntry(l)">复制完整内容</button>
          </div>
          <div v-if="formatPayload(l.request)" class="space-y-1">
            <div class="text-[10.5px] font-semibold opacity-60">REQUEST</div>
            <pre class="p-2.5 rounded-xl bg-black/15 dark:bg-black/40 text-[10.5px] leading-relaxed whitespace-pre-wrap break-all max-h-48 lg-scroll select-text">{{ formatPayload(l.request) }}</pre>
          </div>
          <div v-if="formatPayload(l.response)" class="space-y-1">
            <div class="text-[10.5px] font-semibold opacity-60">RESPONSE</div>
            <pre class="p-2.5 rounded-xl bg-black/15 dark:bg-black/40 text-[10.5px] leading-relaxed whitespace-pre-wrap break-all max-h-56 lg-scroll select-text">{{ formatPayload(l.response) }}</pre>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
