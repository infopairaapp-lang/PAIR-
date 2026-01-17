
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_CONVERSATIONS } from '../constants';
import { Conversation } from '../types';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const syncConversations = () => {
    const localConvs = JSON.parse(localStorage.getItem('paira_conversations') || '[]');
    // Deduplicate and merge by ID
    const merged = [...localConvs, ...MOCK_CONVERSATIONS].reduce((acc: Conversation[], curr: Conversation) => {
      const existing = acc.find(c => c.id === curr.id);
      if (!existing) {
        acc.push(curr);
      } else if (localConvs.some((lc: any) => lc.id === curr.id)) {
        // If it's a local conv, it might have newer messages than mock
        return acc.map(c => c.id === curr.id ? curr : c);
      }
      return acc;
    }, []);
    
    // Sort by timestamp if possible (simulated latest first)
    setConversations(merged);
  };

  useEffect(() => {
    syncConversations();

    // 1. Real-time sync via Storage Events (cross-tab)
    window.addEventListener('storage', syncConversations);

    // 2. Real-time polling simulation for "Incoming" activity
    const interval = setInterval(syncConversations, 3000);

    return () => {
      window.removeEventListener('storage', syncConversations);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="serif text-3xl font-bold text-maroon">Messages</h1>
          <p className="text-slate-500 text-sm">Real-time sync enabled • {conversations.length} active threads</p>
        </div>
        <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center relative">
          <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
        <div className="divide-y divide-gray-50">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <Link 
                key={conv.id} 
                to={`/chat/${conv.id}`}
                className="flex items-center gap-4 p-6 hover:bg-ivory transition-colors group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30">
                    <img src={conv.participant.imageUrl} alt={conv.participant.name} className="w-full h-full object-cover" />
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-maroon text-white text-[8px] flex items-center justify-center font-bold rounded-full border-2 border-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="serif text-lg font-bold text-maroon group-hover:text-red-900 truncate">{conv.participant.name}</h3>
                      {conv.participant.isVerified && (
                        <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{conv.timestamp}</span>
                  </div>
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-ivory rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">No conversations yet.</p>
              <Link to="/discover" className="text-maroon font-bold text-sm mt-2 inline-block hover:underline">Find your match in Discover</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
