// cards.jsx — 9 event-type cards, each with its own visual personality.
// Every card is white-on-black-by-default but free to redecorate.
// Shared scaffolding lives at the bottom (CardShell, Chip, etc).

// ─────────────────────────────────────────────────────────────
// 1. DAILY PLANNING — drag tasks onto time slots
// ─────────────────────────────────────────────────────────────
function PlanningCard({ event, onAskAI }) {
  const [tasks, setTasks] = React.useState(event.scheduled);
  const [pool, setPool] = React.useState(event.pool);
  const [dragging, setDragging] = React.useState(null);
  const [hoverSlot, setHoverSlot] = React.useState(null);
  const slots = ['10:00', '11:00', '12:00', '14:00'];

  const dropToSlot = (slot) => {
    if (!dragging) return;
    setTasks([...tasks, { title: dragging, time: slot, dur: 50 }]);
    setPool(pool.filter(p => p !== dragging));
    setDragging(null); setHoverSlot(null);
  };

  return (
    <CardShell event={event} accent="white" onAskAI={onAskAI}>
      <div style={cardStyles.subhead}>
        <span>{tasks.length} tasks scheduled for today</span>
        <ChevronUp />
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:14}}>
        {tasks.map((t,i)=>(
          <div key={i} style={cardStyles.taskRow}>
            <div style={cardStyles.taskTitle}>{t.title}</div>
            <div style={cardStyles.taskTime}>{t.time}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:18}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,color:'#838383',fontSize:13}}>
          <PlusGlyph /> <span>Drag onto a slot to schedule</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {pool.map((p,i)=>(
            <div key={i}
              draggable
              onDragStart={()=>setDragging(p)}
              onDragEnd={()=>{ setDragging(null); setHoverSlot(null); }}
              onClick={()=>{}}
              style={{
                ...cardStyles.taskChip,
                opacity: dragging===p ? 0.4 : 1,
              }}>
              {p}
            </div>
          ))}
        </div>
        {dragging && (
          <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:6}}>
            {slots.map(s=>(
              <div key={s}
                onDragOver={(e)=>{e.preventDefault(); setHoverSlot(s);}}
                onDragLeave={()=>setHoverSlot(null)}
                onDrop={()=>dropToSlot(s)}
                style={{
                  border: hoverSlot===s ? '1.5px solid #BA5ADA' : '1px dashed rgba(14,14,14,0.18)',
                  background: hoverSlot===s ? 'rgba(186,90,218,0.08)' : 'transparent',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13,
                  color: hoverSlot===s ? '#BA5ADA' : '#838383',
                  display:'flex', justifyContent:'space-between', transition: 'all 120ms',
                }}>
                <span>{s}</span><span>{hoverSlot===s ? 'Drop here' : 'Empty'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Hatched>15 minutes buffer time after</Hatched>
      <CardActions actions={['Extend','Reschedule']} />
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. DESIGN TEAM SYNC — file shelf
// ─────────────────────────────────────────────────────────────
function DesignReviewCard({ event, onAskAI }) {
  const [activeFile, setActiveFile] = React.useState(0);
  const file = event.files[activeFile];
  return (
    <CardShell event={event} accent="white" onAskAI={onAskAI}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{display:'flex'}}>
          {event.attendees.map((a,i)=>(
            <div key={i} style={{
              width:30,height:30,borderRadius:'50%',
              background: i===0?'#BA5ADA':'#0E0E0E',
              color: i===0?'#0E0E0E':'#fff',
              border:'2px solid #fff', marginLeft: i?-8:0,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:11, fontWeight:600,
            }}>{a}</div>
          ))}
        </div>
        <span style={{fontSize:13,color:'#494949'}}>{event.attendees.length} in this review</span>
      </div>

      <div style={{fontSize:13,color:'#838383',marginBottom:10,display:'flex',justifyContent:'space-between'}}>
        <span>{event.files.length} files to review</span>
        <span style={{color:'#BA5ADA'}}>{activeFile+1} / {event.files.length}</span>
      </div>

      {/* File preview — large */}
      <div style={{
        borderRadius: 12, background: file.bg, height: 150, position: 'relative',
        overflow: 'hidden', border: '1px solid rgba(14,14,14,0.08)', marginBottom: 12,
      }}>
        {file.preview}
        <div style={{
          position:'absolute', bottom:0,left:0,right:0,
          padding:'18px 14px 10px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
          color:'#fff',
        }}>
          <div style={{fontSize:13,fontWeight:500}}>{file.name}</div>
          <div style={{fontSize:11,opacity:0.8,marginTop:2}}>{file.meta}</div>
        </div>
      </div>

      {/* File shelf — horizontal scroll */}
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,margin:'0 -28px',padding:'0 28px 4px'}}>
        {event.files.map((f,i)=>(
          <button key={i} onClick={()=>setActiveFile(i)} style={{
            flex:'0 0 auto', width:54,height:70, borderRadius:8,
            border: activeFile===i ? '2px solid #0E0E0E' : '1px solid rgba(14,14,14,0.1)',
            background: f.bg, position:'relative', overflow:'hidden', padding:0, cursor:'pointer',
          }}>
            <div style={{position:'absolute',inset:0,transform:'scale(0.4)',transformOrigin:'top left'}}>
              {f.preview}
            </div>
            {f.unread && <div style={{position:'absolute',top:4,right:4,width:6,height:6,borderRadius:'50%',background:'#BA5ADA'}}/>}
          </button>
        ))}
      </div>

      <Hatched>Maria + Jens shared 2 new comments</Hatched>
      <CardActions actions={['Open Figma','Mark reviewed']} />
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. COMMUTE — map-style background, route preview
// ─────────────────────────────────────────────────────────────
function CommuteCard({ event, onAskAI }) {
  const [mode, setMode] = React.useState('transit');
  const modes = {
    transit: { mins: 24, color: '#BA5ADA', detail: 'S2 → Tram 11 → walk 4 min', co2: '0.4 kg' },
    bike:    { mins: 32, color: '#0E0E0E', detail: '7.4 km · mostly flat',      co2: '0 kg'   },
    car:     { mins: 18, color: '#494949', detail: 'A1 highway · light traffic', co2: '1.6 kg' },
  };
  const m = modes[mode];
  return (
    <CardShell event={event} accent="dark" onAskAI={onAskAI} bg="#0E0E0E" fg="#fff">
      {/* Map illustration */}
      <div style={{
        position:'absolute', inset: 0, opacity: 0.55,
        background: `
          radial-gradient(circle at 22% 28%, rgba(186,90,218,0.18) 0%, transparent 35%),
          radial-gradient(circle at 78% 72%, rgba(255,255,255,0.06) 0%, transparent 40%),
          #0E0E0E`,
      }}>
        <MapSVG color={m.color} />
      </div>

      <div style={{position:'relative',zIndex:1, display:'flex',flexDirection:'column',height:'100%'}}>
        <div style={{display:'flex',gap:6,marginBottom:18}}>
          {Object.keys(modes).map(k=>(
            <button key={k} onClick={()=>setMode(k)} style={{
              flex:1, padding:'10px 0', borderRadius: 10,
              background: mode===k ? '#fff' : 'rgba(255,255,255,0.08)',
              color: mode===k ? '#0E0E0E' : '#fff',
              border:'none', fontSize:12, fontWeight: mode===k?600:400, cursor:'pointer',
              textTransform:'capitalize',
            }}>{k}</button>
          ))}
        </div>

        <div style={{flex:1}}/>

        <div style={{marginBottom:14}}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{fontSize:64,fontWeight:300,letterSpacing:'-0.04em',lineHeight:1}}>{m.mins}</div>
            <div style={{fontSize:18,opacity:0.7}}>min</div>
            <div style={{marginLeft:'auto',fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'#BA5ADA'}}>Arrives 11:54</div>
          </div>
          <div style={{fontSize:13,opacity:0.7,marginTop:6}}>{m.detail}</div>
        </div>

        {/* Route stops */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'12px 14px', background:'rgba(255,255,255,0.06)', borderRadius: 12,
        }}>
          <div style={{display:'flex',flexDirection:'column'}}>
            <span style={{fontSize:10,opacity:0.5,letterSpacing:'0.08em'}}>FROM</span>
            <span style={{fontSize:13,fontWeight:500,marginTop:2}}>Home</span>
          </div>
          <div style={{flex:1,display:'flex',alignItems:'center',gap:4,padding:'0 14px'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:m.color}}/>
            <div style={{flex:1,height:1.5,background:`linear-gradient(to right, ${m.color}, ${m.color})`}}/>
            <div style={{width:6,height:6,borderRadius:'50%',background:m.color}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
            <span style={{fontSize:10,opacity:0.5,letterSpacing:'0.08em'}}>TO</span>
            <span style={{fontSize:13,fontWeight:500,marginTop:2}}>Doodle HQ</span>
          </div>
        </div>

        <div style={{marginTop:10,display:'flex',justifyContent:'space-between',fontSize:11,opacity:0.55}}>
          <span>CO₂ · {m.co2}</span>
          <span>Live traffic · updated 2 min ago</span>
        </div>
      </div>
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. LUNCH — calm, "step away" BASADA
// ─────────────────────────────────────────────────────────────
function LunchCard({ event, onAskAI, tweaks }) {
  const hue = tweaks?.lunchHue || 'basada';
  const palette = {
    basada: { bg:'#BA5ADA', fg:'#0E0E0E', subtle:'rgba(14,14,14,0.08)', accent:'#0E0E0E' },
    black:  { bg:'#0E0E0E', fg:'#fff',    subtle:'rgba(255,255,255,0.08)', accent:'#BA5ADA' },
    white:  { bg:'#F8F8F8', fg:'#0E0E0E', subtle:'rgba(14,14,14,0.06)',  accent:'#BA5ADA' },
  }[hue];
  return (
    <CardShell event={event} accent={hue} onAskAI={onAskAI} bg={palette.bg} fg={palette.fg}>
      <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        <div style={{marginTop:'auto'}}/>
        <div style={{fontFamily:'"Noto Serif", serif', fontSize:52, lineHeight:1.02, letterSpacing:'-0.02em'}}>
          Step away.
        </div>
        <div style={{fontSize:15, marginTop:14, opacity:0.75, maxWidth:240}}>
          The afternoon is heavy.
          You eat <i style={{fontFamily:'"Noto Serif", serif'}}>now</i>, you focus later.
        </div>

        <div style={{marginTop:24, display:'flex',flexDirection:'column',gap:8}}>
          <div style={{...cardStyles.lunchSpot, background: palette.subtle}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>Tibits</div>
              <div style={{fontSize:11,opacity:0.65,marginTop:2}}>Vegetarian · 3 min walk</div>
            </div>
            <div style={{fontSize:11,padding:'4px 8px',background:palette.accent,color:palette.bg,borderRadius:999}}>Favourite</div>
          </div>
          <div style={{...cardStyles.lunchSpot, background: palette.subtle}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>Hitl Sihlpost</div>
              <div style={{fontSize:11,opacity:0.65,marginTop:2}}>Quiet booth · 6 min walk</div>
            </div>
            <div style={{fontSize:11,opacity:0.6}}>Maria suggested</div>
          </div>
          <div style={{...cardStyles.lunchSpot, background: palette.subtle}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>Desk</div>
              <div style={{fontSize:11,opacity:0.65,marginTop:2}}>You did this 3 days in a row</div>
            </div>
            <div style={{fontSize:11,opacity:0.5}}>Skip</div>
          </div>
        </div>

        <div style={{marginTop:'auto',paddingTop:18,fontSize:11,opacity:0.5,letterSpacing:'0.08em',textTransform:'uppercase'}}>
          Notifications muted · 60 min
        </div>
      </div>
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. FOCUS / DEEP WORK — almost-empty, single objective, big timer
// ─────────────────────────────────────────────────────────────
function FocusCard({ event, onAskAI }) {
  const [running, setRunning] = React.useState(false);
  const [remaining, setRemaining] = React.useState(90*60);
  React.useEffect(()=>{
    if(!running) return;
    const id = setInterval(()=>setRemaining(r=>Math.max(0,r-1)), 1000);
    return ()=>clearInterval(id);
  },[running]);
  const mm = String(Math.floor(remaining/60)).padStart(2,'0');
  const ss = String(remaining%60).padStart(2,'0');
  return (
    <CardShell event={event} accent="dark" onAskAI={onAskAI} bg="#0E0E0E" fg="#fff">
      <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        <div style={{fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', opacity:0.5}}>
          One thing
        </div>
        <div style={{fontFamily:'"Noto Serif", serif', fontSize:30, lineHeight:1.15, marginTop:10, color:'#fff'}}>
          {event.objective}
        </div>

        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
          <svg width="200" height="200" viewBox="0 0 200 200" style={{transform:'rotate(-90deg)'}}>
            <circle cx="100" cy="100" r="92" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none"/>
            <circle cx="100" cy="100" r="92" stroke="#BA5ADA" strokeWidth="2" fill="none"
              strokeDasharray={Math.PI*2*92} strokeDashoffset={Math.PI*2*92 * (1 - remaining/(90*60))}
              strokeLinecap="round" style={{transition:'stroke-dashoffset 1s linear'}}/>
          </svg>
          <div style={{position:'absolute',textAlign:'center'}}>
            <div style={{fontFamily:'ui-monospace,monospace',fontSize:48,fontWeight:200,letterSpacing:'-0.02em'}}>{mm}:{ss}</div>
            <div style={{fontSize:11,opacity:0.5,marginTop:4,letterSpacing:'0.08em',textTransform:'uppercase'}}>
              {running ? 'Focusing' : 'Ready'}
            </div>
          </div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setRunning(!running)} style={{
            flex:1, padding:'14px 0', background:'#fff', color:'#0E0E0E',
            border:'none', borderRadius:12, fontSize:14, fontWeight:500, cursor:'pointer',
          }}>{running ? 'Pause' : 'Begin'}</button>
          <button style={{
            padding:'14px 18px', background:'rgba(255,255,255,0.08)', color:'#fff',
            border:'none', borderRadius:12, fontSize:14, cursor:'pointer',
          }}>End early</button>
        </div>

        <div style={{marginTop:14,display:'flex',justifyContent:'space-between',fontSize:11,opacity:0.5}}>
          <span>Slack · DND</span>
          <span>Calendar · Busy</span>
          <span>Notifs · off</span>
        </div>
      </div>
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. 1:1 — split: last time / this time
// ─────────────────────────────────────────────────────────────
function OneOnOneCard({ event, onAskAI }) {
  return (
    <CardShell event={event} accent="white" onAskAI={onAskAI}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
        <div style={{
          width:46,height:46,borderRadius:'50%',background:'#0E0E0E',color:'#fff',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:16, fontWeight:500,
        }}>MR</div>
        <div>
          <div style={{fontSize:15,fontWeight:500}}>Maria Rüegg</div>
          <div style={{fontSize:12,color:'#838383',marginTop:2}}>Eng Manager · 14th 1:1</div>
        </div>
        <div style={{marginLeft:'auto', fontSize:11, padding:'4px 8px', background:'#F8F8F8', borderRadius:999, color:'#494949'}}>
          weekly
        </div>
      </div>

      <div style={{display:'flex',gap:10}}>
        <div style={{flex:1, padding:'14px 12px', background:'#F8F8F8', borderRadius:12}}>
          <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#838383'}}>Last time</div>
          <div style={{fontSize:13,marginTop:8,lineHeight:1.45,color:'#0E0E0E'}}>
            We agreed Maria would draft the
            <span style={{fontFamily:'"Noto Serif",serif',fontStyle:'italic'}}> hiring loop </span>
            doc by Friday.
          </div>
          <div style={{marginTop:10,fontSize:11,color:'#838383'}}>Action items</div>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6}}>
            <div style={cardStyles.checkRow}><CheckBox checked /> Hiring loop draft</div>
            <div style={cardStyles.checkRow}><CheckBox /> Roadmap review</div>
          </div>
        </div>
        <div style={{flex:1, padding:'14px 12px', background:'#0E0E0E', color:'#fff', borderRadius:12}}>
          <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',opacity:0.5}}>This time</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
            {event.agenda.map((a,i)=>(
              <div key={i} style={{fontSize:12,lineHeight:1.4}}>
                <span style={{opacity:0.5,marginRight:6}}>{i+1}.</span>{a}
              </div>
            ))}
            <button style={{
              marginTop:6, alignSelf:'flex-start',
              background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',
              padding:'6px 10px',borderRadius:8,fontSize:11,cursor:'pointer',
            }}>+ Add topic</button>
          </div>
        </div>
      </div>

      <div style={{marginTop:16, padding:'12px 14px', background:'#F8F8F8', borderRadius:12, fontSize:12, color:'#494949'}}>
        <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#838383',marginBottom:6}}>
          Mood thermometer
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {[1,2,3,4,5].map(n=>(
            <div key={n} style={{
              flex:1, height:18, borderRadius:4,
              background: n<=3 ? '#BA5ADA' : '#E8E8E8',
            }}/>
          ))}
          <span style={{marginLeft:8,fontSize:12,color:'#0E0E0E'}}>Steady</span>
        </div>
      </div>

      <CardActions actions={['Open notes','Start meeting']} />
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. STANDUP — yesterday / today / blockers columns
// ─────────────────────────────────────────────────────────────
function StandupCard({ event, onAskAI }) {
  return (
    <CardShell event={event} accent="white" onAskAI={onAskAI}>
      <div style={{display:'flex',gap:6,marginBottom:14,alignItems:'center'}}>
        <div style={{display:'flex'}}>
          {['MR','AS','KC','JP','TL','+2'].map((a,i)=>(
            <div key={i} style={{
              width:24,height:24,borderRadius:'50%',
              background: a==='+2' ? '#F8F8F8' : '#0E0E0E',
              color: a==='+2' ? '#838383' : '#fff',
              border:'2px solid #fff', marginLeft: i?-6:0,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:9, fontWeight:600,
            }}>{a}</div>
          ))}
        </div>
        <span style={{fontSize:12,color:'#838383',marginLeft:6}}>7 will speak · 15 min</span>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={cardStyles.standupRow}>
          <div style={{...cardStyles.standupTag, background:'#F8F8F8', color:'#494949'}}>Yesterday</div>
          <div style={{flex:1,fontSize:13,lineHeight:1.4}}>
            Shipped the prototype to Maria. Reviewed Jens' onboarding flow.
          </div>
        </div>
        <div style={cardStyles.standupRow}>
          <div style={{...cardStyles.standupTag, background:'#0E0E0E', color:'#fff'}}>Today</div>
          <div style={{flex:1,fontSize:13,lineHeight:1.4}}>
            Finalize Q3 deck for Tom. <span style={{color:'#838383'}}>+ 1:1 with Maria.</span>
          </div>
        </div>
        <div style={cardStyles.standupRow}>
          <div style={{...cardStyles.standupTag, background:'#BA5ADA', color:'#0E0E0E'}}>Blocked</div>
          <div style={{flex:1,fontSize:13,lineHeight:1.4}}>
            Need legal review on the new pricing copy. <span style={{color:'#BA5ADA',textDecoration:'underline'}}>Ping Sara</span>
          </div>
        </div>
      </div>

      <div style={{marginTop:16,padding:'10px 12px',background:'#F8F8F8',borderRadius:10,
        display:'flex',gap:10,alignItems:'center',fontSize:12,color:'#494949'}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:'#BA5ADA'}}/>
        <span>Maria's update mentions you · 2 places</span>
      </div>

      <CardActions actions={['Edit before','Join standup']} />
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. EXTERNAL CALL — profile/company card
// ─────────────────────────────────────────────────────────────
function ExternalCallCard({ event, onAskAI }) {
  return (
    <CardShell event={event} accent="white" onAskAI={onAskAI}>
      <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
        <div style={{
          width:64,height:64,borderRadius:'50%',
          background:'linear-gradient(135deg,#0E0E0E,#494949)',
          color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:22,fontWeight:500,flexShrink:0,
        }}>AC</div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:500}}>Anna Chen</div>
          <div style={{fontSize:13,color:'#494949',marginTop:2}}>VP Product · Northwind Labs</div>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <span style={cardStyles.miniBadge}>Zurich</span>
            <span style={cardStyles.miniBadge}>Series B</span>
            <span style={cardStyles.miniBadge}>120 ppl</span>
          </div>
        </div>
      </div>

      <div style={{marginTop:18,padding:'14px 16px', background:'#F8F8F8',borderRadius:12}}>
        <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#838383'}}>Why this call</div>
        <div style={{fontSize:13,marginTop:6,lineHeight:1.4}}>
          Anna asked for 20 min to discuss
          <span style={{fontFamily:'"Noto Serif",serif',fontStyle:'italic'}}> team-tier pricing</span>.
          Last touchpoint: Sept 14.
        </div>
      </div>

      <div style={{marginTop:14}}>
        <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#838383',marginBottom:8}}>
          Common ground
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={cardStyles.commonRow}>
            <UserIcon /><span>You both worked at Embed (2019–2021)</span>
          </div>
          <div style={cardStyles.commonRow}>
            <LinkIcon /><span>3 mutual connections incl. Maria Rüegg</span>
          </div>
          <div style={cardStyles.commonRow}>
            <BookIcon /><span>Wrote about scheduling rituals · last week</span>
          </div>
        </div>
      </div>

      <div style={{marginTop:14,padding:'10px 12px', background:'#0E0E0E',color:'#fff',borderRadius:10,
        display:'flex',gap:10,alignItems:'center'}}>
        <div style={{
          width:24,height:24,borderRadius:6,
          background:'#BA5ADA',color:'#0E0E0E',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600
        }}>!</div>
        <div style={{flex:1, fontSize:12, lineHeight:1.35}}>
          Northwind churned trial 4 weeks ago. <span style={{opacity:0.7}}>Treat as re-engagement.</span>
        </div>
      </div>

      <CardActions actions={['Brief me','Join call']} />
    </CardShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. END OF DAY — wrap-up
// ─────────────────────────────────────────────────────────────
function EndOfDayCard({ event, onAskAI }) {
  return (
    <CardShell event={event} accent="white" onAskAI={onAskAI}>
      <div style={{fontFamily:'"Noto Serif",serif', fontSize:26, lineHeight:1.15, marginBottom:14}}>
        You created
        <span style={{color:'#BA5ADA'}}> 2h 40m </span>
        today.
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <RingStat label="Meetings" value="6/6" pct={1} />
        <RingStat label="Deep work" value="1h" pct={0.66} />
        <RingStat label="Tasks" value="2/3" pct={0.66} />
      </div>

      <div style={{padding:'14px 16px', background:'#F8F8F8',borderRadius:12,marginBottom:12}}>
        <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#838383'}}>Carries over</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
          <div style={cardStyles.eodRow}>
            <span style={{flex:1}}>Email Christian re: contract</span>
            <span style={{fontSize:11,color:'#838383'}}>→ Tomorrow 9:30</span>
          </div>
          <div style={cardStyles.eodRow}>
            <span style={{flex:1}}>Sara feedback on pricing</span>
            <span style={{fontSize:11,color:'#838383'}}>→ When unblocked</span>
          </div>
        </div>
      </div>

      <div style={{padding:'14px 16px', background:'#0E0E0E', color:'#fff', borderRadius:12}}>
        <div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',opacity:0.5}}>Tomorrow looks</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:10}}>
          <div style={{fontSize:28,fontWeight:300,letterSpacing:'-0.02em'}}>Lighter</div>
          <div style={{fontSize:12,opacity:0.6}}>3 meetings · 3h deep work</div>
        </div>
      </div>

      <CardActions actions={['Reflect','Close the day']} />
    </CardShell>
  );
}

// ═════════════════════════════════════════════════════════════
// SHARED — CardShell + Atoms
// ═════════════════════════════════════════════════════════════

function CardShell({ event, accent, children, onAskAI, bg, fg }) {
  const isDark = accent === 'dark';
  const isBasada = accent === 'basada';
  return (
    <div style={{
      position:'relative',
      width:'100%', height:'100%',
      background: bg || '#fff',
      color: fg || '#0E0E0E',
      borderRadius: 28,
      padding: '24px 24px 0',
      boxSizing:'border-box',
      display:'flex', flexDirection:'column',
      overflow:'hidden',
      boxShadow: '0 18px 40px -12px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* time pill */}
      <div style={{
        alignSelf:'flex-start',
        padding:'6px 12px', borderRadius:999,
        background: isDark ? 'rgba(255,255,255,0.1)' : isBasada ? 'rgba(14,14,14,0.1)' : '#F8F8F8',
        fontSize: 12, fontFamily:'ui-monospace, monospace',
      }}>{event.time}</div>

      {/* title */}
      <div style={{
        fontSize: 30, fontWeight: 600, marginTop: 12, letterSpacing:'-0.02em', lineHeight: 1.05,
      }}>{event.title}</div>

      {event.subtitle && (
        <div style={{
          fontSize: 13, color: isDark ? 'rgba(255,255,255,0.6)' : '#838383',
          marginTop: 6,
        }}>{event.subtitle}</div>
      )}

      {/* Body */}
      <div style={{flex:1, marginTop: 18, display:'flex', flexDirection:'column',
        position:'relative', minHeight:0,
      }}>
        {children}
      </div>
    </div>
  );
}

const cardStyles = {
  subhead: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    fontSize:14, fontWeight:500,
  },
  taskRow: {
    display:'flex',justifyContent:'space-between',alignItems:'center',
    fontSize:14,color:'#838383',
  },
  taskTitle: { fontSize:14, color:'#494949' },
  taskTime: { fontFamily:'ui-monospace,monospace', fontSize:12 },
  taskChip: {
    border:'1px dashed rgba(14,14,14,0.2)', borderRadius:999,
    padding:'10px 16px', fontSize:13, color:'#838383',
    cursor:'grab', userSelect:'none', background:'#fff',
  },
  lunchSpot: {
    display:'flex',justifyContent:'space-between',alignItems:'center',
    background:'rgba(14,14,14,0.08)', borderRadius:12, padding:'12px 14px',
  },
  checkRow: { display:'flex',alignItems:'center',gap:8, fontSize:12, color:'#494949' },
  standupRow: { display:'flex', alignItems:'flex-start', gap:10 },
  standupTag: {
    fontSize:10, padding:'4px 8px', borderRadius:6,
    letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:500,
    flexShrink:0, alignSelf:'flex-start',
  },
  miniBadge: { fontSize:11, padding:'3px 8px', background:'#F8F8F8', borderRadius:999, color:'#494949' },
  commonRow: { display:'flex',alignItems:'center',gap:10, fontSize:12, color:'#494949' },
  eodRow: { display:'flex',alignItems:'center',gap:8, fontSize:13, color:'#0E0E0E' },
};

function CardActions({ actions=[] }) {
  return (
    <div style={{
      display:'flex', gap:8, marginTop:'auto', paddingTop: 16, paddingBottom: 16,
    }}>
      {actions.map((a,i)=>(
        <button key={i} style={{
          padding:'10px 16px', borderRadius:999,
          background:'#F8F8F8', border:'none', fontSize:13, fontWeight:500,
          color:'#0E0E0E', cursor:'pointer', fontFamily:'inherit',
        }}>{a}</button>
      ))}
    </div>
  );
}

function Hatched({ children }) {
  return (
    <div style={{
      margin:'14px -24px 0',
      padding:'10px 24px',
      background: `repeating-linear-gradient(135deg, rgba(14,14,14,0.04) 0 8px, transparent 8px 14px)`,
      borderTop:'1px solid rgba(14,14,14,0.06)',
      borderBottom:'1px solid rgba(14,14,14,0.06)',
      fontSize:12, color:'#838383', textAlign:'center',
    }}>{children}</div>
  );
}

function ChevronUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 15 12 9 18 15"/>
    </svg>
  );
}
function PlusGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function CheckBox({ checked }) {
  return (
    <div style={{
      width:14,height:14,borderRadius:4,
      border: checked? '1.5px solid #BA5ADA':'1.5px solid #838383',
      background: checked? '#BA5ADA':'transparent',
      display:'flex',alignItems:'center',justifyContent:'center',
    }}>
      {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0E0E0E" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
    </div>
  );
}
function UserIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>;
}
function LinkIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>;
}
function BookIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4V4z"/><line x1="4" y1="16" x2="16" y2="16"/></svg>;
}

function RingStat({ label, value, pct }) {
  const C = 2*Math.PI*22;
  return (
    <div style={{flex:1, background:'#F8F8F8', borderRadius:12, padding:'12px',
      display:'flex',flexDirection:'column',alignItems:'flex-start',gap:6}}>
      <div style={{position:'relative',width:48,height:48}}>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{transform:'rotate(-90deg)'}}>
          <circle cx="24" cy="24" r="22" stroke="rgba(14,14,14,0.08)" strokeWidth="3" fill="none"/>
          <circle cx="24" cy="24" r="22" stroke="#BA5ADA" strokeWidth="3" fill="none"
            strokeDasharray={C} strokeDashoffset={C*(1-pct)} strokeLinecap="round"/>
        </svg>
        <div style={{
          position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:11, fontWeight:500,
        }}>{value}</div>
      </div>
      <div style={{fontSize:11,color:'#838383'}}>{label}</div>
    </div>
  );
}

// Map SVG — abstract roads
function MapSVG({ color }) {
  return (
    <svg viewBox="0 0 400 600" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="400" height="600" fill="url(#grid)"/>
      {/* roads */}
      <path d="M 0 100 Q 100 110 200 90 T 400 80" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" strokeLinecap="round"/>
      <path d="M 50 0 L 80 200 L 60 400 L 90 600" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" strokeLinecap="round"/>
      <path d="M 300 600 L 280 400 L 320 200 L 300 0" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" strokeLinecap="round"/>
      <path d="M 400 300 L 200 320 L 0 290" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" strokeLinecap="round"/>
      {/* route line */}
      <path d="M 70 130 Q 120 200 180 220 Q 240 240 260 320 T 320 480"
        stroke={color} strokeWidth="3" fill="none"
        strokeDasharray="6 6" strokeLinecap="round"/>
      <circle cx="70" cy="130" r="7" fill={color}/>
      <circle cx="70" cy="130" r="14" fill={color} opacity="0.2"/>
      <circle cx="320" cy="480" r="7" fill="#fff"/>
      <circle cx="320" cy="480" r="14" fill="#fff" opacity="0.2"/>
    </svg>
  );
}

// File preview helpers
function FilePreviewWireframe() {
  return (
    <div style={{padding:14,height:'100%',boxSizing:'border-box',background:'#F8F8F8'}}>
      <div style={{width:'30%',height:8,background:'#0E0E0E',borderRadius:2,marginBottom:8}}/>
      <div style={{width:'80%',height:6,background:'rgba(14,14,14,0.3)',borderRadius:2,marginBottom:4}}/>
      <div style={{width:'70%',height:6,background:'rgba(14,14,14,0.2)',borderRadius:2,marginBottom:12}}/>
      <div style={{display:'flex',gap:6}}>
        <div style={{flex:1,height:50,background:'#fff',borderRadius:4,border:'1px solid rgba(14,14,14,0.1)'}}/>
        <div style={{flex:1,height:50,background:'#fff',borderRadius:4,border:'1px solid rgba(14,14,14,0.1)'}}/>
      </div>
    </div>
  );
}
function FilePreviewSpec() {
  return (
    <div style={{padding:14,height:'100%',boxSizing:'border-box',background:'#fff'}}>
      <div style={{fontFamily:'ui-monospace,monospace',fontSize:10,color:'#838383',marginBottom:6}}>SPEC v3</div>
      {[1,2,3,4,5].map(i=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
          <div style={{width:8,height:8,background:i===2?'#BA5ADA':'rgba(14,14,14,0.2)',borderRadius:2}}/>
          <div style={{flex:1,height:5,background:'rgba(14,14,14,0.12)',borderRadius:2}}/>
        </div>
      ))}
    </div>
  );
}
function FilePreviewPrototype() {
  return (
    <div style={{padding:14,height:'100%',boxSizing:'border-box',background:'#0E0E0E',display:'flex',gap:6}}>
      <div style={{width:30,background:'#BA5ADA',borderRadius:4}}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
        <div style={{height:6,background:'rgba(255,255,255,0.5)',borderRadius:2,width:'40%'}}/>
        <div style={{height:4,background:'rgba(255,255,255,0.3)',borderRadius:2,width:'70%'}}/>
        <div style={{height:4,background:'rgba(255,255,255,0.3)',borderRadius:2,width:'60%'}}/>
        <div style={{flex:1,marginTop:6,background:'rgba(255,255,255,0.08)',borderRadius:6}}/>
      </div>
    </div>
  );
}

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
};

Object.assign(window, {
  CARDS, CardShell, FilePreviewWireframe, FilePreviewSpec, FilePreviewPrototype,
});
