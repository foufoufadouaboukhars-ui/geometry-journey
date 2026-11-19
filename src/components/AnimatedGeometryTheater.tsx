import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Film,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface VideoChapter {
  startPct: number;
  title: string;
  subtitle: string;
}

interface AnimatedLesson {
  id: string;
  title: string;
  durationSec: number;
  eraTag: string;
  summary: string;
  chapters: VideoChapter[];
}

const LESSONS: AnimatedLesson[] = [
  {
    id: 'pythagoras-proof',
    title: 'البرهان المتحرك لنظرية فيثاغورس (a² + b² = c²)',
    durationSec: 18,
    eraTag: 'الحضارات القديمة والإغريق',
    summary:
      'شاهد كيف تتحول مساحتا المربعين المنشأين على ضلعي القائمة تدريجياً عبر القص والانزلاق الهندسي لتملآ مربع الوتر بالكامل.',
    chapters: [
      {
        startPct: 0,
        title: 'المثلث القائم وبناء المربعات',
        subtitle: 'نبدأ بمثلث قائم الزاوية أطواله (a, b, c) وننشئ مربعاً على كل ضلع.',
      },
      {
        startPct: 30,
        title: 'قص وإزاحة المثلثات الأربعة',
        subtitle: 'إعادة ترتيب 4 مثلثات متطابقة داخل المربع الكبير ذي الضلع (a + b).',
      },
      {
        startPct: 68,
        title: 'النتيجة الخالدة',
        subtitle: 'المساحة المتبقية تساوي a² + b² أولاً، وتساوي c² بعد الإزاحة — البرهان مكتمل!',
      },
    ],
  },
  {
    id: 'circle-secrets',
    title: 'خصائص الدائرة: طاليس والزاوية المحيطية وحصر أرخميدس لـ π',
    durationSec: 20,
    eraTag: 'الهندسة عند الإغريق',
    summary:
      'عرض حركي متواصل يثبت ثبات الزاوية القائمة على قطر الدائرة (طاليس) ونصف الزاوية المركزية وتقارب المضلعات لقيمة π.',
    chapters: [
      {
        startPct: 0,
        title: 'نظرية طاليس المتحركة',
        subtitle: 'مهما تحركت النقطة C على محيط الدائرة، تظل الزاوية المقابلة للقطر 90°.',
      },
      {
        startPct: 38,
        title: 'العلاقة بين المركزية والمحيطية',
        subtitle: 'الزاوية المركزية ∠AOB تساوي دائماً ضعف الزاوية المحيطية ∠ACB.',
      },
      {
        startPct: 70,
        title: 'طريقة الاستنفاد لأرخميدس',
        subtitle: 'زيادة أضلاع المضلع من 4 إلى 6 ثم 12 ثم 24 ضلعاً لحصر قيمة π ≈ 3.1416.',
      },
    ],
  },
  {
    id: 'egyptian-biruni',
    title: 'الهندسة في الميدان: حبل المسّاحين وقياس البيروني للأرض',
    durationSec: 18,
    eraTag: 'مصر القديمة والحضارة الإسلامية',
    summary:
      'من شدّ حبل العقد الـ 12 لتأسيس زاوية الأهرامات إلى تجربة البيروني المذهلة لقياس نصف قطر الكرة الأرضية.',
    chapters: [
      {
        startPct: 0,
        title: 'حبل المسّاحين ذو 12 عقدة',
        subtitle: 'توزيع العقد بنسب 3 : 4 : 5 يضمن زاوية قائمة دقيقة على ضفاف النيل.',
      },
      {
        startPct: 48,
        title: 'تجربة البيروني على قمة الجبل',
        subtitle: 'برصد زاوية انخفاض الأفق θ من ارتفاع h، يُحسب نصف قطر الأرض R بدقة.',
      },
    ],
  },
  {
    id: 'noneuclidean-story',
    title: 'من إقليدس إلى ريمان ولوباتشيفسكي: انحناء الفضاء',
    durationSec: 18,
    eraTag: 'العصر المعاصر',
    summary:
      'شاهد كيف يتغير مجموع زوايا المثلث وسلوك الخطوط المتوازية عند الانتقال من السطح المستوي إلى الكرة والسرج الزائدي.',
    chapters: [
      {
        startPct: 0,
        title: 'المستوي الإقليدي (K = 0)',
        subtitle: 'الخطوط المتوازية تحفظ المسافة ومجموع زوايا المثلث يساوي 180°.',
      },
      {
        startPct: 35,
        title: 'الهندسة الكروية لريمان (K > 0)',
        subtitle: 'الجيوديسيات تتقاطع ومجموع زوايا المثلث يتجاوز 180°.',
      },
      {
        startPct: 68,
        title: 'الهندسة الزائدية للوباتشيفسكي (K < 0)',
        subtitle: 'تتباعد الخطوط وتنكمش الزوايا ليصبح مجموع زوايا المثلث أقل من 180°.',
      },
    ],
  },
];

export const AnimatedGeometryTheater: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(LESSONS[0].id);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [speed, setSpeed] = useState<number>(1);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastChapterRef = useRef<string>('');

  const activeLesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedId) || LESSONS[0],
    [selectedId]
  );

  const currentChapter = useMemo(() => {
    const pct = progress * 100;
    let found = activeLesson.chapters[0];
    for (const ch of activeLesson.chapters) {
      if (pct >= ch.startPct) found = ch;
    }
    return found;
  }, [activeLesson, progress]);

  // Optional Arabic speech synthesis when voiceEnabled is toggled on
  useEffect(() => {
    if (!voiceEnabled) {
      window.speechSynthesis?.cancel();
      return;
    }
    if (lastChapterRef.current !== currentChapter.subtitle) {
      lastChapterRef.current = currentChapter.subtitle;
      try {
        window.speechSynthesis?.cancel();
        const utter = new SpeechSynthesisUtterance(
          `${currentChapter.title}. ${currentChapter.subtitle}`
        );
        utter.lang = 'ar-SA';
        utter.rate = 0.95;
        window.speechSynthesis?.speak(utter);
      } catch {
        // Ignore speech API unavailability
      }
    }
  }, [currentChapter, voiceEnabled]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setProgress((prev) => {
        const next = prev + (dt * speed) / activeLesson.durationSec;
        return next >= 1 ? 0 : next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed, activeLesson.durationSec]);

  // Draw the animated motion-graphic frame on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Architectural Navy Background
    ctx.fillStyle = '#0B172A';
    ctx.fillRect(0, 0, w, h);

    // Subtle Drafting Grid
    ctx.strokeStyle = 'rgba(200, 151, 44, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const p = progress;

    if (selectedId === 'pythagoras-proof') {
      // Visual Dissection Proof inside (a + b) square!
      const a = 78;
      const b = 122;
      const side = a + b; // 200
      const ox = w / 2 - side / 2;
      const oy = h / 2 - side / 2;

      // Outer box
      ctx.strokeStyle = '#EBD08A';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ox, oy, side, side);

      // Phase 1 (0..0.3): Draw the inner squares a^2 and b^2
      const slideT = p < 0.3 ? 0 : p < 0.7 ? (p - 0.3) / 0.4 : 1;
      const ease = slideT * slideT * (3 - 2 * slideT);

      // Square a^2 (top-left) and Square b^2 (bottom-right) fade out as c^2 appears
      ctx.save();
      ctx.globalAlpha = 1 - ease;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(ox, oy, a, a);
      ctx.strokeStyle = '#38BDF8';
      ctx.strokeRect(ox, oy, a, a);

      ctx.fillStyle = 'rgba(200, 151, 44, 0.28)';
      ctx.fillRect(ox + a, oy + a, b, b);
      ctx.strokeStyle = '#DDB14A';
      ctx.strokeRect(ox + a, oy + a, b, b);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('a²', ox + a / 2, oy + a / 2 + 6);
      ctx.fillText('b²', ox + a + b / 2, oy + a + b / 2 + 6);
      ctx.restore();

      // Central c^2 tilted square appears with ease
      if (ease > 0.05) {
        ctx.save();
        ctx.globalAlpha = ease;
        ctx.fillStyle = 'rgba(235, 208, 138, 0.26)';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ox + a, oy);
        ctx.lineTo(ox + side, oy + a);
        ctx.lineTo(ox + b, oy + side);
        ctx.lineTo(ox, oy + b);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#EBD08A';
        ctx.font = 'bold 20px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('c² = a² + b²', ox + side / 2, oy + side / 2 + 7);
        ctx.restore();
      }

      // 4 Congruent Right Triangles rearranging smoothly
      const drawTri = (pts: [number, number][]) => {
        ctx.fillStyle = 'rgba(29, 53, 93, 0.9)';
        ctx.strokeStyle = '#93C5FD';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      const lerp = (u: number, v: number, t: number) => u + (v - u) * t;
      // Tri 1
      drawTri([
        [lerp(ox + a, ox, ease), lerp(oy, oy, ease)],
        [lerp(ox + side, ox + a, ease), lerp(oy, oy, ease)],
        [lerp(ox + a, ox, ease), lerp(oy + b, oy + b, ease)],
      ]);
      // Tri 2
      drawTri([
        [lerp(ox + side, ox + side, ease), lerp(oy, oy, ease)],
        [lerp(ox + side, ox + side, ease), lerp(oy + b, oy + a, ease)],
        [lerp(ox + a, ox + a, ease), lerp(oy + b, oy, ease)],
      ]);
      // Tri 3
      drawTri([
        [lerp(ox, ox, ease), lerp(oy + a, oy + b, ease)],
        [lerp(ox + a, ox, ease), lerp(oy + side, oy + side, ease)],
        [lerp(ox, ox + b, ease), lerp(oy + side, oy + side, ease)],
      ]);
      // Tri 4
      drawTri([
        [lerp(ox, ox + side, ease), lerp(oy + a, oy + a, ease)],
        [lerp(ox + a, ox + side, ease), lerp(oy + a, oy + side, ease)],
        [lerp(ox + a, ox + b, ease), lerp(oy + side, oy + side, ease)],
      ]);
    } else if (selectedId === 'circle-secrets') {
      const cx = w / 2;
      const cy = h / 2 + 5;
      const r = 105;

      // Base Circle
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      if (p < 0.7) {
        // Thales & Inscribed Angle Animation
        const angle = -Math.PI * 0.85 + (p / 0.7) * Math.PI * 0.7;
        const Ax = cx - r;
        const Ay = cy;
        const Bx = cx + r;
        const By = cy;
        const Cx = cx + r * Math.cos(angle);
        const Cy = cy + r * Math.sin(angle);

        // Diameter
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(Bx, By);
        ctx.stroke();

        if (p < 0.38) {
          // Thales right triangle
          ctx.fillStyle = 'rgba(200, 151, 44, 0.22)';
          ctx.strokeStyle = '#EBD08A';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(Ax, Ay);
          ctx.lineTo(Cx, Cy);
          ctx.lineTo(Bx, By);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px "IBM Plex Mono", monospace';
          ctx.fillText('∠ACB = 90°', Cx - 25, Cy - 14);
        } else {
          // Central vs Inscribed Angle
          const Dangle = Math.PI * 0.25;
          const Dx = cx + r * Math.cos(Dangle);
          const Dy = cy + r * Math.sin(Dangle);
          const Ex = cx + r * Math.cos(Math.PI - Dangle);
          const Ey = cy + r * Math.sin(Math.PI - Dangle);

          ctx.strokeStyle = '#DDB14A';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(Dx, Dy);
          ctx.lineTo(Cx, Cy);
          ctx.lineTo(Ex, Ey);
          ctx.stroke();

          ctx.strokeStyle = '#60A5FA';
          ctx.beginPath();
          ctx.moveTo(Dx, Dy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(Ex, Ey);
          ctx.stroke();

          ctx.fillStyle = '#EBD08A';
          ctx.font = '13px "IBM Plex Mono", monospace';
          ctx.fillText('θ', Cx - 5, Cy + 20);
          ctx.fillStyle = '#60A5FA';
          ctx.fillText('2θ', cx - 8, cy + 24);
        }

        ctx.fillStyle = '#EBD08A';
        ctx.beginPath();
        ctx.arc(Cx, Cy, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Archimedes Exhaustion Polygons (4 -> 6 -> 12 -> 24)
        const stage = (p - 0.7) / 0.3;
        const sides = stage < 0.25 ? 4 : stage < 0.5 ? 6 : stage < 0.75 ? 12 : 24;

        ctx.strokeStyle = '#DDB14A';
        ctx.fillStyle = 'rgba(200, 151, 44, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * Math.PI * 2;
          const px = cx + r * Math.cos(a);
          const py = cy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.fill();
        ctx.stroke();

        const approxPi = (sides * Math.sin(Math.PI / sides)).toFixed(4);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`n = ${sides}   ⇒   π ≈ ${approxPi}`, cx, cy + r + 28);
      }
    } else if (selectedId === 'egyptian-biruni') {
      if (p < 0.48) {
        // Egyptian Rope stretching into 3-4-5
        const t = Math.min(1, p / 0.35);
        const x0 = w / 2 - 110;
        const y0 = h / 2 + 75;
        const xB = x0 + 200;
        const yB = y0;
        const xC = x0;
        const yC = y0 - 150 * t;

        ctx.strokeStyle = '#DDB14A';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(xB, yB);
        ctx.lineTo(xC, yC);
        ctx.closePath();
        ctx.stroke();

        // Knots
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i <= 4; i++) {
          ctx.beginPath();
          ctx.arc(x0 + i * 50, y0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.font = 'bold 14px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#EBD08A';
        ctx.fillText('3 : 4 : 5  (90°)', w / 2 - 45, y0 - 165 * t + 10);
      } else {
        // Biruni Earth radius animation
        const cx = w / 2 - 30;
        const cy = h + 40;
        const earthR = 190;
        ctx.fillStyle = 'rgba(29, 53, 93, 0.55)';
        ctx.strokeStyle = '#60A5FA';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, earthR, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.fill();

        // Mountain
        const peakY = cy - earthR - 42;
        ctx.fillStyle = '#C8972C';
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy - earthR + 2);
        ctx.lineTo(cx, peakY);
        ctx.lineTo(cx + 24, cy - earthR + 2);
        ctx.closePath();
        ctx.fill();

        // Horizon ray sweep
        const sweep = Math.min(1, (p - 0.48) / 0.35);
        const hx = cx + 132 * sweep;
        const hy = peakY + 95 * sweep;
        ctx.strokeStyle = '#EBD08A';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, peakY);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px "IBM Plex Mono", monospace';
        ctx.fillText('R = h·cos(θ) / (1 − cos(θ))', w / 2 - 105, 36);
      }
    } else {
      // Non-Euclidean Curvatures Morphing
      const cx = w / 2;
      const cy = h / 2 + 10;
      const k =
        p < 0.35
          ? 0
          : p < 0.68
          ? Math.sin(((p - 0.35) / 0.33) * Math.PI) * 1
          : -Math.sin(((p - 0.68) / 0.32) * Math.PI) * 1;

      // Grid lines bowing with curvature k
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
      ctx.lineWidth = 1.3;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        for (let s = -120; s <= 120; s += 10) {
          const x = cx + s;
          const y = cy + i * 28 + k * 0.002 * (s * s - i * i * 400) * 0.25;
          if (s === -120) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Morphing triangle edges (bulging outward for K>0, pinching inward for K<0)
      const pts: [number, number][] = [
        [cx, cy - 80],
        [cx - 88, cy + 68],
        [cx + 88, cy + 68],
      ];

      ctx.fillStyle = k > 0.1 ? 'rgba(56,189,248,0.22)' : k < -0.1 ? 'rgba(200,151,44,0.25)' : 'rgba(255,255,255,0.14)';
      ctx.strokeStyle = k > 0.1 ? '#38BDF8' : k < -0.1 ? '#DDB14A' : '#FFFFFF';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < 3; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % 3];
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        const vx = mx - cx;
        const vy = my - (cy + 15);
        const ctrlX = mx + vx * k * 0.45;
        const ctrlY = my + vy * k * 0.45;
        ctx.quadraticCurveTo(ctrlX, ctrlY, b[0], b[1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const angleSum = Math.round(180 + k * 42);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Σ∠ ≈ ${angleSum}°   (${k > 0.1 ? 'K > 0' : k < -0.1 ? 'K < 0' : 'K = 0'})`, cx, 40);
    }
  }, [progress, selectedId]);

  const currentSec = Math.round(progress * activeLesson.durationSec);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[#0B172A] text-white px-6 py-5 border-b border-[#C8972C]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#EBD08A] font-medium mb-1">
            <Film className="w-4 h-4" />
            <span>مقاطع الشرح المرئية والرسوم البيانية المتحركة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-editorial">
            مسرح البراهين المتحركة وتاريخ المفاهيم الهندسية
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              voiceEnabled
                ? 'bg-[#C8972C] text-[#0B172A] font-bold'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{voiceEnabled ? 'التعليق الصوتي مفعّل' : 'تعليق صوتي'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Video Stage + Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Video Player Stage */}
        <div className="lg:col-span-8 p-4 sm:p-6 bg-[#F8FAFC] border-b lg:border-b-0 lg:border-l border-slate-200">
          <div className="relative rounded-xl overflow-hidden bg-[#0B172A] border border-slate-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={320}
              className="w-full h-auto block"
            />
            {/* Synchronized Subtitle Overlay */}
            <div className="bg-[#07101F]/95 border-t border-white/10 px-4 py-3 text-white">
              <p className="text-xs font-semibold text-[#EBD08A]">
                {currentChapter.title}
              </p>
              <p className="text-sm text-slate-100 mt-0.5 leading-relaxed">
                {currentChapter.subtitle}
              </p>
            </div>
          </div>

          {/* Player Controls Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="min-h-[42px] px-4 py-2 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-[#EBD08A]" /> : <Play className="w-4 h-4 text-[#EBD08A]" />}
                <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</span>
              </button>

              <button
                type="button"
                aria-label="إعادة التشغيل"
                onClick={() => {
                  setProgress(0);
                  setIsPlaying(true);
                }}
                className="min-h-[42px] min-w-[42px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-[#0B172A] flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Scrubber */}
            <div className="flex-1 min-w-[160px] flex items-center gap-3">
              <input
                type="range"
                aria-label="شريط زمن المقطع"
                min="0"
                max="1"
                step="0.005"
                value={progress}
                onChange={(e) => setProgress(parseFloat(e.target.value))}
                className="w-full accent-[#C8972C]"
              />
              <span className="font-mono text-xs text-slate-600 tabular-nums shrink-0">
                0:{currentSec < 10 ? `0${currentSec}` : currentSec} / 0:{activeLesson.durationSec}
              </span>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-1">
              {[0.75, 1, 1.5].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpeed(sp)}
                  className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer ${
                    speed === sp
                      ? 'bg-[#C8972C] text-[#0B172A] font-bold'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Quick Jump Markers */}
          <div className="mt-4 flex flex-wrap gap-2">
            {activeLesson.chapters.map((ch, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setProgress(ch.startPct / 100);
                  setIsPlaying(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  currentChapter.title === ch.title
                    ? 'bg-[#0B172A] border-[#0B172A] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#C8972C]'
                }`}
              >
                {idx + 1}. {ch.title}
              </button>
            ))}
          </div>
        </div>

        {/* Playlist Column */}
        <div className="lg:col-span-4 p-4 sm:p-6 bg-white flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B172A] mb-3">
              قائمة المقاطع التعليمية ({LESSONS.length})
            </h3>
            <div className="space-y-2.5">
              {LESSONS.map((lesson, idx) => {
                const isSelected = lesson.id === selectedId;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(lesson.id);
                      setProgress(0);
                      setIsPlaying(true);
                    }}
                    className={`w-full text-right p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FBF9F4] border-[#C8972C] shadow-sm'
                        : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1 tabular-nums">
                      <span className="font-semibold text-[#C8972C]">
                        مقطع 0{idx + 1} · {lesson.eraTag}
                      </span>
                      <span className="font-mono">0:{lesson.durationSec}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#0B172A] leading-snug">
                      {lesson.title}
                    </h4>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong className="text-[#0B172A] block mb-1">نبذة عن المقطع المختار:</strong>
            {activeLesson.summary}
          </div>
        </div>
      </div>
    </section>
  );
};
