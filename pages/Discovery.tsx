
import React, { useState, useEffect, useMemo } from 'react';
import ProfileCard from '../components/ProfileCard';
import { MOCK_PROFILES } from '../constants';
import { getMatchCompatibility } from '../services/gemini';
import { UserProfile } from '../types';

type SortOption = 'default' | 'age-asc' | 'age-desc';

const Discovery: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compatibility, setCompatibility] = useState<string>('');
  const [loadingComp, setLoadingComp] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  
  // Actual User Profile
  const currentUser = useMemo(() => {
    const saved = localStorage.getItem('paira_user_profile');
    return saved ? JSON.parse(saved) : MOCK_PROFILES[0];
  }, []);

  // Premium Logic
  const [actionCount, setActionCount] = useState(() => parseInt(localStorage.getItem('paira_action_count') || '0'));
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const sortedProfiles = useMemo(() => {
    const profiles = [...MOCK_PROFILES];
    if (sortBy === 'age-asc') return profiles.sort((a, b) => a.age - b.age);
    if (sortBy === 'age-desc') return profiles.sort((a, b) => b.age - a.age);
    return profiles;
  }, [sortBy]);

  const currentProfile = sortedProfiles[currentIndex];

  useEffect(() => {
    if (currentProfile) {
      setLoadingComp(true);
      getMatchCompatibility(currentUser, currentProfile).then(res => {
        setCompatibility(res);
        setLoadingComp(false);
      }).catch(() => {
        setCompatibility("Our matchmaker is taking a short break. Insights will return soon.");
        setLoadingComp(false);
      });
    }
  }, [currentProfile, currentUser]);

  const incrementActions = () => {
    const nextCount = actionCount + 1;
    setActionCount(nextCount);
    localStorage.setItem('paira_action_count', nextCount.toString());
    if (nextCount === 10) {
      setShowPremiumModal(true);
    }
  };

  const handleNext = () => {
    incrementActions();
    setCurrentIndex((prev) => (prev + 1) % sortedProfiles.length);
  };

  const confirmConnection = () => {
    incrementActions();
    if (!pendingProfile) return;
    const existing = JSON.parse(localStorage.getItem('paira_connections') || '[]');
    if (!existing.find((p: UserProfile) => p.id === pendingProfile.id)) {
      localStorage.setItem('paira_connections', JSON.stringify([...existing, pendingProfile]));
      const convs = JSON.parse(localStorage.getItem('paira_conversations') || '[]');
      localStorage.setItem('paira_conversations', JSON.stringify([...convs, {
        id: `local-${pendingProfile.id}`,
        participant: pendingProfile,
        lastMessage: 'A new path has been initiated.',
        timestamp: 'Just now',
        unreadCount: 0,
        messages: []
      }]));
      window.dispatchEvent(new Event('storage'));
    }
    setPendingProfile(null);
    setCurrentIndex((prev) => (prev + 1) % sortedProfiles.length);
  };

  return (
    <div className="whisk-discovery-bg min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto pb-32">
      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[4rem] p-12 max-w-md w-full text-center shadow-2xl border-4 border-gold relative overflow-hidden animate-in zoom-in duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-bl-full"></div>
              <img src="https://i.ibb.co/84B4vWJd/logo.jpg" className="w-20 h-20 rounded-full mx-auto mb-6 border-2 border-gold object-cover" alt="" />
              <h2 className="serif text-5xl font-bold text-maroon mb-2">Pairā Plus</h2>
              <p className="lora text-slate-500 italic mb-8">Elevate your journey. Unlimited paths and AI-powered compatibility guidance.</p>
              
              <button onClick={() => setShowPremiumModal(false)} className="w-full bg-maroon text-gold py-6 rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-red-900 transition-all">Go Premium</button>
              <button onClick={() => setShowPremiumModal(false)} className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-maroon">Not Today</button>
           </div>
        </div>
      )}

      <div className="flex justify-between items-end mb-8 px-4 relative z-10">
        <div className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white/20">
           <h1 className="serif text-5xl font-bold text-maroon">Himalayan Discovery</h1>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Connecting Paths across Nepal</p>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-xl outline-none cursor-pointer focus:border-gold">
          <option value="default">Curated Path</option>
          <option value="age-asc">Younger Paths</option>
          <option value="age-desc">Elder Paths</option>
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start relative z-10">
        <div className="w-full lg:w-1/2 flex justify-center animate-in slide-in-from-left-10 duration-700">
          <ProfileCard profile={currentProfile} onLike={() => setPendingProfile(currentProfile)} onSkip={handleNext} />
        </div>

        <div className="w-full lg:w-1/2 bg-white/95 backdrop-blur-lg pagoda-roof p-12 shadow-2xl border border-gray-100 min-h-[500px] animate-in slide-in-from-right-10 duration-700">
          <h2 className="serif text-4xl font-bold text-maroon mb-8 flex items-center gap-3">
             <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
             </div>
             Path Insights
          </h2>
          
          <div className="space-y-8">
             <section className="bg-ivory/80 p-6 rounded-3xl border-l-4 border-gold shadow-inner">
                <h4 className="text-[10px] font-black text-maroon uppercase tracking-widest mb-2">Narrative Core</h4>
                <p className="lora text-sm text-slate-700 leading-relaxed italic">"{currentProfile.bio}"</p>
             </section>

             <section>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Matchmaker Insights</h4>
                  {loadingComp && <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <div className={`p-6 bg-maroon rounded-3xl text-white shadow-xl lora italic text-sm leading-relaxed transition-opacity duration-300 ${loadingComp ? 'opacity-50' : 'opacity-100'}`}>
                  {compatibility}
                </div>
             </section>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Intent</p>
                  <p className="text-xs font-bold text-maroon truncate">{currentProfile.intent}</p>
                </div>
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Verification</p>
                  <p className={`text-xs font-bold flex items-center gap-1 ${currentProfile.isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                    {currentProfile.isVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {pendingProfile && (
        <div className="fixed inset-0 z-[1000] bg-maroon/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] p-12 max-w-sm w-full text-center shadow-2xl pagoda-roof border-4 border-gold animate-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-full border-4 border-gold mx-auto mb-6 overflow-hidden shadow-xl">
                 <img src={pendingProfile.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <h3 className="serif text-3xl font-bold text-maroon">Begin This Path?</h3>
              <p className="lora italic text-slate-500 text-sm mt-4 leading-relaxed">Connecting with {pendingProfile.name} will establish a private bridge between your paths.</p>
              <div className="mt-10 flex flex-col gap-4">
                 <button onClick={confirmConnection} className="w-full bg-maroon text-gold py-5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-red-900 transition-all">Establish Link</button>
                 <button onClick={() => setPendingProfile(null)} className="w-full bg-ivory text-slate-400 py-5 rounded-full font-black uppercase tracking-widest text-[10px]">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Discovery;
