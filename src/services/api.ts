
import { supabase } from '../lib/supabase';


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


  bids: {
    createBid: async (gigId: string, amount: number, description: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to create a bid');
      }

      const { data, error } = await supabase
        .from('Bids')
        .insert({
          gig_id: gigId,
          seller_id: user.id,
          amount,
          description,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    getBidsByGigId: async (gigId: string) => {
      const { data, error } = await supabase
        .from('Bids')
        .select('*')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },

    getActiveBids: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to view bids');
      }

      const { data, error } = await supabase
        .from('Bids')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },

    updateBid: async (bidId: string, updates: {
      amount?: number;
      description?: string;
      status?: 'pending' | 'accepted' | 'rejected';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to update a bid');
      }

      // First verify that the bid belongs to the current user
      const { data: existingBid, error: fetchError } = await supabase
        .from('Bids')
        .select('seller_id')
        .eq('id', bidId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (existingBid.seller_id !== user.id) {
        throw new Error('You can only update your own bids');
      }

      const { data, error } = await supabase
        .from('Bids')
        .update(updates)
        .eq('id', bidId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    deleteBid: async (bidId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to delete a bid');
      }

      // First verify that the bid belongs to the current user
      const { data: existingBid, error: fetchError } = await supabase
        .from('Bids')
        .select('seller_id, status')
        .eq('id', bidId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (existingBid.seller_id !== user.id) {
        throw new Error('You can only delete your own bids');
      }

      // Only allow deletion of pending bids
      if (existingBid.status !== 'pending') {
        throw new Error('You can only delete pending bids');
      }

      const { error } = await supabase
        .from('Bids')
        .delete()
        .eq('id', bidId);

      if (error) {
        throw error;
      }

      return true;
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


  feedback: {
    createFeedback: async (feedbackData: {
      free_response: string;
      rating: number;
      gig_id: string;
    }) => {
      const { data, error } = await supabase
        .from('Feedback')
        .insert({
          free_response: feedbackData.free_response,
          rating: feedbackData.rating,
          gig_id: feedbackData.gig_id
        });

      if (error) {
        throw error;
      }

      return data;
    },

    getFeedbackByGigId: async (gigId: string) => {
      const { data, error } = await supabase
        .from('Feedback')
        .select('*')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },

    getAverageRating: async (gigId: string) => {
      const { data, error } = await supabase
        .from('Feedback')
        .select('rating')
        .eq('gig_id', gigId);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      return sum / data.length;
    },
  },

  submissions: {
    createSubmission: async (submissionData: {
      gig_id: string;
      deliverables?: FileList | File[];
      notes?: string;
    }) => {
      let deliverableFilenames: string[] = [];
      
      // Upload files if they exist
      if (submissionData.deliverables) {
        // Convert FileList to array of Files
        const files = Array.from(submissionData.deliverables);
        
        const uploadPromises = files.map(async (file) => {
          const filePath = `${submissionData.gig_id}/${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('deliverables')
            .upload(filePath, file);
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }
          
          return file.name;
        });
        
        deliverableFilenames = await Promise.all(uploadPromises);
      }

      const { data, error } = await supabase
        .from('Work Submissions')
        .insert({
          gig_id: submissionData.gig_id,
          deliverables: deliverableFilenames,
          notes: submissionData.notes || '',
          status: 'submitted'
        });

      if (error) {
        throw error;
      }

      return data;
    },

    getSubmissionsByGig: async (gigId: string) => {
      const { data, error } = await supabase
        .from('Work Submissions')
        .select('*')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },

    updateSubmissionStatus: async (submissionId: string, status: 'approved' | 'revision requested') => {
      const { data, error } = await supabase
        .from('Work Submissions')
        .update({ status })
        .eq('id', submissionId);

      if (error) {
        throw error;
      }

      return data;
    },
  },

};