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
const w=new ListWidget();w.backgroundColor=new Color('#0C111B');w.setPadding(16,17,14,17);w.url=WEBSITE;
w.refreshAfterDate=new Date(Date.now()+20*60*1000);
function line(text,size,color,bold=false){const x=w.addText(text);x.font=bold?Font.boldSystemFont(size):Font.mediumSystemFont(size);x.textColor=new Color(color);x.lineLimit=2;x.minimumScaleFactor=0.75;return x}
const head=w.addStack();head.layoutHorizontally();
const h=head.addText('LOCK IN 2027');h.font=Font.boldSystemFont(12);h.textColor=new Color('#89BDF5');
head.addSpacer();const t=head.addText(new Date().toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'}).toUpperCase());t.font=Font.mediumSystemFont(10);t.textColor=new Color('#9CA9BC');
w.addSpacer(12);
if(result){
  const s=result.snapshot, today=new Date();
  const key=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
  const entry=s.days?.find(x=>x.date===key);
  line('TODAY',10,'#7E8EA6');w.addSpacer(5);
  if(entry){
    line((entry.plannedKm>0?entry.plannedKm+' KM · ':'')+(entry.title||'Workout').toUpperCase(),19,'#FFFFFF',true);
    if(entry.gym) {w.addSpacer(4);line('GYM · '+entry.gym.toUpperCase(),11,'#D4E1F0')}
    if(entry.completed){w.addSpacer(4);line('LOGGED · '+(entry.actualKm??0)+' KM',10,'#91D4B4')}
  }else{line('OPEN APP TO REFRESH PLAN',16,'#FFFFFF',true)}
  w.addSpacer();line('THIS WEEK',9,'#7E8EA6');w.addSpacer(3);
  line((s.completedKm??0)+' / '+(s.weeklyTargetKm??'—')+' KM',18,'#FFFFFF',true);
  const stamp=new Date(result.updatedAt);
  w.addSpacer(5);line((result.offline?'OFFLINE CACHE · ':'SYNCED · ')+ (isNaN(stamp.getTime())?'unknown':stamp.toLocaleDateString('en-CA',{month:'short',day:'numeric'})+' '+stamp.toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit'})),9,result.offline?'#E8B66C':'#8194AD');
}else{
  line('SYNC NOT READY',18,'#FFFFFF',true);w.addSpacer(7);
  line(notice||'Open Scriptable to sign in',11,'#E8B66C');
}
Script.setWidget(w);
if(!config.runsInWidget) await w.presentMedium();
Script.complete();
