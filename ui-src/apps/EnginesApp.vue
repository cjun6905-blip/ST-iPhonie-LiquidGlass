<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePhoneStore } from '@/bridge';

const store = usePhoneStore();
const tab = ref<'draw' | 'text'>('draw');

// NovelAI / Image Engine
const naiKey = ref('');
const naiRelay = ref('');
const naiOpus = ref(false);
const gptKey = ref('');
const gptUrl = ref('');
const comfyUrl = ref('');
const keyHintNai = ref('');
const keyHintGpt = ref('');

// Text LLM
const textMode = ref<'tavern' | 'custom'>('tavern');
const textUrl = ref('');
const textModel = ref('');
const textKey = ref('');

function loadFromSettings() {
  const s = store.settings || {};
  naiRelay.value = s.draw?.relay?.url || '';
  naiOpus.value = !!s.draw?.relay?.assumeOpus;
  gptUrl.value = s.draw?.gpt?.url || '';
  comfyUrl.value = s.draw?.comfy?.url || '';
  keyHintNai.value = store.api.keyHint?.('nai') || '';
  keyHintGpt.value = store.api.keyHint?.('gpt') || '';

  textMode.value = s.text?.mode === 'custom' ? 'custom' : 'tavern';
  textUrl.value = s.text?.url || '';
  textModel.value = s.text?.model || '';
}

function saveImageConfig() {
  try {
    if (naiKey.value.trim()) {
      store.api.setKey?.('nai', naiKey.value.trim());
      naiKey.value = '';
    }
    if (gptKey.value.trim()) {
      store.api.setKey?.('gpt', gptKey.value.trim());
      gptKey.value = '';
    }
    store.api.saveDraw({
      relay: { url: naiRelay.value.trim(), assumeOpus: naiOpus.value },
      gpt: { ...(store.settings?.draw?.gpt || {}), url: gptUrl.value.trim() },
      comfy: { ...(store.settings?.draw?.comfy || {}), url: comfyUrl.value.trim() },
    });
    store.refreshState();
    loadFromSettings();
    store.notify('绘图引擎配置已保存', 'success');
  } catch (e: any) {
    store.notify(e?.message || '保存失败', 'error');
  }
}

function saveTextConfig() {
  try {
    store.api.saveText({
      mode: textMode.value,
      url: textUrl.value.trim(),
      model: textModel.value.trim(),
    });
    if (textKey.value.trim() && store.settings?.text?.activePreset) {
      store.api.setTextKey?.(store.settings.text.activePreset, textKey.value.trim());
      textKey.value = '';
    }
    store.refreshState();
    store.notify('文字模型配置已保存', 'success');
  } catch (e: any) {
    store.notify(e?.message || '保存失败', 'error');
  }
}

onMounted(loadFromSettings);
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
        <h1 class="text-lg font-bold tracking-tight">引擎</h1>
      </div>
      <div class="flex p-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
        <button
          class="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
          :class="tab === 'draw' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
          @click="tab = 'draw'"
        >
          绘图接口
        </button>
        <button
          class="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
          :class="tab === 'text' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
          @click="tab = 'text'"
        >
          文字模型
        </button>
      </div>
    </header>

    <div class="flex-1 lg-scroll px-3 pb-4 space-y-3">
      <template v-if="tab === 'draw'">
        <!-- NovelAI -->
        <section class="lg-glass rounded-[24px] p-4 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm">NovelAI</span>
            <span class="text-[11px] opacity-65">{{ keyHintNai ? `已存密钥 …${keyHintNai}` : '未配置密钥' }}</span>
          </div>
          <input
            v-model="naiKey"
            type="password"
            placeholder="输入 pst- 开头的 Persistent Token"
            class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
          />
          <input
            v-model="naiRelay"
            type="text"
            placeholder="中转/反代地址（直连可留空）"
            class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
          />
          <label class="flex items-center justify-between text-xs pt-1 cursor-pointer">
            <span class="opacity-80">将此中转视为 Opus 免费档</span>
            <button type="button" class="lg-switch" :data-on="naiOpus" @click="naiOpus = !naiOpus" />
          </label>
        </section>

        <!-- GPT Image -->
        <section class="lg-glass rounded-[24px] p-4 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm">GPT 生图</span>
            <span class="text-[11px] opacity-65">{{ keyHintGpt ? `已存密钥 …${keyHintGpt}` : '未配置' }}</span>
          </div>
          <input
            v-model="gptKey"
            type="password"
            placeholder="OpenAI / 中转 API Key"
            class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
          />
          <input
            v-model="gptUrl"
            type="text"
            placeholder="接口地址（留空使用官方）"
            class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
          />
        </section>

        <!-- ComfyUI -->
        <section class="lg-glass rounded-[24px] p-4 space-y-2.5">
          <span class="font-bold text-sm block">ComfyUI</span>
          <input
            v-model="comfyUrl"
            type="text"
            placeholder="http://127.0.0.1:8188"
            class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
            style="background: var(--lg-input-bg); color: var(--lg-text);"
          />
        </section>

        <button class="lg-btn-primary w-full py-2.5 rounded-2xl text-sm font-semibold cursor-pointer" @click="saveImageConfig">
          保存绘图接口
        </button>
      </template>

      <template v-else>
        <section class="lg-glass rounded-[24px] p-4 space-y-3">
          <div class="text-sm font-bold">小手机文字模型</div>
          <div class="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/10 dark:bg-white/10 text-xs">
            <button
              class="py-1.5 rounded-xl font-semibold transition cursor-pointer"
              :class="textMode === 'tavern' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
              @click="textMode = 'tavern'"
            >
              跟随酒馆主模型
            </button>
            <button
              class="py-1.5 rounded-xl font-semibold transition cursor-pointer"
              :class="textMode === 'custom' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
              @click="textMode = 'custom'"
            >
              独立 OpenAI 接口
            </button>
          </div>

          <template v-if="textMode === 'custom'">
            <input
              v-model="textUrl"
              type="text"
              placeholder="Base URL（如 https://api.openai.com/v1）"
              class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
              style="background: var(--lg-input-bg); color: var(--lg-text);"
            />
            <input
              v-model="textKey"
              type="password"
              placeholder="API Key（留空保持不变）"
              class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
              style="background: var(--lg-input-bg); color: var(--lg-text);"
            />
            <input
              v-model="textModel"
              type="text"
              placeholder="模型名称（如 gpt-4o-mini / gemini-2.5-flash）"
              class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
              style="background: var(--lg-input-bg); color: var(--lg-text);"
            />
          </template>
          <p v-else class="text-xs opacity-70 leading-relaxed">
            直接使用当前 SillyTavern 连接的模型来回复聊天、刷朋友圈、查手机和规划正文插图，无需额外填写密钥。
          </p>

          <button class="lg-btn-primary w-full py-2.5 rounded-2xl text-sm font-semibold cursor-pointer" @click="saveTextConfig">
            保存文字模型
          </button>
        </section>
      </template>
    </div>
  </div>
</template>
