import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://govkkihikacnnyqzhtxv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvdmtraWhpa2Fjbm55cXpodHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTgyMjQsImV4cCI6MjA2NDgzNDIyNH0.0WuGDlY-twGxtmHU5XzfMvDQse_G3CuFVxLyCgZlxIQ');

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

  gigs: {
    getGigById: async (gigId: string) => {
      const { data, error } = await supabase
        .from('Gigs')
        .select('*')
        .eq('id', gigId);
      return data;
    },

    createGig: async (gigData: {
      title: string;
      description: string;
      categories: string[];
      budget: string;
      deadline: string;
      attachments?: any;
      buyer_id: string | undefined;
    }) => {
      const { data, error } = await supabase
        .from('Gigs')
        .insert({
          title: gigData.title,
          description: gigData.description,
          categories: gigData.categories,
          budget: gigData.budget,
          deadline: gigData.deadline,
          attachments: gigData.attachments,
          buyer_id: gigData.buyer_id,
          status: 'active'
        });
      return { data, error };
    },

    getMyGigs: async (userId: string) => {
      const { data, error } = await supabase
        .from('Gigs')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },

    deleteGig: async (gigId: string) => {
      const { error } = await supabase
        .from('Gigs')
        .delete()
        .eq('id', gigId);
      return error;
    },

    updateGig: async (gigId: string, gigData: {
      title: string;
      description: string;
      categories: string[];
      budget: string;
      deadline: string;
      status: string;
      attachments?: any;
      buyer_id: string | undefined;
      client: JSON
    }) => {
      const { error } = await supabase
        .from('Gigs')
        .update(gigData)
        .eq('id', gigId);
      console.log(error);
      console.log(gigId);
      console.log(gigData);
      return error;
    },


  },

  users: {
    getUser: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }
      if (session) {
        return {
          id: session.user.id,
          name: session.user.user_metadata.name,
          email: session.user.email || '',
          role: session.user.user_metadata.role,
          isVerified: session.user.user_metadata.email_verified,
          user_metadata: session.user.user_metadata
        };
      }
      return null;
    }
  }

};