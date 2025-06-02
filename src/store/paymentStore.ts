import { create } from 'zustand';

interface PaymentStore {
  clientSecret: string | null;
  setClientSecret: (secret: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  clientSecret: null,
  setClientSecret: (secret) => set({ clientSecret: secret }),
  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  error: null,
  setError: (error) => set({ error: error }),
}));