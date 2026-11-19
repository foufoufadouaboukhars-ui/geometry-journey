import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  FlaskConical,
  Landmark,
  Trophy,
} from 'lucide-react';
import { AppSection, EraId, UserProgress } from '../types/geometry';
import { ERAS_DATA } from '../data/erasData';

interface HeroSectionProps {
  onNavigate: (section: AppSection, eraId?: EraId) => void;
  progress: UserProgress;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  progress,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const pillars: {
    id: AppSection;
    num: string;
    title: string;
    desc: string;
    meta: string;
    Icon: React.ElementType;
  }[] = [
    {
      id: 'encyclopedia',
      num: '01',
      title: 'الموسوعة التاريخية الكاملة',
      desc: 'سبع حقب تاريخية موثقة من أهرامات مصر وألواح بابل حتى فضاءات ريمان والهندسة الحاسوبية، مع أمثلة محلولة وأسئلة فهم.',
      meta: `${progress.exploredEras.length} من 7 مراحل مستكشفة`,
      Icon: BookOpen,
    },
    {
      id: 'lab',
      num: '02',
      title: 'مخبر الهندسة الافتراضي',
      desc: 'فضاء عمل تفاعلي ثنائي وثلاثي الأبعاد لرسم الأشكال وتحريك النقاط وإجراء التجارب التاريخية والهندسية المباشرة.',
      meta: `${progress.completedExperiments.length} تجارب مكتملة`,
      Icon: FlaskConical,
    },
    {
      id: 'activities',
      num: '03',
      title: 'الأنشطة وتحدي كاهووت المباشر',
      desc: 'لعبة تفاعلية مباشرة بأسلوب كاهووت يشارك فيها جميع الطلبة من هواتفهم برمز PIN، مع ألغاز هندسية وتحديات مصححة.',
      meta: `${progress.correctActivityIds.length} إجابات صحيحة`,
      Icon: Trophy,
    },
    {
      id: 'museum',
      num: '04',
      title: 'متحف علماء الهندسة',
      desc: 'معرض سير وإنجازات 15 عالماً أسّسوا علم الهندسة من طاليس وإقليدس إلى الخوارزمي والبيروني وغاوس وريمان.',
      meta: `${progress.visitedScientists.length} من 15 عالماً`,
      Icon: Landmark,
    },
  ];

  return (
    <div className="bg-[#F8FAFC]">
      {/* Architectural Navy Hero Band */}
      <section className="relative overflow-hidden bg-[#0B172A] text-white bg-blueprint-grid border-b border-[#C8972C]/30">
        {/* Animated Background Geometric Wireframes */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-25"
          aria-hidden="true"
        >
          <motion.svg
            viewBox="0 0 600 600"
            className="absolute -left-24 -top-24 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              cx="300"
              cy="300"
              r="240"
              fill="none"
              stroke="#C8972C"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <polygon
              points="300,60 507,420 93,420"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1"
            />
            <polygon
              points="300,540 507,180 93,180"
              fill="none"
              stroke="#EBD08A"
              strokeWidth="1"
            />
            <circle cx="300" cy="300" r="120" fill="none" stroke="#FFFFFF" strokeWidth="0.75" />
          </motion.svg>

          <motion.svg
            viewBox="0 0 400 400"
            className="hidden lg:block absolute -right-20 bottom-0 w-[380px] h-[380px]"
            animate={{ rotate: -360 }}
            transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
          >
            <rect
              x="70"
              y="70"
              width="260"
              height="260"
              fill="none"
              stroke="#C8972C"
              strokeWidth="1"
            />
            <rect
              x="70"
              y="70"
              width="260"
              height="260"
              transform="rotate(45 200 200)"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
            <circle cx="200" cy="200" r="184" fill="none" stroke="#60A5FA" strokeWidth="0.8" />
          </motion.svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Editorial Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs sm:text-sm font-medium text-[#EBD08A] mb-3 tracking-normal">
                عرض جامعي تفاعلي · 5000 عام من التطور الهندسي
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-editorial text-white leading-tight mb-5">
                رحلة في تاريخ الهندسة
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mb-8">
                موسوعة علمية تفاعلية ومخبر هندسي افتراضي يأخذك في رحلة متكاملة من
                حبال المسّاحين على ضفاف النيل وأصول إقليدس، مروراً بإبداعات علماء
                الحضارة الإسلامية، وصولاً إلى الهندسات اللاإقليدية والنمذجة ثلاثية
                الأبعاد في التكنولوجيا الحديثة.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('encyclopedia', 'ancient')}
                  className="min-h-[48px] px-7 py-3 rounded-lg bg-[#C8972C] hover:bg-[#DDB14A] text-[#0B172A] font-bold text-base inline-flex items-center gap-3 transition-colors cursor-pointer shadow-lg"
                >
                  <span>ابدأ الرحلة</span>
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('lab')}
                  className="min-h-[48px] px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold text-base inline-flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-5 h-5 text-[#EBD08A]" />
                  <span>ادخل مخبر الهندسة</span>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300 tabular-nums">
                <span>7 حقب تاريخية متكاملة</span>
                <span aria-hidden="true">·</span>
                <span>15 عالماً في المتحف</span>
                <span aria-hidden="true">·</span>
                <span>مخبر تفاعلي 2D و 3D</span>
                <span aria-hidden="true">·</span>
                <span>مسابقة جامعية مباشرة</span>
              </div>
            </div>

            {/* Hero Artwork Frame */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#C8972C]/40 bg-[#132542] shadow-2xl min-h-[260px] lg:min-h-[380px]">
                {!imgFailed ? (
                  <img
                    src="/src/assets/images/hero_geometry_compass_1795040379986.jpg"
                    alt="الفرجار الهندسي والنسبة الذهبية والمجسمات الأفلاطونية"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <Compass className="w-16 h-16 text-[#DDB14A] mb-3" />
                    <p className="text-lg font-editorial text-white">
                      الهندسة الإقليدية والفضاءات المعاصرة
                    </p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07101F]/95 via-[#07101F]/60 to-transparent p-5">
                  <p className="text-xs text-[#EBD08A] font-medium">
                    النموذج الجامعي التفاعلي
                  </p>
                  <p className="text-sm sm:text-base text-white font-semibold mt-0.5">
                    من حبل العقد الـ 12 والمثلث القائم إلى الفضاءات الريمانية والنمذجة الحاسوبية
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Directory of All App Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold text-[#C8972C] mb-1">
              فهرس أقسام التطبيق
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#0B172A]">
              أركان الرحلة العلمية والمخبرية
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            صُمم كل قسم ليعمل بسلاسة في المحاضرة الجامعية وعلى شاشات الهواتف
            المحمولة مع حفظ فوري لتقدم الطالب.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map(({ id, num, title, desc, meta, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="group text-right bg-white rounded-xl border border-slate-200 hover:border-[#C8972C] p-6 sm:p-7 transition-all shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-[#0B172A] text-[#EBD08A] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                      {num}.
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    {meta}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-editorial text-[#0B172A] group-hover:text-[#1D355D] mb-2">
                  {title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-[#0B172A] group-hover:text-[#C8972C]">
                <span>فتح القسم</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Timeline Strip Jumping Straight into Any of the 7 Eras */}
      <section className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#C8972C] mb-1">
              الخط الزمني التفاعلي
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#0B172A]">
              المراحل السبع لتطور علم الهندسة
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {ERAS_DATA.map((era) => {
              const visited = progress.exploredEras.includes(era.id);
              return (
                <button
                  key={era.id}
                  type="button"
                  onClick={() => onNavigate('encyclopedia', era.id)}
                  className="text-right p-4 rounded-xl border border-slate-200 hover:border-[#C8972C] bg-[#F8FAFC] hover:bg-white transition-all flex flex-col justify-between cursor-pointer min-h-[120px]"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2 tabular-nums">
                      <span>{era.orderNumber}</span>
                      <span>{visited ? 'تمت المطالعة' : 'غير مقروء'}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0B172A] leading-snug mb-1">
                      {era.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#C8972C] font-medium mt-2 tabular-nums">
                    {era.period}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
