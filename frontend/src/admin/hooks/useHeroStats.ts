import { createResourceHooks } from './createResourceHooks';
import type { HeroStatRequest, HeroStatResponse } from '../api/types';

const heroStats = createResourceHooks<HeroStatResponse, HeroStatRequest>('hero-stats', 'heroStats');

export const useHeroStats = heroStats.useList;
export const useHeroStat = heroStats.useDetail;
export const useCreateHeroStat = heroStats.useCreate;
export const useUpdateHeroStat = heroStats.useUpdate;
export const useDeleteHeroStat = heroStats.useDelete;
export const heroStatQueryKeys = heroStats.keys;
