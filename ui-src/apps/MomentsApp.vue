<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePhoneStore } from '@/bridge';
import AvatarBadge from '@/components/AvatarBadge.vue';

const store = usePhoneStore();
const tab = ref<'moments' | 'forum'>('moments');
const moments = ref<any[]>([]);
const forumPosts = ref<any[]>([]);
const hotTopics = ref<string[]>([]);
const refreshing = ref(false);
const showCompose = ref(false);
const postTitle = ref('');
const postText = ref('');
const commentDrafts = ref<Record<string, string>>({});

async function loadAll() {
  try {
    moments.value = (await store.api.listMoments?.()) || [];
    forumPosts.value = (await store.api.listForum?.()) || [];
    hotTopics.value = (await store.api.forumHot?.()) || [];
  } catch (e: any) {
    store.notify(e?.message || '加载动态失败', 'error');
  }
}

async function refreshFeed() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    if (tab.value === 'moments') {
      await store.api.momentsRefresh?.();
    } else {
      await store.api.forumRefresh?.();
    }
    await loadAll();
    store.notify(tab.value === 'moments' ? '朋友圈已刷新' : '论坛已刷新', 'success');
  } catch (e: any) {
    store.notify(e?.message || '刷新失败', 'error');
  } finally {
    refreshing.value = false;
  }
}

async function publish() {
  if (!postText.value.trim()) return;
  try {
    if (tab.value === 'moments') {
      await store.api.postMoment({ text: postText.value.trim() });
    } else {
      await store.api.postForum({ title: postTitle.value.trim(), text: postText.value.trim() });
    }
    postTitle.value = '';
    postText.value = '';
    showCompose.value = false;
    await loadAll();
    store.notify('发布成功', 'success');
  } catch (e: any) {
    store.notify(e?.message || '发布失败', 'error');
  }
}

async function toggleLike(id: string) {
  try {
    if (tab.value === 'moments') await store.api.likeMoment(id);
    else await store.api.likeForum(id);
    await loadAll();
  } catch {}
}

async function sendComment(id: string) {
  const text = (commentDrafts.value[id] || '').trim();
  if (!text) return;
  commentDrafts.value[id] = '';
  try {
    if (tab.value === 'moments') await store.api.commentMoment(id, { text });
    else await store.api.replyForum(id, { text });
    await loadAll();
  } catch (e: any) {
    store.notify(e?.message || '评论失败', 'error');
  }
}

async function removePost(id: string) {
  if (tab.value === 'moments') await store.api.deleteMoment?.(id);
  else await store.api.deleteForum?.(id);
  await loadAll();
}

onMounted(loadAll);
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
        <div class="flex p-0.5 rounded-full bg-black/10 dark:bg-white/10">
          <button
            class="px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
            :class="tab === 'moments' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
            @click="tab = 'moments'"
          >
            朋友圈
          </button>
          <button
            class="px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
            :class="tab === 'forum' ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
            @click="tab = 'forum'"
          >
            论坛
          </button>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button class="lg-pill px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer" :disabled="refreshing" @click="refreshFeed">
          {{ refreshing ? '刷新中…' : '✦ 刷一刷' }}
        </button>
        <button class="lg-btn-primary w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer" @click="showCompose = true">＋</button>
      </div>
    </header>

    <div class="flex-1 lg-scroll px-3 pb-4 space-y-3">
      <!-- Forum Hot Topics -->
      <div v-if="tab === 'forum' && hotTopics.length" class="lg-glass rounded-2xl p-3 space-y-1.5">
        <div class="text-[11px] font-bold opacity-65">🔥 实时热搜</div>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="(topic, i) in hotTopics" :key="i" class="lg-pill px-2.5 py-0.5 rounded-full text-[11px]">
            # {{ topic }}
          </span>
        </div>
      </div>

      <!-- Moments Feed -->
      <template v-if="tab === 'moments'">
        <div v-if="!moments.length" class="lg-glass rounded-3xl p-8 text-center text-xs opacity-65 mt-4">
          还没有动态，点「✦ 刷一刷」看看角色发了什么
        </div>
        <article v-for="p in moments" :key="p.id" class="lg-glass rounded-[24px] p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <AvatarBadge :name="p.author === 'me' ? store.api.userName?.() || '我' : p.author" :size="36" />
              <div>
                <div class="text-sm font-semibold">{{ p.author === 'me' ? (store.api.userName?.() || '我') : p.author }}</div>
                <div class="text-[10.5px] opacity-55">{{ p.at ? new Date(p.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '' }}</div>
              </div>
            </div>
            <button class="text-xs opacity-45 hover:opacity-100 cursor-pointer" @click="removePost(p.id)">✕</button>
          </div>

          <p class="text-[13.5px] leading-relaxed whitespace-pre-wrap">{{ p.text }}</p>

          <div class="flex items-center justify-between pt-1 border-t border-[var(--lg-divider)] text-xs">
            <button class="lg-pill px-3 py-1 rounded-full cursor-pointer" @click="toggleLike(p.id)">
              ♥ {{ p.likes?.length || 0 }}
            </button>
            <span class="opacity-55">{{ p.comments?.length || 0 }} 条评论</span>
          </div>

          <div v-if="p.comments?.length" class="space-y-1.5 bg-black/5 dark:bg-white/5 rounded-2xl p-2.5 text-xs">
            <div v-for="c in p.comments" :key="c.id">
              <span class="font-semibold">{{ c.from === 'me' ? '我' : c.from }}：</span>
              <span class="opacity-85">{{ c.text }}</span>
            </div>
          </div>

          <div class="flex gap-1.5">
            <input
              v-model="commentDrafts[p.id]"
              type="text"
              placeholder="写评论…"
              class="flex-1 h-8 px-3 rounded-full text-xs outline-none border border-[var(--lg-glass-border)]"
              style="background: var(--lg-input-bg); color: var(--lg-text);"
              @keydown.enter.prevent="sendComment(p.id)"
            />
            <button class="lg-pill px-3 rounded-full text-xs cursor-pointer" @click="sendComment(p.id)">发送</button>
          </div>
        </article>
      </template>

      <!-- Forum Feed -->
      <template v-else>
        <div v-if="!forumPosts.length" class="lg-glass rounded-3xl p-8 text-center text-xs opacity-65 mt-4">
          论坛空空如也，点「✦ 刷一刷」生成新帖
        </div>
        <article v-for="p in forumPosts" :key="p.id" class="lg-glass rounded-[24px] p-3.5 space-y-2">
          <div class="flex items-center justify-between text-xs opacity-65">
            <span>{{ p.author === 'me' ? '我' : p.author }}</span>
            <button class="cursor-pointer" @click="removePost(p.id)">✕</button>
          </div>
          <h3 v-if="p.title" class="font-bold text-sm">{{ p.title }}</h3>
          <p class="text-[13px] leading-relaxed whitespace-pre-wrap opacity-90">{{ p.text }}</p>
          <div class="flex items-center justify-between pt-1 border-t border-[var(--lg-divider)] text-xs">
            <button class="lg-pill px-3 py-1 rounded-full cursor-pointer" @click="toggleLike(p.id)">👍 {{ p.likes?.length || 0 }}</button>
            <span class="opacity-55">{{ p.replies?.length || 0 }} 楼</span>
          </div>
          <div v-if="p.replies?.length" class="space-y-1.5 bg-black/5 dark:bg-white/5 rounded-2xl p-2.5 text-xs">
            <div v-for="r in p.replies" :key="r.id">
              <span class="font-semibold">{{ r.from === 'me' ? '我' : r.from }}：</span>
              <span class="opacity-85">{{ r.text }}</span>
            </div>
          </div>
          <div class="flex gap-1.5">
            <input
              v-model="commentDrafts[p.id]"
              type="text"
              placeholder="跟帖回复…"
              class="flex-1 h-8 px-3 rounded-full text-xs outline-none border border-[var(--lg-glass-border)]"
              style="background: var(--lg-input-bg); color: var(--lg-text);"
              @keydown.enter.prevent="sendComment(p.id)"
            />
            <button class="lg-pill px-3 rounded-full text-xs cursor-pointer" @click="sendComment(p.id)">回复</button>
          </div>
        </article>
      </template>
    </div>

    <!-- Compose Modal -->
    <div v-if="showCompose" class="absolute inset-0 z-30 flex items-end p-3" style="background: rgba(0,0,0,0.38); backdrop-filter: blur(10px);" @click.self="showCompose = false">
      <div class="w-full lg-glass-strong rounded-[28px] p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm">{{ tab === 'moments' ? '发朋友圈' : '发新帖' }}</span>
          <button class="text-xs opacity-70 cursor-pointer" @click="showCompose = false">取消</button>
        </div>
        <input
          v-if="tab === 'forum'"
          v-model="postTitle"
          type="text"
          placeholder="帖子标题"
          class="w-full h-9 px-3 rounded-xl text-sm outline-none border border-[var(--lg-glass-border)]"
          style="background: var(--lg-input-bg); color: var(--lg-text);"
        />
        <textarea
          v-model="postText"
          rows="4"
          placeholder="分享此刻的想法…"
          class="w-full p-3 rounded-2xl text-sm outline-none resize-none border border-[var(--lg-glass-border)]"
          style="background: var(--lg-input-bg); color: var(--lg-text);"
        />
        <button class="lg-btn-primary w-full py-2.5 rounded-2xl text-sm font-semibold cursor-pointer" :disabled="!postText.trim()" @click="publish">
          发布
        </button>
      </div>
    </div>
  </div>
</template>
