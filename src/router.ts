import { routeTree } from './routeTree.gen.ts';
import { createHashHistory, createRouter } from '@tanstack/react-router';

const useHashHistory = import.meta.env.VITE_ROUTER_MODE === 'hash';

export const router = createRouter({
  routeTree,
  ...(useHashHistory ? { history: createHashHistory() } : {}),
});
