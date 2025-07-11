import { supabase } from '../lib/supabase';
import { ipfsService, IPFSUploadResult } from './ipfsService';
import { reputationService } from './reputationService';
import { generateRandom12DigitId } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';


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

      // Check if seller already has a pending or accepted bid for this gig
      const { data: existingBid, error: checkError } = await supabase
        .from('Bids')
        .select('id, status')
        .eq('gig_id', gigId)
        .eq('seller_id', user.id)
        .in('status', ['pending', 'accepted'])
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw checkError;
      }

      if (existingBid) {
        throw new Error(`You already have a ${existingBid.status} bid for this gig. You cannot place another bid.`);
      }

      // Use random 12-digit ID for bid ID to prevent collisions
      const randomId = generateRandom12DigitId();

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
        .select(`
          *,
          seller:Profiles!seller_id(*)
        `)
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },

    getBidsByStatus: async (userId?: string, statuses: string[] = ['pending', 'accepted']) => {
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
        .select(`
          *,
          gig:Gigs!gig_id(
            *,
            buyer:Profiles!buyer_id(*)
          )
        `)
        .eq('seller_id', sellerId)
        .in('status', statuses)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },

    getAllBids: async (userId: string) => {
      const { data, error } = await supabase
        .from('Bids')
        .select(`
          *,
          buyer:Profiles!buyer_id(*),
          gig:Gigs!gig_id(*)
        `)
        .eq('seller_id', userId)
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
      previous_amount?: number;
      delivery_time?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("user", user);
      
      if (!user) {
        throw new Error('User must be logged in to update a bid');
      }

      // First verify that the bid belongs to either the current user (as seller) or the buyer
      const { data: existingBid, error: fetchError } = await supabase
        .from('Bids')
        .select('seller_id, buyer_id, gig_id, amount')
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
        if (updates.status && updates.status === 'accepted') {
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

      // Prepare the update object
      const updateData = { ...updates };

      // If amount is being updated and it's different from current amount, store previous amount
      if (updates.amount !== undefined && updates.amount !== existingBid.amount) {
        updateData.previous_amount = existingBid.amount;
      }

      const { data, error } = await supabase
        .from('Bids')
        .update(updateData)
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
        .select(`
          *,
          buyer:Profiles!buyer_id(*)
        `)
        .eq('id', gigId)
        .single();
      if (error) {
        console.error('Error fetching gig:', error);
        return null;
      }
      // If there are attachments, fetch signed URLs
      if (data && data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0 && data.buyer_id) {
        const attachmentUrls = await Promise.all(
          data.attachments.map(async (filename: string) => {
            const filePath = `${data.id}/${data.buyer_id}/${filename}`;
            const { data: urlData } = await supabase.storage
              .from('documents')
              .createSignedUrl(filePath, 86400);
            return urlData?.signedUrl || '';
          })
        );
        return { ...data, attachments: attachmentUrls };
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
        .select(`
          *,
          buyer:Profiles!buyer_id(*)
        `);

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
      // For each gig, if it has attachments and buyer_id, fetch signed URLs
      const gigsWithUrls = await Promise.all((data || []).map(async (gig) => {
        if (gig.attachments && Array.isArray(gig.attachments) && gig.attachments.length > 0 && gig.buyer_id) {
          const attachmentUrls = await Promise.all(
            gig.attachments.map(async (filename: string) => {
              const filePath = `${gig.id}/${gig.buyer_id}/${filename}`;
              const { data: urlData } = await supabase.storage
                .from('documents')
                .createSignedUrl(filePath, 86400);
              return urlData?.signedUrl || '';
            })
          );
          return {
            ...gig,
            attachments: attachmentUrls
          };
        }
        return gig;
      }));
      return gigsWithUrls;
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
      // Use uuid for gig ID to prevent collisions
      const gigId = uuidv4();
      
      let attachmentUrls: string[] = [];
      
      // Upload files if they exist
      if (gigData.attachments && gigData.buyer_id) {
        // Convert FileList to array of Files
        const files = Array.from(gigData.attachments);
        console.log('files:', files);
        
        const uploadPromises = files.map(async (file) => {
          const filePath = `${gigId}/${gigData.buyer_id}/${file.name}`;
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
          id: gigId,
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
      // Validate userId to prevent undefined queries
      if (!userId || userId === 'undefined') {
        console.error('getMyGigs called with invalid userId:', userId);
        return [];
      }

      let query = supabase
        .from("Gigs")
        .select(`
          *,
          bids_data:Bids(
            id,
            seller_id,
            amount,
            description,
            status,
            created_at,
            seller:Profiles!seller_id(
              id,
              first_name,
              last_name,
              avatar_url,
              bio
            )
          )
        `)
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

      // Transform the data to include public URLs for attachments
      const gigsWithUrls = await Promise.all((data || []).map(async (gig) => {
        if (gig.attachments && Array.isArray(gig.attachments) && gig.attachments.length > 0) {
          // Get public URLs for each attachment
          const attachmentUrls = await Promise.all(
            gig.attachments.map(async (filename: string) => {
              const filePath = `${gig.id}/${userId}/${filename}`;
              const { data: urlData } = await supabase.storage
                .from('documents')
                .createSignedUrl(filePath, 86400);
              // console.log("urlData:", urlData);
              return urlData?.signedUrl || '';
            })
          );
          
          return {
            ...gig,
            attachments: attachmentUrls
          };
        }
        
        return gig;
      }));
      
      return gigsWithUrls;
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
      attachments?: FileList | File[];
      buyer_id: string | undefined;
      // client: JSON;
    }) => {
      
      let attachmentUrls: string[] = [];
      
      // Upload files if they exist
      if (gigData.attachments && gigData.buyer_id) {
        // Convert FileList to array of Files
        const files = Array.from(gigData.attachments);
        console.log('files:', files);
        
        const uploadPromises = files.map(async (file) => {
          const filePath = `${gigId}/${gigData.buyer_id}/${file.name}`;
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

      // Fetch current attachments from DB
      let currentAttachments: string[] = [];
      const { data: gig, error: fetchError } = await supabase
        .from('Gigs')
        .select('attachments')
        .eq('id', gigId)
        .single();
      if (!fetchError && gig && Array.isArray(gig.attachments)) {
        currentAttachments = gig.attachments;
      }

      // Prepare the data to update, appending new filenames
      const updateData = {
        ...gigData,
        attachments: attachmentUrls.length > 0 ? [...currentAttachments, ...attachmentUrls] : currentAttachments
      };

      const { error } = await supabase
        .from('Gigs')
        .update(updateData)
        .eq('id', gigId);
      console.log(error);
      // console.log(gigId);
      // console.log(gigData);
      return error;
    },

    /**
     * Delete an attachment from the 'documents' bucket and remove it from the gig's attachments column
     * @param gigId The gig's ID
     * @param buyerId The buyer's ID
     * @param filename The filename to remove
     */
    deleteAttachment: async (gigId: string | number, buyerId: string, filename: string) => {
      // Remove from storage
      const filePath = `${gigId}/${buyerId}/${filename}`;
      const { error: storageError } = await supabase.storage.from('documents').remove([filePath]);
      if (storageError) throw storageError;
      // Remove from attachments array in Gigs table
      // Fetch current attachments
      const { data: gig, error: fetchError } = await supabase
        .from('Gigs')
        .select('attachments')
        .eq('id', gigId)
        .single();
      if (fetchError) throw fetchError;
      const updatedAttachments = (gig.attachments || []).filter((a: string) => a !== filename);
      const { error: updateError } = await supabase
        .from('Gigs')
        .update({ attachments: updatedAttachments })
        .eq('id', gigId);
      if (updateError) throw updateError;
      return true;
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
          // List all files in the user's profile_documents folder
          const { data: files, error } = await supabase.storage
            .from('documents')
            .list(`${userId}/profile_documents/`);
            
          if (error) {
            console.error('Error listing user documents:', error);
            throw error;
          }
          
          const documents: Array<{
            id: string;
            name: string;
            url: string;
            type: string;
            created_at: string;
          }> = [];
          
          if (files && files.length > 0) {
            for (const file of files) {
              const filepath = `${userId}/profile_documents/${file.name}`;
              
              // Get signed URL for each file (more secure than public URL)
              const { data: signedUrl, error: urlError } = await supabase.storage
                .from('documents')
                .createSignedUrl(filepath, 3600); // 1 hour expiry
              
              if (urlError) {
                console.error('Error creating signed URL for', filepath, urlError);
                continue; // Skip this file if we can't get a URL
              }
              
              // Determine document type based on filename
              let documentType = 'other';
              if (file.name.startsWith('government_id.')) {
                documentType = 'government_id';
              } else if (file.name.startsWith('selfie_with_id.')) {
                documentType = 'selfie_with_id';
              } else if (file.name.endsWith('.pdf')) {
                documentType = 'pdf';
              } else if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
                documentType = 'image';
              }
              
              documents.push({
                id: file.id || file.name,
                name: file.name,
                url: signedUrl.signedUrl,
                type: documentType,
                created_at: file.created_at || new Date().toISOString()
              });
            }
          }
          
          // Sort by creation date (newest first)
          documents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          console.log('User documents retrieved successfully:', documents);
          return documents;
        } catch (error) {
          console.error('Error in getUserDocuments:', error);
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
    suspendGig: async (gigId: string, _reason?: string) => {
      // Check if user is admin using session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Authentication error');
      }
      // Check admin status from Profiles table (secure)
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile?.user_type !== 'admin') {
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

    /**
     * Admin-only: Unsuspend a gig (set status from 'suspended' back to 'pending')
     */
    unsuspendGig: async (gigId: string, _adminNotes?: string) => {
      // Check if user is admin using session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Authentication error');
      }
      // Check admin status from Profiles table (secure)
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile?.user_type !== 'admin') {
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
      if (!gig || gig.status !== 'suspended') {
        throw new Error('Only gigs with status "suspended" can be unsuspended');
      }
      // Update the gig status back to 'pending'
      const { error } = await supabase
        .from('Gigs')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId);
      if (error) {
        throw error;
      }
      // Optionally log the unsuspension action
      // await supabase
      //   .from('admin_actions')
      //   .insert({
      //     admin_id: session.user.id,
      //     action_type: 'gig_unsuspended',
      //     target_id: gigId,
      //     details: { adminNotes }
      //   });
      console.log(`✅ Gig ${gigId} unsuspended by admin`);
      return { success: true };
    },

    // Approve pending gig (missing function!)
    approveGig: async (gigId: string, adminNotes?: string) => {
      console.log('Admin notes:', adminNotes); // Use the parameter to avoid warning
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Authentication error');
      }
      // Check admin status from Profiles table (secure)
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile?.user_type !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const { error } = await supabase
        .from('Gigs')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      console.log(`✅ Gig ${gigId} approved by admin`);
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication error');
      }

      // Check admin status from Profiles table (secure)
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile?.user_type !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // If user is admin, fetch all disputes with buyer and seller information
      const { data: disputes, error: disputesError } = await supabase
        .from('Disputes')
        .select(`
          *,
          buyer:Profiles!buyer_id(*),
          seller:Profiles!seller_id(*)
        `)
        .order('created_at', { ascending: false });
      console.log("disputes", disputes);
      if (disputes && disputes.length > 0) {
        console.log(disputes[0]);
      }
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
      
      if (sessionError || !session) {
        throw new Error('Authentication error');
      }

      // Check admin status from Profiles table (secure)
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile?.user_type !== 'admin') {
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
          .from('Gigs')
          .select('user_id, seller_id, title')
          .eq('id', feedbackData.gig_id)
          .single();

        if (gig && user) {
          const sellerId = gig.seller_id || gig.user_id;
          if (sellerId) {
            await reputationService.recordReputationEvent(
              sellerId,
              'review_received',
              feedbackData.gig_id.toString(),
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

    getAverageRating: async (id: string) => {
      const { data, error } = await supabase
        .from('Feedback')
        .select('rating')
        .eq('recipient', id);

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
        .select(`
          *,
          creator_profile:Profiles!creator(*)
        `)
        .eq('recipient', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },

    getFeedbackByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('Feedback')
        .select(`
          *,
          creator_profile:Profiles!creator(*)
        `)
        .eq('recipient', userId)
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

      // Update the gig status to 'pending_payment'
      const { error: gigUpdateError } = await supabase
        .from('Gigs')
        .update({ status: 'pending_payment' })
        .eq('id', submissionData.gig_id);
      if (gigUpdateError) {
        console.error('Error updating gig status to pending_payment:', gigUpdateError);
        // Don't throw error here as the submission was created successfully
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

  // User Metrics APIs
  metrics: {
    getAverageCompletionTime: async (userId: string) => {
      const { data: completedGigs, error } = await supabase
        .from('Gigs')
        .select('created_at, updated_at')
        .eq('seller_id', userId)
        .eq('status', 'completed');

      if (error) {
        throw error;
      }

      if (!completedGigs || completedGigs.length === 0) {
        return 0;
      }

      const totalTime = completedGigs.reduce((sum, gig) => {
        const startTime = new Date(gig.created_at).getTime();
        const endTime = new Date(gig.updated_at).getTime();
        return sum + (endTime - startTime);
      }, 0);

      // Return average time in days
      const averageMs = totalTime / completedGigs.length;
      return Math.round(averageMs / (1000 * 60 * 60 * 24));
    },

    getMemberSince: async (userId: string) => {
      const { data: profile, error } = await supabase
        .from('Profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, return current year as fallback
        if (error.code === 'PGRST116') {
          return new Date().getFullYear();
        }
        throw error;
      }

      return profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear();
    },

    getVerificationAccuracy: async (userId: string) => {
      const { data: verifications, error } = await supabase
        .from('user_verifications')
        .select('status')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      if (!verifications || verifications.length === 0) {
        return 0;
      }

      const approvedCount = verifications.filter(v => v.status === 'approved').length;
      return Math.round((approvedCount / verifications.length) * 100);
    },

    getCompletionRate: async (userId: string) => {
      const { data: allTasks, error: allError } = await supabase
        .from('Gigs')
        .select('status')
        .eq('seller_id', userId)
        .in('status', ['completed', 'in progress', 'accepted']);

      if (allError) {
        throw allError;
      }

      if (!allTasks || allTasks.length === 0) {
        return 0;
      }

      const completedCount = allTasks.filter(task => task.status === 'completed').length;
      return Math.round((completedCount / allTasks.length) * 100);
    },

    getAverageResponseTime: async (userId: string) => {
      // Get conversations where the user is involved
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('created_at, updated_at')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .limit(10);

      console.log('conversations', conversations);

      if (error) {
        throw error;
      }

      if (!conversations || conversations.length === 0) {
        return "N/A";
      }

      // Calculate average response time based on conversation duration
      const responseTimes = conversations.map(conversation => {
        const startTime = new Date(conversation.created_at).getTime();
        console.log('startTime', startTime);
        const endTime = new Date(conversation.updated_at).getTime();
        console.log('endTime', endTime);
        const durationMs = endTime - startTime;
        console.log('durationMs', durationMs);
        // Convert to hours
        const durationHours = durationMs / (1000 * 60 * 60);
        return durationHours;
      });

      // Calculate average
      const averageHours = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

      // Format the response time
      if (averageHours < 1) {
        const minutes = Math.round(averageHours * 60);
        return `${minutes} minutes`;
      } else if (averageHours < 24) {
        const hours = Math.round(averageHours);
        return `${hours} hours`;
      } else {
        const days = Math.round(averageHours / 24);
        return `${days} days`;
      }
    },

    getActiveClientStatus: async (userId: string) => {
      // Check if user has any active gigs or recent activity
      const { data: activeGigs, error } = await supabase
        .from('Gigs')
        .select('id')
        .eq('buyer_id', userId)
        .in('status', ['active', 'in progress'])
        .limit(1);

      if (error) {
        throw error;
      }

      return activeGigs && activeGigs.length > 0;
    },

    getLifetimeValue: async (userId: string) => {
      // Calculate total value of all gigs posted by the user
      const { data: userGigs, error } = await supabase
        .from('Gigs')
        .select('budget')
        .eq('buyer_id', userId);

      if (error) {
        throw error;
      }

      if (!userGigs || userGigs.length === 0) {
        return 0;
      }

      const totalValue = userGigs.reduce((sum, gig) => {
        return sum + (gig.budget || 0);
      }, 0);

      return totalValue;
    },

    getUserStats: async (userId: string) => {
      try {
        const [
          averageCompletionTime,
          memberSince,
          verificationAccuracy,
          completionRate,
          averageResponseTime,
          isActiveClient,
          lifetimeValue
        ] = await Promise.all([
          api.metrics.getAverageCompletionTime(userId),
          api.metrics.getMemberSince(userId),
          api.metrics.getVerificationAccuracy(userId),
          api.metrics.getCompletionRate(userId),
          api.metrics.getAverageResponseTime(userId),
          api.metrics.getActiveClientStatus(userId),
          api.metrics.getLifetimeValue(userId)
        ]);

        return {
          averageCompletionTime: `${averageCompletionTime} days`,
          memberSince: memberSince.toString(),
          verificationAccuracy: `${verificationAccuracy}%`,
          completionRate: `${completionRate}%`,
          averageResponseTime,
          activeClientStatus: isActiveClient ? "Active Client" : "Inactive",
          lifetimeValue: lifetimeValue > 0 ? `₦${lifetimeValue.toLocaleString()}` : "₦0"
        };
      } catch (error) {
        console.error('Error fetching user stats:', error);
        return {
          averageCompletionTime: "N/A",
          memberSince: new Date().getFullYear().toString(),
          verificationAccuracy: "N/A",
          completionRate: "N/A",
          averageResponseTime: "N/A",
          activeClientStatus: "Unknown",
          lifetimeValue: "₦0"
        };
      }
    },

    getUserProfile: async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('Profiles')
          .select('id, created_at, updated_at, first_name, last_name, avatar_url, email, user_type, bio, location, website, phone, verification_status, jobs_completed, specializations, linkedin, education, professional_title, industry, areas_of_interest')
          .eq('id', userId)
          .single();

        if (error) {
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    }
  },

  notifications: {
    getUserNotifications: async (userId?: string) => {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Supabase auth error:', authError);
          throw new Error(`Authentication error: ${authError.message}`);
        }
        if (!user) {
          throw new Error('User must be logged in to view notifications');
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return data || [];
    },

    markAsRead: async (notificationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to mark notifications as read');
      }

      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return true;
    },

    getUnreadCount: async () => {
      // Check if there's a valid session first with retry
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          console.log('No active session found in getUnreadCount');
          return 0;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Supabase auth error in getUnreadCount:', authError);
        return 0;
      }
      
      if (!user) {
        console.log('No authenticated user found in getUnreadCount');
        return 0;
      }

      const { data, error } = await supabase
        .from('user_notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }
  }
};