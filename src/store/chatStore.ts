import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface ChatStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  isTyping: false,
  setIsTyping: (typing) => set({ isTyping: typing }),
  socket: null,
  setSocket: (socket) => set({ socket }),
}));