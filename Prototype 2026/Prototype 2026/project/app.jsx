// app.jsx — Swiss-editorial · light · ring-driven temporal navigation.
//
// Layout, top to bottom:
//   · iOS status bar (light)
//   · Eyebrow date + huge time (smoothly rolls between event timings)
//   · One minimal card (cards.jsx) — sits low in the viewport
//   · Faint blurred ghost of the next event
//   · Lower control ring (rotate / tap-Now / hold-AI)
//
// Interactions:
//   · Rotate ring  → browse events in time; top time rolls live
//   · Tap ring     → snap to Now
//   · Hold ring    → AI listening overlay
//   · Swipe up     → Creation mode (project canvas)
//   · Swipe down   → Daily Briefing (dark sheet with proactive insights)
//   · Zoom out     → All-day overview (grid)

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "paperHue": "warm-cream",
  "showGhostNext": true,
  "showSequenceTicks": false,
  "headerTreatment": "minimal",
  "ringSize": 168
} /*EDITMODE-END*/;

// ─────────────────────────────────────────────────────────────
// Tokens — picked to match cards.jsx + ring.jsx
// ─────────────────────────────────────────────────────────────
const PAPER = {
  'warm-cream': '#EFEDE7',
  'paper': '#F4F2EC',
  'snow': '#F8F7F2',
  'stone': '#E7E3D9'
};
const INK = '#1a1a18';
const INK_DIM = 'rgba(26,26,24,0.42)';
const INK_FAINT = 'rgba(26,26,24,0.18)';
const INK_HAIR = 'rgba(26,26,24,0.10)';

// ─────────────────────────────────────────────────────────────
// Demo day — fixed "now" at 09:49 to match the reference frame
// ─────────────────────────────────────────────────────────────
const NOW_MIN = 9 * 60 + 49;

const DAY_EVENTS = [
{ id: 'meditation', type: 'meditation', start: 6 * 60 + 30, end: 7 * 60,
  title: 'Morning meditation', subtitle: '30 min · breathwork',
  intention: 'Ship the roadmap deck. Protect the afternoon.' },
{ id: 'run', type: 'workout', start: 7 * 60, end: 7 * 60 + 45,
  title: 'Morning run', subtitle: '5.2 km · Sihlquai loop' },
{ id: 'coffee', type: 'coffee', start: 8 * 60 + 30, end: 9 * 60,
  title: 'Coffee · Tom', subtitle: 'Café Henrici · 30 min' },
{ id: 'plan', type: 'planning', start: 9 * 60, end: 9 * 60 + 50,
  title: 'Daily planning', subtitle: '2 tasks scheduled · 5 to place',
  scheduled: [
  { title: 'Prototype "Unified Creator"', time: '10–10:50' },
  { title: 'Q3 roadmap deck', time: '13–14:30' }],
  pool: ['Research Strategy presentation', 'Email Christian', 'Pricing review · Sara']
},
{ id: 'design', type: 'design-review', start: 10 * 60, end: 11 * 60,
  title: 'Mobile Design Daily', subtitle: 'mahdi.mohrehchi@doodle.com',
  files: [
  { name: 'Onboarding flow v3', meta: 'Jens · 2h ago' },
  { name: 'Pricing redesign', meta: 'Maria · 4 frames' },
  { name: 'Mobile booking proto', meta: 'Kim · Figma' }]
},
{ id: 'phoenix', type: 'standup', start: 11 * 60, end: 11 * 60 + 15,
  title: 'Phoenix Daily', subtitle: '7 speakers · async-friendly' },
{ id: 'commute', type: 'commute', start: 11 * 60 + 30, end: 11 * 60 + 54,
  title: 'Commute', subtitle: 'Home → Doodle HQ · 24 min',
  direction: 'hq' },
{ id: 'lunch', type: 'lunch', start: 12 * 60, end: 13 * 60,
  title: 'Lunch', subtitle: 'A heavy afternoon awaits' },
{ id: 'focus', type: 'focus', start: 13 * 60, end: 14 * 60 + 30,
  title: 'Deep work', subtitle: '90 minutes · single objective',
  objective: 'Finish the Q3 roadmap deck — landing slide + revenue tab.' },
{ id: '1on1', type: 'one-on-one', start: 14 * 60 + 30, end: 15 * 60,
  title: '1:1 · Maria', subtitle: 'Weekly · 30 min',
  agenda: ['Roadmap sign-off', 'Pricing copy block', 'Q3 hiring plan'] },
{ id: 'boardprep', type: 'board-prep', start: 15 * 60, end: 15 * 60 + 30,
  title: 'Board prep · Q3', subtitle: 'Mahdi + Maria · pre-read',
  deck: 'Q3 Board Pack v4',
  items: [
  { label: 'Revenue · slides 4–6', status: 'ready' },
  { label: 'Hiring plan appendix', status: 'ready' },
  { label: 'Product roadmap', status: 'draft' },
  { label: 'Open questions', status: 'pending' }]
},
{ id: 'external', type: 'external', start: 15 * 60 + 30, end: 16 * 60,
  title: 'Anna Chen', subtitle: 'Northwind · external · 20 min' },
{ id: 'retro', type: 'retrospective', start: 16 * 60, end: 16 * 60 + 45,
  title: 'Sprint retrospective', subtitle: 'Phoenix team · S24',
  wentWell: ['Shipped booking v2', 'Daily standups improved', 'Clean Q2 handoff'],
  improve: ['Review turnaround time', 'Sprint planning accuracy'],
  actions: ['30-min review slots Tue/Thu', 'Story points on all tickets'] },
{ id: 'commute2', type: 'commute', start: 17 * 60, end: 17 * 60 + 24,
  title: 'Commute home', subtitle: 'Doodle HQ → Home · 24 min',
  direction: 'home' },
{ id: 'eod', type: 'eod', start: 17 * 60 + 30, end: 18 * 60,
  title: 'End of day', subtitle: 'Reflect and close' }];


// Pick the currently-relevant event for "now": the one we're inside,
// or the next one if it starts within 15 minutes — and tip toward the
// upcoming event if we're within the last 5 minutes of the current one.
function findNowIdx(min) {
  for (let i = 0; i < DAY_EVENTS.length; i++) {
    const e = DAY_EVENTS[i];
    if (min < e.start - 15) return Math.max(0, i - 1);
    // inside the event, but not in its final 5 minutes
    if (min < e.end - 5) return i;
    // in the final 5 min — prefer the next one if it exists
    if (min < e.end) return Math.min(DAY_EVENTS.length - 1, i + 1);
  }
  return DAY_EVENTS.length - 1;
}

const fmtTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// Compact duration: "1h 30m", "45m", "2h".
function fmtDurShort(m) {
  const h = Math.floor(m / 60),mm = m % 60;
  if (h === 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}

// Friendly hour-of-day: "3 pm", "11 am".
function fmtHour(min) {
  const h = Math.floor(min / 60);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = (h + 11) % 12 + 1;
  const m = min % 60;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─────────────────────────────────────────────────────────────
// Smooth minute-roll — when the target minute changes, the
// displayed minutes interpolate through every intermediate
// minute, producing an odometer-style roll on the big time.
// Duration scales gently with distance: small jumps feel snappy,
// big jumps feel premium.
// ─────────────────────────────────────────────────────────────
function useTweenedMinutes(target) {
  const [displayed, setDisplayed] = useState(target);
  const ref = useRef(target);
  const animRef = useRef(null);
  useEffect(() => {
    const from = ref.current,to = target;
    if (from === to) return;
    cancelAnimationFrame(animRef.current);
    const t0 = performance.now();
    const diff = Math.abs(to - from);
    const dur = Math.max(280, Math.min(720, 220 + diff * 5));
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const v = Math.round(from + (to - from) * ease(k));
      setDisplayed(v);
      ref.current = v;
      if (k < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [target]);
  return displayed;
}

// ─────────────────────────────────────────────────────────────
// Compute a Day summary from the events — used by the Briefing.
// Tasks count is fixed for the demo (sourced elsewhere in reality).
// ─────────────────────────────────────────────────────────────
function computeSummary(events) {
  const MEETING_TYPES = new Set(['design-review', 'one-on-one', 'external', 'standup', 'coffee', 'board-prep', 'retrospective']);
  let meetings = 0, meetingsMin = 0, focusMin = 0;
  for (const e of events) {
    const dur = e.end - e.start;
    if (MEETING_TYPES.has(e.type)) { meetings++; meetingsMin += dur; }
    else if (e.type === 'focus') { focusMin += dur; }
  }
  const lastMeetingEnd = events
    .filter((e) => MEETING_TYPES.has(e.type))
    .reduce((m, e) => Math.max(m, e.end), 0);
  return {
    meetings,
    meetingsDur: fmtDurShort(meetingsMin),
    tasks: 7,
    focusDur: fmtDurShort(focusMin),
    freeAfter: fmtHour(lastMeetingEnd)
  };
}

const SUGGESTED_PROMPTS = {
  planning: [‘What should I do first?’, ‘Anything I’m forgetting?’, ‘Move these to tomorrow’],
  ‘design-review’: [‘Summarise Jens’ changes’, ‘What needs my decision?’, ‘Draft review comments’],
  commute: [‘Will I be late?’, ‘Best podcast for 24 min?’, ‘Reroute via café’],
  lunch: [‘Quietest spot today?’, ‘Anyone free to join?’, ‘Order ahead’],
  focus: [‘Block my Slack’, ‘Outline the deck for me’, ‘What did I write last time?’],
  ‘one-on-one’: [‘What’s Maria’s mood?’, ‘Open action items’, ‘Draft 1:1 notes’],
  standup: [‘Write my update’, ‘What did I commit yesterday?’, ‘Who is blocked on me?’],
  external: [‘Brief me on Anna’, ‘Northwind’s churn reason’, ‘Draft an opener’],
  eod: [‘Did I keep my word?’, ‘Compose tomorrow’, ‘Email summary’],
  workout: [‘How was my pace?’, ‘Plan tomorrow’s run’, ‘Recovery tip’],
  coffee: [‘Brief me on Tom’, ‘Last shared note’, ‘What to bring’],
  meditation: [‘Set my intention’, ‘Guide my breathing’, ‘Reflect on yesterday’],
  ‘board-prep’: [‘What needs my decision?’, ‘Summarise the deck’, ‘Who is attending?’],
  retrospective: [‘Write my went-well’, ‘Suggest improvements’, ‘Draft action items’]
};

// ═════════════════════════════════════════════════════════════
// App
// ═════════════════════════════════════════════════════════════
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const nowIdx = useMemo(() => findNowIdx(NOW_MIN), []);
  const [browseIdx, setBrowseIdx] = useState(nowIdx);
  const [aiOpen, setAiOpen] = useState(false);
  const [creationOpen, setCreationOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const event = DAY_EVENTS[browseIdx];
  const isNow = browseIdx === nowIdx;
  const ghostEvent = DAY_EVENTS[browseIdx + 1] || null;
  const paper = PAPER[t.paperHue] || PAPER['warm-cream'];

  // The big top time: real clock when on Now, event start when browsing.
  // We feed the target minutes into the smooth roll hook.
  const targetMin = isNow ? NOW_MIN : event.start;
  const liveMin = useTweenedMinutes(targetMin);
  const topTime = fmtTime(liveMin);

  const summary = useMemo(() => computeSummary(DAY_EVENTS), []);
  const anyOverlay = aiOpen || creationOpen || briefingOpen || overviewOpen || peopleOpen;

  return (
    <div>
      <IOSDevice width={402} height={874} dark={false}>
        <div style={{
          position: 'absolute', inset: 0, background: paper, overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif', color: INK
        }}>
          {/* Directional swipe surface — sits BEHIND the card stage.
                  Up → Creation. Down → Daily Briefing. */}
          <SwipeCatcher
            onSwipeUp={() => setCreationOpen(true)}
            onSwipeDown={() => setBriefingOpen(true)}
            onSwipeLeft={() => setPeopleOpen(true)} />
          

          <Header
            time={topTime}
            event={event}
            isNow={isNow}
            tweaks={t}
            onOpenOverview={() => setOverviewOpen(true)} />
          

          <CardStage
            event={event}
            ghost={t.showGhostNext ? ghostEvent : null}
            browseIdx={browseIdx} />
          

          <RingZone
            events={DAY_EVENTS}
            nowIdx={nowIdx}
            browseIdx={browseIdx}
            setBrowseIdx={setBrowseIdx}
            onTapNow={() => setBrowseIdx(nowIdx)}
            onHoldAI={() => setAiOpen(true)}
            aiActive={aiOpen}
            size={t.ringSize} />
          

          <SequenceTicks
            shown={t.showSequenceTicks}
            total={DAY_EVENTS.length}
            idx={browseIdx}
            nowIdx={nowIdx} />
          

          <AIOverlay
            open={aiOpen}
            event={event}
            onClose={() => setAiOpen(false)} />
          

          <CreationMode
            open={creationOpen}
            onClose={() => setCreationOpen(false)} />
          

          <Briefing
            open={briefingOpen}
            onClose={() => setBriefingOpen(false)}
            summary={summary} />
          

          <Overview
            open={overviewOpen}
            events={DAY_EVENTS}
            nowIdx={nowIdx}
            browseIdx={browseIdx}
            onPick={(i) => {setBrowseIdx(i);setOverviewOpen(false);}}
            onClose={() => setOverviewOpen(false)} />
          

          <PeopleView
            open={peopleOpen}
            onClose={() => setPeopleOpen(false)} />
          

          <EdgeHints shown={!anyOverlay} />
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Paper" />
        <TweakRadio label="Paper hue" value={t.paperHue}
        options={['warm-cream', 'paper', 'snow', 'stone']}
        onChange={(v) => setTweak('paperHue', v)} />

        <TweakSection label="Composition" />
        <TweakToggle label="Ghost next event"
        value={t.showGhostNext} onChange={(v) => setTweak('showGhostNext', v)} />
        <TweakToggle label="Sequence ticks (lower edge)"
        value={t.showSequenceTicks} onChange={(v) => setTweak('showSequenceTicks', v)} />
        <TweakSlider label="Ring size" min={140} max={200} step={4}
        value={t.ringSize} onChange={(v) => setTweak('ringSize', v)} />

        <TweakSection label="Open" />
        <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', flexWrap: 'wrap' }}>
          <button onClick={() => setBriefingOpen(true)} style={tweakBtn}>Briefing</button>
          <button onClick={() => setOverviewOpen(true)} style={tweakBtn}>Overview</button>
          <button onClick={() => setCreationOpen(true)} style={tweakBtn}>Create</button>
          <button onClick={() => setPeopleOpen(true)} style={tweakBtn}>People</button>
        </div>

        <TweakSection label="Jump to event" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 14px 12px' }}>
          {DAY_EVENTS.map((e, i) =>
          <button key={e.id} onClick={() => setBrowseIdx(i)} style={{
            fontSize: 10, padding: '5px 8px', borderRadius: 999,
            background: i === browseIdx ? INK : 'rgba(0,0,0,0.05)',
            color: i === browseIdx ? paper : INK,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit'
          }}>{e.id}</button>
          )}
        </div>
      </TweaksPanel>

      <style>{`
        @keyframes cardIn {
          from { transform: translateY(8px); }
          to   { transform: translateY(0); }
        }
        @keyframes timeIn {
          from { transform: translateY(4px); }
          to   { transform: translateY(0); }
        }
        @keyframes ghostIn {
          from { opacity: 0; }
          to   { opacity: 0.55; }
        }
        @keyframes overlayIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbBreathe {
          0%,100% { transform: translate(-50%,-50%) scale(1);    filter: blur(0.4px) saturate(1.1); }
          50%     { transform: translate(-50%,-50%) scale(1.06); filter: blur(0.4px) saturate(1.25); }
        }
        @keyframes waveBar {
          0%,100% { transform: scaleY(0.4); }
          50%     { transform: scaleY(1); }
        }
        @keyframes swipeHint {
          0%,100% { transform: translate(-50%, 0); opacity: 0.35; }
          50%     { transform: translate(-50%, -4px); opacity: 0.6; }
        }
        @keyframes briefPulse {
          0%,100% { opacity: 0.4; }
          50%     { opacity: 1; }
        }
      `}</style>
    </div>);

}

// ═════════════════════════════════════════════════════════════
// Header — date eyebrow + huge time (rolls smoothly) + zoom-out
// ═════════════════════════════════════════════════════════════
function Header({ time, event, isNow, tweaks, onOpenOverview }) {
  return (
    <div style={{
      position: 'absolute', top: 58, left: 30, right: 30,
      zIndex: 5, fontSize: "24px"
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        pointerEvents: 'none'
      }}>
        <div>
          <div style={{
            fontSize: 13, color: INK_DIM,
            letterSpacing: '-0.005em'
          }}>
            Tuesday, May 19
          </div>
          <div style={{
            fontSize: 72, fontWeight: 200,
            lineHeight: 1.0, letterSpacing: '-0.04em',
            color: INK,
            fontVariantNumeric: 'tabular-nums',
            marginTop: 12
          }}>
            {time}
          </div>
        </div>

        {/* Zoom-out → all-day overview. Subtle 4-dot glyph. */}
        <button
          onClick={onOpenOverview}
          aria-label="All day"
          style={{
            pointerEvents: 'auto',
            width: 32, height: 32, borderRadius: 10,
            background: 'transparent',
            border: 'none',
            color: INK, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.55,
            marginTop: 2
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.4" />
            <circle cx="7" cy="2.5" r="1.4" />
            <circle cx="11.5" cy="2.5" r="1.4" />
            <circle cx="2.5" cy="7" r="1.4" />
            <circle cx="7" cy="7" r="1.4" />
            <circle cx="11.5" cy="7" r="1.4" />
            <circle cx="2.5" cy="11.5" r="1.4" />
            <circle cx="7" cy="11.5" r="1.4" />
            <circle cx="11.5" cy="11.5" r="1.4" />
          </svg>
        </button>
      </div>

      {!isNow &&
      <div style={{
        marginTop: 10, fontSize: 11, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: INK_DIM,
        display: 'flex', alignItems: 'center', gap: 8,
        pointerEvents: 'none'
      }}>
          <span style={{
          width: 5, height: 5, borderRadius: '50%', background: INK
        }} />
          Browsing · tap ring for now
        </div>
      }
    </div>);

}

// ═════════════════════════════════════════════════════════════
// Card stage — single card, low in the frame, with ghost peek
// ═════════════════════════════════════════════════════════════
function CardStage({ event, ghost, browseIdx }) {
  const Card = CARDS[event.type];
  return (
    <div style={{
      position: 'absolute', top: 250, left: 0, right: 0, bottom: 280,
      pointerEvents: 'none', // ring + swipe pass through; card has no interactive bits
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '0 24px 0 20px'
    }}>
      <div key={browseIdx}
      style={{
        animation: 'cardIn 420ms cubic-bezier(0.2,0.8,0.2,1)'
      }}>
        <Card event={event} />
      </div>
      {ghost &&
      <div
        key={'g' + browseIdx}
        aria-hidden
        style={{
          marginTop: 24,
          filter: 'blur(2.5px)',
          opacity: 0,
          animation: 'ghostIn 600ms 120ms cubic-bezier(0.2,0.8,0.2,1) forwards',
          transform: 'translateY(0)'
        }}>
          <GhostRow event={ghost} />
        </div>
      }
    </div>);

}

// A pared-down preview row used as the blurred ghost of the next event.
// Same skeleton as CardFrame so the eye reads continuity.
function GhostRow({ event }) {
  return (
    <div>
      <div style={{ height: 1, background: INK_HAIR, marginLeft: 64 }} />
      <div style={{ display: 'flex', gap: 18, paddingTop: 16 }}>
        <div style={{
          width: 46, paddingTop: 6, flexShrink: 0,
          fontSize: 13, color: INK_DIM,
          fontVariantNumeric: 'tabular-nums'
        }}>{fmtTime(event.start)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 36, fontWeight: 200,
            letterSpacing: '-0.025em', lineHeight: 1.02,
            color: INK
          }}>{event.title}</div>
        </div>
      </div>
    </div>);

}

// ═════════════════════════════════════════════════════════════
// Ring zone — wraps RingControl + tiny status labels
// ═════════════════════════════════════════════════════════════
function RingZone({ events, nowIdx, browseIdx, setBrowseIdx, onTapNow, onHoldAI, aiActive, size }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 32,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      zIndex: 10
    }}>
      <RingControl
        events={events}
        nowIdx={nowIdx}
        browseIdx={browseIdx}
        setBrowseIdx={setBrowseIdx}
        onTapNow={onTapNow}
        onHoldAI={onHoldAI}
        aiActive={aiActive}
        size={size} />
      
    </div>);

}

// Tiny tick row above the ring — sequence affordance, can be hidden.
function SequenceTicks({ shown, total, idx, nowIdx }) {
  if (!shown) return null;
  return (
    <div style={{
      position: 'absolute', left: 30, right: 30, bottom: 224,
      display: 'flex', gap: 4, pointerEvents: 'none', zIndex: 4
    }}>
      {Array.from({ length: total }).map((_, i) =>
      <div key={i} style={{
        flex: 1, height: 1.5, borderRadius: 1,
        background: i === idx ? INK :
        i === nowIdx ? 'rgba(26,26,24,0.55)' :
        'rgba(26,26,24,0.14)',
        transition: 'background 220ms cubic-bezier(0.2,0.8,0.2,1)'
      }} />
      )}
    </div>);

}

// ═════════════════════════════════════════════════════════════
// Directional swipe handling
// ═════════════════════════════════════════════════════════════
// Invisible catcher fills the viewport; it ignores pointers landing on
// the ring (which has its own gestures). A clear vertical swipe up
// triggers Creation Mode; a clear swipe down opens the Daily Briefing;
// a clear swipe left opens the People tab.
function SwipeCatcher({ onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const onDown = (e) => {
    if (e.target.closest('[data-ring]')) return;
    tracking.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
  };
  const onMove = (e) => {
    if (!tracking.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const ax = Math.abs(dx),ay = Math.abs(dy);
    if (ax > ay) {
      if (dx < -64) {tracking.current = false;onSwipeLeft?.();} else
      if (dx > 64) {tracking.current = false;onSwipeRight?.();}
    } else {
      if (dy < -64) {tracking.current = false;onSwipeUp?.();} else
      if (dy > 64) {tracking.current = false;onSwipeDown?.();}
    }
  };
  const stop = () => {tracking.current = false;};

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      style={{
        position: 'absolute', inset: 0, zIndex: 1,
        touchAction: 'pan-y'
      }} />);


}

// Edge hints — tiny lines top + bottom suggesting the two pull gestures.
function EdgeHints({ shown }) {
  if (!shown) return null;
  return (
    <>
      <div style={{
        position: 'absolute', left: '50%', top: 8,
        width: 36, height: 3, borderRadius: 1.5,
        background: 'rgba(26,26,24,0.14)',
        transform: 'translateX(-50%)',
        zIndex: 6, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', left: '50%', bottom: 6,
        width: 56, height: 4, borderRadius: 2,
        background: 'rgba(26,26,24,0.18)',
        animation: 'swipeHint 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
        zIndex: 6, pointerEvents: 'none',
        transform: 'translate(-50%, 0)'
      }} />
    </>);

}

// ═════════════════════════════════════════════════════════════
// AI overlay — opens on ring hold; minimal, paper-on-paper sheet
// ═════════════════════════════════════════════════════════════
function AIOverlay({ open, event, onClose }) {
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('listening'); // listening|thinking|answer
  const prompts = SUGGESTED_PROMPTS[event.type] || [];

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setTranscript('');setAnswer('');setPhase('listening');
      }, 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  const ask = async (text) => {
    setTranscript(text);
    setPhase('thinking');
    try {
      const resp = await window.claude.complete({
        messages: [{
          role: 'user',
          content: `You are Doodle's calendar AI. The user is on event "${event.title}" (${fmtTime(event.start)}–${fmtTime(event.end)}). Context: ${event.subtitle || ''}. Question: "${text}". Reply in 1–2 short declarative sentences. Calm, warm, no filler, British English, no emoji.`
        }]
      });
      setAnswer(resp);
      setPhase('answer');
    } catch {
      setAnswer('I can’t reach my brain just now. Try again in a moment.');
      setPhase('answer');
    }
  };

  return (
    <div
      aria-hidden={!open}
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        background: 'rgba(239,237,231,0.78)',
        backdropFilter: 'blur(16px) saturate(1.05)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.05)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 280ms cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column'
      }}
      onClick={(e) => {
        // Tap outside the content closes
        if (e.target === e.currentTarget) onClose();
      }}>
      
      {/* Header: paper-thin */}
      <div style={{
        padding: '58px 30px 0', display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_DIM }}>
            {phase === 'listening' ? 'Listening' : phase === 'thinking' ? 'Thinking' : 'Doodle AI'}
          </div>
          <div style={{
            marginTop: 8, fontSize: 22, fontWeight: 300,
            color: INK, letterSpacing: '-0.015em', maxWidth: 280
          }}>
            About <span style={{ fontFamily: '"Noto Serif",serif', fontStyle: 'italic' }}>{event.title.toLowerCase()}</span>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'transparent', border: `1px solid ${INK_FAINT}`,
          color: INK, cursor: 'pointer', fontSize: 14, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>×</button>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, padding: '30px 30px 0', display: 'flex',
        flexDirection: 'column', justifyContent: 'flex-end',
        animation: open ? 'overlayIn 380ms cubic-bezier(0.2,0.8,0.2,1)' : 'none'
      }}>
        {/* Iridescent orb (mirrors the ring's center) */}
        <div style={{
          alignSelf: 'center', position: 'relative',
          width: 120, height: 120, marginBottom: 26
        }}>
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 120, height: 120, borderRadius: '50%',
            background:
            'radial-gradient(circle at 30% 32%, #d6eedd 0%, transparent 55%),' +
            'radial-gradient(circle at 72% 38%, #e3d0eb 0%, transparent 55%),' +
            'radial-gradient(circle at 65% 75%, #f0c9d6 0%, transparent 55%),' +
            'radial-gradient(circle at 28% 72%, #cad8eb 0%, transparent 60%),' +
            'radial-gradient(circle at 50% 50%, #ece5f0 0%, #e5dceb 80%)',
            boxShadow: '0 14px 40px -10px rgba(180,140,210,0.45), inset 0 0 0 1px rgba(255,255,255,0.5)',
            animation: 'orbBreathe 3.2s ease-in-out infinite'
          }} />
        </div>

        {/* Waveform or transcript */}
        {phase === 'listening' &&
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 26 }}>
            {[0.6, 0.9, 1.2, 0.8, 1.4, 1.0, 0.7, 1.3, 0.9, 0.5, 1.1].map((h, i) =>
          <div key={i} style={{
            width: 3, height: 36 * h, borderRadius: 2, background: INK,
            opacity: 0.85,
            animation: `waveBar ${0.7 + i % 4 * 0.12}s ease-in-out ${i * 0.06}s infinite`,
            transformOrigin: 'center'
          }} />
          )}
          </div>
        }

        {transcript &&
        <div style={{
          fontFamily: '"Noto Serif", serif', fontStyle: 'italic',
          fontSize: 22, lineHeight: 1.32, color: INK,
          letterSpacing: '-0.01em', marginBottom: 18, textAlign: 'center',
          maxWidth: 320, alignSelf: 'center'
        }}>
            “{transcript}”
          </div>
        }

        {phase === 'thinking' &&
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 26 }}>
            {[0, 1, 2].map((i) =>
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: INK,
            animation: `pulse 1.2s ${i * 0.15}s ease-in-out infinite`
          }} />
          )}
          </div>
        }

        {phase === 'answer' &&
        <div style={{
          fontSize: 17, lineHeight: 1.45, color: INK,
          letterSpacing: '-0.005em', textAlign: 'center',
          maxWidth: 320, alignSelf: 'center', marginBottom: 26
        }}>
            {answer}
          </div>
        }

        {/* Suggested prompts */}
        {phase === 'listening' &&
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 36 }}>
            {prompts.map((p, i) =>
          <button key={i} onClick={() => ask(p)} style={{
            fontSize: 12, padding: '8px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.55)',
            border: `1px solid ${INK_FAINT}`, color: INK,
            cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '-0.005em'
          }}>{p}</button>
          )}
          </div>
        }

        {phase === 'answer' &&
        <button onClick={onClose} style={{
          alignSelf: 'center', marginBottom: 36,
          padding: '9px 16px', borderRadius: 999,
          background: INK, color: '#EFEDE7',
          border: 'none', cursor: 'pointer', fontSize: 13,
          fontFamily: 'inherit', letterSpacing: '-0.005em'
        }}>Close</button>
        }
      </div>
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

const tweakBtn = {
  flex: 1, fontSize: 11, padding: '7px 10px', borderRadius: 8,
  background: 'rgba(0,0,0,0.06)', color: '#0E0E0E',
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  letterSpacing: '-0.005em'
};