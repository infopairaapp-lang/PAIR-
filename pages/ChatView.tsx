import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GoogleGenAI, Modality } from '@google/genai';
import { MOCK_CONVERSATIONS } from '../constants';
import { ChatMessage, Conversation, CallSession } from '../types';

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

  // Fix: Loop through numChannels instead of using the undefined channelData.length
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  
  const [isCalling, setIsCalling] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [peerJoined, setPeerJoined] = useState(false);
  const [showInviteToast, setShowInviteToast] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<any[]>([]); // Use any[] to avoid potential conflict with GenAI Blob interface
  const recordIntervalRef = useRef<number | null>(null);
  
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioNativeRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callIntervalRef = useRef<number | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const locationMenuRef = useRef<HTMLDivElement>(null);

  const syncChat = () => {
    const localConvs = JSON.parse(localStorage.getItem('paira_conversations') || '[]');
    const allConvs = [...localConvs, ...MOCK_CONVERSATIONS];
    const found = allConvs.find(c => c.id === id);
    if (found) {
      setConversation(found);
      if (found.messages.length !== messages.length) {
        setMessages(found.messages || []);
      }
    }

    // Call Signaling Sync
    const callData = localStorage.getItem('paira_active_call');
    if (callData) {
      const call: CallSession = JSON.parse(callData);
      if (call.id === id) {
        if (call.status === 'connected' && !peerJoined) {
          setPeerJoined(true);
        } else if (call.status === 'ended') {
          endCall(false);
        }
      }
    }
  };

  useEffect(() => {
    syncChat();
    window.addEventListener('storage', syncChat);
    const interval = setInterval(syncChat, 1000);
    return () => {
      window.removeEventListener('storage', syncChat);
      clearInterval(interval);
    };
  }, [id, messages.length, peerJoined]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target as Node)) {
        setShowLocationOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const handleTTS = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      currentAudioSourceRef.current?.stop();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(msgId);
    try {
      const ctx = await initAudioContext();
      // Always use process.env.API_KEY directly for GenAI client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a polite, calm, and dignified voice suitable for a marriage platform: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setPlayingAudioId(null);
        currentAudioSourceRef.current = source;
        source.start(0);
      }
    } catch (err) {
      console.error("TTS failed", err);
      setPlayingAudioId(null);
    }
  };

  const playVoiceNote = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioNativeRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioNativeRef.current) {
      audioNativeRef.current.pause();
    }
    const audio = new Audio(url);
    audioNativeRef.current = audio;
    audio.play();
    setPlayingAudioId(msgId);
    audio.onended = () => setPlayingAudioId(null);
  };

  const handleCopyInvite = () => {
    const inviteLink = window.location.href;
    navigator.clipboard.writeText(inviteLink);
    setShowInviteToast(true);
    setTimeout(() => setShowInviteToast(false), 3000);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-ivory text-maroon animate-pulse p-10 text-center">
        <div className="w-16 h-16 border-4 border-gold border-t-maroon rounded-full animate-spin mb-6"></div>
        <h2 className="serif text-2xl font-bold">Securing Private Link...</h2>
        <p className="lora italic text-sm text-slate-500 mt-2">Connecting through Nepal's encrypted gateway.</p>
      </div>
    );
  }

  const persistMessage = (newMessages: ChatMessage[]) => {
    const localConvs = JSON.parse(localStorage.getItem('paira_conversations') || '[]');
    const existingIdx = localConvs.findIndex((c: Conversation) => c.id === id);
    let updatedConvs;
    if (existingIdx > -1) {
      updatedConvs = [...localConvs];
      updatedConvs[existingIdx] = { ...updatedConvs[existingIdx], messages: newMessages, lastMessage: newMessages[newMessages.length - 1].text || (newMessages[newMessages.length - 1].location ? 'Location shared' : 'Media message'), timestamp: 'Just now' };
    } else {
      updatedConvs = [...localConvs, { ...conversation, messages: newMessages, lastMessage: newMessages[newMessages.length - 1].text || (newMessages[newMessages.length - 1].location ? 'Location shared' : 'Media message'), timestamp: 'Just now' }];
    }
    localStorage.setItem('paira_conversations', JSON.stringify(updatedConvs));
    setMessages(newMessages);
    window.dispatchEvent(new Event('storage'));
  };

  const addMessage = (msg: ChatMessage) => {
    const updated = [...messages, msg];
    persistMessage(updated);
    if (msg.senderId === 'me') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const reply: ChatMessage = { id: Date.now().toString(), senderId: conversation.participant.id, text: "I appreciate your message. Let's grow this connection.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        persistMessage([...updated, reply]);
      }, 3000);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new window.Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => addMessage({ id: Date.now().toString(), senderId: 'me', audioUrl: reader.result as string, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordIntervalRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch (err) { alert("Mic required."); }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
  };

  const handleShareLocation = (isLive: boolean = false) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsSharingLocation(true);
    setShowLocationOptions(false);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const expiry = isLive ? Date.now() + (60 * 60 * 1000) : undefined;
        
        addMessage({
          id: Date.now().toString(),
          senderId: 'me',
          location: { latitude, longitude },
          ...({ isLive, expiresAt: expiry } as any),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setIsSharingLocation(false);
      },
      (error) => {
        console.error("Error sharing location:", error);
        alert("Unable to retrieve your location.");
        setIsSharingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const startCall = async (video: boolean) => {
    setIsCalling(true);
    setIsVideoCall(video);
    setCallDuration(0);
    setPeerJoined(false);
    
    // Register the call in localStorage for cross-tab simulation
    const call: CallSession = {
      id: id!,
      callerId: 'me',
      callerName: 'Siddharth Thapa', // Current user
      calleeId: conversation.participant.id,
      status: 'ringing',
      type: video ? 'video' : 'audio',
      timestamp: Date.now()
    };
    localStorage.setItem('paira_active_call', JSON.stringify(call));
    window.dispatchEvent(new Event('storage'));

    callIntervalRef.current = window.setInterval(() => setCallDuration(p => p + 1), 1000);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: video });
      mediaStreamRef.current = s;
      if (video && localVideoRef.current) localVideoRef.current.srcObject = s;
    } catch (err) { endCall(); }
  };

  const endCall = (explicit: boolean = true) => {
    setIsCalling(false);
    setPeerJoined(false);
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    
    if (explicit) {
      const callData = localStorage.getItem('paira_active_call');
      if (callData) {
        const call = JSON.parse(callData);
        localStorage.setItem('paira_active_call', JSON.stringify({ ...call, status: 'ended' }));
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => localStorage.removeItem('paira_active_call'), 1000);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    addMessage({ id: Date.now().toString(), senderId: 'me', text: newMessage, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full relative bg-ivory">
      {/* Invite Toast */}
      {showInviteToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gold text-maroon px-6 py-3 rounded-full font-bold text-xs shadow-2xl animate-in slide-in-from-top-4">
          Direct Path copied! Share this link with your friend to test cross-tab calling.
        </div>
      )}

      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shadow-sm z-30 sticky top-0">
        <div className="flex items-center gap-4">
          <Link to="/messages" className="text-slate-400 hover:text-maroon transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/30">
            <img src={conversation.participant.imageUrl} className="w-full h-full object-cover" alt="" />
          </div>
          <div>
            <h2 className="serif text-lg font-bold text-maroon">{conversation.participant.name}</h2>
            <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleCopyInvite}
            className="text-[10px] font-bold text-gold uppercase tracking-widest px-3 py-1.5 rounded-full border border-gold/20 hover:bg-gold/5 transition-all mr-2"
          >
            Copy Path Link
          </button>
          <button onClick={() => startCall(false)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-maroon transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
          <button onClick={() => startCall(true)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-maroon transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0">
        {messages.map((msg) => {
          const isLive = (msg as any).isLive;
          const expiresAt = (msg as any).expiresAt;
          const isExpired = expiresAt && Date.now() > expiresAt;
          
          return (
            <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] flex flex-col gap-1 relative group`}>
                <div 
                  className={`p-4 rounded-2xl shadow-sm transition-all ${msg.audioUrl ? 'cursor-pointer hover:brightness-95' : ''} ${msg.senderId === 'me' ? 'bg-maroon text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}
                  onClick={() => msg.audioUrl && playVoiceNote(msg.id, msg.audioUrl)}
                >
                  {msg.text && (
                    <div className="relative">
                      <p className="text-sm pr-6">{msg.text}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleTTS(msg.id, msg.text!); }}
                        className={`absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${playingAudioId === msg.id ? 'bg-gold text-maroon animate-pulse' : 'text-slate-300 hover:text-gold'}`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.657a1 1 0 01-1.414-1.414A6.001 6.001 0 0014 10a6 6 0 00-.757-2.906 1 1 0 111.714-1.033A8.001 8.001 0 0116 10a8.001 8.001 0 01-1.343 4.657z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  )}
                  {msg.audioUrl && (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                          {playingAudioId === msg.id ? (
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          ) : (
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                         <div className={`h-full bg-gold ${playingAudioId === msg.id ? 'animate-progress' : 'w-1/4'}`}></div>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Voice</span>
                    </div>
                  )}
                  {msg.location && (
                    <div className="flex flex-col gap-3 min-w-[220px]">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLive && !isExpired ? 'bg-gold/20 text-gold animate-pulse' : 'bg-gold/10 text-gold opacity-60'}`}>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${msg.senderId === 'me' ? 'text-gold' : 'text-maroon'}`}>
                            {isLive ? (isExpired ? 'Live Location (Ended)' : 'Live Location') : 'Current Location'}
                          </p>
                          <p className="text-[9px] opacity-60">Lat: {msg.location.latitude.toFixed(4)}, Lng: {msg.location.longitude.toFixed(4)}</p>
                        </div>
                        {isLive && !isExpired && (
                          <span className="ml-auto bg-gold text-maroon text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">LIVE</span>
                        )}
                      </div>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${msg.location.latitude},${msg.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-widest text-[9px] text-center transition-all ${msg.senderId === 'me' ? 'bg-gold text-maroon hover:bg-white' : 'bg-maroon text-gold hover:bg-red-900 shadow-sm'}`}
                      >
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase text-right px-1">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
        {isTyping && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl animate-pulse text-[10px] text-slate-400 font-bold uppercase tracking-widest">Typing...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-30">
        <form onSubmit={handleSend} className="flex gap-4 max-w-4xl mx-auto items-center">
          <div className="flex items-center gap-1 relative" ref={locationMenuRef}>
            <button 
              type="button" 
              onMouseDown={startRecording} 
              onMouseUp={stopRecording} 
              onMouseLeave={stopRecording} 
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110' : 'text-slate-300 hover:text-maroon hover:bg-ivory'}`}
              title="Record Voice Note"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
            <button 
              type="button" 
              onClick={() => setShowLocationOptions(!showLocationOptions)}
              disabled={isSharingLocation}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all text-slate-300 hover:text-maroon hover:bg-ivory ${isSharingLocation ? 'animate-pulse text-gold' : ''} ${showLocationOptions ? 'bg-ivory text-maroon' : ''}`}
              title="Location Options"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {showLocationOptions && (
              <div className="absolute bottom-14 left-0 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-[60] animate-in slide-in-from-bottom-2 duration-300">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest p-4 pb-2">Location Sharing</p>
                <button 
                  onClick={() => handleShareLocation(false)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-ivory rounded-2xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-maroon group-hover:text-gold transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-maroon">Current Location</p>
                    <p className="text-[9px] text-slate-400">Send static pin</p>
                  </div>
                </button>
                <button 
                  onClick={() => handleShareLocation(true)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-ivory rounded-2xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-gold group-hover:text-maroon transition-all">
                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.5 9.5 0 0113.436 0m-17.678-4.243a13.5 13.5 0 0119.092 0" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-maroon">Live Location</p>
                    <p className="text-[9px] text-slate-400">Share for 1 hour</p>
                  </div>
                </button>
              </div>
            )}
          </div>
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message with intent..." className="flex-1 bg-ivory border border-gray-100 rounded-full px-6 py-3 text-sm focus:outline-none focus:border-gold" />
          <button type="submit" disabled={!newMessage.trim()} className="w-11 h-11 bg-maroon text-gold rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-20">
            <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
      </div>

      {(isRecording || isSharingLocation) && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-maroon text-white px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-8">
           <div className="flex items-center gap-3">
              <div className={`w-3 h-3 ${isRecording ? 'bg-red-500' : 'bg-gold'} rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]`}></div>
              {isRecording && <p className="text-xs font-bold uppercase tracking-widest text-gold">{recordingDuration}s</p>}
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">
             {isRecording ? 'Recording Audio...' : 'Retrieving Location...'}
           </p>
        </div>
      )}

      {isCalling && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in fade-in duration-500">
           <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
              
              {/* Main Participant Area */}
              <div className="w-full h-full relative group">
                {peerJoined ? (
                  /* Friend joined simulated view */
                  <img src={conversation.participant.imageUrl} className="w-full h-full object-cover animate-in zoom-in duration-1000" alt="Friend" />
                ) : (
                  /* Waiting for friend */
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                    <img src={conversation.participant.imageUrl} className="w-32 h-32 rounded-full border-4 border-gold mx-auto mb-6 shadow-2xl object-cover animate-pulse" alt="" />
                    <h3 className="serif text-3xl font-bold text-white mb-2">Calling {conversation.participant.name}...</h3>
                    <p className="text-gold uppercase tracking-widest text-[10px] font-bold">Encrypted path established</p>
                    
                    <div className="mt-8 flex flex-col items-center gap-4">
                       <p className="text-white/40 text-xs max-w-xs lora italic text-center">Open this same path link in another tab or share with a friend to establish the bridge.</p>
                       <button onClick={handleCopyInvite} className="text-gold text-[10px] font-black uppercase tracking-widest border border-gold/30 px-6 py-2 rounded-full hover:bg-gold/10">Copy Link Again</button>
                    </div>
                  </div>
                )}

                {/* Local PiP View */}
                <div className={`absolute bottom-8 right-8 w-32 h-44 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl transition-all duration-700 ${isVideoCall ? 'scale-100' : 'scale-0'}`}>
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute top-2 right-2 bg-black/40 px-1.5 py-0.5 rounded text-[8px] text-white font-bold uppercase tracking-widest">You</div>
                </div>

                {/* UI Overlays */}
                <div className="absolute top-8 left-8 flex flex-col gap-2 z-10">
                  <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 border border-white/10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-[10px] font-bold tracking-widest uppercase">{Math.floor(callDuration/60)}:{(callDuration%60).toString().padStart(2, '0')}</span>
                  </div>
                  {peerJoined && (
                    <div className="bg-gold text-maroon px-4 py-2 rounded-full flex items-center gap-2 animate-in slide-in-from-left-4">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                      <span className="text-[10px] font-black tracking-widest uppercase">Secured Path</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interaction Controls */}
              <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8 z-20">
                 <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 </button>
                 <button onClick={() => endCall(true)} className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] active:scale-90 transition-all">
                   <svg className="w-10 h-10 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8c0 4.41-3.59 8-8 8zm4.5-12h-9c-.28 0-.5.22-.5.5s.22.5.5.5h9c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z"/></svg>
                 </button>
                 <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;