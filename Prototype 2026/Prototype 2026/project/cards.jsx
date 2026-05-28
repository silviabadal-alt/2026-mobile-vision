// cards.jsx — Minimal Swiss-editorial event cards.
// Each card is a single hairline + tabular time gutter + ultra-light title
// + a small, restrained contextual detail. Nothing more.

const CARD_INK = '#1a1a18';
const CARD_DIM = 'rgba(26,26,24,0.42)';
const CARD_FAINT = 'rgba(26,26,24,0.22)';
const CARD_HAIR = 'rgba(26,26,24,0.16)';

function fmt(min) {
  const h = Math.floor(min/60), m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────────────────────
// CardFrame — shared layout (time gutter + hairline + title)
// ─────────────────────────────────────────────────────────────
function CardFrame({ event, children, dim=false, titleSize=46 }) {
  return (
    <div style={{
      position:'relative', width:'100%',
      opacity: dim ? 0.18 : 1,
      transition: 'opacity 400ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* top hairline starts at the title column */}
      <div style={{
        height:1, background: CARD_HAIR, marginLeft: 64,
      }}/>
      <div style={{display:'flex', gap:18, paddingTop:18}}>
        <div style={{
          width:46, paddingTop: 6, flexShrink:0,
          fontSize:13, color: CARD_DIM,
          fontVariantNumeric:'tabular-nums', letterSpacing:'0.005em',
        }}>{fmt(event.start)}</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontSize: titleSize, fontWeight: 200,
            letterSpacing:'-0.025em', lineHeight: 1.02,
            color: CARD_INK,
          }}>{event.title}</div>
          {event.subtitle && (
            <div style={{
              fontSize:14, color: CARD_DIM, marginTop:10,
              letterSpacing:'-0.005em',
            }}>{event.subtitle}</div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. Daily planning — tasks as tabular list
// ─────────────────────────────────────────────────────────────
function PlanningCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        {event.scheduled.map((t,i)=>(
          <div key={i} style={detailRow}>
            <span style={{color: CARD_INK}}>{t.title}</span>
            <span style={{color: CARD_DIM, fontVariantNumeric:'tabular-nums'}}>{t.time}</span>
          </div>
        ))}
        {event.pool.map((t,i)=>(
          <div key={'p'+i} style={detailRow}>
            <span style={{color: CARD_DIM}}>{t}</span>
            <span style={{color: CARD_FAINT}}>—</span>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Mobile Design Daily — minimal organizer + files
// ─────────────────────────────────────────────────────────────
function DesignReviewCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{marginTop:22}}>
        {event.files.map((f,i)=>(
          <div key={i} style={detailRow}>
            <span style={{color: CARD_INK}}>{f.name}</span>
            <span style={{color: CARD_DIM}}>{f.meta.split(' · ')[0]}</span>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Commute — directional route map (handles both directions)
// ─────────────────────────────────────────────────────────────
function CommuteCard({ event }) {
  const isHome = event.direction === 'home';

  // Layout: going to HQ → Home(left,bottom) to HQ(right,top)
  //         going home → HQ(left,top) to Home(right,bottom)
  const ox = 24,  oy = isHome ? 28 : 90;
  const dx = 288, dy = isHome ? 90 : 28;
  const fromLabel = isHome ? 'HQ' : 'HOME';
  const toLabel   = isHome ? 'HOME' : 'HQ';
  const fromName  = isHome ? 'Doodle HQ' : 'Home';
  const toName    = isHome ? 'Home' : 'Doodle HQ';

  // Mid waypoints
  const w1x = 95,  w1y = isHome ? 50 : 68;
  const w2x = 195, w2y = isHome ? 65 : 46;

  const walkStroke = { strokeDasharray:'2.5 4', strokeLinecap:'round' };

  return (
    <CardFrame event={event}>
      <div style={{marginTop:18, position:'relative'}}>
        <svg viewBox="0 0 312 118" width="100%" style={{display:'block', overflow:'visible'}}>
          <defs>
            <pattern id={`cGrid${isHome}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke={CARD_HAIR} strokeWidth="0.45"/>
            </pattern>
            <linearGradient id={`cLine${isHome}`} x1={ox/312} y1={oy/118} x2={dx/312} y2={dy/118} gradientUnits="fractionalLength">
              <stop offset="0%"   stopColor={CARD_INK} stopOpacity="0.55"/>
              <stop offset="100%" stopColor={CARD_INK} stopOpacity="1"/>
            </linearGradient>
          </defs>
          <rect width="312" height="118" fill={`url(#cGrid${isHome})`} opacity="0.9"/>

          {/* Major cross-streets — give it a real city feel */}
          {[36, 68, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="312" y2={y}
              stroke={CARD_HAIR} strokeWidth="0.7" opacity="0.7"/>
          ))}
          {[52, 104, 156, 208, 260].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="118"
              stroke={CARD_HAIR} strokeWidth="0.7" opacity="0.7"/>
          ))}

          {/* Route glow / shadow */}
          <path d={`M ${ox} ${oy} C ${ox+42} ${oy}, ${w1x-20} ${w1y}, ${w1x} ${w1y} S ${w2x-16} ${w2y}, ${w2x} ${w2y} S ${dx-30} ${dy}, ${dx} ${dy}`}
            fill="none" stroke={CARD_HAIR} strokeWidth="10" strokeLinecap="round"/>

          {/* Walking segment — origin to first tram stop */}
          <path d={`M ${ox} ${oy} L ${ox+36} ${oy}`}
            fill="none" stroke={CARD_INK} strokeWidth="1.4" {...walkStroke}/>
          {/* Tram / S-Bahn transit */}
          <path d={`M ${ox+36} ${oy} C ${ox+70} ${oy}, ${w1x-24} ${w1y}, ${w1x} ${w1y} S ${w2x-18} ${w2y}, ${w2x} ${w2y}`}
            fill="none" stroke={CARD_INK} strokeWidth="2" strokeLinecap="round"/>
          {/* Walking to destination */}
          <path d={`M ${w2x} ${w2y} C ${w2x+36} ${w2y}, ${dx-36} ${dy}, ${dx} ${dy}`}
            fill="none" stroke={CARD_INK} strokeWidth="1.4" {...walkStroke}/>

          {/* Transit stops */}
          {[{x:w1x, y:w1y, l:'Sihlquai'}, {x:w2x, y:w2y, l:'HB'}].map((s,i) => (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r="3.2" fill={CARD_INK}/>
              <text x={s.x} y={s.y + (isHome ? 13 : -8)} fontSize="8" fill={CARD_DIM}
                fontFamily="Inter,system-ui" textAnchor="middle" letterSpacing="0.05em">
                {s.l}
              </text>
            </g>
          ))}

          {/* Origin — hollow ring */}
          <circle cx={ox} cy={oy} r="7" fill="#EFEDE7" stroke={CARD_INK} strokeWidth="1.5"/>
          <circle cx={ox} cy={oy} r="2.4" fill={CARD_INK}/>
          <text x={ox} y={oy + (isHome ? -13 : 19)} fontSize="8.5" fill={CARD_DIM}
            fontFamily="Inter,system-ui" textAnchor="middle" letterSpacing="0.06em">
            {fromLabel}
          </text>

          {/* Destination — filled */}
          <circle cx={dx} cy={dy} r="7" fill={CARD_INK}/>
          <circle cx={dx} cy={dy} r="2.4" fill="#EFEDE7"/>
          <text x={dx} y={dy + (isHome ? 19 : -13)} fontSize="8.5" fill={CARD_DIM}
            fontFamily="Inter,system-ui" textAnchor="middle" letterSpacing="0.06em">
            {toLabel}
          </text>
        </svg>
      </div>

      <div style={{marginTop:18, display:'flex', alignItems:'center', gap:14, fontSize:13, color: CARD_INK}}>
        <span>{fromName}</span>
        <div style={{flex:1, height:1, background: CARD_FAINT}}/>
        <span>{toName}</span>
        <span style={{color: CARD_DIM, fontVariantNumeric:'tabular-nums'}}>24 min</span>
      </div>
      <div style={{marginTop:8, fontSize:11, color: CARD_DIM, letterSpacing:'0.06em', textTransform:'uppercase'}}>
        S2 · Tram 11 · 4 min walk
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Lunch — a single line of italic prose
// ─────────────────────────────────────────────────────────────
function LunchCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{
        marginTop:24, fontFamily:'"Noto Serif", serif', fontStyle:'italic',
        fontSize:22, lineHeight:1.3, color: CARD_INK, letterSpacing:'-0.01em',
        maxWidth: 260,
      }}>
        Step away from the screen. The afternoon is heavy.
      </div>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        <div style={detailRow}><span style={{color: CARD_INK}}>Tibits</span><span style={{color: CARD_DIM}}>3 min walk</span></div>
        <div style={detailRow}><span style={{color: CARD_INK}}>Hiltl Sihlpost</span><span style={{color: CARD_DIM}}>6 min · quiet</span></div>
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Focus — objective line + minimal progress
// ─────────────────────────────────────────────────────────────
function FocusCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{
        marginTop:24, fontFamily:'"Noto Serif", serif', fontStyle:'italic',
        fontSize:20, lineHeight:1.32, color: CARD_INK, letterSpacing:'-0.005em',
        maxWidth: 280,
      }}>
        {event.objective}
      </div>
      <div style={{
        marginTop:24, display:'flex', alignItems:'center', gap:12,
        fontSize:12, color: CARD_DIM, fontVariantNumeric:'tabular-nums',
      }}>
        <span>00:00</span>
        <div style={{flex:1, height:1, background: CARD_FAINT, position:'relative'}}>
          <div style={{position:'absolute', left:0, top:-0.5, height:2, width:'0%', background: CARD_INK}}/>
        </div>
        <span>90:00</span>
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. 1:1 — agenda list
// ─────────────────────────────────────────────────────────────
function OneOnOneCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        {event.agenda.map((a,i)=>(
          <div key={i} style={detailRow}>
            <span style={{color: CARD_DIM, width:22, display:'inline-block', fontVariantNumeric:'tabular-nums'}}>
              {String(i+1).padStart(2,'0')}
            </span>
            <span style={{color: CARD_INK, flex:1}}>{a}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop:14, fontSize:12, color: CARD_DIM, letterSpacing:'0.04em', textTransform:'uppercase'}}>
        14th 1:1 · with Maria Rüegg
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. Standup — three terse rows
// ─────────────────────────────────────────────────────────────
function StandupCard({ event }) {
  const rows = [
    ['Yesterday', 'Shipped the prototype. Reviewed Jens’ onboarding flow.'],
    ['Today', 'Finalize Q3 deck for Tom. 1:1 with Maria.'],
    ['Blocked', 'Legal review on pricing copy.'],
  ];
  return (
    <CardFrame event={event}>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        {rows.map(([k,v],i)=>(
          <div key={i} style={{...detailRow, alignItems:'flex-start'}}>
            <span style={{color: CARD_DIM, width: 78, flexShrink:0, fontSize:12, letterSpacing:'0.04em', textTransform:'uppercase', paddingTop:3}}>
              {k}
            </span>
            <span style={{color: CARD_INK, flex:1, lineHeight:1.4}}>{v}</span>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. External — Anna Chen / Northwind facts
// ─────────────────────────────────────────────────────────────
function ExternalCallCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Role</span><span style={{color: CARD_INK}}>VP Product, Northwind</span></div>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Last touch</span><span style={{color: CARD_INK}}>14 Sept · 8 months ago</span></div>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Mutual</span><span style={{color: CARD_INK}}>3 incl. Maria Rüegg</span></div>
      </div>
      <div style={{
        marginTop:18, fontFamily:'"Noto Serif", serif', fontStyle:'italic',
        fontSize:15, lineHeight:1.4, color: CARD_INK, maxWidth: 280,
      }}>
        Anna asked for 20 min to discuss team-tier pricing. Treat as re-engagement.
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. End of day — three stats
// ─────────────────────────────────────────────────────────────
function EndOfDayCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Meetings</span><span style={{color: CARD_INK, fontVariantNumeric:'tabular-nums'}}>6 / 6</span></div>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Deep work</span><span style={{color: CARD_INK, fontVariantNumeric:'tabular-nums'}}>1 h 12 m</span></div>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Created</span><span style={{color: CARD_INK, fontVariantNumeric:'tabular-nums'}}>2 h 40 m</span></div>
      </div>
      <div style={{
        marginTop:20, fontFamily:'"Noto Serif", serif', fontStyle:'italic',
        fontSize:18, lineHeight:1.32, color: CARD_INK,
      }}>
        Tomorrow looks lighter.
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. Workout — heart-rate sparkline + distance/duration
// ─────────────────────────────────────────────────────────────
function WorkoutCard({ event }) {
  // Heart-rate samples → a smooth path. Calm, almost ECG-like.
  const samples = [62,68,82,98,112,128,142,151,158,162,159,148,138,130,125,118,108,96,84,74,66];
  const W = 300, H = 80, max = 170, min = 60;
  const path = samples.map((v, i) => {
    const x = (i / (samples.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * (H - 12) - 6;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <CardFrame event={event}>
      <div style={{marginTop:24}}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
          <path d={path} fill="none" stroke={CARD_INK} strokeWidth="1.3" strokeLinejoin="round"/>
          {/* peak marker */}
          <circle cx={(samples.indexOf(Math.max(...samples)) / (samples.length-1)) * W}
            cy={H - ((Math.max(...samples) - min) / (max - min)) * (H - 12) - 6}
            r="2.4" fill={CARD_INK}/>
        </svg>
      </div>
      <div style={{marginTop:14, display:'flex', justifyContent:'space-between',
        fontSize:11, color: CARD_DIM, letterSpacing:'0.04em', textTransform:'uppercase',
        fontVariantNumeric:'tabular-nums'}}>
        <span>5.2 km</span>
        <span>avg 138 bpm</span>
        <span>peak 162</span>
      </div>
      <div style={{
        marginTop:20, fontFamily:'"Noto Serif", serif', fontStyle:'italic',
        fontSize:18, lineHeight:1.32, color: CARD_INK, letterSpacing:'-0.005em',
      }}>
        Hardest part is putting the shoes on.
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. Coffee — a single line about the person + last shared note
// ─────────────────────────────────────────────────────────────
function CoffeeCard({ event }) {
  return (
    <CardFrame event={event}>
      <div style={{
        marginTop:24, fontFamily:'"Noto Serif", serif', fontStyle:'italic',
        fontSize:20, lineHeight:1.35, color: CARD_INK, letterSpacing:'-0.005em',
        maxWidth: 300,
      }}>
        Tom asked to swap notes on the Q3 pricing rewrite. Bring the doc.
      </div>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Last met</span><span style={{color: CARD_INK}}>2 weeks ago</span></div>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Where</span><span style={{color: CARD_INK}}>Café Henrici · 3 min</span></div>
        <div style={detailRow}><span style={{color: CARD_DIM}}>Usual</span><span style={{color: CARD_INK}}>Flat white, no sugar</span></div>
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. Meditation — breathing animation + intention
// ─────────────────────────────────────────────────────────────
function MeditationCard({ event }) {
  return (
    <CardFrame event={event} titleSize={42}>
      <div style={{marginTop:26, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:22}}>

        {/* Breathing ring — purely CSS, no JS */}
        <div style={{position:'relative', width:72, height:72, alignSelf:'center'}}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            border:`1px solid ${CARD_HAIR}`,
          }}/>
          <div style={{
            position:'absolute', inset:8, borderRadius:'50%',
            border:`1px solid rgba(26,26,24,0.22)`,
            animation:'breathe 4s ease-in-out infinite',
          }}/>
          <div style={{
            position:'absolute', inset:'50%', margin:'-4px',
            width:8, height:8, borderRadius:'50%', background: CARD_INK,
          }}/>
          <style>{`
            @keyframes breathe {
              0%,100% { transform:scale(0.82); opacity:0.35; }
              50%      { transform:scale(1.1);  opacity:0.9; }
            }
          `}</style>
        </div>

        {/* Intention */}
        <div>
          <div style={{
            fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase',
            color: CARD_DIM, marginBottom:8,
          }}>Today's intention</div>
          <div style={{
            fontFamily:'"Noto Serif",serif', fontStyle:'italic',
            fontSize:20, lineHeight:1.35, color: CARD_INK,
            letterSpacing:'-0.01em', maxWidth:280,
          }}>
            {event.intention || 'Begin with clarity. End with intention.'}
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 13. Board prep — deck status + agenda checklist
// ─────────────────────────────────────────────────────────────
const STATUS_DOT = {
  ready:   { color: 'rgba(26,26,24,0.8)',  label: '✓' },
  draft:   { color: 'rgba(26,26,24,0.45)', label: '○' },
  pending: { color: 'rgba(26,26,24,0.28)', label: '·' },
};

function BoardPrepCard({ event }) {
  return (
    <CardFrame event={event} titleSize={42}>
      <div style={{
        marginTop:8, fontFamily:'"Noto Serif",serif', fontStyle:'italic',
        fontSize:14, color: CARD_DIM, letterSpacing:'-0.005em',
      }}>
        {event.deck}
      </div>
      <div style={{marginTop:22, display:'flex', flexDirection:'column'}}>
        {(event.items || []).map((item, i) => {
          const s = STATUS_DOT[item.status] || STATUS_DOT.pending;
          return (
            <div key={i} style={{...detailRow}}>
              <span style={{color: s.color, fontSize:16, lineHeight:1, minWidth:16}}>{s.label}</span>
              <span style={{color: item.status === 'ready' ? CARD_INK : CARD_DIM, flex:1}}>{item.label}</span>
              <span style={{
                fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase',
                color: CARD_DIM, opacity: item.status === 'ready' ? 0 : 1,
              }}>{item.status}</span>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:14, fontSize:12, color: CARD_DIM, letterSpacing:'0.04em', textTransform:'uppercase'}}>
        Board call · Thursday 09:00
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// 14. Retrospective — three-column Swiss layout
// ─────────────────────────────────────────────────────────────
function RetrospectiveCard({ event }) {
  const sections = [
    { label:'Went well',  items: event.wentWell || [], mark:'↑' },
    { label:'Improve',    items: event.improve   || [], mark:'→' },
    { label:'Actions',    items: event.actions   || [], mark:'⊕' },
  ];
  return (
    <CardFrame event={event} titleSize={38}>
      <div style={{marginTop:22, display:'flex', flexDirection:'column', gap:0}}>
        {sections.map((sec, si) => (
          <div key={si}>
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 0 8px',
              borderTop: `1px solid ${CARD_HAIR}`,
            }}>
              <span style={{
                fontSize:10, color: CARD_DIM, letterSpacing:'0.14em',
                textTransform:'uppercase', minWidth:80,
              }}>{sec.label}</span>
            </div>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{
                display:'flex', alignItems:'baseline', gap:10,
                padding:'3px 0',
              }}>
                <span style={{color: CARD_DIM, fontSize:12, minWidth:14}}>{sec.mark}</span>
                <span style={{color: CARD_INK, fontSize:13, letterSpacing:'-0.005em', lineHeight:1.4}}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        ))}
        <div style={{borderTop:`1px solid ${CARD_HAIR}`, paddingTop:10, marginTop:4}}>
          <div style={{fontSize:11, color: CARD_DIM, letterSpacing:'0.04em', textTransform:'uppercase'}}>
            Sprint 24 · Phoenix team
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────
const detailRow = {
  display:'flex', justifyContent:'space-between', alignItems:'center', gap:12,
  fontSize:14, padding:'8px 0',
  borderBottom: `1px solid ${CARD_HAIR}`,
  letterSpacing:'-0.005em',
};

const CARDS = {
  planning: PlanningCard,
  'design-review': DesignReviewCard,
  commute: CommuteCard,
  lunch: LunchCard,
  focus: FocusCard,
  'one-on-one': OneOnOneCard,
  standup: StandupCard,
  external: ExternalCallCard,
  eod: EndOfDayCard,
  workout: WorkoutCard,
  coffee: CoffeeCard,
  meditation: MeditationCard,
  'board-prep': BoardPrepCard,
  retrospective: RetrospectiveCard,
};

Object.assign(window, { CARDS, CardFrame });
