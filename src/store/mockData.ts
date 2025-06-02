import { create } from 'zustand';

export interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: 'active' | 'assigned' | 'completed' | 'cancelled';
  client: {
    id: string;
    name: string;
    email: string;
    rating: number;
    projectsPosted: number;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  bids: Bid[];
  deliverables?: {
    description: string;
    files: Array<{
      name: string;
      size: number;
      type: string;
    }>;
    submittedAt: string;
  };
}

export interface Bid {
  id: string;
  provider: {
    id: string;
    name: string;
    profession: string;
    rating: number;
    completedJobs: number;
  };
  amount: number;
  proposal: string;
  deliveryTime: string;
  submittedDate: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface MockDataStore {
  gigs: Gig[];
  getGigById: (id: string) => Gig | undefined;
  addGig: (gig: Omit<Gig, 'id' | 'createdAt' | 'bids' | 'status'>) => void;
  updateGig: (id: string, updates: Partial<Gig>) => void;
  addBid: (gigId: string, bid: Omit<Bid, 'id' | 'submittedDate' | 'status'>) => void;
  updateBid: (gigId: string, bidId: string, updates: Partial<Bid>) => void;
}

// Initial mock data
const INITIAL_GIGS: Gig[] = [
  {
    id: '1',
    title: 'Land Title Verification - Victoria Island Property',
    description: `We are seeking a qualified legal professional to conduct a comprehensive title verification for a property located in Victoria Island, Lagos. The verification should include:

1. Confirmation of ownership history
2. Verification of all relevant documentation
3. Checks for any encumbrances or liens
4. Validation with the local land registry
5. Preparation of a detailed report on findings

The property is a 1000sqm commercial plot with existing development. All necessary documents will be provided upon assignment.`,
    category: 'land-title',
    budget: 65000,
    deadline: '2025-05-15',
    status: 'active',
    client: {
      id: '101',
      name: 'Lagos Properties Ltd.',
      email: 'buyer@example.com',
      rating: 4.8,
      projectsPosted: 15
    },
    createdAt: '2025-04-20',
    bids: [
      {
        id: 'b1',
        provider: {
          id: '201',
          name: 'Chioma Okonkwo',
          profession: 'Property Lawyer',
          rating: 4.9,
          completedJobs: 24
        },
        amount: 60000,
        proposal: 'I have over 10 years of experience in title verification in Lagos State, particularly in Victoria Island. I have established connections with the land registry and can complete this task efficiently and accurately.',
        deliveryTime: '5 days',
        submittedDate: '2025-04-21',
        status: 'pending'
      }
    ]
  }
];

export const useMockDataStore = create<MockDataStore>((set, get) => ({
  gigs: INITIAL_GIGS,
  getGigById: (id) => get().gigs.find(gig => gig.id === id),
  addGig: (gig) => set((state) => ({
    gigs: [...state.gigs, {
      ...gig,
      id: `gig-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      bids: []
    }]
  })),
  updateGig: (id, updates) => set((state) => ({
    gigs: state.gigs.map(gig => 
      gig.id === id ? { ...gig, ...updates } : gig
    )
  })),
  addBid: (gigId, bid) => set((state) => ({
    gigs: state.gigs.map(gig => 
      gig.id === gigId ? {
        ...gig,
        bids: [...gig.bids, {
          ...bid,
          id: `bid-${Date.now()}`,
          submittedDate: new Date().toISOString(),
          status: 'pending'
        }]
      } : gig
    )
  })),
  updateBid: (gigId, bidId, updates) => set((state) => ({
    gigs: state.gigs.map(gig => 
      gig.id === gigId ? {
        ...gig,
        bids: gig.bids.map(bid =>
          bid.id === bidId ? { ...bid, ...updates } : bid
        )
      } : gig
    )
  }))
}));