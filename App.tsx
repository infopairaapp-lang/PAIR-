
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Discovery from './pages/Discovery';
import Live from './pages/Live';
import Verification from './pages/Verification';
import Messages from './pages/Messages';
import ChatView from './pages/ChatView';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import { CallSession } from './types';

const IncomingCallOverlay: React.FC = () => {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkCall = () => {
      const callData = localStorage.getItem('paira_active_call');
      if (callData) {
        const call: CallSession = JSON.parse(callData);
        // If we are not the caller and the status is ringing, show overlay
        // In this local simulation, we assume any active call in localStorage is for 'us' in another tab
        if (call.status === 'ringing') {
          setActiveCall(call);
        } else if (call.status === 'ended' || call.status === 'connected') {
          // If we connected or it ended, hide overlay
          if (call.status === 'ended') setActiveCall(null);
          if (call.status === 'connected' && activeCall) setActiveCall(null);
        }
      } else {
        setActiveCall(null);
      }
    };

    window.addEventListener('storage', checkCall);
    const interval = setInterval(checkCall, 1000);
    return () => {
      window.removeEventListener('storage', checkCall);
      clearInterval(interval);
    };
  }, [activeCall]);

  const acceptCall = () => {
    if (!activeCall) return;
    const updated = { ...activeCall, status: 'connected' as const };
    localStorage.setItem('paira_active_call', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setActiveCall(null);
    navigate(`/chat/${activeCall.id}`);
  };

  const declineCall = () => {
    if (!activeCall) return;
    const updated = { ...activeCall, status: 'ended' as const };
    localStorage.setItem('paira_active_call', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setActiveCall(null);
  };

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-maroon/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="relative mb-12">
        <div className="w-32 h-32 rounded-full border-4 border-gold p-1 animate-pulse">
          <img src={`https://picsum.photos/seed/${activeCall.callerId}/200`} className="w-full h-full object-cover rounded-full" alt="" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold text-maroon px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
          Incoming {activeCall.type}
        </div>
      </div>
      
      <h2 className="serif text-4xl font-bold text-white mb-2">{activeCall.callerName}</h2>
      <p className="text-gold/60 lora italic text-lg mb-12">is calling you through the secure path...</p>
      
      <div className="flex gap-12">
        <button onClick={declineCall} className="group flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] group-hover:scale-110 transition-transform">
             <svg className="w-8 h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8c0 4.41-3.59 8-8 8zm4.5-12h-9c-.28 0-.5.22-.5.5s.22.5.5.5h9c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z"/></svg>
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Decline</span>
        </button>
        
        <button onClick={acceptCall} className="group flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce group-hover:scale-110 transition-transform">
             <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Accept</span>
        </button>
      </div>
    </div>
  );
};

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(localStorage.getItem('paira_is_auth') === 'true');

  useEffect(() => {
    const checkAuth = () => {
      const authState = localStorage.getItem('paira_is_auth') === 'true';
      setIsAuth(authState);
      
      const isPublicPath = ['/', '/auth', '/onboarding'].includes(location.pathname);
      
      if (!authState && !isPublicPath) {
        navigate('/auth');
      } else if (authState && location.pathname === '/auth') {
        navigate('/discover');
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location.pathname, navigate]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="h-screen w-full flex flex-col bg-ivory overflow-hidden">
        <AuthGuard>
          <NavbarWrapper />
          <IncomingCallOverlay />
          <main className="flex-1 overflow-y-auto pt-16 pb-20 scroll-smooth">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/discover" element={<Discovery />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:id" element={<ChatView />} />
              <Route path="/live" element={<Live />} />
              <Route path="/verify" element={<Verification />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <FooterWrapper />
          </main>
        </AuthGuard>
      </div>
    </Router>
  );
};

// Sub-components to hide Navbar on Auth & Onboarding page
const NavbarWrapper = () => {
  const location = useLocation();
  const hideNav = ['/auth', '/onboarding'].includes(location.pathname);
  return !hideNav ? <Navbar /> : null;
};

const FooterWrapper = () => {
  const location = useLocation();
  const hideFooter = ['/auth', '/onboarding'].includes(location.pathname) || location.pathname.includes('/chat/');
  if (hideFooter) return null;
  return (
    <footer className="bg-maroon border-t border-white/10 py-12 px-4 text-center">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <img 
          src="https://i.ibb.co/84B4vWJd/logo.jpg" 
          alt="Logo" 
          className="h-12 w-12 rounded-full border border-gold/30 mb-4 object-cover opacity-80"
        />
        <h2 className="serif text-2xl font-bold text-gold tracking-[0.3em] mb-2 uppercase">Pairā</h2>
        <p className="text-xs text-white/80 mb-6 tracking-tighter italic lora">"Bringing hearts together across the Himalayas"</p>
        <div className="flex justify-center gap-8 mb-8">
           <span className="text-[10px] text-white/40 uppercase tracking-widest cursor-pointer hover:text-gold transition-colors">Safety</span>
           <span className="text-[10px] text-white/40 uppercase tracking-widest cursor-pointer hover:text-gold transition-colors">Privacy</span>
           <span className="text-[10px] text-white/40 uppercase tracking-widest cursor-pointer hover:text-gold transition-colors">Terms</span>
        </div>
        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">© 2024 Pairā Matchmaking. Registered in Kathmandu.</p>
      </div>
    </footer>
  );
};

export default App;
