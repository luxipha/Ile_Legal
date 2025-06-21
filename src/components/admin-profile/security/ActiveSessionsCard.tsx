import { useState, useEffect } from "react";
import { LockIcon, SmartphoneIcon, LogOutIcon, MonitorIcon, RefreshCwIcon, AlertTriangleIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { SessionService, UserSession } from "../../../services/sessionService";

export const ActiveSessionsCard = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionData = await SessionService.getActiveSessions();
      setSessions(sessionData);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      setTerminatingSessionId(sessionId);
      setError(null);
      
      await SessionService.terminateSession(sessionId);
      
      // Reload sessions to reflect changes
      await loadSessions();
      
    } catch (error: any) {
      console.error('Error terminating session:', error);
      setError(error.message || 'Failed to terminate session');
    } finally {
      setTerminatingSessionId(null);
    }
  };

  const handleTerminateAllOther = async () => {
    try {
      setError(null);
      await SessionService.terminateAllOtherSessions();
      await loadSessions();
    } catch (error: any) {
      console.error('Error terminating all sessions:', error);
      setError(error.message || 'Failed to terminate other sessions');
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('ios') || info.includes('android')) {
      return SmartphoneIcon;
    }
    return MonitorIcon;
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Active Sessions</h3>
              <p className="text-gray-600">Loading your active sessions...</p>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Active Sessions</h3>
              <p className="text-gray-600">Manage your active sessions across devices</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {sessions.filter(s => !s.is_current).length > 0 && (
              <Button
                onClick={handleTerminateAllOther}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangleIcon className="w-4 h-4 mr-1" />
                Terminate All Others
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <LockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No active sessions found</p>
            <p className="text-sm mt-1">Your sessions will appear here when you're logged in</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.device_info);
              const isTerminating = terminatingSessionId === session.id;
              
              return (
                <div 
                  key={session.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    session.is_current 
                      ? 'bg-blue-50 border-blue-100' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.is_current 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      <DeviceIcon className={`w-5 h-5 ${
                        session.is_current 
                          ? 'text-blue-600' 
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium">
                        {session.is_current ? 'Current Session' : 'Session'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.device_info} • {session.location || 'Unknown location'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.is_current 
                          ? `Started ${SessionService.getRelativeTime(session.created_at)}`
                          : `Last active ${SessionService.getRelativeTime(session.last_active)}`
                        }
                      </div>
                    </div>
                  </div>
                  
                  {session.is_current ? (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      Current
                    </span>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTerminateSession(session.id)}
                      disabled={isTerminating}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <LogOutIcon className="w-4 h-4 mr-1" />
                      {isTerminating ? 'Terminating...' : 'Terminate'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
