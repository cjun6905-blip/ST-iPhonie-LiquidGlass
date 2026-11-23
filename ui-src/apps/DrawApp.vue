<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePhoneStore } from '@/bridge';

const store = usePhoneStore();

const prompt = ref('');
const negative = ref('');
const idea = ref('');
const sizeKey = ref<'portrait' | 'landscape' | 'square'>('portrait');
const generating = ref(false);
const suggesting = ref(false);
const resultUrl = ref('');
const resultPhotoId = ref('');
const resultSeed = ref<number | null>(null);

const sizes = {
  portrait: { label: '竖图', width: 832, height: 1216 },
  landscape: { label: '横图', width: 1216, height: 832 },
  square: { label: '方图', width: 1024, height: 1024 },
};

const engine = computed(() => store.settings?.draw?.engine || 'nai');
const styles = computed(() => store.settings?.draw?.styles || []);
const activeStyle = computed(() => store.settings?.draw?.activeStyle || 'default');

function setEngine(eng: 'nai' | 'gpt' | 'comfy') {
  store.api.saveDraw({ engine: eng });
  store.refreshState();
}

function setStyle(id: string) {
  store.api.saveDraw({ activeStyle: id });
  store.refreshState();
}

async function suggestFromStory() {
  if (suggesting.value) return;
  suggesting.value = true;
  try {
    const r = await store.api.suggestPrompt();
    if (r?.prompt) prompt.value = r.prompt;
    store.notify('已从当前剧情提取画面提示词', 'success');
  } catch (e: any) {
    store.notify(e?.message || '提取失败', 'error');
  } finally {
    suggesting.value = false;
  }
}

async function writeFromIdea() {
  if (!idea.value.trim() || suggesting.value) return;
  suggesting.value = true;
  try {
    const r = await store.api.writePrompt(idea.value.trim());
    if (r?.prompt) prompt.value = r.prompt;
    idea.value = '';
    store.notify('已生成英文提示词', 'success');
  } catch (e: any) {
    store.notify(e?.message || '编写失败', 'error');
  } finally {
    suggesting.value = false;
  }
}

async function runDraw() {
  if (!prompt.value.trim() || generating.value) return;
  if (!store.api.drawReady?.()) {
    store.notify(store.api.drawMissing?.() || '请先在「引擎」配置绘图接口', 'error');
    return;
  }
  generating.value = true;
  try {
    const sz = sizes[sizeKey.value];
    const baseParams = store.settings?.draw?.params || {};
    const res = await store.api.generateImage({
      prompt: prompt.value.trim(),
      negative: negative.value.trim(),
      params: { ...baseParams, width: sz.width, height: sz.height },
      allowPaid: true,
      name: 'draw',
    });
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
    resultUrl.value = res.blob ? URL.createObjectURL(res.blob) : '';
    resultPhotoId.value = res.photoId || '';
    resultSeed.value = res.seed ?? null;
    store.notify('出图完成，已存入相册', 'success');
  } catch (e: any) {
    store.notify(e?.message || '出图失败', 'error');
  } finally {
    generating.value = false;
  }
}

async function insertToLatest() {
  if (!resultPhotoId.value) return;
  try {
    const recent = store.api.recentMessages?.(1) || [];
    if (!recent.length) throw Error('当前聊天没有可插入的楼层');
    await store.api.insertImage(recent[0].id, resultPhotoId.value);
    store.notify('已作为附件插入最新楼层（不修改正文）', 'success');
  } catch (e: any) {
    store.notify(e?.message || '插入失败', 'error');
  }
}

onMounted(() => {
  if (store.pendingDrawPayload) {
    const p = store.pendingDrawPayload;
    store.pendingDrawPayload = null;
    if (p.tag || p.prompt) prompt.value = p.tag || p.prompt;
    if (p.negative) negative.value = p.negative;
  }
});

onUnmounted(() => {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
});
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
        <h1 class="text-lg font-bold tracking-tight">绘图</h1>
      </div>
      <div class="flex p-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[11px]">
        <button
          v-for="e in ([['nai', 'NAI'], ['gpt', 'GPT'], ['comfy', 'Comfy']] as const)"
          :key="e[0]"
          class="px-2.5 py-1 rounded-full font-semibold transition cursor-pointer"
          :class="engine === e[0] ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
          @click="setEngine(e[0])"
        >
          {{ e[1] }}
        </button>
      </div>
    </header>

    <div class="flex-1 lg-scroll px-3 pb-4 space-y-3">
      <!-- Result Preview -->
      <div v-if="resultUrl" class="lg-glass rounded-[24px] p-2.5 space-y-2">
        <img :src="resultUrl" alt="生成结果" class="w-full rounded-[18px] object-cover max-h-[300px]" />
        <div class="flex items-center justify-between px-1 text-xs">
          <span class="opacity-60">Seed: {{ resultSeed ?? '-' }}</span>
          <div class="flex gap-1.5">
            <button class="lg-pill px-3 py-1 rounded-full cursor-pointer" @click="insertToLatest">插入最新楼层</button>
            <a :href="resultUrl" :download="`iphonie-${resultSeed || Date.now()}.png`" class="lg-pill px-3 py-1 rounded-full">保存</a>
          </div>
        </div>
      </div>

      <!-- AI Idea Helper -->
      <div class="lg-glass rounded-[22px] p-3 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold opacity-75">智能写提示词</span>
          <button class="lg-pill px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer" :disabled="suggesting" @click="suggestFromStory">
            {{ suggesting ? '提取中…' : '✦ 从剧情推荐' }}
          </button>
        </div>
        <div class="flex gap-1.5">
          <input
            v-model="idea"
            type="text"
            placeholder="用中文描述想画的画面…"
            class="flex-1 h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
            @keydown.enter.prevent="writeFromIdea"
          />
          <button class="lg-pill px-3 rounded-xl text-xs font-medium cursor-pointer" :disabled="suggesting || !idea.trim()" @click="writeFromIdea">
            帮我写
          </button>
        </div>
      </div>

      <!-- Prompt & Controls -->
      <div class="lg-glass rounded-[24px] p-3.5 space-y-3">
        <div class="space-y-1">
          <label class="text-xs font-semibold opacity-75">正面提示词 (Tags / Prompt)</label>
          <textarea
            v-model="prompt"
            rows="4"
            placeholder="1girl, moonlight, glass window, cinematic lighting..."
            class="w-full p-2.5 rounded-2xl text-xs leading-relaxed outline-none resize-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold opacity-75">负面提示词（可选）</label>
          <input
            v-model="negative"
            type="text"
            placeholder="lowres, bad anatomy..."
            class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
          />
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="(sz, k) in sizes"
            :key="k"
            class="lg-pill py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            :style="sizeKey === k ? { background: 'var(--lg-accent-soft)', borderColor: 'var(--lg-accent)' } : {}"
            @click="sizeKey = k"
          >
            {{ sz.label }}
          </button>
        </div>

        <div v-if="styles.length > 1" class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[11px] opacity-60">画风：</span>
          <button
            v-for="s in styles"
            :key="s.id"
            class="lg-pill px-2.5 py-0.5 rounded-full text-[11px] cursor-pointer"
            :style="activeStyle === s.id ? { background: 'var(--lg-accent-soft)', borderColor: 'var(--lg-accent)' } : {}"
            @click="setStyle(s.id)"
          >
            {{ s.name }}
          </button>
        </div>

        <button
          class="lg-btn-primary w-full py-2.5 rounded-2xl text-sm font-semibold cursor-pointer"
          :disabled="generating || !prompt.trim()"
          @click="runDraw"
        >
          {{ generating ? '正在绘制中…' : '✦ 开始生图' }}
        </button>
      </div>
    </div>
  </div>
</template>
