import React, { useState } from 'react';
import { Award, RotateCcw, X } from 'lucide-react';
import { UserProgress } from '../types/geometry';

interface ProgressModalProps {
  open: boolean;
  onClose: () => void;
  progress: UserProgress;
  onUpdateName: (name: string) => void;
  onReset: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  open,
  onClose,
  progress,
  onUpdateName,
  onReset,
}) => {
  const [nameInput, setNameInput] = useState(progress.studentName);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  const overallPercent = Math.min(
    100,
    Math.round(
      ((progress.exploredEras.length / 7) * 35 +
        (progress.visitedScientists.length / 15) * 25 +
        (Math.min(4, progress.solvedLabChallenges.length) / 4) * 20 +
        (Math.min(10, progress.correctActivityIds.length) / 10) * 20)
    )
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-modal-title"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0B172A] text-white p-6 flex items-center justify-between border-b border-[#C8972C]/35">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-[#EBD08A]" />
            <div>
              <h2
                id="progress-modal-title"
                className="text-xl font-bold font-editorial"
              >
                سجل تقدم الطالب
              </h2>
              <p className="text-xs text-slate-300">
                يُحفظ التقدم تلقائياً على جهازك
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Student Name Edit */}
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="اسم الطالب أو الباحث"
              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => onUpdateName(nameInput)}
              className="min-h-[42px] px-4 py-2 rounded-lg bg-[#0B172A] text-white text-sm font-semibold cursor-pointer"
            >
              حفظ الاسم
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 tabular-nums">
              <span>نسبة إتمام الرحلة العلمية</span>
              <span>{overallPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#C8972C] transition-all"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 tabular-nums">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200">
              <p className="text-xs text-slate-500">إجمالي النقاط</p>
              <p className="text-2xl font-mono font-bold text-[#C8972C]">
                {progress.totalPoints}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200">
              <p className="text-xs text-slate-500">المراحل المستكشفة</p>
              <p className="text-2xl font-mono font-bold text-[#0B172A]">
                {progress.exploredEras.length} / 7
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200">
              <p className="text-xs text-slate-500">علماء المتحف</p>
              <p className="text-2xl font-mono font-bold text-[#0B172A]">
                {progress.visitedScientists.length} / 15
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200">
              <p className="text-xs text-slate-500">تحديات المخبر</p>
              <p className="text-2xl font-mono font-bold text-[#0B172A]">
                {progress.solvedLabChallenges.length} / 4
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تعيين التقدم</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-semibold">تأكيد المسح؟</span>
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-1 rounded bg-rose-600 text-white text-xs cursor-pointer"
                >
                  نعم
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1 rounded bg-slate-200 text-slate-700 text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-5 py-2 rounded-lg bg-[#0B172A] text-white text-sm font-semibold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
