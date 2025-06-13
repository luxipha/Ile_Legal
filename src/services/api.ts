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
      budget: number;
      deadline: string;
      attachments?: FileList | File[];
      buyer_id: string | undefined;
    }) => {
      let attachmentUrls: string[] = [];
      
      // Upload files if they exist
      if (gigData.attachments && gigData.buyer_id) {
        // Convert FileList to array of Files
        const files = Array.from(gigData.attachments);
        console.log('files:', files);
        
        const uploadPromises = files.map(async (file) => {
          const filePath = `${gigData.buyer_id}/${file.name}`;
          console.log('filePath:', filePath);
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }
          
          return file.name;
        });
        
        attachmentUrls = await Promise.all(uploadPromises);
      }

      const { data, error } = await supabase
        .from('Gigs')
        .insert({
          title: gigData.title,
          description: gigData.description,
          categories: gigData.categories,
          budget: gigData.budget,
          deadline: gigData.deadline,
          attachments: attachmentUrls,
          buyer_id: gigData.buyer_id,
          status: 'active'
        });
      return { data, error };
    },

    getMyGigs: async (userId: string, filters?: {
      categories?: string[];
      budget?: { min: number; max: number };
      status?: string;
      deadline?: { start: number; end: number };
    }) => {
      let query = supabase
        .from("Gigs")
        .select("*")
        .eq('buyer_id', userId);

      // Apply category filter if provided
      if (filters?.categories && filters.categories.length > 0) {
        query = query.contains('categories', filters.categories);
      }

      // Apply budget filter if provided
      if (filters?.budget) {
        query = query
          .gte('budget', filters.budget.min)
          .lte('budget', filters.budget.max);
      }

      // Apply status filter if provided
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Apply deadline filter if provided
      if (filters?.deadline) {
        query = query
          .gte('deadline', new Date(filters.deadline.start).toISOString())
          .lte('deadline', new Date(filters.deadline.end).toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
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

};