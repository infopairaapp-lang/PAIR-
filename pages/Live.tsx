
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// Manual base64 decoding following guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual base64 encoding following guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decodes raw PCM bytes to AudioBuffer manually
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Create a GenAI Blob object for audio streaming
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    // The supported audio MIME type is 'audio/pcm'.
    mimeType: 'audio/pcm;rate=16000',
  };
}

const Live: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const startStream = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Setup Audio Contexts
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await audioContextOutRef.current.resume();
      nextStartTimeRef.current = 0;

      // Initialize AI Live Session
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.debug("Co-Host connection established.");
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Solely rely on sessionPromise resolves to send realtime data
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              setIsAiSpeaking(true);
              const ctx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                ctx,
                24000,
                1,
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) setIsAiSpeaking(false);
              };

              // Explicitly schedule next start time for continuous playback
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              for (const source of activeSourcesRef.current.values()) {
                source.stop();
              }
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiSpeaking(false);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.debug('Live API Error:', e);
          },
          onclose: (e: CloseEvent) => {
            console.debug('Live API connection closed');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are the AI Co-Host for Siddharth on the Pairā marriage platform. Your role is to engage with the audience politely, moderate discussions to ensure they focus on serious marriage and cultural values, and provide helpful insights. Keep responses concise and supportive.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });

      sessionRef.current = await sessionPromise;
      setIsLive(true);
      setViewers(Math.floor(Math.random() * 20) + 15);
      setDuration(0);
    } catch (err) {
      console.error(err);
      alert("Hardware access required for live broadcasting.");
    } finally {
      setLoading(false);
    }
  };

  const handleSharePath = () => {
    const shareUrl = `${window.location.origin}/#/live-stream/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  const endStream = () => {
    setIsLive(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    sessionRef.current?.close();
  };

  useEffect(() => {
    let interval: any;
    if (isLive) interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="bg-slate-950 min-h-full flex flex-col p-6 pb-32">
      {/* Share Notification */}
      {showShareSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-gold text-maroon px-6 py-3 rounded-full font-bold text-xs shadow-2xl animate-in slide-in-from-top-4">
          Broadcast Path copied! Share this with your friend to test.
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full flex-1 grid lg:grid-cols-12 gap-8">
        
        {/* Main Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           <div className="relative aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 group">
              {!isLive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-maroon/20 to-black">
                   <div className="w-24 h-24 bg-maroon/30 rounded-full flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-gold animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                   </div>
                   <h2 className="serif text-5xl text-white font-bold mb-4 tracking-tight">Posh Broadcast</h2>
                   <p className="text-slate-400 lora italic text-lg max-w-md">Connect with intent. Your AI Co-Host 'Kore' is ready to assist your broadcast.</p>
                   <button 
                     onClick={startStream}
                     disabled={loading}
                     className="mt-12 bg-maroon text-gold px-12 py-5 rounded-[2rem] font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-105 transition-all"
                   >
                     {loading ? 'Powering Up...' : 'Initialize Live Suite'}
                   </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute top-8 left-8 flex gap-3">
                     <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-2 animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
                     </div>
                     <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest border border-white/10 uppercase">
                        {Math.floor(duration/60)}:{(duration%60).toString().padStart(2, '0')}
                     </div>
                     <button 
                        onClick={handleSharePath}
                        className="bg-gold text-maroon px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase hover:brightness-110 transition-all border border-white/20"
                      >
                        Share Path
                      </button>
                  </div>
                  <div className="absolute bottom-8 left-8 flex items-center gap-4 p-4 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10">
                     <div className="w-12 h-12 rounded-full border border-gold/50 overflow-hidden"><img src="https://picsum.photos/seed/me/100" className="w-full h-full object-cover" /></div>
                     <div><p className="text-white font-bold text-sm">Siddharth Thapa</p><p className="text-[9px] text-gold font-bold uppercase tracking-widest">Pokhara, Nepal</p></div>
                  </div>
                </>
              )}
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Viewers', val: isLive ? viewers : '0', color: 'text-white' },
                { label: 'Latency', val: isLive ? '14ms' : '--', color: 'text-green-500' },
                { label: 'Co-Host', val: isLive ? 'Connected' : 'Offline', color: isLive ? 'text-gold' : 'text-white/20' },
                { label: 'Bitrate', val: isLive ? '6.2 Mbps' : '0', color: 'text-white' }
              ].map((s, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                   <p className={`font-bold text-sm ${s.color}`}>{s.val}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Sidebar Interactions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 flex-1 flex flex-col overflow-hidden shadow-2xl min-h-[400px]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                 <div>
                    <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.3em]">AI Moderator</h3>
                    <p className="text-[9px] text-gold font-bold uppercase mt-1">Status: {isAiSpeaking ? 'Speaking' : 'Listening'}</p>
                 </div>
                 <div className="flex gap-1 h-6 items-end">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div 
                        key={i} 
                        className={`w-1 rounded-full transition-all duration-100 ${isAiSpeaking ? 'bg-gold' : 'bg-white/10'}`} 
                        style={{ height: isAiSpeaking ? `${Math.random() * 100}%` : '4px' }}
                      />
                    ))}
                 </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-6">
                 {isLive ? (
                   <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-gold/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-gold">AI</div><div><p className="text-gold text-[9px] font-bold uppercase tracking-widest">Kore (Co-Host)</p><p className="text-white/80 text-xs mt-1 leading-relaxed">Broadcast successfully initialized. Siddharth, the audience is waiting for your mountainside update!</p></div></div>
                      <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-ivory/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">Friend</div><div><p className="text-gold text-[9px] font-bold uppercase tracking-widest">Real Friend</p><p className="text-white/80 text-xs mt-1">Namaste! This local host test is looking sharp. Joining your path now!</p></div></div>
                      <div className="flex gap-4 opacity-50"><div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">MK</div><div><p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Manish K.</p><p className="text-white/80 text-xs mt-1">Great to see you live from Pokhara.</p></div></div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                      <svg className="w-16 h-16 text-white mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest">Connect stream to engage AI</p>
                   </div>
                 )}
              </div>

              {isLive && (
                <div className="p-8">
                   <button onClick={endStream} className="w-full bg-red-600/20 text-red-500 py-4 rounded-2xl border border-red-600/30 font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all">End Broadcast</button>
                </div>
              )}
           </div>

           <div className="bg-gold p-8 rounded-[3rem] shadow-xl">
              <div className="flex items-center gap-3 mb-4"><svg className="w-5 h-5 text-maroon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg><h4 className="text-maroon text-[10px] font-bold uppercase tracking-widest">Local-Host Multiuser</h4></div>
              <p className="text-maroon/70 text-[11px] leading-relaxed font-bold">This broadcast key allows other local participants to join your path. In a real-world scenario, this link would trigger a WebRTC handshake.</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Live;
