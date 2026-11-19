import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Lock,
  Radio,
  Send,
  Trophy,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import { AppSection, EraId } from '../types/geometry';
import { RoomStatePayload, StudentAccessMode } from '../hooks/useLiveLecture';

interface PresenterControlBarProps {
  wsConnected: boolean;
  roomState: RoomStatePayload | null;
  currentSection: AppSection;
  currentEraId: EraId;
  previewStudentUi: boolean;
  onTogglePreviewStudent: () => void;
  onCreateSession: (opts: {
    questionCount: number;
    studentAccessMode: StudentAccessMode;
    currentSection: AppSection;
    currentEraId: EraId;
  }) => void;
  onSetLectureMode: (update: {
    studentAccessMode?: StudentAccessMode;
    currentSection?: AppSection;
    currentEraId?: EraId;
    presenterNote?: string;
  }) => void;
  onEndSession: () => void;
  onOpenKahootDashboard: () => void;
}

export const PresenterControlBar: React.FC<PresenterControlBarProps> = ({
  wsConnected,
  roomState,
  currentSection,
  currentEraId,
  previewStudentUi,
  onTogglePreviewStudent,
  onCreateSession,
  onSetLectureMode,
  onEndSession,
  onOpenKahootDashboard,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  if (previewStudentUi) {
    return (
      <div className="bg-[#C8972C] text-[#0B172A] px-4 py-2 text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-2">
        <span>أنت الآن في وضع معاينة «واجهة الطالب» — هذا ما يظهر على هواتف الطلبة</span>
        <button
          type="button"
          onClick={onTogglePreviewStudent}
          className="px-3.5 py-1 rounded-lg bg-[#0B172A] text-white text-xs font-bold cursor-pointer"
        >
          العودة إلى لوحة الأستاذ
        </button>
      </div>
    );
  }

  const isHost = roomState?.role === 'host';
  const accessMode = roomState?.lectureControl.studentAccessMode || 'follow';

  const copyStudentLink = async () => {
    if (!roomState) return;
    const url = `${window.location.origin}/?pin=${roomState.pin}&student=1`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="bg-[#132542] text-white border-b border-[#C8972C]/35">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Compact Header Strip */}
        <div className="py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#EBD08A]">
              <Radio className="w-3.5 h-3.5" />
              <span>لوحة تحكم المقدّم (الأستاذ)</span>
            </span>
            {isHost && roomState ? (
              <span className="text-slate-200 tabular-nums">
                رمز الطلبة:{' '}
                <strong dir="ltr" className="font-mono text-[#EBD08A] text-sm">
                  {roomState.pin}
                </strong>
                <span className="mx-2 text-slate-500">·</span>
                <Users className="w-3.5 h-3.5 inline ml-1 text-[#38BDF8]" />
                <strong>{roomState.totalPlayers}</strong> طالب متصل
              </span>
            ) : (
              <span className="text-slate-300">
                {wsConnected
                  ? 'افتح جلسة تفاعلية ليشارك الطلبة من هواتفهم بواجهة مستقلة'
                  : 'جاري الاتصال بالخادم...'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isHost ? (
              <button
                type="button"
                disabled={!wsConnected}
                onClick={() =>
                  onCreateSession({
                    questionCount: 8,
                    studentAccessMode: 'follow',
                    currentSection,
                    currentEraId,
                  })
                }
                className="min-h-[34px] px-3.5 py-1 rounded-lg bg-[#C8972C] hover:bg-[#DDB14A] disabled:bg-slate-600 text-[#0B172A] font-bold text-xs cursor-pointer"
              >
                بدء جلسة تحكم للطلبة
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={copyStudentLink}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#EBD08A]" />
                  )}
                  <span>{copied ? 'تم نسخ رابط الطلبة' : 'نسخ رابط الطلبة'}</span>
                </button>
                <button
                  type="button"
                  onClick={onTogglePreviewStudent}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">معاينة شاشة الطالب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  aria-label="طي أو توسيع لوحة التحكم"
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  {collapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Expanded Remote Control Deck when Host Session Active */}
        {isHost && roomState && !collapsed && (
          <div className="py-3 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Student Screen Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-300 ml-1">
                ما يظهر في هواتف الطلبة الآن:
              </span>
              <button
                type="button"
                onClick={() =>
                  onSetLectureMode({
                    studentAccessMode: 'follow',
                    currentSection,
                    currentEraId,
                  })
                }
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  accessMode === 'follow'
                    ? 'bg-[#C8972C] text-[#0B172A]'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>وضع التركيز (متابعة شريحتي)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSetLectureMode({
                    studentAccessMode: 'free',
                    currentSection,
                    currentEraId,
                  })
                }
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  accessMode === 'free'
                    ? 'bg-[#C8972C] text-[#0B172A]'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>السماح بالتجربة الحرة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetLectureMode({ studentAccessMode: 'kahoot' });
                  onOpenKahootDashboard();
                }}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  accessMode === 'kahoot'
                    ? 'bg-emerald-400 text-[#0B172A]'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>تحدي كاهووت المباشر</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSetLectureMode({
                    currentSection,
                    currentEraId,
                  })
                }
                className="min-h-[36px] px-3 py-1 rounded-lg bg-[#1D355D] hover:bg-[#254478] text-white text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#EBD08A]" />
                <span>مزامنة الشاشة الحالية</span>
              </button>
            </div>

            {/* Live Announcement + End Session */}
            <div className="flex items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSetLectureMode({ presenterNote: noteInput.trim() });
                }}
                className="flex items-center gap-1.5 flex-1 sm:flex-initial"
              >
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="أرسل توجيهاً لهواتف الطلبة..."
                  className="min-h-[36px] w-full sm:w-56 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#DDB14A]"
                />
                <button
                  type="submit"
                  aria-label="إرسال توجيه للطلبة"
                  className="min-h-[36px] px-3 rounded-lg bg-[#C8972C] text-[#0B172A] font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <button
                type="button"
                onClick={onEndSession}
                title="إنهاء جلسة العرض"
                className="min-h-[36px] px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">إنهاء</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
