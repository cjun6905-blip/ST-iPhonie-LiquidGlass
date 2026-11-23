<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { usePhoneStore } from '@/bridge';
import AvatarBadge from '@/components/AvatarBadge.vue';

const store = usePhoneStore();

const threads = ref<any[]>([]);
const activeId = ref<string | null>(null);
const activeThread = ref<any | null>(null);
const draft = ref('');
const sending = ref(false);
const replying = ref(false);
const showNewModal = ref(false);
const newGroupName = ref('');
const selectedMembers = ref<string[]>([]);
const contacts = ref<any[]>([]);
const listEl = ref<HTMLElement | null>(null);

const formatTime = (ts?: number) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

async function loadThreads() {
  try {
    threads.value = (await store.api.listThreads?.()) || [];
    contacts.value = store.api.chatContacts?.() || [];
  } catch (e: any) {
    store.notify(e?.message || '读取会话失败', 'error');
  }
}

async function openThread(id: string) {
  activeId.value = id;
  try {
    activeThread.value = await store.api.getThread(id);
    await store.api.markThreadRead?.(id);
    await loadThreads();
    await nextTick();
    scrollBottom();
  } catch (e: any) {
    store.notify(e?.message || '打开会话失败', 'error');
  }
}

function scrollBottom() {
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
}

async function sendText() {
  const text = draft.value.trim();
  if (!text || !activeId.value || sending.value) return;
  sending.value = true;
  draft.value = '';
  try {
    activeThread.value = await store.api.appendChat(activeId.value, [{ from: 'me', kind: 'text', text }], { read: true });
    await nextTick();
    scrollBottom();
    if (store.settings?.chat?.autoReply) {
      await askReply();
    }
  } catch (e: any) {
    draft.value = text;
    store.notify(e?.message || '发送失败', 'error');
  } finally {
    sending.value = false;
  }
}

async function askReply() {
  if (!activeId.value || replying.value) return;
  replying.value = true;
  try {
    activeThread.value = await store.api.chatReply(activeId.value);
    await nextTick();
    scrollBottom();
  } catch (e: any) {
    store.notify(e?.message || '等待回复失败', 'error');
  } finally {
    replying.value = false;
  }
}

async function rerollReply() {
  if (!activeId.value || replying.value) return;
  replying.value = true;
  try {
    activeThread.value = await store.api.chatReroll(activeId.value);
    await nextTick();
    scrollBottom();
  } catch (e: any) {
    store.notify(e?.message || '重新生成失败', 'error');
  } finally {
    replying.value = false;
  }
}

async function bringToStory() {
  if (!activeThread.value?.messages?.length) return;
  const recentIds = activeThread.value.messages.slice(-6).map((m: any) => m.id);
  try {
    await store.api.chatBring(activeThread.value.id, recentIds);
    store.notify('已将最近消息带入下一轮正文剧情', 'success');
  } catch (e: any) {
    store.notify(e?.message || '带进剧情失败', 'error');
  }
}

async function removeThread(id: string) {
  if (!confirm('确定删除这个聊天会话吗？')) return;
  await store.api.deleteThread(id);
  activeId.value = null;
  activeThread.value = null;
  await loadThreads();
}

function toggleMember(name: string) {
  const i = selectedMembers.value.indexOf(name);
  if (i >= 0) selectedMembers.value.splice(i, 1);
  else selectedMembers.value.push(name);
}

async function createChat() {
  if (!selectedMembers.value.length) return;
  try {
    const isGroup = selectedMembers.value.length > 1;
    const t = await store.api.createThread({
      type: isGroup ? 'group' : 'dm',
      members: [...selectedMembers.value],
      name: isGroup ? (newGroupName.value.trim() || selectedMembers.value.join('、')) : undefined,
    });
    showNewModal.value = false;
    selectedMembers.value = [];
    newGroupName.value = '';
    await loadThreads();
    await openThread(t.id);
  } catch (e: any) {
    store.notify(e?.message || '创建会话失败', 'error');
  }
}

const threadTitle = computed(() => {
  const t = activeThread.value;
  if (!t) return '';
  return t.name || t.members?.join('、') || '聊天';
});

watch(() => store.pendingThreadId, id => {
  if (id) {
    store.pendingThreadId = null;
    openThread(id);
  }
});

onMounted(async () => {
  await loadThreads();
  if (store.pendingThreadId) {
    const id = store.pendingThreadId;
    store.pendingThreadId = null;
    await openThread(id);
  }
});
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Thread List View -->
    <template v-if="!activeId">
      <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
        <div class="flex items-center gap-2">
          <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
          <h1 class="text-lg font-bold tracking-tight">聊天</h1>
        </div>
        <button
          class="lg-btn-primary w-8 h-8 rounded-full flex items-center justify-center text-base font-bold cursor-pointer"
          title="新建聊天"
          @click="contacts = store.api.chatContacts?.() || []; showNewModal = true"
        >
          ＋
        </button>
      </header>

      <div class="flex-1 lg-scroll px-3 pb-4 space-y-2">
        <div v-if="!threads.length" class="lg-glass rounded-3xl p-8 text-center space-y-2 mt-6">
          <div class="text-3xl opacity-60">💬</div>
          <div class="text-sm font-semibold">还没有聊天会话</div>
          <div class="text-xs opacity-60">点右上角「＋」选择角色开始聊天</div>
        </div>

        <button
          v-for="t in threads"
          :key="t.id"
          class="w-full lg-glass rounded-[22px] p-3 flex items-center gap-3 text-left transition-transform active:scale-[0.98] cursor-pointer"
          @click="openThread(t.id)"
        >
          <div class="relative">
            <AvatarBadge :name="t.members?.[0] || t.name" :size="46" />
            <span
              v-if="t.unread > 0"
              class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
            >
              {{ t.unread }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-sm truncate">{{ t.name || t.members?.join('、') }}</span>
              <span class="text-[11px] opacity-50 shrink-0">{{ formatTime(t.updatedAt) }}</span>
            </div>
            <div class="text-xs opacity-65 truncate mt-0.5">{{ t.lastText || '轻点开始对话' }}</div>
          </div>
        </button>
      </div>
    </template>

    <!-- Conversation View -->
    <template v-else>
      <header class="flex items-center justify-between px-3 py-2 shrink-0 border-b border-[var(--lg-divider)]">
        <div class="flex items-center gap-2 min-w-0">
          <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer shrink-0" @click="activeId = null; activeThread = null; loadThreads()">‹</button>
          <AvatarBadge :name="activeThread?.members?.[0] || threadTitle" :size="32" />
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">{{ threadTitle }}</div>
            <div class="text-[10.5px] opacity-60">{{ replying ? '对方正在输入…' : (activeThread?.type === 'group' ? `${activeThread.members?.length || 0} 人群聊` : '在线') }}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button class="lg-pill px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer" title="将最近对话带入正文" @click="bringToStory">带进剧情</button>
          <button class="lg-pill w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer" title="重新回复" @click="rerollReply">↻</button>
          <button class="lg-pill w-7 h-7 rounded-full flex items-center justify-center text-xs text-red-500 cursor-pointer" title="删除会话" @click="removeThread(activeId!)">🗑</button>
        </div>
      </header>

      <div ref="listEl" class="flex-1 lg-scroll px-3 py-3 space-y-2.5">
        <div
          v-for="m in (activeThread?.messages || [])"
          :key="m.id"
          class="flex items-end gap-2"
          :class="m.from === 'me' ? 'flex-row-reverse' : ''"
        >
          <AvatarBadge v-if="m.from !== 'me'" :name="m.from" :size="28" />
          <div
            class="max-w-[78%] px-3.5 py-2 rounded-[20px] text-[13.5px] leading-relaxed break-words shadow-sm"
            :style="m.from === 'me'
              ? { background: 'var(--lg-bubble-me)', color: '#fff', borderBottomRightRadius: '6px' }
              : { background: 'var(--lg-bubble-them)', border: '1px solid var(--lg-glass-border)', borderBottomLeftRadius: '6px' }"
          >
            <div v-if="activeThread?.type === 'group' && m.from !== 'me'" class="text-[10.5px] opacity-60 mb-0.5 font-medium">{{ m.from }}</div>
            <div v-if="m.recall" class="italic opacity-60 text-xs">撤回了一条消息</div>
            <div v-else-if="m.kind === 'redpacket' || m.kind === 'transfer'" class="font-medium">
              🧧 {{ m.kind === 'redpacket' ? '红包' : '转账' }} {{ m.amount || '' }} {{ m.text || '' }}
            </div>
            <div v-else class="whitespace-pre-wrap">{{ m.text || (m.kind === 'photo' ? '[图片消息]' : '') }}</div>
          </div>
        </div>
      </div>

      <!-- Composer Bar -->
      <footer class="px-3 pt-2 pb-1 shrink-0 flex items-center gap-2">
        <input
          v-model="draft"
          type="text"
          placeholder="发消息…"
          class="flex-1 h-10 px-4 rounded-full text-sm outline-none border border-[var(--lg-glass-border)]"
          style="background: var(--lg-input-bg); color: var(--lg-text);"
          @keydown.enter.prevent="sendText"
        />
        <button
          v-if="draft.trim()"
          class="lg-btn-primary h-10 px-4 rounded-full text-xs font-semibold cursor-pointer shrink-0"
          :disabled="sending"
          @click="sendText"
        >
          发送
        </button>
        <button
          v-else
          class="lg-pill h-10 px-3.5 rounded-full text-xs font-semibold cursor-pointer shrink-0"
          :disabled="replying"
          @click="askReply"
        >
          {{ replying ? '思考中…' : '✦ 回复' }}
        </button>
      </footer>
    </template>

    <!-- New Chat Modal -->
    <div
      v-if="showNewModal"
      class="absolute inset-0 z-30 flex items-end p-3"
      style="background: rgba(0,0,0,0.38); backdrop-filter: blur(10px);"
      @click.self="showNewModal = false"
    >
      <div class="w-full lg-glass-strong rounded-[28px] p-4 space-y-3 max-h-[75%] flex flex-col">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm">选择联系人</span>
          <button class="text-xs opacity-70 cursor-pointer" @click="showNewModal = false">取消</button>
        </div>
        <input
          v-if="selectedMembers.length > 1"
          v-model="newGroupName"
          type="text"
          placeholder="群聊名称（可选）"
          class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
          style="background: var(--lg-input-bg); color: var(--lg-text);"
        />
        <div class="flex-1 lg-scroll space-y-1.5">
          <button
            v-for="c in contacts"
            :key="c.name"
            class="w-full lg-pill rounded-2xl px-3 py-2 flex items-center justify-between cursor-pointer"
            :style="selectedMembers.includes(c.name) ? { background: 'var(--lg-accent-soft)', borderColor: 'var(--lg-accent)' } : {}"
            @click="toggleMember(c.name)"
          >
            <div class="flex items-center gap-2.5">
              <AvatarBadge :name="c.name" :size="32" />
              <span class="text-sm font-medium">{{ c.name }}</span>
            </div>
            <span class="text-xs font-bold">{{ selectedMembers.includes(c.name) ? '✓' : '' }}</span>
          </button>
          <div v-if="!contacts.length" class="text-center text-xs opacity-60 py-6">
            暂无联系人，请先在「角色」App 中添加角色
          </div>
        </div>
        <button
          class="lg-btn-primary w-full py-2.5 rounded-2xl text-sm font-semibold cursor-pointer"
          :disabled="!selectedMembers.length"
          @click="createChat"
        >
          开始聊天（已选 {{ selectedMembers.length }} 人）
        </button>
      </div>
    </div>
  </div>
</template>
