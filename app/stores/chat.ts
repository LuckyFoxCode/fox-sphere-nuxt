import { defineStore } from 'pinia';
import type { ChatMessagePayload } from '#shared/events';

// Как в старом fox-sphere (useTwitchSocket): на экране не больше 5 сообщений, каждое живёт 18 с
export const CHAT_MAX_MESSAGES = 5;
export const CHAT_MESSAGE_TTL_MS = 18_000;

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessagePayload[]>([]);

  const removeMessage = (id: string) => {
    const index = messages.value.findIndex((message) => message.id === id);
    if (index !== -1) messages.value.splice(index, 1);
  };

  const onMessage = (payload: ChatMessagePayload) => {
    // Одинаковый id дал бы два элемента с одним :key в списке
    if (messages.value.some((message) => message.id === payload.id)) return;

    messages.value.push(payload);
    if (messages.value.length > CHAT_MAX_MESSAGES) messages.value.shift();
    setTimeout(() => removeMessage(payload.id), CHAT_MESSAGE_TTL_MS);
  };

  return { messages, onMessage };
});
