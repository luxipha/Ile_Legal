import React, { useState } from 'react';
import { Copy, Diamond, Gift, Lock, Send, User, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import MenuBar from '../component/MenuBar';
import BottomNavigation from '../component/BottomNavigation';
import WebApp from '@twa-dev/sdk';
import Modal from '../component/Modal';
import Points from '../component/Points';


// Sample data
const friends = [
  { id: 1, name: "Alice Chen", joined: true, joinedDays: 2, avatar: "/placeholder.svg?height=40&width=40" },
  { id: 2, name: "Mark Johnson", joined: false, status: "pending", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 3, name: "Sarah Williams", joined: true, joinedDays: 5, avatar: "/placeholder.svg?height=40&width=40" },
  { id: 4, name: "David Kim", joined: false, status: "inactive", avatar: "/placeholder.svg?height=40&width=40" },
];

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
    progress: 0,
    icon: <Lock className="w-5 h-5" />,
    locked: true,
  },
  {
    id: 4,
    title: "Refer 5 active users",
    description: "Invite friends who become active users",
    reward: "200 tokens",
    progress: 0,
    icon: <Lock className="w-5 h-5" />,
    locked: true,
  },
];

// Type definitions
interface FriendProps {
  friend: {
    id: number;
    name: string;
    joined: boolean;
    joinedDays?: number;
    status?: string;
    avatar: string;
  };
}

interface TaskProps {
  task: {
    id: number;
    title: string;
    description?: string;
    reward: string;
    progress: number;
    icon: React.ReactNode;
    locked: boolean;
  };
}

// Helper Components
const FriendCard = ({ friend }: FriendProps) => {
  return (
    <div className="bg-[#3B2064]/40 p-4 rounded-xl flex items-center justify-between">
      <div className="flex items-center">
        <img
          src={friend.avatar || "/placeholder.svg"}
          alt={friend.name}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-medium">{friend.name}</h3>
          {friend.joined ? (
            <div className="flex items-center text-xs text-green-400">
              <User className="w-3 h-3 mr-1" />
              Joined · {friend.joinedDays} days ago
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
      {friend.joined ? (
        <div className="bg-green-900/30 text-green-400 py-1 px-3 rounded-full text-sm font-medium border border-green-700/30 flex items-center">
          +50 <Diamond className="w-3 h-3 ml-1 fill-green-400" />
        </div>
      ) : friend.status === "pending" ? (
        <button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-1 px-3 rounded-full text-sm font-medium transition-colors">
          Remind
        </button>
      ) : null}
    </div>
  );
};

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

      {task.progress > 0 && (
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
        <button className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-medium transition-all flex items-center justify-center">
          <Zap className="w-4 h-4 mr-2" />
          Continue Task
        </button>
      )}
    </div>
  );
};

const Task: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"referral" | "tasks">("referral");
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const referralCode = "FRIEND150";

  const handleRedeemClick = () => {
    WebApp.showPopup({
      message: "Redeem feature coming soon!"
    });
  };

  const handleRemindClick = (friendName: string) => {
    WebApp.showPopup({
      message: `Reminder sent to ${friendName}!`
    });
  };

  const handleContinueTask = (taskId: number) => {
    WebApp.showPopup({
      message: "Task feature coming soon!"
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      WebApp.showPopup({
        message: "Referral code copied!"
      });
    } catch (err) {
      WebApp.showPopup({
        message: "Failed to copy code"
      });
    }
  };

  // Update FriendCard to use handleRemindClick
  const FriendCard = ({ friend }: FriendProps) => {
    return (
      <div className="bg-[#3B2064]/40 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={friend.avatar || "/placeholder.svg"}
            alt={friend.name}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <h3 className="font-medium">{friend.name}</h3>
            {friend.joined ? (
              <div className="flex items-center text-xs text-green-400">
                <User className="w-3 h-3 mr-1" />
                Joined · {friend.joinedDays} days ago
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
        {friend.joined ? (
          <div className="bg-green-900/30 text-green-400 py-1 px-3 rounded-full text-sm font-medium border border-green-700/30 flex items-center">
            +50 <Diamond className="w-3 h-3 ml-1 fill-green-400" />
          </div>
        ) : friend.status === "pending" ? (
          <button 
            onClick={() => handleRemindClick(friend.name)}
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

        {task.progress > 0 && (
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

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#170F34] text-[#ECF3F7] font-sans">
      <MenuBar />
      
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
                <span className="text-2xl sm:text-4xl font-bold mr-2">150</span>
                <Points showValue={false} size="lg" />
              </div>
            </div>
            <div>
              <button 
                onClick={handleRedeemClick}
                className="bg-[#FDD15F] hover:bg-[#FDD15F]/80 transition-colors py-2 px-4 rounded-xl flex items-center text-sm text-[#170F34] font-medium"
              >
                <Gift className="w-4 h-4 mr-2" />
                Redeem
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
                      Invite friends and earn <span className="text-[#FDD15F]">50</span> <Diamond className="w-3 h-3 inline fill-[#FDD15F]" /> for each friend who joins!
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
                
                <div className="space-y-3 mt-6">
                  {friends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
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
        </div>
      </div>

      {/* Replace the existing Referral Modal with the reusable Modal component */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h3 className="text-xl font-bold mb-4">Share with friends</h3>
        <p className="text-[#ECF3F7]/70 mb-6">
          Share your referral code with friends and earn rewards when they join!
        </p>
        
        <div className="bg-[#170F34]/40 border border-[#ECF3F7]/20 rounded-xl p-4 flex items-center justify-between mb-6">
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
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <button
          className="w-full py-3 bg-[#FDD15F] hover:bg-[#FDD15F]/80 text-[#170F34] rounded-xl font-medium transition-all"
          onClick={() => setShowModal(false)}
        >
          Done
        </button>
      </Modal>

      <BottomNavigation />
    </div>
  );
};

export default Task;