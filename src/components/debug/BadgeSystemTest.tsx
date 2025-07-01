import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { BadgeCollection } from '../badges';
import { reputationService } from '../../services/reputationService';
import { useAuth } from '../../contexts/AuthContext';
import { EarnedBadge } from '../badges';

/**
 * Debug component to test badge system functionality
 * Add this component temporarily to any page to test badges
 */
export const BadgeSystemTest: React.FC = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [currentTier, setCurrentTier] = useState<EarnedBadge | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const testBadgeSystem = async () => {
    if (!user?.id) {
      setStatus('❌ No user logged in');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔄 Testing badge system...');

      // Test 1: Get user badges
      const badgeData = await reputationService.getUserBadges(user.id);
      setBadges(badgeData.earned);
      setCurrentTier(badgeData.currentTier);

      // Test 2: Get reputation score  
      const reputationScore = await reputationService.calculateReputationScore(user.id);
      
      setStatus(`✅ Badge system working! Found ${badgeData.earned.length} badges. Reputation: ${reputationScore.overall}`);
    } catch (error) {
      console.error('Badge system test error:', error);
      setStatus(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const awardTestBadge = async () => {
    if (!user?.id) {
      setStatus('❌ No user logged in');
      return;
    }

    try {
      setLoading(true);
      setStatus('🎖️ Awarding test badge...');

      // Award a novice badge for testing
      const result = await reputationService.awardBadge(
        user.id, 
        'tier_novice', 
        'novice', 
        { test: true, timestamp: new Date().toISOString() }
      );

      if (result) {
        setStatus('✅ Test badge awarded successfully!');
        // Refresh badges
        await testBadgeSystem();
      } else {
        setStatus('❌ Failed to award test badge');
      }
    } catch (error) {
      console.error('Award badge error:', error);
      setStatus(`❌ Award error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateBadges = async () => {
    if (!user?.id) {
      setStatus('❌ No user logged in');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔄 Updating badges based on current reputation...');

      await reputationService.updateUserBadges(user.id);
      
      // Refresh badges
      const badgeData = await reputationService.getUserBadges(user.id);
      setBadges(badgeData.earned);
      setCurrentTier(badgeData.currentTier);

      setStatus(`✅ Badges updated! Now have ${badgeData.earned.length} badges.`);
    } catch (error) {
      console.error('Update badges error:', error);
      setStatus(`❌ Update error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      testBadgeSystem();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">🎖️ Badge System Test</h3>
          <p className="text-red-600">Please log in to test the badge system.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">🎖️ Badge System Test</h3>
        
        <div className="space-y-4">
          {/* Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono">{status}</p>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={testBadgeSystem} 
              disabled={loading}
              variant="outline"
            >
              {loading ? '🔄' : '🔍'} Test Badge System
            </Button>
            
            <Button 
              onClick={awardTestBadge} 
              disabled={loading}
              variant="outline"
            >
              {loading ? '🔄' : '🎖️'} Award Test Badge
            </Button>
            
            <Button 
              onClick={updateBadges} 
              disabled={loading}
              variant="outline"
            >
              {loading ? '🔄' : '📊'} Update Badges
            </Button>
          </div>

          {/* Current Tier Badge */}
          {currentTier && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Current Tier Badge:</h4>
              <div className="flex items-center gap-3">
                <BadgeCollection 
                  badges={[currentTier]} 
                  maxVisible={1} 
                  size="md" 
                />
                <div>
                  <div className="font-medium">{currentTier.name}</div>
                  <div className="text-sm text-gray-600">{currentTier.description}</div>
                  <div className="text-xs text-gray-500">
                    Earned: {new Date(currentTier.earnedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Badges */}
          {badges.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">All Badges ({badges.length}):</h4>
              <BadgeCollection 
                badges={badges} 
                maxVisible={8} 
                size="sm" 
                className="justify-start"
              />
              
              {/* Badge Details */}
              <div className="mt-3 space-y-1">
                {badges.map((badge, index) => (
                  <div key={badge.id} className="text-xs text-gray-600 flex justify-between">
                    <span>{badge.name} ({badge.type})</span>
                    <span className="text-gray-400">{badge.rarity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Badges */}
          {badges.length === 0 && !loading && (
            <div className="border border-dashed rounded-lg p-4 text-center text-gray-500">
              No badges found. Try awarding a test badge or updating badges based on your reputation.
            </div>
          )}

          {/* Debug Info */}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify({ 
                userId: user.id, 
                badgeCount: badges.length,
                currentTier: currentTier?.name || 'None',
                badges: badges.map(b => ({ id: b.id, name: b.name, type: b.type }))
              }, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};

export default BadgeSystemTest;