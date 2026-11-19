import React from 'react';
import { AppSection, UserProgress } from '../types/geometry';
import { BookOpen, Compass, FlaskConical, Landmark, Trophy } from 'lucide-react';

interface HeaderProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  progress: UserProgress;
  onOpenProgress: () => void;
}

const NAV_ITEMS: { id: AppSection; label: string }[] = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'encyclopedia', label: 'التاريخ الكامل' },
  { id: 'lab', label: 'مخبر الهندسة' },
  { id: 'activities', label: 'الأنشطة والمسابقات' },
  { id: 'museum', label: 'متحف العلماء' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  progress,
  onOpenProgress,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B172A] text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single line, no extra tags) */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-lg sm:text-xl font-bold font-editorial tracking-normal text-white hover:text-[#EBD08A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#DDB14A] rounded"
        >
          رحلة في تاريخ الهندسة
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden lg:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-[#DDB14A] text-[#EBD08A]'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-white/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenProgress}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#C8972C] hover:bg-[#DDB14A] text-[#0B172A] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
          >
            ملف التقدم · {progress.totalPoints} نقطة
          </button>
        </div>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<{
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}> = ({ activeSection, onNavigate }) => {
  const items: { id: AppSection; label: string; Icon: React.ElementType }[] = [
    { id: 'home', label: 'الرئيسية', Icon: Compass },
    { id: 'encyclopedia', label: 'الموسوعة', Icon: BookOpen },
    { id: 'lab', label: 'المخبر', Icon: FlaskConical },
    { id: 'activities', label: 'المسابقات', Icon: Trophy },
    { id: 'museum', label: 'المتحف', Icon: Landmark },
  ];

  return (
    <nav
      aria-label="شريط التنقل السريع للهاتف"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B172A] border-t border-white/15"
    >
      <div className="grid grid-cols-5 h-14 items-center">
        {items.map(({ id, label, Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-[#EBD08A]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.75} />
              <span className="text-[11px] font-medium whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
