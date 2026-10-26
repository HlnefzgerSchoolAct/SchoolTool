/** All school times are America/Chicago, independent of the device time zone.
 * Source: assets/WDHS-Bell-Schedules.pdf, supplied by the user.
 * B lunch is preconfigured. Regular-day post-lunch passing time is unspecified
 * in the source; default is 0 minutes, editable in Settings.
 */
export const ZONE = 'America/Chicago';
export const SCHEDULES = {
  regular: { name: 'Regular day', short: 'Regular', days: 'Monday & Friday', end: '14:55', blocks: [
    ['p1','08:00','09:34'], ['p2','09:39','11:12'], ['p3a','11:17','12:04'],
    ['lunch','12:04','12:29'], ['p3b','12:29','13:16'], ['p4','13:21','14:55'] ] },
  homeroom: { name: 'Homeroom day', short: 'Homeroom', days: 'Tuesday & Thursday', end: '14:55', blocks: [
    ['p1','08:00','09:25'], ['homeroom','09:30','10:00'], ['p2','10:05','11:30'],
    ['p3a','11:35','12:15'], ['lunch','12:15','12:40'], ['p3b','12:40','13:25'], ['p4','13:30','14:55'] ] },
  early: { name: 'Wednesday early-out', short: 'Early-out', days: 'Wednesday', end: '13:15', blocks: [
    ['p1','08:00','09:10'], ['p2','09:15','10:20'], ['p3a','10:25','11:00'],
    ['lunch','11:00','11:25'], ['p3b','11:30','12:05'], ['p4','12:10','13:15'] ] },
  delay: { name: 'Two-hour delay', short: '2-hour delay', days: 'Select when announced', end: '14:55', blocks: [
    ['p1','10:00','11:10'], ['p2','11:15','12:15'], ['p3a','12:20','12:50'],
    ['lunch','12:50','13:15'], ['p3b','13:20','13:50'], ['p4','13:55','14:55'] ] },
  off: { name: 'No school', short: 'No school', days: 'Weekends / day off', end: null, blocks: [] }
};
export const DEFAULT_CLASSES = {
  p1: {name:'Block 1',room:''}, p2: {name:'Block 2',room:''},
  p3a: {name:'Block 3 · before lunch',room:''}, p3b: {name:'Block 3 · after lunch',room:''},
  p4: {name:'Block 4',room:''}, homeroom: {name:'Homeroom',room:''}
};
export function schoolTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: ZONE,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const p = Object.fromEntries(parts.map(v => [v.type,v.value]));
  return {date: `${p.year}-${p.month}-${p.day}`,weekday:p.weekday,seconds:Number(p.hour)*3600+Number(p.minute)*60+Number(p.second),hour:Number(p.hour)};
}
export function toSeconds(t) { const [h,m] = t.split(':').map(Number); return h*3600+m*60; }
export function clock(t) { const [h,m] = t.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')}`; }
export function timeRange(start,end) { const a=Number(start.slice(0,2))>=12?'PM':'AM',b=Number(end.slice(0,2))>=12?'PM':'AM'; return `${clock(start)}${a!==b?' '+a:''}–${clock(end)} ${b}`; }
export function duration(seconds) {
  const s = Math.max(0,Math.ceil(seconds));
  return s>=3600 ? `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` : `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
export function scheduleKey(time,override) {
  if(override?.date===time.date && Object.hasOwn(SCHEDULES,override.type)) return override.type;
  return ({Mon:'regular',Tue:'homeroom',Wed:'early',Thu:'homeroom',Fri:'regular',Sat:'off',Sun:'off'})[time.weekday] || 'off';
}
export function buildDay(key, classes=DEFAULT_CLASSES, options={}) {
  const source = SCHEDULES[key] || SCHEDULES.off;
  const items = source.blocks.map(([id,start,end]) => {
    if(id==='p3b' && ['regular','homeroom'].includes(key)) {
      const minute = toSeconds(start)/60 + Math.min(10,Math.max(0,Number(options.lunchPassing)||0));
      start = `${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
    }
    return {id,start,end,startSec:toSeconds(start),endSec:toSeconds(end),name:id==='lunch'?'B lunch':(classes[id]?.name || DEFAULT_CLASSES[id]?.name || id),room:classes[id]?.room || '',kind:id==='lunch'?'lunch':'class'};
  });
  if(options.intervention && ['regular','homeroom','delay'].includes(key)) items.push({id:'intervention',name:'Intervention / Reteach',room:'',start:'15:00',end:'15:30',startSec:54000,endSec:55800,kind:'class'});
  return items;
}
export function dayState(items,seconds) {
  if(!items.length) return {kind:'off',current:null,next:null,remaining:0,progress:0};
  const first=items[0],last=items.at(-1);
  if(seconds<first.startSec) return {kind:'before',current:null,next:first,remaining:first.startSec-seconds,progress:0};
  const current=items.find(x=>seconds>=x.startSec && seconds<x.endSec);
  const next=items.find(x=>x.startSec>seconds)||null;
  const progress=Math.min(100,Math.max(0,(seconds-first.startSec)/(last.endSec-first.startSec)*100));
  if(current) return {kind:current.kind,current,next,remaining:current.endSec-seconds,progress,periodProgress:(seconds-current.startSec)/(current.endSec-current.startSec)*100};
  if(next) return {kind:'passing',current:null,next,remaining:next.startSec-seconds,progress};
  return {kind:'after',current:null,next:null,remaining:0,progress:100};
}
