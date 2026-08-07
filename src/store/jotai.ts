import { getDefaultStore } from 'jotai';

// 全局唯一 Jotai store：main.tsx 的 <JotaiProvider> 与 api 层（apiClient）必须共用同一个 store，
// 否则非组件代码（如登录失效时清理 sessionAtom）写入的原子状态 UI 感知不到，
// 导致会话被清除后页面不会自动跳转登录页（jotai 的 storage 事件跨 store 同步在同标签页内不触发）。
export const jotaiStore = getDefaultStore();
