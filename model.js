import {freshState, validateState as validateV1, safeUrl} from './defaults.js';
import {DEFAULT_CLASSES, schoolTime} from './schedule.js';
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (v,n=200) => typeof v==='string'?v.slice(0,n):'';
export function validDate(v) { return typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v+'T12:00:00Z')) && new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v; }
export function upgrade(raw = freshState()) {
  if (![1,2].includes(raw?.version)) throw new Error('Choose a SchoolTool version 1 or 2 backup.');
  const s=validateV1({...raw,version:1});
  s.version=2;
  for (const key of Object.keys(DEFAULT_CLASSES)) {
    s.profile.classes[key].teacher=text(raw.profile?.classes?.[key]?.teacher,60);
    s.profile.classes[key].url=safeUrl(raw.profile?.classes?.[key]?.url)||'';
  }
  s.weekdays={};
  for(const day of ['Mon','Tue','Wed','Thu','Fri']) {
    s.weekdays[day]={};
    for(const [key,c] of Object.entries(raw.weekdays?.[day]||{})) if(Object.hasOwn(DEFAULT_CLASSES,key)&&c?.name) s.weekdays[day][key]={name:text(c.name,60),room:text(c.room,40),teacher:text(c.teacher,60),url:safeUrl(c.url)||''};
  }
  s.exceptions=Array.isArray(raw.exceptions)?raw.exceptions.filter(x=>x&&validDate(x.date)&&['regular','homeroom','early','delay','off'].includes(x.type)).map(x=>({id:text(x.id,80)||uid(),date:x.date,type:x.type,note:text(x.note,100)})).slice(0,400):[];
  s.tasks=s.tasks.map((t,i)=>{const old=raw.tasks?.slice(0,200).filter(t=>t&&typeof t.text==='string'&&t.text.length)?.[i]||{};return {...t,subject:text(old.subject,60),due:validDate(old.due)?old.due:'',priority:['high','normal','low'].includes(old.priority)?old.priority:'normal',url:safeUrl(old.url)||''};});
  const rawLinks=raw.links?.slice(0,100).filter(l=>l&&safeUrl(l.url)&&typeof l.name==='string'&&l.name.length)||[];
  s.links=s.links.map((l,i)=>({...l,order:Number.isFinite(rawLinks[i]?.order)?rawLinks[i].order:i,dock:rawLinks[i]?.dock===undefined?['Classroom','Gmail','ChatGPT'].includes(l.name):!!rawLinks[i].dock}));
  s.events=Array.isArray(raw.events)?raw.events.filter(e=>e&&validDate(e.date)&&e.title).slice(0,100).map(e=>({id:text(e.id,80)||uid(),title:text(e.title,80),date:e.date,time:/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)?e.time:'',location:text(e.location,120),checklist:text(e.checklist,2000),done:text(e.done,2000)})):[];
  s.layouts=raw.layouts&&typeof raw.layouts==='object'?Object.fromEntries(Object.entries(raw.layouts).filter(([k,v])=>['notes','focus'].includes(k)&&v&&typeof v==='object').map(([k,v])=>[k,{x:Math.max(0,Number(v.x)||0),y:Math.max(36,Number(v.y)||80),width:Math.max(300,Math.min(900,Number(v.width)||380)),height:Math.max(280,Math.min(900,Number(v.height)||420))}])):{};
  s.setupDone=!!raw.setupDone;
  s.lunchConfirmed=!!raw.lunchConfirmed;
  return s;
}
export function selectedClasses(state, weekday){return {...state.profile.classes,...state.weekdays[weekday]};}
export function selectedOverride(state,time){return state.override?.date===time.date?state.override:state.exceptions.find(x=>x.date===time.date);}
export function orderedLinks(state){return state.links.slice().sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));}
export function taskGroup(t,today=schoolTime().date){return t.done?'done':t.due&&t.due<today?'overdue':t.due===today?'today':'upcoming';}
export function sortedTasks(tasks){return tasks.slice().sort((a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999')||({high:0,normal:1,low:2}[a.priority]-{high:0,normal:1,low:2}[b.priority]));}
