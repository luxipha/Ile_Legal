-- Create Comprehensive Test Users with Complete Profiles
-- This script creates buyers, sellers, and admins with realistic, complete data

-- First, create auth users
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    confirmation_token,
    email_confirmed_at,
    phone_confirmed_at
) VALUES 
-- Super Admin
('11111111-1111-1111-1111-111111111111', 'admin@ilelegal.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "super_admin"}', false, '', NOW(), NULL),

-- Legal Admin
('22222222-2222-2222-2222-222222222222', 'legal.admin@ilelegal.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "admin"}', false, '', NOW(), NULL),

-- Content Admin
('33333333-3333-3333-3333-333333333333', 'content.admin@ilelegal.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "admin"}', false, '', NOW(), NULL),

-- Senior Legal Professional (Seller)
('44444444-4444-4444-4444-444444444444', 'sarah.martinez@lawfirm.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false, '', NOW(), NULL),

-- Property Law Specialist (Seller)
('55555555-5555-5555-5555-555555555555', 'james.thompson@propertylaw.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false, '', NOW(), NULL),

-- Corporate Lawyer (Seller)
('66666666-6666-6666-6666-666666666666', 'emily.chen@corplaw.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false, '', NOW(), NULL),

-- Family Law Attorney (Seller)
('77777777-7777-7777-7777-777777777777', 'michael.okonkwo@familylaw.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false, '', NOW(), NULL),

-- Real Estate Developer (Buyer)
('88888888-8888-8888-8888-888888888888', 'david.wilson@devco.com', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false, '', NOW(), NULL),

-- Tech Startup Founder (Buyer)
('99999999-9999-9999-9999-999999999999', 'lisa.johnson@techstartup.com', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false, '', NOW(), NULL),

-- Small Business Owner (Buyer)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'robert.brown@localbiz.com', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false, '', NOW(), NULL),

-- Non-Profit Director (Buyer)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'maria.garcia@nonprofit.org', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false, '', NOW(), NULL)

ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Create comprehensive profiles
INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    user_type,
    verification_status,
    phone,
    address,
    city,
    state,
    zip_code,
    country,
    bio,
    skills,
    experience_years,
    hourly_rate,
    languages,
    education,
    certifications,
    portfolio_url,
    linkedin_url,
    website_url,
    availability_status,
    timezone,
    response_time_hours,
    specializations,
    bar_admission_states,
    law_school,
    graduation_year,
    professional_summary,
    notable_cases,
    publications,
    avatar_url,
    cover_image_url,
    created_at,
    updated_at
) VALUES 
-- Super Admin
(
    '11111111-1111-1111-1111-111111111111',
    'admin@ilelegal.com',
    'System',
    'Administrator',
    'super_admin',
    'verified',
    '+1-555-0001',
    '123 Admin Plaza, Suite 100',
    'Lagos',
    'Lagos State',
    '100001',
    'Nigeria',
    'System administrator responsible for platform oversight, user management, and technical operations. Ensuring platform security and optimal performance.',
    ARRAY['Platform Management', 'User Administration', 'System Security', 'Data Analytics'],
    8,
    NULL,
    ARRAY['English', 'Yoruba'],
    'Computer Science, University of Lagos',
    ARRAY['AWS Certified Solutions Architect', 'Certified Information Systems Security Professional (CISSP)'],
    NULL,
    'https://linkedin.com/in/systemadmin',
    'https://ilelegal.com',
    'available',
    'Africa/Lagos',
    1,
    ARRAY['System Administration', 'Platform Management'],
    NULL,
    NULL,
    NULL,
    'Experienced system administrator with 8+ years managing legal technology platforms.',
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=System+Administrator&background=1B1828&color=fff&size=200',
    NULL,
    NOW(),
    NOW()
),

-- Legal Admin
(
    '22222222-2222-2222-2222-222222222222',
    'legal.admin@ilelegal.com',
    'Funmilayo',
    'Adebayo',
    'admin',
    'verified',
    '+1-555-0002',
    '456 Legal Avenue, Floor 5',
    'Abuja',
    'FCT',
    '900001',
    'Nigeria',
    'Legal administrator with extensive experience in regulatory compliance, user verification, and legal operations management.',
    ARRAY['Legal Operations', 'Compliance Management', 'User Verification', 'Risk Assessment'],
    12,
    NULL,
    ARRAY['English', 'Hausa', 'Yoruba'],
    'LLB, University of Abuja; LLM, Harvard Law School',
    ARRAY['Nigerian Bar Association', 'Certified Compliance Professional'],
    NULL,
    'https://linkedin.com/in/funmilayoadebayo',
    NULL,
    'available',
    'Africa/Lagos',
    2,
    ARRAY['Legal Administration', 'Compliance'],
    ARRAY['Nigeria'],
    'University of Abuja',
    2008,
    'Accomplished legal professional specializing in regulatory compliance and legal operations.',
    NULL,
    ARRAY['Legal Technology Implementation Best Practices (2023)'],
    'https://ui-avatars.com/api/?name=Funmilayo+Adebayo&background=3B82F6&color=fff&size=200',
    NULL,
    NOW(),
    NOW()
),

-- Content Admin
(
    '33333333-3333-3333-3333-333333333333',
    'content.admin@ilelegal.com',
    'Chinedu',
    'Okoro',
    'admin',
    'verified',
    '+1-555-0003',
    '789 Content Street, Building B',
    'Port Harcourt',
    'Rivers State',
    '500001',
    'Nigeria',
    'Content administrator responsible for platform content quality, educational resources, and user engagement initiatives.',
    ARRAY['Content Management', 'Educational Development', 'User Engagement', 'Quality Assurance'],
    6,
    NULL,
    ARRAY['English', 'Igbo'],
    'Mass Communication, University of Port Harcourt; Digital Marketing Certificate',
    ARRAY['Google Analytics Certified', 'HubSpot Content Marketing Certified'],
    'https://contentportfolio.com/chinedu',
    'https://linkedin.com/in/chineduokoro',
    'https://contentblog.com',
    'available',
    'Africa/Lagos',
    3,
    ARRAY['Content Strategy', 'Digital Marketing'],
    NULL,
    NULL,
    NULL,
    'Creative content strategist with expertise in legal education and user engagement.',
    NULL,
    ARRAY['Digital Content Strategies for Legal Platforms (2024)'],
    'https://ui-avatars.com/api/?name=Chinedu+Okoro&background=10B981&color=fff&size=200',
    NULL,
    NOW(),
    NOW()
),

-- Senior Legal Professional
(
    '44444444-4444-4444-4444-444444444444',
    'sarah.martinez@lawfirm.com',
    'Sarah',
    'Martinez',
    'seller',
    'verified',
    '+1-555-0004',
    '1500 K Street NW, Suite 800',
    'Washington',
    'DC',
    '20005',
    'United States',
    'Senior partner with 15+ years specializing in international corporate law, mergers & acquisitions, and regulatory compliance. Fluent in English and Spanish.',
    ARRAY['Corporate Law', 'M&A', 'International Trade', 'Regulatory Compliance', 'Contract Negotiation'],
    15,
    450.00,
    ARRAY['English', 'Spanish', 'Portuguese'],
    'JD, Georgetown University Law Center (summa cum laude); LLM International Law, Harvard',
    ARRAY['District of Columbia Bar', 'New York State Bar', 'Certified Corporate Counsel'],
    'https://martinezlaw.com/portfolio',
    'https://linkedin.com/in/sarahmartinezlaw',
    'https://martinezlaw.com',
    'available',
    'America/New_York',
    2,
    ARRAY['Corporate Law', 'International Trade', 'M&A', 'Securities Law'],
    ARRAY['District of Columbia', 'New York'],
    'Georgetown University Law Center',
    2009,
    'Accomplished corporate attorney with extensive experience in complex international transactions and regulatory matters.',
    ARRAY['Led $2.5B merger between Fortune 500 companies', 'Represented government in landmark trade dispute'],
    ARRAY['International Corporate Law Review (2023)', 'Modern M&A Strategies (2022)'],
    'https://ui-avatars.com/api/?name=Sarah+Martinez&background=8B5CF6&color=fff&size=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    NOW(),
    NOW()
),

-- Property Law Specialist
(
    '55555555-5555-5555-5555-555555555555',
    'james.thompson@propertylaw.com',
    'James',
    'Thompson',
    'seller',
    'verified',
    '+44-20-7946-0001',
    '25 Old Broad Street, Floor 12',
    'London',
    'England',
    'EC2N 1HQ',
    'United Kingdom',
    'Property law specialist with deep expertise in commercial real estate, land development, and property disputes. Recognized expert in UK property law.',
    ARRAY['Property Law', 'Real Estate Transactions', 'Land Development', 'Property Disputes', 'Planning Law'],
    12,
    380.00,
    ARRAY['English', 'French'],
    'LLB, University of Cambridge; LLM Property Law, Oxford University',
    ARRAY['Solicitor of England and Wales', 'Chartered Institute of Legal Executives'],
    'https://thompsonproperty.co.uk/cases',
    'https://linkedin.com/in/jamesthompsonproperty',
    'https://thompsonproperty.co.uk',
    'available',
    'Europe/London',
    4,
    ARRAY['Commercial Property', 'Residential Development', 'Planning Appeals'],
    ARRAY['England', 'Wales'],
    'University of Cambridge',
    2012,
    'Leading property law practitioner with extensive experience in complex development projects.',
    ARRAY['Canary Wharf expansion legal framework', '£500M residential development approvals'],
    ARRAY['UK Property Law Quarterly (2024)', 'Modern Planning Law Handbook (2023)'],
    'https://ui-avatars.com/api/?name=James+Thompson&background=059669&color=fff&size=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800',
    NOW(),
    NOW()
),

-- Corporate Lawyer
(
    '66666666-6666-6666-6666-666666666666',
    'emily.chen@corplaw.com',
    'Emily',
    'Chen',
    'seller',
    'verified',
    '+1-415-555-0006',
    '101 California Street, 48th Floor',
    'San Francisco',
    'CA',
    '94111',
    'United States',
    'Corporate attorney specializing in technology companies, venture capital, and intellectual property. Expert in startup legal strategy and growth-stage transactions.',
    ARRAY['Corporate Law', 'Venture Capital', 'IP Law', 'Tech Transactions', 'Securities Law'],
    10,
    420.00,
    ARRAY['English', 'Mandarin', 'Cantonese'],
    'JD, Stanford Law School; BS Computer Science, UC Berkeley',
    ARRAY['California State Bar', 'USPTO Patent Bar', 'Series 7 & 66 Licenses'],
    'https://chenlegal.com/tech-portfolio',
    'https://linkedin.com/in/emilychenlegal',
    'https://chenlegal.com',
    'available',
    'America/Los_Angeles',
    3,
    ARRAY['Tech Startups', 'VC Transactions', 'IP Strategy'],
    ARRAY['California'],
    'Stanford Law School',
    2014,
    'Technology-focused attorney with deep understanding of startup ecosystem and venture capital.',
    ARRAY['Represented unicorn startup through Series A-E funding', 'Led IPO for major tech company'],
    ARRAY['Tech Law Review (2024)', 'Venture Capital Legal Guide (2023)'],
    'https://ui-avatars.com/api/?name=Emily+Chen&background=F59E0B&color=fff&size=200',
    'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=800',
    NOW(),
    NOW()
),

-- Family Law Attorney
(
    '77777777-7777-7777-7777-777777777777',
    'michael.okonkwo@familylaw.com',
    'Michael',
    'Okonkwo',
    'seller',
    'verified',
    '+1-416-555-0007',
    '100 King Street West, Suite 5600',
    'Toronto',
    'ON',
    'M5X 1C7',
    'Canada',
    'Compassionate family law attorney with expertise in divorce, custody, and domestic relations. Committed to protecting families through difficult transitions.',
    ARRAY['Family Law', 'Divorce Proceedings', 'Child Custody', 'Domestic Relations', 'Mediation'],
    8,
    280.00,
    ARRAY['English', 'French', 'Igbo'],
    'JD, University of Toronto; BA Psychology, York University',
    ARRAY['Law Society of Ontario', 'Certified Family Law Specialist', 'Accredited Mediator'],
    'https://okonkwofamily.ca/testimonials',
    'https://linkedin.com/in/michaelokonkwolaw',
    'https://okonkwofamily.ca',
    'available',
    'America/Toronto',
    6,
    ARRAY['High-Conflict Divorce', 'International Custody', 'Collaborative Law'],
    ARRAY['Ontario'],
    'University of Toronto',
    2016,
    'Dedicated family law practitioner focused on achieving fair outcomes for all family members.',
    ARRAY['Landmark custody case setting international precedent', 'Successful mediation of complex divorce settlements'],
    ARRAY['Canadian Family Law Journal (2024)', 'Mediation in Family Disputes (2023)'],
    'https://ui-avatars.com/api/?name=Michael+Okonkwo&background=DC2626&color=fff&size=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    NOW(),
    NOW()
),

-- Real Estate Developer
(
    '88888888-8888-8888-8888-888888888888',
    'david.wilson@devco.com',
    'David',
    'Wilson',
    'buyer',
    'verified',
    '+1-305-555-0008',
    '1450 Brickell Avenue, Suite 3100',
    'Miami',
    'FL',
    '33131',
    'United States',
    'Real estate developer specializing in luxury residential and mixed-use commercial properties. Leading sustainable development initiatives across the Southeast.',
    ARRAY['Real Estate Development', 'Project Management', 'Sustainable Building', 'Investment Analysis'],
    18,
    NULL,
    ARRAY['English', 'Spanish'],
    'MBA Real Estate, University of Pennsylvania; BS Civil Engineering, Georgia Tech',
    ARRAY['LEED AP BD+C', 'Certified Commercial Investment Member (CCIM)'],
    'https://wilsondev.com/projects',
    'https://linkedin.com/in/davidwilsondev',
    'https://wilsondev.com',
    'seeking_legal_services',
    'America/New_York',
    24,
    ARRAY['Luxury Residential', 'Mixed-Use Development', 'Sustainable Design'],
    NULL,
    NULL,
    NULL,
    'Visionary developer with $2B+ in completed projects, specializing in sustainable luxury developments.',
    ARRAY['Brickell Heights - 50-story luxury tower', 'Miami Design District mixed-use complex'],
    ARRAY['Sustainable Development Quarterly (2024)', 'Future of Urban Living (2023)'],
    'https://ui-avatars.com/api/?name=David+Wilson&background=1F2937&color=fff&size=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800',
    NOW(),
    NOW()
),

-- Tech Startup Founder
(
    '99999999-9999-9999-9999-999999999999',
    'lisa.johnson@techstartup.com',
    'Lisa',
    'Johnson',
    'buyer',
    'verified',
    '+1-512-555-0009',
    '98 San Jacinto Blvd, Suite 1200',
    'Austin',
    'TX',
    '78701',
    'United States',
    'Serial entrepreneur and tech innovator. Currently building AI-powered fintech solutions. Previously exited two startups for $50M+ combined.',
    ARRAY['Entrepreneurship', 'Product Strategy', 'Fundraising', 'AI/ML', 'Fintech'],
    12,
    NULL,
    ARRAY['English'],
    'MS Computer Science, MIT; BS Mathematics, UT Austin',
    ARRAY['Y Combinator Alum', 'TechStars Mentor', 'Series A+ Certified'],
    'https://lisajohnson.tech/portfolio',
    'https://linkedin.com/in/lisajohnsontech',
    'https://nexgenfintech.com',
    'seeking_legal_services',
    'America/Chicago',
    12,
    ARRAY['AI/ML Products', 'Fintech Innovation', 'Scaling Startups'],
    NULL,
    NULL,
    NULL,
    'Innovative founder with proven track record of building and scaling technology companies.',
    ARRAY['PayFlow - $30M exit to JPMorgan', 'DataSync - $25M Series B raised'],
    ARRAY['TechCrunch Featured Founder (2024)', 'AI in Finance Whitepaper (2023)'],
    'https://ui-avatars.com/api/?name=Lisa+Johnson&background=7C3AED&color=fff&size=200',
    'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=800',
    NOW(),
    NOW()
),

-- Small Business Owner
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'robert.brown@localbiz.com',
    'Robert',
    'Brown',
    'buyer',
    'verified',
    '+1-773-555-0010',
    '1234 N Michigan Avenue',
    'Chicago',
    'IL',
    '60611',
    'United States',
    'Third-generation family business owner operating a chain of local restaurants and catering services. Expanding into food delivery and franchising.',
    ARRAY['Business Operations', 'Franchise Development', 'Food Service', 'Local Marketing'],
    15,
    NULL,
    ARRAY['English'],
    'MBA, Northwestern Kellogg; BA Business, University of Illinois',
    ARRAY['Certified Franchise Executive', 'ServSafe Manager Certified'],
    'https://brownsrestaurants.com/story',
    'https://linkedin.com/in/robertbrownrestaurants',
    'https://brownsrestaurants.com',
    'seeking_legal_services',
    'America/Chicago',
    8,
    ARRAY['Restaurant Operations', 'Franchise Development', 'Local Business'],
    NULL,
    NULL,
    NULL,
    'Experienced business owner focused on community-centered growth and franchise expansion.',
    ARRAY['Expanded from 1 to 8 locations over 10 years', 'Successful franchise pilot program'],
    NULL,
    'https://ui-avatars.com/api/?name=Robert+Brown&background=92400E&color=fff&size=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    NOW(),
    NOW()
),

-- Non-Profit Director
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'maria.garcia@nonprofit.org',
    'Maria',
    'Garcia',
    'buyer',
    'verified',
    '+1-213-555-0011',
    '600 Wilshire Blvd, Suite 1500',
    'Los Angeles',
    'CA',
    '90017',
    'United States',
    'Executive Director of education-focused non-profit serving underserved communities. Passionate about expanding access to quality education and legal services.',
    ARRAY['Non-Profit Management', 'Education Policy', 'Community Outreach', 'Grant Writing'],
    10,
    NULL,
    ARRAY['English', 'Spanish'],
    'MPA, USC Price School; BA Social Work, UCLA',
    ARRAY['Certified Fund Raising Executive', 'Non-Profit Leadership Certificate'],
    'https://educationforall.org/impact',
    'https://linkedin.com/in/mariagarcianonprofit',
    'https://educationforall.org',
    'seeking_legal_services',
    'America/Los_Angeles',
    24,
    ARRAY['Education Policy', 'Community Development', 'Grant Management'],
    NULL,
    NULL,
    NULL,
    'Dedicated leader committed to educational equity and community empowerment.',
    ARRAY['Secured $5M federal education grant', 'Expanded programs to serve 10,000+ students'],
    ARRAY['Community Impact Report (2024)', 'Educational Equity in Practice (2023)'],
    'https://ui-avatars.com/api/?name=Maria+Garcia&background=BE185D&color=fff&size=200',
    'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=800',
    NOW(),
    NOW()
)

ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    user_type = EXCLUDED.user_type,
    verification_status = EXCLUDED.verification_status,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    country = EXCLUDED.country,
    bio = EXCLUDED.bio,
    skills = EXCLUDED.skills,
    experience_years = EXCLUDED.experience_years,
    hourly_rate = EXCLUDED.hourly_rate,
    languages = EXCLUDED.languages,
    education = EXCLUDED.education,
    certifications = EXCLUDED.certifications,
    portfolio_url = EXCLUDED.portfolio_url,
    linkedin_url = EXCLUDED.linkedin_url,
    website_url = EXCLUDED.website_url,
    availability_status = EXCLUDED.availability_status,
    timezone = EXCLUDED.timezone,
    response_time_hours = EXCLUDED.response_time_hours,
    specializations = EXCLUDED.specializations,
    bar_admission_states = EXCLUDED.bar_admission_states,
    law_school = EXCLUDED.law_school,
    graduation_year = EXCLUDED.graduation_year,
    professional_summary = EXCLUDED.professional_summary,
    notable_cases = EXCLUDED.notable_cases,
    publications = EXCLUDED.publications,
    avatar_url = EXCLUDED.avatar_url,
    cover_image_url = EXCLUDED.cover_image_url,
    updated_at = NOW();

-- Create some sample gigs from buyers
INSERT INTO gigs (
    id,
    title,
    description,
    categories,
    budget,
    deadline,
    buyer_id,
    status,
    requirements,
    deliverables,
    created_at
) VALUES 
(
    'gig-001-luxury-development',
    'Legal Review for $50M Luxury Development Project',
    'Seeking experienced property law attorney to review all legal documentation for a 50-story luxury residential tower in downtown Miami. This includes zoning compliance, environmental clearances, construction contracts, and regulatory approvals.',
    ARRAY['Property Law', 'Real Estate', 'Regulatory Compliance'],
    25000.00,
    (NOW() + INTERVAL '30 days'),
    '88888888-8888-8888-8888-888888888888',
    'active',
    ARRAY['15+ years property law experience', 'Florida Bar admission', 'Large project experience'],
    ARRAY['Complete legal review report', 'Risk assessment document', 'Compliance checklist'],
    NOW()
),
(
    'gig-002-ai-fintech-legal',
    'Comprehensive Legal Framework for AI Fintech Startup',
    'Need experienced tech attorney to establish complete legal framework for AI-powered fintech platform. Includes corporate structure, IP strategy, regulatory compliance, privacy policies, and funding documentation.',
    ARRAY['Corporate Law', 'Fintech', 'AI/ML Legal', 'Venture Capital'],
    18000.00,
    (NOW() + INTERVAL '45 days'),
    '99999999-9999-9999-9999-999999999999',
    'active',
    ARRAY['Tech/fintech legal experience', 'AI regulatory knowledge', 'VC transaction experience'],
    ARRAY['Corporate legal structure', 'IP protection strategy', 'Regulatory compliance plan', 'Privacy policies'],
    NOW()
),
(
    'gig-003-franchise-expansion',
    'Franchise Legal Documentation and Compliance',
    'Expanding restaurant business needs comprehensive franchise legal documentation. Includes franchise disclosure documents, franchise agreements, compliance procedures, and multi-state registration.',
    ARRAY['Business Law', 'Franchise Law', 'Regulatory Compliance'],
    12000.00,
    (NOW() + INTERVAL '60 days'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active',
    ARRAY['Franchise law experience', 'Multi-state compliance knowledge', 'Food service industry familiarity'],
    ARRAY['Franchise Disclosure Document', 'Franchise agreements', 'State registration filings'],
    NOW()
),
(
    'gig-004-nonprofit-legal',
    'Legal Structure Review for Educational Non-Profit Expansion',
    'Educational non-profit seeking legal review and optimization of organizational structure for national expansion. Includes governance review, compliance audit, and expansion strategy legal framework.',
    ARRAY['Non-Profit Law', 'Educational Law', 'Governance'],
    8000.00,
    (NOW() + INTERVAL '40 days'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'active',
    ARRAY['Non-profit law experience', 'Educational sector knowledge', 'Multi-state expansion experience'],
    ARRAY['Governance structure review', 'Compliance audit report', 'Expansion legal framework'],
    NOW()
)

ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    budget = EXCLUDED.budget,
    deadline = EXCLUDED.deadline,
    updated_at = NOW();

-- Add some reputation data for sellers
INSERT INTO reputation_scores (
    user_id,
    reputation_type,
    score,
    total_reviews,
    successful_completions,
    average_rating
) VALUES 
-- Sarah Martinez (Senior Legal Professional)
('44444444-4444-4444-4444-444444444444', 'legal_review', 92.5, 28, 25, 4.8),
('44444444-4444-4444-4444-444444444444', 'dispute_resolution', 88.0, 12, 11, 4.7),
('44444444-4444-4444-4444-444444444444', 'contract_drafting', 95.0, 35, 34, 4.9),

-- James Thompson (Property Law Specialist)
('55555555-5555-5555-5555-555555555555', 'property_approval', 94.0, 22, 21, 4.8),
('55555555-5555-5555-5555-555555555555', 'legal_review', 89.5, 18, 17, 4.6),

-- Emily Chen (Corporate Lawyer)
('66666666-6666-6666-6666-666666666666', 'legal_review', 91.0, 24, 22, 4.7),
('66666666-6666-6666-6666-666666666666', 'contract_drafting', 93.5, 30, 28, 4.8),

-- Michael Okonkwo (Family Law Attorney)
('77777777-7777-7777-7777-777777777777', 'legal_review', 87.5, 16, 15, 4.5),
('77777777-7777-7777-7777-777777777777', 'dispute_resolution', 90.0, 14, 13, 4.6)

ON CONFLICT (user_id, reputation_type) DO UPDATE SET
    score = EXCLUDED.score,
    total_reviews = EXCLUDED.total_reviews,
    successful_completions = EXCLUDED.successful_completions,
    average_rating = EXCLUDED.average_rating,
    updated_at = NOW();

-- Add some legal credentials
INSERT INTO legal_credentials (
    user_id,
    credential_type,
    credential_name,
    issuing_authority,
    jurisdiction,
    verification_status,
    issued_date,
    expiry_date
) VALUES 
-- Sarah Martinez credentials
('44444444-4444-4444-4444-444444444444', 'bar_license', 'District of Columbia Bar License', 'DC Bar Association', 'District of Columbia', 'verified', '2009-10-15', '2025-12-31'),
('44444444-4444-4444-4444-444444444444', 'bar_license', 'New York State Bar License', 'New York State Bar', 'New York', 'verified', '2010-02-20', '2025-12-31'),
('44444444-4444-4444-4444-444444444444', 'certification', 'Certified Corporate Counsel', 'Association of Corporate Counsel', 'United States', 'verified', '2015-06-10', '2026-06-10'),

-- James Thompson credentials
('55555555-5555-5555-5555-555555555555', 'bar_license', 'Solicitor of England and Wales', 'Solicitors Regulation Authority', 'England and Wales', 'verified', '2012-09-01', '2025-12-31'),
('55555555-5555-5555-5555-555555555555', 'certification', 'RICS Chartered Surveyor', 'Royal Institution of Chartered Surveyors', 'United Kingdom', 'verified', '2014-03-15', '2026-03-15'),

-- Emily Chen credentials
('66666666-6666-6666-6666-666666666666', 'bar_license', 'California State Bar License', 'State Bar of California', 'California', 'verified', '2014-12-05', '2025-12-31'),
('66666666-6666-6666-6666-666666666666', 'certification', 'USPTO Patent Bar Registration', 'United States Patent and Trademark Office', 'United States', 'verified', '2015-08-20', '2026-08-20'),

-- Michael Okonkwo credentials
('77777777-7777-7777-7777-777777777777', 'bar_license', 'Law Society of Ontario License', 'Law Society of Ontario', 'Ontario', 'verified', '2016-06-30', '2025-12-31'),
('77777777-7777-7777-7777-777777777777', 'certification', 'Certified Family Law Specialist', 'Law Society of Ontario', 'Ontario', 'verified', '2019-04-12', '2025-04-12')

ON CONFLICT (id) DO NOTHING;

-- Display summary of created users
SELECT 
    'USER CREATION SUMMARY' as summary,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE user_type = 'super_admin') as super_admins,
    COUNT(*) FILTER (WHERE user_type = 'admin') as admins,
    COUNT(*) FILTER (WHERE user_type = 'seller') as sellers,
    COUNT(*) FILTER (WHERE user_type = 'buyer') as buyers
FROM profiles
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777',
    '88888888-8888-8888-8888-888888888888',
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- Display login credentials
SELECT 
    'LOGIN CREDENTIALS' as info,
    email,
    user_type,
    'Password: ' || 
    CASE 
        WHEN user_type IN ('super_admin', 'admin') THEN 'admin123'
        WHEN user_type = 'seller' THEN 'seller123'
        WHEN user_type = 'buyer' THEN 'buyer123'
    END as password,
    first_name || ' ' || last_name as full_name
FROM profiles 
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777',
    '88888888-8888-8888-8888-888888888888',
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
ORDER BY 
    CASE user_type 
        WHEN 'super_admin' THEN 1 
        WHEN 'admin' THEN 2 
        WHEN 'seller' THEN 3 
        WHEN 'buyer' THEN 4 
    END,
    email;