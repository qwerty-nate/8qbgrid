//Searching a semantic soace in the shape of a octahedron (diamond).
//Search is done one triangular face at a time.
//This rest locates each instance of a letter.


import { useState, useRef } from “react”;

// ── OCTAHEDRON STRUCTURE ──────────────────────────────────────────────────────
const V = [
[ 1, 0, 0], [-1, 0, 0],  // 0:+X  1:-X
[ 0, 1, 0], [ 0,-1, 0],  // 2:+Y  3:-Y
[ 0, 0, 1], [ 0, 0,-1],  // 4:+Z  5:-Z
];
// 8 triangular surface faces (one per octant)
const FACES = [
[0,2,4],[0,2,5],[0,3,4],[0,3,5],
[1,2,4],[1,2,5],[1,3,4],[1,3,5],
];
// 12 edges
const EDGES = [
[0,2],[0,3],[0,4],[0,5],
[1,2],[1,3],[1,4],[1,5],
[2,4],[2,5],[3,4],[3,5],
];
// Adjacency between the 8 tetrahedral volume regions
const ADJ = [
[1,2,4],[0,3,5],[0,3,6],[1,2,7],
[0,5,6],[1,4,7],[2,4,7],[3,5,6],
];
const COLORS = [
‘#ff5252’,’#ff9100’,’#ffe500’,’#69ff47’,
‘#18ffff’,’#448aff’,’#df60ff’,’#ff4db4’,
];
const REGION_NAMES = [
‘+X+Y+Z’,’+X+Y-Z’,’+X-Y+Z’,’+X-Y-Z’,
‘-X+Y+Z’,’-X+Y-Z’,’-X-Y+Z’,’-X-Y-Z’,
];

// ── ISOMETRIC PROJECTION ──────────────────────────────────────────────────────
const C30 = Math.sqrt(3) / 2;
const iso = (x, y, z, cx, cy, s) => [
cx + (x - z) * C30 * s,
cy + (x + z) * 0.5 * s - y * s,
];
// Depth for isometric view (viewer direction ~(1,1,1))
const isoDepth = (x, y, z) => x + y + z;

// ── REGION ASSIGNMENT ─────────────────────────────────────────────────────────
// Maps octant of (x,y,z) to region index 0-7, matching FACES above
const regionOf = (x, y, z) =>
(x < 0 ? 4 : 0) + (y < 0 ? 2 : 0) + (z < 0 ? 1 : 0);

// ── UNIFORM SAMPLE INSIDE OCTAHEDRON (rejection) ─────────────────────────────
// Vol(octahedron)/Vol(unit cube) ≈ 1/6, ~6 tries per point on average
function randInOcta() {
for (;;) {
const x = Math.random() * 2 - 1;
const y = Math.random() * 2 - 1;
const z = Math.random() * 2 - 1;
if (Math.abs(x) + Math.abs(y) + Math.abs(z) <= 1) return [x, y, z];
}
}

// ── BFS OVER REGIONS ─────────────────────────────────────────────────────────
function bfsFrom(start) {
const order = [], vis = new Set([start]), q = [start];
while (q.length) {
const f = q.shift(); order.push(f);
ADJ[f].forEach(n => { if (!vis.has(n)) { vis.add(n); q.push(n); } });
}
return order;
}

// ── POINT GENERATION ─────────────────────────────────────────────────────────
function makePoints(cx, cy, s) {
const ABC = ‘ABCDEFGHIJKLMNOPQRSTUVWXYZ’;
return Array.from({ length: 300 }, (_, i) => {
const [x, y, z] = randInOcta();
const [sx, sy] = iso(x, y, z, cx, cy, s);
return {
id: i,
letter: ABC[Math.floor(Math.random() * 26)],
ri: regionOf(x, y, z),
x, y, z, sx, sy,
dep: isoDepth(x, y, z),   // -1..1 for octahedron interior
};
}).sort((a, b) => a.dep - b.dep); // back-to-front render order
}

// ── PRECOMPUTE DRAW ORDERS ────────────────────────────────────────────────────
const faceDepth = fi =>
FACES[fi].reduce((d, vi) => d + V[vi][0] + V[vi][1] + V[vi][2], 0) / 3;
const FACE_DRAW = [0,1,2,3,4,5,6,7].sort((a, b) => faceDepth(a) - faceDepth(b));

const edgeDep = ([a, b]) =>
(V[a][0]+V[a][1]+V[a][2] + V[b][0]+V[b][1]+V[b][2]) / 2;
const EDGE_DRAW = EDGES.map((e, i) => i).sort((a, b) => edgeDep(EDGES[a]) - edgeDep(EDGES[b]));

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function App() {
const W = 460, H = 440, cx = W / 2, cy = H / 2 + 12, S = 92;

const [pts, setPts]         = useState(() => makePoints(cx, cy, S));
const [target, setTarget]   = useState(null);
const [step, setStep]       = useState(0);
const [order, setOrder]     = useState([]);
const [doneAt, setDoneAt]   = useState(null);
const [running, setRunning] = useState(false);
const tid = useRef(null);

const search = (l) => {
clearInterval(tid.current);
setTarget(l); setStep(0); setDoneAt(null); setRunning(false);

```
const targets = pts.filter(p => p.letter === l);
if (!targets.length) { setOrder(bfsFrom(0)); return; }

// Start BFS from the region densest with the target letter
const fc = {};
targets.forEach(p => { fc[p.ri] = (fc[p.ri] || 0) + 1; });
const start = parseInt(Object.entries(fc).sort(([,a],[,b]) => b - a)[0][0]);
const ord = bfsFrom(start);
setOrder(ord);
setRunning(true);

let st = 0, done = false;
tid.current = setInterval(() => {
  st++; setStep(st);
  if (!done) {
    const vis = new Set(ord.slice(0, st));
    if (targets.every(p => vis.has(p.ri))) {
      done = true; setDoneAt(st);
      clearInterval(tid.current); setRunning(false);
      return;
    }
  }
  if (st >= ord.length) { clearInterval(tid.current); setRunning(false); }
}, 620);
```

};

const regen = () => {
clearInterval(tid.current);
setPts(makePoints(cx, cy, S));
setTarget(null); setStep(0); setOrder([]); setDoneAt(null); setRunning(false);
};

// ── Derived state ────────────────────────────────────────────────────────────
const lc = {};
pts.forEach(p => { lc[p.letter] = (lc[p.letter] || 0) + 1; });
const visited    = new Set(order.slice(0, step));
const tgtPts     = target ? pts.filter(p => p.letter === target) : [];
const foundIds   = new Set(tgtPts.filter(p => visited.has(p.ri)).map(p => p.id));
const curRegion  = order[step - 1];
const dispStep   = doneAt ?? step;

return (
<div style={{
fontFamily: “‘IBM Plex Mono’, ‘Courier New’, monospace”,
background: ‘#03080e’,
minHeight: ‘100vh’,
color: ‘#c8d8e8’,
padding: ‘12px’,
maxWidth: ‘490px’,
margin: ‘0 auto’,
userSelect: ‘none’,
}}>

```
  {/* ── Header ── */}
  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
    <div style={{ color: '#00d4ff', fontSize: '11px', letterSpacing: '0.2em' }}>
      ◆ OCTAHEDRON VOLUME SEARCH
    </div>
    <div style={{ color: '#091828', fontSize: '9px', marginTop: '2px', letterSpacing: '0.08em' }}>
      300 LETTERS · 8 TETRAHEDRAL REGIONS · FULL 3D VOLUME · BFS
    </div>
  </div>

  {/* ── SVG ── */}
  <svg width={W} height={H} style={{
    display: 'block', margin: '0 auto 10px',
    borderRadius: '10px', background: '#03080e',
    border: '1px solid #08192a',
  }}>

    {/* Face fills — visited regions glow */}
    {FACE_DRAW.map(fi => {
      const face = FACES[fi];
      const pp = face.map(vi => iso(...V[vi], cx, cy, S));
      const d = `M${pp[0]}L${pp[1]}L${pp[2]}Z`;
      const isVis = visited.has(fi);
      const isCur = fi === curRegion;
      const c = COLORS[fi];
      const dep = faceDepth(fi);
      const bgAlpha = 0.03 + ((dep + 1) / 2) * 0.05;
      const fx = (pp[0][0]+pp[1][0]+pp[2][0]) / 3;
      const fy = (pp[0][1]+pp[1][1]+pp[2][1]) / 3;
      return (
        <g key={fi}>
          <path d={d}
            fill={isVis ? c : '#040e1c'}
            fillOpacity={isVis ? (isCur ? 0.25 : 0.12) : bgAlpha}
            stroke={isVis ? c : 'none'}
            strokeWidth={isCur ? 2 : 1}
            strokeOpacity={isVis ? 0.5 : 0}
          />
          {/* Second pass: pulse ring for current face */}
          {isCur && (
            <path d={d} fill="none" stroke={c} strokeWidth={5} strokeOpacity={0.15} />
          )}
          {isVis && (
            <text x={fx} y={fy + 3} textAnchor="middle"
              fontSize="7.5" fill={c} opacity="0.55" fontFamily="inherit">
              R{fi}
            </text>
          )}
        </g>
      );
    })}

    {/* Wireframe edges — depth-faded */}
    {EDGE_DRAW.map(ei => {
      const [a, b] = EDGES[ei];
      const pa = iso(...V[a], cx, cy, S);
      const pb = iso(...V[b], cx, cy, S);
      const dep = edgeDep(EDGES[ei]);
      const opacity = 0.08 + ((dep + 1) / 2) * 0.22;
      return (
        <line key={ei}
          x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]}
          stroke="#0e4a8a" strokeWidth="0.8" strokeOpacity={opacity}
        />
      );
    })}

    {/* Vertex dots */}
    {V.map((v, vi) => {
      const [px, py] = iso(...v, cx, cy, S);
      const dep = isoDepth(...v);
      const op = 0.15 + ((dep + 1) / 2) * 0.4;
      return <circle key={vi} cx={px} cy={py} r={2.8}
        fill="#050f1c" stroke="#0e3a6a" strokeWidth="0.8" opacity={op} />;
    })}

    {/* ── 300 letter points, depth-sorted (back-to-front) ── */}
    {pts.map(p => {
      const isTgt   = !!target && p.letter === target;
      const isFound = foundIds.has(p.id);
      const isVisReg = visited.has(p.ri);
      const isDim   = !!target && !isTgt && !isVisReg;

      // Depth-based size/opacity gives parallax 3D feel
      const norm     = (p.dep + 1) / 2;       // 0..1
      const baseR    = 1.8 + norm * 1.8;       // 1.8..3.6
      const baseOp   = 0.18 + norm * 0.55;     // 0.18..0.73
      const rc = COLORS[p.ri];

      let fill, stroke, r, op, textFill, textSize;

      if (isFound) {
        fill = '#064430'; stroke = '#10b981'; r = 8.5; op = 1;
        textFill = '#34d399'; textSize = 9;
      } else if (isTgt) {
        fill = '#6b3300'; stroke = '#f59e0b'; r = 8.5; op = 1;
        textFill = '#fcd34d'; textSize = 9;
      } else if (isVisReg) {
        fill = rc + '15'; stroke = rc; r = baseR + 0.4; op = Math.min(baseOp * 1.4, 0.85);
        textFill = rc; textSize = 6;
      } else {
        fill = '#040c18'; stroke = '#0d3060'; r = baseR; op = isDim ? baseOp * 0.12 : baseOp;
        textFill = '#133060'; textSize = 6;
      }

      return (
        <g key={p.id}>
          {isTgt && !isFound && (
            <circle cx={p.sx} cy={p.sy} r={14}
              fill="none" stroke="#f59e0b"
              strokeWidth="0.5" strokeOpacity="0.22" strokeDasharray="4,3" />
          )}
          <circle cx={p.sx} cy={p.sy} r={r}
            fill={fill} stroke={stroke}
            strokeWidth={isTgt || isFound ? 1.3 : 0.3}
            opacity={op}
          />
          <text
            x={p.sx} y={p.sy + textSize * 0.38}
            textAnchor="middle"
            fontSize={textSize}
            fontWeight={isTgt || isFound ? 'bold' : 'normal'}
            fill={textFill}
            opacity={op}
            fontFamily="inherit"
          >
            {p.letter}
          </text>
        </g>
      );
    })}
  </svg>

  {/* ── Letter buttons ── */}
  <div style={{
    display: 'flex', flexWrap: 'wrap', gap: '3px',
    justifyContent: 'center', marginBottom: '10px',
  }}>
    {Object.entries(lc).sort().map(([l, cnt]) => {
      const active = target === l;
      return (
        <button key={l}
          onClick={() => !running && search(l)}
          style={{
            background: active ? '#0b2237' : 'transparent',
            color: active ? '#00d4ff' : '#1b3850',
            border: `1px solid ${active ? '#005577' : '#08192a'}`,
            padding: '3px 8px', borderRadius: '3px',
            cursor: running ? 'default' : 'pointer',
            fontSize: '11px', fontFamily: 'inherit',
            transition: 'all 0.15s', outline: 'none',
          }}>
          {l}
          <span style={{ opacity: 0.38, fontSize: '8px', marginLeft: '2px' }}>×{cnt}</span>
        </button>
      );
    })}
  </div>

  {/* ── Status panel ── */}
  <div style={{
    background: '#03080e',
    border: '1px solid #08192a',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '12px',
    minHeight: '52px',
  }}>
    {target ? (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#2a4d6a' }}>volume search </span>
            <span style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              {target}
            </span>
            <span style={{ color: '#132030', fontSize: '10px', marginLeft: '6px' }}>
              ({tgtPts.length} pts)
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#132030', fontSize: '10px' }}>traversals </span>
            <span style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>
              {dispStep}
            </span>
            <span style={{ color: '#132030', fontSize: '10px' }}> / 8</span>
          </div>
        </div>

        {running && curRegion !== undefined && (
          <div style={{ color: '#1b3850', fontSize: '10px', marginTop: '5px' }}>
            scanning R{curRegion} [{REGION_NAMES[curRegion]}] ·{' '}
            found {foundIds.size}/{tgtPts.length}
          </div>
        )}
        {doneAt != null && (
          <div style={{ color: '#10b981', fontSize: '11px', marginTop: '5px' }}>
            ✓ all {tgtPts.length} found after{' '}
            <span style={{ fontWeight: 'bold' }}>{doneAt}</span>{' '}
            region traversal{doneAt !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    ) : (
      <div style={{ color: '#081828', textAlign: 'center', paddingTop: '6px', letterSpacing: '0.04em' }}>
        select a letter above → BFS through 8 volume regions
      </div>
    )}
  </div>

  {/* ── BFS path trace ── */}
  {order.length > 0 && (
    <div style={{
      marginTop: '8px', fontSize: '10px',
      display: 'flex', flexWrap: 'wrap',
      gap: '0px', alignItems: 'center',
    }}>
      <span style={{ color: '#1b3850', marginRight: '5px' }}>path:</span>
      {order.map((ri, i) => (
        <span key={i}>
          <span style={{
            color: i < step ? COLORS[ri] : '#081828',
            fontWeight: i === step - 1 ? 'bold' : 'normal',
          }}>R{ri}</span>
          {i < order.length - 1 && (
            <span style={{ color: '#081828' }}>›</span>
          )}
        </span>
      ))}
      {doneAt && <span style={{ color: '#064430', marginLeft: '5px' }}>⬡</span>}
    </div>
  )}

  {/* ── Footer ── */}
  <div style={{
    textAlign: 'center', marginTop: '12px',
    display: 'flex', justifyContent: 'center', gap: '8px',
  }}>
    <button onClick={regen} style={{
      background: 'transparent', color: '#1b3850',
      border: '1px solid #08192a', padding: '4px 14px',
      borderRadius: '4px', cursor: 'pointer',
      fontSize: '10px', fontFamily: 'inherit', letterSpacing: '0.1em',
    }}>
      ↺ REGENERATE
    </button>
    {running && (
      <button onClick={() => { clearInterval(tid.current); setRunning(false); }}
        style={{
          background: 'transparent', color: '#2a4d6a',
          border: '1px solid #08192a', padding: '4px 14px',
          borderRadius: '4px', cursor: 'pointer',
          fontSize: '10px', fontFamily: 'inherit', letterSpacing: '0.1em',
        }}>
        ■ STOP
      </button>
    )}
  </div>
</div>
```

);
}