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
  completedDate?: string;
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
  feedback?: {
    rating: number;
    comment: string;
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
  },
  {
    id: '2',
    title: 'Contract Review for Software Development Agreement',
    description: `Need a legal professional to review a software development agreement between our company and a third-party vendor. The contract is approximately 25 pages and covers standard development terms, IP rights, payment schedules, and deliverables.`,
    category: 'contract-review',
    budget: 45000,
    deadline: '2025-05-01',
    status: 'completed',
    completedDate: '2025-04-28',
    client: {
      id: '102',
      name: 'TechNova Solutions',
      email: 'tech@example.com',
      rating: 4.7,
      projectsPosted: 8
    },
    assignedTo: {
      id: '202',
      name: 'Adebayo Johnson',
      email: 'adebayo@example.com'
    },
    createdAt: '2025-04-10',
    bids: [
      {
        id: 'b2',
        provider: {
          id: '202',
          name: 'Adebayo Johnson',
          profession: 'Corporate Lawyer',
          rating: 4.8,
          completedJobs: 32
        },
        amount: 42000,
        proposal: 'I specialize in technology contracts and have reviewed over 100 similar agreements. I can provide detailed feedback with suggested amendments within 3 days.',
        deliveryTime: '3 days',
        submittedDate: '2025-04-11',
        status: 'accepted'
      }
    ],
    deliverables: {
      description: 'I have completed a thorough review of the software development agreement. Please find attached my detailed analysis with suggested amendments to protect your interests, particularly regarding IP rights and payment milestones.',
      files: [
        {
          name: 'contract-review-analysis.pdf',
          size: 2500000,
          type: 'application/pdf'
        },
        {
          name: 'suggested-amendments.docx',
          size: 1200000,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      ],
      submittedAt: '2025-04-27'
    }
  },
  {
    id: '3',
    title: 'Property Lease Agreement Drafting',
    description: `We need a comprehensive commercial property lease agreement drafted for a retail space in Lekki Phase 1. The lease will be for an initial period of 5 years with renewal options.`,
    category: 'document-drafting',
    budget: 75000,
    deadline: '2025-04-25',
    status: 'completed',
    completedDate: '2025-04-22',
    client: {
      id: '103',
      name: 'Retail Spaces Nigeria',
      email: 'retail@example.com',
      rating: 4.9,
      projectsPosted: 12
    },
    assignedTo: {
      id: '203',
      name: 'Folake Adeyemi',
      email: 'folake@example.com'
    },
    createdAt: '2025-04-05',
    bids: [
      {
        id: 'b3',
        provider: {
          id: '203',
          name: 'Folake Adeyemi',
          profession: 'Real Estate Attorney',
          rating: 5.0,
          completedJobs: 41
        },
        amount: 70000,
        proposal: 'I have drafted over 50 commercial lease agreements in the Lekki area and understand the specific local requirements and best practices for protecting landlord interests.',
        deliveryTime: '7 days',
        submittedDate: '2025-04-06',
        status: 'accepted'
      }
    ],
    deliverables: {
      description: 'I have drafted a comprehensive lease agreement tailored to your specific requirements for the Lekki Phase 1 property. The document includes all standard clauses as well as specific provisions for maintenance responsibilities, signage rights, and renewal terms as discussed.',
      files: [
        {
          name: 'commercial-lease-agreement-final.pdf',
          size: 3200000,
          type: 'application/pdf'
        },
        {
          name: 'lease-terms-summary.pdf',
          size: 1500000,
          type: 'application/pdf'
        }
      ],
      submittedAt: '2025-04-21'
    },
    feedback: {
      rating: 5,
      comment: 'Folake delivered an exceptional lease agreement that perfectly addressed all our requirements. The document was comprehensive, professionally formatted, and included several clauses we hadn\'t even considered. Highly recommended!',
      submittedAt: '2025-04-23'
    }
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