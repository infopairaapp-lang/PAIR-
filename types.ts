
export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  education: string;
  profession: string;
  bio: string;
  intent: string;
  religion?: string;
  caste?: string;
  imageUrl: string;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  gallery: string[];
  interests: string[];
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  status: 'ringing' | 'connected' | 'ended';
  type: 'audio' | 'video';
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface Conversation {
  id: string;
  participant: UserProfile;
  lastMessage?: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'message' | 'verification';
  timestamp: string;
  read: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUrl?: string;
  likes: number;
  timestamp: string;
  isReel?: boolean;
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  viewerCount: number;
  isLive: boolean;
}
