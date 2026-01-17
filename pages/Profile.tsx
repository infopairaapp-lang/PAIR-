import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, VerificationStatus } from '../types';
import { refineBio, getProfileSuggestions } from '../services/gemini';
import { Link, useNavigate } from 'react-router-dom';

const DEFAULT_PROFILE = {
  name: 'Siddharth Thapa',
  age: 29,
  location: 'Pokhara, Nepal',
  education: 'B.E. Computer Engineering',
  profession: 'Software Architect',
  bio: 'Tech enthusiast with a love for mountains.',
  intent: 'Marriage (looking to settle soon)',
  interests: ['Coding', 'Cycling', 'Photography', 'Trekking'],
  imageUrl: 'https://picsum.photos/seed/siddharth/600/800',
  verificationStatus: VerificationStatus.UNVERIFIED,
  isVerified: false,
  gallery: []
};

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Free',
    description: 'Essential path discovery',
    features: ['5 Messages / Day', 'Standard Search', 'Cultural Interests'],
    color: 'slate',
    accent: 'slate-400'
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$9.99',
    period: '/mo',
    description: 'Enhanced trust & visibility',
    features: ['Priority Verification', 'Unlimited Messages', 'See Who Liked You', '3 Profile Boosts'],
    color: 'gold',
    accent: 'gold',
    recommended: true
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '$24.99',
    period: '/mo',
    description: 'Dedicated Himalayan guidance',
    features: ['1-on-1 AI Consulting', 'Video Call Minutes', 'Global Discovery', 'Dedicated Matchmaker'],
    color: 'maroon',
    accent: 'maroon'
  }
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Partial<UserProfile>>(() => {
    const saved = localStorage.getItem('paira_user_profile');
    try {
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  });

  const [refining, setRefining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  
  // Completeness state
  const completenessInfo = useMemo(() => {
    const weights = {
      name: 10,
      age: 5,
      location: 10,
      education: 10,
      profession: 10,
      bio: 20,
      intent: 10,
      interests: 10,
      gallery: 15
    };

    let score = 0;
    const missing: string[] = [];

    if (profile.name) score += weights.name; else missing.push("Legal Name");
    if (profile.age) score += weights.age; else missing.push("Date of Birth");
    if (profile.location) score += weights.location; else missing.push("Current Location");
    if (profile.education) score += weights.education; else missing.push("Educational Background");
    if (profile.profession) score += weights.profession; else missing.push("Professional Title");
    if (profile.bio && profile.bio.length > 20) score += weights.bio; else missing.push("Deeper Bio (min 20 chars)");
    if (profile.intent) score += weights.intent; else missing.push("Relationship Intent");
    if (profile.interests && profile.interests.length >= 3) score += weights.interests; else missing.push("At least 3 Interests");
    if (profile.gallery && profile.gallery.length >= 2) score += weights.gallery; else missing.push("Gallery Photos (min 2)");

    return { score, missing };
  }, [profile]);

  useEffect(() => {
    const syncStatus = () => {
      setIsSyncing(true);
      const savedStatus = localStorage.getItem('paira_verification_status') as VerificationStatus;
      const savedProfile = JSON.parse(localStorage.getItem('paira_user_profile') || '{}');
      
      if (savedStatus) {
        setProfile(prev => ({ 
          ...prev, 
          ...savedProfile,
          verificationStatus: savedStatus,
          isVerified: savedStatus === VerificationStatus.VERIFIED
        }));
      }
      setTimeout(() => setIsSyncing(false), 500);
    };
    
    syncStatus();
    window.addEventListener('storage', syncStatus);
    return () => window.removeEventListener('storage', syncStatus);
  }, []);

  const handleBioRefine = async () => {
    if (!profile.bio) return;
    setRefining(true);
    const polished = await refineBio(profile.bio);
    setProfile(prev => ({ ...prev, bio: polished }));
    setRefining(false);
  };

  const saveProfile = () => {
    localStorage.setItem('paira_user_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('storage'));
    alert('Real-time sync triggered. Profile metadata broadcasted.');
  };

  const handleLogout = () => {
    localStorage.removeItem('paira_is_auth');
    localStorage.removeItem('paira_auth_method');
    window.dispatchEvent(new Event('storage'));
    navigate('/auth');
  };

  const renderVerificationHUD = () => {
    const status = profile.verificationStatus || VerificationStatus.UNVERIFIED;

    if (status === VerificationStatus.VERIFIED) {
      return (
        <div className="relative group bg-gradient-to-br from-white to-gold/5 border-2 border-gold rounded-[2.5rem] p-8 text-center shadow-2xl overflow-hidden transition-all hover:scale-[1.02] animate-in fade-in zoom-in duration-500">
          <div className="absolute inset-0 trust-shine opacity-40 pointer-events-none"></div>
          <div className="w-20 h-20 bg-gold text-maroon rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(212,175,55,0.4)] border-4 border-white relative z-10">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="serif text-3xl font-bold text-maroon">Golden Trust Badge</h3>
          <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mt-2">Identity Authenticated</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-200">Face Match: 99%</span>
            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-200">ID Validated</span>
          </div>
        </div>
      );
    }

    if (status === VerificationStatus.PENDING) {
      return (
        <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-400 border-dashed rounded-[2.5rem] p-8 text-center shadow-xl animate-in slide-in-from-right-10 duration-500">
          <div className="w-20 h-20 bg-amber-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.3)]">
             <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <h3 className="serif text-3xl font-bold text-amber-800">Review Pending</h3>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-2">Our AI is analyzing your documents</p>
          <div className="mt-8">
            <div className="w-full bg-amber-200/30 h-2 rounded-full overflow-hidden mb-6">
              <div className="bg-amber-500 h-full w-2/3 animate-progress shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            </div>
            <Link to="/verify" className="w-full inline-block bg-amber-500 text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-amber-600 transition-all shadow-xl active:scale-95">
              Go to Verification Center
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] p-8 text-center group hover:border-maroon transition-all duration-500 hover:shadow-2xl">
        <div className="w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-maroon group-hover:text-gold transition-all duration-500 shadow-inner">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.268 0 2.39.234 3.468.657m-3.468 3.468L12 11m0 0l2.753 2.753m-2.753-2.753l-2.753-2.753" />
          </svg>
        </div>
        <h3 className="serif text-3xl font-bold text-slate-700">Not Verified</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Unlock all platform features</p>
        <Link to="/verify" className="mt-8 w-full inline-block bg-maroon text-gold px-8 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-red-900 transition-all active:scale-95">
          Begin Trust Link
        </Link>
      </div>
    );
  };

  return (
    <div className="everest-bg min-h-screen py-12 px-6 pb-48">
      {/* Pagoda Style Section Header */}
      <section className="max-w-6xl mx-auto bg-white pagoda-roof p-10 md:p-16 mb-20 shadow-2xl border border-gray-100 flex flex-col lg:flex-row gap-16 items-center animate-in slide-in-from-top-10 duration-1000">
        <div className="relative w-64 h-64 flex-shrink-0">
           <div className={`absolute inset-0 rounded-full border-4 shadow-inner transition-colors duration-500 ${profile.isVerified ? 'border-gold' : profile.verificationStatus === VerificationStatus.PENDING ? 'border-amber-400' : 'border-slate-200'}`}></div>
           <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-gray-100 bg-ivory">
              <img src={profile.imageUrl} className="w-full h-full object-cover" alt="Profile" />
           </div>
           
           {/* Verification Badge on Avatar */}
           <div className={`absolute -bottom-2 -right-2 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-2xl z-20 transition-all duration-700 ${profile.isVerified ? 'bg-gold text-maroon scale-100' : 'scale-0'}`}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
           </div>
           
           {/* Glow Ring for Verified Status */}
           {profile.verificationStatus === VerificationStatus.VERIFIED && (
             <div className="absolute -inset-2 rounded-full border-2 border-gold/50 animate-pulse"></div>
           )}
        </div>

        <div className="flex-1 space-y-6">
           <div className="flex items-center gap-4">
              <h1 className="serif text-5xl font-bold text-maroon">{profile.name}</h1>
              {profile.isVerified && (
                <div className="bg-gold text-maroon px-4 py-1 rounded-full shadow-lg text-[9px] font-black uppercase tracking-widest border border-white">
                  Gold Verified
                </div>
              )}
           </div>
           <p className="text-xl text-slate-500 lora italic leading-relaxed">"{profile.bio}"</p>
           
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-ivory/50 p-5 rounded-3xl border border-gray-100 text-center transition-all hover:bg-white hover:shadow-md">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Profession</p>
                 <p className="text-sm font-bold text-maroon">{profile.profession}</p>
              </div>
              <div className="bg-ivory/50 p-5 rounded-3xl border border-gray-100 text-center transition-all hover:bg-white hover:shadow-md">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                 <p className="text-sm font-bold text-maroon">{profile.location}</p>
              </div>
              <div className="bg-ivory/50 p-5 rounded-3xl border border-gray-100 text-center transition-all hover:bg-white hover:shadow-md">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                 <p className={`text-sm font-bold uppercase tracking-widest ${profile.isVerified ? 'text-green-600' : 'text-slate-400'}`}>{profile.verificationStatus}</p>
              </div>
           </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 mb-20">
        {/* Left Column: Trust Hub & Completeness */}
        <div className="w-full lg:w-1/3 space-y-8 animate-in slide-in-from-left-10 duration-700">
           <div className="flex items-center justify-between px-2">
              <h2 className="serif text-3xl font-bold text-maroon">Trust Hub</h2>
              {isSyncing && <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>}
           </div>
           
           {/* Profile Completeness Meter - "Scaling Everest" */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
              
              <div className="flex justify-between items-baseline mb-6">
                 <h4 className="serif text-xl font-bold text-maroon">Peak Completion</h4>
                 <span className="text-2xl font-black text-gold">{completenessInfo.score}%</span>
              </div>

              <div className="relative h-24 flex items-end justify-center mb-6 overflow-hidden bg-ivory/50 rounded-2xl">
                 {/* Mountain Visualizer */}
                 <svg viewBox="0 0 100 40" className="w-full h-full absolute bottom-0 left-0 text-slate-200">
                    <path d="M0 40 L30 15 L50 30 L70 5 L100 40 Z" fill="currentColor" />
                 </svg>
                 {/* Progress Path */}
                 <svg viewBox="0 0 100 40" className="w-full h-full absolute bottom-0 left-0 text-gold transition-all duration-1000" style={{ clipPath: `inset(0 ${100 - completenessInfo.score}% 0 0)` }}>
                    <path d="M0 40 L30 15 L50 30 L70 5 L100 40 Z" fill="currentColor" />
                 </svg>
                 <div className="relative z-10 pb-2">
                    <p className="text-[8px] font-black text-maroon uppercase tracking-[0.3em]">
                       {completenessInfo.score < 40 ? "Base Camp" : completenessInfo.score < 80 ? "Climbing the Ridge" : "Nearing the Summit"}
                    </p>
                 </div>
              </div>

              {completenessInfo.missing.length > 0 && (
                <div className="space-y-3">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50 pb-2">Himalayan Wisdom for your path:</p>
                   <ul className="space-y-2">
                      {completenessInfo.missing.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[10px] text-slate-600 group-hover:translate-x-1 transition-transform">
                           <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_5px_rgba(212,175,55,1)]"></div>
                           <span>Complete your <span className="font-bold text-maroon">{item}</span></span>
                        </li>
                      ))}
                   </ul>
                </div>
              )}
              
              {completenessInfo.score === 100 && (
                 <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-[10px] font-bold text-center border border-green-100 animate-in fade-in zoom-in">
                    Summit Reached! Your path is perfectly clear.
                 </div>
              )}
           </div>

           {renderVerificationHUD()}
           
           <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-[4rem] group-hover:bg-gold/10 transition-colors"></div>
              <h4 className="serif text-xl font-bold text-maroon mb-4">Himalayan Heritage</h4>
              <p className="text-xs text-slate-500 leading-relaxed lora italic">Authenticating your profile through our Himalayan Trust Network ensures that your path to a lifelong partner is respectful and verified.</p>
              <div className="mt-8 flex items-center gap-4 text-gold opacity-30">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-gold to-transparent"></div>
              </div>
           </div>
        </div>

        {/* Right Column: Editor */}
        <div className="flex-1 bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-gray-100 animate-in slide-in-from-right-10 duration-700">
           <div className="flex justify-between items-center mb-12 pb-6 border-b border-gray-100">
              <h2 className="serif text-4xl font-bold text-maroon">Identity Curate</h2>
              <div className="flex gap-4">
                <button 
                  onClick={handleLogout} 
                  className="bg-white border-2 border-maroon/20 text-maroon px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-maroon hover:text-white transition-all active:scale-95"
                >
                  Sign Out
                </button>
                <button 
                  onClick={saveProfile} 
                  className="bg-maroon text-gold px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-red-900 transition-all active:scale-95"
                >
                  Push Real-time Sync
                </button>
              </div>
           </div>
           
           <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Full Legal Name</label>
                   <input type="text" value={profile.name} onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-ivory/30 border border-gray-100 rounded-2xl px-8 py-5 text-sm font-bold focus:border-gold outline-none transition-all focus:bg-white focus:shadow-inner" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Current Profession</label>
                   <input type="text" value={profile.profession} onChange={(e) => setProfile(prev => ({ ...prev, profession: e.target.value }))} className="w-full bg-ivory/30 border border-gray-100 rounded-2xl px-8 py-5 text-sm font-bold focus:border-gold outline-none transition-all focus:bg-white focus:shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Relationship Intent</label>
                   <select value={profile.intent} onChange={(e) => setProfile(prev => ({ ...prev, intent: e.target.value }))} className="w-full bg-ivory/30 border border-gray-100 rounded-2xl px-8 py-5 text-sm font-bold focus:border-gold outline-none transition-all focus:bg-white focus:shadow-inner appearance-none">
                      <option value="">Select Intent</option>
                      <option value="Marriage (within 1 year)">Marriage (within 1 year)</option>
                      <option value="Marriage (1-2 years)">Marriage (1-2 years)</option>
                      <option value="Intentional Dating">Intentional Dating</option>
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Education Background</label>
                   <input type="text" value={profile.education} onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))} className="w-full bg-ivory/30 border border-gray-100 rounded-2xl px-8 py-5 text-sm font-bold focus:border-gold outline-none transition-all focus:bg-white focus:shadow-inner" />
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Narrative</label>
                    <button onClick={handleBioRefine} disabled={refining} className="text-[10px] font-black text-gold uppercase hover:text-maroon transition-all disabled:opacity-30">
                       {refining ? 'Refining Path...' : 'Refine with Kore AI'}
                    </button>
                 </div>
                 <textarea value={profile.bio} onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))} rows={6} className="w-full bg-ivory/30 border border-gray-100 rounded-[2.5rem] px-10 py-8 text-sm lora italic leading-relaxed focus:outline-none focus:border-gold transition-all focus:bg-white focus:shadow-inner" />
              </div>
              
              <div className="pt-6">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Changes are synced across all your verified devices instantly</p>
              </div>
           </div>
        </div>
      </div>

      {/* Subscription Tiers Section */}
      <section className="max-w-6xl mx-auto mb-32 animate-in slide-in-from-bottom-10 duration-1000">
         <div className="text-center mb-16">
            <h2 className="serif text-5xl font-bold text-maroon mb-4">Ascend Your Path</h2>
            <p className="lora text-slate-500 italic">Select a tier to unlock deeper connections and priority guidance.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-[3rem] p-10 shadow-2xl border-2 transition-all hover:scale-[1.03] flex flex-col ${plan.recommended ? 'border-gold shadow-gold/20' : 'border-gray-100'}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gold text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Most Favored
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={`serif text-3xl font-bold mb-2 ${plan.id === 'maroon' ? 'text-maroon' : plan.id === 'gold' ? 'text-gold' : 'text-slate-600'}`}>{plan.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.description}</p>
                </div>

                <div className="mb-8 flex items-baseline">
                  <span className="text-5xl font-black text-slate-800">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-sm ml-1">{plan.period}</span>}
                </div>

                <ul className="space-y-4 mb-12 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                       <svg className={`w-5 h-5 ${plan.id === 'platinum' ? 'text-maroon' : plan.id === 'gold' ? 'text-gold' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                       </svg>
                       {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 ${
                    selectedPlan === plan.id 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                    : plan.id === 'platinum' 
                      ? 'bg-maroon text-gold shadow-xl hover:bg-red-900' 
                      : plan.id === 'gold' 
                        ? 'bg-gold text-white shadow-xl hover:brightness-110' 
                        : 'bg-ivory text-slate-600 border border-gray-100 hover:bg-white'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Active Plan' : `Commit to ${plan.name}`}
                </button>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default Profile;