import { useCallback, useEffect, useState } from 'react';
import { EraId, UserProgress } from '../types/geometry';

const STORAGE_KEY = 'geometry_journey_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  studentName: 'طالب باحث',
  totalPoints: 0,
  exploredEras: ['ancient'],
  completedEraQuizzes: [],
  solvedLabChallenges: [],
  completedExperiments: [],
  answeredActivityIds: [],
  correctActivityIds: [],
  visitedScientists: [],
};

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProgress>;
        return { ...DEFAULT_PROGRESS, ...parsed };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore quota errors
    }
  }, [progress]);

  const setStudentName = useCallback((name: string) => {
    setProgress((prev) => ({
      ...prev,
      studentName: name.trim() || 'طالب باحث',
    }));
  }, []);

  const markEraExplored = useCallback((eraId: EraId) => {
    setProgress((prev) => {
      if (prev.exploredEras.includes(eraId)) return prev;
      return {
        ...prev,
        exploredEras: [...prev.exploredEras, eraId],
        totalPoints: prev.totalPoints + 10,
      };
    });
  }, []);

  const recordEraQuiz = useCallback((questionId: string, isCorrect: boolean) => {
    setProgress((prev) => {
      if (prev.completedEraQuizzes.includes(questionId)) return prev;
      return {
        ...prev,
        completedEraQuizzes: [...prev.completedEraQuizzes, questionId],
        totalPoints: prev.totalPoints + (isCorrect ? 15 : 5),
      };
    });
  }, []);

  const recordExperiment = useCallback((expId: string) => {
    setProgress((prev) => {
      if (prev.completedExperiments.includes(expId)) return prev;
      return {
        ...prev,
        completedExperiments: [...prev.completedExperiments, expId],
        totalPoints: prev.totalPoints + 15,
      };
    });
  }, []);

  const recordLabChallenge = useCallback((challengeId: string, points: number) => {
    setProgress((prev) => {
      if (prev.solvedLabChallenges.includes(challengeId)) return prev;
      return {
        ...prev,
        solvedLabChallenges: [...prev.solvedLabChallenges, challengeId],
        totalPoints: prev.totalPoints + points,
      };
    });
  }, []);

  const recordActivity = useCallback(
    (activityId: string, isCorrect: boolean, points: number) => {
      setProgress((prev) => {
        if (prev.answeredActivityIds.includes(activityId)) return prev;
        return {
          ...prev,
          answeredActivityIds: [...prev.answeredActivityIds, activityId],
          correctActivityIds: isCorrect
            ? [...prev.correctActivityIds, activityId]
            : prev.correctActivityIds,
          totalPoints: prev.totalPoints + (isCorrect ? points : 0),
        };
      });
    },
    []
  );

  const markScientistVisited = useCallback((scientistId: string) => {
    setProgress((prev) => {
      if (prev.visitedScientists.includes(scientistId)) return prev;
      return {
        ...prev,
        visitedScientists: [...prev.visitedScientists, scientistId],
        totalPoints: prev.totalPoints + 5,
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    progress,
    setStudentName,
    markEraExplored,
    recordEraQuiz,
    recordExperiment,
    recordLabChallenge,
    recordActivity,
    markScientistVisited,
    resetProgress,
  };
}
