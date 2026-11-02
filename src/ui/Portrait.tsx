// Flat fashion-illustration portraits for the cast. Each has a signature colour and look.
import type { CharacterId, Mood } from '../engine/types';

export const CAST_COLOUR: Record<CharacterId, string> = {
  margaux: '#7a2433',
  theo: '#c58a1a',
  idris: '#2c3e63',
  ferriter: '#5f7a5a',
  aoife: '#1f6f6b',
  rupert: '#5b3a6b',
  celine: '#8c6d3f',
  saoirse: '#8a4b2a',
  kenji: '#3f5f73',
  narrator: '#8a837a',
  news: '#8a837a',
};

function Face({ mood, skin, cheek }: { mood: Mood; skin: string; cheek?: string }) {
  const mouth =
    mood === 'happy' ? 'M53 79 Q60 86 67 79' : mood === 'worried' ? 'M54 82 Q60 78 66 82' : 'M54 80 Q60 83 66 80';
  const brows = mood === 'worried' ? ['M45 58 L53 61', 'M75 58 L67 61'] : ['M45 60 Q49 57 53 60', 'M67 60 Q71 57 75 60'];
  return (
    <>
      <ellipse cx="60" cy="66" rx="17" ry="21" fill={skin} />
      {cheek && (
        <>
          <circle cx="49" cy="74" r="3.5" fill={cheek} opacity=".35" />
          <circle cx="71" cy="74" r="3.5" fill={cheek} opacity=".35" />
        </>
      )}
      <circle cx="53" cy="66" r="1.8" fill="#1b1918" />
      <circle cx="67" cy="66" r="1.8" fill="#1b1918" />
      {brows.map((d) => (
        <path key={d} d={d} stroke="#1b1918" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      ))}
      <path d={mouth} stroke="#1b1918" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  );
}

function Margaux({ mood }: { mood: Mood }) {
  return (
    <>
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#f1e9dc" />
      <rect x="52" y="82" width="16" height="16" rx="3" fill="#f1e9dc" />
      <path d="M50 92 Q60 99 70 92 L70 100 Q60 104 50 100 Z" fill="#e5dccc" />
      {/* sleek black bob */}
      <path d="M35 84 Q32 36 60 36 Q88 36 85 84 Q79 89 73 84 L73 70 L47 70 L47 84 Q41 89 35 84 Z" fill="#171514" />
      <Face mood={mood} skin="#f0d2bd" cheek="#c9706f" />
      <path d="M41 62 Q42 41 60 40 Q79 41 79 62 Q72 50 57 52 Q47 54 41 62 Z" fill="#171514" />
      {/* round glasses */}
      <circle cx="53" cy="66" r="6" fill="none" stroke="#1b1918" strokeWidth="1.3" />
      <circle cx="67" cy="66" r="6" fill="none" stroke="#1b1918" strokeWidth="1.3" />
      <path d="M59 66 L61 66" stroke="#1b1918" strokeWidth="1.3" />
      {/* oxblood lips */}
      <path d={mood === 'happy' ? 'M54 79 Q60 85 66 79 Q60 81 54 79 Z' : 'M54 80 Q60 83 66 80 Q60 82 54 80 Z'} fill="#7a2433" />
    </>
  );
}

function Theo({ mood }: { mood: Mood }) {
  return (
    <>
      {/* loud patterned shirt */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#e3a72f" />
      {[30, 44, 58, 72, 86].map((x) => (
        <circle key={x} cx={x} cy={110} r="3" fill="#7a2433" opacity=".7" />
      ))}
      {[37, 51, 65, 79].map((x) => (
        <circle key={x} cx={x} cy={102} r="2.4" fill="#2c3e63" opacity=".6" />
      ))}
      <rect x="53" y="82" width="14" height="14" rx="3" fill="#c98e63" />
      {/* tape measure */}
      <path d="M40 98 Q50 104 56 120 M80 98 Q70 104 64 120" stroke="#f3e7b8" strokeWidth="4" fill="none" />
      <Face mood={mood} skin="#c98e63" cheek="#9c4a3a" />
      {/* curls */}
      {[
        [44, 50],
        [52, 44],
        [61, 42],
        [70, 44],
        [77, 51],
        [42, 59],
        [79, 60],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="7" fill="#3b2418" />
      ))}
      {/* moustache */}
      <path d="M51 76 Q56 72 60 75 Q64 72 69 76 Q64 78 60 76.5 Q56 78 51 76 Z" fill="#3b2418" />
    </>
  );
}

function Idris({ mood }: { mood: Mood }) {
  return (
    <>
      {/* navy suit, white shirt, pocket square */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#22314f" />
      <path d="M52 95 L60 112 L68 95 Z" fill="#f4f1ea" />
      <path d="M58 98 L60 112 L62 98 Z" fill="#7a2433" />
      <path d="M80 106 l6 -3 l1 5 Z" fill="#c58a1a" />
      <rect x="53" y="82" width="14" height="13" rx="3" fill="#a87556" />
      <Face mood={mood} skin="#a87556" />
      {/* silver swept-back hair */}
      <path d="M42 62 Q40 42 60 41 Q80 42 78 62 Q76 50 60 49 Q46 50 42 62 Z" fill="#c9c6c0" />
      {/* beard */}
      <path d="M44 72 Q46 90 60 92 Q74 90 76 72 Q72 84 60 85 Q48 84 44 72 Z" fill="#b9b5ae" />
      <path d="M52 77 Q60 74 68 77" stroke="#b9b5ae" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  );
}

function Ferriter({ mood }: { mood: Mood }) {
  return (
    <>
      {/* sage cardigan, pearls */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#7d9776" />
      <path d="M50 94 L60 120 L70 94 Q60 98 50 94 Z" fill="#efe7da" />
      {[48, 52, 56, 60, 64, 68, 72].map((x, i) => (
        <circle key={x} cx={x} cy={93 + Math.abs(3 - i) * -0.8 + 3} r="1.9" fill="#fbf8f2" stroke="#d8cfbf" strokeWidth=".5" />
      ))}
      <rect x="53" y="82" width="14" height="12" rx="3" fill="#f2d9c8" />
      <Face mood={mood} skin="#f2d9c8" cheek="#d98a8a" />
      {/* white hair in a bun */}
      <circle cx="60" cy="36" r="9" fill="#ece8e1" />
      <path d="M42 66 Q40 44 60 44 Q80 44 78 66 Q76 54 60 53 Q44 54 42 66 Z" fill="#ece8e1" />
      {/* glasses on a chain */}
      <rect x="47" y="62" width="11" height="8" rx="3" fill="none" stroke="#5f7a5a" strokeWidth="1.3" />
      <rect x="62" y="62" width="11" height="8" rx="3" fill="none" stroke="#5f7a5a" strokeWidth="1.3" />
      <path d="M47 67 Q42 84 50 94 M73 67 Q78 84 70 94" stroke="#c58a1a" strokeWidth=".8" fill="none" />
    </>
  );
}

function Aoife({ mood }: { mood: Mood }) {
  return (
    <>
      {/* teal blazer, lanyard */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#1f6f6b" />
      <path d="M50 95 L60 108 L70 95 Z" fill="#f4f1ea" />
      <path d="M52 96 L58 120 M68 96 L62 120" stroke="#f3e7b8" strokeWidth="2" />
      <rect x="55" y="112" width="10" height="8" rx="1" fill="#f4f1ea" />
      <rect x="53" y="82" width="14" height="13" rx="3" fill="#f5dccb" />
      {/* red ponytail behind */}
      <path d="M76 52 Q96 60 88 92 Q84 74 76 66 Z" fill="#b5462b" />
      <Face mood={mood} skin="#f5dccb" cheek="#e08b77" />
      {/* freckles */}
      {[
        [48, 72],
        [51, 74],
        [69, 74],
        [72, 72],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r=".9" fill="#b5462b" opacity=".6" />
      ))}
      <path d="M42 64 Q40 42 60 42 Q80 42 78 62 Q70 50 56 54 Q48 56 42 64 Z" fill="#b5462b" />
    </>
  );
}

function Rupert({ mood }: { mood: Mood }) {
  return (
    <>
      {/* charcoal pinstripe, plum tie */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#33333b" />
      {[34, 44, 76, 86].map((x) => (
        <path key={x} d={`M${x} 100 L${x - 2} 120`} stroke="#6b6b75" strokeWidth=".8" />
      ))}
      <path d="M52 95 L60 110 L68 95 Z" fill="#f4f1ea" />
      <path d="M57 98 L60 118 L63 98 L60 95 Z" fill="#5b3a6b" />
      <rect x="53" y="82" width="14" height="13" rx="3" fill="#ecc7ad" />
      <Face mood={mood} skin="#ecc7ad" cheek="#d27f6e" />
      {/* slicked-back dark hair with a side parting */}
      <path d="M42 64 Q38 40 60 39 Q82 40 78 62 Q76 50 64 48 L58 46 Q48 50 42 64 Z" fill="#2a1d17" />
      <path d="M58 46 Q66 44 76 52" stroke="#4a372c" strokeWidth="1.2" fill="none" />
      {/* smug half-smile */}
      {mood !== 'worried' && <path d="M62 80 Q66 79 68 76" stroke="#1b1918" strokeWidth="1.4" fill="none" strokeLinecap="round" />}
    </>
  );
}

function Celine({ mood }: { mood: Mood }) {
  return (
    <>
      {/* black turtleneck, gold earrings */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#141313" />
      <rect x="51" y="84" width="18" height="16" rx="5" fill="#141313" />
      <rect x="54" y="80" width="12" height="8" rx="3" fill="#f2d3bd" />
      {/* blonde chignon */}
      <circle cx="60" cy="38" r="9" fill="#d9b46a" />
      <path d="M41 66 Q38 42 60 42 Q82 42 79 66 Q74 52 60 51 Q46 52 41 66 Z" fill="#d9b46a" />
      <Face mood={mood} skin="#f2d3bd" cheek="#d98a7a" />
      <path d="M41 66 Q42 52 60 50 Q50 54 46 64 Z" fill="#c9a45a" />
      <circle cx="43" cy="74" r="2.6" fill="#c58a1a" />
      <circle cx="77" cy="74" r="2.6" fill="#c58a1a" />
      {/* red lip */}
      <path d={mood === 'happy' ? 'M55 79 Q60 84 65 79 Q60 81 55 79 Z' : 'M55 80 Q60 82.5 65 80 Q60 81.5 55 80 Z'} fill="#a3321f" />
    </>
  );
}

function Saoirse({ mood }: { mood: Mood }) {
  return (
    <>
      {/* cream shirt under a tan leather apron */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#efe7da" />
      <path d="M40 104 Q60 98 80 104 L84 120 L36 120 Z" fill="#a8683d" />
      <path d="M44 100 L48 94 M76 100 L72 94" stroke="#7a4626" strokeWidth="2" />
      <rect x="53" y="82" width="14" height="13" rx="3" fill="#d9a78a" />
      {/* long dark braid over the shoulder */}
      <path d="M74 60 Q86 76 80 100" stroke="#3a2418" strokeWidth="8" fill="none" strokeLinecap="round" />
      <Face mood={mood} skin="#d9a78a" cheek="#b8645a" />
      <path d="M41 66 Q38 42 60 42 Q82 42 79 64 Q72 50 58 51 Q46 54 41 66 Z" fill="#3a2418" />
      {[84, 90, 96].map((y) => (
        <path key={y} d={`M77 ${y} l5 -2`} stroke="#5a3826" strokeWidth="1.2" />
      ))}
    </>
  );
}

function Kenji({ mood }: { mood: Mood }) {
  return (
    <>
      {/* slate knit cardigan over a white tee */}
      <path d="M22 120 Q24 96 60 94 Q96 96 98 120 Z" fill="#3f5f73" />
      <path d="M53 95 L60 120 L67 95 Z" fill="#f4f1ea" />
      {[102, 110, 118].map((y) => (
        <circle key={y} cx="70" cy={y} r="1.6" fill="#c58a1a" />
      ))}
      <rect x="53" y="82" width="14" height="13" rx="3" fill="#e8c3a2" />
      <Face mood={mood} skin="#e8c3a2" cheek="#cf8a72" />
      {/* black quiff, short sides */}
      <path d="M43 62 Q42 46 52 42 Q62 34 74 40 Q80 46 77 60 Q74 50 64 48 Q52 48 43 62 Z" fill="#121212" />
      <path d="M52 42 Q60 30 72 38" stroke="#121212" strokeWidth="5" fill="none" strokeLinecap="round" />
    </>
  );
}

const DRAW: Partial<Record<CharacterId, (p: { mood: Mood }) => JSX.Element>> = {
  margaux: Margaux,
  theo: Theo,
  idris: Idris,
  ferriter: Ferriter,
  aoife: Aoife,
  rupert: Rupert,
  celine: Celine,
  saoirse: Saoirse,
  kenji: Kenji,
};

export function Portrait({ who, mood = 'neutral', size = 72 }: { who: CharacterId; mood?: Mood; size?: number }) {
  const Draw = DRAW[who];
  const colour = CAST_COLOUR[who];
  return (
    <svg className="portrait" width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <defs>
        <clipPath id={`clip-${who}`}>
          <circle cx="60" cy="60" r="58" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" fill="#f4eee5" />
      <circle cx="60" cy="60" r="58" fill={colour} opacity=".16" />
      <g clipPath={`url(#clip-${who})`}>{Draw ? <Draw mood={mood} /> : null}</g>
      <circle cx="60" cy="60" r="58" fill="none" stroke={colour} strokeWidth="2.5" />
    </svg>
  );
}
