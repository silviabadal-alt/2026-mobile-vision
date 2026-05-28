// creation.jsx — Swipe-up creation canvas, now a progressive project builder.
//
// Empty state: a calm gridded canvas with a few floating intent chips.
// Once the user picks "project" (or describes one), the canvas becomes a
// document-like stack that builds up step by step:
//
//   01 · Name        → big editable title
//   02 · Who         → people row + suggestions
//   03 · Tasks       → editable list + AI-suggested chips
//   04 · When        → mini week strip with deadlines per task
//   05 · Snapshot    → progress + connected-elements summary
//
// Each step reveals as the previous one is filled in. The whole thing
// reads as a single Swiss document the user is co-writing with the AI,
// not as a form.

const { useState: useStateCR, useRef: useRefCR, useEffect: useEffectCR, useMemo: useMemoCR } = React;

const CC = {
  paper:    '#FAFAF6',
  ink:      '#1a1a18',
  inkDim:   'rgba(26,26,24,0.45)',
  inkSoft:  'rgba(26,26,24,0.28)',
  faint:    'rgba(26,26,24,0.18)',
  hair:     'rgba(26,26,24,0.08)',
  veryFaint:'rgba(26,26,24,0.04)',
  accent:   '#7B66E0',
};

// ──── Suggested content per prompt ──────────────────────────────────
const PROJECT_TEMPLATES = {
  board: {
    name:'Board meeting · Q3',
    people: ['Mahdi','Maria','Sara','Tom','Anna'],
    tasks: [
      'Draft pre-read (6 pp.)',
      'Build slide deck (12 slides)',
      'Mahdi reviews deck',
      'Sara sign-off',
      'Send agenda 24 h before',
      'Capture follow-ups',
    ],
    days: [0, 0, 2, 3, 3, 4],
  },
  workflow: {
    name:'Onboarding workflow',
    people:['Maria','Jens','Kim'],
    tasks:[
      'Welcome email template',
      'Setup call agenda',
      'First-week task list',
      '7-day check-in survey',
      'Manager handoff doc',
    ],
    days:[0,1,2,4,5],
  },
  meeting: {
    name:'Weekly product sync',
    people:['Maria','Jens','Tom'],
    tasks:[
      'Agenda doc',
      'Last-week notes',
      'Action items review',
      'Send invite + room',
    ],
    days:[0,0,1,1],
  },
  prototype: {
    name:'Prototype · Board meeting',
    people:['Mahdi','Maria'],
    tasks:[
      'Wireframe (low-fi)',
      'Get Mahdi’s direction',
      'Hi-fi screens',
      'Demo cut',
    ],
    days:[1,2,3,4],
  },
};

function guessIntentCR(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('board')) return 'board';
  if (t.includes('prototype')) return 'prototype';
  if (t.includes('onboard') || t.includes('workflow')) return 'workflow';
  if (t.includes('meeting') || t.includes('sync')) return 'meeting';
  return 'prototype';
}

// ═════════════════════════════════════════════════════════════
// Top-level
// ═════════════════════════════════════════════════════════════
function CreationMode({ open, onClose }) {
  const [prompt, setPrompt]       = useStateCR('');
  const [project, setProject]     = useStateCR(null);   // when set, we're in build mode
  const [generating, setGenerating] = useStateCR(false);
  const [step, setStep]           = useStateCR(1);      // 1..5; auto-advances
  const scrollRef = useRefCR(null);
  const inputRef  = useRefCR(null);

  // Reset on close
  useEffectCR(() => {
    if (!open) {
      const t = setTimeout(() => {
        setPrompt(''); setProject(null); setGenerating(false); setStep(1);
      }, 360);
      return () => clearTimeout(t);
    } else {
      setTimeout(() => inputRef.current?.focus(), 420);
    }
  }, [open]);

  // Submit prompt → AI "generates" a project skeleton
  const submit = (text) => {
    if (!text.trim()) return;
    setPrompt(text);
    setGenerating(true);
    setTimeout(() => {
      const key = guessIntentCR(text);
      const tpl = PROJECT_TEMPLATES[key];
      setProject({
        name: tpl.name,
        people: tpl.people.map((n,i) => ({ id:i, name:n, picked:true })),
        tasks: tpl.tasks.map((t,i) => ({ id:i, text:t, day:tpl.days[i]||0, done:false })),
      });
      setGenerating(false);
      setStep(2);   // jump past the name once filled
      // scroll to top so user sees the build animate in
      scrollRef.current?.scrollTo({ top: 0, behavior:'smooth' });
    }, 700);
  };

  const advance = () => setStep(s => Math.min(5, s + 1));
  const goto    = (s) => setStep(s);

  return (
    <div style={{
      position:'absolute', inset: 0, zIndex: 40,
      background: CC.paper,
      transform: `translateY(${open ? 0 : 100}%)`,
      transition: 'transform 520ms cubic-bezier(0.2,0.8,0.2,1)',
      overflow:'hidden',
      fontFamily:'Inter, system-ui, sans-serif',
      color: CC.ink,
    }}>
      {/* Top bar — eyebrow + close */}
      <TopBar project={project} step={step} onJump={goto} onClose={onClose}/>

      {/* Scroll area */}
      <div ref={scrollRef} style={{
        position:'absolute', top: 92, left: 0, right: 0, bottom: 92,
        overflowY:'auto', overflowX:'hidden',
        padding:'0 26px 24px',
      }}>
        {!project && (
          <EmptyCanvas onChip={(c) => submit(c)} generating={generating}/>
        )}
        {project && (
          <ProjectStack
            project={project}
            setProject={setProject}
            step={step}
            advance={advance}
            goto={goto}
          />
        )}
      </div>

      {/* Bottom prompt bar */}
      <div style={{
        position:'absolute', bottom: 0, left: 0, right: 0,
        padding:'14px 22px 26px',
        background: `linear-gradient(to top, ${CC.paper} 70%, transparent)`,
      }}>
        <PromptBar
          ref={inputRef}
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => submit(prompt)}
          busy={generating}
          project={project}
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Top bar — eyebrow with current step / project name and dots
// ═════════════════════════════════════════════════════════════
function TopBar({ project, step, onJump, onClose }) {
  const labels = ['Describe','Name','Who','Tasks','When','Snapshot'];
  return (
    <div style={{
      position:'absolute', top: 0, left: 0, right: 0,
      padding:'58px 22px 0',
      zIndex: 5,
      background: CC.paper,
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', flexDirection:'column', gap: 2}}>
          <div style={{fontSize: 10, letterSpacing:'0.18em', textTransform:'uppercase', color: CC.inkDim}}>
            {project ? 'Project' : 'New'}
          </div>
          <div style={{fontSize: 14, fontWeight: 500, letterSpacing:'-0.005em', color: CC.ink}}>
            {project ? project.name : 'What you want to create?'}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          width: 30, height: 30, borderRadius:'50%',
          background:'transparent', border:`1px solid ${CC.faint}`,
          color: CC.ink, cursor:'pointer', fontSize: 14, lineHeight: 1,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>×</button>
      </div>

      {/* step progress — hairline segments */}
      {project && (
        <div style={{
          display:'flex', gap: 4, marginTop: 16, alignItems:'center',
        }}>
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => onJump(i)} style={{
              flex: 1, height: 1.5, borderRadius: 1,
              background: i < step ? CC.ink : i === step ? CC.ink : CC.hair,
              border: 'none', padding: '4px 0', cursor:'pointer',
              backgroundClip: 'content-box',
              transition: 'background 300ms cubic-bezier(0.2,0.8,0.2,1)',
            }}/>
          ))}
          <div style={{
            fontSize: 10, letterSpacing:'0.16em', textTransform:'uppercase',
            color: CC.inkDim, marginLeft: 10,
            fontVariantNumeric:'tabular-nums', minWidth: 52, textAlign:'right',
          }}>
            {String(step).padStart(2,'0')} · {labels[step]}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Empty canvas — floating intent chips on a Swiss grid
// ═════════════════════════════════════════════════════════════
function EmptyCanvas({ onChip, generating }) {
  // Positions tuned to match reference screenshot: chips scattered
  // asymmetrically on the grid, slight cascade from top-left to bottom-right.
  const chips = [
    { label:'meeting',   x: 55, y: 32, size: 'lg' },
    { label:'workflow',  x: 70, y: 50, size: 'lg' },
    { label:'…',         x: 40, y: 62, size: 'md' },
    { label:'project',   x: 24, y: 38, size: 'sm' },
    { label:'board',     x: 72, y: 74, size: 'sm' },
  ];
  const fontSz = { lg:16, md:15, sm:13 };
  const pad    = { lg:'11px 20px', md:'9px 16px', sm:'7px 13px' };

  return (
    <div style={{position:'relative', height: 480, marginTop: 4}}>

      {/* Grid — slightly more visible than before, full coverage */}
      <div style={{
        position:'absolute', inset: 0,
        backgroundImage:
          `linear-gradient(to right, rgba(26,26,24,0.065) 1px, transparent 1px),
           linear-gradient(to bottom, rgba(26,26,24,0.065) 1px, transparent 1px)`,
        backgroundSize:'52px 52px',
        backgroundPosition: '-2px -2px',
      }}/>
      {/* Radial fade on grid edges */}
      <div style={{
        position:'absolute', inset: 0,
        background:
          'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(250,250,246,0.72) 80%, rgba(250,250,246,0.96) 100%)',
        pointerEvents:'none',
      }}/>

      {/* Prompt label — small, centered, slightly high */}
      <div style={{
        position:'absolute', top: 28, left: 0, right: 0,
        textAlign:'center',
        fontSize: 14, color: CC.inkDim,
        letterSpacing:'-0.003em',
        pointerEvents:'none',
      }}>
        What you want to create?
      </div>

      {/* Chips */}
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={() => onChip(c.label === '…' ? 'prototype' : c.label)}
          disabled={generating}
          style={{
            position:'absolute',
            left:`${c.x}%`, top:`${c.y}%`,
            transform:'translate(-50%, -50%)',
            padding: pad[c.size],
            borderRadius: 999,
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border:`1px solid rgba(26,26,24,0.12)`,
            color: CC.ink,
            fontSize: fontSz[c.size],
            fontWeight: c.size === 'lg' ? 400 : 300,
            cursor:'pointer',
            fontFamily:'inherit',
            boxShadow:
              '0 2px 8px -2px rgba(26,26,24,0.06), ' +
              '0 1px 2px rgba(26,26,24,0.04)',
            letterSpacing:'-0.008em',
            animation: `cFloat${i % 5} ${5.6 + i * 0.55}s ease-in-out ${i * 0.18}s infinite`,
            opacity: generating ? 0.3 : 1,
            transition: 'opacity 280ms',
          }}
        >
          {c.label}
        </button>
      ))}

      <style>{`
        @keyframes cFloat0 { 0%,100%{transform:translate(-50%,-54%)} 50%{transform:translate(-50%,-46%)} }
        @keyframes cFloat1 { 0%,100%{transform:translate(-50%,-46%)} 50%{transform:translate(-50%,-54%)} }
        @keyframes cFloat2 { 0%,100%{transform:translate(-50%,-52%)} 50%{transform:translate(-50%,-48%)} }
        @keyframes cFloat3 { 0%,100%{transform:translate(-50%,-48%)} 50%{transform:translate(-50%,-55%)} }
        @keyframes cFloat4 { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(-50%,-44%)} }
      `}</style>

      {generating && (
        <div style={{
          position:'absolute', left:'50%', top:'50%',
          transform:'translate(-50%, -50%)',
          display:'flex', alignItems:'center', gap: 10,
          padding:'11px 18px', borderRadius: 999,
          background:'rgba(255,255,255,0.9)',
          backdropFilter:'blur(8px)',
          WebkitBackdropFilter:'blur(8px)',
          border:`1px solid rgba(26,26,24,0.10)`,
          color: CC.ink, fontSize: 13,
          fontFamily:'inherit',
          boxShadow:'0 6px 20px -6px rgba(26,26,24,0.10)',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius:'50%', background: CC.ink,
            animation:'pulse 1.2s ease-in-out infinite',
          }}/>
          Composing
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Project stack — the build-up document
// ═════════════════════════════════════════════════════════════
function ProjectStack({ project, setProject, step, advance, goto }) {
  return (
    <div style={{paddingTop: 14, display:'flex', flexDirection:'column', gap: 28}}>
      <StepName project={project} setProject={setProject} active={step >= 1}
        onNext={() => goto(Math.max(step, 2))}/>
      {step >= 2 && (
        <StepPeople project={project} setProject={setProject} active={step >= 2}
          onNext={() => goto(Math.max(step, 3))}/>
      )}
      {step >= 3 && (
        <StepTasks project={project} setProject={setProject} active={step >= 3}
          onNext={() => goto(Math.max(step, 4))}/>
      )}
      {step >= 4 && (
        <StepWhen project={project} setProject={setProject} active={step >= 4}
          onNext={() => goto(Math.max(step, 5))}/>
      )}
      {step >= 5 && (
        <StepSnapshot project={project}/>
      )}
    </div>
  );
}

function Eyebrow({ n, label }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing:'0.18em', textTransform:'uppercase',
      color: CC.inkDim, marginBottom: 8,
    }}>
      {String(n).padStart(2,'0')} <span style={{color: CC.inkSoft}}>·</span> {label}
    </div>
  );
}

// ────────── 01 Name ──────────
function StepName({ project, setProject, active, onNext }) {
  return (
    <Section index={1} delay={0}>
      <Eyebrow n={1} label="Name"/>
      <input
        value={project.name}
        onChange={e => setProject({...project, name: e.target.value})}
        onBlur={onNext}
        style={{
          width:'100%', border:'none', background:'transparent',
          fontFamily:'"Noto Serif", serif', fontStyle:'italic',
          fontWeight: 400,
          fontSize: 32, lineHeight: 1.15, letterSpacing:'-0.025em',
          color: CC.ink, outline:'none', padding: 0,
        }}/>
      <div style={{height: 1, background: CC.hair, marginTop: 10}}/>
    </Section>
  );
}

// ────────── 02 Who ──────────
const ROSTER = [
  { id:'mahdi', name:'Mahdi',     role:'PM',     init:'MR' },
  { id:'maria', name:'Maria',     role:'Lead',   init:'MA' },
  { id:'sara',  name:'Sara',      role:'Design', init:'SK' },
  { id:'jens',  name:'Jens',      role:'Eng',    init:'JE' },
  { id:'tom',   name:'Tom',       role:'Sales',  init:'TO' },
  { id:'anna',  name:'Anna',      role:'CS',     init:'AC' },
  { id:'kim',   name:'Kim',       role:'Design', init:'KI' },
  { id:'sami',  name:'Sami',      role:'Data',   init:'SI' },
];

function StepPeople({ project, setProject, onNext }) {
  const picked = useMemoCR(() => new Set(project.people.filter(p=>p.picked).map(p=>p.name)), [project]);
  const toggle = (name) => {
    const exists = project.people.find(p => p.name === name);
    let next;
    if (exists) {
      next = project.people.map(p => p.name === name ? {...p, picked: !p.picked} : p);
    } else {
      next = [...project.people, { id: project.people.length, name, picked: true }];
    }
    setProject({...project, people: next});
  };
  return (
    <Section index={2} delay={120}>
      <Eyebrow n={2} label="Who"/>
      <div style={{fontSize: 17, color: CC.ink, letterSpacing:'-0.005em', marginBottom: 16}}>
        {picked.size === 0 ? 'Just you' : `You and ${picked.size} ${picked.size === 1 ? 'other' : 'others'}`}
      </div>

      {/* selected row */}
      <div style={{display:'flex', flexWrap:'wrap', gap: 8, marginBottom: 14}}>
        {ROSTER.filter(r => picked.has(r.name)).map(r => (
          <Person key={r.id} init={r.init} name={r.name} role={r.role} on
            onTap={() => toggle(r.name)}/>
        ))}
      </div>

      {/* suggestions */}
      <div style={{fontSize: 11, color: CC.inkDim, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom: 8}}>
        Suggested
      </div>
      <div style={{display:'flex', flexWrap:'wrap', gap: 8}}>
        {ROSTER.filter(r => !picked.has(r.name)).map(r => (
          <Person key={r.id} init={r.init} name={r.name} role={r.role}
            onTap={() => toggle(r.name)}/>
        ))}
      </div>

      <NextLink onClick={onNext} label="Continue to tasks"/>
    </Section>
  );
}

function Person({ init, name, role, on, onTap }) {
  return (
    <button onClick={onTap} style={{
      display:'flex', alignItems:'center', gap: 8,
      padding:'5px 12px 5px 5px',
      borderRadius: 999,
      background: on ? CC.ink : '#fff',
      color: on ? CC.paper : CC.ink,
      border: `1px solid ${on ? CC.ink : CC.faint}`,
      cursor:'pointer', fontFamily:'inherit',
      fontSize: 13, letterSpacing:'-0.005em',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius:'50%',
        background: on ? CC.paper : '#EFEDE7',
        color: CC.ink,
        fontSize: 9, fontWeight: 600,
        display:'flex', alignItems:'center', justifyContent:'center',
        letterSpacing:'0.04em',
      }}>{init}</span>
      <span>{name}</span>
      <span style={{opacity: on ? 0.5 : 0.4, fontSize: 11}}>{role}</span>
    </button>
  );
}

// ────────── 03 Tasks ──────────
function StepTasks({ project, setProject, onNext }) {
  const update = (id, patch) => {
    setProject({...project, tasks: project.tasks.map(t => t.id === id ? {...t, ...patch} : t)});
  };
  const addTask = () => {
    const id = Math.max(0, ...project.tasks.map(t=>t.id)) + 1;
    setProject({...project, tasks: [...project.tasks, { id, text:'', day: 0, done:false }]});
  };
  const removeTask = (id) => {
    setProject({...project, tasks: project.tasks.filter(t => t.id !== id)});
  };
  return (
    <Section index={3} delay={120}>
      <Eyebrow n={3} label="Tasks"/>
      <div style={{display:'flex', flexDirection:'column'}}>
        {project.tasks.map((t,i) => (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap: 12,
            padding:'10px 0',
            borderTop: i === 0 ? `1px solid ${CC.hair}` : 'none',
            borderBottom: `1px solid ${CC.hair}`,
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: 4,
              border:`1.4px solid ${CC.inkSoft}`,
              flexShrink: 0,
            }}/>
            <input value={t.text}
              onChange={e => update(t.id, { text: e.target.value })}
              placeholder="Describe the task"
              style={{
                flex: 1, border:'none', background:'transparent',
                fontSize: 14, color: CC.ink, outline:'none',
                fontFamily:'inherit', letterSpacing:'-0.005em',
              }}/>
            <button onClick={() => removeTask(t.id)} aria-label="Remove" style={{
              width: 22, height: 22, padding: 0,
              background:'transparent', border:'none', cursor:'pointer',
              color: CC.inkSoft, fontSize: 16, lineHeight: 1,
            }}>−</button>
          </div>
        ))}
      </div>

      <button onClick={addTask} style={{
        marginTop: 10, display:'inline-flex', alignItems:'center', gap: 8,
        padding:'7px 12px', borderRadius: 999,
        background:'transparent', border:`1px dashed ${CC.faint}`,
        color: CC.inkDim, fontSize: 12, cursor:'pointer',
        fontFamily:'inherit', letterSpacing:'-0.005em',
      }}>+ Add task</button>

      <NextLink onClick={onNext} label="Continue to schedule"/>
    </Section>
  );
}

// ────────── 04 When ──────────
function StepWhen({ project, setProject, onNext }) {
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const update = (id, day) => setProject({...project, tasks: project.tasks.map(t => t.id === id ? {...t, day} : t)});
  return (
    <Section index={4} delay={120}>
      <Eyebrow n={4} label="When"/>

      <div style={{
        display:'flex', justifyContent:'space-between',
        fontSize: 10, letterSpacing:'0.14em', textTransform:'uppercase',
        color: CC.inkSoft, marginBottom: 6,
      }}>
        {DAYS.map(d => <span key={d} style={{flex:1, textAlign:'center'}}>{d}</span>)}
      </div>
      <div style={{height: 1, background: CC.hair, marginBottom: 14}}/>

      {project.tasks.filter(t => t.text).map(t => (
        <div key={t.id} style={{display:'flex', alignItems:'center', gap: 12, padding:'8px 0'}}>
          <div style={{flex: 1, minWidth: 0,
            fontSize: 13, color: CC.ink, letterSpacing:'-0.005em',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.text}</div>
          <div style={{
            position:'relative', width: 156, height: 22,
          }}>
            {/* track */}
            <div style={{position:'absolute', left: 0, right: 0, top: 10, height: 1, background: CC.hair}}/>
            {DAYS.map((_, i) => (
              <button key={i}
                onClick={() => update(t.id, i)}
                aria-label={`Day ${i}`}
                style={{
                  position:'absolute', left: `${(i / (DAYS.length - 1)) * 100}%`,
                  top: '50%', transform:'translate(-50%, -50%)',
                  width: 18, height: 18, borderRadius:'50%',
                  background: t.day === i ? CC.ink : 'transparent',
                  border:`1.3px solid ${t.day === i ? CC.ink : CC.faint}`,
                  cursor:'pointer', padding: 0,
                  transition:'background 180ms, border-color 180ms',
                }}/>
            ))}
          </div>
        </div>
      ))}

      <NextLink onClick={onNext} label="See the snapshot"/>
    </Section>
  );
}

// ────────── 05 Snapshot ──────────
function StepSnapshot({ project }) {
  const people = project.people.filter(p => p.picked).length;
  const tasks  = project.tasks.filter(t => t.text).length;
  const span   = (() => {
    const days = project.tasks.filter(t => t.text).map(t => t.day);
    if (!days.length) return 0;
    return Math.max(...days) - Math.min(...days);
  })();
  return (
    <Section index={5} delay={120}>
      <Eyebrow n={5} label="Snapshot"/>

      <div style={{
        fontFamily:'"Noto Serif", serif', fontStyle:'italic',
        fontSize: 20, color: CC.ink, lineHeight: 1.35, letterSpacing:'-0.01em',
        marginBottom: 24, maxWidth: 320,
      }}>
        Ready when you are.
      </div>

      <div style={{display:'flex', justifyContent:'space-between', gap: 24, marginBottom: 24}}>
        <Stat n={people}  l="people"/>
        <Stat n={tasks}   l="tasks"/>
        <Stat n={`${span + 1}d`} l="span"/>
        <Stat n="0%"      l="progress"/>
      </div>

      <div style={{
        height: 6, borderRadius: 3, background: CC.veryFaint,
        overflow:'hidden', marginBottom: 8,
      }}>
        <div style={{height: '100%', width: '0%', background: CC.ink}}/>
      </div>
      <div style={{fontSize: 11, color: CC.inkDim, letterSpacing:'-0.005em'}}>
        Progress will track as tasks complete.
      </div>

      <div style={{
        marginTop: 28, display:'flex', gap: 10,
      }}>
        <button style={{
          flex: 1, padding:'14px 0', borderRadius: 14,
          background: CC.ink, color: CC.paper, border:'none', cursor:'pointer',
          fontFamily:'inherit', fontSize: 14, fontWeight: 500, letterSpacing:'-0.005em',
        }}>
          Create project
        </button>
        <button style={{
          padding:'14px 18px', borderRadius: 14,
          background:'transparent', color: CC.ink,
          border:`1px solid ${CC.faint}`, cursor:'pointer',
          fontFamily:'inherit', fontSize: 14, letterSpacing:'-0.005em',
        }}>
          Save draft
        </button>
      </div>
    </Section>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div style={{fontSize: 26, fontWeight: 200, letterSpacing:'-0.025em', lineHeight: 1}}>{n}</div>
      <div style={{fontSize: 10, letterSpacing:'0.14em', textTransform:'uppercase', color: CC.inkDim, marginTop: 4}}>{l}</div>
    </div>
  );
}

// ────────── Section wrapper (animates in) ──────────
function Section({ children, delay = 0 }) {
  return (
    <div style={{
      animation: `sectionIn 480ms ${delay}ms cubic-bezier(0.2,0.8,0.2,1) both`,
    }}>
      {children}
      <style>{`
        @keyframes sectionIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function NextLink({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      marginTop: 18, padding: 0, background:'transparent', border:'none',
      cursor:'pointer', fontFamily:'inherit',
      fontSize: 12, letterSpacing:'0.04em', textTransform:'uppercase',
      color: CC.ink,
      display:'inline-flex', alignItems:'center', gap: 8,
    }}>
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 12h14M13 6l6 6-6 6"/>
      </svg>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
// Prompt bar
// ═════════════════════════════════════════════════════════════
const PromptBar = React.forwardRef(function PromptBar(
  { value, onChange, onSubmit, busy, project }, ref
) {
  return (
    <form data-no-swipe onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      style={{
        display:'flex', alignItems:'center', gap: 10,
        background:'#fff', border:`1px solid ${CC.faint}`,
        borderRadius: 999, padding:'6px 6px 6px 18px',
        boxShadow:'0 4px 14px -8px rgba(26,26,24,0.08)',
      }}>
      <input ref={ref} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={project
          ? 'Refine, or describe a new structure…'
          : 'Create prototype for Board meeting with Mahdi'}
        disabled={busy}
        style={{
          flex: 1, border:'none', background:'transparent',
          fontSize: 14, color: CC.ink, outline:'none',
          fontFamily:'inherit', letterSpacing:'-0.005em',
          padding:'10px 0',
        }}/>
      <button type="submit" disabled={busy || !value.trim()} style={{
        width: 36, height: 36, borderRadius: '50%',
        background: CC.ink, color: CC.paper,
        border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        opacity: !busy && value.trim() ? 1 : 0.4,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </button>
    </form>
  );
});

Object.assign(window, { CreationMode });
