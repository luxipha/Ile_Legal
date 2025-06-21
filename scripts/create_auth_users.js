#!/usr/bin/env node

/**
 * Create Test Users Through Supabase Auth API
 * This ensures proper authentication setup
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  // Super Admin
  {
    email: 'admin@ilelegal.com',
    password: 'admin123',
    user_metadata: { role: 'super_admin' },
    profile: {
      first_name: 'System',
      last_name: 'Administrator',
      user_type: 'super_admin',
      verification_status: 'verified',
      phone: '+234-555-0001',
      location: 'Lagos, Nigeria',
      bio: 'System administrator responsible for platform oversight, user management, and technical operations.',
      website: 'https://ilelegal.com',
      avatar_url: 'https://ui-avatars.com/api/?name=System+Administrator&background=1B1828&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Legal Admin
  {
    email: 'legal.admin@ilelegal.com',
    password: 'admin123',
    user_metadata: { role: 'admin' },
    profile: {
      first_name: 'Funmilayo',
      last_name: 'Adebayo',
      user_type: 'admin',
      verification_status: 'verified',
      phone: '+234-555-0002',
      location: 'Abuja, Nigeria',
      bio: 'Legal administrator with extensive experience in regulatory compliance, user verification, and legal operations management.',
      avatar_url: 'https://ui-avatars.com/api/?name=Funmilayo+Adebayo&background=3B82F6&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Content Admin
  {
    email: 'content.admin@ilelegal.com',
    password: 'admin123',
    user_metadata: { role: 'admin' },
    profile: {
      first_name: 'Chinedu',
      last_name: 'Okoro',
      user_type: 'admin',
      verification_status: 'verified',
      phone: '+234-555-0003',
      location: 'Port Harcourt, Nigeria',
      bio: 'Content administrator responsible for platform content quality, educational resources, and user engagement initiatives.',
      website: 'https://contentblog.com',
      avatar_url: 'https://ui-avatars.com/api/?name=Chinedu+Okoro&background=10B981&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Senior Legal Professional
  {
    email: 'sarah.martinez@lawfirm.com',
    password: 'seller123',
    user_metadata: { role: 'seller' },
    profile: {
      first_name: 'Sarah',
      last_name: 'Martinez',
      user_type: 'seller',
      verification_status: 'verified',
      phone: '+1-555-0004',
      location: 'Washington, DC, USA',
      bio: 'Senior partner with 15+ years specializing in international corporate law, mergers & acquisitions, and regulatory compliance. Fluent in English and Spanish.',
      website: 'https://martinezlaw.com',
      avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Martinez&background=8B5CF6&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Property Law Specialist
  {
    email: 'james.thompson@propertylaw.com',
    password: 'seller123',
    user_metadata: { role: 'seller' },
    profile: {
      first_name: 'James',
      last_name: 'Thompson',
      user_type: 'seller',
      verification_status: 'verified',
      phone: '+44-20-7946-0001',
      location: 'London, UK',
      bio: 'Property law specialist with deep expertise in commercial real estate, land development, and property disputes. Recognized expert in UK property law.',
      website: 'https://thompsonproperty.co.uk',
      avatar_url: 'https://ui-avatars.com/api/?name=James+Thompson&background=059669&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Corporate Lawyer
  {
    email: 'emily.chen@corplaw.com',
    password: 'seller123',
    user_metadata: { role: 'seller' },
    profile: {
      first_name: 'Emily',
      last_name: 'Chen',
      user_type: 'seller',
      verification_status: 'verified',
      phone: '+1-415-555-0006',
      location: 'San Francisco, CA, USA',
      bio: 'Corporate attorney specializing in technology companies, venture capital, and intellectual property. Expert in startup legal strategy and growth-stage transactions.',
      website: 'https://chenlegal.com',
      avatar_url: 'https://ui-avatars.com/api/?name=Emily+Chen&background=F59E0B&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Family Law Attorney
  {
    email: 'michael.okonkwo@familylaw.com',
    password: 'seller123',
    user_metadata: { role: 'seller' },
    profile: {
      first_name: 'Michael',
      last_name: 'Okonkwo',
      user_type: 'seller',
      verification_status: 'verified',
      phone: '+1-416-555-0007',
      location: 'Toronto, ON, Canada',
      bio: 'Compassionate family law attorney with expertise in divorce, custody, and domestic relations. Committed to protecting families through difficult transitions.',
      website: 'https://okonkwofamily.ca',
      avatar_url: 'https://ui-avatars.com/api/?name=Michael+Okonkwo&background=DC2626&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Real Estate Developer
  {
    email: 'david.wilson@devco.com',
    password: 'buyer123',
    user_metadata: { role: 'buyer' },
    profile: {
      first_name: 'David',
      last_name: 'Wilson',
      user_type: 'buyer',
      verification_status: 'verified',
      phone: '+1-305-555-0008',
      location: 'Miami, FL, USA',
      bio: 'Real estate developer specializing in luxury residential and mixed-use commercial properties. Leading sustainable development initiatives across the Southeast.',
      website: 'https://wilsondev.com',
      avatar_url: 'https://ui-avatars.com/api/?name=David+Wilson&background=1F2937&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Tech Startup Founder
  {
    email: 'lisa.johnson@techstartup.com',
    password: 'buyer123',
    user_metadata: { role: 'buyer' },
    profile: {
      first_name: 'Lisa',
      last_name: 'Johnson',
      user_type: 'buyer',
      verification_status: 'verified',
      phone: '+1-512-555-0009',
      location: 'Austin, TX, USA',
      bio: 'Serial entrepreneur and tech innovator. Currently building AI-powered fintech solutions. Previously exited two startups for $50M+ combined.',
      website: 'https://nexgenfintech.com',
      avatar_url: 'https://ui-avatars.com/api/?name=Lisa+Johnson&background=7C3AED&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Small Business Owner
  {
    email: 'robert.brown@localbiz.com',
    password: 'buyer123',
    user_metadata: { role: 'buyer' },
    profile: {
      first_name: 'Robert',
      last_name: 'Brown',
      user_type: 'buyer',
      verification_status: 'verified',
      phone: '+1-773-555-0010',
      location: 'Chicago, IL, USA',
      bio: 'Third-generation family business owner operating a chain of local restaurants and catering services. Expanding into food delivery and franchising.',
      website: 'https://brownsrestaurants.com',
      avatar_url: 'https://ui-avatars.com/api/?name=Robert+Brown&background=92400E&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  },

  // Non-Profit Director
  {
    email: 'maria.garcia@nonprofit.org',
    password: 'buyer123',
    user_metadata: { role: 'buyer' },
    profile: {
      first_name: 'Maria',
      last_name: 'Garcia',
      user_type: 'buyer',
      verification_status: 'verified',
      phone: '+1-213-555-0011',
      location: 'Los Angeles, CA, USA',
      bio: 'Executive Director of education-focused non-profit serving underserved communities. Passionate about expanding access to quality education and legal services.',
      website: 'https://educationforall.org',
      avatar_url: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=BE185D&color=fff&size=200',
      circle_wallet_status: 'active'
    }
  }
];

async function createTestUsers() {
  console.log('🔐 Creating Test Users Through Supabase Auth...\n');

  const results = {
    success: [],
    failed: [],
    profiles: []
  };

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`);

      // Create user through Supabase Auth Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata
      });

      if (authError) {
        console.error(`❌ Auth error for ${user.email}:`, authError.message);
        results.failed.push({ email: user.email, error: authError.message });
        continue;
      }

      console.log(`✅ Auth user created: ${user.email} (ID: ${authData.user.id})`);

      // Create or update profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          ...user.profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Profile error for ${user.email}:`, profileError.message);
        results.failed.push({ email: user.email, error: profileError.message });
        continue;
      }

      console.log(`✅ Profile created: ${user.email}`);
      results.success.push(user.email);
      results.profiles.push(profileData);

    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error.message);
      results.failed.push({ email: user.email, error: error.message });
    }
  }

  return results;
}

async function addReputationData() {
  console.log('\n🏆 Adding Reputation Data...');

  // Define user IDs from created users - we'll need to get these from the database
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('email', [
      'sarah.martinez@lawfirm.com',
      'james.thompson@propertylaw.com',
      'emily.chen@corplaw.com',
      'michael.okonkwo@familylaw.com'
    ]);

  if (error) {
    console.error('❌ Error fetching user IDs:', error);
    return;
  }

  const userMap = {};
  users.forEach(user => {
    userMap[user.email] = user.id;
  });

  // Reputation scores data
  const reputationData = [
    // Sarah Martinez
    { email: 'sarah.martinez@lawfirm.com', type: 'legal_review', score: 92.5, reviews: 28, completions: 25, rating: 4.8 },
    { email: 'sarah.martinez@lawfirm.com', type: 'dispute_resolution', score: 88.0, reviews: 12, completions: 11, rating: 4.7 },

    // James Thompson
    { email: 'james.thompson@propertylaw.com', type: 'property_approval', score: 94.0, reviews: 22, completions: 21, rating: 4.8 },
    { email: 'james.thompson@propertylaw.com', type: 'legal_review', score: 89.5, reviews: 18, completions: 17, rating: 4.6 },

    // Emily Chen
    { email: 'emily.chen@corplaw.com', type: 'legal_review', score: 91.0, reviews: 24, completions: 22, rating: 4.7 },

    // Michael Okonkwo
    { email: 'michael.okonkwo@familylaw.com', type: 'legal_review', score: 87.5, reviews: 16, completions: 15, rating: 4.5 },
    { email: 'michael.okonkwo@familylaw.com', type: 'dispute_resolution', score: 90.0, reviews: 14, completions: 13, rating: 4.6 }
  ];

  for (const rep of reputationData) {
    const userId = userMap[rep.email];
    if (!userId) continue;

    const { error } = await supabase
      .from('reputation_scores')
      .upsert({
        user_id: userId,
        reputation_type: rep.type,
        score: rep.score,
        total_reviews: rep.reviews,
        successful_completions: rep.completions,
        average_rating: rep.rating
      });

    if (error) {
      console.error(`❌ Reputation error for ${rep.email}:`, error);
    } else {
      console.log(`✅ Reputation added: ${rep.email} - ${rep.type}`);
    }
  }

  // Legal credentials data
  const credentialsData = [
    { email: 'sarah.martinez@lawfirm.com', type: 'bar_license', name: 'District of Columbia Bar License', authority: 'DC Bar Association', jurisdiction: 'District of Columbia' },
    { email: 'sarah.martinez@lawfirm.com', type: 'bar_license', name: 'New York State Bar License', authority: 'New York State Bar', jurisdiction: 'New York' },
    { email: 'sarah.martinez@lawfirm.com', type: 'certification', name: 'Certified Corporate Counsel', authority: 'Association of Corporate Counsel', jurisdiction: 'United States' },

    { email: 'james.thompson@propertylaw.com', type: 'bar_license', name: 'Solicitor of England and Wales', authority: 'Solicitors Regulation Authority', jurisdiction: 'England and Wales' },
    { email: 'james.thompson@propertylaw.com', type: 'certification', name: 'RICS Chartered Surveyor', authority: 'Royal Institution of Chartered Surveyors', jurisdiction: 'United Kingdom' },

    { email: 'emily.chen@corplaw.com', type: 'bar_license', name: 'California State Bar License', authority: 'State Bar of California', jurisdiction: 'California' },
    { email: 'emily.chen@corplaw.com', type: 'certification', name: 'USPTO Patent Bar Registration', authority: 'United States Patent and Trademark Office', jurisdiction: 'United States' },

    { email: 'michael.okonkwo@familylaw.com', type: 'bar_license', name: 'Law Society of Ontario License', authority: 'Law Society of Ontario', jurisdiction: 'Ontario' },
    { email: 'michael.okonkwo@familylaw.com', type: 'certification', name: 'Certified Family Law Specialist', authority: 'Law Society of Ontario', jurisdiction: 'Ontario' }
  ];

  for (const cred of credentialsData) {
    const userId = userMap[cred.email];
    if (!userId) continue;

    const { error } = await supabase
      .from('legal_credentials')
      .upsert({
        user_id: userId,
        credential_type: cred.type,
        credential_name: cred.name,
        issuing_authority: cred.authority,
        jurisdiction: cred.jurisdiction,
        verification_status: 'verified',
        issued_date: '2015-01-01',
        expiry_date: '2025-12-31'
      });

    if (error) {
      console.error(`❌ Credential error for ${cred.email}:`, error);
    } else {
      console.log(`✅ Credential added: ${cred.email} - ${cred.name}`);
    }
  }
}

async function main() {
  try {
    const results = await createTestUsers();
    
    console.log('\n📊 RESULTS SUMMARY:');
    console.log(`✅ Successfully created: ${results.success.length} users`);
    console.log(`❌ Failed to create: ${results.failed.length} users`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed users:');
      results.failed.forEach(f => console.log(`   ${f.email}: ${f.error}`));
    }

    if (results.success.length > 0) {
      console.log('\n✅ Successfully created users:');
      results.success.forEach(email => console.log(`   ${email}`));

      // Add reputation data
      await addReputationData();
    }

    console.log('\n🎯 LOGIN CREDENTIALS:');
    console.log('Admins: admin123');
    console.log('Sellers: seller123');
    console.log('Buyers: buyer123');

    console.log('\n🚀 Test users created! You can now login with:');
    console.log('- sarah.martinez@lawfirm.com / seller123');
    console.log('- admin@ilelegal.com / admin123');
    console.log('- david.wilson@devco.com / buyer123');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

main();