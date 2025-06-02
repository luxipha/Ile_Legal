// Mock API service for frontend-only development
export const api = {
  payments: {
    createPaymentIntent: async (amount: number) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        clientSecret: `mock_client_secret_${Date.now()}`,
      };
    },

    processPayment: async (paymentIntentId: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
      };
    },
  },

  chat: {
    getMessages: async (conversationId: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return [];
    },

    sendMessage: async (conversationId: string, message: string, attachments?: File[]) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: `msg_${Date.now()}`,
        conversationId,
        content: message,
        attachments: attachments?.map(file => URL.createObjectURL(file)) || [],
        timestamp: new Date().toISOString(),
      };
    },
  },
};