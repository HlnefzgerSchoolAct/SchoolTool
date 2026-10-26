import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolTime,scheduleKey,buildDay,dayState,toSeconds,duration,DEFAULT_CLASSES,SCHEDULES,timeRange} from '../schedule.js';
import {freshState,validateState,safeUrl} from '../defaults.js';
const at=(key,time,options={})=>dayState(buildDay(key,DEFAULT_CLASSES,options),toSeconds(time));
test('Chicago clock respects daylight saving and the local calendar date',()=>{
 assert.deepEqual(schoolTime(new Date('2026-10-26T13:00:00Z')),{date:'2026-10-26',weekday:'Mon',seconds:28800,hour:8});
 assert.equal(schoolTime(new Date('2026-12-07T14:00:00Z')).hour,8);
 assert.equal(schoolTime(new Date('2026-10-27T03:00:00Z')).date,'2026-10-26');
});
test('automatic weekdays and weekends match the supplied schedule',()=>{
 for(const [weekday,key]of Object.entries({Mon:'regular',Tue:'homeroom',Wed:'early',Thu:'homeroom',Fri:'regular',Sat:'off',Sun:'off'}))assert.equal(scheduleKey({weekday,date:'2026-10-26'}),key);
});
test('daily overrides expire at Chicago midnight',()=>{
 assert.equal(scheduleKey({weekday:'Mon',date:'2026-10-26'},{date:'2026-10-26',type:'delay'}),'delay');
 assert.equal(scheduleKey({weekday:'Tue',date:'2026-10-27'},{date:'2026-10-26',type:'delay'}),'homeroom');
 assert.equal(scheduleKey({weekday:'Mon',date:'2026-10-26'},{date:'2026-10-26',type:'off'}),'off');
});
test('all four B lunch windows match the uploaded PDF',()=>{
 for(const [key,start,end]of [['regular','12:04','12:29'],['homeroom','12:15','12:40'],['early','11:00','11:25'],['delay','12:50','13:15']]){
  const lunch=buildDay(key).find(x=>x.id==='lunch');assert.equal(lunch.start,start);assert.equal(lunch.end,end);
  assert.equal(at(key,start).current.id,'lunch');assert.notEqual(at(key,end).current?.id,'lunch');
 }
});
test('Wednesday and delay include exactly five minutes passing after lunch',()=>{
 for(const [key,end,start]of [['early','11:25','11:30'],['delay','13:15','13:20']]){assert.equal(at(key,end).kind,'passing');assert.equal(at(key,end).remaining,300);assert.equal(at(key,start).current.id,'p3b');}
});
test('regular post-lunch intervals can be adjusted without changing lunch itself',()=>{
 assert.equal(at('regular','12:29').current.id,'p3b');
 const next=at('regular','12:29',{lunchPassing:5});assert.equal(next.kind,'passing');assert.equal(next.remaining,300);
 assert.equal(at('homeroom','12:40',{lunchPassing:5}).kind,'passing');assert.equal(at('homeroom','12:45',{lunchPassing:5}).current.id,'p3b');
});
test('period boundaries, passing time, and dismissal use half-open intervals',()=>{
 assert.equal(at('regular','07:59').kind,'before');assert.equal(at('regular','07:59').remaining,60);
 assert.equal(at('regular','08:00').current.id,'p1');assert.equal(at('regular','09:34').kind,'passing');
 assert.equal(at('regular','09:39').current.id,'p2');assert.equal(at('regular','14:55').kind,'after');assert.equal(at('regular','14:55').remaining,0);
 assert.equal(at('early','13:15').kind,'after');assert.equal(at('delay','09:59').kind,'before');
});
test('homeroom is a real timed period',()=>{assert.equal(at('homeroom','09:30').current.id,'homeroom');assert.equal(at('homeroom','10:00').kind,'passing');assert.equal(at('homeroom','10:05').current.id,'p2');});
test('all day timelines are sorted, non-overlapping, and every second has a valid state',()=>{
 for(const key of Object.keys(SCHEDULES)){
  const items=buildDay(key);for(let i=0;i<items.length;i++){assert.ok(items[i].endSec>items[i].startSec);if(i)assert.ok(items[i].startSec>=items[i-1].endSec);}
  for(let seconds=0;seconds<86400;seconds++){const live=dayState(items,seconds);assert.ok(live.remaining>=0);assert.ok(live.progress>=0&&live.progress<=100);if(live.current)assert.ok(seconds>=live.current.startSec&&seconds<live.current.endSec);}
 }
});
test('intervention is optional and omitted on Wednesday',()=>{assert.equal(at('regular','15:01').kind,'after');assert.equal(at('regular','15:01',{intervention:true}).current.id,'intervention');assert.equal(at('early','15:01',{intervention:true}).kind,'after');assert.equal(at('regular','15:30',{intervention:true}).kind,'after');});
test('custom class names are used without mutating the source',()=>{const classes=structuredClone(DEFAULT_CLASSES);classes.p1.name='Medical Terminology';classes.p3b.name='Performance PE';assert.equal(buildDay('regular',classes)[0].name,'Medical Terminology');assert.equal(DEFAULT_CLASSES.p1.name,'Block 1');});
test('countdown formatting never goes negative',()=>{assert.equal(duration(-1),'00:00');assert.equal(duration(59),'00:59');assert.equal(duration(60),'01:00');assert.equal(duration(3600),'01:00:00');});
test('backups reject invalid versions and unsafe URL protocols',()=>{
 assert.throws(()=>validateState({version:3}));assert.throws(()=>validateState(null));
 const raw=freshState();raw.links.push({name:'bad',url:'javascript:alert(1)'});const result=validateState(raw);assert.equal(result.links.length,12);
 assert.equal(safeUrl('data:text/html,test'),null);assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('https://example.com/'),'https://example.com/');
});
test('backup import preserves useful data and bounds malformed fields',()=>{
 const raw=freshState();raw.profile.name='Harrison';raw.profile.classes.p1.name='Physiology';raw.profile.lunchPassing=900;raw.notes='My notes';raw.tasks=[{text:'An assignment',done:true}];raw.focus.minutes=900;
 const s=validateState(raw);assert.equal(s.profile.name,'Harrison');assert.equal(s.profile.classes.p1.name,'Physiology');assert.equal(s.notes,'My notes');assert.equal(s.tasks[0].done,true);assert.equal(s.profile.lunchPassing,10);assert.equal(s.focus.minutes,25);
});

test('time ranges mark both meridiems when crossing noon',()=>{assert.equal(timeRange('11:17','12:04'),'11:17 AM–12:04 PM');assert.equal(timeRange('12:04','12:29'),'12:04–12:29 PM');});
