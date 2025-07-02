import React from 'react';
import {
  NoviceBadge,
  CompetentBadge,
  ProficientBadge,
  ExpertBadge,
  MasterBadge
} from './icons/ReputationBadges';
import {
  FirstGigBadge,
  FiveGigsBadge,
  TenGigsBadge,
  TwentyFiveGigsBadge,
  FiftyGigsBadge,
  HundredGigsBadge
} from './icons/AchievementBadges';
import {
  FiveStarStreakBadge,
  ClientFavoriteBadge,
  QuickResponderBadge,
  PerfectionistBadge
} from './icons/QualityBadges';
import {
  IdentityVerifiedBadge,
  ProfessionalCredentialsBadge,
  BarLicenseVerifiedBadge
} from './icons/VerificationBadges';
import {
  LoyaltyActiveBadge,
  LoyaltyMilestoneBadge,
  LoyaltyStreakBadge,
  LoyaltyEngagementBadge
} from './icons/LoyaltyBadges';

export interface EarnedBadge {
  id: string;
  type: 'reputation' | 'achievement' | 'quality' | 'verification' | 'loyalty';
  name: string;
  description: string;
  earnedDate: string;
  tier?: 'novice' | 'competent' | 'proficient' | 'expert' | 'master';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BadgeProps {
  badge: EarnedBadge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  badge, 
  size = 'md', 
  showTooltip = true,
  className = ""
}) => {
  console.log('Badge render:', badge.id, badge.type, badge.name);
  
  const getBadgeComponent = () => {
    // Reputation Tier Badges
    if (badge.type === 'reputation' && badge.tier) {
      switch (badge.tier) {
        case 'novice': return <NoviceBadge size={size} className={className} />;
        case 'competent': return <CompetentBadge size={size} className={className} />;
        case 'proficient': return <ProficientBadge size={size} className={className} />;
        case 'expert': return <ExpertBadge size={size} className={className} />;
        case 'master': return <MasterBadge size={size} className={className} />;
      }
    }
    
    // Achievement Badges
    if (badge.type === 'achievement') {
      switch (badge.id) {
        case 'first_gig': return <FirstGigBadge size={size} className={className} />;
        case 'five_gigs': return <FiveGigsBadge size={size} className={className} />;
        case 'ten_gigs': return <TenGigsBadge size={size} className={className} />;
        case 'twenty_five_gigs': return <TwentyFiveGigsBadge size={size} className={className} />;
        case 'fifty_gigs': return <FiftyGigsBadge size={size} className={className} />;
        case 'hundred_gigs': return <HundredGigsBadge size={size} className={className} />;
      }
    }
    
    // Quality Badges
    if (badge.type === 'quality') {
      switch (badge.id) {
        case 'five_star_streak': return <FiveStarStreakBadge size={size} className={className} />;
        case 'client_favorite': return <ClientFavoriteBadge size={size} className={className} />;
        case 'quick_responder': return <QuickResponderBadge size={size} className={className} />;
        case 'perfectionist': return <PerfectionistBadge size={size} className={className} />;
      }
    }
    
    // Verification Badges
    if (badge.type === 'verification') {
      switch (badge.id) {
        case 'identity_verified': return <IdentityVerifiedBadge size={size} className={className} />;
        case 'professional_credentials': return <ProfessionalCredentialsBadge size={size} className={className} />;
        case 'bar_license_verified': return <BarLicenseVerifiedBadge size={size} className={className} />;
      }
    }
    
    // Loyalty Badges
    if (badge.type === 'loyalty') {
      switch (badge.id) {
        case 'loyalty_active': return <LoyaltyActiveBadge size={size} className={className} />;
        case 'loyalty_milestone': return <LoyaltyMilestoneBadge size={size} className={className} />;
        case 'loyalty_streak': return <LoyaltyStreakBadge size={size} className={className} />;
        case 'loyalty_engagement': return <LoyaltyEngagementBadge size={size} className={className} />;
      }
    }
    
    // Default fallback
    return <NoviceBadge size={size} className={className} />;
  };

  const badgeElement = (
    <div className="relative inline-block group">
      {getBadgeComponent()}
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          <div className="font-semibold">{badge.name}</div>
          <div className="text-gray-300">{badge.description}</div>
          <div className="text-gray-400">Earned: {new Date(badge.earnedDate).toLocaleDateString()}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );

  return badgeElement;
};

export default Badge;