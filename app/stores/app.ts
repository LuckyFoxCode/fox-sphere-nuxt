import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  const ready = ref(false);
  return { ready };
});
