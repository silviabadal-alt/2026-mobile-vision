// ring.jsx — temporal navigation ring
// • Rotate around the ring to browse events in time
// • Quick tap on the ring snaps back to Now
// • Press & hold opens AI dictation
// The handle interpolates smoothly between event positions.

const { useState, useEffect, useRef, useCallback } = React;

const RING_INK = '#1a1a18';
const RING_TRACK = 'rgba(26,26,24,0.10)';

function RingControl({
  events, nowIdx, browseIdx, setBrowseIdx,
  onTapNow, onHoldAI, onAIPressing,
  aiActive=false,
}) {
  const SIZE = 168;
  const R = 72;           // ring radius
  const HANDLE_R = 9;     // handle dot radius
  const CENTER_R = 28;    // center orb radius (interactive zone)
  const cx = SIZE/2, cy = SIZE/2;

  const N = events.length;
  const SPAN = 270;       // total arc angle covered by events
  const startAngle = -90 - SPAN/2;
  const angleFor = (frac) => startAngle + (frac / (N-1)) * SPAN;

  // Continuous "pos" (fractional browse index) for fluid handle motion
  const [pos, setPos] = useState(browseIdx);
  const posRef = useRef(browseIdx);
  const writePos = (p) => { posRef.current = p; setPos(p); };

  // animate to integer index when external browseIdx changes
  // (but never fight an active drag — the user is in control)
  const animRef = useRef(null);
  useEffect(() => {
    if (dragRef.current.active) return;
    cancelAnimationFrame(animRef.current);
    const from = posRef.current, to = browseIdx;
    if (Math.abs(from - to) < 0.001) return;
    const t0 = performance.now();
    const dur = Math.min(520, 240 + Math.abs(to - from) * 80);
    const ease = (t) => 1 - Math.pow(1-t, 3);
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const p = from + (to - from) * ease(k);
      writePos(p);
      if (k < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [browseIdx]);

  // Pointer state
  const dragRef = useRef({
    active:false, mode:null, startAngle:0, startPos:0, moved:false,
    t0:0, rect:null, pid:null,
  });
  const holdTimer = useRef(null);

  const pointerAngle = (e, rect) => {
    const x = e.clientX - (rect.left + cx);
    const y = e.clientY - (rect.top + cy);
    return Math.atan2(y, x) * 180 / Math.PI;
  };
  const pointerDistance = (e, rect) => {
    const x = e.clientX - (rect.left + cx);
    const y = e.clientY - (rect.top + cy);
    return Math.sqrt(x*x + y*y);
  };

  const onPD = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const dist = pointerDistance(e, rect);
    if (dist > R + 22) return; // outside

    const a = pointerAngle(e, rect);
    dragRef.current = {
      active:true,
      mode: dist < CENTER_R + 6 ? 'center' : 'ring',
      startAngle:a, startPos: posRef.current,
      moved:false, t0: Date.now(), rect, pid: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);

    // Hold timer — anywhere on the ring/center
    holdTimer.current = setTimeout(() => {
      if (!dragRef.current.active || dragRef.current.moved) return;
      dragRef.current.mode = 'holding';
      onHoldAI?.();
    }, 480);
  };

  const onPM = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const rect = d.rect;
    const a = pointerAngle(e, rect);
    let delta = a - d.startAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    if (Math.abs(delta) > 1.4 && d.mode !== 'holding') {
      d.moved = true;
      clearTimeout(holdTimer.current);
      const deg2pos = (N - 1) / SPAN;
      let next = d.startPos + delta * deg2pos;
      next = Math.max(0, Math.min(N-1, next));
      const prevRound = Math.round(posRef.current);
      writePos(next);
      const newRound = Math.round(next);
      // emit live scrub so the rest of the UI tracks the ring
      if (newRound !== prevRound) setBrowseIdx(newRound);
    }
  };

  const onPU = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    clearTimeout(holdTimer.current);
    const dt = Date.now() - d.t0;
    const moved = d.moved;
    const wasHolding = d.mode === 'holding';
    d.active = false;

    if (wasHolding) {
      // release after hold — no snap behaviour change
      return;
    }
    if (!moved && dt < 360) {
      // quick tap anywhere on ring → Now
      onTapNow?.();
      return;
    }
    // snap to nearest event
    const snapped = Math.max(0, Math.min(N-1, Math.round(posRef.current)));
    setBrowseIdx(snapped);
  };

  // ── geometry ──
  const ang = angleFor(pos) * Math.PI/180;
  const handleX = cx + Math.cos(ang) * R;
  const handleY = cy + Math.sin(ang) * R;

  // sweep arc from "now" to current handle
  const nowAngDeg = angleFor(nowIdx);
  const curAngDeg = angleFor(pos);
  const sweepArc = buildArc(cx, cy, R, nowAngDeg, curAngDeg);

  return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div
        data-ring
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        onPointerCancel={onPU}
        style={{
          width: SIZE, height: SIZE, position:'relative',
          touchAction:'none', userSelect:'none',
        }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{display:'block'}}>
          {/* base track */}
          <circle cx={cx} cy={cy} r={R} fill="none"
            stroke={RING_TRACK} strokeWidth="1.4"/>

          {/* event tick-dots */}
          {events.map((_, i) => {
            const a = angleFor(i) * Math.PI/180;
            const x = cx + Math.cos(a) * R;
            const y = cy + Math.sin(a) * R;
            const past = i < nowIdx;
            const isNow = i === nowIdx;
            return (
              <circle key={i} cx={x} cy={y}
                r={isNow ? 2.4 : 1.6}
                fill={isNow ? RING_INK : past ? 'rgba(26,26,24,0.3)' : 'rgba(26,26,24,0.18)'}/>
            );
          })}

          {/* sweep arc from now → handle */}
          {sweepArc && (
            <path d={sweepArc} fill="none" stroke={RING_INK}
              strokeWidth="1.6" strokeLinecap="round"
              opacity={Math.min(1, Math.abs(pos - nowIdx) * 0.6 + 0.4)}/>
          )}

          {/* handle */}
          <circle cx={handleX} cy={handleY} r={HANDLE_R}
            fill="#EFEDE7" stroke={RING_INK} strokeWidth="1.2"/>
        </svg>

        {/* center iridescent orb */}
        <div style={{
          position:'absolute', left:'50%', top:'50%',
          transform:`translate(-50%,-50%) scale(${aiActive ? 1.18 : 1})`,
          width: CENTER_R*2, height: CENTER_R*2, borderRadius:'50%',
          background: 'radial-gradient(circle at 30% 32%, #d6eedd 0%, transparent 55%),' +
                      'radial-gradient(circle at 72% 38%, #e3d0eb 0%, transparent 55%),' +
                      'radial-gradient(circle at 65% 75%, #f0c9d6 0%, transparent 55%),' +
                      'radial-gradient(circle at 28% 72%, #cad8eb 0%, transparent 60%),' +
                      'radial-gradient(circle at 50% 50%, #ece5f0 0%, #e5dceb 80%)',
          filter: aiActive ? 'blur(0.4px) saturate(1.15)' : 'blur(0.3px)',
          transition: 'transform 320ms cubic-bezier(0.2,0.8,0.2,1), filter 320ms',
          boxShadow: aiActive
            ? '0 0 0 2px rgba(26,26,24,0.06), 0 8px 28px rgba(200,160,210,0.35)'
            : '0 1px 2px rgba(26,26,24,0.04), inset 0 0 0 1px rgba(255,255,255,0.4)',
          pointerEvents:'none',
        }}/>
        {/* center pin */}
        <div style={{
          position:'absolute', left:'50%', top:'50%',
          transform:'translate(-50%,-50%)',
          width: 3, height: 3, borderRadius:'50%',
          background: RING_INK, pointerEvents:'none',
        }}/>
      </div>
    </div>
  );
}

// Build an SVG arc path from angle a1 → a2 (degrees) on a circle.
function buildArc(cx, cy, r, a1deg, a2deg) {
  if (Math.abs(a2deg - a1deg) < 0.5) return null;
  const a1 = a1deg * Math.PI/180;
  const a2 = a2deg * Math.PI/180;
  const x1 = cx + Math.cos(a1) * r;
  const y1 = cy + Math.sin(a1) * r;
  const x2 = cx + Math.cos(a2) * r;
  const y2 = cy + Math.sin(a2) * r;
  const large = Math.abs(a2deg - a1deg) > 180 ? 1 : 0;
  const sweep = a2deg > a1deg ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}

Object.assign(window, { RingControl });
