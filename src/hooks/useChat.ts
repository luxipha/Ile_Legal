import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { socket } from '../lib/socket';
import { api } from '../services/api';

export const useChat = (conversationId: string) => {
  const { messages, addMessage, setMessages, isTyping, setIsTyping, setSocket } = useChatStore();

  useEffect(() => {
    // Connect to socket
    socket.connect();
    setSocket(socket);

    // Join conversation room
    socket.emit('join_conversation', conversationId);

    // Load existing messages
    const loadMessages = async () => {
      try {
        const messages = await api.chat.getMessages(conversationId);
        setMessages(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    loadMessages();

    // Socket event listeners
    socket.on('new_message', addMessage);
    socket.on('typing_status', ({ userId, status }) => setIsTyping(status));

    return () => {
      socket.off('new_message');
      socket.off('typing_status');
      socket.disconnect();
      setSocket(null);
    };
  }, [conversationId]);

  const sendMessage = async (content: string, attachments?: File[]) => {
    try {
      const message = await api.chat.sendMessage(conversationId, content, attachments);
      socket.emit('send_message', { conversationId, message });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const setTypingStatus = (status: boolean) => {
    socket.emit('typing', {
      conversationId,
      status,
    });
  };

  return {
    messages,
    isTyping,
    sendMessage,
    setTypingStatus,
  };
};