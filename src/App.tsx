import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AppSection, EraId } from './types/geometry';
import { useProgress } from './hooks/useProgress';
import { useLiveLecture } from './hooks/useLiveLecture';
import { Header, MobileBottomNav } from './components/Header';
import { PresenterControlBar } from './components/PresenterControlBar';
import { StudentLiveView } from './components/StudentLiveView';
import { HeroSection } from './components/HeroSection';
import { EncyclopediaSection } from './components/EncyclopediaSection';
import { GeometryLab } from './components/GeometryLab';
import { ActivitiesSection } from './components/ActivitiesSection';
import { MuseumSection } from './components/MuseumSection';
import { ProgressModal } from './components/ProgressModal';
import { AnimatedGeometryTheater } from './components/AnimatedGeometryTheater';

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [selectedEraId, setSelectedEraId] = useState<EraId>('ancient');
  const [selectedScientistId, setSelectedScientistId] = useState<string | null>(
    null
  );
  const [progressOpen, setProgressOpen] = useState(false);
  const [previewStudentUi, setPreviewStudentUi] = useState(false);
  const [studentFreeBrowse, setStudentFreeBrowse] = useState(false);

  const {
    progress,
    setStudentName,
    markEraExplored,
    recordEraQuiz,
    recordExperiment,
    recordLabChallenge,
    recordActivity,
    markScientistVisited,
    resetProgress,
  } = useProgress();

  const liveLecture = useLiveLecture((pts) =>
    recordActivity(`kahoot-${Date.now()}`, true, pts)
  );

  const accessMode = liveLecture.roomState?.lectureControl.studentAccessMode;

  // Automatically snap students back to the synchronized StudentLiveView when presenter turns off free exploration
  useEffect(() => {
    if (accessMode !== 'free') {
      setStudentFreeBrowse(false);
    }
  }, [accessMode]);

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }, []);

  const handleNavigate = (section: AppSection, eraId?: EraId) => {
    setActiveSection(section);
    const nextEra = eraId || selectedEraId;
    if (eraId) {
      setSelectedEraId(eraId);
    }
    if (
      !liveLecture.isStudentPortal &&
      !previewStudentUi &&
      liveLecture.roomState?.role === 'host' &&
      liveLecture.roomState.lectureControl.studentAccessMode === 'follow'
    ) {
      liveLecture.setLectureMode({
        currentSection: section,
        currentEraId: nextEra,
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEra = (eraId: EraId) => {
    setSelectedEraId(eraId);
    if (
      !liveLecture.isStudentPortal &&
      !previewStudentUi &&
      liveLecture.roomState?.role === 'host' &&
      liveLecture.roomState.lectureControl.studentAccessMode === 'follow'
    ) {
      liveLecture.setLectureMode({
        currentSection: 'encyclopedia',
        currentEraId: eraId,
      });
    }
  };

  const handleOpenScientist = (scientistId: string) => {
    setSelectedScientistId(scientistId);
    markScientistVisited(scientistId);
    handleNavigate('museum');
  };

  // ==================== STUDENT PORTAL INTERFACE (SEPARATE FROM PRESENTER) ====================
  if (liveLecture.isStudentPortal || previewStudentUi) {
    if (accessMode === 'free' && studentFreeBrowse) {
      return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
          {previewStudentUi && (
            <div className="bg-[#C8972C] text-[#0B172A] px-4 py-2 text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-2">
              <span>
                وضع معاينة «واجهة الطالب» — التجربة الحرة مفعّلة حالياً
              </span>
              <button
                type="button"
                onClick={() => {
                  setPreviewStudentUi(false);
                  setStudentFreeBrowse(false);
                }}
                className="px-3.5 py-1 rounded-lg bg-[#0B172A] text-white text-xs font-bold cursor-pointer"
              >
                العودة إلى لوحة الأستاذ
              </button>
            </div>
          )}

          {/* Minimal Student Navigation Bar (No Presenter Controls) */}
          <header className="sticky top-0 z-40 bg-[#0B172A] text-white border-b border-[#C8972C]/35 px-4 py-3">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStudentFreeBrowse(false)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#C8972C] text-[#0B172A] font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لبوابة الجلسة المباشرة</span>
              </button>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSection('encyclopedia')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    activeSection === 'encyclopedia'
                      ? 'bg-white/20 text-[#EBD08A] font-bold'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  الموسوعة
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('lab')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    activeSection === 'lab'
                      ? 'bg-white/20 text-[#EBD08A] font-bold'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  المخبر الافتراضي
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('museum')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    activeSection === 'museum'
                      ? 'bg-white/20 text-[#EBD08A] font-bold'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  متحف العلماء
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {activeSection === 'encyclopedia' && (
              <EncyclopediaSection
                selectedEraId={selectedEraId}
                onSelectEra={setSelectedEraId}
                onOpenScientist={handleOpenScientist}
                onNavigate={(sec) => setActiveSection(sec)}
                progress={progress}
                onMarkEraExplored={markEraExplored}
                onRecordEraQuiz={recordEraQuiz}
              />
            )}
            {activeSection === 'lab' && (
              <GeometryLab
                progress={progress}
                onRecordExperiment={recordExperiment}
                onRecordChallenge={recordLabChallenge}
              />
            )}
            {activeSection === 'museum' && (
              <MuseumSection
                selectedScientistId={selectedScientistId}
                onSelectScientist={setSelectedScientistId}
                onGoToEra={(eraId) => {
                  setSelectedEraId(eraId);
                  setActiveSection('encyclopedia');
                }}
                progress={progress}
                onMarkScientistVisited={markScientistVisited}
              />
            )}
            {activeSection === 'activities' && (
              <ActivitiesSection
                progress={progress}
                isStudentFreeMode
                wsConnected={liveLecture.wsConnected}
                errorMsg={liveLecture.errorMsg}
                onClearError={liveLecture.clearError}
                roomState={liveLecture.roomState}
                remainingSec={liveLecture.remainingSec}
                currentSection={activeSection}
                currentEraId={selectedEraId}
                onCreateRoom={liveLecture.createRoom}
                onLeaveRoom={liveLecture.leaveRoom}
                onHostAction={liveLecture.hostAction}
                onToggleSubmissionsLock={liveLecture.toggleSubmissionsLock}
                onEnterStudentPortal={liveLecture.enterStudentPortal}
                onPreviewStudentUi={() => setPreviewStudentUi(true)}
                onRecordActivity={recordActivity}
              />
            )}
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        {previewStudentUi && (
          <div className="bg-[#C8972C] text-[#0B172A] px-4 py-2 text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-2">
            <span>
              أنت الآن في وضع معاينة «واجهة الطالب» — هذا ما يظهر على هواتف الطلبة
            </span>
            <button
              type="button"
              onClick={() => {
                setPreviewStudentUi(false);
                setStudentFreeBrowse(false);
              }}
              className="px-3.5 py-1 rounded-lg bg-[#0B172A] text-white text-xs font-bold cursor-pointer"
            >
              العودة إلى لوحة الأستاذ
            </button>
          </div>
        )}

        <StudentLiveView
          urlPin={liveLecture.urlPin}
          wsConnected={liveLecture.wsConnected}
          errorMsg={liveLecture.errorMsg}
          onClearError={liveLecture.clearError}
          roomState={liveLecture.roomState}
          remainingSec={liveLecture.remainingSec}
          onJoinRoom={liveLecture.joinRoom}
          onSubmitAnswer={liveLecture.submitAnswer}
          onLeaveRoom={liveLecture.leaveRoom}
          onExitStudentDemo={
            !liveLecture.urlLocked && !previewStudentUi
              ? liveLecture.exitStudentPortalDemo
              : undefined
          }
          isPreviewOnly={previewStudentUi && !liveLecture.roomState?.me}
          onFreeNavigate={(sec, eraId) => {
            if (eraId) setSelectedEraId(eraId);
            setActiveSection(sec);
            setStudentFreeBrowse(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // ==================== PRESENTER / MAIN LECTURE INTERFACE ====================
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] pb-14 lg:pb-0">
      <Header
        activeSection={activeSection}
        onNavigate={(sec) => handleNavigate(sec)}
        progress={progress}
        onOpenProgress={() => setProgressOpen(true)}
      />

      <PresenterControlBar
        wsConnected={liveLecture.wsConnected}
        roomState={liveLecture.roomState}
        currentSection={activeSection}
        currentEraId={selectedEraId}
        previewStudentUi={previewStudentUi}
        onTogglePreviewStudent={() => setPreviewStudentUi((v) => !v)}
        onCreateSession={liveLecture.createRoom}
        onSetLectureMode={liveLecture.setLectureMode}
        onEndSession={liveLecture.leaveRoom}
        onOpenKahootDashboard={() => handleNavigate('activities')}
      />

      <main className="flex-1">
        {activeSection === 'home' && (
          <>
            <HeroSection
              onNavigate={handleNavigate}
              progress={progress}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
              <AnimatedGeometryTheater />
            </div>
          </>
        )}

        {activeSection === 'encyclopedia' && (
          <EncyclopediaSection
            selectedEraId={selectedEraId}
            onSelectEra={handleSelectEra}
            onOpenScientist={handleOpenScientist}
            onNavigate={(sec) => handleNavigate(sec)}
            progress={progress}
            onMarkEraExplored={markEraExplored}
            onRecordEraQuiz={recordEraQuiz}
          />
        )}

        {activeSection === 'lab' && (
          <GeometryLab
            progress={progress}
            onRecordExperiment={recordExperiment}
            onRecordChallenge={recordLabChallenge}
          />
        )}

        {activeSection === 'activities' && (
          <ActivitiesSection
            progress={progress}
            wsConnected={liveLecture.wsConnected}
            errorMsg={liveLecture.errorMsg}
            onClearError={liveLecture.clearError}
            roomState={liveLecture.roomState}
            remainingSec={liveLecture.remainingSec}
            currentSection={activeSection}
            currentEraId={selectedEraId}
            onCreateRoom={liveLecture.createRoom}
            onLeaveRoom={liveLecture.leaveRoom}
            onHostAction={liveLecture.hostAction}
            onToggleSubmissionsLock={liveLecture.toggleSubmissionsLock}
            onEnterStudentPortal={liveLecture.enterStudentPortal}
            onPreviewStudentUi={() => setPreviewStudentUi(true)}
            onRecordActivity={recordActivity}
          />
        )}

        {activeSection === 'museum' && (
          <MuseumSection
            selectedScientistId={selectedScientistId}
            onSelectScientist={setSelectedScientistId}
            onGoToEra={(eraId) => handleNavigate('encyclopedia', eraId)}
            progress={progress}
            onMarkScientistVisited={markScientistVisited}
          />
        )}
      </main>

      <footer className="bg-[#0B172A] text-slate-300 border-t border-[#C8972C]/25 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <div>
            <span className="font-editorial font-bold text-white text-base">
              رحلة في تاريخ الهندسة
            </span>
            <span className="mx-2 text-slate-500">·</span>
            <span>موسوعة جامعية تفاعلية ومخبر هندسي افتراضي</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('encyclopedia', 'ancient')}
              className="hover:text-[#EBD08A] cursor-pointer"
            >
              الموسوعة
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('lab')}
              className="hover:text-[#EBD08A] cursor-pointer"
            >
              المخبر
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('activities')}
              className="hover:text-[#EBD08A] cursor-pointer"
            >
              المسابقات
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('museum')}
              className="hover:text-[#EBD08A] cursor-pointer"
            >
              المتحف
            </button>
          </div>
        </div>
      </footer>

      <MobileBottomNav
        activeSection={activeSection}
        onNavigate={(sec) => handleNavigate(sec)}
      />

      <ProgressModal
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        progress={progress}
        onUpdateName={setStudentName}
        onReset={resetProgress}
      />
    </div>
  );
}
