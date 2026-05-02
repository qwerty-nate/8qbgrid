//Searching a semantic space in the shape of a octahedron (diamond).
//Search is done one triangle at a time.
//Each triangle is rotated horizontally andvertically to tranverse the space.
//This search locates each instance of a letter from 300 randomly sorted letters.

import { useState, useRef, useMemo } from “react”;

const C30 = Math.sqrt(3) / 2;
const R3  = Math.sqrt(3);

const OV = [[ 1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const OE = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]];

const iso    = (x,y,z) => [(x-z)*C30, (x+z)*0.5-y];
const isoV   = vi => iso(…OV[vi]);
const inHex  = (u,v) => Math.abs(u)<=C30+1e-9 && Math.abs(u+R3*v)<=R3+1e-9 && Math.abs(u-R3*v)<=R3+1e-9;
const depLay = d => d<-1/3?0:d<1/3?1:2;
const cellID = (ti,L) => ti*3+L;

function buildGrid(n) {
const s=1/n, h=s*C30, g=(p,q)=>[p*s+q*s*0.5,q*h];
const map=new Map(), tris=[];
for (let p=-(2*n+2);p<=2*n+2;p++) for (let q=-(2*n+2);q<=2*n+2;q++) {
const [u0,v0]=g(p,q),[u1,v1]=g(p+1,q),[u2,v2]=g(p,q+1);
const cu=(u0+u1+u2)/3,cv=(v0+v1+v2)/3;
if(inHex(cu,cv)){map.set(`u_${p}_${q}`,tris.length);tris.push({idx:tris.length,p,q,up:true,cu,cv,verts:[[u0,v0],[u1,v1],[u2,v2]],adj2d:[]});}
const [d0u,d0v]=g(p+1,q),[d1u,d1v]=g(p+1,q+1),[d2u,d2v]=g(p,q+1);
const dcu=(d0u+d1u+d2u)/3,dcv=(d0v+d1v+d2v)/3;
if(inHex(dcu,dcv)){map.set(`d_${p}_${q}`,tris.length);tris.push({idx:tris.length,p,q,up:false,cu:dcu,cv:dcv,verts:[[d0u,d0v],[d1u,d1v],[d2u,d2v]],adj2d:[]});}
}
for (const t of tris) {
if(t.up) [[t.p,t.q],[t.p,t.q-1],[t.p-1,t.q]].forEach(([np,nq])=>{const k=map.get(`d_${np}_${nq}`);if(k!==undefined)t.adj2d.push(k);});
else [[t.p,t.q],[t.p+1,t.q],[t.p,t.q+1]].forEach(([np,nq])=>{const k=map.get(`u_${np}_${nq}`);if(k!==undefined)t.adj2d.push(k);});
}
return tris;
}

function buildCells(tris) {
const N=tris.length, adj=Array.from({length:N*3},()=>[]);
for (let ti=0;ti<N;ti++) for (let L=0;L<3;L++) {
const cid=cellID(ti,L);
tris[ti].adj2d.forEach(nti=>adj[cid].push(cellID(nti,L)));
if(L>0) adj[cid].push(cellID(ti,L-1));
if(L<2) adj[cid].push(cellID(ti,L+1));
}
return adj;
}

function bfsFrom(start,adj){const order=[],vis=new Set([start]),q=[start];while(q.length){const c=q.shift();order.push(c);adj[c].forEach(nb=>{if(!vis.has(nb)){vis.add(nb);q.push(nb);}});}return order;}
function ptInTri(u,v,[[ax,ay],[bx,by],[cx,cy]]){const d1=(u-cx)*(ay-cy)-(ax-cx)*(v-cy),d2=(u-ax)*(by-ay)-(bx-ax)*(v-ay),d3=(u-bx)*(cy-by)-(cx-bx)*(v-by);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));}
function assignTri(u,v,tris){for(const t of tris)if(ptInTri(u,v,t.verts))return t.idx;let best=0,bd=Infinity;tris.forEach(t=>{const d=(u-t.cu)**2+(v-t.cv)**2;if(d<bd){bd=d;best=t.idx;}});return best;}
function rndOcta(){for(;;){const x=Math.random()*2-1,y=Math.random()*2-1,z=Math.random()*2-1;if(Math.abs(x)+Math.abs(y)+Math.abs(z)<=1)return[x,y,z];}}

function makePoints(tris) {
const ABC=‘ABCDEFGHIJKLMNOPQRSTUVWXYZ’;
return Array.from({length:300},(_,i)=>{
const [x,y,z]=rndOcta(),[u,v]=iso(x,y,z),d=x+y+z,L=depLay(d),ti=assignTri(u,v,tris);
return{id:i,letter:ABC[Math.floor(Math.random()*26)],ti,layer:L,cid:cellID(ti,L),u,v,dep:d};
}).sort((a,b)=>a.dep-b.dep);
}

function cellColor(tri,layer,active=false){
const hue=((Math.atan2(tri.cv,tri.cu)/Math.PI*180)+360)%360,dist=Math.hypot(tri.cu,tri.cv),hShift=(layer-1)*28,L=active?65+dist*8:44+dist*14,S=active?85:70;
return`hsl(${((hue+hShift+360)%360).toFixed(0)},${S}%,${L.toFixed(0)}%)`;
}

const eDep=([a,b])=>(OV[a][0]+OV[a][1]+OV[a][2]+OV[b][0]+OV[b][1]+OV[b][2])/2;
const EDGE_ORD=OE.map((_,i)=>i).sort((a,b)=>eDep(OE[a])-eDep(OE[b]));
const layerDY=L=>(1-L)*9;

export default function App() {
const W=460, H=460, cx=W/2, cy=H/2+10, S=138;

const tris  = useMemo(()=>buildGrid(3),[]);
const cAdj  = useMemo(()=>buildCells(tris),[tris]);

const [pts,     setPts]    = useState(()=>makePoints(tris));
const [target,  setTarget] = useState(null);
const [step,    setStep]   = useState(0);
const [order,   setOrder]  = useState([]);
const [doneAt,  setDoneAt] = useState(null);
const [running, setRunning]= useState(false);
const tid = useRef(null);

const search = l => {
clearInterval(tid.current);
setTarget(l); setStep(0); setDoneAt(null); setRunning(false);
const targets = pts.filter(p=>p.letter===l);
if (!targets.length) { setOrder(bfsFrom(0,cAdj)); return; }
const cc={};
targets.forEach(p=>{cc[p.cid]=(cc[p.cid]||0)+1;});
const start=parseInt(Object.entries(cc).sort(([,a],[,b])=>b-a)[0][0]);
const ord=bfsFrom(start,cAdj);
setOrder(ord); setRunning(true);
let st=0, done=false;
tid.current=setInterval(()=>{
st++; setStep(st);
if (!done) {
const vis=new Set(ord.slice(0,st));
if (targets.every(p=>vis.has(p.cid))) { done=true; setDoneAt(st); clearInterval(tid.current); setRunning(false); return; }
}
if (st>=ord.length) { clearInterval(tid.current); setRunning(false); }
},80);
};

const regen = () => {
clearInterval(tid.current);
setPts(makePoints(tris));
setTarget(null); setStep(0); setOrder([]); setDoneAt(null); setRunning(false);
};

const lc={};  pts.forEach(p=>{lc[p.letter]=(lc[p.letter]||0)+1;});
const visited  = new Set(order.slice(0,step));
const tgtPts   = target ? pts.filter(p=>p.letter===target) : [];
const foundIds = new Set(tgtPts.filter(p=>visited.has(p.cid)).map(p=>p.id));
const curCid   = order[step-1];
const trisByIso= […tris].sort((a,b)=>(a.p+a.q)-(b.p+b.q));
const dispStep = doneAt ?? step;

return (
<div style={{
fontFamily:”‘DM Mono’,‘IBM Plex Mono’,monospace”,
background:’#fafaf8’, minHeight:‘100vh’,
display:‘flex’, flexDirection:‘column’, alignItems:‘center’,
justifyContent:‘center’, padding:‘20px’, gap:‘14px’,
}}>

```
  <svg width={W} height={H} style={{borderRadius:'10px',background:'#fafaf8',border:'1px solid #e0dbd0',boxShadow:'0 2px 16px rgba(0,0,0,.06)'}}>

    {[0,1,2].map(L=>(
      <g key={L}>{trisByIso.map(tri=>{
        const cid=cellID(tri.idx,L),isV=visited.has(cid),isC=cid===curCid;
        const c=cellColor(tri,L,isC),dy=layerDY(L);
        const pp=tri.verts.map(([u,v])=>[cx+u*S,cy+v*S+dy]);
        const d=`M${pp[0]}L${pp[1]}L${pp[2]}Z`;
        return <g key={cid}>
          <path d={d} fill={isV?c:(tri.up?'#f5f3ee':'#edeae3')} fillOpacity={isV?(isC?.52:.26):1}
            stroke={isV?c:'#c8c0b0'} strokeWidth={isC?1.6:.4} strokeOpacity={isV?.72:.4}/>
          {isC&&<path d={d} fill="none" stroke={c} strokeWidth={6} strokeOpacity={.16}/>}
        </g>;
      })}</g>
    ))}

    {EDGE_ORD.map(ei=>{
      const [a,b]=OE[ei],[ua,va]=isoV(a),[ub,vb]=isoV(b);
      return <line key={ei} x1={cx+ua*S} y1={cy+va*S} x2={cx+ub*S} y2={cy+vb*S}
        stroke="#8a7a60" strokeWidth="1" strokeOpacity={0.12+((eDep(OE[ei])+1)/2)*.32}/>;
    })}

    {OV.map((v,vi)=>{
      const [u,vv]=isoV(vi);
      return <circle key={vi} cx={cx+u*S} cy={cy+vv*S} r={3}
        fill="#fafaf8" stroke="#8a7a60" strokeWidth=".9" opacity={0.2+((v[0]+v[1]+v[2]+1)/2)*.45}/>;
    })}

    {pts.map(p=>{
      const isTgt=!!target&&p.letter===target,isFound=foundIds.has(p.id),isVis=visited.has(p.cid),dim=!!target&&!isTgt&&!isVis;
      const norm=(p.dep+1)/2,r=1.8+norm*1.8,op=0.2+norm*.52,tc=cellColor(tris[p.ti],p.layer),dy=layerDY(p.layer);
      const sx=cx+p.u*S, sy=cy+p.v*S+dy;
      let fill,stroke,rr,rop,tf,ts;
      if(isFound){fill='#d4f0e4';stroke='#059669';rr=8.5;rop=1;tf='#064e3b';ts=9;}
      else if(isTgt){fill='#fef3c7';stroke='#d97706';rr=8.5;rop=1;tf='#78350f';ts=9;}
      else if(isVis){fill='#fff';stroke=tc;rr=r+.4;rop=Math.min(op*1.4,.88);tf=tc;ts=6;}
      else{fill='#fff';stroke='#c8c0b0';rr=r;rop=dim?op*.07:op;tf='#b0a890';ts=6;}
      return <g key={p.id}>
        {isTgt&&!isFound&&<circle cx={sx} cy={sy} r={13} fill="none" stroke="#d97706" strokeWidth=".5" strokeOpacity=".25" strokeDasharray="3,3"/>}
        <circle cx={sx} cy={sy} r={rr} fill={fill} stroke={stroke} strokeWidth={isTgt||isFound?1.2:.3} opacity={rop}/>
        <text x={sx} y={sy+ts*.38} textAnchor="middle" fontSize={ts} fontWeight={isTgt||isFound?'600':'400'} fill={tf} opacity={rop} fontFamily="inherit">{p.letter}</text>
      </g>;
    })}
  </svg>

  {/* Letter buttons */}
  <div style={{display:'flex',flexWrap:'wrap',gap:'4px',justifyContent:'center',maxWidth:W}}>
    {Object.entries(lc).sort().map(([l,cnt])=>{
      const act=target===l;
      return <button key={l} onClick={()=>!running&&search(l)} style={{
        background:act?'#1a1a18':'transparent',color:act?'#fafaf8':'#6b5e4a',
        border:`1px solid ${act?'#1a1a18':'#c8c0b0'}`,padding:'3px 9px',borderRadius:'3px',
        cursor:running?'default':'pointer',fontSize:'11px',fontFamily:'inherit',outline:'none',transition:'all .15s',
      }}>{l}<span style={{opacity:.38,fontSize:'8px',marginLeft:'3px'}}>×{cnt}</span></button>;
    })}
  </div>

  {/* Status */}
  <div style={{width:W,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'#fafaf8',border:'1px solid #e0dbd0',borderRadius:'6px',minHeight:'44px'}}>
    <div style={{fontSize:'12px',color:'#6b5e4a'}}>
      {doneAt!=null
        ? <span style={{color:'#065f46'}}>✓ all {tgtPts.length} found in <strong>{doneAt}</strong> steps</span>
        : running ? <span>scanning… {foundIds.size} / {tgtPts.length} found</span>
        : target   ? <span style={{color:'#9a8c78'}}>searching <strong style={{color:'#1a1a18'}}>{target}</strong> — {tgtPts.length} pts</span>
        : <span style={{color:'#b0a890'}}>select a letter to begin</span>
      }
    </div>
    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
      {running && (
        <button onClick={()=>{clearInterval(tid.current);setRunning(false);}} style={{
          background:'transparent',color:'#6b5e4a',border:'1px solid #c8c0b0',
          padding:'3px 10px',borderRadius:'3px',cursor:'pointer',fontSize:'10px',fontFamily:'inherit',
        }}>■ stop</button>
      )}
      <button onClick={regen} style={{
        background:'transparent',color:'#9a8c78',border:'1px solid #c8c0b0',
        padding:'3px 10px',borderRadius:'3px',cursor:'pointer',fontSize:'10px',fontFamily:'inherit',
      }}>↺ new</button>
      {target && (
        <span style={{fontSize:'10px',color:'#b0a890'}}>{dispStep} / {tris.length*3} cells</span>
      )}
    </div>
  </div>
</div>
```

);
}