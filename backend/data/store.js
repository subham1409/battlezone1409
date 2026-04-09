/**
 * In-Memory Data Store
 * Acts as the "database" — replace with MongoDB if needed.
 * All data resets when the server restarts.
 */

// ─── ID Counters ─────────────────────────────────────────────
let tournamentIdCounter = 100;
let registrationIdCounter = 1;
let chatIdCounter = 10;
let resultIdCounter = 10;

// ─── Admin Credentials ────────────────────────────────────────
// In production, use bcrypt + environment variables
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'battlezone@123'  // Change this!
};

// ─── JWT Secret ───────────────────────────────────────────────
const JWT_SECRET = 'bgmi-battlezone-secret-2024';

// ─── Tournaments ──────────────────────────────────────────────
let tournaments = [
  {
    id: 1,
    num: '#T-001',
    name: 'BATTLEZONE OPEN',
    date: 'Ap, 2025',
    time: '8:00 PM',
    map: 'Erangel',
    fee: '₹50',
    prize: '₹5,000',
    slots: 14,
    total: 25,
    status: 'open',
    createdAt: new Date('2025-04-01').toISOString()
  },
  {
    id: 2,
    num: '#T-002',
    name: 'ERANGEL CHAMPIONSHIP',
    date: 'Apr 15, 2025',
    time: '7:00 PM',
    map: 'Erangel',
    fee: '₹100',
    prize: '₹10,000',
    slots: 20,
    total: 25,
    status: 'upcoming',
    createdAt: new Date('2025-04-02').toISOString()
  },
  {
    id: 3,
    num: '#T-003',
    name: 'MIRAMAR MAYHEM',
    date: 'Apr 10, 2025',
    time: '9:00 PM',
    map: 'Miramar',
    fee: '₹75',
    prize: '₹7,500',
    slots: 25,
    total: 25,
    status: 'full',
    createdAt: new Date('2025-04-03').toISOString()
  }
];

// ─── Registrations ────────────────────────────────────────────
let registrations = [
  {
    id: 1,
    tournamentId: 1,
    tournamentName: 'BATTLEZONE OPEN',
    teamName: 'Ghost Legion',
    players: ['ShadowX', 'NightOwl99', 'KillZone', 'StormBringer'],
    registeredAt: new Date('2025-04-05').toISOString(),
    status: 'confirmed'
  },
  {
    id: 2,
    tournamentId: 1,
    tournamentName: 'BATTLEZONE OPEN',
    teamName: 'Iron Squad',
    players: ['IronFist', 'SteelNerve', 'BlastZone', 'RocketPunch'],
    registeredAt: new Date('2025-04-06').toISOString(),
    status: 'confirmed'
  }
];

// ─── Chat Messages ────────────────────────────────────────────
let chatMessages = [
  { id: 1, user: 'KillZone99', color: '#00c97a', initials: 'KZ', text: 'Let\'s go! BATTLEZONE is LIVE 🔥', time: '7:00 PM', own: false, createdAt: new Date().toISOString() },
  { id: 2, user: 'ShadowX', color: '#ff4488', initials: 'SX', text: 'Ghost Legion is ready. See you in the zone! 💀', time: '7:01 PM', own: false, createdAt: new Date().toISOString() },
  { id: 3, user: 'BattleKing', color: '#4488ff', initials: 'BK', text: 'Who\'s playing tonight? Squad up! 🎮', time: '7:02 PM', own: false, createdAt: new Date().toISOString() }
];

// ─── Results & Leaderboards ───────────────────────────────────
let results = [
  {
    id: 1,
    name: 'BATTLEZONE WEEKLY #12',
    date: 'Apr 5, 2025',
    map: 'Erangel',
    winner: 'Ghost Legion',
    teams: 25,
    kills: '47 kills',
    prize: '₹5,000',
    lb: [
      { r: 1, team: 'Ghost Legion', players: 'ShadowX, NightOwl99, KillZone, StormBringer', kills: 47 },
      { r: 2, team: 'Iron Squad', players: 'IronFist, SteelNerve, BlastZone, RocketPunch', kills: 38 },
      { r: 3, team: 'Silent Wolves', players: 'FrostByte, Phantom, Viper, Eclipse', kills: 31 },
      { r: 4, team: 'Alpha Strike', players: 'AlphaOne, DeathMark, Shockwave, Rampage', kills: 27 }
    ]
  }
];

// ─── Helper: Get Next ID ──────────────────────────────────────
const getNextTournamentId = () => ++tournamentIdCounter;
const getNextRegistrationId = () => ++registrationIdCounter;
const getNextChatId = () => ++chatIdCounter;
const getNextResultId = () => ++resultIdCounter;

module.exports = {
  ADMIN_CREDENTIALS,
  JWT_SECRET,
  tournaments,
  registrations,
  chatMessages,
  results,
  getNextTournamentId,
  getNextRegistrationId,
  getNextChatId,
  getNextResultId
};
