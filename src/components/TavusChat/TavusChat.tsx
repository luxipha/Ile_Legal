import React, { useEffect, useState } from 'react';
import { MessageCircleIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon } from 'lucide-react';
import { Button } from '../ui/button';

interface TavusChatProps {
  className?: string;
}

// Tavus configuration
const TAVUS_CONFIG = {
  apiKey: import.meta.env.VITE_TAVUS_API_KEY,
  personaId: import.meta.env.VITE_TAVUS_PERSONA_ID,
  baseUrl: 'https://tavusapi.com'
};


// Legal prompts for Ile-Legal
const LEGAL_SYSTEM_PROMPT = `You are an AI legal assistant for Ile-Legal, Nigeria's premier legal marketplace platform. Here's what you should know:

ABOUT ILE-LEGAL:
- Ile-Legal is a comprehensive legal services marketplace connecting clients with verified legal professionals
- We offer services including: Title Verification, Contract Review, Property Survey, Due Diligence, Legal Documentation, Document Notarization, Court Representation, Legal Consultation
- Our platform serves both individuals and businesses across Nigeria
- We have integrated payment systems (Paystack, Circle, MetaMask) and secure document storage via Filecoin/IPFS
- Users can track legal service progress, manage payments, and access their documents securely

YOUR ROLE:
- Help visitors understand our services and how the platform works
- Guide users through account creation and getting started
- Explain our legal service categories and pricing
- Assist with platform navigation and features
- Provide general legal information (but always recommend consulting with our verified lawyers for specific legal advice)
- Help users find the right legal professional for their needs

KEY FEATURES TO HIGHLIGHT:
- Verified legal professionals with ratings and reviews
- Secure payment processing with escrow protection
- Document security via blockchain storage
- Real-time service tracking and communication
- Transparent pricing and service delivery timelines
- 24/7 platform support

TONE: Professional, helpful, and approachable. Always encourage users to sign up and explore our services.`;

export const TavusChat: React.FC<TavusChatProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Cleanup conversation on component unmount
  useEffect(() => {
    return () => {
      if (conversationId) {
        // Cleanup conversation when component unmounts
        fetch(`${TAVUS_CONFIG.baseUrl}/v2/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: { 'x-api-key': TAVUS_CONFIG.apiKey },
        }).catch(console.warn);
      }
    };
  }, [conversationId]);

  const initializeTavusConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Initializing Tavus conversation with config:', {
        apiKey: TAVUS_CONFIG.apiKey ? TAVUS_CONFIG.apiKey.substring(0, 8) + '...' : 'Not configured',
        personaId: TAVUS_CONFIG.personaId,
        baseUrl: TAVUS_CONFIG.baseUrl
      });

      // Try the correct Tavus API endpoint
      const response = await fetch(`${TAVUS_CONFIG.baseUrl}/v2/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': TAVUS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_id: TAVUS_CONFIG.personaId,
          conversation_name: `Ile-Legal Support Chat`,
          properties: {
            max_call_duration: 300, // 5 minutes
            participant_left_timeout: 30,
            enable_recording: false,
            language: 'english'
          },
          custom_greeting: LEGAL_SYSTEM_PROMPT
        }),
      });

      console.log('Tavus API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Tavus API error response:', errorText);
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
      }

      const conversationData = await response.json();
      console.log('Tavus conversation created successfully:', conversationData);

      // Store the conversation details
      setConversationUrl(conversationData.conversation_url);
      setConversationId(conversationData.conversation_id);
      setIsConnected(true);
      
      // Don't open in new window - we'll embed it inline
      console.log('Conversation ready for inline embedding');
      
    } catch (err) {
      console.error('Tavus initialization error:', err);
      
      let errorMessage = 'Failed to connect: Unknown error';
      if (err instanceof Error) {
        if (err.message.includes('maximum concurrent conversations')) {
          errorMessage = 'AI assistant is currently busy. Please try again in a few minutes or contact support.';
        } else {
          errorMessage = `Failed to connect: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual mute/unmute logic
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // Implement actual video toggle logic
  };

  const endConversation = async () => {
    if (conversationId) {
      try {
        // End the conversation via Tavus API
        const response = await fetch(`${TAVUS_CONFIG.baseUrl}/v2/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: {
            'x-api-key': TAVUS_CONFIG.apiKey,
          },
        });

        if (response.ok) {
          console.log('Conversation ended successfully');
        } else {
          console.warn('Failed to end conversation via API');
        }
      } catch (error) {
        console.warn('Error ending conversation:', error);
      }
    }

    // Reset state
    setIsConnected(false);
    setConversationUrl(null);
    setConversationId(null);
    setError(null);
  };

  return (
    <div className={`bg-[#1B1828] rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#FEC85F] rounded-full flex items-center justify-center">
          <MessageCircleIcon className="w-5 h-5 text-[#1B1828]" />
        </div>
        <div>
          <h3 className="text-white font-semibold">AI Legal Assistant</h3>
          <p className="text-gray-400 text-sm">Get instant help with legal questions</p>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-gray-900 rounded-xl mb-4 overflow-hidden">
        {!isConnected ? (
          // Placeholder before connection
          <div className="aspect-[4/3] flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-[#FEC85F] rounded-full flex items-center justify-center mb-4">
              <MessageCircleIcon className="w-8 h-8 text-[#1B1828]" />
            </div>
            <h4 className="text-white font-medium mb-2">Start AI Conversation</h4>
            <p className="text-gray-400 text-sm mb-6">
              Chat with our AI assistant about legal services, platform features, or get help with your account.
            </p>
            
            {error && (
              <div className="text-red-400 text-sm mb-4 p-3 bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={initializeTavusConversation}
              disabled={isLoading}
              className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6 py-2 rounded-lg font-medium"
            >
              {isLoading ? 'Connecting...' : 'Start Video Chat'}
            </Button>
            
          </div>
        ) : (
          // Active conversation - embedded iframe
          <div className="aspect-[4/3] relative">
            {isVideoEnabled && conversationUrl ? (
              <iframe
                src={conversationUrl}
                className="w-full h-full rounded-lg border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)' }}
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FEC85F] rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircleIcon className="w-8 h-8 text-[#1B1828]" />
                  </div>
                  <p className="text-gray-400">Video disabled</p>
                  <Button
                    onClick={() => setIsVideoEnabled(true)}
                    className="mt-2 bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] text-sm px-3 py-1"
                  >
                    Enable Video
                  </Button>
                </div>
              </div>
            )}

            {/* Control overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                onClick={toggleMute}
                size="sm"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full w-10 h-10 p-0"
              >
                {isMuted ? <MicOffIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={toggleVideo}
                size="sm"
                variant={!isVideoEnabled ? "destructive" : "secondary"}
                className="rounded-full w-10 h-10 p-0"
              >
                {isVideoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOffIcon className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={endConversation}
                size="sm"
                variant="destructive"
                className="rounded-full px-4"
              >
                End
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {!isConnected && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs font-medium">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            <button className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
              How does the platform work?
            </button>
            <button className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
              Legal service pricing
            </button>
            <button className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
              Create account help
            </button>
          </div>
        </div>
      )}
    </div>
  );
};