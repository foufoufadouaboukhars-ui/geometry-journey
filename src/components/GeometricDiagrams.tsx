import React from 'react';
import { HistoricalEra, Scientist } from '../types/geometry';

export const EraGeometricDiagram: React.FC<{
  type: HistoricalEra['diagramType'];
}> = ({ type }) => {
  switch (type) {
    case 'egyptian-rope':
      return (
        <svg
          viewBox="0 0 420 260"
          className="w-full h-auto"
          role="img"
          aria-label="رسم توضيحي لمثلث المساحين المصري 3-4-5"
        >
          <rect width="420" height="260" rx="12" fill="#0B172A" />
          <g stroke="rgba(200,151,44,0.14)" strokeWidth="1">
            <line x1="0" y1="65" x2="420" y2="65" />
            <line x1="0" y1="130" x2="420" y2="130" />
            <line x1="0" y1="195" x2="420" y2="195" />
            <line x1="105" y1="0" x2="105" y2="260" />
            <line x1="210" y1="0" x2="210" y2="260" />
            <line x1="315" y1="0" x2="315" y2="260" />
          </g>
          {/* Right angle marker */}
          <rect
            x="95"
            y="182"
            width="22"
            height="22"
            fill="none"
            stroke="#C8972C"
            strokeWidth="1.8"
          />
          {/* Triangle 3-4-5 */}
          <polygon
            points="95,204 295,204 95,54"
            fill="rgba(200,151,44,0.12)"
            stroke="#EBD08A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Knots along sides */}
          {[0, 1, 2, 3].map((i) => (
            <circle key={`v-${i}`} cx={95} cy={204 - i * 50} r="4.5" fill="#C8972C" />
          ))}
          {[1, 2, 3, 4].map((i) => (
            <circle key={`h-${i}`} cx={95 + i * 50} cy={204} r="4.5" fill="#C8972C" />
          ))}
          {[1, 2, 3, 4].map((i) => (
            <circle
              key={`hyp-${i}`}
              cx={95 + i * 40}
              cy={54 + i * 30}
              r="4.5"
              fill="#C8972C"
            />
          ))}
          {/* Labels */}
          <text x="68" y="132" fill="#FFFFFF" fontSize="14" fontFamily="IBM Plex Mono">
            3
          </text>
          <text x="192" y="226" fill="#FFFFFF" fontSize="14" fontFamily="IBM Plex Mono">
            4
          </text>
          <text x="208" y="118" fill="#EBD08A" fontSize="14" fontFamily="IBM Plex Mono">
            5
          </text>
          <text x="122" y="176" fill="#94A3B8" fontSize="12" fontFamily="IBM Plex Sans Arabic">
            90°
          </text>
        </svg>
      );

    case 'euclid-pythagoras':
      return (
        <svg
          viewBox="0 0 420 260"
          className="w-full h-auto"
          role="img"
          aria-label="رسم توضيحي لبرهان إقليدس لنظرية فيثاغورس"
        >
          <rect width="420" height="260" rx="12" fill="#0B172A" />
          {/* Squares on legs */}
          <rect
            x="92"
            y="108"
            width="60"
            height="60"
            fill="rgba(56,189,248,0.16)"
            stroke="#38BDF8"
            strokeWidth="2"
          />
          <rect
            x="152"
            y="168"
            width="80"
            height="80"
            fill="rgba(200,151,44,0.16)"
            stroke="#DDB14A"
            strokeWidth="2"
          />
          {/* Square on hypotenuse (3-4-5 rotated) */}
          <polygon
            points="152,108 232,168 292,88 212,28"
            fill="rgba(255,255,255,0.09)"
            stroke="#FFFFFF"
            strokeWidth="2.2"
          />
          {/* Right triangle */}
          <polygon
            points="152,168 232,168 152,108"
            fill="rgba(200,151,44,0.28)"
            stroke="#EBD08A"
            strokeWidth="2.5"
          />
          <text x="115" y="143" fill="#38BDF8" fontSize="13" fontFamily="IBM Plex Mono">
            a²
          </text>
          <text x="184" y="213" fill="#DDB14A" fontSize="13" fontFamily="IBM Plex Mono">
            b²
          </text>
          <text x="215" y="102" fill="#FFFFFF" fontSize="14" fontFamily="IBM Plex Mono">
            c² = a² + b²
          </text>
        </svg>
      );

    case 'biruni-earth':
      return (
        <svg
          viewBox="0 0 420 260"
          className="w-full h-auto"
          role="img"
          aria-label="رسم توضيحي لتجربة البيروني لقياس نصف قطر الأرض"
        >
          <rect width="420" height="260" rx="12" fill="#0B172A" />
          {/* Earth arc */}
          <circle
            cx="180"
            cy="245"
            r="155"
            fill="rgba(29,53,93,0.45)"
            stroke="#60A5FA"
            strokeWidth="2"
          />
          {/* Mountain peak */}
          <polygon
            points="160,92 180,50 200,92"
            fill="rgba(200,151,44,0.35)"
            stroke="#DDB14A"
            strokeWidth="2"
          />
          {/* Center to Mountain Peak */}
          <line x1="180" y1="245" x2="180" y2="50" stroke="#FFFFFF" strokeWidth="1.8" strokeDasharray="4 4" />
          {/* Tangent to horizon */}
          <line x1="180" y1="50" x2="318" y2="174" stroke="#EBD08A" strokeWidth="2.2" />
          {/* Radius to tangent point */}
          <line x1="180" y1="245" x2="318" y2="174" stroke="#60A5FA" strokeWidth="2" />
          {/* Horizontal reference at peak */}
          <line x1="180" y1="50" x2="345" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="180" cy="245" r="4" fill="#FFFFFF" />
          <circle cx="318" cy="174" r="4" fill="#EBD08A" />
          <text x="165" y="170" fill="#FFFFFF" fontSize="12" fontFamily="IBM Plex Mono">
            R + h
          </text>
          <text x="255" y="218" fill="#60A5FA" fontSize="12" fontFamily="IBM Plex Mono">
            R
          </text>
          <text x="235" y="64" fill="#EBD08A" fontSize="12" fontFamily="IBM Plex Mono">
            θ
          </text>
          <text x="188" y="72" fill="#DDB14A" fontSize="11" fontFamily="IBM Plex Mono">
            h
          </text>
        </svg>
      );

    case 'medieval-ratio':
      return (
        <svg
          viewBox="0 0 420 260"
          className="w-full h-auto"
          role="img"
          aria-label="التمثيل البياني المبكر عند نيكول أورسم"
        >
          <rect width="420" height="260" rx="12" fill="#0B172A" />
          {/* Axes */}
          <line x1="70" y1="210" x2="360" y2="210" stroke="#94A3B8" strokeWidth="2" />
          <line x1="70" y1="210" x2="70" y2="40" stroke="#94A3B8" strokeWidth="2" />
          {/* Velocity Triangle */}
          <polygon
            points="70,210 310,210 310,65"
            fill="rgba(200,151,44,0.18)"
            stroke="#DDB14A"
            strokeWidth="2.5"
          />
          {/* Equivalent Average Rectangle */}
          <rect
            x="70"
            y="137.5"
            width="240"
            height="72.5"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text x="320" y="226" fill="#CBD5E1" fontSize="12" fontFamily="IBM Plex Sans Arabic">
            الزمن (t)
          </text>
          <text x="22" y="55" fill="#CBD5E1" fontSize="12" fontFamily="IBM Plex Sans Arabic">
            السرعة
          </text>
          <text x="155" y="180" fill="#38BDF8" fontSize="12" fontFamily="IBM Plex Mono">
            v_avg · t = (1/2) a t²
          </text>
        </svg>
      );

    case 'renaissance-perspective':
      return (
        <svg
          viewBox="0 0 420 260"
          className="w-full h-auto"
          role="img"
          aria-label="المنظور الهندسي المركزي ونقطة التلاشي"
        >
          <rect width="420" height="260" rx="12" fill="#0B172A" />
          {/* Horizon Line */}
          <line x1="20" y1="95" x2="400" y2="95" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="5 4" />
          {/* Vanishing Point */}
          <circle cx="210" cy="95" r="5" fill="#EBD08A" />
          {/* Perspective Rays */}
          <line x1="210" y1="95" x2="40" y2="240" stroke="#DDB14A" strokeWidth="1.8" />
          <line x1="210" y1="95" x2="130" y2="240" stroke="rgba(221,177,74,0.5)" strokeWidth="1.2" />
          <line x1="210" y1="95" x2="290" y2="240" stroke="rgba(221,177,74,0.5)" strokeWidth="1.2" />
          <line x1="210" y1="95" x2="380" y2="240" stroke="#DDB14A" strokeWidth="1.8" />
          {/* Horizontal grid steps converging */}
          {[125, 150, 185, 230].map((y, idx) => {
            const t = (y - 95) / 145;
            const xL = 210 - t * 170;
            const xR = 210 + t * 170;
            return (
              <line
                key={idx}
                x1={xL}
                y1={y}
                x2={xR}
                y2={y}
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.3"
              />
            );
          })}
          {/* Architectural columns */}
          <line x1="75" y1="210" x2="75" y2="75" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="145" y1="150" x2="145" y2="85" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="210" y1="95" x2="75" y2="75" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
          <text x="172" y="80" fill="#EBD08A" fontSize="12" fontFamily="IBM Plex Sans Arabic">
            نقطة التلاشي
          </text>
        </svg>
      );

    case 'cartesian-plane':
      return (
        <svg
          viewBox="0 0 420 260"
          className="w-full h-auto"
          role="img"
          aria-label="المستوي الديكارتي وتمثيل المنحنيات بالمعادلات"
        >
          <rect width="420" height="260" rx="12" fill="#0B172A" />
          <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
            {[50, 90, 170, 210].map((y) => (
              <line key={`y-${y}`} x1="30" y1={y} x2="390" y2={y} />
            ))}
            {[90, 130, 170, 250, 290, 330].map((x) => (
              <line key={`x-${x}`} x1={x} y1="20" x2={x} y2="240" />
            ))}
          </g>
          {/* Main X & Y axes */}
          <line x1="30" y1="130" x2="390" y2="130" stroke="#94A3B8" strokeWidth="2" />
          <line x1="210" y1="20" x2="210" y2="240" stroke="#94A3B8" strokeWidth="2" />
          {/* Circle (x-40)^2 + (y+20)^2 */}
          <circle cx="250" cy="110" r="56" fill="rgba(56,189,248,0.12)" stroke="#38BDF8" strokeWidth="2.2" />
          {/* Parabola */}
          <path
            d="M 110 220 Q 210 10 310 220"
            fill="none"
            stroke="#DDB14A"
            strokeWidth="2.5"
          />
          <circle cx="250" cy="110" r="3.5" fill="#38BDF8" />
          <circle cx="278" cy="61" r="4.5" fill="#EBD08A" />
          <text x="288" y="55" fill="#EBD08A" fontSize="12" fontFamily="IBM Plex Mono">
            P(x, y)
          </text>
          <text x="45" y="45" fill="#38BDF8" fontSize="12" fontFamily="IBM Plex Mono">
            (x − h)² + (y − k)² = r²
          </text>
        </svg>
      );

    case 'noneuclidean-curvatures':
      return (
        <svg
          viewBox="0 0 420 260"
          className="w-full h-auto"
          role="img"
          aria-label="مقارنة الهندسة الإقليدية والكروية والزائدية"
        >
          <rect width="420" height="260" rx="12" fill="#0B172A" />
          {/* 1. Elliptic / Spherical (K > 0) */}
          <g transform="translate(75, 115)">
            <circle cx="0" cy="0" r="46" fill="rgba(56,189,248,0.12)" stroke="#38BDF8" strokeWidth="1.8" />
            <path d="M -26 20 Q 0 -35 0 -35 Q 26 20 26 20 Q 0 34 -26 20 Z" fill="rgba(56,189,248,0.28)" stroke="#FFFFFF" strokeWidth="2" />
            <text x="-38" y="72" fill="#38BDF8" fontSize="12" fontFamily="IBM Plex Sans Arabic">
              إهليلجية (K &gt; 0)
            </text>
            <text x="-28" y="90" fill="#CBD5E1" fontSize="11" fontFamily="IBM Plex Mono">
              Σ∠ &gt; 180°
            </text>
          </g>
          {/* 2. Euclidean (K = 0) */}
          <g transform="translate(210, 115)">
            <rect x="-46" y="-46" width="92" height="92" fill="rgba(255,255,255,0.06)" stroke="#94A3B8" strokeWidth="1.5" />
            <polygon points="0,-34 -32,26 32,26" fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth="2" />
            <text x="-35" y="72" fill="#FFFFFF" fontSize="12" fontFamily="IBM Plex Sans Arabic">
              إقليدية (K = 0)
            </text>
            <text x="-28" y="90" fill="#CBD5E1" fontSize="11" fontFamily="IBM Plex Mono">
              Σ∠ = 180°
            </text>
          </g>
          {/* 3. Hyperbolic (K < 0) */}
          <g transform="translate(345, 115)">
            <path d="M -45 -22 Q 0 18 45 -22 L 45 26 Q 0 -10 -45 26 Z" fill="rgba(200,151,44,0.16)" stroke="#DDB14A" strokeWidth="1.8" />
            <path d="M 0 -30 Q 8 5 -28 24 Q 0 14 28 24 Q -8 5 0 -30 Z" fill="rgba(200,151,44,0.3)" stroke="#FFFFFF" strokeWidth="2" />
            <text x="-35" y="72" fill="#DDB14A" fontSize="12" fontFamily="IBM Plex Sans Arabic">
              زائدية (K &lt; 0)
            </text>
            <text x="-28" y="90" fill="#CBD5E1" fontSize="11" fontFamily="IBM Plex Mono">
              Σ∠ &lt; 180°
            </text>
          </g>
        </svg>
      );
  }
};

export const ScientistPortraitEmblem: React.FC<{
  motif: Scientist['motif'];
  size?: 'sm' | 'lg';
}> = ({ motif, size = 'sm' }) => {
  const dim = size === 'lg' ? 'w-28 h-28' : 'w-20 h-20';

  const renderInnerMotif = () => {
    switch (motif) {
      case 'thales':
        return (
          <>
            <circle cx="50" cy="50" r="30" fill="none" stroke="#DDB14A" strokeWidth="1.8" />
            <line x1="20" y1="50" x2="80" y2="50" stroke="#94A3B8" strokeWidth="1.4" />
            <polygon points="20,50 80,50 62,22" fill="rgba(221,177,74,0.22)" stroke="#FFFFFF" strokeWidth="1.8" />
          </>
        );
      case 'pythagoras':
        return (
          <>
            <polygon points="34,66 72,66 34,28" fill="rgba(221,177,74,0.28)" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="20" y="28" width="14" height="38" fill="none" stroke="#DDB14A" strokeWidth="1.4" />
            <rect x="34" y="66" width="38" height="14" fill="none" stroke="#60A5FA" strokeWidth="1.4" />
          </>
        );
      case 'euclid':
        return (
          <>
            <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="rgba(56,189,248,0.16)" stroke="#DDB14A" strokeWidth="1.8" />
            <polygon points="50,18 78,66 22,66" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
            <line x1="50" y1="18" x2="50" y2="82" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
          </>
        );
      case 'archimedes':
        return (
          <>
            <rect x="24" y="24" width="52" height="52" fill="none" stroke="#60A5FA" strokeWidth="1.6" />
            <circle cx="50" cy="50" r="26" fill="rgba(221,177,74,0.22)" stroke="#DDB14A" strokeWidth="2" />
            <path d="M 50 50 Q 62 42 60 56 Q 55 70 38 62 Q 25 50 38 30" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
          </>
        );
      case 'khwarizmi':
        return (
          <>
            <rect x="24" y="24" width="36" height="36" fill="rgba(221,177,74,0.22)" stroke="#FFFFFF" strokeWidth="1.8" />
            <rect x="60" y="24" width="16" height="36" fill="rgba(96,165,250,0.22)" stroke="#60A5FA" strokeWidth="1.5" />
            <rect x="24" y="60" width="36" height="16" fill="rgba(96,165,250,0.22)" stroke="#60A5FA" strokeWidth="1.5" />
            <rect x="60" y="60" width="16" height="16" fill="rgba(221,177,74,0.4)" stroke="#DDB14A" strokeWidth="1.5" />
          </>
        );
      case 'thabit':
        return (
          <>
            <polygon points="18,68 82,68 44,24" fill="rgba(221,177,74,0.2)" stroke="#FFFFFF" strokeWidth="1.8" />
            <line x1="44" y1="24" x2="36" y2="68" stroke="#DDB14A" strokeWidth="1.6" />
            <line x1="44" y1="24" x2="62" y2="68" stroke="#DDB14A" strokeWidth="1.6" />
          </>
        );
      case 'biruni':
        return (
          <>
            <circle cx="50" cy="58" r="26" fill="rgba(96,165,250,0.16)" stroke="#60A5FA" strokeWidth="1.8" />
            <polygon points="44,33 50,18 56,33" fill="#DDB14A" />
            <line x1="50" y1="18" x2="75" y2="48" stroke="#FFFFFF" strokeWidth="1.6" />
            <line x1="50" y1="58" x2="75" y2="48" stroke="#DDB14A" strokeWidth="1.4" />
          </>
        );
      case 'haytham':
        return (
          <>
            <path d="M 22 65 Q 50 22 78 65" fill="none" stroke="#60A5FA" strokeWidth="2.4" />
            <polyline points="26,28 50,43 74,28" fill="none" stroke="#DDB14A" strokeWidth="1.8" />
            <line x1="50" y1="43" x2="50" y2="75" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="3 3" />
          </>
        );
      case 'khayyam':
        return (
          <>
            <path d="M 22 72 Q 50 18 78 72" fill="none" stroke="#DDB14A" strokeWidth="2" />
            <circle cx="54" cy="48" r="20" fill="none" stroke="#60A5FA" strokeWidth="1.8" />
            <circle cx="38" cy="42" r="3.5" fill="#FFFFFF" />
          </>
        );
      case 'davinci':
        return (
          <>
            <circle cx="50" cy="50" r="28" fill="none" stroke="#DDB14A" strokeWidth="1.6" />
            <rect x="26" y="26" width="48" height="48" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
            <polygon points="50,22 76,66 24,66" fill="rgba(221,177,74,0.18)" stroke="#DDB14A" strokeWidth="1.4" />
          </>
        );
      case 'descartes':
        return (
          <>
            <line x1="18" y1="50" x2="82" y2="50" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="50" y1="18" x2="50" y2="82" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M 22 72 C 36 22, 64 78, 78 26" fill="none" stroke="#DDB14A" strokeWidth="2.2" />
          </>
        );
      case 'fermat':
        return (
          <>
            <path d="M 24 72 Q 50 20 76 72" fill="none" stroke="#60A5FA" strokeWidth="2" />
            <line x1="25" y1="46" x2="75" y2="46" stroke="#DDB14A" strokeWidth="1.8" />
            <circle cx="50" cy="46" r="3.5" fill="#FFFFFF" />
          </>
        );
      case 'gauss':
        return (
          <>
            <circle cx="50" cy="50" r="28" fill="none" stroke="#DDB14A" strokeWidth="1.5" strokeDasharray="3 2" />
            <polygon
              points="50,22 68,29 77,46 73,65 59,77 41,77 27,65 23,46 32,29"
              fill="rgba(221,177,74,0.18)"
              stroke="#FFFFFF"
              strokeWidth="1.6"
            />
          </>
        );
      case 'lobachevsky':
        return (
          <>
            <path d="M 20 35 Q 50 60 80 35 L 80 65 Q 50 40 20 65 Z" fill="rgba(221,177,74,0.18)" stroke="#DDB14A" strokeWidth="1.6" />
            <path d="M 50 26 Q 55 50 32 68 Q 50 56 68 68 Q 45 50 50 26 Z" fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth="1.6" />
          </>
        );
      case 'riemann':
      default:
        return (
          <>
            <circle cx="50" cy="50" r="28" fill="rgba(56,189,248,0.12)" stroke="#60A5FA" strokeWidth="1.8" />
            <ellipse cx="50" cy="50" rx="28" ry="12" fill="none" stroke="#DDB14A" strokeWidth="1.5" />
            <ellipse cx="50" cy="50" rx="12" ry="28" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
          </>
        );
    }
  };

  return (
    <div
      className={`${dim} shrink-0 rounded-full bg-gradient-to-br from-[#0B172A] to-[#1D355D] border-2 border-[#C8972C]/70 flex items-center justify-center shadow-sm overflow-hidden`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(200,151,44,0.28)" strokeWidth="1" />
        {renderInnerMotif()}
      </svg>
    </div>
  );
};
