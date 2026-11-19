import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { ACTIVITIES_DATA } from '../data/activitiesData';
import {
  ActivityCategory,
  ActivityQuestion,
  TeamScore,
  UserProgress,
} from '../types/geometry';

import { RoomStatePayload, StudentAccessMode } from '../hooks/useLiveLecture';
import { AppSection, EraId } from '../types/geometry';
import { KahootArena } from './KahootArena';

interface ActivitiesSectionProps {
  progress: UserProgress;
  isStudentFreeMode?: boolean;
  wsConnected: boolean;
  errorMsg: string | null;
  onClearError: () => void;
  roomState: RoomStatePayload | null;
  remainingSec: number;
  currentSection: AppSection;
  currentEraId: EraId;
  onCreateRoom: (opts: {
    questionCount?: number;
    studentAccessMode?: StudentAccessMode;
    currentSection?: AppSection;
    currentEraId?: EraId;
  }) => void;
  onLeaveRoom: () => void;
  onHostAction: (
    action:
      | 'host_start_game'
      | 'host_reveal_now'
      | 'host_show_leaderboard'
      | 'host_next_question'
      | 'host_restart'
      | 'host_kick_player',
    extra?: Record<string, unknown>
  ) => void;
  onToggleSubmissionsLock: (locked: boolean) => void;
  onEnterStudentPortal: () => void;
  onPreviewStudentUi: () => void;
  onRecordActivity: (
    activityId: string,
    isCorrect: boolean,
    points: number
  ) => void;
}

const CATEGORIES: { id: 'all' | ActivityCategory; label: string }[] = [
  { id: 'all', label: 'جميع الأنشطة' },
  { id: 'mcq', label: 'اختيار من متعدد' },
  { id: 'true-false', label: 'صح أو خطأ' },
  { id: 'puzzle', label: 'ألغاز هندسية' },
  { id: 'scientists', label: 'تاريخ العلماء' },
  { id: 'math-challenge', label: 'تمارين وتحديات رياضية' },
];

const DEFAULT_TEAMS: TeamScore[] = [
  { id: 't1', name: 'فريق إقليدس', score: 0, correctCount: 0 },
  { id: 't2', name: 'فريق الخوارزمي', score: 0, correctCount: 0 },
  { id: 't3', name: 'فريق ابن الهيثم', score: 0, correctCount: 0 },
];

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  progress,
  isStudentFreeMode = false,
  wsConnected,
  errorMsg,
  onClearError,
  roomState,
  remainingSec,
  currentSection,
  currentEraId,
  onCreateRoom,
  onLeaveRoom,
  onHostAction,
  onToggleSubmissionsLock,
  onEnterStudentPortal,
  onPreviewStudentUi,
  onRecordActivity,
}) => {
  const [mode, setMode] = useState<'kahoot' | 'solo' | 'classroom'>(() =>
    isStudentFreeMode ? 'solo' : 'kahoot'
  );
  const [category, setCategory] = useState<'all' | ActivityCategory>('all');
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>(
    {}
  );
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>(
    {}
  );
  const [soloFeedback, setSoloFeedback] = useState<
    Record<string, { isCorrect: boolean; userDisplay: string }>
  >({});

  // Classroom Live Competition State
  const [teams, setTeams] = useState<TeamScore[]>(DEFAULT_TEAMS);
  const [roundCount, setRoundCount] = useState<number>(8);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'finished'>(
    'setup'
  );
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [activeTeamIdx, setActiveTeamIdx] = useState<number>(0);
  const [timerSec, setTimerSec] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [roundResult, setRoundResult] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [classroomNumeric, setClassroomNumeric] = useState<string>('');

  const filteredQuestions = useMemo(() => {
    if (category === 'all') return ACTIVITIES_DATA;
    return ACTIVITIES_DATA.filter((q) => q.category === category);
  }, [category]);

  const classroomQuestions = useMemo(() => {
    return ACTIVITIES_DATA.slice(0, roundCount);
  }, [roundCount]);

  useEffect(() => {
    if (gamePhase !== 'playing' || !timerRunning || roundResult) return;
    const id = window.setInterval(() => {
      setTimerSec((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [gamePhase, timerRunning, roundResult]);

  const handleSoloMcq = (q: ActivityQuestion, idx: number) => {
    if (soloFeedback[q.id]) return;
    const isCorrect = idx === q.correctAnswerIndex;
    setSoloFeedback((prev) => ({
      ...prev,
      [q.id]: { isCorrect, userDisplay: q.options?.[idx] || '' },
    }));
    onRecordActivity(q.id, isCorrect, q.points);
  };

  const handleSoloBoolean = (q: ActivityQuestion, val: boolean) => {
    if (soloFeedback[q.id]) return;
    const isCorrect = val === q.correctBoolean;
    setSoloFeedback((prev) => ({
      ...prev,
      [q.id]: { isCorrect, userDisplay: val ? 'صحيح' : 'خطأ' },
    }));
    onRecordActivity(q.id, isCorrect, q.points);
  };

  const handleSoloNumeric = (q: ActivityQuestion) => {
    if (soloFeedback[q.id]) return;
    const raw = (numericInputs[q.id] || '').trim();
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || q.numericAnswer === undefined) return;
    const tol = q.numericTolerance ?? 0.05;
    const isCorrect = Math.abs(parsed - q.numericAnswer) <= tol;
    setSoloFeedback((prev) => ({
      ...prev,
      [q.id]: { isCorrect, userDisplay: `${parsed} ${q.unit || ''}` },
    }));
    onRecordActivity(q.id, isCorrect, q.points);
  };

  // Classroom Competition Handlers
  const startClassroomGame = () => {
    setTeams((prev) =>
      prev.map((t) => ({ ...t, score: 0, correctCount: 0 }))
    );
    setCurrentQIdx(0);
    setActiveTeamIdx(0);
    setRoundResult(null);
    setClassroomNumeric('');
    setTimerSec(30);
    setTimerRunning(true);
    setGamePhase('playing');
  };

  const submitClassroomAnswer = (isCorrect: boolean, points: number, explanation: string) => {
    if (roundResult) return;
    setTimerRunning(false);
    setRoundResult({ isCorrect, explanation });
    if (isCorrect) {
      setTeams((prev) =>
        prev.map((t, i) =>
          i === activeTeamIdx
            ? {
                ...t,
                score: t.score + points,
                correctCount: t.correctCount + 1,
              }
            : t
        )
      );
    }
  };

  const nextClassroomTurn = () => {
    if (currentQIdx + 1 >= classroomQuestions.length) {
      setGamePhase('finished');
      return;
    }
    setCurrentQIdx((i) => i + 1);
    setActiveTeamIdx((t) => (t + 1) % teams.length);
    setRoundResult(null);
    setClassroomNumeric('');
    setTimerSec(30);
    setTimerRunning(true);
  };

  const addOrRemoveTeam = (count: number) => {
    const presets = [
      'فريق إقليدس',
      'فريق الخوارزمي',
      'فريق ابن الهيثم',
      'فريق ريمان',
    ];
    const next: TeamScore[] = [];
    for (let i = 0; i < count; i++) {
      next.push(
        teams[i] || {
          id: `t${i + 1}`,
          name: presets[i],
          score: 0,
          correctCount: 0,
        }
      );
    }
    setTeams(next);
  };

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => b.score - a.score),
    [teams]
  );

  const currentClassQ = classroomQuestions[currentQIdx];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Header Banner */}
      <div className="bg-[#0B172A] text-white border-b border-[#C8972C]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#EBD08A] font-medium mb-1">
                <Trophy className="w-4 h-4" />
                <span>الأنشطة التفاعلية ونظام النقاط</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-editorial">
                الأنشطة والمسابقات الجامعية
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                اختبر معرفتك الفردية عبر الألغاز والتمارين المصححة، أو شغّل وضع
                المسابقة الجماعية المباشرة بين فرق الطلبة داخل المدرج الجامعي.
              </p>
            </div>

            {/* Mode Switcher */}
            {!isStudentFreeMode && (
              <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setMode('kahoot')}
                  className={`min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                    mode === 'kahoot'
                      ? 'bg-[#C8972C] text-[#0B172A]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>تحدي كاهووت المباشر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('solo')}
                  className={`min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                    mode === 'solo'
                      ? 'bg-[#C8972C] text-[#0B172A]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>التدريب الفردي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('classroom')}
                  className={`min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                    mode === 'classroom'
                      ? 'bg-[#C8972C] text-[#0B172A]'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>فرق القاعة (شاشة واحدة)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ================= KAHOOT LIVE MULTIPLAYER MODE ================= */}
        {mode === 'kahoot' && !isStudentFreeMode && (
          <KahootArena
            wsConnected={wsConnected}
            errorMsg={errorMsg}
            onClearError={onClearError}
            roomState={roomState}
            remainingSec={remainingSec}
            currentSection={currentSection}
            currentEraId={currentEraId}
            onCreateRoom={onCreateRoom}
            onLeaveRoom={onLeaveRoom}
            onHostAction={onHostAction}
            onToggleSubmissionsLock={onToggleSubmissionsLock}
            onEnterStudentPortal={onEnterStudentPortal}
            onPreviewStudentUi={onPreviewStudentUi}
          />
        )}

        {/* ================= SOLO MODE ================= */}
        {mode === 'solo' && (
          <div className="space-y-6">
            {/* Score Summary Strip & Category Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      category === cat.id
                        ? 'bg-[#0B172A] text-[#EBD08A] font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="text-xs sm:text-sm text-slate-600 tabular-nums shrink-0">
                تمت الإجابة على{' '}
                <strong className="text-[#0B172A]">
                  {progress.answeredActivityIds.length}
                </strong>{' '}
                من {ACTIVITIES_DATA.length} · رصيدك:{' '}
                <strong className="text-[#C8972C]">{progress.totalPoints}</strong> نقطة
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredQuestions.map((q, idx) => {
                const fb = soloFeedback[q.id];
                const alreadyRecorded = progress.answeredActivityIds.includes(q.id);
                const isDone = Boolean(fb) || alreadyRecorded;
                const isCorrect =
                  fb?.isCorrect ?? progress.correctActivityIds.includes(q.id);

                return (
                  <article
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3 tabular-nums">
                        <span>
                          نشاط {idx + 1} · {q.difficulty}
                        </span>
                        <span className="font-mono font-bold text-[#C8972C]">
                          +{q.points} نقطة
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-[#0B172A] leading-relaxed mb-4">
                        {q.question}
                      </h2>

                      {q.hint && !isDone && (
                        <div className="mb-4">
                          {revealedHints[q.id] ? (
                            <p className="text-xs text-[#1D355D] bg-[#FBF9F4] border border-[#C8972C]/35 p-3 rounded-lg">
                              تلميح: {q.hint}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedHints((p) => ({
                                  ...p,
                                  [q.id]: true,
                                }))
                              }
                              className="text-xs text-[#C8972C] font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>إظهار تلميح</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* MCQ Options */}
                      {q.options && (
                        <div className="space-y-2.5">
                          {q.options.map((opt, optIdx) => {
                            let cls =
                              'bg-[#F8FAFC] border-slate-200 text-slate-800 hover:border-[#C8972C]';
                            if (isDone) {
                              if (optIdx === q.correctAnswerIndex) {
                                cls =
                                  'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold';
                              } else {
                                cls = 'bg-slate-50 border-slate-200 text-slate-400';
                              }
                            }
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={isDone}
                                onClick={() => handleSoloMcq(q, optIdx)}
                                className={`w-full min-h-[44px] text-right px-4 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer disabled:cursor-default ${cls}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* True / False Buttons */}
                      {q.correctBoolean !== undefined && (
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { val: true, label: 'عبارة صحيحة' },
                            { val: false, label: 'عبارة خاطئة' },
                          ].map((btn) => {
                            let cls =
                              'bg-[#F8FAFC] border-slate-200 text-slate-800 hover:border-[#C8972C]';
                            if (isDone) {
                              if (btn.val === q.correctBoolean) {
                                cls =
                                  'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold';
                              } else {
                                cls = 'bg-slate-50 border-slate-200 text-slate-400';
                              }
                            }
                            return (
                              <button
                                key={String(btn.val)}
                                type="button"
                                disabled={isDone}
                                onClick={() => handleSoloBoolean(q, btn.val)}
                                className={`min-h-[46px] px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer disabled:cursor-default ${cls}`}
                              >
                                {btn.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Numeric Math Exercise */}
                      {q.numericAnswer !== undefined && (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            disabled={isDone}
                            value={numericInputs[q.id] || ''}
                            onChange={(e) =>
                              setNumericInputs((p) => ({
                                ...p,
                                [q.id]: e.target.value,
                              }))
                            }
                            placeholder={`أدخل القيمة (${q.unit || 'عدد'})`}
                            className="flex-1 min-w-[160px] min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#C8972C]"
                          />
                          <button
                            type="button"
                            disabled={isDone}
                            onClick={() => handleSoloNumeric(q)}
                            className="min-h-[44px] px-5 py-2 rounded-lg bg-[#0B172A] hover:bg-[#132542] disabled:bg-slate-300 text-white text-sm font-semibold cursor-pointer"
                          >
                            تحقق
                          </button>
                        </div>
                      )}
                    </div>

                    {isDone && (
                      <div
                        className={`mt-5 p-4 rounded-xl text-sm leading-relaxed border flex items-start gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="block mb-1">
                            {isCorrect ? 'إجابة صحيحة!' : 'التصحيح والشرح الرياضي:'}
                          </strong>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= CLASSROOM GROUP COMPETITION MODE ================= */}
        {mode === 'classroom' && (
          <div className="space-y-6">
            {gamePhase === 'setup' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-6">
                <div>
                  <p className="text-xs font-semibold text-[#C8972C] mb-1">
                    النشاط الجماعي للعرض الجامعي
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#0B172A]">
                    إعداد مسابقة القاعة بين فرق الطلبة
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    قسّم طلبة المدرج إلى فرق متنافسة أثناء العرض الجامعي، وأدر
                    جولات الأسئلة مباشرة عبر الشاشة الكبيرة أو الهواتف.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0B172A] mb-2">
                    عدد الفرق المشاركة:
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => addOrRemoveTeam(n)}
                        className={`min-h-[42px] px-5 py-2 rounded-lg text-sm font-bold border cursor-pointer ${
                          teams.length === n
                            ? 'bg-[#0B172A] text-[#EBD08A] border-[#0B172A]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {n} فرق
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.map((t, idx) => (
                    <label key={t.id} className="block text-xs font-medium text-slate-600">
                      اسم الفريق {idx + 1}
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) =>
                          setTeams((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        className="w-full min-h-[44px] mt-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-[#0B172A]"
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0B172A] mb-2">
                    عدد جولات المسابقة:
                  </label>
                  <div className="flex gap-2">
                    {[6, 10, 14].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setRoundCount(cnt)}
                        className={`min-h-[42px] px-5 py-2 rounded-lg text-sm font-bold border cursor-pointer ${
                          roundCount === cnt
                            ? 'bg-[#C8972C] text-[#0B172A] border-[#C8972C]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cnt} أسئلة
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startClassroomGame}
                  className="w-full min-h-[50px] rounded-xl bg-[#0B172A] hover:bg-[#132542] text-white font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 text-[#EBD08A]" />
                  <span>بدء المسابقة الجامعية المباشرة</span>
                </button>
              </div>
            )}

            {gamePhase === 'playing' && currentClassQ && (
              <div className="space-y-6">
                {/* Live Scoreboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {teams.map((team, idx) => {
                    const isTurn = idx === activeTeamIdx;
                    return (
                      <div
                        key={team.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isTurn
                            ? 'bg-[#0B172A] text-white border-[#C8972C] shadow-md'
                            : 'bg-white text-[#0B172A] border-slate-200'
                        }`}
                      >
                        <p className="text-xs opacity-75">
                          {isTurn ? 'دور الإجابة الآن' : `فريق ${idx + 1}`}
                        </p>
                        <p className="font-bold text-base truncate mt-0.5">
                          {team.name}
                        </p>
                        <p className="font-mono text-2xl font-bold text-[#C8972C] mt-1 tabular-nums">
                          {team.score}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Question Arena Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-600 tabular-nums">
                      الجولة {currentQIdx + 1} من {classroomQuestions.length} ·{' '}
                      <span className="text-[#C8972C]">
                        +{currentClassQ.points} نقطة
                      </span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-sm font-bold tabular-nums ${
                        timerSec <= 5
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-[#0B172A] text-[#EBD08A]'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{timerSec} ثانية</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#0B172A] mb-6 leading-relaxed">
                    {currentClassQ.question}
                  </h2>

                  {currentClassQ.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentClassQ.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={Boolean(roundResult)}
                          onClick={() =>
                            submitClassroomAnswer(
                              idx === currentClassQ.correctAnswerIndex,
                              currentClassQ.points,
                              currentClassQ.explanation
                            )
                          }
                          className={`min-h-[52px] text-right px-5 py-3 rounded-xl border text-base font-medium transition-colors cursor-pointer ${
                            roundResult && idx === currentClassQ.correctAnswerIndex
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                              : 'bg-[#F8FAFC] border-slate-200 hover:border-[#C8972C] text-[#0B172A]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentClassQ.correctBoolean !== undefined && (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { val: true, label: 'صحيح' },
                        { val: false, label: 'خطأ' },
                      ].map((b) => (
                        <button
                          key={String(b.val)}
                          type="button"
                          disabled={Boolean(roundResult)}
                          onClick={() =>
                            submitClassroomAnswer(
                              b.val === currentClassQ.correctBoolean,
                              currentClassQ.points,
                              currentClassQ.explanation
                            )
                          }
                          className={`min-h-[54px] rounded-xl border text-base font-bold cursor-pointer ${
                            roundResult && b.val === currentClassQ.correctBoolean
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                              : 'bg-[#F8FAFC] border-slate-200 hover:border-[#C8972C]'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentClassQ.numericAnswer !== undefined && (
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="number"
                        step="any"
                        disabled={Boolean(roundResult)}
                        value={classroomNumeric}
                        onChange={(e) => setClassroomNumeric(e.target.value)}
                        placeholder={`أدخل الإجابة (${currentClassQ.unit || ''})`}
                        className="flex-1 min-h-[48px] px-4 rounded-xl border border-slate-300 font-mono text-base"
                      />
                      <button
                        type="button"
                        disabled={Boolean(roundResult)}
                        onClick={() => {
                          const v = parseFloat(classroomNumeric);
                          if (Number.isNaN(v)) return;
                          const tol = currentClassQ.numericTolerance ?? 0.05;
                          submitClassroomAnswer(
                            Math.abs(v - (currentClassQ.numericAnswer || 0)) <= tol,
                            currentClassQ.points,
                            currentClassQ.explanation
                          );
                        }}
                        className="min-h-[48px] px-6 rounded-xl bg-[#0B172A] text-white font-bold cursor-pointer"
                      >
                        تثبيت الإجابة
                      </button>
                    </div>
                  )}

                  {roundResult && (
                    <div className="mt-6 space-y-4">
                      <div
                        className={`p-4 rounded-xl border text-sm leading-relaxed ${
                          roundResult.isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <strong className="block mb-1 text-base">
                          {roundResult.isCorrect
                            ? `نقاط مستحقة لـ ${teams[activeTeamIdx].name}!`
                            : 'إجابة غير موفقة — الشرح الصحيح:'}
                        </strong>
                        {roundResult.explanation}
                      </div>

                      <button
                        type="button"
                        onClick={nextClassroomTurn}
                        className="w-full min-h-[48px] rounded-xl bg-[#C8972C] hover:bg-[#DDB14A] text-[#0B172A] font-bold text-base cursor-pointer"
                      >
                        {currentQIdx + 1 >= classroomQuestions.length
                          ? 'عرض النتيجة النهائية ومنصة التتويج'
                          : 'الانتقال إلى الفريق والسؤال التالي'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {gamePhase === 'finished' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto text-center space-y-6">
                <Trophy className="w-14 h-14 text-[#C8972C] mx-auto" />
                <h2 className="text-3xl font-bold font-editorial text-[#0B172A]">
                  الترتيب النهائي للمسابقة الجامعية
                </h2>
                <div className="space-y-3 text-right">
                  {sortedTeams.map((team, idx) => (
                    <div
                      key={team.id}
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        idx === 0
                          ? 'bg-[#0B172A] text-white border-[#C8972C]'
                          : 'bg-[#F8FAFC] text-[#0B172A] border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg text-[#C8972C] tabular-nums">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-base">{team.name}</p>
                          <p className="text-xs opacity-75 tabular-nums">
                            {team.correctCount} إجابات صحيحة
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-2xl font-bold text-[#EBD08A] tabular-nums">
                        {team.score} نقطة
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setGamePhase('setup')}
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0B172A] text-white font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#EBD08A]" />
                  <span>إجراء مسابقة جديدة</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
