import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { 
  StarIcon, 
  ShieldCheckIcon, 
  TrendingUpIcon, 
  ScaleIcon,
  FileTextIcon,
  AwardIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { reputationService, ReputationScore } from '../../services/reputationService';

interface ReputationDisplayProps {
  userId: string;
  showDetailedView?: boolean;
  className?: string;
}

export const ReputationDisplay: React.FC<ReputationDisplayProps> = ({
  userId,
  showDetailedView = true,
  className = ''
}) => {
  const [reputationScore, setReputationScore] = useState<ReputationScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReputation = async () => {
      console.log('🔍 Fetching reputation for userId:', userId);
      
      try {
        setLoading(true);
        setError(null);
        
        if (!userId || userId.trim() === '') {
          throw new Error('No user ID provided');
        }
        
        const score = await reputationService.calculateReputationScore(userId);
        console.log('✅ Reputation score fetched:', score);
        setReputationScore(score);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load reputation';
        setError(errorMsg);
        console.error('❌ Error fetching reputation for userId', userId, ':', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReputation();
    } else {
      console.warn('⚠️ No userId provided to ReputationDisplay');
      setLoading(false);
      setError('No user ID provided');
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !reputationScore) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="p-4 text-center">
          <div className="text-gray-500 text-sm">
            {error || 'Reputation data not available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const level = reputationService.getReputationLevel(reputationScore.overall);

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  const ScoreBar: React.FC<{ score: number; maxScore?: number; label: string; icon: React.ReactNode }> = ({ 
    score, 
    maxScore = 100, 
    label, 
    icon 
  }) => {
    const percentage = Math.min((score / maxScore) * 100, 100);
    
    return (
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {icon}
            {label}
          </div>
          <span className="text-sm font-semibold" style={{ color: level.color }}>
            {formatScore(score)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: level.color
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Main Reputation Score Card */}
      <Card className="border-l-4" style={{ borderLeftColor: level.color }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheckIcon className="w-5 h-5" style={{ color: level.color }} />
                <h3 className="font-semibold text-gray-900">Reputation Score</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold" style={{ color: level.color }}>
                  {formatScore(reputationScore.overall)}
                </span>
                <div>
                  <div className="text-sm font-medium" style={{ color: level.color }}>
                    {level.level}
                  </div>
                  <div className="text-xs text-gray-600">
                    {level.description}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-500 mb-1">
                <StarIcon className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">
                  {formatScore(reputationScore.average_rating)}/5.0
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {reputationScore.total_completions} completions
              </div>
            </div>
          </div>

          {showDetailedView && (
            <div className="space-y-3">
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4" />
                  Specialization Scores
                </h4>
                
                <ScoreBar
                  score={reputationScore.legal_review}
                  label="Legal Review"
                  icon={<ScaleIcon className="w-4 h-4 text-blue-500" />}
                />
                
                <ScoreBar
                  score={reputationScore.property_approval}
                  label="Property Approval"
                  icon={<FileTextIcon className="w-4 h-4 text-green-500" />}
                />
                
                <ScoreBar
                  score={reputationScore.dispute_resolution}
                  label="Dispute Resolution"
                  icon={<AwardIcon className="w-4 h-4 text-purple-500" />}
                />
              </div>

              <div className="border-t pt-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-blue-600">
                      {reputationScore.total_completions}
                    </div>
                    <div className="text-xs text-blue-700">Total Cases</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-600">
                      {formatScore(reputationScore.average_rating)}
                    </div>
                    <div className="text-xs text-green-700">Avg Rating</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-purple-600">
                      {formatScore(reputationScore.overall)}
                    </div>
                    <div className="text-xs text-purple-700">Overall</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <ShieldCheckIcon className="w-3 h-3" />
                    <span>Blockchain verified</span>
                  </div>
                  <button 
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      // TODO: Link to detailed reputation history page
                      console.log('View detailed reputation history');
                    }}
                  >
                    <span>View History</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReputationDisplay;