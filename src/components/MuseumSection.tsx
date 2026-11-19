import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Landmark,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { SCIENTISTS_DATA } from '../data/scientistsData';
import { EraId, Scientist, UserProgress } from '../types/geometry';
import { ScientistPortraitEmblem } from './GeometricDiagrams';

interface MuseumSectionProps {
  selectedScientistId: string | null;
  onSelectScientist: (id: string | null) => void;
  onGoToEra: (eraId: EraId) => void;
  progress: UserProgress;
  onMarkScientistVisited: (id: string) => void;
}

const ERA_FILTERS: { id: 'all' | EraId; label: string }[] = [
  { id: 'all', label: 'جميع العصور' },
  { id: 'greek', label: 'الإغريق' },
  { id: 'islamic', label: 'الحضارة الإسلامية' },
  { id: 'renaissance', label: 'عصر النهضة' },
  { id: 'modern', label: 'العصر الحديث' },
  { id: 'contemporary', label: 'العصر المعاصر' },
];

export const MuseumSection: React.FC<MuseumSectionProps> = ({
  selectedScientistId,
  onSelectScientist,
  onGoToEra,
  progress,
  onMarkScientistVisited,
}) => {
  const [eraFilter, setEraFilter] = useState<'all' | EraId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScientists = useMemo(() => {
    return SCIENTISTS_DATA.filter((s) => {
      const matchesEra = eraFilter === 'all' || s.eraId === eraFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.latinName.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.theorems.some((t) => t.toLowerCase().includes(q));
      return matchesEra && matchesSearch;
    });
  }, [eraFilter, searchQuery]);

  const activeScientist: Scientist | null = useMemo(
    () =>
      SCIENTISTS_DATA.find((s) => s.id === selectedScientistId) || null,
    [selectedScientistId]
  );

  const handleOpenCard = (sci: Scientist) => {
    onSelectScientist(sci.id);
    onMarkScientistVisited(sci.id);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Museum Institutional Banner */}
      <div className="bg-[#0B172A] text-white border-b border-[#C8972C]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#EBD08A] font-medium mb-2">
                <Landmark className="w-4 h-4" />
                <span>المتحف الافتراضي للعلوم الهندسية</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-editorial mb-2">
                متحف علماء الهندسة عبر التاريخ
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                أرشيف علمي يوثّق سير أعظم علماء الهندسة ومؤلفاتهم واكتشافاتهم
                والنظريات الخالدة المرتبطة بأسمائهم.
              </p>
            </div>
            <div className="text-sm text-slate-300 tabular-nums">
              زرت <span className="text-[#EBD08A] font-bold">{progress.visitedScientists.length}</span> من {SCIENTISTS_DATA.length} قاعات
            </div>
          </div>

          {/* Search & Era Filter Controls */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {ERA_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEraFilter(f.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    eraFilter === f.id
                      ? 'bg-[#C8972C] text-[#0B172A] font-bold'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عالم أو نظرية..."
                className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#DDB14A]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Museum Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {filteredScientists.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-lg font-bold text-[#0B172A] mb-2">
              لا توجد نتائج مطابقة للبحث
            </p>
            <p className="text-sm text-slate-600 mb-4">
              جرّب تغيير الفلتر الزمني أو البحث باسم العالم بالعربية أو الإنجليزية.
            </p>
            <button
              type="button"
              onClick={() => {
                setEraFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-[#0B172A] text-white text-sm font-medium cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScientists.map((sci) => {
              const visited = progress.visitedScientists.includes(sci.id);
              return (
                <article
                  key={sci.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#C8972C] transition-all shadow-sm hover:shadow-md flex flex-col justify-between p-6"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <ScientistPortraitEmblem motif={sci.motif} size="sm" />
                      <div className="text-left text-xs text-slate-500 tabular-nums">
                        <span className="block font-medium text-[#0B172A]">
                          {sci.lifespan}
                        </span>
                        <span className="block mt-0.5">{sci.origin}</span>
                        {visited && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تمت الزيارة
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-medium text-[#C8972C] mb-1">
                      {sci.eraLabel}
                    </p>
                    <h2 className="text-xl font-bold font-editorial text-[#0B172A]">
                      {sci.name}
                    </h2>
                    <p
                      dir="ltr"
                      className="text-xs font-mono text-slate-400 text-right mb-2"
                    >
                      {sci.latinName}
                    </p>
                    <p className="text-sm font-semibold text-[#1D355D] mb-3">
                      {sci.title}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                      {sci.biography}
                    </p>
                  </div>

                  <div>
                    <div
                      dir="ltr"
                      className="font-mono text-xs bg-[#F8FAFC] border border-slate-200 text-[#0B172A] px-3 py-2 rounded-lg mb-4 text-center truncate"
                    >
                      {sci.signatureFormula}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCard(sci)}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>عرض السيرة والنظريات الكاملة</span>
                      <ArrowLeft className="w-4 h-4 text-[#EBD08A]" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Scientist Detailed Exhibit Modal */}
      {activeScientist && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scientist-modal-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => onSelectScientist(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Navy Header */}
            <div className="bg-[#0B172A] text-white p-6 sm:p-8 flex items-start justify-between gap-4 border-b border-[#C8972C]/40">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <ScientistPortraitEmblem
                  motif={activeScientist.motif}
                  size="lg"
                />
                <div>
                  <p className="text-xs text-[#EBD08A] font-medium mb-1">
                    {activeScientist.eraLabel} · {activeScientist.lifespan}
                  </p>
                  <h2
                    id="scientist-modal-title"
                    className="text-2xl sm:text-3xl font-bold font-editorial"
                  >
                    {activeScientist.name}
                  </h2>
                  <p dir="ltr" className="text-xs font-mono text-slate-300 text-right mt-0.5">
                    {activeScientist.latinName} · {activeScientist.origin}
                  </p>
                  <p className="text-sm text-slate-200 mt-2">
                    {activeScientist.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="إغلاق النافذة"
                onClick={() => onSelectScientist(null)}
                className="min-w-[44px] min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#C8972C] mb-2">
                  نبذة عن حياته ومكانته العلمية
                </h3>
                <p className="text-slate-700 leading-loose text-base">
                  {activeScientist.biography}
                </p>
              </div>

              <div
                dir="ltr"
                className="font-mono text-sm sm:text-base bg-[#0B172A] text-[#EBD08A] p-4 rounded-xl text-center"
              >
                {activeScientist.signatureFormula}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0B172A] mb-3">
                    <BookOpen className="w-4 h-4 text-[#C8972C]" />
                    <span>أهم المؤلفات</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {activeScientist.majorWorks.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C8972C] shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0B172A] mb-3">
                    <Sparkles className="w-4 h-4 text-[#C8972C]" />
                    <span>الاكتشافات والإسهامات</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {activeScientist.discoveries.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1D355D] shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#C8972C]/35">
                <h3 className="text-sm font-bold text-[#0B172A] mb-3">
                  النظريات والقواعد المرتبطة به
                </h3>
                <ul className="space-y-2 text-sm text-slate-800">
                  {activeScientist.theorems.map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#C8972C] mt-0.5 tabular-nums">
                        0{i + 1}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onGoToEra(activeScientist.eraId);
                    onSelectScientist(null);
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#C8972C] hover:bg-[#DDB14A] text-[#0B172A] text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>اقرأ عن حقبته في الموسوعة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectScientist(null)}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
