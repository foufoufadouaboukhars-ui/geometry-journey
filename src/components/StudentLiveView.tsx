import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  FlaskConical,
  Lock,
  LogOut,
  Megaphone,
  Sparkles,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { ERAS_DATA } from '../data/erasData';
import { RoomStatePayload } from '../hooks/useLiveLecture';
import { AppSection, EraId } from '../types/geometry';

const OPTION_THEMES = [
  { symbol: '▲', bg: 'bg-[#C83E3B] hover:bg-[#B2322F]' },
  { symbol: '◆', bg: 'bg-[#1D4ED8] hover:bg-[#1E40AF]' },
  { symbol: '●', bg: 'bg-[#C8972C] hover:bg-[#B2831F]' },
  { symbol: '■', bg: 'bg-[#047857] hover:bg-[#065F46]' },
];

interface StudentLiveViewProps {
  urlPin: string;
  wsConnected: boolean;
  errorMsg: string | null;
  onClearError: () => void;
  roomState: RoomStatePayload | null;
  remainingSec: number;
  onJoinRoom: (pin: string, name: string) => void;
  onSubmitAnswer: (optionIndex: number) => void;
  onLeaveRoom: () => void;
  onExitStudentDemo?: () => void;
  isPreviewOnly?: boolean;
  onFreeNavigate?: (section: AppSection, eraId?: EraId) => void;
}

export const StudentLiveView: React.FC<StudentLiveViewProps> = ({
  urlPin,
  wsConnected,
  errorMsg,
  onClearError,
  roomState,
  remainingSec,
  onJoinRoom,
  onSubmitAnswer,
  onLeaveRoom,
  onExitStudentDemo,
  isPreviewOnly = false,
  onFreeNavigate,
}) => {
  const [pinInput, setPinInput] = useState(urlPin);
  const [nameInput, setNameInput] = useState('');

  // 1. STUDENT JOIN GATEWAY (Distinct from Presenter View — ZERO Create Room controls!)
  if (!roomState && !isPreviewOnly) {
    return (
      <div className="min-h-screen bg-[#0B172A] text-white flex flex-col justify-between p-4 sm:p-6 bg-blueprint-grid">
        <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
          <span className="font-editorial font-bold text-lg text-[#EBD08A]">
            بوابة الطالب · رحلة في تاريخ الهندسة
          </span>
          {onExitStudentDemo && (
            <button
              type="button"
              onClick={onExitStudentDemo}
              className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
            >
              خروج
            </button>
          )}
        </header>

        <main className="max-w-md w-full mx-auto bg-white text-[#0F172A] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#C8972C]/40 my-auto">
          <p className="text-xs font-bold text-[#C8972C] mb-1">
            الدخول التفاعلي للمحاضرة والمسابقة
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-editorial text-[#0B172A] mb-2">
            انضم إلى جلسة الأستاذ
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            هذه الواجهة مخصصة للطلبة المشاركين فقط. أدخل رمز الغرفة الذي يعرضه
            الأستاذ واكتب اسمك للبدء.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={onClearError}
                className="underline cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onJoinRoom(pinInput.trim(), nameInput.trim());
            }}
            className="space-y-4"
          >
            <label className="block text-xs font-semibold text-slate-700">
              رمز الغرفة (PIN)
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="6 أرقام"
                dir="ltr"
                className="w-full min-h-[50px] mt-1.5 px-4 rounded-xl border border-slate-300 text-center font-mono text-2xl font-bold tracking-widest text-[#0B172A] focus:outline-none focus:border-[#C8972C]"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              الاسم الكامل
              <input
                type="text"
                maxLength={24}
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="اكتب اسمك كما سيظهر في النتائج"
                className="w-full min-h-[48px] mt-1.5 px-4 rounded-xl border border-slate-300 text-base font-semibold text-[#0B172A] focus:outline-none focus:border-[#C8972C]"
              />
            </label>

            <button
              type="submit"
              disabled={!wsConnected}
              className="w-full min-h-[52px] rounded-xl bg-[#0B172A] hover:bg-[#132542] disabled:bg-slate-400 text-white font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-[#EBD08A]" />
              <span>
                {wsConnected ? 'دخول الجلسة الآن' : 'جاري الاتصال بالخادم...'}
              </span>
            </button>
          </form>
        </main>

        <footer className="max-w-md w-full mx-auto text-center text-xs text-slate-400 py-2">
          واجهة الطالب المتزامنة · بإدارة مقدّم العرض
        </footer>
      </div>
    );
  }

  const me = roomState?.me || {
    id: 'preview',
    name: 'معاينة طالب',
    avatarColor: '#C8972C',
    score: 1450,
    streak: 2,
    lastPoints: 890,
    lastCorrect: true,
    selectedOption: null,
  };

  const control = roomState?.lectureControl || {
    studentAccessMode: 'follow',
    currentSection: 'encyclopedia',
    currentEraId: 'islamic',
    presenterNote: '',
    submissionsLocked: false,
  };

  const currentEra =
    ERAS_DATA.find((e) => e.id === control.currentEraId) || ERAS_DATA[0];
  const myRank = roomState?.me
    ? roomState.players.findIndex((p) => p.id === roomState.me?.id) + 1
    : 1;

  // 2. CONNECTED STUDENT PORTAL (Completely distinct from Presenter Dashboard!)
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Minimal Student Top Header (Zero Presenter Controls!) */}
      <header className="sticky top-0 z-30 bg-[#0B172A] text-white border-b border-[#C8972C]/35 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
              style={{ backgroundColor: me.avatarColor }}
            >
              {me.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{me.name}</p>
              <p className="text-[11px] text-[#EBD08A] tabular-nums">
                غرفة {roomState?.pin || '------'} · رصيدك {me.score} نقطة
              </p>
            </div>
          </div>

          {!isPreviewOnly && (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-rose-500/25 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>مغادرة</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Live Presenter Announcement Banner (if any) */}
        {control.presenterNote && (
          <div className="p-4 rounded-xl bg-[#0B172A] text-white border border-[#C8972C] flex items-start gap-3 shadow-sm">
            <Megaphone className="w-5 h-5 text-[#EBD08A] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-[#EBD08A]">
                توجيه مباشر من الأستاذ
              </p>
              <p className="text-sm font-medium mt-0.5 leading-relaxed">
                {control.presenterNote}
              </p>
            </div>
          </div>
        )}

        {/* ===== MODE A: FOLLOW PRESENTER (FOCUS MODE) ===== */}
        {control.studentAccessMode === 'follow' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#C8972C]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>وضع التركيز — متابعة شرح الأستاذ</span>
                </span>
                <span className="tabular-nums">{currentEra.period}</span>
              </div>

              <h1 className="text-2xl font-bold font-editorial text-[#0B172A]">
                {currentEra.title}
              </h1>
              <p className="text-sm text-[#1D355D] font-medium">
                {currentEra.subtitle}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {currentEra.summary}
              </p>

              {currentEra.theorems[0] && (
                <div className="p-4 rounded-xl bg-[#0B172A] text-white space-y-1.5">
                  <p className="text-xs text-[#EBD08A] font-semibold">
                    القاعدة المحورية في هذه الشريحة:
                  </p>
                  <p className="text-sm font-bold">{currentEra.theorems[0].title}</p>
                  <div dir="ltr" className="font-mono text-sm text-[#38BDF8] pt-1">
                    {currentEra.theorems[0].formula}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[#FBF9F4] border border-[#C8972C]/40 text-center space-y-1">
              <p className="text-sm font-bold text-[#0B172A]">
                تابع العرض مع الأستاذ على الشاشة الرئيسية
              </p>
              <p className="text-xs text-slate-600">
                ستفتح أسئلة كاهووت التفاعلية أو مخبر التجربة على هاتفك تلقائياً
                عندما يُفعلها الأستاذ.
              </p>
            </div>
          </div>
        )}

        {/* ===== MODE B: FREE EXPLORATION ALLOWED BY PRESENTER ===== */}
        {control.studentAccessMode === 'free' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-center">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-700">
                تم تفعيل التجربة الحرة من طرف الأستاذ
              </p>
              <h1 className="text-2xl font-bold font-editorial text-[#0B172A]">
                يمكنك الآن استكشاف الموسوعة والمخبر على هاتفك
              </h1>
              <p className="text-sm text-slate-600">
                عندما يطلق الأستاذ مسابقة كاهووت أو يعود للشرح، ستعود شاشتك
                تلقائياً إلى الجلسة.
              </p>
            </div>

            {onFreeNavigate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onFreeNavigate('encyclopedia', control.currentEraId)}
                  className="min-h-[52px] rounded-xl bg-[#0B172A] text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#EBD08A]" />
                  <span>فتح الموسوعة ({currentEra.title})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onFreeNavigate('lab')}
                  className="min-h-[52px] rounded-xl bg-[#C8972C] text-[#0B172A] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>دخول مخبر الهندسة 2D/3D</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== MODE C: KAHOOT LIVE STUDENT BUZZER SCREEN ===== */}
        {control.studentAccessMode === 'kahoot' && roomState && (
          <div className="space-y-5">
            {roomState.phase === 'lobby' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: me.avatarColor }}
                >
                  {me.name.slice(0, 1)}
                </div>
                <h1 className="text-2xl font-bold font-editorial text-[#0B172A]">
                  أنت مستعد للمسابقة يا {me.name}!
                </h1>
                <p className="text-sm text-slate-600">
                  عدد المشاركين المتصلين الآن: <strong>{roomState.totalPlayers}</strong>.
                  بانتظار ضغط الأستاذ على زر بدء المسابقة...
                </p>
              </div>
            )}

            {roomState.phase === 'question' && roomState.question && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold tabular-nums">
                  <span className="text-[#C8972C]">
                    سؤال {roomState.currentQuestionIndex + 1} من{' '}
                    {roomState.totalQuestions}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono ${
                      remainingSec <= 5
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-[#0B172A] text-[#EBD08A]'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{remainingSec} ث</span>
                  </span>
                </div>

                {control.submissionsLocked && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold text-center">
                    أوقف الأستاذ استقبال الإجابات مؤقتاً
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
                  <p className="text-base sm:text-lg font-bold text-[#0B172A] leading-relaxed">
                    {roomState.question.question}
                  </p>
                </div>

                {me.selectedOption !== null ? (
                  <div className="p-8 rounded-2xl bg-[#0B172A] text-white text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-[#EBD08A] mx-auto" />
                    <p className="text-xl font-bold font-editorial">
                      تم إرسال إجابتك!
                    </p>
                    <p className="text-sm text-slate-300">
                      اختيارك: {OPTION_THEMES[me.selectedOption].symbol}{' '}
                      {roomState.question.options[me.selectedOption]}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {roomState.question.options.map((opt, idx) => {
                      const theme = OPTION_THEMES[idx];
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={control.submissionsLocked || isPreviewOnly}
                          onClick={() => onSubmitAnswer(idx)}
                          className={`min-h-[72px] rounded-xl ${theme.bg} disabled:opacity-50 text-white p-4 flex items-center gap-4 text-right shadow transition-transform active:scale-[0.98] cursor-pointer`}
                        >
                          <span className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-xl font-bold shrink-0">
                            {theme.symbol}
                          </span>
                          <span className="text-base font-bold leading-snug">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {(roomState.phase === 'reveal' ||
              roomState.phase === 'leaderboard') && (
              <div className="space-y-4">
                <div
                  className={`p-7 rounded-2xl text-center space-y-2 border ${
                    me.lastCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  {me.lastCorrect ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  ) : (
                    <XCircle className="w-12 h-12 text-rose-600 mx-auto" />
                  )}
                  <h2 className="text-2xl font-bold font-editorial">
                    {me.lastCorrect
                      ? `أحسنت! +${me.lastPoints} نقطة`
                      : 'إجابة غير صحيحة'}
                  </h2>
                  <p className="text-sm font-semibold tabular-nums">
                    مجموعك: {me.score} نقطة · ترتيبك الحالي: #{myRank}
                  </p>
                </div>

                {roomState.question?.explanation && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 leading-relaxed">
                    <strong className="text-[#0B172A]">الشرح الرياضي: </strong>
                    {roomState.question.explanation}
                  </div>
                )}
              </div>
            )}

            {roomState.phase === 'podium' && (
              <div className="bg-[#0B172A] text-white rounded-2xl p-8 text-center space-y-4 border border-[#C8972C]">
                <Crown className="w-14 h-14 text-[#EBD08A] mx-auto" />
                <h2 className="text-3xl font-bold font-editorial">
                  انتهت المسابقة!
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-[#EBD08A] font-bold text-lg tabular-nums">
                  <Sparkles className="w-5 h-5" />
                  <span>
                    مركزك: #{myRank} · {me.score} نقطة
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
