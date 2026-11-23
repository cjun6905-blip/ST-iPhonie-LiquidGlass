<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePhoneStore } from '@/bridge';

const store = usePhoneStore();

interface PhotoItem {
  id: string;
  name: string;
  at?: number;
  url: string;
  fav: boolean;
}

const photos = ref<PhotoItem[]>([]);
const filterFav = ref(false);
const viewing = ref<PhotoItem | null>(null);
const loading = ref(true);

const visiblePhotos = computed(() =>
  filterFav.value ? photos.value.filter(p => p.fav) : photos.value
);

function cleanupUrls() {
  for (const p of photos.value) {
    if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
  }
}

async function loadPhotos() {
  loading.value = true;
  cleanupUrls();
  try {
    const [list, favIds] = await Promise.all([
      store.api.listPhotos?.() || [],
      store.api.favoritePhotoIds?.() || [],
    ]);
    const favSet = new Set(favIds || []);
    const items: PhotoItem[] = [];
    for (const meta of (list || []).slice(0, 60)) {
      const full = await store.api.getPhoto?.(meta.id).catch(() => null);
      if (!full?.blob) continue;
      items.push({
        id: meta.id,
        name: meta.name || '图片',
        at: meta.at,
        url: URL.createObjectURL(full.blob),
        fav: favSet.has(meta.id),
      });
    }
    photos.value = items;
  } catch (e: any) {
    store.notify(e?.message || '读取相册失败', 'error');
  } finally {
    loading.value = false;
  }
}

async function toggleFav(item: PhotoItem) {
  const next = !item.fav;
  await store.api.favoritePhotos?.([item.id], next);
  item.fav = next;
}

async function removePhoto(item: PhotoItem) {
  if (!confirm('确定删除这张照片吗？')) return;
  await store.api.deletePhoto?.(item.id);
  viewing.value = null;
  await loadPhotos();
  store.notify('已删除照片');
}

async function insertPhoto(item: PhotoItem) {
  try {
    const recent = store.api.recentMessages?.(1) || [];
    if (!recent.length) throw Error('没有可插入的最新楼层');
    await store.api.insertImage(recent[0].id, item.id);
    store.notify('已插入最新楼层', 'success');
  } catch (e: any) {
    store.notify(e?.message || '插入失败', 'error');
  }
}

onMounted(loadPhotos);
onUnmounted(cleanupUrls);
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
        <h1 class="text-lg font-bold tracking-tight">相册</h1>
      </div>
      <div class="flex p-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
        <button
          class="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
          :class="!filterFav ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
          @click="filterFav = false"
        >
          全部
        </button>
        <button
          class="px-3 py-1 rounded-full font-semibold transition cursor-pointer"
          :class="filterFav ? 'bg-white/85 text-slate-900 shadow-sm' : 'opacity-70'"
          @click="filterFav = true"
        >
          收藏
        </button>
      </div>
    </header>

    <div class="flex-1 lg-scroll px-3 pb-4">
      <div v-if="loading" class="text-center text-xs opacity-60 py-10">加载相册中…</div>
      <div v-else-if="!visiblePhotos.length" class="lg-glass rounded-3xl p-8 text-center text-xs opacity-65 mt-4">
        {{ filterFav ? '还没有收藏的照片' : '相册还是空的，去「绘图」生成几张吧' }}
      </div>
      <div v-else class="grid grid-cols-3 gap-2">
        <button
          v-for="p in visiblePhotos"
          :key="p.id"
          class="relative aspect-square rounded-2xl overflow-hidden border border-white/30 shadow-sm cursor-pointer group"
          @click="viewing = p"
        >
          <img :src="p.url" :alt="p.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <span v-if="p.fav" class="absolute top-1.5 right-1.5 text-xs drop-shadow">❤️</span>
        </button>
      </div>
    </div>

    <!-- Fullscreen Lightbox -->
    <div
      v-if="viewing"
      class="absolute inset-0 z-30 flex flex-col justify-between p-4 bg-black/80 backdrop-blur-xl text-white"
      @click.self="viewing = null"
    >
      <div class="flex items-center justify-between pt-4">
        <span class="text-xs opacity-75 truncate">{{ viewing.name }}</span>
        <button class="lg-pill px-3 py-1 rounded-full text-xs text-white cursor-pointer" @click="viewing = null">关闭</button>
      </div>
      <img :src="viewing.url" :alt="viewing.name" class="max-h-[68%] w-full object-contain rounded-2xl" />
      <div class="flex items-center justify-center gap-2 pb-4 text-xs">
        <button class="lg-pill px-3.5 py-2 rounded-full text-white cursor-pointer" @click="toggleFav(viewing)">
          {{ viewing.fav ? '♥ 已收藏' : '♡ 收藏' }}
        </button>
        <button class="lg-pill px-3.5 py-2 rounded-full text-white cursor-pointer" @click="insertPhoto(viewing)">插入正文</button>
        <a :href="viewing.url" :download="viewing.name" class="lg-pill px-3.5 py-2 rounded-full text-white">下载</a>
        <button class="lg-pill px-3.5 py-2 rounded-full text-red-400 cursor-pointer" @click="removePhoto(viewing)">删除</button>
      </div>
    </div>
  </div>
</template>
