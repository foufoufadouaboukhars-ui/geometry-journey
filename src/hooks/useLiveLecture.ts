import { useCallback, useEffect, useRef, useState } from 'react';
import { AppSection, EraId } from '../types/geometry';

export type RoomPhase = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'podium';
export type StudentAccessMode = 'follow' | 'free' | 'kahoot';

export interface LectureControl {
  studentAccessMode: StudentAccessMode;
  currentSection: AppSection;
  currentEraId: EraId;
  presenterNote: string;
  submissionsLocked: boolean;
}

export interface PublicPlayer {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  streak: number;
  lastPoints: number;
  lastCorrect: boolean | null;
  connected: boolean;
  hasAnswered: boolean;
}

export interface RoomStatePayload {
  type: 'room_state';
  pin: string;
  role: 'host' | 'player';
  phase: RoomPhase;
  lectureControl: LectureControl;
  totalQuestions: number;
  currentQuestionIndex: number;
  questionStartTime: number;
  questionDurationMs: number;
  serverNow: number;
  question: {
    id: string;
    eraTag: string;
    question: string;
    options: [string, string, string, string];
    timeLimitSec: number;
    correctIndex?: number;
    explanation?: string;
  } | null;
  answeredCount: number;
  totalPlayers: number;
  players: PublicPlayer[];
  optionCounts?: number[];
  me?: {
    id: string;
    name: string;
    avatarColor: string;
    score: number;
    streak: number;
    lastPoints: number;
    lastCorrect: boolean | null;
    selectedOption: number | null;
  };
}

export interface StoredLectureSession {
  pin: string;
  role: 'host' | 'player';
  hostToken?: string;
  playerId?: string;
  name?: string;
}

const SESSION_KEY = 'geometry_live_lecture_session_v2';
const STUDENT_LOCK_KEY = 'geometry_student_portal_lock_v1';

export function useLiveLecture(onPointsEarned?: (pts: number) => void) {
  const [urlPin] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get('pin') || '').replace(/\D/g, '').slice(0, 6);
    } catch {
      return '';
    }
  });

  const [urlLocked] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('student') === '1' ||
        params.get('role') === 'student' ||
        params.has('pin')
      );
    } catch {
      return false;
    }
  });

  const [isStudentPortal, setIsStudentPortal] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('student') === '1' || params.get('role') === 'student' || params.has('pin')) {
        window.sessionStorage.setItem(STUDENT_LOCK_KEY, '1');
        return true;
      }
      return window.sessionStorage.getItem(STUDENT_LOCK_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [session, setSession] = useState<StoredLectureSession | null>(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as StoredLectureSession) : null;
    } catch {
      return null;
    }
  });

  const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<StoredLectureSession | null>(session);
  const clockOffsetRef = useRef<number>(0);
  const lastCreditedRoundRef = useRef<string>('');
  const onPointsRef = useRef(onPointsEarned);

  useEffect(() => {
    onPointsRef.current = onPointsEarned;
  }, [onPointsEarned]);

  useEffect(() => {
    sessionRef.current = session;
    try {
      if (session) {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore
    }
  }, [session]);

  const sendMsg = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      setErrorMsg('جاري إعادة الاتصال بالخادم، حاول بعد لحظة...');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!alive) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws/kahoot`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!alive) return;
        setWsConnected(true);
        setErrorMsg(null);
        const cur = sessionRef.current;
        if (cur) {
          if (cur.role === 'host' && cur.hostToken) {
            ws.send(
              JSON.stringify({
                type: 'reattach_host',
                pin: cur.pin,
                hostToken: cur.hostToken,
              })
            );
          } else if (cur.role === 'player' && cur.playerId) {
            ws.send(
              JSON.stringify({
                type: 'join_room',
                pin: cur.pin,
                playerId: cur.playerId,
                name: cur.name || '',
              })
            );
          }
        }
      };

      ws.onmessage = (evt) => {
        if (!alive) return;
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(String(evt.data)) as Record<string, unknown>;
        } catch {
          return;
        }

        const msgType = String(data.type || '');
        if (msgType === 'error_msg') {
          const text = String(data.message || 'حدث خطأ في الاتصال بالغرفة.');
          setErrorMsg(text);
          if (
            text.includes('لم يتم العثور') ||
            text.includes('إخراجك') ||
            text.includes('أنهى الأستاذ')
          ) {
            setSession(null);
            setRoomState(null);
          }
          return;
        }

        if (msgType === 'room_created') {
          const next: StoredLectureSession = {
            pin: String(data.pin),
            role: 'host',
            hostToken: String(data.hostToken),
          };
          setSession(next);
          setIsStudentPortal(false);
          try {
            window.sessionStorage.removeItem(STUDENT_LOCK_KEY);
          } catch {
            // Ignore
          }
          setErrorMsg(null);
          return;
        }

        if (msgType === 'joined_room') {
          const next: StoredLectureSession = {
            pin: String(data.pin),
            role: 'player',
            playerId: String(data.playerId),
            name: sessionRef.current?.name || '',
          };
          setSession(next);
          setIsStudentPortal(true);
          try {
            window.sessionStorage.setItem(STUDENT_LOCK_KEY, '1');
          } catch {
            // Ignore
          }
          setErrorMsg(null);
          return;
        }

        if (msgType === 'room_state') {
          const state = data as unknown as RoomStatePayload;
          clockOffsetRef.current = state.serverNow - Date.now();
          setRoomState(state);
          setErrorMsg(null);

          if (
            state.role === 'player' &&
            state.phase === 'reveal' &&
            state.me &&
            state.me.lastPoints > 0 &&
            state.question
          ) {
            const roundKey = `${state.pin}-${state.question.id}`;
            if (lastCreditedRoundRef.current !== roundKey) {
              lastCreditedRoundRef.current = roundKey;
              onPointsRef.current?.(Math.round(state.me.lastPoints / 50));
            }
          }
        }
      };

      ws.onclose = () => {
        if (!alive) return;
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 1800);
      };
    };

    connect();
    return () => {
      alive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  // Server-synced countdown timer
  useEffect(() => {
    if (!roomState || roomState.phase !== 'question') {
      setRemainingSec(0);
      return;
    }
    const update = () => {
      const serverEstimatedNow = Date.now() + clockOffsetRef.current;
      const elapsed = serverEstimatedNow - roomState.questionStartTime;
      const leftMs = Math.max(0, roomState.questionDurationMs - elapsed);
      setRemainingSec(Math.ceil(leftMs / 1000));
    };
    update();
    const id = window.setInterval(update, 200);
    return () => window.clearInterval(id);
  }, [roomState]);

  const createRoom = useCallback(
    (opts?: {
      questionCount?: number;
      studentAccessMode?: StudentAccessMode;
      currentSection?: AppSection;
      currentEraId?: EraId;
    }) => {
      setErrorMsg(null);
      sendMsg({
        type: 'create_room',
        questionCount: opts?.questionCount ?? 8,
        studentAccessMode: opts?.studentAccessMode ?? 'follow',
        currentSection: opts?.currentSection ?? 'home',
        currentEraId: opts?.currentEraId ?? 'ancient',
      });
    },
    [sendMsg]
  );

  const joinRoom = useCallback(
    (pin: string, name: string) => {
      setErrorMsg(null);
      setSession({ pin, role: 'player', name });
      sendMsg({ type: 'join_room', pin, name });
    },
    [sendMsg]
  );

  const leaveRoom = useCallback(() => {
    if (session?.role === 'host' && session.hostToken) {
      sendMsg({
        type: 'host_end_session',
        pin: session.pin,
        hostToken: session.hostToken,
      });
    }
    setSession(null);
    setRoomState(null);
    setErrorMsg(null);
  }, [sendMsg, session]);

  const setLectureMode = useCallback(
    (update: Partial<LectureControl> & { questionCount?: number }) => {
      if (!session?.pin || !session.hostToken) return;
      sendMsg({
        type: 'host_set_lecture_mode',
        pin: session.pin,
        hostToken: session.hostToken,
        ...update,
      });
    },
    [sendMsg, session]
  );

  const toggleSubmissionsLock = useCallback(
    (locked: boolean) => {
      if (!session?.pin || !session.hostToken) return;
      sendMsg({
        type: 'host_toggle_lock',
        pin: session.pin,
        hostToken: session.hostToken,
        locked,
      });
    },
    [sendMsg, session]
  );

  const hostAction = useCallback(
    (
      action:
        | 'host_start_game'
        | 'host_reveal_now'
        | 'host_show_leaderboard'
        | 'host_next_question'
        | 'host_restart'
        | 'host_kick_player',
      extra?: Record<string, unknown>
    ) => {
      if (!session?.pin || !session.hostToken) return;
      sendMsg({
        type: action,
        pin: session.pin,
        hostToken: session.hostToken,
        ...extra,
      });
    },
    [sendMsg, session]
  );

  const submitAnswer = useCallback(
    (optionIndex: number) => {
      if (!session?.pin || !roomState?.me?.id) return;
      sendMsg({
        type: 'submit_answer',
        pin: session.pin,
        playerId: roomState.me.id,
        optionIndex,
      });
    },
    [sendMsg, session, roomState?.me?.id]
  );

  const enterStudentPortal = useCallback(() => {
    setIsStudentPortal(true);
    try {
      window.sessionStorage.setItem(STUDENT_LOCK_KEY, '1');
    } catch {
      // Ignore
    }
  }, []);

  const exitStudentPortalDemo = useCallback(() => {
    setIsStudentPortal(false);
    try {
      window.sessionStorage.removeItem(STUDENT_LOCK_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    urlPin,
    urlLocked,
    isStudentPortal,
    wsConnected,
    errorMsg,
    clearError: () => setErrorMsg(null),
    session,
    roomState,
    remainingSec,
    createRoom,
    joinRoom,
    leaveRoom,
    setLectureMode,
    toggleSubmissionsLock,
    hostAction,
    submitAnswer,
    enterStudentPortal,
    exitStudentPortalDemo,
  };
}
