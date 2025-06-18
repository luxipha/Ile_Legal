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
    createBid: async (gigId: string, amount: number, description: string, buyer_id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to create a bid');
      }

      // Generate a random integer ID from 0 to 10000000
      const randomId = Math.floor(Math.random() * 10000001);

      const { data, error } = await supabase
        .from('Bids')
        .insert({
          id: randomId,
          gig_id: gigId,
          seller_id: user.id,
          buyer_id: buyer_id,
          amount,
          description,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Get current bids array from the gig
      const { data: gigData, error: gigFetchError } = await supabase
        .from('Gigs')
        .select('bids')
        .eq('id', gigId)
        .single();

      if (gigFetchError) {
        console.error('Error fetching gig bids:', gigFetchError);
        return data;
      }

      // Append the new bid ID to the bids array
      const currentBids = gigData.bids || [];
      const updatedBids = [...currentBids, randomId];

      // Update the gig with the new bids array
      const { error: gigUpdateError } = await supabase
        .from('Gigs')
        .update({ bids: updatedBids })
        .eq('id', gigId);

      if (gigUpdateError) {
        console.error('Error updating gig bids array:', gigUpdateError);
        // Don't throw error here as the bid was created successfully
        // The gig update failure shouldn't prevent the bid creation
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
        .in('status', ['pending', 'accepted'])
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
      console.log("user", user);
      
      if (!user) {
        throw new Error('User must be logged in to update a bid');
      }

      // First verify that the bid belongs to either the current user (as seller) or the buyer
      const { data: existingBid, error: fetchError } = await supabase
        .from('Bids')
        .select('seller_id, buyer_id')
        .eq('id', bidId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (existingBid.seller_id !== user.id && existingBid.buyer_id !== user.id) {
        throw new Error('You can only update bids that you are involved in');
      }

      // If the user is the seller, they can only update amount and description
      if (existingBid.seller_id === user.id) {
        if (updates.status) {
          throw new Error('Sellers can only update the amount and description of their bids');
        }
      }

      // If the user is the buyer, they can only update the status
      if (existingBid.buyer_id === user.id) {
        if (updates.amount || updates.description) {
          throw new Error('Buyers can only update the status of bids');
        }
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

    getAllGigs: async (filters?: {
      categories?: string[];
      budget?: { min: number; max: number };
      status?: string;
      deadline?: { start: number; end: number };
    }) => {
      let query = supabase
        .from("Gigs")
        .select("*");

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
            .upload(filePath, file, { contentType: file.type });
            
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
      // client: JSON;
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
      resolution_decision?: string;
      outcome?: string;
      refund_amount?: string;
    }) => {
      const insertData = {
        ...disputeData,
        status: 'pending',
      };
      if (disputeData.resolution_decision !== undefined) {
        insertData.resolution_decision = disputeData.resolution_decision;
      }
      if (disputeData.outcome !== undefined) {
        insertData.outcome = disputeData.outcome;
      }
      if (disputeData.refund_amount !== undefined) {
        insertData.refund_amount = disputeData.refund_amount;
      }
      const { data, error } = await supabase
        .from('Disputes')
        .insert(insertData);

      if (error) {
        throw error;
      }

      return data;
    },

    getAllDisputes: async () => {
      // Check if user is admin using session
      console.log("getAllDisputes");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("session", session);
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
      console.log("disputes", disputes);
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

    updateDisputeStatus: async (id: number, status: 'approved' | 'denied' | 'resolved') => {
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

    updateDisputeOutcome: async (id: number, outcome: string, refund_amount?: string) => {
      const updateObj: any = { outcome };
      if (refund_amount !== undefined) {
        updateObj.refund_amount = refund_amount;
      }
      const { data: dispute, error } = await supabase
        .from('Disputes')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return dispute;
    },

    updateDisputeResolutionComment: async (id: number, resolution_comment: string) => {
      const { data: dispute, error } = await supabase
        .from('Disputes')
        .update({ resolution_comment })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return dispute;
    },
  },


  feedback: {
    createFeedback: async (feedbackData: {
      free_response: string;
      rating: number;
      gig_id: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to create feedback');
      }

      // Get the gig to determine buyer_id and seller_id
      const { data: gigData, error: gigError } = await supabase
        .from('Gigs')
        .select('buyer_id, seller_id')
        .eq('id', feedbackData.gig_id)
        .single();

      if (gigError) {
        throw new Error('Gig not found');
      }

      // Determine recipient: whichever is not equal to current user
      let recipient;
      if (gigData.buyer_id === user.id) {
        recipient = gigData.seller_id;
      } else if (gigData.seller_id === user.id) {
        recipient = gigData.buyer_id;
      } else {
        throw new Error('User is not associated with this gig');
      }

      const { data, error } = await supabase
        .from('Feedback')
        .insert({
          free_response: feedbackData.free_response,
          rating: feedbackData.rating,
          gig_id: feedbackData.gig_id,
          creator: user.id,
          recipient: recipient
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

    getFeedbackForUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to view feedback');
      }

      const { data, error } = await supabase
        .from('Feedback')
        .select('*')
        .eq('recipient', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
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
            .upload(filePath, file, { contentType: file.type });
            
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