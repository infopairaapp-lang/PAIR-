
import React from 'react';
import { Link } from 'react-router-dom';
import { LANDMARKS } from '../constants';

const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden whisk-landing-bg">
        <div className="relative z-10 text-center px-4">
          <img 
            src="https://i.ibb.co/84B4vWJd/logo.jpg" 
            alt="PAIRĀ Logo" 
            className="mx-auto w-32 h-32 rounded-full mb-6 border-4 border-gold shadow-2xl object-cover animate-in zoom-in-50 duration-1000" 
          />
          <h1 className="serif text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg tracking-widest uppercase animate-in slide-in-from-bottom-4 duration-700 delay-200">Pairā</h1>
          <p className="lora text-xl md:text-2xl text-gold italic mb-8 drop-shadow-md animate-in slide-in-from-bottom-4 duration-700 delay-300">Two Paths, One Life</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in duration-1000 delay-500">
            <Link to="/discover" className="bg-maroon text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-red-900 transition-all shadow-xl uppercase tracking-widest border border-gold/30">
              Find Your Partner
            </Link>
            <Link to="/verify" className="bg-white/10 backdrop-blur-md text-white border-2 border-white/30 px-10 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all shadow-xl uppercase tracking-widest">
              Get Verified
            </Link>
          </div>
        </div>
        
        {/* Cultural Motif */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-30">
          <svg className="w-16 h-16 text-gold animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-ivory py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="w-20 h-20 bg-maroon rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="serif text-2xl font-bold mb-3 text-maroon">Verified Trust</h3>
            <p className="text-slate-600">ID and Face verification for every profile to ensure a safe community for families.</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-maroon rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="serif text-2xl font-bold mb-3 text-maroon">Cultural Matching</h3>
            <p className="text-slate-600">Intentional matchmaking based on values, education, and family expectations.</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-maroon rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="serif text-2xl font-bold mb-3 text-maroon">Posh Live</h3>
            <p className="text-slate-600">Engage in respectful group live sessions and build real-time connections.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
