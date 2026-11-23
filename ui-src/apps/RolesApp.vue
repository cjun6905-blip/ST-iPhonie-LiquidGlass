<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePhoneStore } from '@/bridge';
import AvatarBadge from '@/components/AvatarBadge.vue';

const store = usePhoneStore();
const roles = ref<any[]>([]);
const editing = ref<any | null>(null);

function loadRoles() {
  roles.value = store.api.rolesHere?.() || store.settings?.routes || [];
}

function startNew() {
  editing.value = { id: '', name: '', aliasesText: '', appearance: '' };
}

function startEdit(r: any) {
  editing.value = {
    id: r.id,
    name: r.name || '',
    aliasesText: (r.aliases || []).join('、'),
    appearance: r.appearance || '',
    engine: r.engine || 'fish',
    voice: r.voice || '',
  };
}

function saveRole() {
  if (!editing.value?.name?.trim()) return;
  try {
    const aliases = editing.value.aliasesText
      .split(/[,，、\s]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    store.api.saveRoute({
      ...(editing.value.id ? { id: editing.value.id } : {}),
      name: editing.value.name.trim(),
      aliases,
      appearance: editing.value.appearance.trim(),
      engine: editing.value.engine || 'fish',
      voice: editing.value.voice || '',
    });
    editing.value = null;
    store.refreshState();
    loadRoles();
    store.notify('角色信息已保存', 'success');
  } catch (e: any) {
    store.notify(e?.message || '保存角色失败', 'error');
  }
}

function removeRole(id: string) {
  if (!confirm('确定删除这个角色吗？')) return;
  store.api.deleteRoute(id);
  store.refreshState();
  loadRoles();
  store.notify('已删除角色');
}

onMounted(loadRoles);
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <header class="flex items-center justify-between px-4 py-2.5 shrink-0">
      <div class="flex items-center gap-2">
        <button class="lg-pill w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer" @click="store.goHome()">‹</button>
        <h1 class="text-lg font-bold tracking-tight">角色</h1>
      </div>
      <button class="lg-btn-primary w-8 h-8 rounded-full flex items-center justify-center text-base font-bold cursor-pointer" @click="startNew">＋</button>
    </header>

    <div class="flex-1 lg-scroll px-3 pb-4 space-y-2.5">
      <div v-if="!roles.length" class="lg-glass rounded-3xl p-8 text-center text-xs opacity-65 mt-4">
        还没有角色设定，点右上角「＋」添加角色与绘图外貌标签
      </div>
      <div
        v-for="r in roles"
        :key="r.id"
        class="lg-glass rounded-[22px] p-3 flex items-start gap-3"
      >
        <AvatarBadge :name="r.name" :size="44" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-sm truncate">{{ r.name }}</span>
            <div class="flex gap-1.5 text-xs shrink-0">
              <button class="lg-pill px-2.5 py-0.5 rounded-full cursor-pointer" @click="startEdit(r)">编辑</button>
              <button class="lg-pill px-2 py-0.5 rounded-full text-red-500 cursor-pointer" @click="removeRole(r.id)">删</button>
            </div>
          </div>
          <div v-if="r.aliases?.length" class="text-[11px] opacity-55 mt-0.5">别名：{{ r.aliases.join('、') }}</div>
          <div class="text-xs opacity-75 mt-1 line-clamp-2">
            {{ r.appearance ? `外貌：${r.appearance}` : '未填外貌标签（生图时自动补全）' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Sheet -->
    <div v-if="editing" class="absolute inset-0 z-30 flex items-end p-3" style="background: rgba(0,0,0,0.38); backdrop-filter: blur(10px);" @click.self="editing = null">
      <div class="w-full lg-glass-strong rounded-[28px] p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm">{{ editing.id ? '编辑角色' : '新建角色' }}</span>
          <button class="text-xs opacity-70 cursor-pointer" @click="editing = null">取消</button>
        </div>
        <input
          v-model="editing.name"
          type="text"
          placeholder="角色名字（与酒馆角色卡一致）"
          class="w-full h-9 px-3 rounded-xl text-sm outline-none border border-[var(--lg-glass-border)]"
          style="background: var(--lg-input-bg); color: var(--lg-text);"
        />
        <input
          v-model="editing.aliasesText"
          type="text"
          placeholder="别名（顿号或逗号分隔，可选）"
          class="w-full h-9 px-3 rounded-xl text-xs outline-none border border-[var(--lg-glass-border)]"
          style="background: var(--lg-input-bg); color: var(--lg-text);"
        />
        <textarea
          v-model="editing.appearance"
          rows="3"
          placeholder="绘图外貌英文标签（如 1girl, silver hair, blue eyes...）"
          class="w-full p-2.5 rounded-2xl text-xs outline-none resize-none border border-[var(--lg-glass-border)]"
          style="background: var(--lg-input-bg); color: var(--lg-text);"
        />
        <button class="lg-btn-primary w-full py-2.5 rounded-2xl text-sm font-semibold cursor-pointer" @click="saveRole">
          保存角色
        </button>
      </div>
    </div>
  </div>
</template>
