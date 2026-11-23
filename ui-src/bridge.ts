import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type AppId =
  | 'chat'
  | 'moments'
  | 'peek'
  | 'draw'
  | 'gallery'
  | 'roles'
  | 'engines'
  | 'settings';

export type WallpaperId = 'aurora' | 'ocean' | 'twilight' | 'pearl' | 'obsidian';

export interface ToastNotice {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
}

export interface AvatarsMap {
  me: string;
  characters: Record<string, string>;
}

/** Connect to SillyTavern host bridge, or return a safe interactive mock when previewed standalone. */
function createMockApi(): any {
  let state: any = {
    theme: 'system',
    general: { floatingEnabled: true, storyTools: true, voiceEnabled: false },
    routes: [
      { id: 'r1', name: '林晚星', aliases: ['晚星'], engine: 'fish', voice: '', appearance: '1girl, long silver hair, amber eyes, white cardigan' },
      { id: 'r2', name: '陆沉舟', aliases: ['沉舟'], engine: 'fish', voice: '', appearance: '1boy, black hair, sharp eyes, dark trench coat' },
    ],
    draw: {
      enabled: true,
      auto: true,
      placement: 'anchor',
      fold: false,
      selectionDraw: true,
      engine: 'nai',
      params: { model: 'nai-diffusion-4-5-full', width: 832, height: 1216, steps: 28, scale: 5 },
      relay: { url: '', assumeOpus: false },
      styles: [{ id: 'default', name: '默认画风', positive: 'masterpiece, best quality', negative: 'lowres, bad anatomy' }],
      activeStyle: 'default',
      presets: [{ id: 'default', name: '默认正文配图', count: 1 }],
      activePreset: 'default',
    },
    chat: { partition: 'card', autoReply: false, presets: [{ id: 'default', name: '日常聊天' }], activePreset: 'default' },
    moments: { auto: false, every: 3, dailyMax: 5, images: true, replyToMe: true },
    forum: { auto: false, every: 5, dailyMax: 3 },
    text: { mode: 'tavern', url: '', model: '', presets: [], activePreset: '' },
    sync: { enabled: false },
  };
  const threads: any[] = [
    {
      id: 't1',
      type: 'dm',
      name: '林晚星',
      members: ['林晚星'],
      unread: 1,
      updatedAt: Date.now() - 120000,
      lastText: '刚路过便利店，给你带了热可可，一会儿见~',
      messages: [
        { id: 'm1', from: '林晚星', kind: 'text', text: '今晚的风好舒服，你在做什么呀？', at: Date.now() - 300000 },
        { id: 'm2', from: 'me', kind: 'text', text: '在看新换的液态玻璃主题手机界面！', at: Date.now() - 200000 },
        { id: 'm3', from: '林晚星', kind: 'text', text: '刚路过便利店，给你带了热可可，一会儿见~', at: Date.now() - 120000 },
      ],
    },
  ];
  const moments: any[] = [
    {
      id: 'mo1',
      author: '林晚星',
      text: '晚霞把玻璃窗染成了琥珀色，随手拍了一张。',
      at: Date.now() - 1800000,
      likes: ['陆沉舟'],
      comments: [{ id: 'c1', from: '陆沉舟', text: '构图不错。', at: Date.now() - 900000 }],
    },
  ];
  const forum: any[] = [
    {
      id: 'f1',
      author: '匿名路人',
      title: '最近城南新开的那家深夜咖啡馆怎么样？',
      text: '听说靠窗位置很适合看雨，有没有去过的分享一下体验？',
      at: Date.now() - 3600000,
      likes: [],
      replies: [{ id: 'fr1', from: '林晚星', text: '热拿铁拉花很好看，安静不吵。', at: Date.now() - 1200000 }],
    },
  ];
  const listeners = new Set<(e: any) => void>();
  const emit = (e: any) => listeners.forEach(fn => fn(e));
  return {
    __mock: true,
    apiVersion: '1.0',
    getState: () => structuredClone(state),
    save: (next: any) => { state = structuredClone(next); emit({ type: 'settings' }); return structuredClone(state); },
    updateGeneral: (patch: any) => { state.general = { ...state.general, ...patch }; emit({ type: 'settings' }); return structuredClone(state); },
    saveDraw: (patch: any) => { state.draw = { ...state.draw, ...patch }; emit({ type: 'settings' }); return structuredClone(state.draw); },
    saveText: (patch: any) => { state.text = { ...state.text, ...patch }; emit({ type: 'settings' }); return structuredClone(state.text); },
    saveMoments: (patch: any) => { state.moments = { ...state.moments, ...patch }; return structuredClone(state.moments); },
    saveForum: (patch: any) => { state.forum = { ...state.forum, ...patch }; return structuredClone(state.forum); },
    saveChatOptions: (patch: any) => { state.chat = { ...state.chat, ...patch }; return structuredClone(state.chat); },
    saveSync: (patch: any) => { state.sync = { ...state.sync, ...patch }; return structuredClone(state.sync); },
    syncStatus: () => ({ enabled: !!state.sync.enabled, available: false, state: 'idle' }),
    syncNow: async () => ({ enabled: !!state.sync.enabled, available: false, state: 'idle' }),
    subscribe: (fn: (e: any) => void) => { listeners.add(fn); return () => listeners.delete(fn); },
    close: () => {},
    userName: () => '你',
    tavernAvatars: () => ({ me: '', characters: {} }),
    phoneSpace: () => ({ key: 'preview', name: '预览模式', members: ['林晚星', '陆沉舟'], on: true }),
    rolesHere: () => structuredClone(state.routes),
    saveRoute: (r: any) => {
      const idx = state.routes.findIndex((x: any) => x.id === r.id);
      const item = { id: r.id || 'r-' + Date.now(), engine: 'fish', voice: '', ...r };
      if (idx >= 0) state.routes[idx] = item; else state.routes.push(item);
      emit({ type: 'settings' });
      return item;
    },
    deleteRoute: (id: string) => { state.routes = state.routes.filter((x: any) => x.id !== id); emit({ type: 'settings' }); return state; },
    chatContacts: () => state.routes.map((r: any) => ({ name: r.name, source: 'role' })),
    listThreads: async () => threads.map(t => ({ ...t })),
    getThread: async (id: string) => structuredClone(threads.find(t => t.id === id) || null),
    createThread: async (v: any) => {
      const t = { id: 't-' + Date.now(), type: v.type, name: v.name || v.members.join('、'), members: v.members, unread: 0, updatedAt: Date.now(), lastText: '', messages: [] };
      threads.unshift(t);
      return structuredClone(t);
    },
    deleteThread: async (id: string) => { const i = threads.findIndex(t => t.id === id); if (i >= 0) threads.splice(i, 1); return true; },
    markThreadRead: async (id: string) => { const t = threads.find(x => x.id === id); if (t) t.unread = 0; return structuredClone(t); },
    appendChat: async (id: string, msgs: any[]) => {
      const t = threads.find(x => x.id === id);
      if (!t) throw Error('会话不存在');
      for (const m of msgs) {
        const item = { id: 'm-' + Date.now() + Math.random(), at: Date.now(), ...m };
        t.messages.push(item);
        t.lastText = item.text || '[消息]';
        t.updatedAt = item.at;
      }
      return structuredClone(t);
    },
    chatReply: async (id: string) => {
      const t = threads.find(x => x.id === id);
      if (!t) throw Error('会话不存在');
      await new Promise(r => setTimeout(r, 600));
      const reply = { id: 'm-' + Date.now(), from: t.members[0] || '角色', kind: 'text', text: '（预览模式自动回复）收到啦！这个液态玻璃质感真顺眼。', at: Date.now() };
      t.messages.push(reply); t.lastText = reply.text; t.updatedAt = reply.at;
      return structuredClone(t);
    },
    chatReroll: async (id: string) => threads.find(x => x.id === id),
    chatCancel: () => {},
    chatBring: async () => ({ count: 1 }),
    chatUnread: async () => threads.reduce((s, t) => s + (t.unread || 0), 0),
    listMoments: async () => structuredClone(moments),
    postMoment: async (p: any) => { const item = { id: 'mo-' + Date.now(), author: 'me', text: p.text, at: Date.now(), likes: [], comments: [] }; moments.unshift(item); return item; },
    likeMoment: async (id: string) => { const m = moments.find(x => x.id === id); if (m) { const i = m.likes.indexOf('me'); if (i >= 0) m.likes.splice(i, 1); else m.likes.push('me'); } return structuredClone(m); },
    commentMoment: async (id: string, c: any) => { const m = moments.find(x => x.id === id); const cm = { id: 'c-' + Date.now(), from: 'me', text: c.text, at: Date.now() }; m?.comments.push(cm); return { post: structuredClone(m), comment: cm }; },
    deleteMoment: async (id: string) => { const i = moments.findIndex(x => x.id === id); if (i >= 0) moments.splice(i, 1); return true; },
    momentsRefresh: async () => [],
    listForum: async () => structuredClone(forum),
    forumHot: async () => ['深夜咖啡馆打卡', '雨天城市漫步', '最近在听什么歌'],
    postForum: async (p: any) => { const item = { id: 'f-' + Date.now(), author: 'me', title: p.title, text: p.text, at: Date.now(), likes: [], replies: [] }; forum.unshift(item); return item; },
    replyForum: async (id: string, r: any) => { const f = forum.find(x => x.id === id); const rp = { id: 'fr-' + Date.now(), from: 'me', text: r.text, at: Date.now() }; f?.replies.push(rp); return { post: structuredClone(f), reply: rp }; },
    likeForum: async (id: string) => { const f = forum.find(x => x.id === id); if (f) { const i = f.likes.indexOf('me'); if (i >= 0) f.likes.splice(i, 1); else f.likes.push('me'); } return structuredClone(f); },
    forumRefresh: async () => [],
    listPeeks: async () => [],
    getPeek: async () => null,
    peekLook: async (name: string) => ({
      name,
      at: Date.now(),
      chats: [{ with: '闺蜜', preview: '今天那件外套好好看', messages: [{ from: name, text: '明天一起去买甜点吗' }] }],
      notes: [{ title: '备忘', text: '记得买热可可和草莓蛋糕' }],
      searches: ['液态玻璃壁纸高清', '附近评分最高的咖啡店'],
      cart: [{ name: '银色简约手表', price: '¥499' }],
      album: [],
    }),
    markPeeked: () => true,
    drawReady: () => false,
    drawMissing: () => '预览模式（请在酒馆内配置 NovelAI / GPT / ComfyUI 密钥）',
    drawQueue: () => [],
    listPhotos: async () => [],
    favoritePhotoIds: async () => [],
    favoritePhotos: async () => true,
    deletePhoto: async () => true,
    getPhoto: async () => null,
    chatPictureStats: () => ({ count: 0 }),
    planLatestPictures: async () => false,
    clearChatPictures: async () => ({ count: 0, failed: 0 }),
    recentMessages: () => [],
    getRequestLogs: () => [],
    clearRequestLogs: () => {},
    keyHint: () => '',
    setKey: () => {},
    clearKey: () => {},
    panelFloating: () => true,
    panelSizeName: () => '中',
    panelSize: () => '中',
    panelDrag: () => {},
    takeApp: () => null,
    takeThread: () => null,
    takeDraw: () => null,
  };
}

let cachedApi: any = null;

export function getApi(): any {
  if (cachedApi) return cachedApi;
  try {
    const bridge = (window.parent as any)?.__stIphoniePanelBridge;
    if (bridge?.connect) {
      cachedApi = bridge.connect(window);
      return cachedApi;
    }
  } catch {
    // standalone preview fallback
  }
  cachedApi = createMockApi();
  return cachedApi;
}

export const usePhoneStore = defineStore('phone', () => {
  const api = getApi();
  const isMock = !!api.__mock;

  const settings = ref<any>(api.getState());
  const activeApp = ref<AppId | null>(null);
  const locked = ref<boolean>(false);
  const controlCenterOpen = ref<boolean>(false);
  const wallpaper = ref<WallpaperId>(
    (localStorage.getItem('st_iphonie_lg_wallpaper') as WallpaperId) || 'aurora'
  );
  const unreadCount = ref<number>(0);
  const drawQueueCount = ref<number>(0);
  const pendingThreadId = ref<string | null>(null);
  const pendingDrawPayload = ref<any>(null);
  const avatars = ref<AvatarsMap>(api.tavernAvatars?.() || { me: '', characters: {} });
  const space = ref<any>(api.phoneSpace?.() || { key: '', name: '', members: [], on: false });
  const toast = ref<ToastNotice | null>(null);
  let toastTimer: number | null = null;

  const systemDark = ref<boolean>(
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', e => {
    systemDark.value = e.matches;
  });

  const isDark = computed(() => {
    const t = settings.value?.theme || 'system';
    return t === 'dark' || (t === 'system' && systemDark.value);
  });

  const isFloating = ref<boolean>(!!api.panelFloating?.());
  const panelSizeLabel = ref<string>(api.panelSizeName?.() || '中');

  function refreshState() {
    try {
      settings.value = api.getState();
      avatars.value = api.tavernAvatars?.() || { me: '', characters: {} };
      space.value = api.phoneSpace?.() || { key: '', name: '', members: [], on: false };
      drawQueueCount.value = (api.drawQueue?.() || []).length;
      api.chatUnread?.().then((n: number) => { unreadCount.value = n || 0; }).catch(() => {});
    } catch {
      // ignore
    }
  }

  function notify(text: string, kind: 'info' | 'success' | 'error' = 'info') {
    toast.value = { id: Date.now(), text, kind };
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.value = null;
    }, kind === 'error' ? 4500 : 2600);
  }

  function setWallpaper(id: WallpaperId) {
    wallpaper.value = id;
    try { localStorage.setItem('st_iphonie_lg_wallpaper', id); } catch {}
  }

  function setTheme(theme: 'system' | 'light' | 'dark') {
    const next = structuredClone(settings.value);
    next.theme = theme;
    settings.value = api.save(next);
  }

  function openApp(id: AppId) {
    controlCenterOpen.value = false;
    locked.value = false;
    activeApp.value = id;
  }

  function goHome() {
    controlCenterOpen.value = false;
    activeApp.value = null;
  }

  function toggleSize() {
    if (api.panelSize) {
      api.panelSize();
      panelSizeLabel.value = api.panelSizeName?.() || '中';
    }
  }

  function closePhone() {
    api.close?.();
  }

  function avatarFor(name: string): string {
    if (!name || name === 'me') return avatars.value.me || '';
    return avatars.value.characters?.[name] || '';
  }

  // Subscribe to backend events
  api.subscribe?.((e: any) => {
    if (e?.type === 'settings' || e?.type === 'partition' || e?.type === 'draw') {
      refreshState();
    }
    if (e?.type === 'chat') {
      api.chatUnread?.().then((n: number) => { unreadCount.value = n || 0; }).catch(() => {});
    }
  });

  // Expose host hooks expected by ST-iPhonie/index.js
  (window as any).stTtsPanelVisibility = (visible: boolean) => {
    if (visible) {
      refreshState();
      isFloating.value = !!api.panelFloating?.();
      panelSizeLabel.value = api.panelSizeName?.() || '中';
      const wantApp = api.takeApp?.();
      if (wantApp) {
        if (wantApp === 'chat:moments') openApp('moments');
        else if (['chat', 'moments', 'peek', 'draw', 'gallery', 'roles', 'engines', 'settings'].includes(wantApp)) {
          openApp(wantApp as AppId);
        }
      }
      const wantThread = api.takeThread?.();
      if (wantThread) {
        pendingThreadId.value = wantThread;
        openApp('chat');
      }
      const wantDraw = api.takeDraw?.();
      if (wantDraw) {
        pendingDrawPayload.value = wantDraw;
        openApp('draw');
      }
    }
  };
  (window as any).stTtsOpenApp = () => {
    const wantApp = api.takeApp?.();
    if (wantApp === 'chat:moments') openApp('moments');
    else if (wantApp && ['chat', 'moments', 'peek', 'draw', 'gallery', 'roles', 'engines', 'settings'].includes(wantApp)) {
      openApp(wantApp as AppId);
    }
  };
  (window as any).stTtsOpenThread = () => {
    const id = api.takeThread?.();
    if (id) { pendingThreadId.value = id; openApp('chat'); }
  };
  (window as any).stTtsOpenDraw = () => {
    const payload = api.takeDraw?.();
    if (payload) { pendingDrawPayload.value = payload; openApp('draw'); }
  };
  (window as any).stTtsOpenRole = () => {
    openApp('roles');
  };

  refreshState();

  return {
    api,
    isMock,
    settings,
    activeApp,
    locked,
    controlCenterOpen,
    wallpaper,
    unreadCount,
    drawQueueCount,
    pendingThreadId,
    pendingDrawPayload,
    avatars,
    space,
    toast,
    isDark,
    isFloating,
    panelSizeLabel,
    refreshState,
    notify,
    setWallpaper,
    setTheme,
    openApp,
    goHome,
    toggleSize,
    closePhone,
    avatarFor,
  };
});
