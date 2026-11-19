import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle as CircleIcon,
  Compass,
  Film,
  FlaskConical,
  Grid,
  History,
  Hexagon,
  Move,
  PenTool,
  Shapes,
  Square,
  Target,
  Trash2,
  Triangle,
  XCircle,
} from 'lucide-react';
import { ThreeDLabCanvas } from './ThreeDLabCanvas';
import { AnimatedGeometryTheater } from './AnimatedGeometryTheater';
import { UserProgress } from '../types/geometry';

type LabTab =
  | 'builder'
  | 'experiments'
  | 'historical'
  | '3d-volumes'
  | 'animated-videos'
  | 'challenges';

type ExperimentId =
  | 'pythagoras'
  | 'angle-sum'
  | 'thales'
  | 'circle'
  | 'symmetry'
  | 'transforms'
  | 'areas';

interface Point2D {
  x: number;
  y: number;
}

interface CanvasShape {
  id: string;
  kind: 'triangle' | 'rectangle' | 'circle' | 'polygon' | 'composite';
  label: string;
  points: Point2D[]; // For triangle/rect/composite vertices
  center?: Point2D; // For circle/polygon
  radius?: number; // For circle/polygon
  sides?: number; // For regular polygon
  rotationDeg?: number;
  color: string;
}

interface GeometryLabProps {
  progress: UserProgress;
  onRecordExperiment: (expId: string) => void;
  onRecordChallenge: (challengeId: string, points: number) => void;
}

const dist = (a: Point2D, b: Point2D) => Math.hypot(b.x - a.x, b.y - a.y);

const polygonArea = (pts: Point2D[]) => {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    sum += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(sum) / 2;
};

const polygonPerimeter = (pts: Point2D[]) => {
  if (pts.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    p += dist(pts[i], pts[(i + 1) % pts.length]);
  }
  return p;
};

const angleAtVertex = (prev: Point2D, curr: Point2D, next: Point2D) => {
  const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
  const v2 = { x: next.x - curr.x, y: next.y - curr.y };
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
};

const getRegularPolygonVertices = (
  center: Point2D,
  radius: number,
  sides: number,
  rotationDeg = 0
): Point2D[] => {
  const pts: Point2D[] = [];
  const baseRad = (rotationDeg * Math.PI) / 180 - Math.PI / 2;
  for (let i = 0; i < sides; i++) {
    const a = baseRad + (i * 2 * Math.PI) / sides;
    pts.push({
      x: center.x + radius * Math.cos(a),
      y: center.y + radius * Math.sin(a),
    });
  }
  return pts;
};

export const GeometryLab: React.FC<GeometryLabProps> = ({
  progress,
  onRecordExperiment,
  onRecordChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<LabTab>('builder');

  // ---------- 1. INTERACTIVE 2D SHAPE BUILDER STATE ----------
  const [shapes, setShapes] = useState<CanvasShape[]>([
    {
      id: 'init-tri',
      kind: 'triangle',
      label: 'مثلث حر',
      points: [
        { x: 260, y: 80 },
        { x: 160, y: 270 },
        { x: 370, y: 270 },
      ],
      color: '#C8972C',
    },
  ]);
  const [selectedShapeId, setSelectedShapeId] = useState<string>('init-tri');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [newPolySides, setNewPolySides] = useState<number>(6);
  const svgBuilderRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef<{
    shapeId: string;
    pointIdx: number | 'center';
  } | null>(null);

  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === selectedShapeId) || shapes[0] || null,
    [shapes, selectedShapeId]
  );

  const addShape = (kind: CanvasShape['kind']) => {
    const id = `${kind}-${Date.now()}`;
    let newShape: CanvasShape;
    if (kind === 'triangle') {
      newShape = {
        id,
        kind: 'triangle',
        label: 'مثلث',
        points: [
          { x: 280, y: 70 },
          { x: 180, y: 250 },
          { x: 380, y: 250 },
        ],
        color: '#38BDF8',
      };
    } else if (kind === 'rectangle') {
      newShape = {
        id,
        kind: 'rectangle',
        label: 'مربع / مستطيل',
        points: [
          { x: 180, y: 100 },
          { x: 360, y: 100 },
          { x: 360, y: 240 },
          { x: 180, y: 240 },
        ],
        color: '#C8972C',
      };
    } else if (kind === 'circle') {
      newShape = {
        id,
        kind: 'circle',
        label: 'دائرة',
        points: [],
        center: { x: 280, y: 180 },
        radius: 80,
        color: '#60A5FA',
      };
    } else if (kind === 'polygon') {
      newShape = {
        id,
        kind: 'polygon',
        label: `مضلع (${newPolySides} أضلاع)`,
        points: [],
        center: { x: 280, y: 180 },
        radius: 85,
        sides: newPolySides,
        rotationDeg: 0,
        color: '#DDB14A',
      };
    } else {
      // Composite architectural house / arch shape
      newShape = {
        id,
        kind: 'composite',
        label: 'شكل مركب (بيت هندسي)',
        points: [
          { x: 280, y: 60 },
          { x: 380, y: 140 },
          { x: 380, y: 280 },
          { x: 180, y: 280 },
          { x: 180, y: 140 },
        ],
        color: '#34D399',
      };
    }
    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(id);
  };

  const getSvgCoords = (
    e: React.PointerEvent<SVGSVGElement>,
    svgEl: SVGSVGElement | null
  ): Point2D => {
    if (!svgEl) return { x: 280, y: 180 };
    const rect = svgEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 560;
    const y = ((e.clientY - rect.top) / rect.height) * 360;
    const clampedX = Math.max(20, Math.min(540, x));
    const clampedY = Math.max(20, Math.min(340, y));
    if (snapToGrid) {
      return {
        x: Math.round(clampedX / 10) * 10,
        y: Math.round(clampedY / 10) * 10,
      };
    }
    return { x: Math.round(clampedX), y: Math.round(clampedY) };
  };

  const handleBuilderPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = draggingRef.current;
    if (!drag) return;
    const pt = getSvgCoords(e, svgBuilderRef.current);
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== drag.shapeId) return s;
        if (drag.pointIdx === 'center' && s.center) {
          return { ...s, center: pt };
        }
        if (typeof drag.pointIdx === 'number') {
          const nextPts = [...s.points];
          nextPts[drag.pointIdx] = pt;
          return { ...s, points: nextPts };
        }
        return s;
      })
    );
  };

  // Computed metrics for selected shape (1 grid unit = 20px)
  const PX_PER_UNIT = 20;
  const selectedMetrics = useMemo(() => {
    if (!selectedShape) return null;
    if (selectedShape.kind === 'circle' && selectedShape.radius) {
      const r = selectedShape.radius / PX_PER_UNIT;
      return {
        area: (Math.PI * r * r).toFixed(2),
        perimeter: (2 * Math.PI * r).toFixed(2),
        details: `نصف القطر r = ${r.toFixed(2)} وحدة · القطر = ${(r * 2).toFixed(2)}`,
      };
    }
    const pts =
      selectedShape.kind === 'polygon' && selectedShape.center && selectedShape.radius
        ? getRegularPolygonVertices(
            selectedShape.center,
            selectedShape.radius,
            selectedShape.sides || 6,
            selectedShape.rotationDeg || 0
          )
        : selectedShape.points;

    const areaUnits = polygonArea(pts) / (PX_PER_UNIT * PX_PER_UNIT);
    const perimUnits = polygonPerimeter(pts) / PX_PER_UNIT;
    const angles = pts.map((_, idx) =>
      angleAtVertex(
        pts[(idx - 1 + pts.length) % pts.length],
        pts[idx],
        pts[(idx + 1) % pts.length]
      )
    );
    const angleSum = angles.reduce((acc, a) => acc + a, 0);
    return {
      area: areaUnits.toFixed(2),
      perimeter: perimUnits.toFixed(2),
      details: `مجموع الزوايا = ${Math.round(angleSum)}° · عدد الرؤوس = ${pts.length}`,
      angles,
      pts,
    };
  }, [selectedShape]);

  // ---------- 2. INTERACTIVE EXPERIMENTS STATE ----------
  const [activeExp, setActiveExp] = useState<ExperimentId>('pythagoras');
  const [pythA, setPythA] = useState(3);
  const [pythB, setPythB] = useState(4);
  const [triPts, setTriPts] = useState<Point2D[]>([
    { x: 260, y: 70 },
    { x: 130, y: 270 },
    { x: 400, y: 270 },
  ]);
  const triDragIdx = useRef<number | null>(null);
  const expSvgRef = useRef<SVGSVGElement | null>(null);

  const [thalesRatio, setThalesRatio] = useState(0.55); // AD / AB
  const [circleCentralDeg, setCircleCentralDeg] = useState(110);
  const [symMode, setSymMode] = useState<'axial' | 'central'>('axial');
  const [symPts, setSymPts] = useState<Point2D[]>([
    { x: 130, y: 90 },
    { x: 210, y: 120 },
    { x: 190, y: 220 },
    { x: 110, y: 190 },
  ]);
  const [tx, setTx] = useState(60);
  const [ty, setTy] = useState(-20);
  const [rotDeg, setRotDeg] = useState(25);
  const [scaleK, setScaleK] = useState(1.1);
  const [areaBase, setAreaBase] = useState(8);
  const [areaHeight, setAreaHeight] = useState(5);
  const [areaTop, setAreaTop] = useState(4);
  const [areaShapeKind, setAreaShapeKind] = useState<'triangle' | 'parallelogram' | 'trapezoid'>('trapezoid');

  // ---------- 3. HISTORICAL EXPERIMENTS STATE ----------
  const [histExp, setHistExp] = useState<'rope' | 'thales-pyramid' | 'biruni' | 'archimedes'>('rope');
  const [ropeSideA, setRopeSideA] = useState(3);
  const [ropeSideB, setRopeSideB] = useState(4);
  const [ropeSideC, setRopeSideC] = useState(5);
  const [stickShadow, setStickShadow] = useState(2.0);
  const [pyramidShadow, setPyramidShadow] = useState(196);
  const [mountainH, setMountainH] = useState(652); // meters
  const [dipAngleDeg, setDipAngleDeg] = useState(0.57); // degrees
  const [archSides, setArchSides] = useState(12);

  // ---------- 4. CHALLENGES STATE ----------
  const [challengeStatus, setChallengeStatus] = useState<
    Record<string, { passed: boolean; message: string }>
  >({});

  // Challenge 1: Build a right triangle or adjust legs so area = 24
  const [ch1A, setCh1A] = useState(5);
  const [ch1B, setCh1B] = useState(5);
  // Challenge 2: Adjust central angle so inscribed angle = 45 deg
  const [ch2Central, setCh2Central] = useState(60);
  // Challenge 3: Choose polygon sides so interior angle sum = 720 deg
  const [ch3Sides, setCh3Sides] = useState(5);
  // Challenge 4: Archimedes sides so upper/lower pi gap < 0.01
  const [ch4Sides, setCh4Sides] = useState(6);

  const checkChallenge1 = () => {
    const area = 0.5 * ch1A * ch1B;
    const passed = Math.abs(area - 24) < 0.01;
    setChallengeStatus((p) => ({
      ...p,
      ch1: {
        passed,
        message: passed
          ? `رائع! مساحة المثلث القائم = (1/2) × ${ch1A} × ${ch1B} = 24 وحدة² والوتر = ${Math.hypot(ch1A, ch1B).toFixed(2)}.`
          : `المساحة الحالية = ${area.toFixed(1)} وحدة². اضبط الضلعين بحيث يكون (a × b) = 48 (مثلاً 6 و 8).`,
      },
    }));
    if (passed) onRecordChallenge('ch1', 25);
  };

  const checkChallenge2 = () => {
    const inscribed = ch2Central / 2;
    const passed = Math.abs(inscribed - 45) < 0.01;
    setChallengeStatus((p) => ({
      ...p,
      ch2: {
        passed,
        message: passed
          ? 'صحيح! الزاوية المحيطية = 45° عندما تكون الزاوية المركزية المشتركة في القوس = 90°.'
          : `الزاوية المحيطية الحالية = ${inscribed.toFixed(1)}°. غيّر الزاوية المركزية لتحقيق نصفها 45°.`,
      },
    }));
    if (passed) onRecordChallenge('ch2', 25);
  };

  const checkChallenge3 = () => {
    const sum = (ch3Sides - 2) * 180;
    const passed = sum === 720;
    setChallengeStatus((p) => ({
      ...p,
      ch3: {
        passed,
        message: passed
          ? 'أحسنت! مجموع الزوايا الداخلية للمضلع السداسي = (6 − 2) × 180° = 720°.'
          : `مجموع الزوايا الحالية لـ ${ch3Sides} أضلاع هو ${sum}°. استخدم القانون (n − 2) × 180°.`,
      },
    }));
    if (passed) onRecordChallenge('ch3', 25);
  };

  const checkChallenge4 = () => {
    const lowerPi = ch4Sides * Math.sin(Math.PI / ch4Sides);
    const upperPi = ch4Sides * Math.tan(Math.PI / ch4Sides);
    const gap = upperPi - lowerPi;
    const passed = gap < 0.01;
    setChallengeStatus((p) => ({
      ...p,
      ch4: {
        passed,
        message: passed
          ? `مذهل! عند n = ${ch4Sides} ضلعاً، ينحصر π بين ${lowerPi.toFixed(5)} و ${upperPi.toFixed(5)} بفارق ${gap.toFixed(5)} < 0.01!`
          : `الفارق الحالي = ${gap.toFixed(4)} عند n = ${ch4Sides}. ارفع عدد الأضلاع (مثل طريقة أرخميدس n ≥ 48).`,
      },
    }));
    if (passed) onRecordChallenge('ch4', 30);
  };

  // Calculations for experiments
  const pythC = Math.hypot(pythA, pythB);
  const triAngles = useMemo(() => {
    const a0 = angleAtVertex(triPts[2], triPts[0], triPts[1]);
    const a1 = angleAtVertex(triPts[0], triPts[1], triPts[2]);
    const a2 = angleAtVertex(triPts[1], triPts[2], triPts[0]);
    return [a0, a1, a2];
  }, [triPts]);

  // Biruni Earth radius formula in km: R = h * cos(theta) / (1 - cos(theta))
  const biruniRad = (dipAngleDeg * Math.PI) / 180;
  const biruniRkm =
    (mountainH / 1000) * (Math.cos(biruniRad) / (1 - Math.cos(biruniRad)));

  // Archimedes bounds
  const archLower = archSides * Math.sin(Math.PI / archSides);
  const archUpper = archSides * Math.tan(Math.PI / archSides);

  // Rope check
  const ropeSidesSorted = [ropeSideA, ropeSideB, ropeSideC].sort((x, y) => x - y);
  const ropeIsRight =
    ropeSidesSorted[0] * ropeSidesSorted[0] +
      ropeSidesSorted[1] * ropeSidesSorted[1] ===
    ropeSidesSorted[2] * ropeSidesSorted[2];

  const handleSelectTab = (tab: LabTab) => {
    setActiveTab(tab);
    onRecordExperiment(`tab-${tab}`);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Lab Top Sub-Navigation */}
      <div className="bg-[#0B172A] text-white border-b border-[#C8972C]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#EBD08A] font-medium mb-1">
                <FlaskConical className="w-4 h-4" />
                <span>المختبر العلمي التفاعلي</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-editorial">
                مخبر الهندسة الافتراضي (2D و 3D)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 tabular-nums">
              اسحب النقاط وحرّك الأشكال وشاهد التغيرات الرياضية مباشرة
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                { id: 'builder', label: 'الرسم والتحريك', Icon: PenTool },
                { id: 'experiments', label: 'التجارب الهندسية', Icon: Compass },
                { id: '3d-volumes', label: 'المجسمات والحجوم 3D', Icon: Hexagon },
                { id: 'historical', label: 'التجارب التاريخية', Icon: History },
                { id: 'animated-videos', label: 'فيديوهات وبراهين متحركة', Icon: Film },
                { id: 'challenges', label: 'تحديات المختبر', Icon: Target },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectTab(id)}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer ${
                  activeTab === id
                    ? 'bg-[#C8972C] text-[#0B172A] font-bold'
                    : 'bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ================= TAB 1: SHAPE BUILDER & VERTEX DRAGGER ================= */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Interactive SVG Canvas (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              {/* Creation Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addShape('triangle')}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Triangle className="w-3.5 h-3.5 text-[#EBD08A]" />
                    <span>+ مثلث</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addShape('rectangle')}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-[#EBD08A]" />
                    <span>+ مربع/مستطيل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addShape('circle')}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CircleIcon className="w-3.5 h-3.5 text-[#EBD08A]" />
                    <span>+ دائرة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addShape('polygon')}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Hexagon className="w-3.5 h-3.5 text-[#EBD08A]" />
                    <span>+ مضلع ({newPolySides})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addShape('composite')}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shapes className="w-3.5 h-3.5 text-[#EBD08A]" />
                    <span>+ شكل مركب</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSnapToGrid((s) => !s)}
                    className={`min-h-[38px] px-3 py-1 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                      snapToGrid
                        ? 'bg-[#FBF9F4] border-[#C8972C] text-[#0B172A]'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>تثبيت بالشبكة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShapes([])}
                    className="min-h-[38px] px-3 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح الكل</span>
                  </button>
                </div>
              </div>

              {/* Interactive Touch & Mouse SVG Stage */}
              <div className="rounded-xl overflow-hidden border border-slate-300 bg-[#0B172A] touch-none select-none">
                <svg
                  ref={svgBuilderRef}
                  viewBox="0 0 560 360"
                  className="w-full h-auto block"
                  onPointerMove={handleBuilderPointerMove}
                  onPointerUp={() => {
                    draggingRef.current = null;
                  }}
                  onPointerLeave={() => {
                    draggingRef.current = null;
                  }}
                >
                  {/* Grid lines (every 20px = 1 unit) */}
                  <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <line key={`gx-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="360" />
                    ))}
                    {Array.from({ length: 18 }).map((_, i) => (
                      <line key={`gy-${i}`} x1="0" y1={i * 20} x2="560" y2={i * 20} />
                    ))}
                  </g>

                  {shapes.map((shape) => {
                    const isSelected = shape.id === selectedShape?.id;
                    if (shape.kind === 'circle' && shape.center && shape.radius) {
                      return (
                        <g key={shape.id}>
                          <circle
                            cx={shape.center.x}
                            cy={shape.center.y}
                            r={shape.radius}
                            fill={`${shape.color}33`}
                            stroke={isSelected ? '#FFFFFF' : shape.color}
                            strokeWidth={isSelected ? 2.5 : 1.8}
                            onClick={() => setSelectedShapeId(shape.id)}
                          />
                          {showMeasurements && (
                            <>
                              <line
                                x1={shape.center.x}
                                y1={shape.center.y}
                                x2={shape.center.x + shape.radius}
                                y2={shape.center.y}
                                stroke="#EBD08A"
                                strokeDasharray="4 3"
                                strokeWidth="1.5"
                              />
                              <text
                                x={shape.center.x + shape.radius / 2}
                                y={shape.center.y - 6}
                                fill="#EBD08A"
                                fontSize="11"
                                fontFamily="IBM Plex Mono"
                                textAnchor="middle"
                              >
                                r={(shape.radius / PX_PER_UNIT).toFixed(1)}
                              </text>
                            </>
                          )}
                          <circle
                            cx={shape.center.x}
                            cy={shape.center.y}
                            r={10}
                            fill="#C8972C"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="cursor-move"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setSelectedShapeId(shape.id);
                              draggingRef.current = {
                                shapeId: shape.id,
                                pointIdx: 'center',
                              };
                            }}
                          />
                        </g>
                      );
                    }

                    const pts =
                      shape.kind === 'polygon' && shape.center && shape.radius
                        ? getRegularPolygonVertices(
                            shape.center,
                            shape.radius,
                            shape.sides || 6,
                            shape.rotationDeg || 0
                          )
                        : shape.points;

                    const polyStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

                    return (
                      <g key={shape.id}>
                        <polygon
                          points={polyStr}
                          fill={`${shape.color}33`}
                          stroke={isSelected ? '#FFFFFF' : shape.color}
                          strokeWidth={isSelected ? 2.6 : 1.8}
                          strokeLinejoin="round"
                          onClick={() => setSelectedShapeId(shape.id)}
                        />
                        {showMeasurements &&
                          pts.map((p, idx) => {
                            const next = pts[(idx + 1) % pts.length];
                            const mx = (p.x + next.x) / 2;
                            const my = (p.y + next.y) / 2;
                            const len = (dist(p, next) / PX_PER_UNIT).toFixed(1);
                            return (
                              <text
                                key={`len-${idx}`}
                                x={mx}
                                y={my - 5}
                                fill="#EBD08A"
                                fontSize="10"
                                fontFamily="IBM Plex Mono"
                                textAnchor="middle"
                              >
                                {len}
                              </text>
                            );
                          })}

                        {/* Draggable handles */}
                        {shape.kind === 'polygon' && shape.center ? (
                          <circle
                            cx={shape.center.x}
                            cy={shape.center.y}
                            r={10}
                            fill="#C8972C"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="cursor-move"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setSelectedShapeId(shape.id);
                              draggingRef.current = {
                                shapeId: shape.id,
                                pointIdx: 'center',
                              };
                            }}
                          />
                        ) : (
                          pts.map((p, idx) => (
                            <g key={`pt-${idx}`}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={9}
                                fill={isSelected ? '#C8972C' : '#334155'}
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                className="cursor-grab active:cursor-grabbing"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  setSelectedShapeId(shape.id);
                                  draggingRef.current = {
                                    shapeId: shape.id,
                                    pointIdx: idx,
                                  };
                                }}
                              />
                              {showMeasurements && isSelected && (
                                <text
                                  x={p.x + 12}
                                  y={p.y - 8}
                                  fill="#FFFFFF"
                                  fontSize="10"
                                  fontFamily="IBM Plex Mono"
                                >
                                  {Math.round(
                                    angleAtVertex(
                                      pts[(idx - 1 + pts.length) % pts.length],
                                      p,
                                      pts[(idx + 1) % pts.length]
                                    )
                                  )}
                                  °
                                </text>
                              )}
                            </g>
                          ))
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              <p className="text-xs text-slate-500 mt-2.5 flex items-center gap-2">
                <Move className="w-3.5 h-3.5 text-[#C8972C]" />
                <span>
                  اسحب النقاط الذهبية مباشرة بالإصبع أو الفأرة لتعديل الأطوال والزوايا والأبعاد لحظياً.
                </span>
              </p>
            </div>

            {/* Right Control & Live Telemetry Deck (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Polygon side preset before adding */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-[#0B172A] mb-3">
                  إعدادات الإنشاء والقياس
                </h2>
                <label className="block text-xs text-slate-600 mb-3">
                  عدد أضلاع المضلع الجديد: <strong className="font-mono">{newPolySides}</strong>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    value={newPolySides}
                    onChange={(e) => setNewPolySides(parseInt(e.target.value, 10))}
                    className="w-full mt-1.5 accent-[#C8972C]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer pt-2 border-t border-slate-100">
                  <span>إظهار الأطوال والزوايا على الرسم</span>
                  <input
                    type="checkbox"
                    checked={showMeasurements}
                    onChange={(e) => setShowMeasurements(e.target.checked)}
                    className="accent-[#0B172A] w-4 h-4"
                  />
                </label>
              </div>

              {/* Selected Shape Controls & Live Measurements */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#0B172A]">
                    خصائص الشكل المحدد
                  </h2>
                  {selectedShape && (
                    <button
                      type="button"
                      onClick={() =>
                        setShapes((prev) =>
                          prev.filter((s) => s.id !== selectedShape.id)
                        )
                      }
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      حذف الشكل
                    </button>
                  )}
                </div>

                {!selectedShape || !selectedMetrics ? (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    أضف شكلاً هندسياً من الأزرار أعلى لوحة الرسم للبدء.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-[#1D355D]">
                      {selectedShape.label}
                    </p>

                    {/* Sliders for Circle or Regular Polygon */}
                    {(selectedShape.kind === 'circle' ||
                      selectedShape.kind === 'polygon') && (
                      <div className="space-y-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                        <label className="block text-xs text-slate-700">
                          نصف القطر:{' '}
                          <span className="font-mono font-bold">
                            {((selectedShape.radius || 80) / PX_PER_UNIT).toFixed(1)}
                          </span>{' '}
                          وحدة
                          <input
                            type="range"
                            min="25"
                            max="145"
                            value={selectedShape.radius || 80}
                            onChange={(e) => {
                              const r = parseInt(e.target.value, 10);
                              setShapes((prev) =>
                                prev.map((s) =>
                                  s.id === selectedShape.id ? { ...s, radius: r } : s
                                )
                              );
                            }}
                            className="w-full mt-1 accent-[#C8972C]"
                          />
                        </label>

                        {selectedShape.kind === 'polygon' && (
                          <>
                            <label className="block text-xs text-slate-700">
                              عدد الأضلاع:{' '}
                              <span className="font-mono font-bold">
                                {selectedShape.sides || 6}
                              </span>
                              <input
                                type="range"
                                min="3"
                                max="12"
                                value={selectedShape.sides || 6}
                                onChange={(e) => {
                                  const sides = parseInt(e.target.value, 10);
                                  setShapes((prev) =>
                                    prev.map((s) =>
                                      s.id === selectedShape.id
                                        ? {
                                            ...s,
                                            sides,
                                            label: `مضلع (${sides} أضلاع)`,
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className="w-full mt-1 accent-[#C8972C]"
                              />
                            </label>
                            <label className="block text-xs text-slate-700">
                              زاوية الدوران:{' '}
                              <span className="font-mono font-bold">
                                {selectedShape.rotationDeg || 0}°
                              </span>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={selectedShape.rotationDeg || 0}
                                onChange={(e) => {
                                  const rotationDeg = parseInt(e.target.value, 10);
                                  setShapes((prev) =>
                                    prev.map((s) =>
                                      s.id === selectedShape.id
                                        ? { ...s, rotationDeg }
                                        : s
                                    )
                                  );
                                }}
                                className="w-full mt-1 accent-[#C8972C]"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    {/* Live Measurements Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#0B172A] text-white">
                        <span className="text-[11px] text-slate-300 block">
                          المساحة
                        </span>
                        <span className="font-mono text-lg font-bold text-[#EBD08A] tabular-nums">
                          {selectedMetrics.area}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0B172A] text-white">
                        <span className="text-[11px] text-slate-300 block">
                          المحيط
                        </span>
                        <span className="font-mono text-lg font-bold text-white tabular-nums">
                          {selectedMetrics.perimeter}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-mono bg-[#F8FAFC] p-3 rounded-lg border border-slate-200 tabular-nums">
                      {selectedMetrics.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: 7 INTERACTIVE EXPERIMENTS ================= */}
        {activeTab === 'experiments' && (
          <div className="space-y-6">
            {/* Experiment Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'pythagoras', label: 'نظرية فيثاغورس' },
                  { id: 'angle-sum', label: 'مجموع زوايا المثلث' },
                  { id: 'thales', label: 'نظرية طاليس للتناسب' },
                  { id: 'circle', label: 'خصائص الدائرة والزوايا' },
                  { id: 'symmetry', label: 'التناظر الهندسي' },
                  { id: 'transforms', label: 'التحويلات الهندسية' },
                  { id: 'areas', label: 'المساحات والمحيطات' },
                ] as const
              ).map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => {
                    setActiveExp(exp.id);
                    onRecordExperiment(exp.id);
                  }}
                  className={`min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
                    activeExp === exp.id
                      ? 'bg-[#0B172A] border-[#0B172A] text-[#EBD08A] font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#C8972C]'
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
              {/* EXP 1: PYTHAGORAS */}
              {activeExp === 'pythagoras' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 bg-[#0B172A] rounded-xl p-4">
                    <svg viewBox="0 0 420 300" className="w-full h-auto">
                      {(() => {
                        const scale = 22;
                        const ox = 155;
                        const oy = 210;
                        const wA = pythA * scale;
                        const wB = pythB * scale;
                        const Ax = ox;
                        const Ay = oy - wA;
                        const Bx = ox + wB;
                        const By = oy;
                        // Square on hypotenuse outwards
                        const dx = Bx - Ax;
                        const dy = By - Ay;
                        const C1x = Bx + dy;
                        const C1y = By - dx;
                        const C2x = Ax + dy;
                        const C2y = Ay - dx;

                        return (
                          <>
                            <rect
                              x={ox - wA}
                              y={oy - wA}
                              width={wA}
                              height={wA}
                              fill="rgba(56,189,248,0.22)"
                              stroke="#38BDF8"
                              strokeWidth="2"
                            />
                            <rect
                              x={ox}
                              y={oy}
                              width={wB}
                              height={wB}
                              fill="rgba(200,151,44,0.25)"
                              stroke="#DDB14A"
                              strokeWidth="2"
                            />
                            <polygon
                              points={`${Ax},${Ay} ${Bx},${By} ${C1x},${C1y} ${C2x},${C2y}`}
                              fill="rgba(255,255,255,0.12)"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            <polygon
                              points={`${ox},${oy} ${Bx},${By} ${Ax},${Ay}`}
                              fill="rgba(200,151,44,0.4)"
                              stroke="#EBD08A"
                              strokeWidth="2.5"
                            />
                            <text x={ox - wA / 2} y={oy - wA / 2} fill="#38BDF8" fontSize="13" fontFamily="IBM Plex Mono" textAnchor="middle">
                              a²={(pythA * pythA).toFixed(1)}
                            </text>
                            <text x={ox + wB / 2} y={oy + wB / 2} fill="#DDB14A" fontSize="13" fontFamily="IBM Plex Mono" textAnchor="middle">
                              b²={(pythB * pythB).toFixed(1)}
                            </text>
                            <text x={(Ax + C1x) / 2} y={(Ay + C1y) / 2} fill="#FFFFFF" fontSize="14" fontFamily="IBM Plex Mono" textAnchor="middle">
                              c²={(pythC * pythC).toFixed(1)}
                            </text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="lg:col-span-5 space-y-5">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      تجربة مبرهنة فيثاغورس التفاعلية
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      غيّر طول ضلعي القائمة (a و b) وراقب كيف تتطابق مساحة المربع
                      المنشأ على الوتر c² مع مجموع مساحتي المربعين a² + b².
                    </p>
                    <label className="block text-sm font-medium text-slate-800">
                      الضلع a = <span className="font-mono font-bold">{pythA}</span>
                      <input
                        type="range"
                        min="1.5"
                        max="5"
                        step="0.5"
                        value={pythA}
                        onChange={(e) => setPythA(parseFloat(e.target.value))}
                        className="w-full mt-1.5 accent-[#38BDF8]"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-800">
                      الضلع b = <span className="font-mono font-bold">{pythB}</span>
                      <input
                        type="range"
                        min="1.5"
                        max="5"
                        step="0.5"
                        value={pythB}
                        onChange={(e) => setPythB(parseFloat(e.target.value))}
                        className="w-full mt-1.5 accent-[#C8972C]"
                      />
                    </label>
                    <div
                      dir="ltr"
                      className="p-4 rounded-xl bg-[#0B172A] text-white font-mono text-sm space-y-1 tabular-nums"
                    >
                      <div className="text-[#38BDF8]">a² = {(pythA * pythA).toFixed(2)}</div>
                      <div className="text-[#DDB14A]">b² = {(pythB * pythB).toFixed(2)}</div>
                      <div className="pt-2 border-t border-white/15 text-base font-bold text-white">
                        a² + b² = {(pythA * pythA + pythB * pythB).toFixed(2)} = c² ⇒ c = {pythC.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EXP 2: TRIANGLE ANGLE SUM */}
              {activeExp === 'angle-sum' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 bg-[#0B172A] rounded-xl overflow-hidden touch-none">
                    <svg
                      ref={expSvgRef}
                      viewBox="0 0 520 320"
                      className="w-full h-auto block"
                      onPointerMove={(e) => {
                        if (triDragIdx.current === null || !expSvgRef.current) return;
                        const rect = expSvgRef.current.getBoundingClientRect();
                        const x = Math.max(30, Math.min(490, ((e.clientX - rect.left) / rect.width) * 520));
                        const y = Math.max(30, Math.min(290, ((e.clientY - rect.top) / rect.height) * 320));
                        setTriPts((prev) =>
                          prev.map((pt, i) =>
                            i === triDragIdx.current ? { x, y } : pt
                          )
                        );
                      }}
                      onPointerUp={() => {
                        triDragIdx.current = null;
                      }}
                    >
                      <polygon
                        points={triPts.map((p) => `${p.x},${p.y}`).join(' ')}
                        fill="rgba(200,151,44,0.22)"
                        stroke="#EBD08A"
                        strokeWidth="2.5"
                      />
                      {triPts.map((p, i) => (
                        <g key={i}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="11"
                            fill="#C8972C"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="cursor-grab"
                            onPointerDown={() => {
                              triDragIdx.current = i;
                            }}
                          />
                          <text
                            x={p.x}
                            y={p.y - 16}
                            fill="#FFFFFF"
                            fontSize="13"
                            fontFamily="IBM Plex Mono"
                            textAnchor="middle"
                          >
                            {['A', 'B', 'C'][i]} = {triAngles[i].toFixed(1)}°
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      تجربة مجموع زوايا المثلث (180°)
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      اسحب أي رأس من رؤوس المثلث (A أو B أو C) في المستوي الإقليدي،
                      ولاحظ تغير كل زاوية مع ثبات مجموعها الكلي عند 180.0°.
                    </p>
                    <div className="p-4 rounded-xl bg-[#0B172A] text-white font-mono text-sm space-y-2 tabular-nums">
                      <div>∠A = {triAngles[0].toFixed(1)}°</div>
                      <div>∠B = {triAngles[1].toFixed(1)}°</div>
                      <div>∠C = {triAngles[2].toFixed(1)}°</div>
                      <div className="pt-2 border-t border-white/15 text-[#EBD08A] font-bold text-base">
                        ∠A + ∠B + ∠C = {(triAngles[0] + triAngles[1] + triAngles[2]).toFixed(1)}°
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EXP 3: THALES PROPORTIONALITY */}
              {activeExp === 'thales' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 bg-[#0B172A] rounded-xl p-4">
                    <svg viewBox="0 0 420 280" className="w-full h-auto">
                      {(() => {
                        const A = { x: 210, y: 35 };
                        const B = { x: 70, y: 245 };
                        const C = { x: 350, y: 245 };
                        const D = {
                          x: A.x + (B.x - A.x) * thalesRatio,
                          y: A.y + (B.y - A.y) * thalesRatio,
                        };
                        const E = {
                          x: A.x + (C.x - A.x) * thalesRatio,
                          y: A.y + (C.y - A.y) * thalesRatio,
                        };
                        return (
                          <>
                            <polygon
                              points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
                              fill="rgba(56,189,248,0.14)"
                              stroke="#60A5FA"
                              strokeWidth="2.2"
                            />
                            <polygon
                              points={`${A.x},${A.y} ${D.x},${D.y} ${E.x},${E.y}`}
                              fill="rgba(200,151,44,0.28)"
                              stroke="#EBD08A"
                              strokeWidth="2.5"
                            />
                            <line
                              x1={D.x - 20}
                              y1={D.y}
                              x2={E.x + 20}
                              y2={E.y}
                              stroke="#DDB14A"
                              strokeWidth="2.2"
                              strokeDasharray="5 3"
                            />
                            <text x={A.x} y={A.y - 10} fill="#FFFFFF" fontSize="13" textAnchor="middle">A</text>
                            <text x={B.x - 14} y={B.y + 12} fill="#FFFFFF" fontSize="13">B</text>
                            <text x={C.x + 10} y={C.y + 12} fill="#FFFFFF" fontSize="13">C</text>
                            <text x={D.x - 18} y={D.y + 4} fill="#EBD08A" fontSize="13">D</text>
                            <text x={E.x + 12} y={E.y + 4} fill="#EBD08A" fontSize="13">E</text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      تجربة نظرية طاليس في التناسب (DE ∥ BC)
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      حرّك المستقيم القاطع DE الموازي للقاعدة BC ولاحظ تطابق النسب
                      الثلاث في جميع الأوضاع.
                    </p>
                    <label className="block text-sm font-medium text-slate-800">
                      نسبة القطع k = <span className="font-mono font-bold">{thalesRatio.toFixed(2)}</span>
                      <input
                        type="range"
                        min="0.2"
                        max="0.9"
                        step="0.05"
                        value={thalesRatio}
                        onChange={(e) => setThalesRatio(parseFloat(e.target.value))}
                        className="w-full mt-1.5 accent-[#C8972C]"
                      />
                    </label>
                    <div
                      dir="ltr"
                      className="p-4 rounded-xl bg-[#0B172A] text-white font-mono text-sm space-y-1.5 tabular-nums"
                    >
                      <div>AD / AB = {thalesRatio.toFixed(2)}</div>
                      <div>AE / AC = {thalesRatio.toFixed(2)}</div>
                      <div className="text-[#EBD08A] font-bold">
                        DE / BC = {thalesRatio.toFixed(2)} (تناسب ثابت)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EXP 4: CIRCLE PROPERTIES */}
              {activeExp === 'circle' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 bg-[#0B172A] rounded-xl p-4">
                    <svg viewBox="0 0 420 280" className="w-full h-auto">
                      {(() => {
                        const cx = 210;
                        const cy = 145;
                        const r = 100;
                        const halfRad = ((circleCentralDeg / 2) * Math.PI) / 180;
                        const Ax = cx + r * Math.cos(Math.PI / 2 - halfRad);
                        const Ay = cy + r * Math.sin(Math.PI / 2 - halfRad);
                        const Bx = cx + r * Math.cos(Math.PI / 2 + halfRad);
                        const By = cy + r * Math.sin(Math.PI / 2 + halfRad);
                        const Cx = cx;
                        const Cy = cy - r;

                        return (
                          <>
                            <circle cx={cx} cy={cy} r={r} fill="rgba(56,189,248,0.1)" stroke="#38BDF8" strokeWidth="2.2" />
                            {/* Central angle */}
                            <polygon
                              points={`${cx},${cy} ${Ax},${Ay} ${Bx},${By}`}
                              fill="rgba(56,189,248,0.25)"
                              stroke="#60A5FA"
                              strokeWidth="2"
                            />
                            {/* Inscribed angle */}
                            <polyline
                              points={`${Ax},${Ay} ${Cx},${Cy} ${Bx},${By}`}
                              fill="none"
                              stroke="#EBD08A"
                              strokeWidth="2.5"
                            />
                            <circle cx={cx} cy={cy} r="4.5" fill="#FFFFFF" />
                            <circle cx={Cx} cy={Cy} r="5" fill="#EBD08A" />
                            <text x={cx} y={cy + 24} fill="#60A5FA" fontSize="13" fontFamily="IBM Plex Mono" textAnchor="middle">
                              {circleCentralDeg}°
                            </text>
                            <text x={Cx} y={Cy + 28} fill="#EBD08A" fontSize="13" fontFamily="IBM Plex Mono" textAnchor="middle">
                              {(circleCentralDeg / 2).toFixed(1)}°
                            </text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      خصائص الدائرة: المركزية والمحيطية وطاليس
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      غيّر الزاوية المركزية ولاحظ أن الزاوية المحيطية المقابلة لنفس
                      القوس تساوي نصفها دائماً. عند ضبط المركزية على 180° تصبح
                      المحيطية 90° (نظرية طاليس).
                    </p>
                    <label className="block text-sm font-medium text-slate-800">
                      الزاوية المركزية ∠AOB ={' '}
                      <span className="font-mono font-bold">{circleCentralDeg}°</span>
                      <input
                        type="range"
                        min="40"
                        max="180"
                        step="2"
                        value={circleCentralDeg}
                        onChange={(e) => setCircleCentralDeg(parseInt(e.target.value, 10))}
                        className="w-full mt-1.5 accent-[#C8972C]"
                      />
                    </label>
                    <div className="p-4 rounded-xl bg-[#0B172A] text-white font-mono text-sm space-y-1.5 tabular-nums">
                      <div className="text-[#60A5FA]">المركزية = {circleCentralDeg}°</div>
                      <div className="text-[#EBD08A] font-bold">
                        المحيطية = {(circleCentralDeg / 2).toFixed(1)}°
                      </div>
                      {circleCentralDeg === 180 && (
                        <div className="text-emerald-400 pt-1">
                          تحققت نظرية طاليس: AB قطر والزاوية المحيطية 90°!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* EXP 5: SYMMETRY */}
              {activeExp === 'symmetry' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 bg-[#0B172A] rounded-xl p-4">
                    <svg viewBox="0 0 480 280" className="w-full h-auto">
                      {symMode === 'axial' ? (
                        <line x1="240" y1="20" x2="240" y2="260" stroke="#60A5FA" strokeWidth="2" strokeDasharray="6 4" />
                      ) : (
                        <circle cx="240" cy="140" r="6" fill="#60A5FA" />
                      )}
                      <polygon
                        points={symPts.map((p) => `${p.x},${p.y}`).join(' ')}
                        fill="rgba(200,151,44,0.28)"
                        stroke="#EBD08A"
                        strokeWidth="2.2"
                      />
                      <polygon
                        points={symPts
                          .map((p) =>
                            symMode === 'axial'
                              ? `${480 - p.x},${p.y}`
                              : `${480 - p.x},${280 - p.y}`
                          )
                          .join(' ')}
                        fill="rgba(56,189,248,0.24)"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                      />
                    </svg>
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      التناظر المحوري والمركزي
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      بدّل بين التناظر المحوري (انعكاس عبر محور) والتناظر المركزي
                      (دوران 180° حول مركز O)، وحرّك رأس المضلع الأصلي.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSymMode('axial')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                          symMode === 'axial'
                            ? 'bg-[#0B172A] text-[#EBD08A]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        تناظر محوري
                      </button>
                      <button
                        type="button"
                        onClick={() => setSymMode('central')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                          symMode === 'central'
                            ? 'bg-[#0B172A] text-[#EBD08A]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        تناظر مركزي
                      </button>
                    </div>
                    <label className="block text-xs text-slate-700">
                      إزاحة قمة الشكل الأصلي:
                      <input
                        type="range"
                        min="60"
                        max="200"
                        value={symPts[0].x}
                        onChange={(e) => {
                          const x = parseInt(e.target.value, 10);
                          setSymPts((prev) =>
                            prev.map((p, i) => (i === 0 ? { ...p, x } : p))
                          );
                        }}
                        className="w-full mt-1.5 accent-[#C8972C]"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* EXP 6: GEOMETRIC TRANSFORMATIONS */}
              {activeExp === 'transforms' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 bg-[#0B172A] rounded-xl p-4">
                    <svg viewBox="0 0 480 280" className="w-full h-auto">
                      <line x1="20" y1="140" x2="460" y2="140" stroke="rgba(255,255,255,0.2)" />
                      <line x1="240" y1="20" x2="240" y2="260" stroke="rgba(255,255,255,0.2)" />
                      {/* Original shape centered around (240,140) */}
                      <polygon
                        points="240,100 280,170 200,170"
                        fill="rgba(255,255,255,0.12)"
                        stroke="#94A3B8"
                        strokeDasharray="4 3"
                        strokeWidth="1.8"
                      />
                      {/* Transformed shape */}
                      <g
                        transform={`translate(${240 + tx}, ${140 + ty}) rotate(${rotDeg}) scale(${scaleK})`}
                      >
                        <polygon
                          points="0,-40 40,30 -40,30"
                          fill="rgba(200,151,44,0.32)"
                          stroke="#EBD08A"
                          strokeWidth="2.5"
                        />
                      </g>
                    </svg>
                  </div>
                  <div className="lg:col-span-5 space-y-3">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      التحويلات الهندسية (الانسحاب، الدوران، التحجيم)
                    </h2>
                    <label className="block text-xs text-slate-700">
                      الانسحاب الأفقي Δx = <span className="font-mono font-bold">{tx}</span>
                      <input type="range" min="-120" max="120" value={tx} onChange={(e) => setTx(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                    </label>
                    <label className="block text-xs text-slate-700">
                      الانسحاب الرأسي Δy = <span className="font-mono font-bold">{ty}</span>
                      <input type="range" min="-80" max="80" value={ty} onChange={(e) => setTy(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                    </label>
                    <label className="block text-xs text-slate-700">
                      زاوية الدوران θ = <span className="font-mono font-bold">{rotDeg}°</span>
                      <input type="range" min="0" max="360" value={rotDeg} onChange={(e) => setRotDeg(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                    </label>
                    <label className="block text-xs text-slate-700">
                      معامل التكبير/التصغير k = <span className="font-mono font-bold">{scaleK.toFixed(2)}</span>
                      <input type="range" min="0.5" max="1.8" step="0.1" value={scaleK} onChange={(e) => setScaleK(parseFloat(e.target.value))} className="w-full accent-[#C8972C]" />
                    </label>
                  </div>
                </div>
              )}

              {/* EXP 7: AREAS & PERIMETERS */}
              {activeExp === 'areas' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 bg-[#0B172A] rounded-xl p-4">
                    <svg viewBox="0 0 460 280" className="w-full h-auto">
                      {(() => {
                        const sc = 22;
                        const bPx = areaBase * sc;
                        const hPx = areaHeight * sc;
                        const tPx = areaTop * sc;
                        const x0 = 230 - bPx / 2;
                        const y0 = 225;

                        if (areaShapeKind === 'triangle') {
                          return (
                            <>
                              <polygon
                                points={`${x0},${y0} ${x0 + bPx},${y0} ${x0 + bPx * 0.4},${y0 - hPx}`}
                                fill="rgba(200,151,44,0.28)"
                                stroke="#EBD08A"
                                strokeWidth="2.5"
                              />
                              <line x1={x0 + bPx * 0.4} y1={y0 - hPx} x2={x0 + bPx * 0.4} y2={y0} stroke="#38BDF8" strokeDasharray="4 3" strokeWidth="2" />
                            </>
                          );
                        }
                        if (areaShapeKind === 'parallelogram') {
                          return (
                            <>
                              <polygon
                                points={`${x0},${y0} ${x0 + bPx},${y0} ${x0 + bPx + 40},${y0 - hPx} ${x0 + 40},${y0 - hPx}`}
                                fill="rgba(56,189,248,0.22)"
                                stroke="#38BDF8"
                                strokeWidth="2.5"
                              />
                              <line x1={x0 + 40} y1={y0 - hPx} x2={x0 + 40} y2={y0} stroke="#EBD08A" strokeDasharray="4 3" strokeWidth="2" />
                            </>
                          );
                        }
                        return (
                          <>
                            <polygon
                              points={`${x0},${y0} ${x0 + bPx},${y0} ${230 + tPx / 2},${y0 - hPx} ${230 - tPx / 2},${y0 - hPx}`}
                              fill="rgba(200,151,44,0.28)"
                              stroke="#EBD08A"
                              strokeWidth="2.5"
                            />
                            <line x1={230} y1={y0 - hPx} x2={230} y2={y0} stroke="#38BDF8" strokeDasharray="4 3" strokeWidth="2" />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      حساب المساحات والمحيطات
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'triangle', label: 'مثلث' },
                          { id: 'parallelogram', label: 'متوازي أضلاع' },
                          { id: 'trapezoid', label: 'شبه منحرف' },
                        ] as const
                      ).map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => setAreaShapeKind(k.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            areaShapeKind === k.id
                              ? 'bg-[#0B172A] text-[#EBD08A]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {k.label}
                        </button>
                      ))}
                    </div>
                    <label className="block text-xs text-slate-700">
                      القاعدة الكبرى B = <span className="font-mono font-bold">{areaBase}</span>
                      <input type="range" min="4" max="12" value={areaBase} onChange={(e) => setAreaBase(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                    </label>
                    {areaShapeKind === 'trapezoid' && (
                      <label className="block text-xs text-slate-700">
                        القاعدة الصغرى b = <span className="font-mono font-bold">{areaTop}</span>
                        <input type="range" min="2" max="10" value={areaTop} onChange={(e) => setAreaTop(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                      </label>
                    )}
                    <label className="block text-xs text-slate-700">
                      الارتفاع h = <span className="font-mono font-bold">{areaHeight}</span>
                      <input type="range" min="2" max="8" value={areaHeight} onChange={(e) => setAreaHeight(parseInt(e.target.value, 10))} className="w-full accent-[#38BDF8]" />
                    </label>

                    <div className="p-4 rounded-xl bg-[#0B172A] text-white font-mono text-sm tabular-nums">
                      {areaShapeKind === 'triangle' &&
                        `المساحة = (1/2) × ${areaBase} × ${areaHeight} = ${(0.5 * areaBase * areaHeight).toFixed(1)} وحدة²`}
                      {areaShapeKind === 'parallelogram' &&
                        `المساحة = ${areaBase} × ${areaHeight} = ${(areaBase * areaHeight).toFixed(1)} وحدة²`}
                      {areaShapeKind === 'trapezoid' &&
                        `المساحة = ((${areaBase} + ${areaTop}) / 2) × ${areaHeight} = ${(((areaBase + areaTop) / 2) * areaHeight).toFixed(1)} وحدة²`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: 3D MODELS & VOLUMES (THREE.JS) ================= */}
        {activeTab === '3d-volumes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#0B172A]">
                    مختبر المجسمات ثلاثية الأبعاد وحساب الحجوم
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    اسحب لتدوير النموذج 360°، واستخدم عجلة الفأرة أو اللمس للتقريب،
                    أو فكّك المجسمات الأفلاطونية وقارن حجوم الكرة والأسطوانة والهرم الناقص.
                  </p>
                </div>
              </div>
              <ThreeDLabCanvas initialMode="platonic" />
            </div>
          </div>
        )}

        {/* ================= TAB 4: HISTORICAL CONSTRUCTIONS ================= */}
        {activeTab === 'historical' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'rope', label: '1. حبل المسّاحين المصري (3-4-5)' },
                  { id: 'thales-pyramid', label: '2. قياس طاليس لارتفاع الهرم' },
                  { id: 'biruni', label: '3. قياس البيروني لنصف قطر الأرض' },
                  { id: 'archimedes', label: '4. حصر أرخميدس لقيمة π' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setHistExp(item.id);
                    onRecordExperiment(`hist-${item.id}`);
                  }}
                  className={`min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border cursor-pointer ${
                    histExp === item.id
                      ? 'bg-[#0B172A] border-[#0B172A] text-[#EBD08A] font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#C8972C]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              {histExp === 'rope' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 bg-[#0B172A] rounded-xl p-6 text-white text-center space-y-4">
                    <p className="text-xs text-[#EBD08A]">محاكاة شدّ الحبل المعقود</p>
                    <div className="text-4xl font-mono font-bold tabular-nums">
                      {ropeSideA} : {ropeSideB} : {ropeSideC}
                    </div>
                    <p className={`text-sm font-semibold px-4 py-2 rounded-lg inline-block ${
                      ropeIsRight ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {ropeIsRight
                        ? 'نجاح! تحققت الزاوية القائمة 90° لبناء قاعدة الهرم'
                        : 'المثلث مائل — عدّل الأوتاد لتحقيق علاقة a² + b² = c²'}
                    </p>
                  </div>
                  <div className="lg:col-span-6 space-y-4">
                    <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                      إعادة اكتشاف طريقة المسّاحين المصريين
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      استخدم المهندسون المصريون حبلاً ذا عقد متساوية. جرّب تغيير طول
                      الأجزاء الثلاثة للحبل واكتشف أي التوليفات تنتج زاوية قائمة حقيقية
                      (مثل 3-4-5 أو 5-12-13 أو 6-8-10).
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="text-xs font-medium text-slate-700">
                        الجزء 1: {ropeSideA}
                        <input type="range" min="2" max="12" value={ropeSideA} onChange={(e) => setRopeSideA(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        الجزء 2: {ropeSideB}
                        <input type="range" min="2" max="12" value={ropeSideB} onChange={(e) => setRopeSideB(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                      </label>
                      <label className="text-xs font-medium text-slate-700">
                        الجزء 3: {ropeSideC}
                        <input type="range" min="2" max="15" value={ropeSideC} onChange={(e) => setRopeSideC(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {histExp === 'thales-pyramid' && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                    طريقة طاليس الملطي لقياس ارتفاع الهرم الأكبر
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    غرس طاليس عصاً طولها 1.5 متر وقاس ظلها وظل الهرم في اللحظة نفسها.
                    حرّك طول ظل العصا وظل الهرم لحساب الارتفاع بالاعتماد على تشابه المثلثات:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm">
                      طول ظل العصا (طولها 1.5 م): <strong className="font-mono">{stickShadow.toFixed(1)} م</strong>
                      <input type="range" min="1" max="4" step="0.1" value={stickShadow} onChange={(e) => setStickShadow(parseFloat(e.target.value))} className="w-full mt-2 accent-[#C8972C]" />
                    </label>
                    <label className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm">
                      طول ظل الهرم الكلي: <strong className="font-mono">{pyramidShadow} م</strong>
                      <input type="range" min="100" max="280" step="2" value={pyramidShadow} onChange={(e) => setPyramidShadow(parseInt(e.target.value, 10))} className="w-full mt-2 accent-[#C8972C]" />
                    </label>
                  </div>
                  <div className="p-5 rounded-xl bg-[#0B172A] text-white font-mono text-base flex flex-wrap items-center justify-between gap-4 tabular-nums">
                    <span>H = (1.5 / {stickShadow.toFixed(1)}) × {pyramidShadow}</span>
                    <span className="text-[#EBD08A] font-bold text-lg">
                      الارتفاع المحسوب = {((1.5 / stickShadow) * pyramidShadow).toFixed(2)} متراً
                    </span>
                  </div>
                </div>
              )}

              {histExp === 'biruni' && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                    تجربة البيروني لقياس نصف قطر كوكب الأرض
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    صعد البيروني جبلاً معروف الارتفاع h وقاس بالأسطرلاب زاوية انخفاض
                    الأفق θ، ثم طبّق حساب المثلثات لاستخراج نصف قطر الأرض R دون سفر!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm">
                      ارتفاع الجبل h = <strong className="font-mono">{mountainH} م</strong>
                      <input type="range" min="300" max="1500" step="10" value={mountainH} onChange={(e) => setMountainH(parseInt(e.target.value, 10))} className="w-full mt-2 accent-[#C8972C]" />
                    </label>
                    <label className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm">
                      زاوية انخفاض الأفق θ = <strong className="font-mono">{dipAngleDeg.toFixed(2)}°</strong>
                      <input type="range" min="0.35" max="1.2" step="0.01" value={dipAngleDeg} onChange={(e) => setDipAngleDeg(parseFloat(e.target.value))} className="w-full mt-2 accent-[#C8972C]" />
                    </label>
                  </div>
                  <div className="p-5 rounded-xl bg-[#0B172A] text-white font-mono text-sm sm:text-base flex flex-wrap items-center justify-between gap-4 tabular-nums">
                    <span>R = h·cos(θ) / (1 − cos(θ))</span>
                    <span className="text-[#EBD08A] font-bold text-lg">
                      نصف القطر المقاس ≈ {biruniRkm.toFixed(1)} كم (الحقيقي: 6371 كم)
                    </span>
                  </div>
                </div>
              )}

              {histExp === 'archimedes' && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold font-editorial text-[#0B172A]">
                    طريقة الاستنفاد لأرخميدس لحصر قيمة π
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    حصر أرخميدس الدائرة بين مضلع منتظم داخلي ومضلع منتظم خارجي ورفع
                    عدد الأضلاع من 6 إلى 12 ثم 24 ثم 48 ثم 96 ضلعاً. جرّب مضاعفة الأضلاع!
                  </p>
                  <label className="block p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm">
                    عدد أضلاع المضلع n = <strong className="font-mono">{archSides}</strong>
                    <input type="range" min="4" max="96" step="2" value={archSides} onChange={(e) => setArchSides(parseInt(e.target.value, 10))} className="w-full mt-2 accent-[#C8972C]" />
                  </label>
                  <div className="p-5 rounded-xl bg-[#0B172A] text-white font-mono text-sm sm:text-base text-center tabular-nums">
                    <span className="text-[#38BDF8]">{archLower.toFixed(6)}</span>
                    <span className="mx-3 text-slate-300">&lt; π (3.141593) &lt;</span>
                    <span className="text-[#EBD08A]">{archUpper.toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: ANIMATED VIDEOS & DIAGRAMS ================= */}
        {activeTab === 'animated-videos' && <AnimatedGeometryTheater />}

        {/* ================= TAB 6: GRADED LAB CHALLENGES ================= */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Challenge 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#C8972C]">
                <span>تحدي 01 · +25 نقطة</span>
                {progress.solvedLabChallenges.includes('ch1') && (
                  <span className="text-emerald-700 font-bold">مكتمل</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#0B172A]">
                أنشئ مثلثاً قائم الزاوية مساحته 24 وحدة مربعة بالضبط
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-700">
                  القاعدة a = <strong className="font-mono">{ch1A}</strong>
                  <input type="range" min="2" max="12" value={ch1A} onChange={(e) => setCh1A(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                </label>
                <label className="text-xs text-slate-700">
                  الارتفاع b = <strong className="font-mono">{ch1B}</strong>
                  <input type="range" min="2" max="12" value={ch1B} onChange={(e) => setCh1B(parseInt(e.target.value, 10))} className="w-full accent-[#C8972C]" />
                </label>
              </div>
              <button
                type="button"
                onClick={checkChallenge1}
                className="w-full min-h-[44px] rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold cursor-pointer"
              >
                تحقق من التجربة
              </button>
              {challengeStatus.ch1 && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 ${
                  challengeStatus.ch1.passed ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}>
                  {challengeStatus.ch1.passed ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{challengeStatus.ch1.message}</span>
                </div>
              )}
            </div>

            {/* Challenge 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#C8972C]">
                <span>تحدي 02 · +25 نقطة</span>
                {progress.solvedLabChallenges.includes('ch2') && (
                  <span className="text-emerald-700 font-bold">مكتمل</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#0B172A]">
                اضبط الزاوية المركزية في الدائرة لتصبح الزاوية المحيطية 45°
              </h3>
              <label className="block text-xs text-slate-700">
                الزاوية المركزية المختارة: <strong className="font-mono">{ch2Central}°</strong>
                <input type="range" min="20" max="180" step="5" value={ch2Central} onChange={(e) => setCh2Central(parseInt(e.target.value, 10))} className="w-full mt-1.5 accent-[#C8972C]" />
              </label>
              <button
                type="button"
                onClick={checkChallenge2}
                className="w-full min-h-[44px] rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold cursor-pointer"
              >
                تحقق من التجربة
              </button>
              {challengeStatus.ch2 && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 ${
                  challengeStatus.ch2.passed ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}>
                  {challengeStatus.ch2.passed ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{challengeStatus.ch2.message}</span>
                </div>
              )}
            </div>

            {/* Challenge 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#C8972C]">
                <span>تحدي 03 · +25 نقطة</span>
                {progress.solvedLabChallenges.includes('ch3') && (
                  <span className="text-emerald-700 font-bold">مكتمل</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#0B172A]">
                اختر عدد أضلاع مضلع محدب يكون مجموع زواياه الداخلية 720°
              </h3>
              <label className="block text-xs text-slate-700">
                عدد الأضلاع n = <strong className="font-mono">{ch3Sides}</strong>
                <input type="range" min="3" max="12" value={ch3Sides} onChange={(e) => setCh3Sides(parseInt(e.target.value, 10))} className="w-full mt-1.5 accent-[#C8972C]" />
              </label>
              <button
                type="button"
                onClick={checkChallenge3}
                className="w-full min-h-[44px] rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold cursor-pointer"
              >
                تحقق من التجربة
              </button>
              {challengeStatus.ch3 && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 ${
                  challengeStatus.ch3.passed ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}>
                  {challengeStatus.ch3.passed ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{challengeStatus.ch3.message}</span>
                </div>
              )}
            </div>

            {/* Challenge 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#C8972C]">
                <span>تحدي 04 · +30 نقطة</span>
                {progress.solvedLabChallenges.includes('ch4') && (
                  <span className="text-emerald-700 font-bold">مكتمل</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#0B172A]">
                تحدي أرخميدس: ارفع عدد أضلاع المضلع لحصر π بهامش خطأ أقل من 0.01
              </h3>
              <label className="block text-xs text-slate-700">
                عدد الأضلاع n = <strong className="font-mono">{ch4Sides}</strong>
                <input type="range" min="4" max="96" step="2" value={ch4Sides} onChange={(e) => setCh4Sides(parseInt(e.target.value, 10))} className="w-full mt-1.5 accent-[#C8972C]" />
              </label>
              <button
                type="button"
                onClick={checkChallenge4}
                className="w-full min-h-[44px] rounded-lg bg-[#0B172A] hover:bg-[#132542] text-white text-sm font-semibold cursor-pointer"
              >
                تحقق من التجربة
              </button>
              {challengeStatus.ch4 && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 ${
                  challengeStatus.ch4.passed ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-950 border border-amber-200'
                }`}>
                  {challengeStatus.ch4.passed ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{challengeStatus.ch4.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
