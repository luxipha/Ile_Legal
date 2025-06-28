#!/usr/bin/env node
/**
 * Create test gigs for user Abisoye across different real estate categories
 */

const { createClient } = require('@supabase/supabase-js');

// Use correct Supabase credentials from .env
const supabaseUrl = 'https://pleuwhgjpjnkqvbemmhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXV3aGdqcGpua3F2YmVtbWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgzNDQ3MywiZXhwIjoyMDY1NDEwNDczfQ.M73Gc3LJz3uMHCuIzF7VTDRvTr2fZWbLMpvm4Xs-eFk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Abisoye's user ID from the data you provided
const ABISOYE_USER_ID = 'f573e36f-13ec-4855-9229-5868c495b784';

// Real estate categories with realistic gig data
const TEST_GIGS = [
  {
    title: "Property Purchase Agreement for 3-Bedroom Duplex",
    description: "Need legal assistance to draft and review purchase agreement for a 3-bedroom duplex in Lekki Phase 1. Property value is ₦45M. Require verification of all documents and due diligence.",
    categories: ["property-purchase"],
    budget: 250000,
    deadline: "2025-01-15"
  },
  {
    title: "Certificate of Occupancy Processing - Lagos Island",
    description: "Assistance needed to process C of O for a commercial property on Lagos Island. All preliminary documents available. Need experienced lawyer familiar with Lagos State procedures.",
    categories: ["c-of-o"],
    budget: 180000,
    deadline: "2025-02-01"
  },
  {
    title: "Land Title Verification for 2 Plots in Ibeju-Lekki",
    description: "Comprehensive title verification for 2 plots of land in Ibeju-Lekki. Need to confirm authenticity of documents and ensure clean title before purchase.",
    categories: ["land-title"],
    budget: 120000,
    deadline: "2025-01-20"
  },
  {
    title: "Deed of Assignment Preparation",
    description: "Require professional legal services to prepare deed of assignment for property transfer. All parties are ready to proceed. Need quick turnaround.",
    categories: ["deed-preparation"],
    budget: 95000,
    deadline: "2025-01-10"
  },
  {
    title: "Lease Agreement for Commercial Property",
    description: "Draft comprehensive lease agreement for a 5-year commercial property lease in Victoria Island. Property to be used for office space.",
    categories: ["lease-agreement"],
    budget: 85000,
    deadline: "2025-01-25"
  },
  {
    title: "Property Due Diligence for Investment Portfolio",
    description: "Comprehensive due diligence for 3 properties being considered for investment. Need thorough legal review and risk assessment.",
    categories: ["property-due-diligence"],
    budget: 320000,
    deadline: "2025-02-15"
  },
  {
    title: "Survey Plan Verification and Boundary Dispute",
    description: "Need legal assistance to verify survey plans and resolve boundary dispute with neighbor. Property located in Ajah area.",
    categories: ["survey-plan"],
    budget: 150000,
    deadline: "2025-01-30"
  },
  {
    title: "Tenancy Agreement for Residential Property",
    description: "Standard tenancy agreement needed for 2-bedroom apartment in Ikeja. Tenant ready to move in, need agreement finalized quickly.",
    categories: ["rent-agreement"],
    budget: 45000,
    deadline: "2025-01-08"
  },
  {
    title: "Property Registration Services",
    description: "Complete property registration services needed for newly acquired land. All purchase documents ready, need registration at appropriate government offices.",
    categories: ["property-registration"],
    budget: 200000,
    deadline: "2025-02-10"
  },
  {
    title: "Mortgage Documentation Review",
    description: "Review and finalize mortgage documentation for property purchase. Bank loan approved, need legal review of all mortgage terms and conditions.",
    categories: ["mortgage-documentation"],
    budget: 110000,
    deadline: "2025-01-18"
  }
];

async function createTestGigs() {
  console.log('🏗️ Creating test gigs for Abisoye...');
  
  try {
    for (const gigData of TEST_GIGS) {
      console.log(`📝 Creating gig: ${gigData.title}`);
      
      const { data, error } = await supabase
        .from('Gigs')
        .insert({
          buyer_id: ABISOYE_USER_ID,
          title: gigData.title,
          description: gigData.description,
          categories: gigData.categories,
          budget: gigData.budget,
          deadline: gigData.deadline,
          status: 'pending',
          attachments: [],
          is_flagged: false
        })
        .select()
        .single();
        
      if (error) {
        console.error(`❌ Error creating gig "${gigData.title}":`, error);
      } else {
        console.log(`✅ Created gig: ${data.title} (ID: ${data.id})`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎉 All test gigs created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating test gigs:', error);
  }
}

createTestGigs();