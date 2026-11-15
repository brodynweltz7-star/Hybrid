// LOCK IN 2027 · Scriptable medium widget · Supabase secure sync
// Enter the same PUBLIC project values as cloud-config.js. Do not put a service-role key here.
const URL = 'https://jeeninsfsjyuvsrvactc.supabase.co';
const KEY = 'sb_publishable_wy6cY5dmb2v6pKhkzBdXdg_yDSlWtJq';
const WEBSITE = 'https://brodynweltz7-star.github.io/Hybrid/';
const KC = 'lockin2027.sync.' + URL;
const fm = FileManager.local();
const cacheFile = fm.joinPath(fm.documentsDirectory(), 'lockin2027-widget-cache.json');

async function credentials() {
  const eKey = KC + '.email', pKey = KC + '.password';
  if (Keychain.contains(eKey) && Keychain.contains(pKey)) return {email:Keychain.get(eKey),password:Keychain.get(pKey)};
  if (config.runsInWidget) throw new Error('Run script in Scriptable once to sign in');
  const a = new Alert(); a.title='LOCK IN 2027 · Sign in';
  a.message='Use the same Supabase account as your website. Credentials are stored in the iPhone Keychain, not in this script.';
  a.addTextField('Email'); a.addSecureTextField('Password'); a.addAction('Save login'); a.addCancelAction('Cancel');
  if (await a.present() === -1) throw new Error('Login cancelled');
  const email=a.textFieldValue(0).trim(),password=a.textFieldValue(1);
  if (!email||!password) throw new Error('Email and password required');
  Keychain.set(eKey,email);Keychain.set(pKey,password);return {email,password};
}
async function getSnapshot() {
  if (URL.includes('PASTE_')||KEY.includes('PASTE_')) throw new Error('Fill in Supabase URL and key');
  const creds=await credentials();
  const login=new Request(URL+'/auth/v1/token?grant_type=password');
  login.method='POST';login.timeoutInterval=15;
  login.headers={'apikey':KEY,'Content-Type':'application/json'};
  login.body=JSON.stringify(creds);
  const auth=await login.loadJSON();
  if (!auth.access_token) throw new Error(auth.error_description||auth.msg||'Sign in failed');
  const req=new Request(URL+'/rest/v1/widget_snapshots?select=snapshot,updated_at&limit=1');
  req.headers={'apikey':KEY,'Authorization':'Bearer '+auth.access_token,'Accept':'application/json'};
  req.timeoutInterval=15;
  const rows=await req.loadJSON();
  if (!Array.isArray(rows)||!rows[0]?.snapshot) throw new Error('No synced data. Open website Settings → Sync now');
  const result={snapshot:rows[0].snapshot,updatedAt:rows[0].updated_at};
  fm.writeString(cacheFile,JSON.stringify(result));return {...result,offline:false};
}
let result,notice='';
try {result=await getSnapshot();}catch(e){
  notice=e.message;
  if (fm.fileExists(cacheFile)) {try{result={...JSON.parse(fm.readString(cacheFile)),offline:true}}catch{}}
}
const w=new ListWidget();
w.backgroundColor=new Color('#111216');
w.setPadding(13,16,12,16);
w.url=WEBSITE;
w.refreshAfterDate=new Date(Date.now()+20*60*1000);
function line(text,size,color,bold=false,limit=1){
 const x=w.addText(String(text));
 x.font=bold?Font.boldSystemFont(size):Font.mediumSystemFont(size);
 x.textColor=new Color(color);x.lineLimit=limit;x.minimumScaleFactor=0.7;return x;
}
function dayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function weekKey(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);x.setDate(x.getDate()-(x.getDay()+6)%7);return dayKey(x)}
function displayName(s){return String(s||'').replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+/i,'').replace(/\s+rotating\s+/ig,' ').trim()}
const now=new Date(),key=dayKey(now),week=weekKey(now);
const head=w.addStack();head.layoutHorizontally();head.centerAlignContent();
const brand=head.addText('LOCK IN 2027');brand.font=Font.boldSystemFont(12);brand.textColor=new Color('#EF7779');
head.addSpacer();
const date=head.addText(now.toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'}).toUpperCase());
date.font=Font.mediumSystemFont(10);date.textColor=new Color('#B9BBC0');
w.addSpacer(10);
if(result){
 const s=result.snapshot||{};
 const currentWeek=s.weekStart===week;
 const entry=Array.isArray(s.days)?s.days.find(x=>x.date===key):null;
 const stamp=new Date(result.updatedAt);
 const oldSnapshot=!currentWeek;
 line('TODAY',10,'#B9BBC0');w.addSpacer(4);
 if(entry&&currentWeek){
  const km=Number(entry.plannedKm)||0;
  const name=displayName(entry.title||'Workout').toUpperCase();
  line((km>0?km+' KM · ':'')+name,18,'#FFFFFF',true,2);
  if(km>0){
   w.addSpacer(3);
   if(entry.targetPace){
    const paceLabel=entry.paceKind||'Target pace';
    line(paceLabel+': '+entry.targetPace,11,'#E7D8D9',false,1);
   }else line('Pace not specified',10,'#E8B66C');
  }
  if(entry.gym&&!entry.missedGym){w.addSpacer(3);line('GYM · '+String(entry.gym).toUpperCase(),10,'#DAD8DD');}
  w.addSpacer(4);
  if(entry.completed&&Number(entry.actualKm)>0){line('COMPLETED · '+Number(entry.actualKm)+' KM LOGGED',10,'#91D4B4');}
  else if(entry.missedRun)line('RUN EXCUSED · '+entry.missedRun.toUpperCase(),10,'#E8B66C');
  else if(km>0)line('RUN NOT LOGGED',10,'#B6B6BC');
  else if(!entry.missedGym)line('NO RUN PLANNED',10,'#B6B6BC');
  if(entry.missedGym){w.addSpacer(2);line('GYM EXCUSED · '+entry.missedGym.toUpperCase(),10,'#E8B66C');}
 }else{
  line('OPEN APP TO REFRESH PLAN',15,'#FFFFFF',true,2);
  w.addSpacer(4);
  line('Cloud snapshot is from another week',10,'#E8B66C');
 }
 w.addSpacer();
 const bar=w.addStack();bar.backgroundColor=new Color('#454248');bar.size=new Size(0,1);
 w.addSpacer(8);
 const bottom=w.addStack();bottom.layoutHorizontally();
 const left=bottom.addStack();left.layoutVertically();
 const wk=left.addText('THIS WEEK');wk.font=Font.mediumSystemFont(9);wk.textColor=new Color('#B9BBC0');
 left.addSpacer(3);
 const total=left.addText(currentWeek?(String(s.completedKm??'—')+' / '+String(s.weeklyTargetKm??'—')+' KM'):'NOT SYNCED');
 total.font=Font.boldSystemFont(16);total.textColor=Color.white();total.minimumScaleFactor=0.7;
 bottom.addSpacer(12);
 const right=bottom.addStack();right.layoutVertically();right.size=new Size(130,0);
 const nextDate=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
 const nextKey=dayKey(nextDate);
 const next=currentWeek&&Array.isArray(s.days)?s.days.find(x=>x.date===nextKey):null;
 const nlab=right.addText('UP NEXT');nlab.font=Font.mediumSystemFont(9);nlab.textColor=new Color('#B9BBC0');
 right.addSpacer(3);
 const nextLabel=next?.missedRun||next?.missedGym?'Excused · '+(next.missedRun||next.missedGym):next?displayName(next.title||'Workout'):'Check app';
 const nt=right.addText(nextLabel);
 nt.font=Font.semiboldSystemFont(10);nt.textColor=new Color('#F3E6E7');nt.lineLimit=2;nt.minimumScaleFactor=0.7;
 const valid=!isNaN(stamp.getTime());
 const staleHours=valid?(Date.now()-stamp.getTime())/3600000:Infinity;
 if(result.offline||oldSnapshot||staleHours>24){
  w.addSpacer(6);
  line((result.offline?'OFFLINE · ':oldSnapshot?'OUTDATED WEEK · ':'PLAN MAY BE OUTDATED · ')+
   (valid?stamp.toLocaleDateString('en-CA',{month:'short',day:'numeric'})+' '+stamp.toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit'}):'date unavailable'),9,'#E8B66C');
 }
}else{
 line('SYNC NOT READY',17,'#FFFFFF',true);w.addSpacer(7);
 line(notice||'Open Scriptable to sign in',11,'#E8B66C',false,3);
}
Script.setWidget(w);
if(!config.runsInWidget)await w.presentMedium();
Script.complete();
