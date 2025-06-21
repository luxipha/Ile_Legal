import { supabaseLocal as supabase } from '../lib/supabaseLocal';
import { ipfsService, IPFSUploadResult } from './ipfsService';
import { reputationService } from './reputationService';


// Mock API service for frontend-only development
export const api = {
  

  

  payments: {
    createPaymentIntent: async (amount: number) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        clientSecret: `mock_client_secret_${Date.now()}_${amount}`,
      };
    },

    processPayment: async (paymentIntentId: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        paymentIntentId,
      };
    },
  },

  chat: {
    getMessages: async (conversationId: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock implementation - return empty array with conversationId reference
      console.log(`Fetching messages for conversation: ${conversationId}`);
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

    getActiveBids: async (userId?: string) => {
      // If userId is provided, use it; otherwise try to get from Supabase auth
      let sellerId = userId;
      
      if (!sellerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User must be logged in to view bids');
        }
        sellerId = user.id;
      }

      const { data, error } = await supabase
        .from('Bids')
        .select('*')
        .eq('seller_id', sellerId)
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
      status?: 'pending' | 'active' | 'rejected';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("user", user);
      
      if (!user) {
        throw new Error('User must be logged in to update a bid');
      }

      // First verify that the bid belongs to either the current user (as seller) or the buyer
      const { data: existingBid, error: fetchError } = await supabase
        .from('Bids')
        .select('seller_id, buyer_id, gig_id')
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
        
        // Check if the gig is suspended before allowing status updates
        if (updates.status && updates.status === 'active') {
          const { data: gig, error: gigError } = await supabase
            .from('Gigs')
            .select('status')
            .eq('id', existingBid.gig_id)
            .single();
            
          if (gigError) {
            throw gigError;
          }
          
          if (gig.status === 'suspended') {
            throw new Error('Cannot accept bids on suspended gigs');
          }
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
      if (error) {
        console.error('Error fetching gig:', error);
      }
      return data;
    },

    getAllGigs: async (filters?: {
      categories?: string[];
      budget?: { min: number; max: number };
      status?: string;
      deadline?: { start: number; end: number };
    }) => {
      console.log("filters:", filters);
      let query = supabase
        .from("Gigs")
        .select("*");
      // console.log("query", query);
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
      console.log("data:", data);
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
          status: 'pending',
          is_flagged: false // Ensure new gigs are not flagged
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

  // User Management APIs for Admin
  admin: {
    users: {
      // Get all users with filtering (pending, verified, rejected)
      getAllUsers: async (status?: 'pending' | 'verified' | 'rejected', page = 1, limit = 20) => {
        try {
          let query = supabase
            .from('Profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

          if (status) {
            query = query.eq('verification_status', status);
          }

          const { data, error, count } = await query;
          
          if (error) throw error;
          
          // Transform data to match UserWithAuth interface
          const usersWithAuth = (data || []).map(profile => ({
            ...profile,
            auth: {
              id: profile.id,
              email: profile.email || '',
              created_at: profile.created_at,
              email_confirmed_at: profile.created_at
            }
          }));
          
          return {
            users: usersWithAuth,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
          };
        } catch (error) {
          console.error('Error fetching users:', error);
          throw error;
        }
      },

      // Get specific user details with documents
      getUserById: async (userId: string) => {
        try {
          const { data: user, error: userError } = await supabase
            .from('Profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (userError) throw userError;

          // Get user documents
          const { data: documents, error: docsError } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (docsError) {
            console.warn('Error fetching documents:', docsError);
          }

          // Transform to match UserWithAuth interface
          const userWithAuth = {
            ...user,
            auth: {
              id: user.id,
              email: user.email || '',
              created_at: user.created_at,
              email_confirmed_at: user.created_at
            },
            documents: documents || []
          };

          return userWithAuth;
        } catch (error) {
          console.error('Error fetching user details:', error);
          throw error;
        }
      },

      // Verify a user
      verifyUser: async (userId: string, adminId: string, notes?: string) => {
        try {
          const { data, error } = await supabase
            .from('Profiles')
            .update({
              verification_status: 'verified',
              verified_at: new Date().toISOString(),
              verified_by: adminId,
              verification_notes: notes
            })
            .eq('id', userId)
            .select()
            .single();

          if (error) throw error;

          // Log the verification action
          await supabase
            .from('admin_actions')
            .insert({
              admin_id: adminId,
              action_type: 'user_verified',
              target_id: userId,
              details: { notes }
            });

          return data;
        } catch (error) {
          console.error('Error verifying user:', error);
          throw error;
        }
      },

      // Reject a user with reason
      rejectUser: async (userId: string, adminId: string, reason: string, notes?: string) => {
        try {
          const { data, error } = await supabase
            .from('Profiles')
            .update({
              verification_status: 'rejected',
              rejected_at: new Date().toISOString(),
              rejected_by: adminId,
              rejection_reason: reason,
              verification_notes: notes
            })
            .eq('id', userId)
            .select()
            .single();

          if (error) throw error;

          // Log the rejection action
          await supabase
            .from('admin_actions')
            .insert({
              admin_id: adminId,
              action_type: 'user_rejected',
              target_id: userId,
              details: { reason, notes }
            });

          return data;
        } catch (error) {
          console.error('Error rejecting user:', error);
          throw error;
        }
      },

      // Request additional information from user
      requestInfo: async (userId: string, adminId: string, requestedInfo: string, message: string) => {
        try {
          // Update user status to indicate info is requested
          const { error: updateError } = await supabase
            .from('Profiles')
            .update({
              verification_status: 'info_requested',
              info_requested_at: new Date().toISOString(),
              requested_info: requestedInfo
            })
            .eq('id', userId);

          if (updateError) throw updateError;

          // Create a notification/message for the user
          const { data, error } = await supabase
            .from('user_notifications')
            .insert({
              user_id: userId,
              type: 'info_request',
              title: 'Additional Information Required',
              message: message,
              requested_info: requestedInfo,
              created_by: adminId
            })
            .select()
            .single();

          if (error) throw error;

          // Log the action
          await supabase
            .from('admin_actions')
            .insert({
              admin_id: adminId,
              action_type: 'info_requested',
              target_id: userId,
              details: { requestedInfo, message }
            });

          return data;
        } catch (error) {
          console.error('Error requesting user info:', error);
          throw error;
        }
      },

      // Get user's verification documents
      getUserDocuments: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return data || [];
        } catch (error) {
          console.error('Error fetching user documents:', error);
          throw error;
        }
      },

      // Update document verification status
      updateDocumentStatus: async (
        userId: string,
        documentId: string,
        status: 'pending' | 'approved' | 'rejected',
        adminId: string,
        notes?: string
      ) => {
        try {
          const { data, error } = await supabase
            .from('user_documents')
            .update({
              verification_status: status,
              verified_at: status === 'approved' ? new Date().toISOString() : null,
              verified_by: status === 'approved' ? adminId : null,
              rejection_reason: status === 'rejected' ? notes : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) throw error;

          // Log the document verification action
          await supabase
            .from('admin_actions')
            .insert({
              admin_id: adminId,
              action_type: 'document_verified',
              target_id: documentId,
              details: { userId, status, notes }
            });

          return data;
        } catch (error) {
          console.error('Error updating document status:', error);
          throw error;
        }
      },

      // Get user statistics for admin dashboard
      getUserStats: async () => {
        try {
          const { data: totalUsers, error: totalError } = await supabase
            .from('Profiles')
            .select('id', { count: 'exact', head: true });

          const { data: pendingUsers, error: pendingError } = await supabase
            .from('Profiles')
            .select('id', { count: 'exact', head: true })
            .eq('verification_status', 'pending');

          const { data: verifiedUsers, error: verifiedError } = await supabase
            .from('Profiles')
            .select('id', { count: 'exact', head: true })
            .eq('verification_status', 'verified');

          const { data: rejectedUsers, error: rejectedError } = await supabase
            .from('Profiles')
            .select('id', { count: 'exact', head: true })
            .eq('verification_status', 'rejected');

          if (totalError || pendingError || verifiedError || rejectedError) {
            throw totalError || pendingError || verifiedError || rejectedError;
          }

          return {
            total: totalUsers?.length || 0,
            pending: pendingUsers?.length || 0,
            verified: verifiedUsers?.length || 0,
            rejected: rejectedUsers?.length || 0
          };
        } catch (error) {
          console.error('Error fetching user stats:', error);
          throw error;
        }
      }
    },
    /**
     * Admin-only: Set a gig's is_flagged field to true or false
     */
    setGigFlaggedStatus: async (gigId: string, isFlagged: boolean) => {
      // TODO: Enforce admin check in UI or via RLS
      const { error } = await supabase
        .from('Gigs')
        .update({ is_flagged: isFlagged })
        .eq('id', gigId);
      return error;
    },
    /**
     * Admin-only: Suspend a gig (set status to 'suspended')
     */
    suspendGig: async (gigId: string, reason?: string) => {
      // Check if user is admin using session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error('Authentication error');
      }
      if (!session?.user || session.user.user_metadata.role_title !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      // Fetch the gig to check its current status
      const { data: gig, error: fetchError } = await supabase
        .from('Gigs')
        .select('status')
        .eq('id', gigId)
        .single();
      if (fetchError) {
        throw fetchError;
      }
      if (!gig || gig.status !== 'pending') {
        throw new Error('Only gigs with status "pending" can be suspended');
      }
      // Update the gig status to 'suspended'
      const { error } = await supabase
        .from('Gigs')
        .update({ status: 'suspended' })
        .eq('id', gigId);
      if (error) {
        throw error;
      }
      // Optionally log the suspension action (currently commented out)
      // await supabase
      //   .from('admin_actions')
      //   .insert({
      //     admin_id: session.user.id,
      //     action_type: 'gig_suspended',
      //     target_id: gigId,
      //     details: { reason }
      //   });
      return { success: true };
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

      // Record reputation event for feedback received
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get the gig to find the seller
        const { data: gig } = await supabase
          .from('gigs')
          .select('user_id, seller_id, title')
          .eq('id', feedbackData.gig_id)
          .single();

        if (gig && user) {
          const sellerId = gig.seller_id || gig.user_id;
          if (sellerId) {
            await reputationService.recordReputationEvent(
              sellerId,
              'review_received',
              feedbackData.gig_id,
              user.id,
              feedbackData.rating,
              feedbackData.free_response
            );
            console.log(`✅ Reputation event recorded for seller ${sellerId}`);
          }
        }
      } catch (reputationError) {
        console.warn('Failed to record reputation event:', reputationError);
        // Don't fail the feedback creation if reputation recording fails
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
      blockchain_hashes?: Array<{
        fileName: string;
        hash: string;
        txId?: string;
      }>;
      use_ipfs?: boolean;
    }) => {
      let deliverableFilenames: string[] = [];
      let ipfsResults: IPFSUploadResult[] = [];
      
      // Upload files if they exist
      if (submissionData.deliverables) {
        // Convert FileList to array of Files
        const files = Array.from(submissionData.deliverables);
        
        if (submissionData.use_ipfs) {
          // Upload to IPFS
          console.log('Uploading files to IPFS...');
          try {
            const ipfsUploadPromises = files.map(async (file) => {
              // Generate hash if blockchain verification is enabled
              let fileHash: string | undefined;
              if (submissionData.blockchain_hashes?.some(bh => bh.fileName === file.name)) {
                const { HashUtils } = await import('../components/blockchain/shared/hashUtils');
                const fileResult = await HashUtils.hashFile(file);
                fileHash = HashUtils.createDocumentHash(fileResult).hash;
              }
              
              return await ipfsService.uploadFile(file, {
                hash: fileHash
              });
            });
            
            ipfsResults = await Promise.all(ipfsUploadPromises);
            deliverableFilenames = ipfsResults.map(result => result.cid);
            
            console.log('Files uploaded to IPFS:', ipfsResults);
          } catch (ipfsError) {
            console.error('IPFS upload failed, falling back to Supabase:', ipfsError);
            // Fallback to Supabase if IPFS fails
            submissionData.use_ipfs = false;
          }
        }
        
        if (!submissionData.use_ipfs) {
          // Upload to Supabase storage (fallback or default)
          console.log('Uploading files to Supabase storage...');
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
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be logged in to submit work');
      }

      const { data, error } = await supabase
        .from('Work Submissions')
        .insert({
          gig_id: submissionData.gig_id,
          seller_id: user.id,
          deliverables: deliverableFilenames,
          notes: submissionData.notes || '',
          blockchain_hashes: submissionData.blockchain_hashes || [],
          status: 'submitted',
          storage_type: submissionData.use_ipfs ? 'ipfs' : 'supabase',
          ipfs_data: submissionData.use_ipfs ? ipfsResults : null
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
        .eq('id', submissionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Record reputation event for approved work
      if (status === 'approved' && data) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && data.seller_id && data.gig_id) {
            await reputationService.recordReputationEvent(
              data.seller_id,
              'gig_completed',
              data.gig_id,
              user.id,
              5, // Max rating for approved work
              'Work submission approved by client'
            );
            console.log(`✅ Reputation event recorded for completed gig ${data.gig_id}`);
          }
        } catch (reputationError) {
          console.warn('Failed to record reputation event for gig completion:', reputationError);
          // Don't fail the status update if reputation recording fails
        }
      }

      return data;
    },
  },

};