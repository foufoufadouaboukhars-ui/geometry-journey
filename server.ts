import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KahootQuestion {
  id: string;
  eraTag: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  timeLimitSec: number;
  explanation: string;
}

const KAHOOT_BANK: KahootQuestion[] = [
  {
    id: 'k1',
    eraTag: 'الحضارة المصرية القديمة',
    question: 'ما النسبة الشهيرة التي استعملها المسّاحون المصريون في حبل العقد الـ 12 لصناعة زاوية قائمة؟',
    options: ['2 : 3 : 4', '3 : 4 : 5', '4 : 5 : 6', '5 : 6 : 7'],
    correctIndex: 1,
    timeLimitSec: 20,
    explanation: 'لأن 3² + 4² = 9 + 16 = 25 = 5²، فإن شد الحبل بأطوال 3 و4 و5 يضمن زاوية قائمة 90°.',
  },
  {
    id: 'k2',
    eraTag: 'الحضارة البابلية',
    question: 'أيّ لوح طيني بابلي يوثق 15 ثلاثية فيثاغورية قبل ولادة فيثاغورس بألف عام؟',
    options: ['لوح حمورابي', 'لوح بليمبتون 322', 'بردية ريند', 'مخطوطة سولبا'],
    correctIndex: 1,
    timeLimitSec: 20,
    explanation: 'اللوح الطيني بليمبتون 322 (نحو 1800 ق.م) دليل على براعة البابليين في الثلاثيات القائمة.',
  },
  {
    id: 'k3',
    eraTag: 'الهندسة عند الإغريق',
    question: 'وفق نظرية طاليس، ما قياس كل زاوية محيطية مرسومة على قطر الدائرة؟',
    options: ['45°', '60°', '90°', '120°'],
    correctIndex: 2,
    timeLimitSec: 20,
    explanation: 'الزاوية المحيطية تساوي نصف الزاوية المركزية للقطر (180° / 2 = 90°).',
  },
  {
    id: 'k4',
    eraTag: 'إقليدس وكتاب العناصر',
    question: 'كم مقالة (كتاباً) يتألف منها كتاب «العناصر / الأصول» لإقليدس؟',
    options: ['7 مقالات', '10 مقالات', '13 مقالة', '18 مقالة'],
    correctIndex: 2,
    timeLimitSec: 20,
    explanation: 'يتكون كتاب العناصر من 13 مقالة تغطي الهندسة المستوية والأعداد والمجسمات الأفلاطونية.',
  },
  {
    id: 'k5',
    eraTag: 'أرخميدس',
    question: 'ما النسبة بين حجم الكرة وحجم الأسطوانة المحيطة بها التي أوصى أرخميدس بنقشها على قبره؟',
    options: ['1 : 2', '2 : 3', '3 : 4', '4 : 5'],
    correctIndex: 1,
    timeLimitSec: 20,
    explanation: 'حجم الكرة (4/3)πr³ يساوي ثلثي حجم الأسطوانة المحيطة بها 2πr³.',
  },
  {
    id: 'k6',
    eraTag: 'الحضارة الإسلامية — البيروني',
    question: 'ماذا قاس أبو الريحان البيروني بدقة فاقت 99% من قمة جبل باستخدام زاوية انخفاض الأفق؟',
    options: ['سرعة الضوء', 'نصف قطر كوكب الأرض', 'ارتفاع الأهرامات', 'المسافة إلى القمر'],
    correctIndex: 1,
    timeLimitSec: 25,
    explanation: 'طبق البيروني المعادلة R = h·cos(θ) / (1 − cos(θ)) لحساب نصف قطر الأرض من جبل ناندانا.',
  },
  {
    id: 'k7',
    eraTag: 'الحضارة الإسلامية — الخيام',
    question: 'كيف حلّ عمر الخيام المعادلات الجبرية التكعيبية مثل x³ + a²x = a²b؟',
    options: [
      'عبر تقاطع القطوع المخروطية',
      'بالتفاضل والتكامل',
      'باستخدام الأعداد المركبة',
      'بالمصفوفات الخطية',
    ],
    correctIndex: 0,
    timeLimitSec: 25,
    explanation: 'استخدم عمر الخيام تقاطع القطع المكافئ والدائرة والقطع الزائد لإيجاد الجذور هندسياً.',
  },
  {
    id: 'k8',
    eraTag: 'عصر النهضة',
    question: 'من رسم 60 لوحة مفرغة للمجسمات المنتظمة في كتاب «النسبة الإلهية»؟',
    options: ['رينيه ديكارت', 'ليوناردو دافنشي', 'بيير دي فيرما', 'نيكول أورسم'],
    correctIndex: 1,
    timeLimitSec: 20,
    explanation: 'تعاون ليوناردو دافنشي مع لوكا باتشولي وأبدع أول رسوم مجسمة مفرغة الإطار.',
  },
  {
    id: 'k9',
    eraTag: 'العصر الحديث',
    question: 'في أي عام نشر رينيه ديكارت كتابه «الهندسة» مؤسساً نظام الإحداثيات الديكارتية؟',
    options: ['1509 م', '1637 م', '1760 م', '1829 م'],
    correctIndex: 1,
    timeLimitSec: 20,
    explanation: 'نُشر كتاب La Géométrie عام 1637م فوحد الجبر والهندسة في مستوي الإحداثيات (x, y).',
  },
  {
    id: 'k10',
    eraTag: 'الهندسة اللاإقليدية',
    question: 'في الهندسة الزائدية للوباتشيفسكي (انحناء سالب)، كيف يكون مجموع زوايا المثلث؟',
    options: ['يساوي 180°', 'أكبر من 180°', 'أصغر من 180°', 'يساوي 360°'],
    correctIndex: 2,
    timeLimitSec: 20,
    explanation: 'في الفضاء الزائدي (شكل السرج)، تنكمش زوايا المثلث فيكون مجموعها أقل من 180° دائماً.',
  },
  {
    id: 'k11',
    eraTag: 'المجسمات الأفلاطونية',
    question: 'ما قيمة التعبير (V − E + F) في صيغة أويلر لأي مجسم منتظم محدب؟',
    options: ['0', '1', '2', '4'],
    correctIndex: 2,
    timeLimitSec: 20,
    explanation: 'صيغة أويلر الخالدة تنص على أن عدد الرؤوس ناقص الأحرف زائد الأوجه يساوي 2 دائماً.',
  },
  {
    id: 'k12',
    eraTag: 'الهندسة المعاصرة',
    question: 'من العالم الذي وضع هندسة المتعددات المنحنية (1854 م) التي اعتمدتها النسبية العامة؟',
    options: ['برنهارد ريمان', 'جيرار ديسارغ', 'ثابت بن قرة', 'غاسبار مونج'],
    correctIndex: 0,
    timeLimitSec: 20,
    explanation: 'مهدت هندسة برنهارد ريمان وموتر القياس المتري ds² الطريق أمام نظرية أينشتاين للجاذبية.',
  },
];

type RoomPhase = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'podium';
type StudentAccessMode = 'follow' | 'free' | 'kahoot';

interface LectureControl {
  studentAccessMode: StudentAccessMode;
  currentSection: string;
  currentEraId: string;
  presenterNote: string;
  submissionsLocked: boolean;
}

interface Player {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  streak: number;
  lastPoints: number;
  lastCorrect: boolean | null;
  connected: boolean;
  ws: WebSocket | null;
}

interface Room {
  pin: string;
  hostToken: string;
  hostWs: WebSocket | null;
  phase: RoomPhase;
  lectureControl: LectureControl;
  questions: KahootQuestion[];
  currentQuestionIndex: number;
  questionStartTime: number;
  questionDurationMs: number;
  answers: Map<
    string,
    { optionIndex: number; pointsAwarded: number; isCorrect: boolean }
  >;
  players: Map<string, Player>;
  timerHandle: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

const rooms = new Map<string, Room>();

const AVATAR_COLORS = [
  '#C8972C',
  '#38BDF8',
  '#34D399',
  '#F472B6',
  '#A78BFA',
  '#FB923C',
];

function generatePin(): string {
  let pin = '';
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(pin));
  return pin;
}

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeSend(ws: WebSocket | null, payload: unknown) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    // Ignore socket write errors
  }
}

function buildPublicPlayers(room: Room) {
  return Array.from(room.players.values())
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      score: p.score,
      streak: p.streak,
      lastPoints: p.lastPoints,
      lastCorrect: p.lastCorrect,
      connected: p.connected,
      hasAnswered: room.answers.has(p.id),
    }))
    .sort((a, b) => b.score - a.score);
}

function broadcastRoomState(room: Room) {
  const q = room.questions[room.currentQuestionIndex] || null;
  const playersSummary = buildPublicPlayers(room);

  const optionCounts = [0, 0, 0, 0];
  room.answers.forEach((ans) => {
    if (ans.optionIndex >= 0 && ans.optionIndex < 4) {
      optionCounts[ans.optionIndex] += 1;
    }
  });

  const revealSafeQuestion = q
    ? {
        id: q.id,
        eraTag: q.eraTag,
        question: q.question,
        options: q.options,
        timeLimitSec: q.timeLimitSec,
        ...(room.phase === 'reveal' ||
        room.phase === 'leaderboard' ||
        room.phase === 'podium'
          ? { correctIndex: q.correctIndex, explanation: q.explanation }
          : {}),
      }
    : null;

  const basePayload = {
    type: 'room_state',
    pin: room.pin,
    phase: room.phase,
    lectureControl: room.lectureControl,
    totalQuestions: room.questions.length,
    currentQuestionIndex: room.currentQuestionIndex,
    questionStartTime: room.questionStartTime,
    questionDurationMs: room.questionDurationMs,
    serverNow: Date.now(),
    question: revealSafeQuestion,
    answeredCount: room.answers.size,
    totalPlayers: room.players.size,
    players: playersSummary,
    optionCounts:
      room.phase === 'reveal' || room.phase === 'leaderboard'
        ? optionCounts
        : undefined,
  };

  safeSend(room.hostWs, { ...basePayload, role: 'host' });

  room.players.forEach((player) => {
    const playerAnswer = room.answers.get(player.id);
    safeSend(player.ws, {
      ...basePayload,
      role: 'player',
      me: {
        id: player.id,
        name: player.name,
        avatarColor: player.avatarColor,
        score: player.score,
        streak: player.streak,
        lastPoints: player.lastPoints,
        lastCorrect: player.lastCorrect,
        selectedOption: playerAnswer ? playerAnswer.optionIndex : null,
      },
    });
  });
}

function moveToReveal(room: Room) {
  if (room.phase !== 'question') return;
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
  room.phase = 'reveal';
  room.players.forEach((p) => {
    if (!room.answers.has(p.id)) {
      p.streak = 0;
      p.lastPoints = 0;
      p.lastCorrect = false;
    }
  });
  broadcastRoomState(room);
}

function startQuestion(room: Room, index: number) {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
  if (index >= room.questions.length) {
    room.phase = 'podium';
    broadcastRoomState(room);
    return;
  }
  room.lectureControl.studentAccessMode = 'kahoot';
  room.lectureControl.submissionsLocked = false;
  room.currentQuestionIndex = index;
  room.phase = 'question';
  room.answers.clear();
  room.players.forEach((p) => {
    p.lastPoints = 0;
    p.lastCorrect = null;
  });

  const q = room.questions[index];
  room.questionStartTime = Date.now();
  room.questionDurationMs = q.timeLimitSec * 1000;

  room.timerHandle = setTimeout(() => {
    moveToReveal(room);
  }, room.questionDurationMs + 250);

  broadcastRoomState(room);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeRooms: rooms.size });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/kahoot' });

  wss.on('connection', (ws) => {
    let boundPin: string | null = null;
    let boundRole: 'host' | 'player' | null = null;
    let boundPlayerId: string | null = null;

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'create_room') {
        const requestedCount = Number(msg.questionCount) || 8;
        const count = Math.max(4, Math.min(KAHOOT_BANK.length, requestedCount));
        const pin = generatePin();
        const hostToken = generateId('host');
        const initialMode =
          msg.studentAccessMode === 'follow' ||
          msg.studentAccessMode === 'free' ||
          msg.studentAccessMode === 'kahoot'
            ? msg.studentAccessMode
            : 'kahoot';

        const room: Room = {
          pin,
          hostToken,
          hostWs: ws,
          phase: 'lobby',
          lectureControl: {
            studentAccessMode: initialMode,
            currentSection: String(msg.currentSection || 'home'),
            currentEraId: String(msg.currentEraId || 'ancient'),
            presenterNote: String(msg.presenterNote || ''),
            submissionsLocked: false,
          },
          questions: KAHOOT_BANK.slice(0, count),
          currentQuestionIndex: 0,
          questionStartTime: 0,
          questionDurationMs: 20000,
          answers: new Map(),
          players: new Map(),
          timerHandle: null,
          createdAt: Date.now(),
        };
        rooms.set(pin, room);
        boundPin = pin;
        boundRole = 'host';

        safeSend(ws, { type: 'room_created', pin, hostToken });
        broadcastRoomState(room);
        return;
      }

      if (type === 'reattach_host') {
        const pin = String(msg.pin || '').trim();
        const hostToken = String(msg.hostToken || '').trim();
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) {
          safeSend(ws, {
            type: 'error_msg',
            message: 'لم يتم العثور على الغرفة أو انتهت الجلسة.',
          });
          return;
        }
        room.hostWs = ws;
        boundPin = pin;
        boundRole = 'host';
        broadcastRoomState(room);
        return;
      }

      if (type === 'join_room') {
        const pin = String(msg.pin || '').trim();
        const name = String(msg.name || '').trim().slice(0, 24);
        const existingPlayerId = msg.playerId ? String(msg.playerId) : '';
        const room = rooms.get(pin);

        if (!room) {
          safeSend(ws, {
            type: 'error_msg',
            message: 'رمز الغرفة غير صحيح أو لم تبدأ الجلسة بعد.',
          });
          return;
        }

        if (!name && !existingPlayerId) {
          safeSend(ws, {
            type: 'error_msg',
            message: 'الرجاء إدخال اسمك قبل الانضمام.',
          });
          return;
        }

        if (existingPlayerId && room.players.has(existingPlayerId)) {
          const existing = room.players.get(existingPlayerId)!;
          existing.ws = ws;
          existing.connected = true;
          if (name) existing.name = name;
          boundPin = pin;
          boundRole = 'player';
          boundPlayerId = existing.id;
          safeSend(ws, {
            type: 'joined_room',
            pin,
            playerId: existing.id,
          });
          broadcastRoomState(room);
          return;
        }

        const playerId = generateId('plr');
        const avatarColor =
          AVATAR_COLORS[room.players.size % AVATAR_COLORS.length];

        const player: Player = {
          id: playerId,
          name: name || `طالب ${room.players.size + 1}`,
          avatarColor,
          score: 0,
          streak: 0,
          lastPoints: 0,
          lastCorrect: null,
          connected: true,
          ws,
        };
        room.players.set(playerId, player);
        boundPin = pin;
        boundRole = 'player';
        boundPlayerId = playerId;

        safeSend(ws, { type: 'joined_room', pin, playerId });
        broadcastRoomState(room);
        return;
      }

      if (type === 'host_set_lecture_mode') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;

        if (
          msg.studentAccessMode === 'follow' ||
          msg.studentAccessMode === 'free' ||
          msg.studentAccessMode === 'kahoot'
        ) {
          room.lectureControl.studentAccessMode = msg.studentAccessMode;
        }
        if (typeof msg.currentSection === 'string') {
          room.lectureControl.currentSection = msg.currentSection;
        }
        if (typeof msg.currentEraId === 'string') {
          room.lectureControl.currentEraId = msg.currentEraId;
        }
        if (typeof msg.presenterNote === 'string') {
          room.lectureControl.presenterNote = msg.presenterNote.slice(0, 220);
        }
        if (typeof msg.questionCount === 'number' && room.phase === 'lobby') {
          const count = Math.max(4, Math.min(KAHOOT_BANK.length, msg.questionCount));
          room.questions = KAHOOT_BANK.slice(0, count);
        }
        broadcastRoomState(room);
        return;
      }

      if (type === 'host_toggle_lock') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        room.lectureControl.submissionsLocked = Boolean(msg.locked);
        broadcastRoomState(room);
        return;
      }

      if (type === 'host_start_game') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        startQuestion(room, 0);
        return;
      }

      if (type === 'host_reveal_now') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        moveToReveal(room);
        return;
      }

      if (type === 'host_show_leaderboard') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        if (room.currentQuestionIndex + 1 >= room.questions.length) {
          room.phase = 'podium';
        } else {
          room.phase = 'leaderboard';
        }
        broadcastRoomState(room);
        return;
      }

      if (type === 'host_next_question') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        startQuestion(room, room.currentQuestionIndex + 1);
        return;
      }

      if (type === 'host_restart') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        if (room.timerHandle) {
          clearTimeout(room.timerHandle);
          room.timerHandle = null;
        }
        room.phase = 'lobby';
        room.lectureControl.submissionsLocked = false;
        room.currentQuestionIndex = 0;
        room.answers.clear();
        room.players.forEach((p) => {
          p.score = 0;
          p.streak = 0;
          p.lastPoints = 0;
          p.lastCorrect = null;
        });
        broadcastRoomState(room);
        return;
      }

      if (type === 'host_end_session') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        if (room.timerHandle) clearTimeout(room.timerHandle);
        room.players.forEach((p) => {
          safeSend(p.ws, {
            type: 'error_msg',
            message: 'أنهى الأستاذ الجلسة المباشرة. شكراً لمشاركتكم!',
          });
        });
        rooms.delete(pin);
        return;
      }

      if (type === 'host_kick_player') {
        const pin = String(msg.pin || '');
        const hostToken = String(msg.hostToken || '');
        const targetId = String(msg.playerId || '');
        const room = rooms.get(pin);
        if (!room || room.hostToken !== hostToken) return;
        const target = room.players.get(targetId);
        if (target) {
          safeSend(target.ws, {
            type: 'error_msg',
            message: 'تم إخراجك من الغرفة بواسطة مقدّم المسابقة.',
          });
          room.players.delete(targetId);
          room.answers.delete(targetId);
          broadcastRoomState(room);
        }
        return;
      }

      if (type === 'submit_answer') {
        const pin = String(msg.pin || '');
        const playerId = String(msg.playerId || '');
        const optionIndex = Number(msg.optionIndex);
        const room = rooms.get(pin);
        if (
          !room ||
          room.phase !== 'question' ||
          room.lectureControl.submissionsLocked
        ) {
          return;
        }
        const player = room.players.get(playerId);
        if (!player || room.answers.has(playerId)) return;
        if (optionIndex < 0 || optionIndex > 3) return;

        const q = room.questions[room.currentQuestionIndex];
        const isCorrect = optionIndex === q.correctIndex;
        const elapsed = Math.max(0, Date.now() - room.questionStartTime);
        const remainingRatio = Math.max(
          0,
          1 - elapsed / room.questionDurationMs
        );

        let pointsAwarded = 0;
        if (isCorrect) {
          player.streak += 1;
          const speedScore = Math.round(500 + 500 * remainingRatio);
          const streakBonus = Math.min(300, (player.streak - 1) * 100);
          pointsAwarded = speedScore + streakBonus;
          player.score += pointsAwarded;
        } else {
          player.streak = 0;
        }
        player.lastPoints = pointsAwarded;
        player.lastCorrect = isCorrect;

        room.answers.set(playerId, {
          optionIndex,
          pointsAwarded,
          isCorrect,
        });

        const connectedCount = Array.from(room.players.values()).filter(
          (p) => p.connected
        ).length;
        if (connectedCount > 0 && room.answers.size >= connectedCount) {
          moveToReveal(room);
        } else {
          broadcastRoomState(room);
        }
      }
    });

    ws.on('close', () => {
      if (!boundPin) return;
      const room = rooms.get(boundPin);
      if (!room) return;
      if (boundRole === 'player' && boundPlayerId) {
        const p = room.players.get(boundPlayerId);
        if (p) {
          p.connected = false;
          p.ws = null;
          broadcastRoomState(room);
        }
      } else if (boundRole === 'host' && room.hostWs === ws) {
        room.hostWs = null;
      }
    });
  });

  setInterval(() => {
    const cutoff = Date.now() - 6 * 60 * 60 * 1000;
    rooms.forEach((room, pin) => {
      if (room.createdAt < cutoff) {
        if (room.timerHandle) clearTimeout(room.timerHandle);
        rooms.delete(pin);
      }
    });
  }, 15 * 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
