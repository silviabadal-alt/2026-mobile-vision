// briefing.jsx — Daily Briefing pull-down view.
//
// A dark, paper-on-paper inverted sheet that drops from the top of the
// viewport when the user drags or scrolls down on the day view.
//
// Layout:
//   · A handle at the top
//   · Greeting prose with inline pill-shaped highlights
//     ("You have 8 Meetings totalling 3h 15m, 5 Tasks, …")
//   · A live now-ish card + status pill row
//   · A vertical view-switcher rail on the right (Day · Focus · Tasks · Energy)
//   · The selected view's content area below
//
// The briefing is proactive: each view surfaces an insight the system
// derived from the day, with a verb-led suggestion the user can act on.

const { useState: useStateBR, useEffect: useEffectBR } = React;

const BR = {
  paper:    '#0E0E0E',
  ink:      '#F2F0EA',
  inkDim:   'rgba(242,240,234,0.55)',
  inkSoft:  'rgba(242,240,234,0.30)',
  inkFaint: 'rgba(242,240,234,0.14)',
  hair:     'rgba(242,240,234,0.10)',
  pillBg:   'rgba(242,240,234,0.10)',
  pillBorder: 'rgba(242,240,234,0.16)',
  accent:   '#D9C6F0',   // soft lavender, like the orb
  warn:     '#E8C39A',   // sand
  good:     '#B8E0C2',   // sage
};

// ─────────────────────────────────────────────────────────────
// Tiny inline glyphs for the pills (no emoji)
// ─────────────────────────────────────────────────────────────
const G = (props) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}/>;
const GlyphCal     = () => <G><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></G>;
const GlyphCheck   = () => <G><path d="M4 7l3 3 6-6M4 14l3 3 6-6M4 21l3 3 6-6"/></G>;
const GlyphHead    = () => <G><path d="M4 13a8 8 0 1 1 16 0v5a2 2 0 0 1-2 2h-1v-7h3"/><path d="M4 13v5a2 2 0 0 0 2 2h1v-7H4"/></G>;
const GlyphClock   = () => <G><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></G>;
const GlyphSpark   = () => <G><path d="M3 17l5-7 4 4 5-8 4 6"/></G>;
const GlyphAlert   = () => <G><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor"/></G>;
const GlyphMove    = () => <G><path d="M4 12h16M14 6l6 6-6 6"/></G>;
const GlyphCup     = () => <G><path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M16 11h2a3 3 0 0 1 0 6h-2"/><path d="M8 3v3M12 3v3"/></G>;
const GlyphFire    = () => <G><path d="M12 3c2 4-2 4 0 8s-4 4-3 7c.5 1.6 2 3 4 3s4-1.5 4-4c0-3-3-3-3-6 0-3 2-3-2-8z"/></G>;
const GlyphMoon    = () => <G><path d="M21 12.8A8 8 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></G>;
const GlyphRoute   = () => <G><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M6 8c0 6 12 4 12 8"/></G>;
const GlyphGrid    = () => <G><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></G>;
const GlyphTarget  = () => <G><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></G>;
const GlyphBolt    = () => <G><path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z"/></G>;

// ─────────────────────────────────────────────────────────────
// Inline pill — the core building block of the briefing prose
// ─────────────────────────────────────────────────────────────
function Pill({ icon: Icon, color, children, dim=false }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'2px 11px 2px 8px',
      borderRadius: 999,
      background: BR.pillBg,
      border: `1px solid ${BR.pillBorder}`,
      color: dim ? BR.inkDim : BR.ink,
      whiteSpace:'nowrap',
      letterSpacing:'-0.005em',
      lineHeight: 1.4,
      verticalAlign: 'baseline',
    }}>
      {Icon && <span style={{color: color || BR.inkDim, display:'inline-flex'}}><Icon/></span>}
      <span style={{fontWeight: 600}}>{children}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// View definitions — each one is its own proactive perspective
// ─────────────────────────────────────────────────────────────
const VIEWS = [
  { id:'day',    label:'Day',    Icon: GlyphCal },
  { id:'focus',  label:'Focus',  Icon: GlyphTarget },
  { id:'tasks',  label:'Tasks',  Icon: GlyphCheck },
  { id:'energy', label:'Energy', Icon: GlyphBolt },
];

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
function Briefing({ open, onClose, summary }) {
  const [view, setView] = useStateBR('day');

  // reset to default tab on close
  useEffectBR(() => {
    if (!open) {
      const t = setTimeout(() => setView('day'), 360);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      style={{
        position:'absolute', inset: 0, zIndex: 35,
        background: BR.paper, color: BR.ink,
        transform: `translateY(${open ? 0 : -101}%)`,
        transition: 'transform 540ms cubic-bezier(0.2,0.8,0.2,1)',
        boxShadow: open ? '0 24px 60px -10px rgba(0,0,0,0.4)' : 'none',
        display:'flex', flexDirection:'column',
        fontFamily:'Inter, system-ui, sans-serif',
        overflow:'hidden',
      }}>

      {/* status bar margin */}
      <div style={{height: 56}}/>

      {/* prose header — grows with view */}
      <div style={{
        padding:'4px 64px 0 28px',
        position:'relative',
      }}>
        <BriefingProse view={view} summary={summary}/>
        <SideRail view={view} setView={setView}/>
      </div>

      {/* live + status row (only on Day view; other views shift to content) */}
      {view === 'day' && (
        <div style={{padding:'28px 28px 0', display:'flex', flexDirection:'column', gap: 8}}>
          <LiveSessionPill/>
          <StatusPillsRow/>
        </div>
      )}

      {/* content area — varies per view */}
      <div style={{
        flex: 1, padding:'28px 28px 0',
        overflow:'hidden',
      }}>
        <ViewContent view={view} summary={summary}/>
      </div>

      {/* footer — close handle */}
      <button
        onClick={onClose}
        aria-label="Close briefing"
        style={{
          alignSelf:'center',
          margin:'12px 0 22px',
          width: 80, height: 28, padding: 0,
          background: 'transparent', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
        <div style={{
          width: 44, height: 4, borderRadius: 2,
          background: BR.inkSoft,
        }}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Prose header — different per view
// ─────────────────────────────────────────────────────────────
function BriefingProse({ view, summary }) {
  const proseStyle = {
    fontSize: 26,
    fontWeight: 300,
    lineHeight: 1.32,
    letterSpacing: '-0.018em',
    color: BR.ink,
    maxWidth: 340,
    textWrap: 'pretty',
  };

  if (view === 'day') {
    return (
      <div style={proseStyle}>
        <span style={{color: BR.inkDim}}>Good morning.</span>{' '}
        You have{' '}
        <Pill icon={GlyphCal}>{summary.meetings} Meetings</Pill>{' '}
        totalling <span style={{fontWeight:500}}>{summary.meetingsDur}</span>,{' '}
        <Pill icon={GlyphCheck} color={BR.good}>{summary.tasks} Tasks</Pill>,{' '}
        and{' '}
        <Pill icon={GlyphHead} color={BR.accent}>{summary.focusDur} Focus</Pill>.{' '}
        You’re free after{' '}
        <span style={{fontWeight:500}}>{summary.freeAfter}</span>.
      </div>
    );
  }

  if (view === 'focus') {
    return (
      <div style={proseStyle}>
        <span style={{color: BR.inkDim}}>Heads up.</span>{' '}
        Only{' '}
        <Pill icon={GlyphHead} color={BR.warn}>{summary.focusDur}</Pill>{' '}
        of deep work today —{' '}
        <span style={{fontFamily:'"Noto Serif",serif',fontStyle:'italic'}}>under your usual</span>.{' '}
        <Pill icon={GlyphMove}>2 blocks</Pill>{' '}
        can move.{' '}
        <span style={{color: BR.inkDim}}>Protect your focus time.</span>
      </div>
    );
  }

  if (view === 'tasks') {
    return (
      <div style={proseStyle}>
        <Pill icon={GlyphCheck}>{summary.tasks} Tasks</Pill>{' '}
        still open.{' '}
        <Pill icon={GlyphAlert} color={BR.warn}>2 overdue</Pill>.{' '}
        <span style={{fontFamily:'"Noto Serif",serif',fontStyle:'italic',color:BR.inkDim}}>Three can be delegated</span>{' '}
        — expand to see who.
      </div>
    );
  }

  if (view === 'energy') {
    return (
      <div style={proseStyle}>
        Your{' '}
        <Pill icon={GlyphFire} color={BR.warn}>9 am peak</Pill>{' '}
        is already spent.{' '}
        A{' '}
        <Pill icon={GlyphMoon}>13:00 dip</Pill>{' '}
        is coming.{' '}
        <span style={{color: BR.inkDim}}>Save shallow work for the afternoon.</span>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Side rail — vertical view switcher on the right
// ─────────────────────────────────────────────────────────────
function SideRail({ view, setView }) {
  return (
    <div style={{
      position:'absolute', top: 4, right: 22,
      display:'flex', flexDirection:'column', gap: 4,
    }}>
      {VIEWS.map(v => {
        const active = v.id === view;
        return (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            aria-label={v.label}
            aria-pressed={active}
            style={{
              width: 32, height: 32, padding: 0,
              display:'flex', alignItems:'center', justifyContent:'center',
              background: active ? BR.ink : 'transparent',
              color:      active ? BR.paper : BR.inkDim,
              border:'none', borderRadius: 10, cursor:'pointer',
              transition: 'background 220ms cubic-bezier(0.2,0.8,0.2,1), color 220ms',
            }}>
            <v.Icon/>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Live session pill — "Let's study together! · LIVE"
// ─────────────────────────────────────────────────────────────
function LiveSessionPill() {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 12,
      padding:'10px 14px 10px 10px',
      borderRadius: 999,
      background: BR.pillBg,
      border: `1px solid ${BR.pillBorder}`,
    }}>
      <AvatarStack who={['MR','TM','KL','ES']}/>
      <div style={{flex:1, minWidth: 0}}>
        <div style={{fontSize: 13, fontWeight: 500, letterSpacing:'-0.005em'}}>Let’s study together!</div>
        <div style={{fontSize: 11, color: BR.inkDim, marginTop: 1}}>4 participants</div>
      </div>
      <div style={{
        display:'flex', alignItems:'center', gap: 6,
        padding:'3px 8px', borderRadius: 6,
        background:'rgba(232,164,148,0.16)',
        color:'#E8A494',
        fontSize: 10, fontWeight: 600, letterSpacing:'0.16em',
      }}>
        <span style={{width:6, height:6, borderRadius:'50%', background:'#E8A494',
          animation:'briefPulse 1.6s ease-in-out infinite'}}/>
        LIVE
      </div>
    </div>
  );
}

function AvatarStack({ who }) {
  return (
    <div style={{display:'flex'}}>
      {who.slice(0, 3).map((w, i) => (
        <div key={i} style={{
          width: 26, height: 26, borderRadius: '50%',
          background: ['#3C3C3C','#4A4A4A','#5A5A5A'][i % 3],
          color: BR.ink, fontSize: 9, fontWeight: 600,
          display:'flex', alignItems:'center', justifyContent:'center',
          border: `1.5px solid ${BR.paper}`,
          marginLeft: i === 0 ? 0 : -8,
          letterSpacing:'0.04em',
        }}>{w}</div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status pills row
// ─────────────────────────────────────────────────────────────
function StatusPillsRow() {
  return (
    <div style={{display:'flex', gap: 8}}>
      <StatusPill icon={<GlyphClock/>} label="5 m remaining" tone="dim"/>
      <StatusPill icon={<GlyphRoute/>} label="Buffer in 15 m" tone="dim"/>
    </div>
  );
}
function StatusPill({ icon, label, tone='dim' }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap: 6,
      padding:'7px 12px',
      borderRadius: 999,
      background: BR.pillBg,
      border: `1px solid ${BR.pillBorder}`,
      color: BR.inkDim, fontSize: 12, letterSpacing:'-0.005em',
    }}>
      <span style={{display:'inline-flex', color: BR.inkDim}}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// View content — each tab's main panel
// ─────────────────────────────────────────────────────────────
function ViewContent({ view, summary }) {
  if (view === 'day')    return <DayLanes summary={summary}/>;
  if (view === 'focus')  return <FocusBreakdown/>;
  if (view === 'tasks')  return <TaskList/>;
  if (view === 'energy') return <EnergyCurve/>;
  return null;
}

// — Day: stacked horizontal lanes for meetings/focus/tasks across the day
function DayLanes({ summary }) {
  const lanes = [
    { label:'Meetings', segs:[ [9,1], [10,1], [11,0.5], [14.5,0.5], [15.5,0.5] ], tone: BR.ink },
    { label:'Focus',    segs:[ [13,1.5] ], tone: BR.accent },
    { label:'Tasks',    segs:[ [16.5,0.5] ], tone: BR.good },
    { label:'Free',     segs:[ [15,0.5], [17, 1] ], tone: BR.inkFaint },
  ];
  const startH = 7, endH = 19, span = endH - startH;
  const x = (h) => ((h - startH) / span) * 100;
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 14}}>
      {/* hour ruler */}
      <div style={{position:'relative', height: 14}}>
        {[8,10,12,14,16,18].map(h => (
          <div key={h} style={{
            position:'absolute', left:`${x(h)}%`, top: 0, transform:'translateX(-50%)',
            fontSize: 10, color: BR.inkSoft, fontVariantNumeric:'tabular-nums',
          }}>{h}:00</div>
        ))}
      </div>
      {lanes.map(l => (
        <div key={l.label}>
          <div style={{fontSize: 11, letterSpacing:'0.14em', textTransform:'uppercase',
            color: BR.inkSoft, marginBottom: 6}}>{l.label}</div>
          <div style={{position:'relative', height: 6, background: BR.hair, borderRadius: 3}}>
            {l.segs.map((s, i) => (
              <div key={i} style={{
                position:'absolute', left:`${x(s[0])}%`,
                width:`${(s[1]/span)*100}%`, top: 0, bottom: 0,
                background: l.tone, borderRadius: 3,
              }}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// — Focus: list of blocks with a suggestion CTA
function FocusBreakdown() {
  const blocks = [
    { time:'13:00 – 14:30', label:'Roadmap deck',  state:'committed', dur:'1h 30m' },
    { time:'10:00 – 11:00', label:'Mobile Design Daily', state:'movable',  dur:'1h',     hint:'recurring · skip once?' },
    { time:'14:30 – 15:00', label:'1:1 · Maria',          state:'movable',  dur:'30 m',   hint:'shift to Thursday?' },
  ];
  return (
    <div style={{display:'flex', flexDirection:'column'}}>
      {blocks.map((b,i)=>(
        <div key={i} style={{
          display:'flex', flexDirection:'column', gap: 4,
          padding:'14px 0',
          borderTop: i === 0 ? `1px solid ${BR.hair}` : 'none',
          borderBottom: `1px solid ${BR.hair}`,
        }}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
            <div style={{fontSize: 11, color: BR.inkSoft, letterSpacing:'0.04em',
              fontVariantNumeric:'tabular-nums'}}>{b.time}</div>
            <div style={{fontSize: 11, color: b.state === 'committed' ? BR.accent : BR.warn,
              letterSpacing:'0.14em', textTransform:'uppercase'}}>{b.state}</div>
          </div>
          <div style={{fontSize: 17, fontWeight: 400, letterSpacing:'-0.01em'}}>{b.label}</div>
          {b.hint && (
            <div style={{fontSize: 12, color: BR.inkDim,
              fontFamily:'"Noto Serif",serif',fontStyle:'italic'}}>{b.hint}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// — Tasks: open task list with affordance
function TaskList() {
  const tasks = [
    { t:'Q3 roadmap deck',           owner:'You',    state:'overdue', delegate:false },
    { t:'Pricing copy review',       owner:'You',    state:'open',    delegate:true,  to:'Maria' },
    { t:'Email Christian re: launch',owner:'You',    state:'open',    delegate:false },
    { t:'Research strategy slides',  owner:'You',    state:'overdue', delegate:true,  to:'Sara' },
    { t:'Hiring panel for PM role',  owner:'You',    state:'open',    delegate:false },
  ];
  return (
    <div style={{display:'flex', flexDirection:'column'}}>
      {tasks.map((t,i)=>(
        <div key={i} style={{
          display:'flex', alignItems:'center', gap: 12, padding:'12px 0',
          borderTop: i === 0 ? `1px solid ${BR.hair}` : 'none',
          borderBottom: `1px solid ${BR.hair}`,
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: 4,
            border: `1.5px solid ${t.state === 'overdue' ? BR.warn : BR.inkSoft}`,
            flexShrink: 0,
          }}/>
          <span style={{flex: 1, fontSize: 14, letterSpacing:'-0.005em',
            color: t.state === 'overdue' ? BR.warn : BR.ink}}>{t.t}</span>
          {t.delegate && (
            <button style={{
              padding:'4px 10px', borderRadius: 999,
              background:'transparent', border:`1px solid ${BR.inkFaint}`,
              color: BR.inkDim, fontSize: 11, cursor:'pointer',
              fontFamily:'inherit', letterSpacing:'-0.005em',
            }}>→ {t.to}</button>
          )}
        </div>
      ))}
    </div>
  );
}

// — Energy: simple curve of perceived energy across the day
function EnergyCurve() {
  // sample energy values 07..19
  const data = [0.5, 0.85, 1.0, 0.95, 0.7, 0.5, 0.3, 0.45, 0.6, 0.55, 0.4, 0.25, 0.15];
  const W = 320, H = 120;
  const path = data.map((v,i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - v * (H - 12) - 6;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const peakIdx = data.indexOf(Math.max(...data));
  const peakX = (peakIdx / (data.length - 1)) * W;
  const peakY = H - data[peakIdx] * (H - 12) - 6;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
        <defs>
          <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BR.accent} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={BR.accent} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#energyFill)"/>
        <path d={path} fill="none" stroke={BR.ink} strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx={peakX} cy={peakY} r="3.5" fill={BR.warn}/>
        <line x1={peakX} y1={peakY + 8} x2={peakX} y2={H - 2}
          stroke={BR.inkFaint} strokeWidth="1" strokeDasharray="2 3"/>
      </svg>
      <div style={{display:'flex', justifyContent:'space-between',
        fontSize: 10, color: BR.inkSoft, marginTop: 4,
        fontVariantNumeric:'tabular-nums'}}>
        <span>07</span><span>10</span><span>13</span><span>16</span><span>19</span>
      </div>

      <div style={{marginTop: 22, display:'flex', flexDirection:'column', gap: 10}}>
        <Suggestion label="Move shallow work to 14:00"/>
        <Suggestion label="Take a walk after lunch"/>
        <Suggestion label="Reserve 16:00 for emails"/>
      </div>
    </div>
  );
}

function Suggestion({ label }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 10,
      padding:'10px 14px', borderRadius: 12,
      background: BR.pillBg, border:`1px solid ${BR.pillBorder}`,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: BR.ink, color: BR.paper, fontSize: 11, fontWeight: 600,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>+</span>
      <span style={{fontSize: 13, letterSpacing:'-0.005em', color: BR.ink}}>{label}</span>
    </div>
  );
}

Object.assign(window, { Briefing });
