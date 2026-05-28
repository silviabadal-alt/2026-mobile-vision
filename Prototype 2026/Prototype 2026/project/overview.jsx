// overview.jsx — Full-day grid overview ("zoom out" from a single card)
//
// A vertical timeline with a hairline spine on the left, time labels in a
// monospace gutter, and each event rendered as a single-row band. Tap any
// band to zoom back into the day card view at that event.
//
// Visual: same Swiss-light vocabulary as the cards — hairlines, tabular
// numbers, ultra-light titles. The current event is marked with a filled
// dot, future events with hollow dots, past with faint dots.

const { useState: useStateOV } = React;

const OV = {
  paper:    '#EFEDE7',
  ink:      '#1a1a18',
  inkDim:   'rgba(26,26,24,0.42)',
  inkSoft:  'rgba(26,26,24,0.28)',
  hair:     'rgba(26,26,24,0.10)',
  faint:    'rgba(26,26,24,0.06)',
};

function fmtHM(min) {
  const h = Math.floor(min/60), m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function fmtDur(min) {
  const h = Math.floor(min/60), m = min % 60;
  if (h === 0) return `${m} m`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} m`;
}

function Overview({ open, events, nowIdx, browseIdx, onPick, onClose }) {
  return (
    <div
      aria-hidden={!open}
      style={{
        position:'absolute', inset: 0, zIndex: 25,
        background: OV.paper, color: OV.ink,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 360ms cubic-bezier(0.2,0.8,0.2,1)',
        fontFamily:'Inter, system-ui, sans-serif',
        display:'flex', flexDirection:'column',
        overflow:'hidden',
      }}>
      {/* status bar margin */}
      <div style={{height: 50}}/>

      {/* eyebrow + title */}
      <div style={{padding:'14px 28px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize: 11, letterSpacing:'0.14em', textTransform:'uppercase', color: OV.inkDim}}>
            Tuesday, May 19
          </div>
          <div style={{fontSize: 32, fontWeight: 200, letterSpacing:'-0.03em', marginTop: 6}}>
            All day
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 32, height: 32, borderRadius:'50%',
          background:'transparent', border:`1px solid ${OV.hair}`,
          color: OV.ink, cursor:'pointer', fontSize: 14, lineHeight: 1,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>×</button>
      </div>

      {/* list */}
      <div style={{
        flex: 1, overflowY:'auto',
        padding:'0 28px 110px',
        position:'relative',
      }}>
        <div style={{position:'relative', paddingLeft: 56}}>
          {/* spine */}
          <div style={{
            position:'absolute', left: 44, top: 0, bottom: 0,
            width: 1, background: OV.hair,
          }}/>
          {events.map((e, i) => (
            <Row key={e.id}
              event={e}
              past={i < nowIdx}
              isNow={i === nowIdx}
              isBrowse={i === browseIdx}
              onTap={() => onPick(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ event, past, isNow, isBrowse, onTap }) {
  const dur = event.end - event.start;
  return (
    <button onClick={onTap} style={{
      position:'relative', display:'block', width:'100%',
      padding:'14px 0',
      background:'transparent', border:'none', cursor:'pointer',
      borderBottom: `1px solid ${OV.hair}`,
      textAlign:'left', fontFamily:'inherit',
      opacity: past ? 0.5 : 1,
    }}>
      {/* time on spine */}
      <div style={{
        position:'absolute', left: -56, top: 18, width: 42,
        fontSize: 11, color: OV.inkDim,
        fontVariantNumeric:'tabular-nums',
        textAlign:'right', letterSpacing:'0.01em',
      }}>{fmtHM(event.start)}</div>

      {/* dot */}
      <div style={{
        position:'absolute', left: -14, top: 23,
        width: isNow ? 9 : 7, height: isNow ? 9 : 7,
        borderRadius:'50%',
        background: isNow ? OV.ink : isBrowse ? OV.ink : past ? OV.inkSoft : 'transparent',
        border: !isNow && !isBrowse ? `1.4px solid ${past ? OV.inkSoft : OV.ink}` : 'none',
        boxShadow: isNow ? `0 0 0 4px ${OV.faint}` : 'none',
      }}/>

      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap: 14}}>
        <div style={{
          fontSize: 22, fontWeight: 200,
          letterSpacing:'-0.02em', lineHeight: 1.1,
          color: OV.ink, minWidth: 0,
        }}>{event.title}</div>
        <div style={{
          fontSize: 11, color: OV.inkDim,
          fontVariantNumeric:'tabular-nums', flexShrink: 0,
          letterSpacing:'0.02em',
        }}>{fmtDur(dur)}</div>
      </div>
      {event.subtitle && (
        <div style={{
          fontSize: 12, color: OV.inkDim, marginTop: 4,
          letterSpacing:'-0.005em',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{event.subtitle}</div>
      )}
      {isBrowse && !isNow && (
        <div style={{
          marginTop: 6, fontSize: 10, letterSpacing:'0.14em', textTransform:'uppercase',
          color: OV.ink,
        }}>Browsing</div>
      )}
    </button>
  );
}

Object.assign(window, { Overview });
