
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppNotification, VerificationStatus } from '../types';

const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.UNVERIFIED);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem('paira_notifications');
      if (stored) setNotifications(JSON.parse(stored));
      const savedStatus = localStorage.getItem('paira_verification_status') as VerificationStatus;
      if (savedStatus) setStatus(savedStatus);
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = () => {
    localStorage.removeItem('paira_is_auth');
    localStorage.removeItem('paira_auth_method');
    window.dispatchEvent(new Event('storage'));
    navigate('/auth');
  };

  const navLinks = [
    { name: 'Discover', path: '/discover', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg> },
    { name: 'Messages', path: '/messages', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>, badge: 1 },
    { name: 'Live', path: '/live', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { name: 'Verify', path: '/verify', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { name: 'Profile', path: '/profile', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-maroon text-white z-[100] flex items-center justify-between px-6 shadow-md border-b border-gold/20">
        <div className="w-10"></div>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
             <img src="https://i.ibb.co/84B4vWJd/logo.jpg" className="h-9 w-9 rounded-full border border-gold/50 object-cover shadow-sm group-hover:rotate-12 transition-transform" alt="" />
             <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full border border-maroon"></div>
          </div>
          <span className="serif text-2xl font-bold tracking-[0.3em] text-gold uppercase">Pairā</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-white hover:text-gold transition-colors relative p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && <span className="absolute top-0 right-0 bg-gold text-maroon text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-maroon">{unreadCount}</span>}
            </button>
          </div>

          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all p-0.5 ${status === VerificationStatus.VERIFIED ? 'border-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : status === VerificationStatus.PENDING ? 'border-amber-400 animate-pulse' : 'border-white/30'}`}>
              <img src="https://picsum.photos/seed/me/100" alt="Me" className="w-full h-full object-cover rounded-full" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-slate-800 z-[110] animate-in slide-in-from-top-2">
                <div className="p-4 border-b border-gray-50 bg-ivory/30">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Himalayan Path</p>
                  <p className="text-xs font-bold text-maroon truncate mt-1">Siddharth Thapa</p>
                </div>
                <div className="py-2">
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-medium text-slate-600 hover:bg-ivory hover:text-maroon">My Trust Profile</Link>
                  <Link to="/verify" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2 text-xs font-medium text-slate-600 hover:bg-ivory hover:text-maroon">Verification Suite</Link>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Disconnect</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-maroon text-white z-[100] border-t border-gold/10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] flex justify-around items-center px-4">
        {navLinks.map((link) => (
          <Link key={link.path} to={link.path} className={`flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${isActive(link.path) ? 'text-gold' : 'text-white/60'}`}>
            <div className="mb-1">{link.icon}</div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{link.name}</span>
            {isActive(link.path) && <span className="absolute bottom-1 w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]"></span>}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Navbar;
