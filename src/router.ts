import { routeTree } from './routeTree.gen.ts';
import { createRouter } from '@tanstack/react-router';

export const router = createRouter({ routeTree });
