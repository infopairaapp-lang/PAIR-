
import { UserProfile, VerificationStatus, Conversation } from './types';

export const COLORS = {
  MAROON: '#7A1F2B',
  GOLD: '#D4AF37',
  IVORY: '#FAF7F2',
  SLATE: '#4A4A4A'
};

export const LANDMARKS = {
  EVEREST: 'https://images.unsplash.com/photo-1544281679-53571501c23c?auto=format&fit=crop&q=80&w=1600',
  PASHUPATINATH: 'https://images.unsplash.com/photo-1578335503031-6e5453003260?auto=format&fit=crop&q=80&w=1600',
};

export const MOCK_PROFILES: UserProfile[] = [
  {
    id: '1',
    name: 'Anjali Sharma',
    age: 26,
    location: 'Kathmandu, Nepal',
    education: 'MBA in Finance',
    profession: 'Financial Analyst',
    bio: 'Looking for someone who values family traditions as much as modern growth. Passionate about trekking and Nepali literature.',
    intent: 'Marriage (within 1-2 years)',
    religion: 'Hindu',
    imageUrl: 'https://picsum.photos/seed/anjali/600/800',
    verificationStatus: VerificationStatus.VERIFIED,
    isVerified: true,
    gallery: ['https://picsum.photos/seed/1/400/600', 'https://picsum.photos/seed/2/400/600'],
    interests: ['Trekking', 'Cooking', 'Art']
  },
  {
    id: '2',
    name: 'Siddharth Thapa',
    age: 29,
    location: 'Pokhara, Nepal',
    education: 'B.E. Computer Engineering',
    profession: 'Software Architect',
    bio: 'Tech enthusiast with a love for mountains. I believe in mutual respect and growth in a partnership.',
    intent: 'Marriage (looking to settle soon)',
    religion: 'Buddhist',
    imageUrl: 'https://picsum.photos/seed/siddharth/600/800',
    verificationStatus: VerificationStatus.VERIFIED,
    isVerified: true,
    gallery: ['https://picsum.photos/seed/3/400/600'],
    interests: ['Coding', 'Cycling', 'Photography']
  },
  {
    id: '3',
    name: 'Priya Gurung',
    age: 24,
    location: 'Lalitpur, Nepal',
    education: 'BDS Dentistry',
    profession: 'Dentist',
    bio: 'Dedicated professional seeking a partner who is honest and kind-hearted.',
    intent: 'Marriage (intentional dating)',
    imageUrl: 'https://picsum.photos/seed/priya/600/800',
    verificationStatus: VerificationStatus.PENDING,
    isVerified: false,
    gallery: [],
    interests: ['Reading', 'Yoga']
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participant: MOCK_PROFILES[0],
    lastMessage: 'Namaste! I saw your profile and would love to talk about our shared interest in trekking.',
    timestamp: '2 hours ago',
    unreadCount: 1,
    messages: [
      { id: 'm1', senderId: '1', text: 'Namaste! I saw your profile and would love to talk about our shared interest in trekking.', timestamp: '10:30 AM' }
    ]
  },
  {
    id: 'c2',
    participant: MOCK_PROFILES[1],
    lastMessage: 'The mountains were beautiful today.',
    timestamp: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm2', senderId: 'me', text: 'Hi Siddharth, how was Pokhara?', timestamp: 'Yesterday' },
      { id: 'm3', senderId: '2', text: 'The mountains were beautiful today.', timestamp: 'Yesterday' }
    ]
  }
];
