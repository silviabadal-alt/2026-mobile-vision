// people.jsx — Layered network view of "your people".
//
// Layout idea: a small constellation of group/person nodes sit at different
// depths in a flat 2D layout. Each node has a (x, y, depth) — depth drives
// scale, opacity and blur so the scene reads as a soft 3D arrangement on
// a paper-white plane.
//
// Interaction model:
//   · Tap a node           → it becomes the focus (scene re-centers on it).
//   · Tap an already-focused
//     group                → drills into that group (its members become the
//                            new scene; its first child becomes the focus).
//   · Tap an already-focused
//     person               → expands a detail card in place.
//   · Tap empty background → step back: first unfocus, then pop one level,
//                            and finally close the People view.
//
// Visual language:
//   · Paper background, hairline strokes, soft drop shadows.
//   · Focused node gets a BASADA halo (matches Doodle design system).
//   · Connection lines (dashed hairlines) radiate from the focused node.
//   · Idle far-back nodes are blurred + faded — depth, not flat overlap.

const PINK   = '#E8DAF0';
const SAGE   = '#D6E8DD';
const SAND   = '#EBE0CF';
const SKY    = '#D6E0EB';
const ROSE   = '#E5D6CE';
const LILAC  = '#DCD4EC';

const BASADA = '#BA5ADA';

// ─────────────────────────────────────────────────────────────
// Data — your network for today.
// ─────────────────────────────────────────────────────────────
const PEOPLE_NETWORK = {
  id: 'org', label: 'Doodle', kind: 'root',
  children: [
    {
      id: 'around', label: 'People Around', kind: 'group',
      hint: 'On your calendar today',
      children: [
        { id:'tom',   name:'Tom Becker',   initial:'T', role:'Coffee · 08:30',     accent: PINK  },
        { id:'maria', name:'Maria Vega',   initial:'M', role:'1:1 · 14:30',        accent: SAGE  },
        { id:'jens',  name:'Jens Fahnström', initial:'J', role:'Design review',    accent: SAND  },
        { id:'anna',  name:'Anna Chen',    initial:'A', role:'Northwind · 15:30',  accent: ROSE  },
      ],
    },
    {
      id: 'leadership', label: 'Leadership', kind: 'group',
      hint: '3 people',
      children: [
        { id:'renato', name:'Renato Profico', initial:'R', role:'Chief Executive',   accent: LILAC },
        { id:'monica', name:'Monica Vega',    initial:'M', role:'Chief Operating',   accent: SAGE  },
        { id:'tomf',   name:'Tom Friedli',    initial:'T', role:'Chief Technology',  accent: SAND  },
      ],
    },
    {
      id: 'directors', label: 'Directors', kind: 'group',
      hint: '4 people',
      children: [
        { id:'christian', name:'Christian Lang', initial:'C', role:'Engineering',  accent: SKY   },
        { id:'sara',      name:'Sara Wilkins',   initial:'S', role:'Marketing',    accent: SAND  },
        { id:'anders',    name:'Anders Lund',    initial:'A', role:'Design',       accent: PINK  },
        { id:'jules',     name:'Jules Berg',     initial:'J', role:'Finance',      accent: SAGE  },
      ],
    },
    {
      id: 'pms', label: 'PMs', kind: 'group',
      hint: '4 people',
      children: [
        { id:'kim',   name:'Kim Sato',    initial:'K', role:'Mobile',    accent: ROSE  },
        { id:'lukas', name:'Lukas Wirth', initial:'L', role:'Web',       accent: SKY   },
        { id:'eli',   name:'Eli Brun',    initial:'E', role:'Platform',  accent: PINK  },
        { id:'nora',  name:'Nora Akel',   initial:'N', role:'Growth',    accent: SAGE  },
      ],
    },
    {
      id: 'design', label: 'Design', kind: 'group',
      hint: '4 people',
      children: [
        { id:'mahdi',  name:'Mahdi Mohrehchi', initial:'M', role:'Senior Designer', accent: PINK  },
        { id:'jordan', name:'Jordan Reyes',    initial:'J', role:'Brand',           accent: SAND  },
        { id:'iris',   name:'Iris Park',       initial:'I', role:'Research',        accent: SAGE  },
        { id:'pia',    name:'Pia Soller',      initial:'P', role:'Motion',          accent: ROSE  },
      ],
    },
    {
      id: 'engineering', label: 'Engineering', kind: 'group',
      hint: '5 people',
      children: [
        { id:'sami', name:'Sami Voss',   initial:'S', role:'Backend',  accent: SKY   },
        { id:'hugo', name:'Hugo Mette',  initial:'H', role:'iOS',      accent: PINK  },
        { id:'yuki', name:'Yuki Tanaka', initial:'Y', role:'Web',      accent: SAGE  },
        { id:'dan',  name:'Dan Olin',    initial:'D', role:'Platform', accent: SAND  },
        { id:'aino', name:'Aino Ranta',  initial:'A', role:'Mobile',   accent: ROSE  },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Layouts — scatter positions per child count.
// Each position is {x%, y%, depth} where depth 0 = closest, 1 = furthest.
// Hand-tuned for a 402×874 viewport, with the focus zone around 50/45.
// ─────────────────────────────────────────────────────────────
const LAYOUTS = {
  3: [
    { x: 30, y: 30, depth: 0.0 },
    { x: 68, y: 32, depth: 0.3 },
    { x: 50, y: 62, depth: 0.5 },
  ],
  4: [
    { x: 28, y: 24, depth: 0.0 },
    { x: 70, y: 30, depth: 0.2 },
    { x: 25, y: 64, depth: 0.35 },
    { x: 68, y: 68, depth: 0.5 },
  ],
  5: [
    { x: 26, y: 22, depth: 0.0 },
    { x: 70, y: 28, depth: 0.2 },
    { x: 50, y: 50, depth: 0.55 },
    { x: 22, y: 70, depth: 0.3 },
    { x: 72, y: 72, depth: 0.45 },
  ],
  6: [
    { x: 22, y: 18, depth: 0.0  },  // People Around — front-most
    { x: 50, y: 42, depth: 0.55 },  // Leadership — middle, faded back
    { x: 76, y: 28, depth: 0.15 },  // PMs
    { x: 24, y: 60, depth: 0.25 },  // Directors
    { x: 60, y: 64, depth: 0.35 },  // Design
    { x: 80, y: 78, depth: 0.5  },  // Engineering
  ],
};
function getLayout(n) {
  if (LAYOUTS[n]) return LAYOUTS[n];
  // Fallback: distribute around a circle if we ever exceed handcrafted layouts.
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI/2;
    return { x: 50 + Math.cos(a) * 25, y: 45 + Math.sin(a) * 22, depth: (i % 3) * 0.2 };
  });
}

// Ambient empty orbs — purely decorative depth cues that don't react to taps.
const AMBIENT_ORBS = [
  { x: 46, y: 30, r: 14, depth: 0.6 },
  { x: 15, y: 44, r: 10, depth: 0.7 },
  { x: 86, y: 50, r: 8,  depth: 0.8 },
  { x: 44, y: 76, r: 12, depth: 0.65 },
];

// ─────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────
function PeopleView({ open, onClose }) {
  const [history, setHistory] = React.useState([]);   // stack of parent contexts
  const [currentNode, setCurrentNode] = React.useState(PEOPLE_NETWORK);
  const [focusId, setFocusId] = React.useState('around');
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Reset when fully closed (after the slide-out animation finishes).
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setHistory([]);
        setCurrentNode(PEOPLE_NETWORK);
        setFocusId('around');
        setDetailOpen(false);
      }, 440);
      return () => clearTimeout(t);
    }
  }, [open]);

  const children = currentNode.children || [];
  const layout = React.useMemo(() => getLayout(children.length), [children.length]);
  const focusIdx = children.findIndex(c => c.id === focusId);
  const focusPos = focusIdx >= 0 ? layout[focusIdx] : { x: 50, y: 45 };

  // Camera shift to keep focused node centered on the screen.
  // Translate the world container in percentage units of itself.
  const camX = 50 - focusPos.x;
  const camY = 42 - focusPos.y;
  // Zoom in slightly when focused, zoom out when wandering (no focus).
  const camScale = focusIdx >= 0 ? 1 : 0.92;

  const focused = focusIdx >= 0 ? children[focusIdx] : null;

  const handleNodeTap = (child) => {
    setDetailOpen(false);
    if (focusId === child.id) {
      const isGroup = (child.children?.length || 0) > 0;
      if (isGroup) {
        // Drill into group
        setHistory(h => [...h, { node: currentNode, focusId }]);
        setCurrentNode(child);
        setFocusId(child.children[0].id);
      } else {
        // Person → open detail
        setDetailOpen(true);
      }
    } else {
      setFocusId(child.id);
    }
  };

  const handleBackgroundTap = () => {
    if (detailOpen) { setDetailOpen(false); return; }
    if (focusId) { setFocusId(null); return; }
    if (history.length) {
      const last = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setCurrentNode(last.node);
      setFocusId(last.focusId);
      return;
    }
    onClose?.();
  };

  // Breadcrumb labels for the header.
  const trail = [
    ...history.map(h => h.node === PEOPLE_NETWORK ? null : h.node.label),
    currentNode === PEOPLE_NETWORK ? null : currentNode.label,
  ].filter(Boolean);

  return (
    <div
      aria-hidden={!open}
      style={{
        position: 'absolute', inset: 0, zIndex: 25,
        background: '#F4F2EC',
        backgroundImage:
          'radial-gradient(ellipse at 50% 35%, #FAF8F2 0%, #F4F2EC 50%, #ECE9E1 100%)',
        transform: open ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)',
        transition: 'transform 440ms cubic-bezier(0.2,0.8,0.2,1)',
        willChange: 'transform',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#1a1a18',
      }}
    >
      {/* Background tap layer (sits behind nodes, catches "outside" taps) */}
      <div
        onClick={handleBackgroundTap}
        style={{ position: 'absolute', inset: 0, cursor: 'default', zIndex: 1 }}
      />

      {/* Header */}
      <PeopleHeader
        currentNode={currentNode}
        rootLabel={PEOPLE_NETWORK.label}
        trail={trail}
        focused={focused}
        onClose={onClose}
      />

      {/* The "world" — translates so focused node is centered. */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${camX}%, ${camY}%) scale(${camScale})`,
        transformOrigin: '50% 42%',
        transition: 'transform 560ms cubic-bezier(0.2,0.8,0.2,1)',
        pointerEvents: 'none',
      }}>
        {/* Ambient empty orbs */}
        {AMBIENT_ORBS.map((o, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${o.x}%`, top: `${o.y}%`,
            width: o.r * 2, height: o.r * 2,
            marginLeft: -o.r, marginTop: -o.r,
            borderRadius: '50%',
            background: 'rgba(26,26,24,0.025)',
            border: '1px solid rgba(26,26,24,0.04)',
            filter: `blur(${o.depth * 1.2}px)`,
            opacity: 0.7,
            pointerEvents: 'none',
          }}/>
        ))}

        {/* Connection lines from focus → others */}
        <svg
          width="100%" height="100%"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          {focusIdx >= 0 && layout.map((p, i) => {
            if (i === focusIdx) return null;
            const fp = layout[focusIdx];
            return (
              <line
                key={i}
                x1={`${fp.x}%`} y1={`${fp.y}%`}
                x2={`${p.x}%`}  y2={`${p.y}%`}
                stroke="rgba(26,26,24,0.10)"
                strokeWidth="0.75"
                strokeDasharray="2 4"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {children.map((child, i) => {
          const p = layout[i];
          const isFocused = focusId === child.id;
          return (
            <NodeCard
              key={child.id}
              child={child}
              x={p.x} y={p.y}
              depth={p.depth}
              isFocused={isFocused}
              onTap={() => handleNodeTap(child)}
            />
          );
        })}
      </div>

      {/* Person detail card — overlays the focused person */}
      {detailOpen && focused && !focused.children && (
        <PersonDetail person={focused} onClose={() => setDetailOpen(false)} />
      )}

      {/* Back affordance — only shown when there's somewhere to go back to */}
      <BackHint
        canPop={history.length > 0 || focusIdx >= 0 || detailOpen}
        label={
          detailOpen        ? 'Tap outside to close' :
          focusIdx >= 0     ? 'Tap outside to step back' :
          history.length    ? 'Tap outside to go up' : ''
        }
      />

      {/* Subtle edge hint — left edge curl suggesting "swipe right back to Day" */}
      <LeftEdgeHint shown={open && !detailOpen} />

      <style>{`
        @keyframes peopleFocusRing {
          from { transform: translate(-50%,-50%) scale(0.9); opacity: 0; }
          to   { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
        }
        @keyframes peopleDetailIn {
          from { opacity: 0; transform: translate(-50%, -42%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes peopleHeaderIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header — eyebrow + breadcrumb-ish title + focused label
// ─────────────────────────────────────────────────────────────
function PeopleHeader({ currentNode, rootLabel, trail, focused, onClose }) {
  const atRoot = currentNode.label === rootLabel || currentNode.kind === 'root';
  return (
    <div style={{
      position: 'absolute', top: 58, left: 30, right: 30, zIndex: 20,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(26,26,24,0.45)',
          }}>
            People · Tuesday
          </div>
          <div
            key={currentNode.id}
            style={{
              marginTop: 8, fontSize: 28, fontWeight: 200,
              letterSpacing: '-0.025em', lineHeight: 1.05, color: '#1a1a18',
              animation: 'peopleHeaderIn 380ms cubic-bezier(0.2,0.8,0.2,1)',
            }}
          >
            {atRoot ? (
              <>
                Your{' '}
                <span style={{ fontFamily: '"Noto Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>
                  network
                </span>
                {' '}today
              </>
            ) : (
              <>
                <span style={{ fontFamily: '"Noto Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>
                  {currentNode.label}
                </span>
              </>
            )}
          </div>
          {trail.length > 1 && (
            <div style={{
              marginTop: 6, fontSize: 11, color: 'rgba(26,26,24,0.45)',
              letterSpacing: '-0.005em',
            }}>
              {trail.slice(0, -1).join(' · ')}
            </div>
          )}
        </div>

        {/* Back-to-Day button (right edge) — also reachable via swipe-right */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          aria-label="Back to Day"
          style={{
            pointerEvents: 'auto',
            width: 32, height: 32, borderRadius: 10,
            background: 'transparent', border: 'none',
            color: '#1a1a18', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.55,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 11 4.5 7l4-4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Node card — a circle that holds either a group preview or a
// single big monogram. Scale/opacity/blur are driven by `depth`
// and `isFocused`. Label sits below.
// ─────────────────────────────────────────────────────────────
function NodeCard({ child, x, y, depth, isFocused, onTap }) {
  const isGroup = (child.children?.length || 0) > 0;
  const base = 132; // base diameter in px
  const focusedScale = 1.32;
  const idleScale = 0.58 + (1 - depth) * 0.28;  // 0.58–0.86
  const scale = isFocused ? focusedScale : idleScale;
  const opacity = isFocused ? 1 : 0.42 + (1 - depth) * 0.38;
  const blurPx = isFocused ? 0 : depth * 1.2;
  // z-index: focused on top, then closer (less depth) on top of further.
  const z = isFocused ? 100 : Math.round(50 - depth * 40);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onTap(); }}
      style={{
        position: 'absolute',
        left: `${x}%`, top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        filter: blurPx ? `blur(${blurPx}px)` : 'none',
        transition:
          'transform 560ms cubic-bezier(0.2,0.8,0.2,1), ' +
          'opacity 380ms cubic-bezier(0.2,0.8,0.2,1), ' +
          'filter 380ms cubic-bezier(0.2,0.8,0.2,1)',
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer',
        zIndex: z,
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* The disc itself */}
      <div style={{
        position: 'relative',
        width: base, height: base, borderRadius: '50%',
        background: isFocused
          ? 'rgba(255,255,255,0.88)'
          : 'rgba(255,255,255,0.55)',
        border: isFocused
          ? `1px solid rgba(186,90,218,0.35)`
          : '1px solid rgba(26,26,24,0.07)',
        boxShadow: isFocused
          ? '0 28px 60px -22px rgba(186,90,218,0.30), 0 14px 28px -10px rgba(26,26,24,0.18)'
          : '0 14px 32px -14px rgba(26,26,24,0.20), 0 4px 10px -4px rgba(26,26,24,0.08)',
        backdropFilter: 'blur(8px) saturate(1.05)',
        WebkitBackdropFilter: 'blur(8px) saturate(1.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isGroup ? <GroupCluster child={child} /> : <PersonMono child={child} />}

        {/* Focus halo */}
        {isFocused && (
          <span
            aria-hidden
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: base + 14, height: base + 14, borderRadius: '50%',
              border: `1px solid ${BASADA}55`,
              boxShadow: `0 0 0 6px ${BASADA}12`,
              transform: 'translate(-50%,-50%)',
              animation: 'peopleFocusRing 480ms cubic-bezier(0.2,0.8,0.2,1)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Label (always below) */}
      <div style={{
        marginTop: 12,
        textAlign: 'center',
        fontSize: isFocused ? 15 : 13,
        fontWeight: isFocused ? 400 : 300,
        letterSpacing: '-0.005em',
        color: isFocused ? '#1a1a18' : 'rgba(26,26,24,0.62)',
        transition: 'all 380ms cubic-bezier(0.2,0.8,0.2,1)',
        whiteSpace: 'nowrap',
      }}>
        {child.label || child.name}
      </div>

      {/* Sub-label on focus */}
      {isFocused && (
        <div style={{
          marginTop: 2, textAlign: 'center',
          fontSize: 12, color: 'rgba(26,26,24,0.5)',
          fontFamily: '"Noto Serif", serif', fontStyle: 'italic',
          letterSpacing: '-0.005em',
        }}>
          {child.role || child.hint || ''}
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Group cluster — 3 small monogram discs sitting inside the
// parent disc, offset to feel like a tiny pile of people.
// ─────────────────────────────────────────────────────────────
function GroupCluster({ child }) {
  const members = (child.children || []).slice(0, 3);
  // Hand-tuned positions inside the parent disc (in % of disc bounds).
  const slots = [
    { top: '14%', left: '32%', size: 50, z: 3 }, // up
    { top: '46%', left: '12%', size: 40, z: 2 }, // bot-left
    { top: '54%', left: '52%', size: 32, z: 1 }, // bot-right
  ];
  return (
    <div style={{
      position: 'relative', width: '78%', height: '78%',
    }}>
      {slots.slice(0, members.length).map((s, i) => {
        const m = members[i];
        return (
          <div key={m.id} style={{
            position: 'absolute',
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: m.accent || PINK,
            border: '2px solid rgba(255,255,255,0.92)',
            boxShadow: '0 4px 10px -4px rgba(26,26,24,0.25)',
            zIndex: s.z,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: s.size * 0.38, fontWeight: 500,
            color: 'rgba(26,26,24,0.75)',
            letterSpacing: '-0.01em',
          }}>
            {m.initial}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Person monogram — a single round accent disc with the initial.
// Inner highlight + soft accent gives a hint of dimensionality
// without resorting to a fake photo.
// ─────────────────────────────────────────────────────────────
function PersonMono({ child }) {
  return (
    <div style={{
      width: '74%', height: '74%', borderRadius: '50%',
      background: child.accent || PINK,
      backgroundImage:
        `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.55), transparent 55%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 32, fontWeight: 500,
      color: 'rgba(26,26,24,0.78)',
      letterSpacing: '-0.015em',
      boxShadow:
        'inset 0 -6px 14px rgba(26,26,24,0.06), ' +
        'inset 0 2px 6px rgba(255,255,255,0.45)',
    }}>
      {child.initial || (child.name?.[0] ?? '')}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Person detail — a small floating card centered on screen,
// shown after tapping an already-focused person.
// ─────────────────────────────────────────────────────────────
function PersonDetail({ person, onClose }) {
  return (
    <div
      role="dialog"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 280,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(14px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
        border: '1px solid rgba(26,26,24,0.08)',
        borderRadius: 18,
        boxShadow:
          '0 36px 80px -28px rgba(26,26,24,0.32), ' +
          '0 12px 28px -10px rgba(26,26,24,0.18)',
        padding: '22px 22px 20px',
        zIndex: 200,
        animation: 'peopleDetailIn 380ms cubic-bezier(0.2,0.8,0.2,1)',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: person.accent || PINK,
          backgroundImage:
            `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.55), transparent 55%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 500, color: 'rgba(26,26,24,0.78)',
          flexShrink: 0,
        }}>
          {person.initial}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 18, fontWeight: 400, letterSpacing: '-0.015em',
            color: '#1a1a18', lineHeight: 1.15,
          }}>
            {person.name}
          </div>
          <div style={{
            marginTop: 3,
            fontSize: 12, color: 'rgba(26,26,24,0.55)',
            fontFamily: '"Noto Serif", serif', fontStyle: 'italic',
          }}>
            {person.role}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(26,26,24,0.08)', margin: '18px 0 14px' }}/>

      <div style={{
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(26,26,24,0.45)', marginBottom: 8,
      }}>
        Today
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.45, color: '#1a1a18' }}>
        You share <span style={{ fontFamily: '"Noto Serif", serif', fontStyle: 'italic' }}>one meeting</span> with {person.name.split(' ')[0]} today.
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 999,
            background: '#1a1a18', color: '#EFEDE7',
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12,
            letterSpacing: '-0.005em',
          }}
        >
          Schedule
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 999,
            background: 'transparent', color: '#1a1a18',
            border: '1px solid rgba(26,26,24,0.18)', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12,
            letterSpacing: '-0.005em',
          }}
        >
          Message
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// A tiny pill near the bottom hinting at how to step back —
// only shown when there *is* a back step available.
// ─────────────────────────────────────────────────────────────
function BackHint({ canPop, label }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 38,
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      opacity: canPop ? 0.55 : 0,
      transition: 'opacity 280ms cubic-bezier(0.2,0.8,0.2,1)',
      zIndex: 15,
    }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(26,26,24,0.6)',
      }}>
        {label}
      </div>
    </div>
  );
}

// Left-edge hint — vertical hairline indicating swipe-right returns to Day.
function LeftEdgeHint({ shown }) {
  if (!shown) return null;
  return (
    <div style={{
      position: 'absolute', left: 4, top: '50%',
      transform: 'translateY(-50%)',
      width: 3, height: 56, borderRadius: 2,
      background: 'rgba(26,26,24,0.10)',
      pointerEvents: 'none',
      zIndex: 6,
    }}/>
  );
}

// Expose for app.jsx (scopes are per-script under Babel).
window.PeopleView = PeopleView;
