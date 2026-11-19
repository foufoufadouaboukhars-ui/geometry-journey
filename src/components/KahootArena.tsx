import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Crown,
  Eye,
  Lock,
  LogOut,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Trophy,
  Unlock,
  UserPlus,
  Users,
} from 'lucide-react';
import { RoomStatePayload, StudentAccessMode } from '../hooks/useLiveLecture';
import { AppSection, EraId } from '../types/geometry';

const OPTION_THEMES = [
  {
    symbol: '▲',
    bg: 'bg-[#C83E3B]',
    bar: 'bg-[#C83E3B]',
  },
  {
    symbol: '◆',
    bg: 'bg-[#1D4ED8]',
    bar: 'bg-[#1D4ED8]',
  },
  {
    symbol: '●',
    bg: 'bg-[#C8972C]',
    bar: 'bg-[#C8972C]',
  },
  {
    symbol: '■',
    bg: 'bg-[#047857]',
    bar: 'bg-[#047857]',
  },
];

interface KahootArenaProps {
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
}

export const KahootArena: React.FC<KahootArenaProps> = ({
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
}) => {
  const [questionCount, setQuestionCount] = useState(8);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = useMemo(() => {
    if (!roomState) return '';
    return `${window.location.origin}/?pin=${roomState.pin}&student=1`;
  }, [roomState]);

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback ignored
    }
  };

  // ==================== 1. PRESENTER ENTRY SCREEN ====================
  if (!roomState) {
    return (
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-medium flex items-center justify-between gap-3">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={onClearError}
              className="text-xs underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Presenter Room Creation Card (8 cols) */}
          <div className="lg:col-span-8 bg-[#0B172A] text-white rounded-2xl border border-[#C8972C]/45 p-6 sm:p-8 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#EBD08A]">
                  لوحة تحكم المقدّم (شاشة العرض الجامعي)
                </span>
                <span className="text-xs text-slate-300">
                  {wsConnected ? 'متصل بالخادم المباشر' : 'جاري الاتصال...'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-editorial mb-3">
                فتح غرفة مسابقة كاهووت تفاعلية للطلبة
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                أنشئ جلسة تحدٍّ مباشرة تتحكم فيها أنت في توقيت الأسئلة، تجميد
                الإجابات، وعرض لوحة الصدارة. وعند دخول الطلبة عبر الرابط المخصّص
                ستظهر لهم واجهة طالب مستقلة وبسيطة خالية تماماً من أزرار التحكم.
              </p>

              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-300 mb-2">
                  اختر عدد أسئلة الجولة:
                </p>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {[6, 8, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuestionCount(n)}
                      className={`min-h-[44px] rounded-lg text-sm font-bold border cursor-pointer transition-colors ${
                        questionCount === n
                          ? 'bg-[#C8972C] text-[#0B172A] border-[#C8972C]'
                          : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
                      }`}
                    >
                      {n} أسئلة
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!wsConnected}
              onClick={() =>
                onCreateRoom({
                  questionCount,
                  studentAccessMode: 'kahoot',
                  currentSection,
                  currentEraId,
                })
              }
              className="w-full sm:w-auto min-h-[52px] px-8 rounded-xl bg-[#C8972C] hover:bg-[#DDB14A] disabled:bg-slate-600 text-[#0B172A] font-bold text-base inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-5 h-5" />
              <span>إنشاء غرفة العرض وفتح البث للطلبة</span>
            </button>
          </div>

          {/* Discrete Student Switcher Card (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#C8972C] block mb-2">
                تطبيق الطالب المستقل
              </span>
              <h3 className="text-xl font-bold font-editorial text-[#0B172A] mb-2">
                هل أنت طالب مشارك؟
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                إذا فتح الطلبة رابط الدعوة المنسوخ من الأستاذ، سيدخلون مباشرة إلى
                «بوابة الطالب» المستقلة. يمكنك أيضاً التبديل إلى واجهة الطالب من
                هذا الجهاز عبر الزر أدناه.
              </p>
            </div>

            <button
              type="button"
              onClick={onEnterStudentPortal}
              className="w-full min-h-[48px] rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-slate-300 text-[#0B172A] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#C8972C]" />
              <span>الدخول إلى بوابة الطالب</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const submissionsLocked = roomState.lectureControl.submissionsLocked;

  return (
    <div className="space-y-6">
      {/* Top Presenter Room Status Bar */}
      <div className="bg-[#0B172A] text-white rounded-2xl p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 border border-[#C8972C]/35">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-[11px] text-slate-400 block">
              رمز الغرفة للطلبة
            </span>
            <span
              dir="ltr"
              className="font-mono text-xl sm:text-2xl font-bold text-[#EBD08A] tracking-widest tabular-nums"
            >
              {roomState.pin}
            </span>
          </div>
          <div className="h-8 w-px bg-white/15 hidden sm:block" />
          <div className="text-xs sm:text-sm text-slate-200 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#EBD08A]" />
              <strong>{roomState.players.length}</strong> طالب متصل
            </span>
            {roomState.phase !== 'lobby' && (
              <span className="mr-3 text-slate-400">
                · السؤال {roomState.currentQuestionIndex + 1} من{' '}
                {roomState.totalQuestions}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#EBD08A]" />
            )}
            <span>{copiedLink ? 'تم نسخ رابط الطلبة' : 'نسخ رابط الطلبة'}</span>
          </button>
          <button
            type="button"
            onClick={onPreviewStudentUi}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#EBD08A]" />
            <span>معاينة شاشة الطالب</span>
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 hover:text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>إنهاء الجلسة</span>
          </button>
        </div>
      </div>

      {/* ==================== PHASE 1: LOBBY ==================== */}
      {roomState.phase === 'lobby' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pb-6 border-b border-slate-100">
            <div className="lg:col-span-7 space-y-2">
              <p className="text-xs font-bold text-[#C8972C]">
                صالة الانتظار المباشرة — شاشة الأستاذ
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#0B172A]">
                شارك الرمز{' '}
                <span dir="ltr" className="font-mono text-[#1D4ED8]">
                  {roomState.pin}
                </span>{' '}
                أو رابط الطلبة المخصّص
              </h2>
              <p className="text-sm text-slate-600">
                سيفتح الرابط تلقائياً بوابة الطالب المستقلة على هواتفهم، ولن يروا
                لوحة التحكم الخاصة بك.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="min-h-[42px] px-4 py-2 rounded-lg bg-[#F8FAFC] border border-slate-300 hover:border-[#C8972C] text-xs sm:text-sm font-semibold text-[#0B172A] inline-flex items-center gap-2 cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#C8972C]" />
                  )}
                  <span>
                    {copiedLink
                      ? 'تم نسخ رابط بوابة الطالب!'
                      : 'نسخ رابط بوابة الطالب (?student=1)'}
                  </span>
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator
                        .share({
                          title: 'انضم لمسابقة رحلة في تاريخ الهندسة',
                          text: `رمز الغرفة: ${roomState.pin}`,
                          url: shareUrl,
                        })
                        .catch(() => {});
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-[#F8FAFC] border border-slate-300 text-xs sm:text-sm font-semibold text-[#0B172A] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>مشاركة</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-stretch sm:items-end justify-center gap-3">
              <button
                type="button"
                disabled={roomState.players.length === 0}
                onClick={() => onHostAction('host_start_game')}
                className="min-h-[54px] px-8 py-3 rounded-xl bg-[#0B172A] hover:bg-[#132542] disabled:bg-slate-300 text-white font-bold text-lg inline-flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
              >
                <Play className="w-5 h-5 text-[#EBD08A]" />
                <span>
                  {roomState.players.length === 0
                    ? 'بانتظار انضمام طالب واحد على الأقل...'
                    : `ابدأ المسابقة (${roomState.players.length} مشاركين)`}
                </span>
              </button>
            </div>
          </div>

          {/* Live Player Grid */}
          <div>
            <h3 className="text-sm font-bold text-[#0B172A] mb-3">
              الطلبة المتصلون الآن ({roomState.players.length})
            </h3>
            {roomState.players.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center bg-[#F8FAFC] rounded-xl border border-dashed border-slate-300">
                لم ينضم أحد بعد. عند دخول الطلبة عبر الرابط أو رمز PIN ستظهر
                أسماؤهم هنا فوراً.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {roomState.players.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.name.slice(0, 1)}
                      </span>
                      <span className="text-sm font-bold text-[#0B172A] truncate">
                        {p.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={`إزالة ${p.name}`}
                      onClick={() =>
                        onHostAction('host_kick_player', { playerId: p.id })
                      }
                      className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer px-1.5"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== PHASE 2: QUESTION (PROJECTOR VIEW) ==================== */}
      {roomState.phase === 'question' && roomState.question && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <span className="text-[#C8972C]">{roomState.question.eraTag}</span>
              <div className="flex items-center gap-4 tabular-nums">
                <span className="text-slate-600">
                  أجاب {roomState.answeredCount} / {roomState.totalPlayers}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold ${
                    remainingSec <= 5
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-[#0B172A] text-[#EBD08A]'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{remainingSec} ث</span>
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#C8972C] transition-all duration-200"
                style={{
                  width: `${Math.min(
                    100,
                    (remainingSec / roomState.question.timeLimitSec) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          <h2 className="text-xl sm:text-3xl font-bold font-editorial text-[#0B172A] leading-relaxed text-center py-2">
            {roomState.question.question}
          </h2>

          {/* Display-only 4 options on Host Projector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {roomState.question.options.map((opt, idx) => {
              const theme = OPTION_THEMES[idx];
              return (
                <div
                  key={idx}
                  className={`min-h-[76px] sm:min-h-[88px] rounded-xl ${theme.bg} text-white p-4 sm:p-5 flex items-center gap-4 text-right shadow opacity-95`}
                >
                  <span className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-xl font-bold shrink-0">
                    {theme.symbol}
                  </span>
                  <span className="text-base sm:text-lg font-bold leading-snug">
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Host Live Moderation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onToggleSubmissionsLock(!submissionsLocked)}
              className={`min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
                submissionsLocked
                  ? 'bg-amber-100 border border-amber-300 text-amber-950'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#0B172A]'
              }`}
            >
              {submissionsLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>فتح استقبال إجابات الطلبة</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>تجميد الإجابات مؤقتاً</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onHostAction('host_reveal_now')}
              className="min-h-[42px] px-5 py-2 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold cursor-pointer"
            >
              تخطي الوقت وكشف الإجابة الآن
            </button>
          </div>
        </div>
      )}

      {/* ==================== PHASE 3: REVEAL & DISTRIBUTION ==================== */}
      {roomState.phase === 'reveal' && roomState.question && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <p className="text-xs font-bold text-[#C8972C] mb-1">
              الإجابة الصحيحة وإحصائيات القاعة
            </p>
            <h3 className="text-xl font-bold text-[#0B172A] mb-4">
              {roomState.question.question}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {roomState.question.options.map((opt, idx) => {
                const isRight = idx === roomState.question?.correctIndex;
                const count = roomState.optionCounts?.[idx] || 0;
                const pct =
                  roomState.totalPlayers > 0
                    ? Math.round((count / roomState.totalPlayers) * 100)
                    : 0;
                const theme = OPTION_THEMES[idx];
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isRight
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-slate-200 bg-[#F8FAFC] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-sm text-[#0B172A]">
                        {theme.symbol} {opt}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full ${isRight ? 'bg-emerald-600' : theme.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {roomState.question.explanation && (
              <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#C8972C]/40 text-sm text-slate-800 leading-relaxed">
                <strong className="text-[#0B172A]">التوضيح الرياضي: </strong>
                {roomState.question.explanation}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onHostAction('host_show_leaderboard')}
              className="min-h-[48px] px-7 py-2.5 rounded-xl bg-[#0B172A] hover:bg-[#132542] text-white font-bold text-base inline-flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-5 h-5 text-[#EBD08A]" />
              <span>
                {roomState.currentQuestionIndex + 1 >= roomState.totalQuestions
                  ? 'إعلان منصة التتويج النهائية'
                  : 'عرض لوحة الصدارة'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== PHASE 4: LEADERBOARD ==================== */}
      {roomState.phase === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#C8972C]">الترتيب المباشر</p>
              <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#0B172A]">
                أوائل الطلبة بعد الجولة {roomState.currentQuestionIndex + 1}
              </h2>
            </div>
            <Trophy className="w-8 h-8 text-[#C8972C]" />
          </div>

          <div className="space-y-2.5">
            {roomState.players.slice(0, 8).map((p, idx) => (
              <div
                key={p.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  idx === 0
                    ? 'bg-[#0B172A] text-white border-[#C8972C]'
                    : 'bg-[#F8FAFC] border-slate-200 text-[#0B172A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg w-7 text-center text-[#C8972C] tabular-nums">
                    #{idx + 1}
                  </span>
                  <span
                    className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.slice(0, 1)}
                  </span>
                  <div>
                    <span className="font-bold text-base block">{p.name}</span>
                    {p.streak >= 2 && (
                      <span className="text-[11px] text-[#DDB14A]">
                        سلسلة صحيحة: {p.streak}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-xl font-bold text-[#C8972C] tabular-nums">
                  {p.score}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onHostAction('host_next_question')}
              className="min-h-[48px] px-8 py-2.5 rounded-xl bg-[#C8972C] hover:bg-[#DDB14A] text-[#0B172A] font-bold text-base cursor-pointer"
            >
              الانتقال إلى السؤال التالي
            </button>
          </div>
        </div>
      )}

      {/* ==================== PHASE 5: FINAL PODIUM ==================== */}
      {roomState.phase === 'podium' && (
        <div className="bg-[#0B172A] text-white rounded-2xl border border-[#C8972C]/50 p-6 sm:p-10 shadow-xl space-y-8 text-center">
          <div className="space-y-2">
            <Crown className="w-14 h-14 text-[#EBD08A] mx-auto" />
            <h2 className="text-3xl sm:text-4xl font-bold font-editorial">
              منصة التتويج النهائية
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto items-end">
            {[1, 0, 2].map((rankIdx) => {
              const p = roomState.players[rankIdx];
              if (!p) return null;
              const isFirst = rankIdx === 0;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-6 border ${
                    isFirst
                      ? 'bg-[#C8972C] text-[#0B172A] border-[#FDE68A] sm:py-8 order-first sm:order-none'
                      : 'bg-white/10 text-white border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 font-mono text-sm font-bold mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>المركز {rankIdx + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold truncate">{p.name}</h3>
                  <p className="font-mono text-2xl font-bold mt-2 tabular-nums">
                    {p.score} نقطة
                  </p>
                </div>
              );
            })}
          </div>

          {roomState.players.length > 3 && (
            <div className="max-w-2xl mx-auto text-right space-y-2 pt-4 border-t border-white/15">
              {roomState.players.slice(3).map((p, i) => (
                <div
                  key={p.id}
                  className="px-4 py-2.5 rounded-lg bg-white/5 flex items-center justify-between text-sm tabular-nums"
                >
                  <span>
                    #{i + 4} · {p.name}
                  </span>
                  <span className="font-mono text-[#EBD08A]">{p.score}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => onHostAction('host_restart')}
              className="min-h-[48px] px-7 py-3 rounded-xl bg-[#C8972C] hover:bg-[#DDB14A] text-[#0B172A] font-bold text-base inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>العودة لصالة الانتظار لجولة جديدة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
