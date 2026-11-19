import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Calculator,
  Calendar,
  CheckCircle2,
  FlaskConical,
  HelpCircle,
  Landmark,
  Lightbulb,
  XCircle,
} from 'lucide-react';
import { ERAS_DATA } from '../data/erasData';
import { SCIENTISTS_DATA } from '../data/scientistsData';
import { AppSection, EraId, UserProgress } from '../types/geometry';
import {
  EraGeometricDiagram,
  ScientistPortraitEmblem,
} from './GeometricDiagrams';

interface EncyclopediaSectionProps {
  selectedEraId: EraId;
  onSelectEra: (eraId: EraId) => void;
  onOpenScientist: (scientistId: string) => void;
  onNavigate: (section: AppSection) => void;
  progress: UserProgress;
  onMarkEraExplored: (eraId: EraId) => void;
  onRecordEraQuiz: (questionId: string, isCorrect: boolean) => void;
}

export const EncyclopediaSection: React.FC<EncyclopediaSectionProps> = ({
  selectedEraId,
  onSelectEra,
  onOpenScientist,
  onNavigate,
  progress,
  onMarkEraExplored,
  onRecordEraQuiz,
}) => {
  const eraIndex = Math.max(
    0,
    ERAS_DATA.findIndex((e) => e.id === selectedEraId)
  );
  const era = ERAS_DATA[eraIndex];

  const [activeSubTopicIdx, setActiveSubTopicIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveSubTopicIdx(0);
    onMarkEraExplored(era.id);
  }, [era.id, onMarkEraExplored]);

  const relatedScientists = SCIENTISTS_DATA.filter((s) =>
    era.scientistIds.includes(s.id)
  );

  const activeSubTopic = era.subTopics[activeSubTopicIdx] || era.subTopics[0];

  const handleAnswer = (questionId: string, optionIdx: number, correctIdx: number) => {
    if (selectedAnswers[questionId] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    onRecordEraQuiz(questionId, optionIdx === correctIdx);
  };

  const prevEra = eraIndex > 0 ? ERAS_DATA[eraIndex - 1] : null;
  const nextEra =
    eraIndex < ERAS_DATA.length - 1 ? ERAS_DATA[eraIndex + 1] : null;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Top Timeline Rail */}
      <div className="bg-[#0B172A] text-white border-b border-[#C8972C]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs text-[#EBD08A] font-medium">
                الموسوعة التاريخية التفاعلية
              </p>
              <h1 className="text-xl sm:text-2xl font-bold font-editorial">
                التاريخ الكامل لعلم الهندسة عبر العصور
              </h1>
            </div>
            <span className="text-xs text-slate-300 tabular-nums shrink-0">
              المرحلة {eraIndex + 1} من {ERAS_DATA.length}
            </span>
          </div>

          {/* Horizontal Scrollable Era Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {ERAS_DATA.map((item) => {
              const isActive = item.id === era.id;
              const isExplored = progress.exploredEras.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectEra(item.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#C8972C] text-[#0B172A] font-bold'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  <span className="font-mono tabular-nums opacity-75">
                    {item.orderNumber}
                  </span>
                  <span>{item.title}</span>
                  {isExplored && !isActive && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#EBD08A]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Era Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* Era Overview Split Header */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3 tabular-nums">
                  <span className="font-semibold text-[#C8972C]">
                    المرحلة {era.orderNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{era.period}</span>
                  <span aria-hidden="true">·</span>
                  <span>{era.subTopics.length} محاور علمية</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold font-editorial text-[#0B172A] mb-3">
                  {era.title}
                </h2>
                <p className="text-base font-medium text-[#1D355D] mb-4">
                  {era.subtitle}
                </p>
                <p className="text-slate-700 leading-relaxed text-base">
                  {era.summary}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('lab')}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 text-[#EBD08A]" />
                  <span>جرّب نظريات هذه المرحلة في المخبر</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#0B172A] min-h-[240px] relative">
              {!imgErrors[era.id] ? (
                <img
                  src={era.bannerImage}
                  alt={era.title}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [era.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <EraGeometricDiagram type={era.diagramType} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07101F]/90 to-transparent p-4">
                <p className="text-xs text-[#EBD08A]">{era.period}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-topics Interactive Encyclopedia Reader */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sub-topic Narrative Column (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C8972C] mb-3">
              <BookOpenCheck className="w-4 h-4" />
              <span>الشرح التاريخي والعلمي المفصل</span>
            </div>

            {/* Sub-topic selector buttons */}
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-100">
              {era.subTopics.map((sub, idx) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSubTopicIdx(idx)}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    idx === activeSubTopicIdx
                      ? 'bg-[#0B172A] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sub.title}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">
                {activeSubTopic.locationOrFocus}
              </p>
              <h3 className="text-2xl font-bold font-editorial text-[#0B172A] mb-4">
                {activeSubTopic.title}
              </h3>
              <p className="text-slate-700 leading-loose text-base mb-6">
                {activeSubTopic.narrative}
              </p>

              <h4 className="text-sm font-bold text-[#0B172A] mb-3">
                أبرز الإنجازات والاكتشافات:
              </h4>
              <ul className="space-y-3 mb-6">
                {activeSubTopic.achievements.map((ach, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm sm:text-base text-slate-700 leading-relaxed"
                  >
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#C8972C] shrink-0" />
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>

              <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#C8972C]/35 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#C8972C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#0B172A] mb-1">
                    الخلاصة العلمية
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeSubTopic.keyInsight}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Diagram + Key Dates (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Geometric Diagram Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-[#C8972C] mb-3">
                الرسم الهندسي التوضيحي
              </p>
              <EraGeometricDiagram type={era.diagramType} />
              <p className="text-xs text-slate-600 leading-relaxed mt-3">
                {era.diagramCaption}
              </p>
            </div>

            {/* Key Dates Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B172A] mb-4">
                <Calendar className="w-4 h-4 text-[#C8972C]" />
                <span>أهم التواريخ والأحداث</span>
              </div>
              <ol className="space-y-4">
                {era.keyDates.map((kd, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <span className="font-mono text-xs font-bold text-[#0B172A] bg-[#FBF9F4] border border-[#C8972C]/40 px-2.5 py-1 rounded shrink-0 tabular-nums">
                      {kd.year}
                    </span>
                    <span className="text-sm text-slate-700 leading-relaxed">
                      {kd.event}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Theorems & Solved Mathematical Examples */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theorems & Mathematical Rules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <p className="text-xs font-semibold text-[#C8972C] mb-1">
              النظريات والقواعد الرياضية
            </p>
            <h3 className="text-2xl font-bold font-editorial text-[#0B172A] mb-5">
              الصيغ والقوانين المؤسِّسة لهذه الحقبة
            </h3>
            <div className="space-y-4">
              {era.theorems.map((th, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200"
                >
                  <h4 className="font-bold text-sm sm:text-base text-[#0B172A] mb-2">
                    {th.title}
                  </h4>
                  <div
                    dir="ltr"
                    className="font-mono text-sm sm:text-base bg-[#0B172A] text-[#EBD08A] px-4 py-2.5 rounded-lg mb-2.5 overflow-x-auto text-center"
                  >
                    {th.formula}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {th.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Solved Examples */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C8972C] mb-1">
              <Calculator className="w-4 h-4" />
              <span>تطبيقات عددية</span>
            </div>
            <h3 className="text-2xl font-bold font-editorial text-[#0B172A] mb-5">
              أمثلة رياضية محلولة خطوة بخطوة
            </h3>
            <div className="space-y-6">
              {era.solvedExamples.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-[#FBF9F4] border border-[#C8972C]/35"
                >
                  <h4 className="font-bold text-base text-[#0B172A] mb-2">
                    {ex.title}
                  </h4>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed mb-4 pb-3 border-b border-[#C8972C]/20">
                    {ex.problem}
                  </p>
                  <ol className="space-y-2 mb-4">
                    {ex.steps.map((step, sIdx) => (
                      <li
                        key={sIdx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed"
                      >
                        <span className="font-mono text-xs font-bold text-[#0B172A] bg-white border border-slate-300 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="bg-[#0B172A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between">
                    <span className="text-[#EBD08A]">النتيجة النهائية:</span>
                    <span dir="ltr" className="font-mono">
                      {ex.finalAnswer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Scientists Row */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-[#C8972C] mb-1">
                رواد المرحلة
              </p>
              <h3 className="text-2xl font-bold font-editorial text-[#0B172A]">
                أبرز العلماء المرتبطين بهذه الحقبة
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('museum')}
              className="text-sm font-semibold text-[#1D355D] hover:text-[#C8972C] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Landmark className="w-4 h-4" />
              <span>تصفح المتحف الكامل</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedScientists.map((sci) => (
              <button
                key={sci.id}
                type="button"
                onClick={() => onOpenScientist(sci.id)}
                className="text-right p-4 rounded-xl border border-slate-200 hover:border-[#C8972C] bg-[#F8FAFC] hover:bg-white transition-all flex items-center gap-4 cursor-pointer"
              >
                <ScientistPortraitEmblem motif={sci.motif} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 tabular-nums">
                    {sci.lifespan}
                  </p>
                  <h4 className="font-bold text-base text-[#0B172A] truncate">
                    {sci.name}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                    {sci.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Interactive Comprehension Check */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C8972C] mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>اختبر فهمك للمرحلة</span>
          </div>
          <h3 className="text-2xl font-bold font-editorial text-[#0B172A] mb-6">
            أسئلة تفاعلية فورية
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {era.comprehensionQuiz.map((q, qIdx) => {
              const userChoice = selectedAnswers[q.id];
              const isAnswered = userChoice !== undefined;
              const isCorrect = userChoice === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-mono text-slate-500 mb-2 tabular-nums">
                      سؤال {qIdx + 1} · +15 نقطة
                    </p>
                    <h4 className="font-bold text-base text-[#0B172A] mb-4 leading-relaxed">
                      {q.question}
                    </h4>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle =
                          'bg-white border-slate-200 text-slate-800 hover:border-[#C8972C]';
                        if (isAnswered) {
                          if (optIdx === q.correctIndex) {
                            btnStyle =
                              'bg-emerald-50 border-emerald-600 text-emerald-900 font-semibold';
                          } else if (optIdx === userChoice) {
                            btnStyle =
                              'bg-rose-50 border-rose-600 text-rose-900';
                          } else {
                            btnStyle =
                              'bg-white/60 border-slate-200 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isAnswered}
                            onClick={() =>
                              handleAnswer(q.id, optIdx, q.correctIndex)
                            }
                            className={`w-full min-h-[44px] text-right px-4 py-2.5 rounded-lg border text-sm transition-colors flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            )}
                            {isAnswered &&
                              optIdx === userChoice &&
                              optIdx !== q.correctIndex && (
                                <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                              )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isAnswered && (
                    <div
                      className={`mt-4 p-3.5 rounded-lg text-sm leading-relaxed border ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}
                    >
                      <span className="font-bold block mb-1">
                        {isCorrect ? 'أحسنت! إجابة صحيحة' : 'توضيح علمي:'}
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Era Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          {prevEra ? (
            <button
              type="button"
              onClick={() => onSelectEra(prevEra.id)}
              className="min-h-[46px] px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:border-[#0B172A] text-[#0B172A] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق: {prevEra.title}</span>
            </button>
          ) : (
            <div />
          )}

          {nextEra ? (
            <button
              type="button"
              onClick={() => onSelectEra(nextEra.id)}
              className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>المرحلة التالية: {nextEra.title}</span>
              <ArrowLeft className="w-4 h-4 text-[#EBD08A]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('lab')}
              className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#C8972C] hover:bg-[#DDB14A] text-[#0B172A] text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>انتقل الآن إلى مخبر الهندسة الافتراضي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
