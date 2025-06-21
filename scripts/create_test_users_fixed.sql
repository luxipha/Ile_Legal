-- Create Comprehensive Test Users with Complete Profiles
-- Fixed version that matches actual database schema

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
    is_sso_user
) VALUES 
-- Super Admin
('11111111-1111-1111-1111-111111111111', 'admin@ilelegal.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "super_admin"}', false),

-- Legal Admin
('22222222-2222-2222-2222-222222222222', 'legal.admin@ilelegal.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "admin"}', false),

-- Content Admin
('33333333-3333-3333-3333-333333333333', 'content.admin@ilelegal.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "admin"}', false),

-- Senior Legal Professional (Seller)
('44444444-4444-4444-4444-444444444444', 'sarah.martinez@lawfirm.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false),

-- Property Law Specialist (Seller)
('55555555-5555-5555-5555-555555555555', 'james.thompson@propertylaw.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false),

-- Corporate Lawyer (Seller)
('66666666-6666-6666-6666-666666666666', 'emily.chen@corplaw.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false),

-- Family Law Attorney (Seller)
('77777777-7777-7777-7777-777777777777', 'michael.okonkwo@familylaw.com', crypt('seller123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "seller"}', false),

-- Real Estate Developer (Buyer)
('88888888-8888-8888-8888-888888888888', 'david.wilson@devco.com', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false),

-- Tech Startup Founder (Buyer)
('99999999-9999-9999-9999-999999999999', 'lisa.johnson@techstartup.com', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false),

-- Small Business Owner (Buyer)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'robert.brown@localbiz.com', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false),

-- Non-Profit Director (Buyer)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'maria.garcia@nonprofit.org', crypt('buyer123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"role": "buyer"}', false)

ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Create comprehensive profiles (using existing schema)
INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    user_type,
    verification_status,
    phone,
    location,
    bio,
    website,
    avatar_url,
    circle_wallet_status,
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
    '+234-555-0001',
    'Lagos, Nigeria',
    'System administrator responsible for platform oversight, user management, and technical operations. Ensuring platform security and optimal performance.',
    'https://ilelegal.com',
    'https://ui-avatars.com/api/?name=System+Administrator&background=1B1828&color=fff&size=200',
    'active',
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
    '+234-555-0002',
    'Abuja, Nigeria',
    'Legal administrator with extensive experience in regulatory compliance, user verification, and legal operations management.',
    NULL,
    'https://ui-avatars.com/api/?name=Funmilayo+Adebayo&background=3B82F6&color=fff&size=200',
    'active',
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
    '+234-555-0003',
    'Port Harcourt, Nigeria',
    'Content administrator responsible for platform content quality, educational resources, and user engagement initiatives.',
    'https://contentblog.com',
    'https://ui-avatars.com/api/?name=Chinedu+Okoro&background=10B981&color=fff&size=200',
    'active',
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
    'Washington, DC, USA',
    'Senior partner with 15+ years specializing in international corporate law, mergers & acquisitions, and regulatory compliance. Fluent in English and Spanish.',
    'https://martinezlaw.com',
    'https://ui-avatars.com/api/?name=Sarah+Martinez&background=8B5CF6&color=fff&size=200',
    'active',
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
    'London, UK',
    'Property law specialist with deep expertise in commercial real estate, land development, and property disputes. Recognized expert in UK property law.',
    'https://thompsonproperty.co.uk',
    'https://ui-avatars.com/api/?name=James+Thompson&background=059669&color=fff&size=200',
    'active',
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
    'San Francisco, CA, USA',
    'Corporate attorney specializing in technology companies, venture capital, and intellectual property. Expert in startup legal strategy and growth-stage transactions.',
    'https://chenlegal.com',
    'https://ui-avatars.com/api/?name=Emily+Chen&background=F59E0B&color=fff&size=200',
    'active',
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
    'Toronto, ON, Canada',
    'Compassionate family law attorney with expertise in divorce, custody, and domestic relations. Committed to protecting families through difficult transitions.',
    'https://okonkwofamily.ca',
    'https://ui-avatars.com/api/?name=Michael+Okonkwo&background=DC2626&color=fff&size=200',
    'active',
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
    'Miami, FL, USA',
    'Real estate developer specializing in luxury residential and mixed-use commercial properties. Leading sustainable development initiatives across the Southeast.',
    'https://wilsondev.com',
    'https://ui-avatars.com/api/?name=David+Wilson&background=1F2937&color=fff&size=200',
    'active',
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
    'Austin, TX, USA',
    'Serial entrepreneur and tech innovator. Currently building AI-powered fintech solutions. Previously exited two startups for $50M+ combined.',
    'https://nexgenfintech.com',
    'https://ui-avatars.com/api/?name=Lisa+Johnson&background=7C3AED&color=fff&size=200',
    'active',
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
    'Chicago, IL, USA',
    'Third-generation family business owner operating a chain of local restaurants and catering services. Expanding into food delivery and franchising.',
    'https://brownsrestaurants.com',
    'https://ui-avatars.com/api/?name=Robert+Brown&background=92400E&color=fff&size=200',
    'active',
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
    'Los Angeles, CA, USA',
    'Executive Director of education-focused non-profit serving underserved communities. Passionate about expanding access to quality education and legal services.',
    'https://educationforall.org',
    'https://ui-avatars.com/api/?name=Maria+Garcia&background=BE185D&color=fff&size=200',
    'active',
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
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    avatar_url = EXCLUDED.avatar_url,
    circle_wallet_status = EXCLUDED.circle_wallet_status,
    updated_at = NOW();

-- Create some sample gigs from buyers (using existing schema)
INSERT INTO gigs (
    id,
    title,
    description,
    price,
    deadline,
    seller_id,
    status,
    created_at
) VALUES 
(
    'gig-001-luxury-development',
    'Legal Review for $50M Luxury Development Project',
    'Seeking experienced property law attorney to review all legal documentation for a 50-story luxury residential tower in downtown Miami. This includes zoning compliance, environmental clearances, construction contracts, and regulatory approvals.',
    25000.00,
    (NOW() + INTERVAL '30 days'),
    '88888888-8888-8888-8888-888888888888',
    'active',
    NOW()
),
(
    'gig-002-ai-fintech-legal',
    'Comprehensive Legal Framework for AI Fintech Startup',
    'Need experienced tech attorney to establish complete legal framework for AI-powered fintech platform. Includes corporate structure, IP strategy, regulatory compliance, privacy policies, and funding documentation.',
    18000.00,
    (NOW() + INTERVAL '45 days'),
    '99999999-9999-9999-9999-999999999999',
    'active',
    NOW()
),
(
    'gig-003-franchise-expansion',
    'Franchise Legal Documentation and Compliance',
    'Expanding restaurant business needs comprehensive franchise legal documentation. Includes franchise disclosure documents, franchise agreements, compliance procedures, and multi-state registration.',
    12000.00,
    (NOW() + INTERVAL '60 days'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active',
    NOW()
),
(
    'gig-004-nonprofit-legal',
    'Legal Structure Review for Educational Non-Profit Expansion',
    'Educational non-profit seeking legal review and optimization of organizational structure for national expansion. Includes governance review, compliance audit, and expansion strategy legal framework.',
    8000.00,
    (NOW() + INTERVAL '40 days'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'active',
    NOW()
)

ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    deadline = EXCLUDED.deadline,
    updated_at = NOW();

-- Add reputation tables first if they don't exist (safe migration)
CREATE TABLE IF NOT EXISTS reputation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reputation_type TEXT NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    successful_completions INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    blockchain_tx_id TEXT,
    last_blockchain_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reputation_type)
);

CREATE TABLE IF NOT EXISTS legal_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_type TEXT NOT NULL,
    credential_name TEXT NOT NULL,
    issuing_authority TEXT NOT NULL,
    jurisdiction TEXT,
    verification_status TEXT DEFAULT 'pending',
    issued_date DATE,
    expiry_date DATE,
    blockchain_tx_id TEXT,
    ipfs_cid TEXT,
    verifier_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- James Thompson (Property Law Specialist)
('55555555-5555-5555-5555-555555555555', 'property_approval', 94.0, 22, 21, 4.8),
('55555555-5555-5555-5555-555555555555', 'legal_review', 89.5, 18, 17, 4.6),

-- Emily Chen (Corporate Lawyer)
('66666666-6666-6666-6666-666666666666', 'legal_review', 91.0, 24, 22, 4.7),

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