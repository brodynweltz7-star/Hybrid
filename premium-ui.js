/* LOCK IN 2027 — streamlined presentation and truthful workout logging.
   Uses the existing persisted DB; does not migrate, delete or rewrite history. */
(() => {
  'use strict';
  const sheet=document.createElement('link');
  sheet.rel='stylesheet';
  sheet.href='./premium.css';
  document.head.appendChild(sheet);

  const originalWeek=pages.week;
  const oldRecoveryLinks=recoveryLinks;
  const weekStart=()=>weekMonday(new Date());
  const currentDay=()=>iso(new Date());
  const rideOn=date=>db.rides?.[date]||null;
  const actualRun=date=>{
    const log=logFor(date);
    return log.done===true&&Number.isFinite(Number(log.distance))&&Number(log.distance)>0?log:null;
  };
  const niceKm=(km,race=false)=>{
    const n=Number(km);
    if(!Number.isFinite(n))return '—';
    if(race&&n>90)return n.toFixed(2);
    return Number(n.toFixed(1)).toString();
  };
  const isRace=date=>RACES.some(r=>r.date===date);
  const readyAfter=(flag,dateField,earliest)=>{
    const a=adaptiveState();
    return a[flag]===true&&String(a[dateField]||'')>=earliest;
  };
  const needsToronto=()=>readyAfter('torontoReturnConfirmed','torontoReturnConfirmedAt','2027-05-03');
  const needsUltra=()=>readyAfter('marathonReturnConfirmed','ultraReturnConfirmedAt','2027-08-01');
  const missReasons=['Travel / away','Work / schedule','Illness','Injury / pain','Recovery / fatigue','Personal / family','Other'];
  const missedOn=(date,kind)=>db.missedSessions?.[date]?.[kind]||null;
  const excused=(date,kind)=>Boolean(missedOn(date,kind));
  const gymHasWork=(date,type)=>!!type&&Object.entries(db.lifts?.[date+'_'+type]||{})
    .some(([name,entry])=>name.startsWith('exercise:')&&entry?.done===true);
  function missedSessionControls(date,d){
    const sections=[];
    for(const [kind,planned,label] of [['run',Number(d?.target)>0,'run'],['gym',Boolean(d?.lift),'gym']]){
      if(!planned&&!excused(date,kind))continue;
      const record=missedOn(date,kind),hasActual=kind==='run'?Boolean(actualRun(date)):gymHasWork(date,d.lift);
      const state=date>currentDay()?'Planned absence':'Excused absence';
      const formId='miss-'+kind+'-'+date;
      const summary=record&&!hasActual?`<div class="absence-summary"><b>${state} · ${label}</b><span>${esc(record.reason)}${record.note?' · '+esc(record.note):''}</span></div>`:'';
      const dropdown=missReasons.map(reason=>`<option value="${esc(reason)}" ${record?.reason===reason?'selected':''}>${esc(reason)}</option>`).join('');
      sections.push(`<div class="absence-item">${summary}
        ${hasActual?`<p class="mini-note">${kind==='run'?'A completed run':'Gym exercises'} are recorded for this day. Keep the actual log; no absence is needed.</p>`:
        `<details class="compact-details absence-editor" ${db.uiMissEditor===formId?'open':''}>
          <summary onclick="db.uiMissEditor='${formId}'">${record?'Edit '+label+' absence':'Missed or away? Add a '+label+' reason'}</summary>
          <div class="fields absence-fields">
            <div class="field"><label for="${formId}-reason">Reason</label><select id="${formId}-reason">${dropdown}</select></div>
            <div class="field"><label for="${formId}-note">Optional details</label>
              <textarea id="${formId}-note" maxlength="300" placeholder="e.g. Away for the weekend, returning Monday">${esc(record?.note||'')}</textarea></div>
          </div>
          <div class="absence-actions"><button class="btn secondary" onclick="lockinSaveMissed('${date}','${kind}')">Save reason</button>
            ${record?`<button class="btn secondary" onclick="lockinClearMissed('${date}','${kind}')">Remove reason</button>`:''}</div>
        </details>`}
      </div>`);
    }
    if(!sections.length)return '';
    return `<div class="absence-box"><div class="absence-heading">Schedule changes <small>Excused means not completed. No catch-up workout.</small></div>
      ${sections.join('')}</div>`;
  }
  window.lockinSaveMissed=(date,kind)=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!['run','gym'].includes(kind))return;
    const id='miss-'+kind+'-'+date;
    const reason=document.getElementById(id+'-reason')?.value;
    const note=(document.getElementById(id+'-note')?.value||'').trim().slice(0,300);
    const d=prescribedDays(weekMonday(dateUTC(date)))[dayDiff(weekMonday(dateUTC(date)),date)];
    if(!missReasons.includes(reason)||!d){alert('Choose a valid reason.');return;}
    if(kind==='run'&&actualRun(date)||kind==='gym'&&gymHasWork(date,d.lift)){
      alert('There is actual workout activity logged. Edit that workout instead of marking it missed.');return;
    }
    db.missedSessions||={};db.missedSessions[date]||={};
    db.missedSessions[date][kind]={reason,note,recordedAt:new Date().toISOString()};
    db.uiMissEditor='';save();render();
  };
  window.lockinClearMissed=(date,kind)=>{
    if(!db.missedSessions?.[date])return;
    delete db.missedSessions[date][kind];
    if(!Object.keys(db.missedSessions[date]).length)delete db.missedSessions[date];
    db.uiMissEditor='';save();render();
  };
  // An actual completed workout takes precedence over an older absence note.
  const originalLogField=logField;
  logField=function(date,key,value){
    if(key==='done'&&value===true&&excused(date,'run')){
      delete db.missedSessions[date].run;
      if(!Object.keys(db.missedSessions[date]).length)delete db.missedSessions[date];
    }
    return originalLogField(date,key,value);
  };
  const originalLiftNamedField=liftNamedField;
  liftNamedField=function(date,type,index,key,value){
    if(key==='done'&&value===true&&excused(date,'gym')){
      delete db.missedSessions[date].gym;
      if(!Object.keys(db.missedSessions[date]).length)delete db.missedSessions[date];
    }
    return originalLiftNamedField(date,type,index,key,value);
  };

  function gymRecord(date,type){
    if(!type)return null;
    const values=db.lifts[date+'_'+type]||{};
    const names=STRENGTH[type]||[];
    const logged=names.filter(([n])=>values['exercise:'+n]?.done===true).length;
    return {logged,total:names.length,complete:logged>0&&logged===names.length};
  }

  // Keep requested yoga and warm-up links but never make every workout
  // appear to require several additional activities.
  recoveryLinks=function(d){
    const markup=oldRecoveryLinks(d);
    return markup?`<details class="compact-details"><summary>Optional warm-up & recovery videos</summary>${markup}</details>`:'';
  };

  function quickInstructions(d,limit=3){
    const parts=String(d.detail||'').split(/;\s*/).map(x=>x.trim()).filter(Boolean);
    const selected=parts.filter(x=>!/^(before running|after running|mobility \(|optional recovery:|flexibility focus)/i.test(x)).slice(0,limit);
    return selected.length?`<ul class="instruction-list">${selected.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:
      '<p class="section-sub">Follow an easy, comfortable effort.</p>';
  }

  function sessionName(d){
    if(!d)return 'No session';
    return d.title.replace(/^(Monday |Tuesday |Wednesday |Thursday |Friday |Saturday |Sunday )/,'');
  }

  function statusFor(date,d){
    const log=actualRun(date),ride=rideOn(date),gymLog=gymRecord(date,d.lift);
    const notes=[];
    if(log)notes.push(niceKm(log.distance)+' km logged');
    if(gymLog&&gymLog.logged>0)notes.push('Gym '+gymLog.logged+'/'+gymLog.total);
    if(ride)notes.push('Bike '+niceKm(ride.distance)+' km');
    const runAway=!log&&excused(date,'run'),gymAway=!(gymLog&&gymLog.logged>0)&&excused(date,'gym');
    if(runAway&&gymAway)notes.push(date>currentDay()?'Run + gym away':'Run + gym excused');
    else if(runAway)notes.push(date>currentDay()?'Run away planned':'Run excused');
    else if(gymAway)notes.push(date>currentDay()?'Gym away planned':'Gym excused');
    if(notes.length){
      const plannedRun=Number(d.target)>0;
      const plannedGym=!!d.lift;
      const runComplete=!plannedRun||!!log;
      const gymComplete=!plannedGym||(gymLog&&gymLog.total>0&&gymLog.logged===gymLog.total);
      return {label:notes.join(' · '),style:runComplete&&gymComplete?'done':(!log&&(excused(date,'run')||excused(date,'gym'))?'status-muted':'info')};
    }
    if(d.type==='rest')return {label:'Recovery',style:'status-muted'};
    return {label:date>currentDay()?'Upcoming':'Not logged',style:date>currentDay()?'status-muted':'info'};
  }

  function jumpTo(date){
    selectedWeek=weekMonday(dateUTC(date));
    go('week');
    setTimeout(()=>{
      document.getElementById('workout-'+date)?.scrollIntoView({behavior:'smooth',block:'start'});
    },60);
  }
  window.lockinJumpTo=jumpTo;

  function homeToday(){
    const now=currentDay(),w=weekStart(),idx=Math.max(0,Math.min(6,dayDiff(w,now)));
    const d=prescribedDays(w)[idx],actual=actualRun(now);
    const awayRun=!actual&&excused(now,'run'),awayGym=excused(now,'gym');
    const dateText=dateUTC(now).toLocaleDateString('en-CA',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'});
    const title=actual?(actual.runType||'Run recorded'):sessionName(d);
    const label=actual?'RECORDED TODAY':awayRun?'RUN EXCUSED':d.target>0?'TODAY’S RUN':awayGym?'GYM EXCUSED':d.lift?'TODAY’S STRENGTH':'TODAY · RECOVERY';
    const first=actual?niceKm(actual.distance)+' km':awayRun?'Run excused':d.target>0?niceKm(d.target,isRace(now))+' km':awayGym?'Gym excused':d.lift?'Strength':'No required mileage';
    const second=actual?(actual.time||'Time not recorded'):awayRun?(missedOn(now,'run').reason):d.target>0?(d.effort||'Comfortable effort'):
      awayGym?missedOn(now,'gym').reason:
      d.lift?gymDose(now,d.lift).label:'Rest / mobility';
    const note=actual?'Only entered workout details are shown; unrecorded splits are never estimated.':
      awayRun&&d.lift&&!awayGym?'Run excused; your gym remains scheduled. No make-up run is added.':
      awayRun?'Your run reason is saved; it is not counted as completed and no make-up is scheduled.':
      awayGym&&d.target>0?'Gym excused. Your run is still on the plan; no extra gym session is added.':
      awayGym?'Your gym reason is saved; it is not counted as completed and no make-up is scheduled.':
      d.conditional?'Conditional preview only. Confirm recovery before following this programme.':
      d.type==='rest'?'Rest is part of the plan. You can still record a ride or an unscheduled run.':'Follow the written workout; use effort if pace feels wrong today.';
    return `<section class="panel hero session-hero">
      <span class="eyebrow">${label} · ${esc(dateText)}</span>
      <h1 class="page-title">${esc(title)}</h1>
      <div class="focus-metrics">
        <div><span>${actual?'ACTUAL DISTANCE':d.target>0?'PLANNED DISTANCE':'SESSION'}</span><strong>${esc(first)}</strong></div>
        <div><span>${actual?'ACTUAL TIME':d.target>0?'TARGET EFFORT':'FOCUS'}</span><strong>${esc(second)}</strong></div>
      </div>
      ${actual&&actual.pace?`<p class="section-sub">Average recorded pace: <strong>${esc(actual.pace)}/km</strong></p>`:''}
      <p class="section-sub">${esc(note)}</p>
      ${actual?'':`<details class="compact-details"><summary>View today's session instructions</summary>${quickInstructions(d,5)}${recoveryLinks(d)}</details>`}
      <div class="page-actions"><button class="btn" onclick="lockinJumpTo('${now}')">${actual?'View recorded workout':'View & log workout'} →</button>
        ${d.lift?`<button class="btn secondary" onclick="openLift('${now}','${d.lift}')">Gym log</button>`:''}
      </div>
    </section>`;
  }

  pages.home=function(){
    const now=currentDay(),wk=weekStart(),days=prescribedDays(wk);
    const dates=Array.from({length:7},(_,i)=>plus(wk,i));
    const actuals=dates.map(actualRun).filter(Boolean);
    const km=actuals.reduce((sum,l)=>sum+Number(l.distance),0);
    const plannedRuns=days.filter(d=>Number(d.target)>0).length;
    const excusedRuns=days.filter((d,i)=>Number(d.target)>0&&excused(dates[i],'run')&&!actualRun(dates[i])).length;
    const bikes=rideWeek(wk);
    const next=RACES.find(r=>r.date>=now);
    const rows=days.map((d,i)=>{
      const date=dates[i],status=statusFor(date,d);
      const dName=DAYN[i],detail=d.target>0?niceKm(d.target,isRace(date))+' km planned':
        d.lift?'Strength only':'Recovery / rest';
      return `<button class="week-row ${date===now?'today':''}" onclick="lockinJumpTo('${date}')" aria-label="Open ${esc(dName)} workout">
        <span class="day-name">${dName}</span><span><span class="session-name">${esc(sessionName(d))}</span>
        <span class="session-sub">${esc(detail)}${d.lift&&d.target>0?' · gym':''}</span></span>
        <span class="day-result ${status.style}">${esc(status.label)}</span></button>`;
    }).join('');
    const upcoming=next?`<section class="panel"><div class="section-head"><h2>Next race</h2><button class="btn secondary" onclick="go('plan')">Race plan →</button></div>
      <div class="race-preview"><div><strong>${esc(next.name)}</strong><small>${fmt(next.date)} · ${esc(next.goal)}</small></div>
      <em>${dayDiff(now,next.date)===0?'Today':dayDiff(now,next.date)+' days'}</em></div></section>`:
      '<section class="panel"><h2>2027 race calendar</h2><p class="section-sub">All scheduled race dates have passed. Log results to preserve your actual performances.</p></section>';
    return homeToday()+`<div class="metrics-row" aria-label="Recorded running totals this week">
      <div class="stat"><label>RUNNING LOGGED</label><strong>${km.toFixed(1)} km</strong><div class="fine">Recorded, not predicted</div></div>
      <div class="stat"><label>RUNS LOGGED</label><strong>${actuals.length}</strong><div class="fine">${excusedRuns?excusedRuns+' excused · ':''}${plannedRuns} originally scheduled</div></div>
      <div class="stat"><label>THIS WEEK</label><strong>${fmt(wk)}</strong><div class="fine">${fmt(plus(wk,6))} · Monday–Sunday</div></div>
    </div><section class="panel">
      <div class="section-head"><div><h2>Your seven-day week</h2><p class="section-sub">Tap a day for its full workout and logs.</p></div>
        <button class="btn secondary" onclick="selectedWeek='${wk}';go('week')">Full plan →</button></div>
      <div class="week-rows">${rows}</div>
      <div class="soft-divider"></div>
      <div class="row"><span class="section-sub">${bikes.count?bikes.count+' bike ride'+(bikes.count===1?'':'s')+' recorded · '+bikes.km.toFixed(1)+' km (separate from running)':'Cycling is optional and logged separately.'}</span>
      <button class="btn secondary" onclick="db.uiRideDate='${now}';save();go('ride')">＋ Log ride</button></div>
    </section>${upcoming}`;
  };

  function runForm(date,d){
    const l=logFor(date),isComplete=Boolean(actualRun(date));
    const label=d.target>0?'Log actual run':'Log an unscheduled run';
    return `<details class="compact-details log-form" ${db.uiRunEditorDate===date?'open':''}>
      <summary onclick="db.uiRunEditorDate='${date}'">${label}${isComplete?' · recorded ✓':''}</summary>
      <p class="plan-note">Enter what you actually did, even if it differs from the plan. No estimates are filled in for you.</p>
      <div class="fields">
        <div class="field"><label for="km-${date}">Distance (km)</label>
          <input id="km-${date}" type="number" inputmode="decimal" min="0" max="200" step=".01" placeholder="Actual km" value="${esc(l.distance??'')}"
          onchange="logField('${date}','distance',this.value)"></div>
        <div class="field"><label for="time-${date}">Time (mm:ss or h:mm:ss)</label>
          <input id="time-${date}" placeholder="e.g. 38:20" value="${esc(l.time||'')}" onchange="logField('${date}','time',this.value)"></div>
        <div class="field"><label for="pace-${date}">Average pace (/km)</label>
          <input id="pace-${date}" placeholder="e.g. 5:20" value="${esc(l.pace||'')}" onchange="logField('${date}','pace',this.value)"></div>
        <div class="field"><label for="hr-${date}">Average heart rate</label>
          <input id="hr-${date}" type="number" min="30" max="250" placeholder="Optional" value="${esc(l.hr||'')}" onchange="logField('${date}','hr',this.value)"></div>
      </div>
      <div class="field"><label for="kind-${date}">What kind of run?</label>
        <input id="kind-${date}" placeholder="Easy / Track / Threshold / Long" value="${esc(l.runType||'')}" onchange="logField('${date}','runType',this.value)"></div>
      <div class="field" style="margin-top:9px"><label for="notes-${date}">Actual workout notes</label>
        <textarea id="notes-${date}" placeholder="Splits, changes, conditions, how it felt" onchange="logField('${date}','notes',this.value)">${esc(l.notes||'')}</textarea></div>
      <label class="setting-toggle">
        <input type="checkbox" ${l.done?'checked':''} onchange="if(this.checked&&!Number(logFor('${date}').distance)){alert('Enter the actual run distance before marking it complete.');this.checked=false;return;}logField('${date}','done',this.checked)">
        <span>Mark this run completed <small class="status-muted">(requires an entered distance)</small></span></label>
      </details>`;
  }

  function dayPlanCard(date,d,i,today){
    const runLogged=actualRun(date),bike=rideOn(date),g=gymRecord(date,d.lift),race=isRace(date);
    const isToday=date===today;
    const runTarget=Number(d.target)>0;
    const status=runLogged?`<span class="session-pill logged">RUN LOGGED${excused(date,'gym')?' · GYM EXCUSED':''}</span>`:
      excused(date,'run')||excused(date,'gym')?`<span class="session-pill absence-pill">${excused(date,'run')?'RUN':'GYM'} EXCUSED</span>`:
      d.conditional?'<span class="session-pill">IF RECOVERED</span>':
      date>today?'<span class="session-pill">UPCOMING</span>':
      '<span class="session-pill">NOT RECORDED</span>';
    const distanceLabel=runTarget?`<span>${niceKm(d.target,race)} km ${race?'race distance':'planned'}</span>`:'';
    const paceLabel=runTarget&&d.effort?
      `<span>${race?'Race approach:':'Target effort:'} ${esc(d.effort)}</span>`:'';
    const gymLabel=d.lift?`<span>${esc({lower:'Lower Body',upperA:'Upper A',upperB:'Upper B'}[d.lift])}</span>`:'';
    const actualLabel=runLogged?`<span class="status-good">${niceKm(runLogged.distance)} km actually recorded${runLogged.time?' · '+esc(runLogged.time):''}${runLogged.pace?' · '+esc(runLogged.pace)+'/km':''}</span>`:'';
    const gymState=d.lift&&g?.logged>0?`<p class="plan-note">Gym: ${g.logged} / ${g.total} exercises marked complete. ${g.complete?'Full gym log completed.':'Not a completed workout until all exercises are logged.'}</p>`:'';
    const notes=d.conditional?'<div class="warning-inline">Conditional forecast only. These workouts are not automatically scheduled until you confirm recovery after the previous race.</div>':'';
    const dateLabel=DAYN[i]+' · '+fmt(date);
    const mayLog=date<=today;
    return `<article id="workout-${date}" class="plan-card ${isToday?'is-today':''} ${runLogged?'is-done':''}">
      <div class="plan-line"><div><div class="date-label">${esc(dateLabel)}</div>
        <div class="day-title">${esc(sessionName(d))}</div></div>${status}</div>
      <div class="run-metrics">${distanceLabel}${paceLabel}${gymLabel}${actualLabel}</div>
      ${notes}
      ${gymState}
      ${bike?`<p class="plan-note">Bike recorded separately: ${niceKm(bike.distance)} km · ${esc(bike.time||'time not recorded')}</p>`:''}
      ${missedSessionControls(date,d)}
      <details class="plan-detail" ${isToday?'open':''}>
        <summary>Workout instructions</summary>
        ${instructionList(d.detail)}${recoveryLinks(d)}
      </details>
      <div class="action-row">
        ${d.lift?`<button class="btn secondary" onclick="openLift('${date}','${d.lift}')">Open gym log →</button>`:''}
        <button class="btn secondary" onclick="db.uiRideDate='${date}';save();go('ride')">${bike?'Edit bike ride':'＋ Log bike ride'}</button>
      </div>
      ${mayLog?runForm(date,d):'<p class="plan-note">Actual run logging appears on the workout date. You can adjust the plan ahead of time.</p>'}
      ${runTarget&&!race?`<details class="overrides-box"><summary>Adjust this workout (optional)</summary>
        <div class="fields" style="grid-template-columns:repeat(2,minmax(0,1fr))">
          <div class="field"><label>Run distance override (km)</label>
            <input type="number" min="0" max="100" step=".5" placeholder="Automatic" value="${esc(adaptiveState().dayOverrides[date]?.target??'')}"
              onchange="overrideDay('${date}','target',this.value)"></div>
          <div class="field"><label>Target pace override</label>
            <input placeholder="Automatic" value="${esc(adaptiveState().dayOverrides[date]?.effort??'')}"
              onchange="overrideDay('${date}','effort',this.value)"></div>
        </div>
        <p class="mini-note">Overrides change future plans, not recorded workout history. Enter the actual distance in the run log.</p>
      </details>`:''}
    </article>`;
  }

  pages.week=function(){
    const now=currentDay(),w=selectedWeek,end=plus(w,6);
    if(end<now)return originalWeek(); // Verified historical display + backdated editor.
    const forecast=w>weekStart(),p=phaseAt(w);
    const q=weekPrescription(w),days=prescribedDays(w,{preview:forecast});
    const logged=Array.from({length:7},(_,i)=>actualRun(plus(w,i))).filter(Boolean);
    const actualKm=logged.reduce((sum,l)=>sum+Number(l.distance),0);
    const plannedKm=days.reduce((sum,d)=>sum+(Number(d.target)||0),0);
    const runCount=days.filter(d=>Number(d.target)>0).length;
    const gymCount=days.filter(d=>!!d.lift).length;
    const excusedRunCount=days.filter((d,i)=>Number(d.target)>0&&excused(plus(w,i),'run')&&!actualRun(plus(w,i))).length;
    const excusedKm=days.reduce((km,d,i)=>km+(Number(d.target)>0&&excused(plus(w,i),'run')&&!actualRun(plus(w,i))?Number(d.target):0),0);
    const activeKm=Math.max(0,plannedKm-excusedKm);
    const hasRace=days.some(d=>/RACE DAY/i.test(d.title));
    const conditional=days.some(d=>d.conditional);
    const reason=coachDecision(w,q.block).reason;
    return `<section class="panel">
      <div class="section-head"><div><span class="tag">${esc(p.name)}</span>
        <h1 class="page-title" style="margin-bottom:3px">${fmt(w)} – ${fmt(end)}</h1></div>
        <div class="navweek">
          <button aria-label="Previous week" onclick="moveWeek(-7)" ${w<=START?'disabled':''}>←</button>
          <button aria-label="Current week" onclick="selectedWeek=weekMonday(new Date());render()">Today ↩</button>
          <button aria-label="Next week" onclick="moveWeek(7)">→</button>
        </div>
      </div>
      <div class="metrics-row">
        <div class="stat"><label>RUNS</label><strong>${runCount}</strong><div class="fine">${excusedRunCount?excusedRunCount+' excused · ':''}${hasRace?'Race-week exceptions':forecast?'Conditional plan':'Originally planned'}</div></div>
        <div class="stat"><label>GYM DAYS</label><strong>${gymCount}</strong><div class="fine">Recovery comes first</div></div>
        <div class="stat"><label>${forecast?'FORECAST DISTANCE':excusedKm?'ACTIVE PLAN':'PLANNED DISTANCE'}</label>
          <strong>${niceKm(activeKm,hasRace)} km</strong><div class="fine">${actualKm.toFixed(1)} km actually logged${excusedKm?' · '+niceKm(plannedKm)+' km originally scheduled':''}</div></div>
      </div>
      ${conditional?'<div class="warning-inline">This is a forecast, not clearance to train after a race. The live schedule stays in recovery mode until you confirm a comfortable return.</div>':
        '<p class="section-sub">Planned distances are not completed workouts. Only the run log counts actual mileage.</p>'}
      ${!forecast?`<p class="plan-note">Coaching: ${esc(reason)}</p>`:''}
      <details class="compact-details">
        <summary>Weekly distance override</summary>
        <div class="field"><label>Manual total (km) · leave blank for automatic</label>
          <input type="number" step=".5" min="0" max="180" placeholder="Automatic" value="${esc(adaptiveState().weekOverrides[w]??'')}"
            onchange="overrideWeek('${w}',this.value)"></div>
        <p class="mini-note">Race distance is fixed. Recovery protection can prevent a requested mileage total from being scheduled.</p>
      </details>
    </section>
    <section class="panel"><div class="section-head"><div><h2>Your sessions</h2>
    <p class="section-sub">Tap instructions or the run log only when you need them.</p></div></div>
    ${days.map((d,i)=>{
      const date=plus(w,i);
      return date<now?actualPastDay(date):dayPlanCard(date,d,i,now);
    }).join('')}</section>`;
  };

  // Backdated weeks deliberately use actual records; append an editable absence
  // reason without replacing historical run, gym, or bike entries.
  const originalActualPastDay=actualPastDay;
  actualPastDay=function(date){
    const week=weekMonday(dateUTC(date));
    const day=prescribedDays(week)[dayDiff(week,date)]||{};
    const controls=missedSessionControls(date,day);
    const gymLink=day.lift?`<button class="btn secondary" onclick="openLift('${date}','${day.lift}')">${gymHasWork(date,day.lift)?'Edit gym log':'＋ Log gym'}</button>`:'';
    const extra=controls||gymLink?`<div class="historic-absence">${controls}${gymLink?`<div class="absence-actions">${gymLink}</div>`:''}</div>`:'';
    return originalActualPastDay(date).replace(/<\/article>$/,extra+'</article>');
  };

  pages.stats=function(){
    const now=currentDay(),since=plus(now,-28);
    const records=Object.entries(db.logs).filter(([,l])=>
      l.done===true&&Number.isFinite(Number(l.distance))&&Number(l.distance)>0)
      .sort(([a],[b])=>a.localeCompare(b));
    const totalKm=records.reduce((sum,[,l])=>sum+Number(l.distance),0);
    const recent=records.filter(([date])=>date>=since&&date<=now);
    const recentKm=recent.reduce((sum,[,l])=>sum+Number(l.distance),0);
    const longest=recent.reduce((top,[,l])=>Math.max(top,Number(l.distance)),0);
    const imported=records.filter(([,l])=>l.source==='imported').length;
    const weeks=new Map();
    for(const [date,l] of records){
      const key=weekMonday(dateUTC(date));
      weeks.set(key,(weeks.get(key)||0)+Number(l.distance));
    }
    const bars=[...weeks.entries()].sort(([a],[b])=>a.localeCompare(b)).slice(-10);
    const top=Math.max(1,...bars.map(([,km])=>km));
    const bike=Object.values(db.rides||{}),bikeKm=bike.reduce((sum,r)=>sum+(Number(r.distance)||0),0);
    const bikeMinutes=bike.reduce((sum,r)=>sum+(rideMins(r.time)||0),0);
    const gymEntries=Object.entries(db.lifts).filter(([,v])=>
      v&&Object.values(v).some(x=>x&&typeof x==='object'&&x.done===true)).length;
    return `<section class="panel"><span class="eyebrow">Performance record</span>
      <h1 class="page-title">Your actual progress.</h1>
      <p class="section-sub">Only completed activities you recorded count. The app does not invent fitness, race results or missing sessions.</p></section>
      <div class="metrics-row">
        <div class="stat"><label>RUNNING · ALL LOGS</label><strong>${totalKm.toFixed(1)} km</strong><div class="fine">${records.length} logged runs</div></div>
        <div class="stat"><label>LAST 28 DAYS</label><strong>${recentKm.toFixed(1)} km</strong><div class="fine">${recent.length} recorded runs</div></div>
        <div class="stat"><label>RECENT LONGEST</label><strong>${longest?niceKm(longest)+' km':'—'}</strong><div class="fine">From the past 28 days</div></div>
      </div>
      <section class="panel"><div class="section-head"><div><h2>Weekly running history</h2>
        <p class="section-sub">Weeks with recorded running only; no assumed mileage.</p></div></div>
      ${bars.length?bars.map(([w,km])=>`<div class="report-row"><div class="row">
        <b>${fmt(w)} – ${fmt(plus(w,6))}</b><span class="small">${km.toFixed(2)} km</span></div>
        <div class="report-meter"><i style="width:${Math.min(100,km/top*100).toFixed(1)}%"></i></div></div>`).join(''):
        '<p class="section-sub">Your first recorded run will appear here.</p>'}
      <p class="mini-note">${imported?imported+' older shared activities are marked as imported; those do not drive adaptive progression. ':''}A week without a log means the app has no recorded activity, not that you trained zero.</p></section>
      <section class="panel"><div class="section-head"><h2>Gym & occasional cycling</h2>
        <button class="btn secondary" onclick="go('ride')">＋ Log ride</button></div>
        <div class="metrics-row">
          <div class="stat"><label>GYM LOGS</label><strong>${gymEntries}</strong><div class="fine">Sessions with exercises marked</div></div>
          <div class="stat"><label>BIKE RIDES</label><strong>${bike.length}</strong><div class="fine">Cross-training</div></div>
          <div class="stat"><label>BIKE DISTANCE</label><strong>${bikeKm.toFixed(1)} km</strong><div class="fine">${rideDuration(bikeMinutes)} recorded</div></div>
        </div>
        <p class="section-sub">Bike rides support aerobic work but never count as running kilometres.</p>
      </section>
      <section class="panel"><h2>Personal bests</h2>
        <p class="section-sub">Manually entered results. Use official verified times—these fields can affect automatic pace suggestions when enabled.</p>
        <div class="fields">${[['five','5K'],['ten','10K'],['half','Half Marathon'],['marathon','Marathon']].map(([k,label])=>
          `<div class="field"><label for="pb-${k}">${label}</label><input id="pb-${k}" value="${esc(db.prs[k]||'')}" placeholder="Time"
            onchange="db.prs['${k}']=this.value;save()"></div>`).join('')}</div>
        <p class="mini-note">Verified 10K PB supplied previously: 44:08. The flagged 43:18 result was excluded.</p>
      </section>`;
  };

  pages.plan=function(){
    const now=currentDay(),current=phaseAt(now);
    return `<section class="panel hero"><span class="eyebrow">2027 race roadmap</span>
      <h1 class="page-title">Four starts. One season.</h1>
      <p class="intro">Running performance first. Build for Toronto, recover before the half, practise the hourly ultra format, then return carefully for Detroit.</p>
      <div class="pill">Current phase · ${esc(current.name)}</div></section>
      <section class="panel"><h2>Your races</h2>
        ${RACES.map((r,i)=>`<div class="race"><div><span class="tag">0${i+1} · ${fmt(r.date)}</span>
          <strong>${esc(r.name)}</strong><p class="section-sub" style="margin:4px 0">${esc(r.goal)}</p></div>
          <em>${r.date>=now?(dayDiff(now,r.date)===0?'Today':dayDiff(now,r.date)+' days'):'Date passed'}</em></div>`).join('')}
        <p class="mini-note">Toronto sub-4 is an aspirational 5:41/km average, not a predicted result. The May 30 half-marathon event name still needs confirmation.</p>
      </section>
      <section class="panel"><h2>How your year progresses</h2>
        <p class="section-sub">Normal weeks: Monday easy, Tuesday threshold + Lower, Wednesday easy, Thursday Upper A, Friday rotating track, Saturday Upper B, Sunday long run. Race and recovery weeks are different.</p>
        <div class="year-phase is-active"><strong>Now: ${esc(current.name)}</strong><small>${fmt(current.start)} – ${fmt(current.end)} · ${esc(current.goal)}</small></div>
        <details class="compact-details"><summary>See every training phase</summary>
          ${PHASES.map(p=>`<div class="year-phase"><strong>${esc(p.name)}</strong>
          <small>${fmt(p.start)} – ${fmt(p.end)} · ${esc(p.range)}</small>
          <small>${esc(p.goal)}</small></div>`).join('')}</details>
      </section>
      <section class="panel"><h2>Recovery is a decision, not a date</h2>
        <p class="section-sub">Toronto is May 2; your half is only four weeks later. There is no guaranteed half PR. The first post-marathon week stays restful, with a short return only if recovered.</p>
        <p class="section-sub">After the backyard ultra, no structured Detroit rebuild is automatically unlocked. You confirm a comfortable return in Settings after the race.</p>
        <p class="section-sub">Browse future weeks in the Plan tab. Any workout labeled conditional is a forecast, not clearance to train before recovery.</p>
      </section>
      <section class="panel"><h2>Training pace reference</h2>
        <div class="grid two">
          <div class="stat"><label>EASY</label><strong style="font-size:16px">5:20–6:00/km</strong></div>
          <div class="stat"><label>RECOVERY</label><strong style="font-size:16px">5:45–6:20+/km</strong></div>
          <div class="stat"><label>THRESHOLD</label><strong style="font-size:16px">4:35–4:50/km</strong></div>
          <div class="stat"><label>TRACK</label><strong style="font-size:16px">Rep-specific</strong></div>
        </div>
        <p class="mini-note">Starting references only, informed by your entered 5K and 10K results. Long runs are usually as easy as easy runs—or slower. Conversational effort, weather, terrain, fatigue and current fitness matter more than any number. Track reps have separate targets in the workout.</p>
      </section>`;
  };

  pages.settings=function(){
    const a=adaptiveState(),today=currentDay(),current=weekStart();
    const afterToronto=today>='2027-05-03',afterUltra=today>='2027-08-01';
    const toronto=needsToronto(),ultra=needsUltra();
    return `<section class="panel"><span class="eyebrow">Training controls</span><h1 class="page-title">Make the plan yours.</h1>
      <p class="section-sub">Adaptive coaching works from recorded training. Manual choices remain available. A blank log is unknown—not a missed workout or evidence of fatigue.</p>
      <label class="setting-toggle"><input type="checkbox" ${a.enabled?'checked':''} onchange="adaptiveToggle(this.checked)">
        <span><b>Adaptive progression</b><br><small class="section-sub">Guide mileage from actual run history. Never change past records.</small></span></label>
      <div class="field"><label>Current week's training intensity</label><select onchange="coachManual('${current}',this.value)">
        ${[['','Automatic'],['normal','Normal (manual)'],['rebuild','Easy rebuilding'],['caution','Easy only / symptoms']]
          .map(([value,label])=>`<option value="${value}" ${a.coachOverrides?.[current]===value||!value&&!a.coachOverrides?.[current]?'selected':''}>${label}</option>`).join('')}
      </select></div>
      <details class="compact-details"><summary>Pace adjustments (advanced)</summary>
        <label class="setting-toggle"><input type="checkbox" ${a.autoRacePace?'checked':''} onchange="setAutoRacePace(this.checked)">
          <span>Adjust reference paces after a new verified 5K or 10K PB</span></label>
        <div class="field"><label>Manual pace offset (sec/km; negative means faster)</label>
          <input type="number" min="-30" max="30" step="5" value="${esc(a.paceOffset||0)}"
          onchange="adaptiveState().paceOffset=Math.max(-30,Math.min(30,Number(this.value)||0));save();render()"></div>
        <p class="mini-note">Pace changes are capped. Adjust manually if conditions or your actual training disagree with a suggestion.</p>
      </details>
    </section>
    <section class="panel"><h2>After-race recovery checks</h2>
      <p class="section-sub">Only confirm after the race and after normal walking, stairs and everyday activity feel comfortable. These are training controls, not medical clearance.</p>
      <label class="setting-toggle" ${!afterToronto?'aria-disabled="true"':''}>
        <input type="checkbox" ${toronto?'checked':''} ${!afterToronto?'disabled':''}
          onchange="adaptiveState().torontoReturnConfirmed=this.checked;adaptiveState().torontoReturnConfirmedAt=this.checked?iso(new Date()):'';save();render()">
        <span>Comfortable resuming short easy runs after Toronto<br><small class="section-sub">${afterToronto?'Recovery must still guide each session.':'Available after May 2, 2027.'}</small></span></label>
      <label class="setting-toggle" ${!afterUltra?'aria-disabled="true"':''}>
        <input type="checkbox" ${ultra?'checked':''} ${!afterUltra?'disabled':''}
          onchange="adaptiveState().marathonReturnConfirmed=this.checked;adaptiveState().ultraReturnConfirmedAt=this.checked?iso(new Date()):'';save();render()">
        <span>Comfortable resuming easy running after the backyard ultra<br>
        <small class="section-sub">${afterUltra?'Detroit training resumes conditionally.':'Available after July 31, 2027.'}</small></span></label>
      <p class="mini-note">If you have persistent pain, unusual fatigue, chest symptoms or another concerning issue, stop and seek qualified medical guidance.</p>
    </section>
    <section class="panel"><h2>Back up your training</h2>
      <p class="section-sub">Your full run/gym/bike history is stored in this browser. The cloud sync below sends a read-only widget snapshot; it is not a full backup.</p>
      <div class="page-actions"><button class="btn" onclick="exportData()">Export JSON backup</button>
        <label class="btn secondary" style="cursor:pointer">Import backup
          <input type="file" accept=".json,application/json" style="display:none"
          onchange="importData(this.files[0])"></label></div>
      <details class="advanced-reset"><summary>Erase local data (danger zone)</summary>
        <p class="warning-inline">Erasing is permanent unless you previously exported a backup. This also removes locally saved run, gym and bike entries.</p>
        <button class="btn danger" onclick="resetData()">Erase my local history</button></details>
    </section>`;
  };

  render();
})();
