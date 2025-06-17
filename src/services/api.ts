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

  disputes: {
    createDispute: async (disputeData: {
      gig_id: string;
      buyer_id: string;
      seller_id: string;
      details: string;
      comments?: string;
    }) => {
      const { data, error } = await supabase
        .from('Disputes')
        .insert({
          ...disputeData,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      return data;
    },

    getAllDisputes: async () => {
      // Check if user is admin using session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Authentication error');
      }

      if (!session?.user || session.user.user_metadata.role_title !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // If user is admin, fetch all disputes
      const { data: disputes, error: disputesError } = await supabase
        .from('Disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (disputesError) {
        throw disputesError;
      }

      return disputes;
    },

    getDisputeById: async (id: number) => {
      const { data: dispute, error } = await supabase
        .from('Disputes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return dispute;
    },

    updateDisputeStatus: async (id: number, status: 'approved' | 'denied') => {
      // Check if user is admin using session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Authentication error');
      }

      if (!session?.user || session.user.user_metadata.role_title !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // If user is admin, update the dispute status
      const { data: dispute, error } = await supabase
        .from('Disputes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return dispute;
    },

    updateDisputeComment: async (id: number, comment: string) => {
      const { data: dispute, error } = await supabase
        .from('Disputes')
        .update({ comments: comment })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return dispute;
    },
  },

};