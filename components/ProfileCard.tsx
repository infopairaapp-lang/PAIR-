
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileCardProps {
  profile: UserProfile;
  onLike: () => void;
  onSkip: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onLike, onSkip }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const allImages = [profile.imageUrl, ...(profile.gallery || [])];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.01]">
      <div className="relative h-[480px] group cursor-pointer overflow-hidden">
        <div 
          className="absolute inset-0 transition-transform duration-500 ease-out flex"
          style={{ transform: `translateX(-${imgIndex * 100}%)` }}
        >
          {allImages.map((url, idx) => (
            <img 
              key={idx}
              src={url} 
              alt={`${profile.name} ${idx + 1}`} 
              className="w-full h-full object-cover flex-shrink-0"
            />
          ))}
        </div>

        {allImages.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {allImages.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 flex-1 rounded-full transition-all ${idx === imgIndex ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/40'}`}
              ></div>
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
        
        <div className="absolute inset-0 z-20 flex">
          <div className="w-1/2 h-full" onClick={prevImage}></div>
          <div className="w-1/2 h-full" onClick={nextImage}></div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-white z-30 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="serif text-3xl font-bold">{profile.name}, {profile.age}</h2>
            {profile.isVerified && (
              <span className="bg-gold text-maroon text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                VERIFIED
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 font-medium mb-2">{profile.profession} • {profile.location}</p>
          <div className="flex flex-wrap gap-2">
             {profile.interests.slice(0, 3).map(interest => (
               <span key={interest} className="text-[10px] bg-white/20 px-2 py-1 rounded backdrop-blur-sm uppercase tracking-widest">{interest}</span>
             ))}
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-white flex justify-between items-center z-40 relative gap-4">
        <button 
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          className="flex-1 flex flex-col items-center justify-center py-3 text-slate-400 font-bold hover:bg-slate-50 transition-all duration-300 rounded-2xl hover:text-slate-600 group border border-transparent hover:border-slate-100"
        >
          <svg className="w-6 h-6 mb-1 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="uppercase tracking-[0.2em] text-[10px]">Not Now</span>
        </button>

        <div className="w-[1px] h-12 bg-slate-100"></div>

        <button 
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="flex-[1.5] flex items-center justify-center py-4 bg-maroon text-gold font-bold rounded-2xl shadow-xl transition-all duration-300 hover:bg-red-900 active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          <svg className="w-6 h-6 mr-2 fill-gold transition-transform duration-500 group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="uppercase tracking-[0.2em] text-[11px] font-black">Connect</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
