<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePhoneStore } from '@/bridge';
import AvatarBadge from '@/components/AvatarBadge.vue';

const store = usePhoneStore();
const targets = ref<string[]>([]);
const selected = ref<string | null>(null);
const snapshot = ref<any | null>(null);
const subTab = ref<'chats' | 'notes' | 'searches' | 'cart'>('chats');
const loading = ref(false);

async function loadTargets() {
  const roles = (store.api.rolesHere?.() || []).map((r: any) => r.name);
  const contacts = (store.api.chatContacts?.() || []).map((c: any) => c.name);
  targets.value = [...new Set([...roles, ...contacts])].filter(Boolean);
}

async function openPeek(name: string) {
  selected.value = name;
  snapshot.value = await store.api.getPeek?.(name).catch(() => null);
  store.api.markPeeked?.(name, 'home');
}

async function refreshPeek() {
  if (!selected.value || loading.value) return;
  loading.value = true;
  try {
    snapshot.value = await store.api.peekLook(selected.value);
    store.api.markPeeked?.(selected.value, subTab.value);
    store.notify(`已解锁 ${selected.value} 的手机内容`, 'success');
  } catch (e: any) {
    store.notify(e?.message || '偷看失败', 'error');
  } finally {
    loading.value = false;
  }
}

onMounted(loadTargets);
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button
          class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
          @click="selected ? (selected = null, snapshot = null) : store.goHome()"
        >
          ‹
        </button>
        <h1 class="text-lg font-bold tracking-tight">{{ selected ? `${selected} 的手机` : '查手机' }}</h1>
      </div>
      <button
        v-if="selected"
        class="lg-btn-primary px-3 py-1 rounded-full text-xs font-semibold cursor-pointer"
        :disabled="loading"
        @click="refreshPeek"
      >
        {{ loading ? '偷看中…' : '✦ 偷看' }}
      </button>
    </header>

    <!-- Target Picker -->
    <div v-if="!selected" class="flex-1 lg-scroll px-3 pb-4 space-y-2">
      <div v-if="!targets.length" class="lg-glass rounded-3xl p-8 text-center text-xs opacity-65 mt-4">
        还没有可查看的角色，请先在「角色」App 中添加
      </div>
      <button
        v-for="name in targets"
        :key="name"
        class="w-full lg-glass rounded-[22px] p-3 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
        @click="openPeek(name)"
      >
        <div class="flex items-center gap-3">
          <AvatarBadge :name="name" :size="44" />
          <div class="text-left">
            <div class="font-semibold text-sm">{{ name }}</div>
            <div class="text-xs opacity-60">点击拿起 TA 的手机</div>
          </div>
        </div>
        <span class="opacity-50 text-lg">›</span>
      </button>
    </div>

    <!-- Peek Snapshot View -->
    <div v-else class="flex-1 flex flex-col min-h-0 px-3 pb-4">
      <div class="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/10 dark:bg-white/10 mb-3 shrink-0">
        <button
          v-for="t in ([['chats', '聊天'], ['notes', '备忘'], ['searches', '搜索'], ['cart', '购物车']] as const)"
          :key="t[0]"
          class="py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
          :class="subTab === t[0] ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
          @click="subTab = t[0]"
        >
          {{ t[1] }}
        </button>
      </div>

      <div class="flex-1 lg-scroll space-y-2.5">
        <div v-if="!snapshot" class="lg-glass rounded-3xl p-8 text-center space-y-3 mt-4">
          <div class="text-3xl opacity-70">📱</div>
          <div class="text-xs opacity-70">还没有偷看过 {{ selected }} 的手机</div>
          <button class="lg-btn-primary px-5 py-2 rounded-full text-xs font-semibold cursor-pointer" :disabled="loading" @click="refreshPeek">
            {{ loading ? '正在解锁…' : '立即偷看' }}
          </button>
        </div>

        <template v-else-if="subTab === 'chats'">
          <div v-for="(c, i) in (snapshot.chats || [])" :key="i" class="lg-glass rounded-2xl p-3 space-y-1.5">
            <div class="font-semibold text-xs opacity-75">与 {{ c.with || c.name }} 的对话</div>
            <div v-for="(m, j) in (c.messages || [{ text: c.preview }])" :key="j" class="text-xs leading-relaxed opacity-90">
              <span v-if="m.from" class="font-semibold">{{ m.from }}：</span>{{ m.text }}
            </div>
          </div>
          <div v-if="!(snapshot.chats || []).length" class="text-center text-xs opacity-55 py-8">暂无聊天记录</div>
        </template>

        <template v-else-if="subTab === 'notes'">
          <div v-for="(n, i) in (snapshot.notes || [])" :key="i" class="lg-glass rounded-2xl p-3 space-y-1">
            <div v-if="n.title" class="font-semibold text-sm">{{ n.title }}</div>
            <div class="text-xs leading-relaxed opacity-85 whitespace-pre-wrap">{{ n.text || n }}</div>
          </div>
          <div v-if="!(snapshot.notes || []).length" class="text-center text-xs opacity-55 py-8">暂无备忘录</div>
        </template>

        <template v-else-if="subTab === 'searches'">
          <div class="lg-glass rounded-2xl p-3 space-y-2">
            <div v-for="(s, i) in (snapshot.searches || [])" :key="i" class="flex items-center gap-2 text-xs py-1 border-b last:border-0 border-[var(--lg-divider)]">
              <span class="opacity-50">🔍</span>
              <span>{{ typeof s === 'string' ? s : s.query || s.text }}</span>
            </div>
            <div v-if="!(snapshot.searches || []).length" class="text-center text-xs opacity-55 py-4">暂无搜索记录</div>
          </div>
        </template>

        <template v-else>
          <div v-for="(item, i) in (snapshot.cart || [])" :key="i" class="lg-glass rounded-2xl p-3 flex items-center justify-between text-xs">
            <span class="font-medium">{{ typeof item === 'string' ? item : item.name || item.title }}</span>
            <span v-if="item.price" class="font-bold text-rose-500">{{ item.price }}</span>
          </div>
          <div v-if="!(snapshot.cart || []).length" class="text-center text-xs opacity-55 py-8">购物车是空的</div>
        </template>
      </div>
    </div>
  </div>
</template>
