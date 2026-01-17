
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationStatus } from '../types';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    birthday: { month: '', day: '', year: '' },
    gender: 'Woman',
    showGender: true,
    interestedIn: 'Both',
    orientation: 'Straight',
    lookingFor: '',
    interests: [] as string[],
    photos: [] as string[],
    location: null as { lat: number, lng: number, city?: string } | null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchAiLookingFor = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Suggest 5 'Looking For' status options for a high-end Nepali marriage app.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      setAiSuggestions(JSON.parse(response.text || '[]'));
    } catch (e) {
      setAiSuggestions(['Lifelong partnership', 'Marriage-minded connection', 'Traditional values, modern outlook']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 4) fetchAiLookingFor();
  }, [step]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      if (verifying && videoRef.current) {
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: 640, height: 640 } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
            setTimeout(() => {
              if (activeStream) activeStream.getTracks().forEach(t => t.stop());
              setVerifying(false);
              setStep(8);
            }, 4000);
          }
        } catch (e) {
          alert("Camera access failed. Proceeding to final step.");
          setVerifying(false);
          setStep(8);
        }
      }
    };
    if (verifying) startCamera();
    return () => { if (activeStream) activeStream.getTracks().forEach(t => t.stop()); };
  }, [verifying]);

  const handleNext = () => setStep(s => s + 1);

  const handleLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData(prev => ({ ...prev, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
      setLoading(false);
      handleNext();
    }, () => {
      setLoading(false);
      handleNext();
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = [...formData.photos];
    const remainingSlots = 6 - newPhotos.length;
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, reader.result as string].slice(0, 6)
        }));
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const finalizeAccount = () => {
    setLoading(true);
    const profileData = {
      id: 'me',
      name: formData.firstName || 'User',
      age: 25,
      location: formData.location ? 'Detected Location' : 'Kathmandu, Nepal',
      education: 'Verified Candidate',
      profession: 'Marriage Candidate',
      bio: formData.lookingFor || 'Seeking a meaningful life partnership.',
      intent: 'Marriage (Intentional)',
      imageUrl: formData.photos[0] || 'https://picsum.photos/seed/me/600/800',
      verificationStatus: VerificationStatus.UNVERIFIED,
      isVerified: false,
      gallery: formData.photos.slice(1),
      interests: [],
      gender: formData.gender
    };
    
    // Explicitly set all keys needed for AuthGuard and Navbar
    localStorage.setItem('paira_user_profile', JSON.stringify(profileData));
    localStorage.setItem('paira_is_auth', 'true');
    localStorage.setItem('paira_auth_method', 'phone');
    
    window.dispatchEvent(new Event('storage'));
    
    // Immediate navigation to avoid UI hang
    navigate('/discover');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="serif text-4xl font-bold text-maroon">Your Identity</h2>
            <div className="space-y-4">
              <input type="text" placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-ivory border-b-2 border-gold/30 p-4 text-xl serif focus:border-maroon outline-none" />
              <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-ivory border-b-2 border-gold/30 p-4 text-xl serif focus:border-maroon outline-none" />
            </div>
            <button onClick={handleNext} disabled={!formData.firstName} className="w-full bg-maroon text-gold py-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl disabled:opacity-30">Continue Path</button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="serif text-4xl font-bold text-maroon">Celestial Entry</h2>
            <p className="text-slate-400 lora italic">When did your journey begin?</p>
            <div className="flex gap-4">
              <input type="text" placeholder="MM" maxLength={2} className="w-1/3 bg-ivory border-b-2 border-gold/30 p-4 text-center text-xl" />
              <input type="text" placeholder="DD" maxLength={2} className="w-1/3 bg-ivory border-b-2 border-gold/30 p-4 text-center text-xl" />
              <input type="text" placeholder="YYYY" maxLength={4} className="w-1/3 bg-ivory border-b-2 border-gold/30 p-4 text-center text-xl" />
            </div>
            <button onClick={handleNext} className="w-full bg-maroon text-gold py-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl">Continue</button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="serif text-4xl font-bold text-maroon">Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">I am a</label>
                <div className="flex gap-2">
                  {['Woman', 'Man', 'Both'].map(g => (
                    <button key={g} onClick={() => setFormData({...formData, gender: g})} className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${formData.gender === g ? 'bg-maroon text-gold border-maroon' : 'bg-white border-gray-100 text-slate-400'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Interested in</label>
                <div className="flex gap-2">
                  {['Woman', 'Man', 'Both'].map(g => (
                    <button key={g} onClick={() => setFormData({...formData, interestedIn: g})} className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${formData.interestedIn === g ? 'bg-maroon text-gold border-maroon' : 'bg-white border-gray-100 text-slate-400'}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleNext} className="w-full bg-maroon text-gold py-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl">Confirm Intent</button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h2 className="serif text-4xl font-bold text-maroon">My Vision</h2>
              {loading && <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>}
            </div>
            <p className="text-slate-400 lora italic">What kind of path are you seeking?</p>
            <div className="space-y-3">
              {aiSuggestions.map((s, i) => (
                <button key={i} onClick={() => setFormData({...formData, lookingFor: s})} className={`w-full text-left p-4 rounded-2xl border text-xs font-medium transition-all ${formData.lookingFor === s ? 'bg-gold/10 border-gold text-maroon shadow-inner' : 'bg-white border-gray-100 text-slate-600 hover:border-gold/30'}`}>{s}</button>
              ))}
              <textarea placeholder="Or write your own vision..." value={formData.lookingFor} onChange={e => setFormData({...formData, lookingFor: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-xs min-h-[100px] outline-none focus:border-gold" />
            </div>
            <button onClick={handleNext} disabled={!formData.lookingFor} className="w-full bg-maroon text-gold py-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl">Define Path</button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="serif text-4xl font-bold text-maroon">Gallery of Soul</h2>
            <p className="text-slate-400 lora italic">Add 5+ photos to showcase your world. ({formData.photos.length}/6)</p>
            <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm">
                  {formData.photos[i] ? (
                    <div className="w-full h-full relative group">
                      <img src={formData.photos[i]} className="w-full h-full object-cover" alt={`Upload ${i}`} />
                      <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-full bg-white border-2 border-dashed border-gray-200 flex items-center justify-center text-slate-200 hover:border-gold hover:text-gold transition-all cursor-pointer"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg></div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleNext} className="w-full bg-maroon text-gold py-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl">Polish Gallery</button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center">
             <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto text-gold mb-4">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
             <h2 className="serif text-4xl font-bold text-maroon">Stay Connected</h2>
             <p className="lora text-slate-500 italic px-4">Find paths near you and alert you to new connections.</p>
             <div className="space-y-4 pt-4">
                <button onClick={handleLocation} className="w-full bg-maroon text-gold py-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl">Enable Discovery</button>
                <button onClick={handleNext} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-maroon">I'll do this later</button>
             </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center">
             <h2 className="serif text-4xl font-bold text-maroon">Keep it Real</h2>
             <p className="text-slate-400 lora italic px-4">Verified profiles receive 3x more interest. Secure your path with a video handshake.</p>
             <div className="relative w-64 h-64 mx-auto">
                <div className="absolute inset-0 rounded-full bg-slate-900 border-4 border-gold overflow-hidden shadow-2xl">
                   {verifying ? (
                     <div className="w-full h-full">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4">
                           <div className="w-full h-1 bg-gold absolute top-0 animate-progress"></div>
                           <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gold mb-2">Authenticating</p>
                           <p className="text-[10px] font-bold animate-pulse">Establishing Biometric Bridge...</p>
                        </div>
                     </div>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-700 bg-ivory">
                       <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                     </div>
                   )}
                </div>
             </div>
             <div className="space-y-4">
                <button onClick={() => setVerifying(true)} disabled={verifying} className="w-full bg-maroon text-gold py-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl">
                  {verifying ? 'Verifying...' : 'Start Video Handshake'}
                </button>
                <button onClick={() => setStep(8)} disabled={verifying} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-maroon">Verify Later</button>
             </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-8 animate-in zoom-in duration-700 text-center">
             <img src="https://i.ibb.co/84B4vWJd/logo.jpg" alt="Logo" className="w-32 h-32 rounded-full mx-auto border-4 border-gold shadow-2xl object-cover" />
             <h2 className="serif text-5xl font-bold text-maroon">Path Opened</h2>
             <p className="lora text-slate-500 italic text-lg px-8">Your journey across the Himalayas begins now.</p>
             <button onClick={finalizeAccount} className="w-full bg-maroon text-gold py-6 rounded-full font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl animate-bounce">
                Enter Discovery
             </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="whisk-auth-bg min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[3rem] p-10 md:p-14 shadow-2xl border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100"><div className="h-full bg-gold transition-all duration-700" style={{ width: `${(step / 8) * 100}%` }}></div></div>
        {renderStep()}
      </div>
    </div>
  );
};

export default Onboarding;
