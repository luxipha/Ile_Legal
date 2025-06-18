// components/messaging/ConversationSearch.tsx
import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';

interface ConversationSearchProps {
  conversations: any[];
  onResultSelect: (conversation: any) => void;
  placeholder?: string;
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
  conversations,
  onResultSelect,
  placeholder = 'Search conversations...'
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter conversations based on search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = conversations.filter(conversation => {
      const nameMatch = conversation.participantName?.toLowerCase().includes(searchLower);
      const messageMatch = conversation.lastMessage?.toLowerCase().includes(searchLower);
      const gigMatch = conversation.gigTitle?.toLowerCase().includes(searchLower);
      
      return nameMatch || messageMatch || gigMatch;
    });

    setResults(filtered);
  }, [query, conversations]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleResultClick = (conversation: any) => {
    onResultSelect(conversation);
    setQuery('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleResultClick(conversation)}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={conversation.participantAvatar}
                  alt={conversation.participantName}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participantName)}&background=random`;
                  }}
                />
                <div>
                  <div className="font-medium text-sm">{conversation.participantName}</div>
                  {conversation.gigTitle && (
                    <div className="text-xs text-blue-600">📋 {conversation.gigTitle}</div>
                  )}
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                    {conversation.lastMessage}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-3 text-center text-gray-500 text-sm">
          No conversations found
        </div>
      )}
    </div>
  );
};
