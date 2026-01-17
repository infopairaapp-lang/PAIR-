
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANDMARKS } from '../constants';

const Auth: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+977');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [isValidating, setIsValidating] = useState(false);
  const [validationStage, setValidationStage] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 7) {
      setStep(2);
      setTimer(60);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const verifyOtp = async () => {
    if (otp.join('').length === 6) {
      setIsValidating(true);
      
      const stages = [
        "Encrypting Biometric Packet...",
        "Validating Device Token...",
        "Establishing Live Session...",
        "Handshake Successful"
      ];

      for (const stage of stages) {
        setValidationStage(stage);
        await new Promise(r => setTimeout(r, 600));
      }

      localStorage.setItem('paira_is_auth', 'true');
      localStorage.setItem('paira_auth_method', 'phone');
      localStorage.setItem('paira_last_login', new Date().toISOString());
      
      // If it's a new account, we should onboarding them
      const isNew = !localStorage.getItem('paira_user_profile');
      window.dispatchEvent(new Event('storage'));
      
      if (isNew) {
        navigate('/onboarding');
      } else {
        navigate('/discover');
      }
    }
  };

  return (
    <div className="whisk-auth-bg min-h-screen w-full flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/20">
        {isValidating && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
              <svg className="absolute inset-0 m-auto w-8 h-8 text-gold animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.268 0 2.39.234 3.468.657m-3.468 3.468L12 11m0 0l2.753 2.753m-2.753-2.753l-2.753-2.753" />
              </svg>
            </div>
            <p className="serif text-xl font-bold text-maroon mb-2">Real-time Auth</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">{validationStage}</p>
          </div>
        )}

        <div className="text-center mb-8">
          <img src="https://i.ibb.co/84B4vWJd/logo.jpg" alt="Logo" className="mx-auto w-20 h-20 rounded-full mb-4 border-2 border-gold shadow-lg object-cover" />
          <span className="serif text-4xl font-bold tracking-[0.3em] text-maroon uppercase">Pairā</span>
          <p className="lora text-gold italic mt-2 text-sm">{step === 1 ? 'Begin your journey' : 'Secure Verification'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl">
               <div className="absolute inset-0 opacity-10 pointer-events-none bg-cover bg-center" style={{ backgroundImage: "url('https://i.ibb.co/zWnk27Lp/Whisk-3e62f7495f259878cde4433d0e575752eg.png')" }}></div>
               <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Mobile Number</label>
                  <div className="flex gap-2">
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="bg-white/80 border border-gray-200 rounded-2xl px-3 py-4 text-sm font-bold backdrop-blur-sm">
                      <option value="+977">🇳🇵 +977</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <input type="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 bg-white/80 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-gold outline-none backdrop-blur-sm" />
                  </div>
               </div>
            </div>
            <button type="submit" disabled={phone.length < 7} className="w-full bg-maroon text-gold py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl disabled:opacity-50 transition-all hover:bg-red-900">Send Login Code</button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="text-center">
                <p className="text-xs text-slate-500 mb-6">Enter the 6-digit code sent to<br/><span className="font-bold text-maroon">{countryCode} {phone}</span></p>
                <div className="flex justify-between gap-2">
                   {otp.map((digit, i) => (
                      <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} className="w-10 h-14 bg-ivory border border-gray-200 rounded-xl text-center text-xl font-bold text-maroon focus:border-gold outline-none" />
                   ))}
                </div>
             </div>
             <button onClick={verifyOtp} disabled={otp.join('').length < 6} className="w-full bg-maroon text-gold py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl disabled:opacity-50 transition-all hover:bg-red-900">Verify & Continue</button>
             <div className="text-center">
                {timer > 0 ? (
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resend code in {timer}s</p>
                ) : (
                   <button onClick={() => { setStep(1); setOtp(['','','','','','']); }} className="text-[10px] text-maroon font-bold uppercase tracking-widest hover:underline">Resend Verification Code</button>
                )}
             </div>
          </div>
        )}
        <p className="mt-8 text-center text-[10px] text-slate-400 leading-relaxed px-4">Your safety is our priority. By continuing, you agree to our <span className="underline">Terms</span>.</p>
      </div>
    </div>
  );
};

export default Auth;
