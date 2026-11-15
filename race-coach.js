/* LOCK IN 2027 — four-race coaching layer.
   Loaded after the original app to preserve its logbook, gym history, cycling
   records, cloud account and widget snapshot contract. No data migration.
   Plans are provisional examples, not promises of fitness or race results. */
(() => {
  'use strict';

  const raceEvents = [
    {name:'Toronto Marathon',date:'2027-05-02',goal:'Finish first · sub-4 stretch',km:42.195},
    {name:'May 30 Half Marathon',date:'2027-05-30',goal:'PR if recovered · event name to confirm',km:21.0975},
    {name:'Persistence Backyard Ultra',date:'2027-07-31',goal:'15 hourly loops · 100.58 km',km:100.584},
    {name:'Detroit Free Press Marathon',date:'2027-10-17',goal:'PR if ready · finish first',km:42.195}
  ];
  const phases = [
    {name:'Base + Winter Lock-In',start:'2026-10-19',end:'2026-12-27',range:'Build from completed training',goal:'Five runs, three lifts; aerobic consistency'},
    {name:'Toronto Marathon Build',start:'2026-12-28',end:'2027-03-14',range:'Conditional 42–56 km/week',goal:'Build long-run durability and steady aerobic mileage'},
    {name:'Toronto Marathon-Specific',start:'2027-03-15',end:'2027-04-11',range:'Conditional 54–62 km/week',goal:'Fueling, long runs and controlled marathon-effort practice'},
    {name:'Toronto Marathon Taper',start:'2027-04-12',end:'2027-05-02',range:'Reduce volume over three weeks',goal:'Arrive rested; finish before pursuing a sub-four stretch goal'},
    {name:'Post-Toronto Recovery',start:'2027-05-03',end:'2027-05-16',range:'Recovery and optional short easy runs',goal:'Do not assume fitness or readiness from the calendar'},
    {name:'Half Marathon Return + Taper',start:'2027-05-17',end:'2027-05-30',range:'Recovery-dependent',goal:'PR only if fully recovered; otherwise controlled completion or skip'},
    {name:'Backyard Ultra Build',start:'2027-05-31',end:'2027-07-11',range:'Conditional return toward 40–50 km/week',goal:'Easy run/walk durability, fuel practice, optional hourly loops'},
    {name:'Backyard Ultra Taper',start:'2027-07-12',end:'2027-07-31',range:'Reduce load; protect race-day legs',goal:'Rehearse logistics for 15 × 6.7056 km loops'},
    {name:'Post-Ultra Recovery',start:'2027-08-01',end:'2027-08-22',range:'No mandatory mileage',goal:'Rest and reintroduce easy running only when ready'},
    {name:'Detroit Marathon Rebuild',start:'2027-08-23',end:'2027-10-03',range:'Conditional 32–50 km/week',goal:'Recover before adding marathon endurance and quality'},
    {name:'Detroit Marathon Taper',start:'2027-10-04',end:'2027-10-17',range:'Reduce volume',goal:'Healthy finish; consider a PR only if preparation supports it'}
  ];
  RACES.splice(0,RACES.length,...raceEvents.map(({name,date,goal})=>({name,date,goal})));
  PHASES.splice(0,PHASES.length,...phases);

  const originalPrescribedDays = prescribedDays;
  const originalWeekPrescription = weekPrescription;
  const originalCoachDecision = coachDecision;
  const originalAdaptiveTarget = adaptiveTarget;
  const originalGymDose = gymDose;
  const originalHome = pages.home;
  const originalSettings = pages.settings;
  const originalWeek = pages.week;
  const originalRecoveryRoutine = recoveryRoutine;
  const raceByDate = Object.fromEntries(raceEvents.map(r=>[r.date,r]));
  const trainingBlocks = [1,2,6,9];
  const rounded = n => Math.max(0,Math.round(n));
  const raceWithin = (date,days) => raceEvents.some(r=>Math.abs(dayDiff(date,r.date))<=days);
  const run = (title,km,effort,detail,lift) =>
    ({title,type:lift?'both':'run',target:km,effort,detail,lift});
  const rest = (title='Recovery / mobility',detail='Optional gentle walking or mobility; no make-up sessions.') =>
    ({title,type:'rest',detail});
  const gym = (title,lift,detail='Controlled strength; avoid failure and excessive soreness.') =>
    ({title,type:'gym',lift,detail});
  // Conservative starting references from the entered 21:11 5K / 44:08 10K;
  // conversational effort and updated verified performances take precedence.
  const EASY = '5:20–6:00/km';
  const RECOVERY = '5:45–6:20+/km';
  const LONG = '5:20–6:05/km';
  const THRESHOLD = '4:35–4:50/km';
  const torontoReady=()=>{
    const a=adaptiveState();
    return a.torontoReturnConfirmed===true&&String(a.torontoReturnConfirmedAt||'')>='2027-05-03';
  };
  const ultraReady=()=>{
    const a=adaptiveState();
    return a.marathonReturnConfirmed===true&&String(a.ultraReturnConfirmedAt||'')>='2027-08-01';
  };

  // Preserve every historical session and the exact browser storage key.
  // Earlier (Oct–Dec 2026) weeks remain on the already-approved programme.
  coachDecision = function(w,block) {
    if(block===0)return originalCoachDecision(w,0);
    const a=adaptiveState(),history=coachHistory(w);
    if(history.caution)return {mode:'caution',reason:'Recent notes mention symptoms. Keep running easy and reassess.'};
    if(block===4)return {mode:'recovery',reason:'Toronto recovery: easy running is optional, not automatically scheduled.'};
    if(block===5&&!torontoReady())return {mode:'recovery',reason:'Confirm a comfortable return after Toronto before planning the half.'};
    if(block===8)return {mode:'recovery',reason:'Ultra recovery: no automatic return to high mileage.'};
    if([9,10].includes(block)&&!ultraReady())
      return {mode:'recovery',reason:'Confirm comfortable return after the backyard ultra before planning Detroit.'};
    const selected=a.coachOverrides?.[w];
    if(selected)return {mode:selected,reason:'Manual coaching choice; recovery and race safeguards still apply.'};
    const base=originalCoachDecision(w,0);
    return {mode:base.mode,reason:base.reason};
  };

  function phaseWeek(w,block) {
    const beginning=weekMonday(dateUTC(PHASES[block].start));
    return Math.max(0,Math.floor(dayDiff(beginning,w)/7));
  }

  weekPrescription = function(w) {
    if(w<'2026-12-28')return originalWeekPrescription(w);
    const block=PHASES.indexOf(phaseAt(w)),bi=phaseWeek(w,block);
    const deload=trainingBlocks.includes(block)&&bi%4===3;
    let desired;
    switch(block){
      case 1: desired=Math.min(56,42+bi*1.5); break;
      case 2: desired=Math.min(62,54+bi*2); break;
      case 3: desired=[43,32,16][Math.min(bi,2)]; break;
      case 4: desired=bi===0?0:10; break;
      case 5: desired=bi===0?20:12; break;
      case 6: desired=[0,20,36,42,46,50][Math.min(bi,5)]; break;
      case 7: desired=[36,25,14][Math.min(bi,2)]; break;
      case 8: desired=bi<2?0:10; break;
      case 9: desired=[32,37,42,46,48,50][Math.min(bi,5)]; break;
      default: desired=bi===0?34:16;
    }
    if(deload)desired*=.85;
    return {block,bi,deload,desired:rounded(desired),
      target:rounded(desired),lr:Number(db.settings.longRun)||null,
      label:'Provisional target · confirm against logged fitness'};
  };

  function trainingMileage(w,block,q,preview=false) {
    const manuallySet=adaptiveState().weekOverrides[w];
    if(manuallySet!==undefined&&Number.isFinite(Number(manuallySet)))
      return Math.max(0,Math.min(180,Number(manuallySet)));
    if(block===4&&!torontoReady()&&!preview)return 0;
    if(block===5&&!torontoReady()&&!preview)return 0;
    if([8,9,10].includes(block)&&!ultraReady()&&!preview)return 0;
    // Existing adaptive engine uses completed app-tracked runs, with a
    // conservative ceiling for the next week. Map to its generic build block,
    // avoiding the superseded three-race phase indexes.
    if(trainingBlocks.includes(block)){
      const guided=originalAdaptiveTarget(w,q.desired,0);
      return Math.max(0,Math.min(180,Number(guided.total)||0));
    }
    return q.desired;
  }

  function qualityThreshold(km,block,bi) {
    const variants=block===2?[[3,8],[3,10],[2,12]]:block===6?[[2,6],[3,6]]:[[3,6],[2,8],[3,7]];
    let [count,minutes]=variants[bi%variants.length];
    const warm=2,recoveryMinutes=2;
    const totalWorkKm=count*minutes/4.70;
    const recoveryKm=(count-1)*recoveryMinutes/6.5;
    if(km<7||km-warm-totalWorkKm-recoveryKm<1) {
      count=2;minutes=5;
    }
    const needed=1.5+count*minutes/4.70+(count-1)/6.5+1;
    if(km<needed)
      return {title:'Easy + relaxed strides',effort:EASY,detail:'Run '+km+' km easy. Add 4 × 20 s relaxed strides if comfortable; no forced threshold work.'};
    return {title:'Threshold · '+count+' × '+minutes+' min',effort:THRESHOLD,
      detail:'Warm up 1.5 km easy; '+count+' × '+minutes+' min at controlled threshold ('+THRESHOLD+'); '+(count-1)+' × 1 min easy jog between repetitions; cool down easy to '+km+' km total. Not a time trial.'};
  }

  function qualityTrack(km,bi) {
    const workouts=[[6,400,'4:00–4:15/km'],[5,600,'4:05–4:20/km'],[4,800,'4:08–4:22/km'],[4,1000,'4:10–4:25/km']];
    const [n,metres,pace]=workouts[bi%workouts.length];
    const recovery=(n-1)*.2,work=n*metres/1000,cool=km-2-work-recovery;
    if(cool<1)return {title:'Track drills + strides',effort:EASY,
      detail:'Run '+km+' km easy; finish with four relaxed 20-second strides, walking to full recovery. No interval set fits safely.'};
    return {title:'Track · '+n+' × '+metres+' m',effort:pace,
      detail:'Warm up 2 km easy; '+n+' × '+metres+' m at '+pace+'; 200 m walk/jog between reps; cool down '+cool.toFixed(1)+' km easy; '+km+' km total. Smooth, consistent repetitions.'};
  }

  function defaultTrainingWeek(w,block,q,mode,preview=false) {
    const total=trainingMileage(w,block,q,preview);
    const weights=block===2?[.14,.19,.14,.17,.36]:[.15,.20,.15,.18,.32];
    const targets=weights.map(x=>rounded(total*x));
    targets[4]=Math.max(0,rounded(total)-targets.slice(0,4).reduce((a,b)=>a+b,0));
    // A future plan cannot certify a 20–30 km long run from old records alone.
    const today=iso(new Date()),profile=recentRunProfile(w>today?today:w);
    if(adaptiveState().enabled) {
      // Do not prescribe an unearned long-run jump when no recent run history exists.
      // Logged training is evidence, not a guarantee of readiness.
      const cap=profile.longest>=8 ? Math.max(10,rounded(profile.longest*1.15)) : 10;
      targets[4]=Math.min(targets[4],cap);
    }
    const [m,t,we,f,l]=targets;
    const threshold=qualityThreshold(t,block,q.bi);
    const track=qualityTrack(f,q.bi);
    const protect=mode==='caution'||mode==='rebuild';
    const raceProximity=Array.from({length:7},(_,i)=>plus(w,i)).some(date=>raceWithin(date,13));
    const easyText=km=>'Run '+km+' km at a comfortable, conversational effort ('+EASY+').';
    const d=[
      run('Monday easy',m,EASY,easyText(m)),
      run('Tuesday '+threshold.title+' + Lower',t,threshold.effort,threshold.detail+'; Lower-body strength after the run or several hours later.', 'lower'),
      run('Wednesday easy',we,EASY,easyText(we)+' Optional 4 × 20 s relaxed strides.'),
      gym('Thursday Upper A','upperA'),
      run('Friday '+track.title,f,track.effort,track.detail),
      gym('Saturday Upper B','upperB'),
      run('Sunday long easy',l,LONG,'Run '+l+' km conversational; practise carrying fluids and fuel on longer outings. Walk breaks are fine.')
    ];
    if(protect||raceProximity) {
      for(const i of [1,4]){
        d[i].effort=EASY;
        d[i].title=i===1?'Tuesday easy + light Lower':'Friday easy / relaxed strides';
        d[i].detail='Run '+d[i].target+' km easy. Quality is reduced because of '+(protect?'symptoms or an explicit easy-week choice.':'race proximity.')+(i===1?' Lower-body lifting optional and light.':'');
      }
    }
    if(block===2&&mode==='normal'&&!raceProximity){
      d[6].detail+=' If recovered, practise 4–8 km at sustainable marathon effort inside an occasional long run, never as an extra session.';
    }
    if(block===6){
      d[1].detail+=' Keep threshold modest: ultra success comes from durable easy running.';
      d[4].detail+=' Keep the track controlled; no maximal sprinting.';
      if(q.bi>=2&&q.bi%2===0&&l>=14&&mode==='normal'){
        const loops=l>=21?3:2;
        d[6].title='Sunday long · hourly loop rehearsal';
        d[6].effort='Easy run/walk';
        d[6].detail='Rehearse '+loops+' starts on the hour, each loop 6.7056 km (about '+(loops*6.7056).toFixed(1)+' km total). Walk early, eat and drink between starts. Replace the long run—do not add loops on top. Log the actual distance.';
      }
    }
    if(block===9){
      d[6].detail+=' Detroit build: include modest marathon-effort segments only after you have returned comfortably from the ultra.';
    }
    return d;
  }

  // Recovery and race tapers deliberately do not force five runs or three
  // strength sessions. The date alone never proves the athlete is recovered.
  function specialWeek(w,block,q,preview=false) {
    const bi=q.bi,a=adaptiveState();
    let d=Array.from({length:7},()=>rest());
    if(block===3){
      if(bi===0){
        d[0]=run('Easy aerobic',8,EASY,'8 km conversational.');
        d[1]=run('Short threshold touch + light Lower',8,THRESHOLD,'Warm up 2 km; 2 × 6 min controlled threshold; easy recovery jog; cool down to 8 km. Lower-body strength optional, light.', 'lower');
        d[2]=run('Easy aerobic',7,EASY,'7 km conversational.');
        d[3]=gym('Upper A · maintenance','upperA');
        d[4]=run('Track technique',7,EASY,'7 km easy with 4 × 20 s smooth relaxed strides; no hard intervals.');
        d[5]=gym('Upper B · maintenance','upperB');
        d[6]=run('Last moderate long run',13,LONG,'13 km easy, no faster finish. Practise race-day fueling.');
      }else if(bi===1){
        d[0]=run('Easy aerobic',7,EASY,'7 km easy.');
        d[1]=run('Light threshold touch',7,THRESHOLD,'2 km easy warm-up; 2 × 5 min controlled threshold with 2 min jog; easy cooldown to 7 km. No heavy lower-body lifting.');
        d[2]=run('Easy aerobic',6,EASY,'6 km easy.');
        d[3]=gym('Upper A · optional','upperA');
        d[4]=run('Easy + relaxed strides',5,EASY,'5 km easy with optional 4 × 15 s relaxed strides.');
        d[6]=run('Shortened long run',9,LONG,'9 km easy. Prioritise freshness.');
      }else{
        d[0]=run('Easy aerobic',5,EASY,'5 km easy.');
        d[2]=run('Easy aerobic',4,EASY,'4 km easy; no workout effort.');
        d[4]=run('Optional shakeout',3,RECOVERY,'3 km very easy only if it helps you feel fresh.');
        d[5]=rest('Pre-race rest','Organise bib, kit, familiar fueling and transport. No make-up mileage.');
      }
    }else if(block===4){
      d=Array.from({length:7},(_,i)=>rest(i===0?'Post-marathon rest':'Recover / optional walk',
        'Recover from Toronto. Rest or walk gently; no compulsory mileage, intensity or leg lifting.'));
      if(bi>=1&&(torontoReady()||preview)){
        d[1]=run('Optional return · easy',3,RECOVERY,'Only if pain-free walking, stairs and daily activity feel normal; 3 km easy or rest.');
        d[3]=run('Optional return · easy',4,RECOVERY,'4 km easy or rest; stop if soreness or fatigue returns.');
      }
    }else if(block===5){
      if(!torontoReady()&&!preview)return d.map(()=>rest('Recovery comes first','No structured running until you confirm comfortable return after Toronto. The half is optional.'));
      if(bi===0){
        d[0]=run('Easy return',5,RECOVERY,'5 km easy if comfortable after Toronto.');
        d[2]=run('Easy + brief controlled pickup',5,EASY,'5 km comfortable; optional 2 × 3 minutes steady only if fully recovered.');
        d[3]=gym('Upper A · optional','upperA');
        d[4]=run('Easy aerobic',4,EASY,'4 km conversational.');
        d[6]=run('Easy endurance',7,EASY,'7 km easy, not a fitness test.');
      }else{
        d[0]=run('Easy aerobic',4,RECOVERY,'4 km relaxed.');
        d[2]=run('Easy aerobic',4,RECOVERY,'4 km relaxed, without threshold work.');
        d[4]=run('Optional short shakeout',3,RECOVERY,'3 km gentle if fully comfortable.');
        d[5]=rest('Rest before the half','Take the start only if you have recovered from Toronto.');
      }
    }else if(block===6){
      // May 31 follows the half marathon immediately: don't begin a new
      // five-run training block as if a hard race were a rest day.
      if(bi===0){
        d=Array.from({length:7},()=>rest('Post-half recovery',
          'Rest, walk or bike gently if comfortable. No running mileage is owed.'));
      }else if(bi===1){
        d[0]=run('Easy return',5,RECOVERY,'5 km very easy if recovered from the half.');
        d[2]=run('Easy aerobic',6,EASY,'6 km conversational; no pace targets to chase.');
        d[4]=run('Easy aerobic',5,EASY,'5 km comfortable; no intervals yet.');
        d[6]=run('Easy endurance',8,LONG,'8 km easy if the preceding outings felt comfortable.');
      }
    }else if(block===7){
      if(bi===0){
        d[0]=run('Easy aerobic',7,EASY,'7 km conversational.');
        d[1]=run('Short controlled threshold',7,THRESHOLD,'Warm up 2 km; 2 × 5 min controlled threshold with easy recovery; cool down to 7 km. Optional light Lower only if fresh.','lower');
        d[2]=run('Easy aerobic',6,EASY,'6 km easy.');
        d[3]=gym('Upper A · maintenance','upperA');
        d[4]=run('Easy + strides',5,EASY,'5 km easy with 4 × 15 s relaxed strides.');
        d[6]=run('Short long run',11,LONG,'11 km easy, practise the gear and fuel you will use.');
      }else if(bi===1){
        d[0]=run('Easy',6,EASY,'6 km easy.');
        d[2]=run('Easy',5,EASY,'5 km easy.');
        d[4]=run('Easy + strides',4,EASY,'4 km relaxed, optional strides.');
        d[6]=run('Short long run',8,LONG,'8 km easy.');
      }else{
        d[0]=run('Easy',5,RECOVERY,'5 km very easy.');
        d[2]=run('Easy',4,RECOVERY,'4 km very easy.');
        d[4]=run('Optional shakeout',3,RECOVERY,'3 km easy if helpful.');
        d[6]=rest('After-race recovery','Rest after the backyard ultra; no added running.');
      }
    }else if(block===8){
      d=Array.from({length:7},()=>rest('Ultra recovery','No mandatory training. Rest, eat, sleep and walk gently if comfortable.'));
      if(bi>=2&&(ultraReady()||preview)){
        d[1]=run('Optional easy return',3,RECOVERY,'Short easy run only if everyday movement is comfortable. Rest if unsure.');
        d[4]=run('Optional easy return',4,RECOVERY,'4 km very easy; stop if symptoms return.');
      }
    }else if(block===10){
      if(!ultraReady()&&!preview)return d.map(()=>rest('Recovery before Detroit','No structured marathon training until comfortable post-ultra return is confirmed.'));
      if(bi===0){
        d[0]=run('Easy aerobic',7,EASY,'7 km relaxed.');
        d[1]=run('Brief controlled threshold',7,THRESHOLD,'Warm up 2 km; 2 × 5 min controlled threshold; cool down easy to 7 km.');
        d[2]=run('Easy aerobic',6,EASY,'6 km relaxed.');
        d[4]=run('Easy + short strides',5,EASY,'5 km easy; optional 4 × 15 s strides.');
        d[6]=run('Shortened long run',9,LONG,'9 km easy. Fuel consistently.');
      }else{
        d[0]=run('Easy aerobic',5,EASY,'5 km relaxed.');
        d[2]=run('Easy aerobic',4,EASY,'4 km relaxed.');
        d[4]=run('Optional shakeout',3,RECOVERY,'3 km very easy, no hard efforts.');
        d[5]=rest('Pre-race rest','Prepare fueling, transport and kit; no extra training.');
      }
    }
    return d;
  }

  function raceDetail(r) {
    if(r.date==='2027-05-02')
      return 'Toronto full marathon, 42.195 km. Finish first. Sub-four requires about 5:41/km and is a stretch target only if training, fueling and conditions support it. Start conservatively and adjust to effort.';
    if(r.date==='2027-05-30')
      return 'Half marathon four weeks after Toronto. A PR is optional, never assumed. If pain, persistent fatigue or incomplete recovery remain, slow down or do not start. No forced target pace.';
    if(r.date==='2027-07-31')
      return 'Persistence Backyard Ultra: aim for 15 × 6.7056 km = 100.584 km. Each loop starts on the hour; practise food, fluids, walking and restart discipline. Race length depends on recovery and conditions.';
    return 'Detroit full marathon, 42.195 km. Healthy completion is the default. Only consider a personal best after demonstrated recovery from the ultra and a consistent rebuild.';
  }

  function applyManual(d,date) {
    if(raceByDate[date])return d;
    const over=adaptiveState().dayOverrides[date]||{};
    if(over.target!==undefined&&(d.type==='run'||d.type==='both')){
      const n=Number(over.target);
      if(Number.isFinite(n)&&n>=0&&n<=100){
        d.target=n;
        if(n===0){
          d.type=d.lift?'gym':'rest';
          d.title=d.lift?'Strength only (manual)':'Rest (manual)';
          d.effort=undefined;
          d.detail='No run scheduled by your manual override.';
        }else{
          d.detail='Manual run distance: '+n+' km. Your original structured workout is replaced; return to Automatic to restore it.';
        }
      }
    }
    if(over.effort&&d.target>0){d.effort=String(over.effort).slice(0,80);d.detail+=' Manual pace: '+d.effort+'.';}
    else if(d.effort)d.effort=adaptivePace(d.effort);
    if(!over.effort)d.detail=adaptivePace(d.detail);
    return d;
  }

  prescribedDays = function(w,options={}) {
    if(w<'2026-12-28')return originalPrescribedDays(w);
    const q=weekPrescription(w),block=q.block;
    const preview=options.preview===true&&w>weekMonday(new Date());
    const recoveryBlocked=(block===5&&!torontoReady())||([9,10].includes(block)&&!ultraReady());
    const mode=preview&&recoveryBlocked?'provisional':coachDecision(w,block).mode;
    const postHalfReset=block===6&&q.bi<2;
    let days=trainingBlocks.includes(block)&&!postHalfReset
      ? (mode==='recovery'?Array.from({length:7},()=>rest('Return to running pending','Only resume structured training when post-race recovery is confirmed.')):defaultTrainingWeek(w,block,q,mode,preview))
      : specialWeek(w,block,q,preview);
    // Weekly manual override also works during tapers; a race's official
    // distance remains fixed. Recovery-only weeks cannot be made mandatory
    // through a mileage field.
    const requested=adaptiveState().weekOverrides[w];
    if(!trainingBlocks.includes(block)&&![4,5,8,9,10].includes(block)&&requested!==undefined
      &&Number.isFinite(Number(requested))&&Number(requested)>=0){
      const fixedRaceKm=days.reduce((sum,_,i)=>sum+(raceByDate[plus(w,i)]?.km||0),0);
      const budget=Math.max(0,Math.min(180,Number(requested))-fixedRaceKm);
      const active=days.map((d,i)=>({i,km:Number(d.target)||0}))
        .filter(({i,km})=>km>0&&!raceByDate[plus(w,i)]);
      const base=active.reduce((sum,x)=>sum+x.km,0);
      if(base>0){
        let used=0;
        active.forEach(({i,km},idx)=>{
          const target=idx===active.length-1?Math.max(0,rounded(budget)-used):rounded(budget*km/base);
          days[i].target=target;used+=target;
          if(target>0)days[i].detail='Manual weekly-mileage adjustment: '+target+' km easy or controlled. Original session is reduced; do not add intensity to make up distance.';
        });
      }
    }
    days=days.map((session,i)=>{
      const d={...session},date=plus(w,i),r=raceByDate[date];
      if(r)return {
        title:'RACE DAY · '+r.name,
        type:'run',
        target:r.km,
        effort:'Race strategy · no forced pace',
        detail:raceDetail(r)+'; '+originalRecoveryRoutine(d,i,4,true),
        forecast:preview,
        conditional:preview && ((r.date==='2027-05-30'&&!torontoReady())||(r.date==='2027-10-17'&&!ultraReady()))
      };
      const safe=applyManual(d,date);
      if(!safe.target&&safe.type==='run')return rest('Rest / mobility');
      if(!safe.target&&safe.type==='both'){
        safe.type='gym';safe.title='Lower Body · no run';safe.effort=undefined;
        safe.detail='Running distance is zero. Optional controlled gym work only.';
      }
      safe.detail+='; '+originalRecoveryRoutine(safe,i,[4,8].includes(block)?4:block,false);
      if(preview){
        safe.forecast=true;
        safe.conditional=recoveryBlocked||(block===4&&!torontoReady())||(block===8&&!ultraReady());
      }
      return safe;
    });
    return days;
  };

  gymDose = function(date,type) {
    if(date<'2026-12-28')return originalGymDose(date,type);
    const block=PHASES.indexOf(phaseAt(date)),a=adaptiveState();
    if(raceWithin(date,9)||[4,8].includes(block)||(block===6&&phaseWeek(weekMonday(dateUTC(date)),6)<2)
      ||([5].includes(block)&&!torontoReady())
      ||([9,10].includes(block)&&!ultraReady()))
      return {label:'Recovery / race period',mode:'skip',tip:'No heavy lifting; optional gentle mobility only.'};
    if([3,5,7,10].includes(block))
      return {label:'Race preparation · optional maintenance',mode:'light',tip:'One or two comfortable sets if fresh; avoid leg soreness.'};
    if(type==='lower'&&[2,6,9].includes(block))
      return {label:'Running-first lower-body maintenance',mode:'reduced',tip:'One or two sets, leave repetitions in reserve; prioritise the next run.'};
    if([2,6,9].includes(block))
      return {label:'Upper-body maintenance',mode:'maintenance',tip:'Two clean sets per exercise; avoid failure.'};
    return {label:'Strength and physique',mode:'full',tip:'Controlled sets; progress after completing the full rep range without hurting running.'};
  };

  pages.home = function() {
    return originalHome().replace(
      'Half marathon PR → 100 km backyard ultra → Detroit Marathon finish.',
      'Toronto full → half PR if recovered → 100 km backyard → Detroit full. Running comes first.'
    );
  };

  pages.plan = function() {
    const today=iso(new Date()),a=adaptiveState();
    return `<section class="panel hero"><div class="eyebrow">2027 · Four-race roadmap</div>
      <h1>FOUR START LINES.<br>ONE SMART PLAN.</h1>
      <p class="muted">Marathon endurance first. Recover. Chase the half PR only if ready. Build for 100 km. Finish Detroit healthy.</p>
      <span class="pill">5 runs + 3 lifts in normal weeks · recovery exceptions</span></section>
      <section class="panel"><h2>Race calendar & priorities</h2>
      ${raceEvents.map((r,i)=>`<div class="race"><div><span class="tag">0${i+1} · ${fmt(r.date)} · 2027</span>
      <strong>${esc(r.name)}</strong><div class="small">${esc(r.goal)}</div></div>
      <em>${r.km>90?'100.58':r.km>40?'42.2':'21.1'} km</em></div>`).join('')}
      <p class="mini muted">Toronto sub-four is a stretch goal, not an automatically prescribed pace. A 4-hour marathon is roughly 5:41/km.</p></section>
      <section class="panel"><h2>Training blocks</h2>
      ${PHASES.map(p=>`<div class="phase ${today>=p.start&&today<=p.end?'active':''}"><b>${esc(p.name)}</b>
      <small>${fmt(p.start)} – ${fmt(p.end)} · ${esc(p.range)}</small>
      <p class="mini" style="margin:5px 0 0">${esc(p.goal)}</p></div>`).join('')}
      <p class="mini muted">Volume ranges are planning guides, not proof you can safely cover them. Completed training, long-run history, recovery and manual overrides determine what is appropriate.</p></section>
      <section class="panel"><h2>Recovery decision points</h2>
      <p><b>After Toronto · May 3–16:</b> No automatic running in the first week. Short easy returns only after comfortable daily movement and your manual confirmation.</p>
      <p><b>Half marathon · May 30:</b> ${a.torontoReturnConfirmed?'Return confirmed; keep evaluating fatigue.':'Toronto recovery not yet confirmed.'} ${a.halfPrAttempt?'You selected a conditional PR attempt.':'Default to a controlled finish or skip if not recovered.'}</p>
      <p><b>After the 100 km attempt · Aug 1–22:</b> No forced mileage; Detroit structured training remains gated until you confirm return.</p>
      <p><b>Detroit · Oct 17:</b> Healthy finish first. A PR is earned through recovery and consistent training, never assumed.</p></section>
      <section class="panel"><h2>Pace guidance</h2>
      <div class="grid two"><div class="stat"><label>EASY / LONG</label><strong style="font-size:16px">5:15–5:50/km</strong></div>
      <div class="stat"><label>RECOVERY</label><strong style="font-size:16px">5:40–6:15+/km</strong></div>
      <div class="stat"><label>THRESHOLD</label><strong style="font-size:16px">4:25–4:40/km</strong></div>
      <div class="stat"><label>TORONTO SUB-4</label><strong style="font-size:16px">5:41/km*</strong></div></div>
      <p class="mini muted">*Race stretch pace only; not a training prescription or prediction. Use actual effort, weather and verified performance to adjust. Training paces are starting references from your logged history.</p></section>`;
  };

  pages.settings = function() {
    return originalSettings()+`<section class="panel"><h2>2027 race recovery controls</h2>
    <p class="mini muted">The calendar never assumes you have recovered from a marathon. These are manual training decisions, not medical clearance.</p>
    <label class="check" style="display:flex;gap:10px;margin:12px 0">
    <input type="checkbox" ${adaptiveState().torontoReturnConfirmed?'checked':''}
    onchange="adaptiveState().torontoReturnConfirmed=this.checked;save();render()">
    Comfortable returning to short easy runs after Toronto</label>
    <p class="mini muted">Only check after the race when walking, stairs and everyday activity feel comfortable. The first post-race week remains recovery-focused.</p>
    <label class="check" style="display:flex;gap:10px;margin:12px 0">
    <input type="checkbox" ${adaptiveState().halfPrAttempt?'checked':''}
    onchange="adaptiveState().halfPrAttempt=this.checked;save();render()">
    Consider a half-marathon PR if fully recovered</label>
    <p class="mini muted">Four weeks between a full and a half is tight. This choice never removes safety or recovery safeguards.</p></section>`;
  };

  // The legacy form excludes three old race dates from manual edits. Remove
  // the ineffective edit box from Toronto race day too (actual logs remain editable).
  pages.week = function() {
    let output=originalWeek();
    const start=output.indexOf('id="workout-2027-05-02"');
    if(start<0)return output;
    const end=output.indexOf('<details class="workout-expand"',start);
    if(end<0)return output;
    const prefix=output.slice(start,end);
    const clean=prefix.replace(/<div class="fields"><div class="field"><label>Override run distance \(km\)<\/label>[\s\S]*?<\/div><div class="field">[\s\S]*?<\/div><\/div>/,'');
    return output.slice(0,start)+clean+output.slice(end);
  };

  render();
  // Once the signed-in cloud session initializes, publish the updated schedule
  // through the existing authenticated snapshot path. No credentials changed.
  setTimeout(()=>{if(typeof queueCloudSync==='function')queueCloudSync()},4000);
})();
