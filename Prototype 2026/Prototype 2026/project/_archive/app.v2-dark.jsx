// app.jsx — shell, swipe stack, AI bar, and creative grid day view.

const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aiTone": "warm",
  "headerTreatment": "serif-emph",
  "stackPeek": 2,
  "lunchHue": "basada",
  "showProgressDots": true,
  "showSwipeHints": true
}/*EDITMODE-END*/;

// ──── Day data ──────────────────────────────────────────────
const DAY_EVENTS = [
  {
    id: 'plan', type: 'planning',
    time: '9:00 – 9:50 AM', title: 'Daily planning',
    subtitle: '2 tasks scheduled, 5 to place',
    scheduled: [
      { title: 'Prototyping "Unified Creator"', time: '10–10:50' },
      { title: 'Future Features planning', time: '11–11:50' },
    ],
    pool: ['Presentation for Research Strategy', 'Email Christian', 'Sara — pricing review'],
  },
  {
    id: 'design', type: 'design-review',
    time: '10:00 – 11:00 AM', title: 'Design team sync',
    subtitle: '3 files queued for review',
    attendees: ['MR','AS','KC','JP'],
    files: [
      { name: 'Onboarding flow v3', meta: 'Jens · updated 2h ago', bg:'#F8F8F8', unread:true, preview: <FilePreviewWireframe/> },
      { name: 'Pricing redesign', meta: 'Maria · 4 frames', bg:'#fff', unread:false, preview: <FilePreviewSpec/> },
      { name: 'Mobile booking prototype', meta: 'Kim · in Figma', bg:'#0E0E0E', unread:true, preview: <FilePreviewPrototype/> },
    ],
  },
  {
    id: 'commute', type: 'commute',
    time: '11:30 – 11:54 AM', title: 'Commute to office',
    subtitle: 'You\'re leaving from Home',
  },
  {
    id: 'lunch', type: 'lunch',
    time: '12:00 – 1:00 PM', title: 'Lunch',
    subtitle: 'A heavy afternoon awaits',
  },
  {
    id: 'focus', type: 'focus',
    time: '1:00 – 2:30 PM', title: 'Deep work',
    subtitle: '90 minutes · single objective',
    objective: 'Finish the Q3 roadmap deck — landing slide + revenue tab.',
  },
  {
    id: '1on1', type: 'one-on-one',
    time: '2:30 – 3:00 PM', title: '1:1 with Maria',
    subtitle: 'Weekly · 30 min',
    agenda: ['Roadmap signoff', 'Pricing copy block', 'Q3 hiring plan'],
  },
  {
    id: 'standup', type: 'standup',
    time: '3:00 – 3:15 PM', title: 'Team standup',
    subtitle: '7 speakers · async-friendly',
  },
  {
    id: 'external', type: 'external',
    time: '3:30 – 4:00 PM', title: 'Anna Chen · Northwind',
    subtitle: 'External · 20 min',
  },
  {
    id: 'eod', type: 'eod',
    time: '5:30 – 6:00 PM', title: 'End of day',
    subtitle: 'Reflect and close',
  },
];

// ──── Suggested prompts per card type ───────────────────────
const SUGGESTED_PROMPTS = {
  planning: ['What should I do first?', 'Anything I\'m forgetting?', 'Move these to tomorrow'],
  'design-review': ['Summarise Jens\' changes', 'What needs my decision?', 'Draft review comments'],
  commute: ['Will I be late?', 'Best podcast for 24 min?', 'Reroute via café'],
  lunch: ['Quietest spot today?', 'Anyone free to join?', 'Order ahead'],
  focus: ['Block my Slack', 'Outline the deck for me', 'What did I write last time?'],
  'one-on-one': ['What\'s Maria\'s mood?', 'Open action items', 'Draft 1:1 notes'],
  standup: ['Write my update', 'What did I commit yesterday?', 'Who is blocked on me?'],
  external: ['Brief me on Anna', 'Northwind\'s churn reason', 'Draft an opener'],
  eod: ['Did I keep my word?', 'Compose tomorrow', 'Email summary to me'],
};

// ═════════════════════════════════════════════════════════════
// App
// ═════════════════════════════════════════════════════════════
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState('stack'); // stack | grid
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div>
      <IOSDevice width={402} height={874} dark>
        <div style={{
          position:'absolute', inset:0, background:'#0E0E0E', overflow:'hidden',
          fontFamily:'Inter, system-ui, sans-serif',
        }}>
          <Header index={index} total={DAY_EVENTS.length} view={view}
            onToggleView={()=>setView(v=>v==='stack'?'grid':'stack')}
            tweaks={t}/>

          {view === 'stack' && (
            <StackView index={index} setIndex={setIndex} onAskAI={()=>setAiOpen(true)} aiOpen={aiOpen} tweaks={t}/>
          )}
          {view === 'grid' && (
            <GridView index={index} setIndex={(i)=>{ setIndex(i); setView('stack'); }} />
          )}

          <AIBar
            event={DAY_EVENTS[index]}
            open={aiOpen}
            onOpen={()=>setAiOpen(true)}
            onClose={()=>setAiOpen(false)}
            view={view}
            tone={t.aiTone}
          />
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Voice"/>
        <TweakRadio label="AI tone" value={t.aiTone}
          options={['warm','clear','confident']}
          onChange={v=>setTweak('aiTone', v)}/>
        <TweakRadio label="Headline" value={t.headerTreatment}
          options={['serif-emph','all-sans']}
          onChange={v=>setTweak('headerTreatment', v)}/>

        <TweakSection label="Stack"/>
        <TweakSlider label="Cards peeking behind" value={t.stackPeek}
          min={0} max={3} step={1}
          onChange={v=>setTweak('stackPeek', v)}/>
        <TweakToggle label="Swipe hints" value={t.showSwipeHints}
          onChange={v=>setTweak('showSwipeHints', v)}/>
        <TweakToggle label="Progress dots" value={t.showProgressDots}
          onChange={v=>setTweak('showProgressDots', v)}/>

        <TweakSection label="Lunch card"/>
        <TweakRadio label="Background" value={t.lunchHue}
          options={['basada','black','white']}
          onChange={v=>setTweak('lunchHue', v)}/>

        <TweakSection label="Jump to event"/>
        <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:'0 14px 12px'}}>
          {DAY_EVENTS.map((e,i)=>(
            <button key={e.id} onClick={()=>{setIndex(i); setView('stack');}} style={{
              fontSize:10, padding:'5px 8px', borderRadius:999,
              background: i===index ? '#BA5ADA' : 'rgba(0,0,0,0.06)',
              color: i===index ? '#0E0E0E' : '#29261b',
              border:'none', cursor:'pointer', fontFamily:'inherit',
            }}>{e.id}</button>
          ))}
        </div>
      </TweaksPanel>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Header
// ═════════════════════════════════════════════════════════════
function Header({ index, total, view, onToggleView, tweaks }) {
  const meta = useDayMeta();
  return (
    <div style={{
      position:'absolute', top:0,left:0,right:0, zIndex:5,
      padding:'58px 22px 14px', color:'#fff',
      pointerEvents: 'auto',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', opacity:0.5}}>
            Tuesday · 19 May
          </div>
          <div style={{fontSize:30, fontWeight:600, marginTop:4, letterSpacing:'-0.02em', lineHeight:1.05, maxWidth:280}}>
            {tweaks?.headerTreatment === 'all-sans'
              ? 'Meeting heavy day ahead'
              : <>Meeting <span style={{fontFamily:'"Noto Serif",serif',fontStyle:'italic',fontWeight:400}}>heavy</span> day ahead</>}
          </div>
        </div>
        <button onClick={onToggleView} aria-label="Toggle view" style={{
          width:36,height:36,borderRadius:10,
          background:'rgba(255,255,255,0.08)',
          border:'none', color:'#fff', cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          {view === 'stack' ? <GridGlyph/> : <StackGlyph/>}
        </button>
      </div>

      {/* progress */}
      <div style={{display:'flex',alignItems:'center',gap:14,marginTop:18,fontSize:12,color:'rgba(255,255,255,0.55)'}}>
        <ProgressRing pct={(index)/Math.max(1,total-1)} />
        <div style={{display:'flex',gap:18,flex:1}}>
          <Stat n={meta.meetings} l="meetings"/>
          <Stat n={meta.deep} l="of deep work"/>
          <Stat n={meta.tasks} l="tasks"/>
        </div>
      </div>

      {/* sequence dots */}
      {tweaks?.showProgressDots !== false && (
        <div style={{display:'flex',gap:3,marginTop:14}}>
          {Array.from({length: total}).map((_,i)=>(
            <div key={i} style={{
              flex:1, height:2, borderRadius:1,
              background: i<=index ? '#BA5ADA' : 'rgba(255,255,255,0.12)',
              transition:'background 200ms',
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}

function useDayMeta() {
  return { meetings: '6', deep: '1h', tasks: '2' };
}

function Stat({ n, l }) {
  return (
    <div>
      <span style={{color:'#fff',fontWeight:500}}>{n}</span>
      <span style={{marginLeft:4}}>{l}</span>
    </div>
  );
}

function ProgressRing({ pct }) {
  const C = 2*Math.PI*9;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none"/>
      <circle cx="11" cy="11" r="9" stroke="#BA5ADA" strokeWidth="2" fill="none"
        strokeDasharray={C} strokeDashoffset={C*(1-pct)} strokeLinecap="round"
        style={{transition:'stroke-dashoffset 300ms cubic-bezier(0.2,0.8,0.2,1)'}}/>
    </svg>
  );
}

function GridGlyph(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
function StackGlyph(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="3" width="12" height="18" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/></svg>}

// ═════════════════════════════════════════════════════════════
// Stack View — swipeable cards
// ═════════════════════════════════════════════════════════════
function StackView({ index, setIndex, onAskAI, aiOpen, tweaks }) {
  // Fractional position drives smooth interpolation between cards.
  // pos === index when at rest. During drag/animation, pos slides.
  const [pos, setPos] = useState(index);
  const posRef = useRef(index);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startPosRef = useRef(index);
  const animRef = useRef(null);
  const containerRef = useRef(null);
  const SLIDE = 360; // px to move one full card

  const writePos = (p) => {
    posRef.current = p;
    setPos(p);
  };

  // Spring animation toward a target position
  const animateTo = (target) => {
    cancelAnimationFrame(animRef.current);
    const start = performance.now();
    const from = posRef.current;
    const dist = target - from;
    // duration scales with distance so longer trips feel proportional
    const duration = Math.min(520, 240 + Math.abs(dist) * 280);
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic — gentle landing
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const p = from + dist * ease(t);
      writePos(p);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        writePos(target);
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  // External index changes (tweak panel, grid tap) → animate
  useEffect(() => {
    if (draggingRef.current) return;
    if (Math.abs(posRef.current - index) > 0.001) animateTo(index);
  }, [index]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const onPointerDown = (e) => {
    const tag = e.target.tagName;
    if (['BUTTON','INPUT','SELECT','TEXTAREA'].includes(tag)) return;
    if (e.target.closest('button') || e.target.draggable || e.target.closest('[data-no-swipe]')) return;
    cancelAnimationFrame(animRef.current);
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startPosRef.current = posRef.current;
    containerRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const dy = e.clientY - startYRef.current;
    // Up swipe (negative dy) → pos goes up (toward later events)
    let next = startPosRef.current - dy / SLIDE;
    // rubber-band at edges
    if (next < 0) next = -Math.sqrt(-next) * 0.5;
    const maxIdx = DAY_EVENTS.length - 1;
    if (next > maxIdx) next = maxIdx + Math.sqrt(next - maxIdx) * 0.5;
    writePos(next);
  };

  const endDrag = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    // velocity-aware snap: use distance from start to bias the decision
    const traveled = posRef.current - startPosRef.current;
    let target;
    if (Math.abs(traveled) > 0.25) {
      // user clearly intended to move — snap in direction of travel
      target = startPosRef.current + Math.sign(traveled);
    } else {
      target = Math.round(posRef.current);
    }
    target = Math.max(0, Math.min(DAY_EVENTS.length - 1, target));
    setIndex(target);
    animateTo(target);
  };

  // Wheel / trackpad — smooth scroll between cards
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef(null);
  const onWheel = (e) => {
    e.preventDefault();
    cancelAnimationFrame(animRef.current);
    wheelAccumRef.current += e.deltaY;
    // Move fractionally as user scrolls
    let next = posRef.current + e.deltaY / (SLIDE * 1.6);
    if (next < 0) next = 0;
    const maxIdx = DAY_EVENTS.length - 1;
    if (next > maxIdx) next = maxIdx;
    writePos(next);
    // After wheel inertia stops, snap to nearest
    clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => {
      const target = Math.max(0, Math.min(maxIdx, Math.round(posRef.current)));
      setIndex(target);
      animateTo(target);
      wheelAccumRef.current = 0;
    }, 140);
  };

  const dragActive = draggingRef.current;
  const dragOffset = pos - index; // for hint visibility

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      style={{
        position:'absolute', top:200, bottom: 96, left:0, right:0,
        padding:'0 18px',
        touchAction: 'pan-x',
        userSelect:'none',
      }}
    >
      {DAY_EVENTS.map((evt, i) => {
        const o = i - pos; // continuous offset
        const peek = tweaks?.stackPeek ?? 2;
        // Render a window around current position
        if (o < -1.6 || o > peek + 0.6) return null;
        const Card = CARDS[evt.type];

        // Smooth interpolation of stack metrics by offset
        // Top (o=0): y=0, scale=1, opacity=1
        // Behind (o=1): y=18, scale=0.94, opacity=0.55
        // Behind2 (o=2): y=32, scale=0.88, opacity=0.30
        // Above (o<0): slides up & fades
        let translateY, scale, opacity;
        if (o >= 0) {
          // Going into the deck below
          translateY = clamp01ish(o) * 18 + clamp01ish(o - 1) * 14 + clamp01ish(o - 2) * 12;
          scale = 1 - clamp01ish(o) * 0.06 - clamp01ish(o - 1) * 0.06 - clamp01ish(o - 2) * 0.06;
          opacity = 1 - clamp01ish(o) * 0.45 - clamp01ish(o - 1) * 0.25 - clamp01ish(o - 2) * 0.15;
        } else {
          // Leaving upward
          const t = -o; // 0..1+
          translateY = -t * 80;
          scale = 1 - t * 0.04;
          opacity = Math.max(0, 1 - t * 1.4);
        }
        opacity = Math.max(0, Math.min(1, opacity));

        const isTop = Math.abs(o) < 0.5;

        return (
          <div key={evt.id} style={{
            position:'absolute', inset:'0 18px',
            transform: `translateY(${translateY}px) scale(${scale})`,
            opacity,
            zIndex: 100 - Math.abs(Math.round(o * 10)),
            pointerEvents: isTop && !dragActive ? 'auto' : 'none',
            willChange:'transform, opacity',
          }}>
            <Card event={evt} onAskAI={onAskAI} tweaks={tweaks} />
          </div>
        );
      })}

      {/* swipe hints */}
      {tweaks?.showSwipeHints !== false && Math.abs(dragOffset) > 0.05 && (
        <>
          <SwipeHint dir="up" active={dragOffset > 0.15}/>
          <SwipeHint dir="down" active={dragOffset < -0.15}/>
        </>
      )}
    </div>
  );
}

// helper: smooth 0..1 ramp used for stacked-card metrics
function clamp01ish(x) {
  return Math.max(0, Math.min(1, x));
}

function SwipeHint({ dir, active }) {
  const placement = dir === 'up'
    ? { top: 10, left: '50%', transform: 'translateX(-50%)' }
    : { bottom: 10, left: '50%', transform: 'translateX(-50%)' };
  return (
    <div style={{
      position:'absolute', ...placement,
      width:36, height:36, borderRadius:'50%',
      background: active ? '#BA5ADA' : 'rgba(255,255,255,0.1)',
      color: active ? '#0E0E0E' : '#fff',
      display:'flex',alignItems:'center',justifyContent:'center',
      transition:'background 160ms', pointerEvents:'none',
      boxShadow:'0 4px 12px rgba(0,0,0,0.2)',
    }}>
      {dir === 'up' ?
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="18 15 12 9 6 15"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
      }
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// AI Bar — persistent, expands inline
// ═════════════════════════════════════════════════════════════
function AIBar({ event, open, onOpen, onClose, view, tone='warm' }) {
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const prompts = SUGGESTED_PROMPTS[event.type] || [];

  // reset on event change
  useEffect(()=>{ setMessages([]); setQ(''); }, [event.id]);

  const ask = async (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role:'user', text }]);
    setQ('');
    setLoading(true);
    try {
      const toneNote = {
        warm: 'Warm, human, contraction-friendly. Like a thoughtful colleague.',
        clear: 'Plain, clear, no filler. No adjectives. Just what they need.',
        confident: 'Confident and declarative. No hedging. State it as fact.',
      }[tone];
      const resp = await window.claude.complete({
        messages: [{
          role: 'user',
          content: `You are Doodle's calendar AI. The user is currently on this event: "${event.title}" (${event.time}). Context: ${event.subtitle || ''}. Their question: "${text}". Reply in 1-2 short declarative sentences. ${toneNote} British English. No emoji. Don't repeat the question.`,
        }],
      });
      setMessages(m => [...m, { role:'ai', text: resp }]);
    } catch (e) {
      setMessages(m => [...m, { role:'ai', text: 'I can\'t reach my brain right now. Try again in a moment.' }]);
    }
    setLoading(false);
  };

  if (view === 'grid' && !open) {
    return null;
  }

  return (
    <>
      {/* Sheet (expanded) — positioned directly */}
      <div style={{
        position:'absolute', left:0, right:0, bottom: 0, zIndex: 20,
        background: '#0E0E0E', color: '#fff',
        borderRadius: open ? '24px 24px 0 0' : 0,
        overflow:'hidden',
        height: open ? 340 : 0,
        transition: 'height 280ms cubic-bezier(0.2,0.8,0.2,1)',
        boxShadow: open ? '0 -20px 40px rgba(0,0,0,0.4)' : 'none',
        borderTop: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {open && (
          <div style={{height:340, display:'flex',flexDirection:'column',padding:'18px 20px 36px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <AISwoosh/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>Doodle AI</div>
                <div style={{fontSize:11,opacity:0.5}}>About "{event.title}"</div>
              </div>
              <button onClick={onClose} style={{
                width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.08)',
                border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
              }}>×</button>
            </div>

            <div style={{flex:1, overflowY:'auto', display:'flex',flexDirection:'column',gap:10,paddingRight:4, marginBottom:12}} data-no-swipe>
              {messages.length === 0 && (
                <div style={{fontFamily:'"Noto Serif",serif', fontSize:18, lineHeight:1.3, opacity:0.85}}>
                  Ask me about this moment.
                </div>
              )}
              {messages.map((m,i)=>(
                <div key={i} style={{
                  alignSelf: m.role==='user' ? 'flex-end':'flex-start',
                  maxWidth:'82%',
                  background: m.role==='user' ? '#BA5ADA' : 'rgba(255,255,255,0.07)',
                  color: m.role==='user' ? '#0E0E0E' : '#fff',
                  padding:'8px 12px', borderRadius:14,
                  fontSize:13, lineHeight:1.4,
                }}>{m.text}</div>
              ))}
              {loading && (
                <div style={{alignSelf:'flex-start',padding:'8px 12px',borderRadius:14,
                  background:'rgba(255,255,255,0.07)',display:'flex',gap:4}}>
                  {[0,1,2].map(i=>(
                    <span key={i} style={{
                      width:5,height:5,borderRadius:'50%',background:'#fff',
                      animation:`pulse 1.2s ${i*0.15}s infinite`,
                    }}/>
                  ))}
                </div>
              )}
            </div>

            {messages.length === 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}} data-no-swipe>
                {prompts.map((p,i)=>(
                  <button key={i} onClick={()=>ask(p)} style={{
                    fontSize:11, padding:'7px 11px', borderRadius:999,
                    background:'rgba(255,255,255,0.07)',color:'#fff',
                    border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',fontFamily:'inherit',
                  }}>{p}</button>
                ))}
              </div>
            )}

            <form onSubmit={(e)=>{e.preventDefault(); ask(q);}} style={{display:'flex',gap:8}} data-no-swipe>
              <input value={q} onChange={e=>setQ(e.target.value)}
                placeholder={`Ask about ${event.title.toLowerCase()}…`}
                style={{
                  flex:1, background:'rgba(255,255,255,0.08)',
                  border:'1px solid rgba(255,255,255,0.06)', color:'#fff',
                  borderRadius:12, padding:'12px 14px', fontSize:13,
                  outline:'none', fontFamily:'inherit',
                }}/>
              <button type="submit" style={{
                width:44,height:44,borderRadius:12,
                background:'#BA5ADA', color:'#0E0E0E', border:'none', cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Persistent pill (collapsed) */}
      {!open && view === 'stack' && (
        <div style={{
          position:'absolute', left:0, right:0, bottom: 0,
          zIndex: 19,
          padding: '12px 18px 30px',
          background:'linear-gradient(to top, #0E0E0E 60%, transparent)',
          display:'flex',justifyContent:'center',
          pointerEvents:'auto',
        }}>
          <button onClick={onOpen} style={{
            display:'flex',alignItems:'center',gap:10,
            padding:'10px 14px 10px 12px', borderRadius:999,
            background:'rgba(255,255,255,0.1)',
            backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.08)',
            color:'#fff', cursor:'pointer', fontFamily:'inherit',
          }}>
            <AISwoosh size={22}/>
            <span style={{fontSize:13}}>Ask about {event.title.toLowerCase()}</span>
          </button>
        </div>
      )}
    </>
  );
}

function AISwoosh({ size=28 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:'#BA5ADA',
      display:'flex',alignItems:'center',justifyContent:'center',
      flexShrink:0,
    }}>
      <svg width={size*0.62} height={size*0.62} viewBox="0 0 24 24" fill="none" stroke="#0E0E0E" strokeWidth="2.2" strokeLinecap="round">
        <path d="M5 12c0-4 3-6 7-6s7 2 7 6-3 6-7 6-7-2-7-6z"/>
        <path d="M5 12c3.5-2 10.5-2 14 0"/>
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Grid view — creative "river of time"
// ═════════════════════════════════════════════════════════════
function GridView({ index, setIndex }) {
  // Each event renders as a horizontal band, scaled by duration.
  // Colour & icon vary by type. Past events are dimmed.
  return (
    <div style={{
      position:'absolute', top: 200, bottom: 28, left: 0, right: 0,
      padding:'0 18px',
      overflowY:'auto',
    }}>
      <div style={{position:'relative', paddingLeft: 56}}>
        {/* time spine */}
        <div style={{
          position:'absolute', top: 0, bottom: 0, left: 36,
          width: 1, background: 'rgba(255,255,255,0.08)',
        }}/>

        {DAY_EVENTS.map((evt, i) => (
          <GridBand key={evt.id} event={evt} active={i===index} past={i<index}
            onTap={()=>setIndex(i)}/>
        ))}

        <div style={{height: 80}}/>
      </div>
    </div>
  );
}

function GridBand({ event, active, past, onTap }) {
  const isLunch = event.type === 'lunch';
  const isFocus = event.type === 'focus';
  const isCommute = event.type === 'commute';
  const isEOD = event.type === 'eod';

  // size by "duration" — visual rhythm, not literal
  const HEIGHTS = {
    planning: 64, 'design-review': 78, commute: 50, lunch: 70, focus: 110,
    'one-on-one': 56, standup: 44, external: 56, eod: 70,
  };
  const h = HEIGHTS[event.type] || 60;

  // background per type
  let bg = 'rgba(255,255,255,0.05)';
  let accent = 'rgba(255,255,255,0.12)';
  let fg = '#fff';
  if (isLunch) { bg = '#BA5ADA'; fg = '#0E0E0E'; accent='#0E0E0E'; }
  if (isFocus) { bg = 'rgba(186,90,218,0.12)'; accent = '#BA5ADA'; }
  if (active) { accent = '#BA5ADA'; }

  return (
    <div style={{position:'relative', marginBottom: 8, opacity: past ? 0.4 : 1}}>
      {/* time on spine */}
      <div style={{
        position:'absolute', left: -56, top: 6, width: 50,
        fontFamily:'ui-monospace,monospace', fontSize: 10,
        color: active ? '#BA5ADA' : 'rgba(255,255,255,0.45)',
        textAlign:'right',
      }}>
        {event.time.split(' – ')[0]}
      </div>

      {/* spine dot */}
      <div style={{
        position:'absolute', left: -23, top: 12,
        width: 8, height: 8, borderRadius:'50%',
        background: active ? '#BA5ADA' : past ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)',
        boxShadow: active ? '0 0 0 4px rgba(186,90,218,0.25)' : 'none',
      }}/>

      <button onClick={onTap} style={{
        width:'100%', height:h, textAlign:'left', cursor:'pointer',
        background: bg, color: fg,
        border:'none',
        borderRadius: 14,
        padding:'12px 14px',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        position:'relative', overflow:'hidden',
        outline: active ? `1.5px solid ${accent}` : '1px solid rgba(255,255,255,0.05)',
        fontFamily:'inherit',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <TypeIcon type={event.type}/>
          <span style={{fontSize:13, fontWeight:500}}>{event.title}</span>
        </div>
        <BandPreview type={event.type} event={event}/>
      </button>
    </div>
  );
}

function TypeIcon({ type }) {
  const c = 'currentColor';
  const icons = {
    planning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    'design-review': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>,
    commute: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2v-9z" transform="rotate(45 12 12)"/></svg>,
    lunch: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><path d="M6 2v8a4 4 0 008 0V2"/><line x1="10" y1="2" x2="10" y2="22"/></svg>,
    focus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>,
    'one-on-one': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="14" r="3"/></svg>,
    standup: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><line x1="6" y1="4" x2="6" y2="20"/><line x1="12" y1="8" x2="12" y2="20"/><line x1="18" y1="12" x2="18" y2="20"/></svg>,
    external: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>,
    eod: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>,
  };
  return <span style={{opacity:0.8, display:'inline-flex'}}>{icons[type]}</span>;
}

function BandPreview({ type, event }) {
  // a tiny visual hint at what the card holds — preview of the unique interface
  switch (type) {
    case 'planning':
      return <div style={{display:'flex',gap:4,marginTop:4}}>
        {[1,1,0.4,0.4,0.4].map((o,i)=>(
          <div key={i} style={{flex:1,height:3,background:'currentColor',opacity:o*0.6,borderRadius:1}}/>
        ))}
      </div>;
    case 'design-review':
      return <div style={{display:'flex',gap:3,marginTop:6}}>
        {event.files?.map((_,i)=>(
          <div key={i} style={{width:14,height:18,background:'rgba(255,255,255,0.15)',borderRadius:2,
            border:'1px solid rgba(255,255,255,0.08)'}}/>
        ))}
      </div>;
    case 'commute':
      return <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4,opacity:0.7,fontSize:10}}>
        <span>Home</span>
        <div style={{flex:1, height:1, background:'currentColor',opacity:0.4,
          borderTop:'1px dashed currentColor', borderTopWidth:1}}/>
        <span>HQ · 24m</span>
      </div>;
    case 'lunch':
      return <div style={{fontFamily:'"Noto Serif",serif', fontSize:14, fontStyle:'italic', marginTop:2,opacity:0.85}}>
        Step away.
      </div>;
    case 'focus':
      return <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
        <div style={{position:'relative',width:34,height:34}}>
          <svg width="34" height="34" viewBox="0 0 34 34" style={{transform:'rotate(-90deg)'}}>
            <circle cx="17" cy="17" r="14" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none"/>
            <circle cx="17" cy="17" r="14" stroke="#BA5ADA" strokeWidth="2" fill="none"
              strokeDasharray={2*Math.PI*14} strokeDashoffset={2*Math.PI*14*0.4} strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{fontSize:11, fontFamily:'"Noto Serif",serif', fontStyle:'italic', opacity:0.85, lineHeight:1.3}}>
          Finish the Q3 deck
        </div>
      </div>;
    case 'one-on-one':
      return <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,fontSize:11,opacity:0.7}}>
        <div style={{width:18,height:18,borderRadius:'50%',background:'rgba(255,255,255,0.2)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:600}}>MR</div>
        <span>Maria · 3 topics</span>
      </div>;
    case 'standup':
      return <div style={{display:'flex',gap:3,marginTop:4}}>
        {[0,1,2,3,4,5,6].map(i=>(
          <div key={i} style={{
            width:8, height:8, borderRadius:2,
            background: i===2 ? '#BA5ADA' : 'rgba(255,255,255,0.2)',
          }}/>
        ))}
      </div>;
    case 'external':
      return <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4,fontSize:11,opacity:0.7}}>
        <div style={{width:14,height:14,borderRadius:'50%',background:'rgba(255,255,255,0.25)'}}/>
        <span>Anna · Northwind</span>
      </div>;
    case 'eod':
      return <div style={{display:'flex',gap:6,marginTop:6,fontSize:10,opacity:0.7}}>
        <span>6 meetings ·</span><span>1h deep ·</span><span style={{color:'#BA5ADA'}}>2h 40m created</span>
      </div>;
    default:
      return null;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
