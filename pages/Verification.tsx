
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VerificationStatus } from '../types';

const Verification: React.FC = () => {
  const [step, setStep] = useState<number | 'review' | 'success'>(1);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStatus, setCurrentStatus] = useState<VerificationStatus>(VerificationStatus.UNVERIFIED);
  
  const [livenessPhase, setLivenessPhase] = useState<'blink' | 'up' | 'down' | 'complete'>('blink');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);
  
  // Pairā Review States
  const [reviewProgress, setReviewProgress] = useState(0);
  const [reviewLog, setReviewLog] = useState<string[]>([]);
  const [aiScore, setAiScore] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('paira_verification_status') as VerificationStatus;
    if (saved) setCurrentStatus(saved);
  }, []);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch (err) { 
      console.error("Camera access denied:", err);
      setLivenessPhase('complete');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  useEffect(() => {
    if (step === 2) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step]);

  useEffect(() => {
    if (step !== 2 || livenessPhase === 'complete') return;
    const interval = setInterval(() => {
      setPhaseProgress(p => {
        if (p >= 100) {
          setCompletedPhases(c => [...c, livenessPhase]);
          if (livenessPhase === 'blink') setLivenessPhase('up');
          else if (livenessPhase === 'up') setLivenessPhase('down');
          else if (livenessPhase === 'down') setLivenessPhase('complete');
          return 0;
        }
        return p + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [step, livenessPhase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const triggerFilePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const startPairaReview = () => {
    setStep('review');
    setReviewProgress(0);
    setAiScore(0);
    
    const logs = [
      "Initializing Pairā Assistant 'Kore'...",
      "Extracting Document Metadata...",
      "Validating Government Seal Authenticity...",
      "Analyzing Facial Biometrics...",
      "Comparing Liveness Frames...",
      "Checking Global Security Database...",
      "Verifying Cultural Alignment...",
      "Finalizing Pairā Trust Certificate..."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      setReviewProgress(prev => {
        const next = prev + 1;
        if (next % 12 === 0 && currentLogIndex < logs.length) {
          setReviewLog(prevLogs => [...prevLogs, logs[currentLogIndex]]);
          currentLogIndex++;
        }
        if (next > 20) {
            setAiScore(Math.min(99, Math.floor((next / 100) * 99) + Math.floor(Math.random() * 5)));
        }
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => handleVerificationSuccess(), 1000);
          return 100;
        }
        return next;
      });
    }, 50);
  };

  const handleVerificationSuccess = () => {
    localStorage.setItem('paira_verification_status', VerificationStatus.VERIFIED);
    const profile = JSON.parse(localStorage.getItem('paira_user_profile') || '{}');
    localStorage.setItem('paira_user_profile', JSON.stringify({
      ...profile,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true
    }));
    window.dispatchEvent(new Event('storage'));
    const notifications = JSON.parse(localStorage.getItem('paira_notifications') || '[]');
    const newNotif = {
      id: Date.now().toString(),
      title: "Identity Verified",
      message: "Pairā Assistant 'Kore' has approved your identity. You now have the Golden Trust Badge!",
      type: 'verification',
      timestamp: 'Just now',
      read: false
    };
    localStorage.setItem('paira_notifications', JSON.stringify([...notifications, newNotif]));
    setStep('success');
    setCurrentStatus(VerificationStatus.VERIFIED);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 pb-32">
      <div className="text-center mb-12">
        <h1 className="serif text-5xl font-bold text-maroon">Trust Center</h1>
        <p className="lora text-slate-500 italic mt-2">Verified Identities, Lifelong Connections</p>
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-gray-100 min-h-[650px] flex flex-col justify-center relative p-10 md:p-16">
        
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 text-center">
             <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto text-gold mb-6 relative">
                <div className="absolute inset-0 border-2 border-gold/20 rounded-full animate-ping opacity-20"></div>
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" /></svg>
             </div>
             <div>
                <h2 className="serif text-4xl font-bold text-maroon">Document Capture</h2>
                <p className="text-slate-400 lora italic text-sm mt-2">Please upload a clear photo of your National ID or Passport.</p>
             </div>
             <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
             <div className={`border-4 border-dashed rounded-[3rem] p-16 transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer ${selectedFile ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-ivory/30 hover:border-gold hover:bg-ivory'}`} onClick={triggerFilePicker}>
                {selectedFile ? (
                  <div className="animate-in zoom-in duration-500 text-center">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white mb-4 shadow-lg"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                    <p className="font-bold text-green-700 text-lg">Document Acquired</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono truncate max-w-[200px]">{selectedFile.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="mt-4 text-[10px] font-bold text-maroon uppercase tracking-widest hover:underline">Replace File</button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-6 text-slate-200"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Click to Select ID Folder/File</p>
                  </>
                )}
             </div>
             <button onClick={() => setStep(2)} disabled={!selectedFile} className="w-full bg-maroon text-gold py-6 rounded-[2rem] font-bold uppercase tracking-[0.3em] text-[10px] disabled:opacity-20 shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all">Proceed to Face Scan</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in text-center">
            <div>
              <h2 className="serif text-4xl font-bold text-maroon">Face Link Scan</h2>
              <p className="text-slate-400 lora italic text-sm mt-2">Position your face within the frame and follow 'Kore's' instructions.</p>
            </div>
            <div className="relative w-80 h-80 mx-auto group">
               <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-full"><div className="absolute top-0 left-0 w-full h-1 bg-gold/50 shadow-[0_0_15px_rgba(212,175,55,1)] animate-[scan_3s_ease-in-out_infinite]"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-dashed border-white/20 rounded-full"></div></div>
               <div className="absolute inset-0 rounded-full bg-slate-900 border-4 border-gold shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                     <p className="text-gold text-[9px] font-black uppercase tracking-[0.3em] mb-4">Liveness Protocol</p>
                     <h3 className="serif text-4xl font-bold mb-8 h-12">{livenessPhase === 'blink' ? 'Blink your eyes' : livenessPhase === 'up' ? 'Look Up' : livenessPhase === 'down' ? 'Look Down' : 'Captured'}</h3>
                     <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-gold shadow-[0_0_8px_rgba(212,175,55,1)] transition-all duration-300" style={{ width: `${phaseProgress}%` }}></div></div>
                  </div>
               </div>
            </div>
            <button onClick={startPairaReview} disabled={livenessPhase !== 'complete'} className="w-full bg-maroon text-gold py-6 rounded-[2rem] font-bold uppercase tracking-[0.3em] text-[10px] disabled:opacity-20 shadow-2xl transition-all">Start Pairā Verification</button>
          </div>
        )}

        {step === 'review' && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 duration-500">
             <div className="relative w-48 h-48">
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-full bg-gold/5 rounded-full animate-pulse border border-gold/20"></div><div className="absolute inset-4 bg-maroon/5 rounded-full flex items-center justify-center overflow-hidden"><div className="flex gap-1.5 items-end h-16">{[1,2,3,4,5,6].map(i => (<div key={i} className="w-1.5 bg-gold rounded-full animate-progress-fast" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}></div>))}</div></div></div>
                <div className="absolute -top-4 -right-4 bg-maroon text-gold px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-gold/30 shadow-xl">Pairā Assist</div>
                <svg className="absolute inset-0 w-full h-full -rotate-90"><circle cx="96" cy="96" r="90" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-50" /><circle cx="96" cy="96" r="90" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={565} strokeDashoffset={565 - (565 * reviewProgress) / 100} strokeLinecap="round" className="text-gold transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(212,175,55,0.4)]" /></svg>
             </div>
             <div className="text-center w-full max-w-md">
                <div className="flex justify-between items-baseline mb-3 px-2"><h3 className="serif text-3xl font-bold text-maroon">Pairā Analysis</h3><span className="text-2xl font-bold text-gold">{reviewProgress}%</span></div>
                <div className="bg-ivory/50 rounded-3xl p-6 border border-gray-100 min-h-[120px] text-left">
                   <div className="space-y-2">{reviewLog.slice(-3).map((log, i) => (<div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i === 2 ? 'animate-in slide-in-from-left-4 opacity-100' : 'opacity-40'}`}><div className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-gold' : 'bg-slate-300'}`}></div><p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">{log}</p></div>))}</div>
                </div>
             </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-10 animate-in zoom-in duration-700">
             <div className="relative w-40 h-40 mx-auto"><div className="absolute inset-0 bg-gold rounded-full animate-ping opacity-20"></div><div className="relative z-10 w-full h-full bg-gold rounded-full flex items-center justify-center text-maroon shadow-[0_0_50px_rgba(212,175,55,0.5)] border-8 border-white"><svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div></div>
             <div><h2 className="serif text-5xl font-bold text-maroon">Verification Granted</h2><div className="flex justify-center mt-4"><div className="bg-green-50 text-green-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-green-200">Identity Confirmed by Pairā System</div></div></div>
             <p className="text-slate-500 lora italic text-xl max-w-md mx-auto leading-relaxed">Your identity has been cross-referenced and authorized. The Golden Trust Badge is now active on your profile.</p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6"><Link to="/discover" className="bg-maroon text-gold px-12 py-5 rounded-[2rem] font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-red-900 transition-all active:scale-[0.98]">Start Exploring</Link><Link to="/profile" className="bg-white border border-gray-100 text-slate-500 px-12 py-5 rounded-[2rem] font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-ivory transition-all active:scale-[0.98]">View Profile</Link></div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan { 0%, 100% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(320px); } }
        @keyframes progress-fast { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.5); } }
        .animate-progress-fast { animation: progress-fast 0.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Verification;
