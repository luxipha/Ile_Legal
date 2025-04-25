import React, { useState, useEffect, useContext } from 'react';
import { Copy, Diamond, Gift, Lock, Send, User, Users, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MenuBar from '../component/MenuBar';
import BottomNavigation from '../component/BottomNavigation';
import WebApp from '@twa-dev/sdk';
import Modal from '../component/Modal';
import Points from '../component/Points';
import api from '../api/api';
import { Referral } from '../api/api';
import { UserContext } from '../App';

// Sample data for tasks (we'll implement this in the future)
const tasks = [
  {
    id: 1,
    title: "Send invites to 3 friends to join the platform",
    reward: "50 tokens",
    progress: 33,
    icon: <Send className="w-5 h-5" />,
    locked: false,
  },
  {
    id: 2,
    title: "Complete your first transaction",
    description: "Make your first transaction of any amount",
    reward: "75 tokens",
    progress: 50,
    icon: <Diamond className="w-5 h-5" />,
    locked: false,
  },
  {
    id: 3,
    title: "Enable notifications",
    description: "Turn on push notifications for important updates",
    reward: "25 tokens",
    icon: <Lock className="w-5 h-5" />,
    locked: true,
  },
  {
    id: 4,
    title: "Refer 5 active users",
    description: "Invite friends who become active users",
    reward: "200 tokens",
    progress: 0,
    icon: <Users className="w-5 h-5" />,
    locked: false,
  },
];

// Type definitions
interface FriendProps {
  friend: Referral;
}

interface TaskProps {
  task: {
    id: number;
    title: string;
    description?: string;
    reward: string;
    progress?: number;
    icon: React.ReactNode;
    locked: boolean;
  }
}

const Task: React.FC = () => {
  const { user, setUser } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState<"referral" | "tasks">("referral");
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [bricks, setBricks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [nextRedeemTime, setNextRedeemTime] = useState<Date | null>(null);
  const [accumulatedPoints, setAccumulatedPoints] = useState(0);
  const [lastRedeemTime, setLastRedeemTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  // Calculate time remaining until next redeem
  const timeRemaining = nextRedeemTime 
    ? Math.max(0, (nextRedeemTime.getTime() - Date.now()) / 1000) 
    : 0;
    
  // Calculate accumulated points (0.1 per hour, up to 2.4 in 24 hours)
  useEffect(() => {
    const updateAccumulatedPoints = () => {
      if (!lastRedeemTime) return;
      
      const now = new Date();
      const hoursSinceLastRedeem = (now.getTime() - lastRedeemTime.getTime()) / (1000 * 60 * 60);
      const points = Math.min(2.4, Math.floor(hoursSinceLastRedeem * 10) / 10); // 0.1 per hour, max 2.4
      setAccumulatedPoints(points);
    };
    
    // Update immediately
    updateAccumulatedPoints();
    
    // Then update every minute
    const interval = setInterval(updateAccumulatedPoints, 60 * 1000);
    return () => clearInterval(interval);
  }, [lastRedeemTime]);

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user?.telegramChatId) return;
      
      try {
        setLoading(true);
        const response = await api.rewards.getReferralInfo(user.telegramChatId);
        
        if (response.data.success) {
          setReferralCode(response.data.data.referralCode);
          setBricks(response.data.data.bricks);
          setReferrals(response.data.data.referrals);
          
          // Set last redeem time if available
          if (response.data.data.lastRedeemTime) {
            setLastRedeemTime(new Date(response.data.data.lastRedeemTime));
          } else {
            // If no last redeem time, set to 24 hours ago to show full points
            setLastRedeemTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
          }
          
          // Generate and set the referral link
          const telegramGroupUrl = "https://t.me/ileplatfromchat";
          const fullReferralLink = `${telegramGroupUrl}?ref=${response.data.data.referralCode}`;
          setReferralLink(fullReferralLink);
          
          console.log("Referral link set:", fullReferralLink);
        }
      } catch (err) {
        console.error('Error fetching referral data:', err);
        setError('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferralData();
  }, [user?.telegramChatId]);

  const handleRedeemClick = async () => {
    if (!user?.telegramChatId || accumulatedPoints < 2.4 || isRedeeming) return;
    
    try {
      setIsRedeeming(true);
      const response = await api.rewards.redeemBricks(user.telegramChatId);
      
      if (response.data.success) {
        // Show success animation
        const { bricksAwarded, totalBricks, currentStreak } = response.data.data;
        
        // Set reward amount for animation
        setRewardAmount(bricksAwarded);
        setShowRewardAnimation(true);
        
        // Hide animation after 2 seconds
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 2000);
        
        // Update state with new values
        setBricks(0); // Reset bricks to 0 in the task display
        setStreak(currentStreak);
        setAccumulatedPoints(0); // Reset accumulated points
        setLastRedeemTime(new Date()); // Update last redeem time
        
        // Update user context with new brick balance
        if (user) {
          const updatedUser = {
            ...user,
            bricks: {
              ...user.bricks,
              total: totalBricks,
              lastRedeemTime: new Date()
            }
          };
          setUser(updatedUser);
          
          // Also update localStorage to persist the changes
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Show success message - using try/catch to handle potential WebApp API issues
        try {
          WebApp.showAlert(`You earned ${bricksAwarded} bricks!`);
        } catch (alertErr) {
          console.log(`Notification: You earned ${bricksAwarded} bricks!`);
        }
      }
    } catch (err: any) {
      console.error('Error redeeming bricks:', err);
      
      // Check if there's a next redeem time in the error response
      if (err.response?.data?.nextRedeemTime) {
        setNextRedeemTime(new Date(err.response.data.nextRedeemTime));
      }
      
      // Use try/catch to handle potential WebApp API issues
      try {
        WebApp.showAlert(err.response?.data?.message || 'Failed to redeem bricks');
      } catch (alertErr) {
        console.log(`Error: ${err.response?.data?.message || 'Failed to redeem bricks'}`);
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRemindClick = async (friend: Referral) => {
    if (!user?.telegramChatId) return;
    
    try {
      const response = await api.rewards.remindReferral({
        telegramChatId: user.telegramChatId,
        referralEmail: friend.email
      });
      
      if (response.data.success) {
        WebApp.showAlert(`Reminder sent to ${friend.name}!`);
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
      WebApp.showAlert('Failed to send reminder');
    }
  };

  const handleContinueTask = (taskId: number) => {
    WebApp.showAlert("Task feature coming soon!");
  };

  const copyToClipboard = async () => {
    try {
      // Copy the referral link instead of just the code
      await navigator.clipboard.writeText(referralLink || `https://t.me/ileplatfromchat?ref=${referralCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      WebApp.showAlert("Referral link copied!");
    } catch (err) {
      WebApp.showAlert("Failed to copy link");
    }
  };

  // Helper Components
  const FriendCard = ({ friend }: FriendProps) => {
    return (
      <div className="bg-[#3B2064]/40 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full mr-3 bg-[#170F34] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium">{friend.name}</h3>
            {friend.status === 'joined' ? (
              <div className="flex items-center text-xs text-green-400">
                <User className="w-3 h-3 mr-1" />
                Joined · {friend.joinedAt ? new Date(friend.joinedAt as any).toLocaleDateString() : 'Recently'}
              </div>
            ) : (
              <div
                className={`flex items-center text-xs ${friend.status === "pending" ? "text-yellow-400" : "text-gray-400"}`}
              >
                {friend.status === "pending" ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1 animate-pulse"></div>
                    Pending
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-400 mr-1"></div>
                    Inactive
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {friend.status === 'joined' ? (
          <div className="bg-green-900/30 text-green-400 py-1 px-3 rounded-full text-sm font-medium border border-green-700/30 flex items-center">
            +{friend.bricksEarned} <Diamond className="w-3 h-3 ml-1 fill-green-400" />
          </div>
        ) : friend.status === "pending" ? (
          <button 
            onClick={() => handleRemindClick(friend)}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-1 px-3 rounded-full text-sm font-medium transition-colors"
          >
            Remind
          </button>
        ) : null}
      </div>
    );
  };

  // Update TaskCard to use handleContinueTask
  const TaskCard = ({ task }: TaskProps) => {
    return (
      <div className="bg-[#3B2064]/40 p-5 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-3 rounded-xl bg-[#3B2064]">{task.icon}</div>
          <div className="flex-1">
            <h3 className="font-medium text-lg">{task.title}</h3>
            {task.description && <p className="text-sm text-gray-300">{task.description}</p>}
          </div>
          <div className="flex items-center text-yellow-400">
            {task.reward.split(" ")[0]} <Diamond className="w-3 h-3 ml-1 fill-yellow-400" />
          </div>
        </div>

        {task.progress !== undefined && task.progress > 0 && (
          <>
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <div className="h-2 bg-[#2D1854] rounded-full mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full"
              />
            </div>
          </>
        )}

        {!task.locked && (
          <button 
            onClick={() => handleContinueTask(task.id)}
            className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-medium transition-all flex items-center justify-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Continue Task
          </button>
        )}
      </div>
    );
  };

  // Get redeem button text based on state
  const getRedeemButtonText = () => {
    if (isRedeeming) return "Redeeming...";
    if (accumulatedPoints < 2.4) return `${(2.4 - accumulatedPoints).toFixed(1)} pts needed`;
    return "Redeem";
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#170F34] text-[#ECF3F7] font-sans">
      <MenuBar />
      
      {/* Subtle reward animation that appears near the top right */}
      <AnimatePresence>
        {showRewardAnimation && (
          <motion.div 
            className="fixed top-16 right-4 z-[100] pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 1.2 }}
          >
            <div className="flex items-center gap-1 text-[#FDD15F]">
              <span className="text-sm">+{rewardAmount}</span>
              <div className="w-4 h-4 bg-[#FDD15F] rounded-sm flex items-center justify-center transform rotate-12">
                <div className="w-2 h-2 bg-[#FDD15F]/50 rounded-sm"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="px-4 pb-20">
        {/* Header */}
        <div className="mb-6 pt-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Rewards Center</h1>
          <p className="text-[#ECF3F7]/70 text-sm sm:text-base">Complete tasks and invite friends to earn tokens</p>
        </div>

        {/* Balance Card */}
        <div className="bg-[#170F34]/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 mb-6 border border-[#ECF3F7]/30">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#ECF3F7]/70 text-sm mb-1">Your balance</p>
              <div className="flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={accumulatedPoints}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl sm:text-4xl font-bold mr-2"
                  >
                    {accumulatedPoints.toFixed(1)}
                  </motion.span>
                </AnimatePresence>
                <Points showValue={false} size="lg" />
              </div>
              {streak > 0 && (
                <div className="text-xs text-[#FDD15F] mt-1">
                  🔥 {streak} day streak
                </div>
              )}
            </div>
            <div className="flex flex-col items-end">
              <div className="w-28 bg-gray-800 rounded-full h-2 mb-3">
                <div 
                  className="bg-[#FDD15F] h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (accumulatedPoints / 2.4) * 100)}%` }}
                ></div>
              </div>
              <button 
                onClick={handleRedeemClick}
                disabled={accumulatedPoints < 2.4 || isRedeeming}
                className={`py-2 px-4 rounded-xl flex items-center text-sm font-medium transition-colors ${
                  accumulatedPoints < 2.4 || isRedeeming
                    ? "bg-[#FDD15F]/50 text-[#170F34]/70 cursor-not-allowed"
                    : "bg-[#FDD15F] hover:bg-[#FDD15F]/80 text-[#170F34]"
                }`}
              >
                <Gift className="w-4 h-4 mr-2" />
                {getRedeemButtonText()}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#170F34]/30 backdrop-blur-md rounded-2xl p-1 mb-6 border border-[#ECF3F7]/10 flex">
          <button
            onClick={() => setActiveTab("referral")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === "referral"
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            Referrals
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === "tasks"
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            Tasks
          </button>
        </div>

        {/* Content container with max width */}
        <div className="max-w-md mx-auto">
          {/* Content based on active tab */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "referral" ? (
                <div>
                  <div className="flex mb-4">
                    <div className="bg-[#170F34]/60 p-3 rounded-xl mr-3 self-start mt-1">
                      <Users className="w-5 h-5 text-[#ECF3F7]" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold mb-1">Friend Referrals</h2>
                      <p className="text-[#ECF3F7]/70 text-sm leading-tight">
                        Invite friends and earn <span className="text-[#FDD15F]">5</span> <Diamond className="w-3 h-3 inline fill-[#FDD15F]" /> for each friend who joins!
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-3 bg-[#FDD15F] hover:bg-[#FDD15F]/80 text-[#170F34] rounded-xl font-medium transition-all flex items-center justify-center mb-6"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Invite Friends
                  </button>
                  
                  {loading ? (
                    <div className="text-center py-10">
                      <div className="inline-block w-6 h-6 border-2 border-[#FDD15F] border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm text-[#ECF3F7]/70">Loading referrals...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-10">
                      <p className="text-red-400">{error}</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm text-[#FDD15F] underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : referrals.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[#ECF3F7]/70">You haven't referred anyone yet</p>
                      <p className="mt-1 text-sm">Invite friends to earn rewards!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-6">
                      {referrals.map((friend, index) => (
                        <FriendCard key={index} friend={friend} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex mb-4">
                    <div className="bg-[#170F34]/60 p-3 rounded-xl mr-3 self-start mt-1">
                      <Gift className="w-5 h-5 text-[#ECF3F7]" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold mb-1">Tasks</h2>
                      <p className="text-[#ECF3F7]/70 text-sm leading-tight">
                        Complete tasks to earn tokens and unlock more rewards!
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    {tasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Referral Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h3 className="text-xl font-bold mb-4">Share with friends</h3>
        <p className="text-[#ECF3F7]/70 mb-6">
          Share your referral link with friends and earn rewards when they join our Telegram group!
        </p>
        
        <div className="bg-[#170F34]/40 border border-[#ECF3F7]/20 rounded-xl p-4 flex flex-col mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#ECF3F7]/50 mb-1">Your referral code</p>
              <p className="text-lg font-mono font-bold text-[#FDD15F]">{referralCode}</p>
            </div>
            <button 
              onClick={copyToClipboard}
              className="p-2 rounded-lg bg-[#170F34]/60 hover:bg-[#170F34] transition-colors"
            >
              {copied ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-green-400"
                >
                  ✓
                </motion.div>
              ) : (
                <Copy className="w-5 h-5 text-[#ECF3F7]/70" />
              )}
            </button>
          </div>
          
          <div className="text-xs text-[#ECF3F7]/50 mb-1">Referral link</div>
          <div className="bg-[#170F34] p-2 rounded-lg text-sm font-mono text-[#ECF3F7]/70 break-all mb-2 overflow-x-auto">
            {referralLink || `https://t.me/ileplatfromchat?ref=${referralCode}`}
          </div>
          <p className="text-xs text-[#ECF3F7]/50">
            This link will direct your friends to our Telegram group with your referral code attached.
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(false)}
          className="w-full py-3 bg-[#FDD15F] text-[#170F34] rounded-xl font-medium"
        >
          Done
        </button>
      </Modal>

      <BottomNavigation />
    </div>
  );
};

export default Task;