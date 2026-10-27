import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import {freshState} from '../defaults.js';
import {upgrade,validDate,selectedClasses,selectedOverride,taskGroup,sortedTasks} from '../model.js';
import {WorkspaceStore,PREFIX} from '../storage.js';
class MemoryStorage {
 data=new Map();blocked=false;
 get length(){return this.data.size;}
 key(i){return [...this.data.keys()][i]??null;}
 getItem(k){return this.data.get(k)??null;}
 setItem(k,v){if(this.blocked)throw new Error('Quota exceeded');this.data.set(k,String(v));}
}
const fixture=()=>{const s=freshState();s.profile.name='Hawk';s.profile.classes.p1={name:'English',room:'101'};s.notes='Keep these notes';s.tasks=[{id:'old-task',text:'Read chapter 5',done:false}];return s;};
test('v1 migration preserves profile, B lunch preference, task IDs, links, notes, and original backup',()=>{
 const storage=new MemoryStorage(),old=fixture();storage.setItem('schooltool.v1',JSON.stringify(old));
 const store=new WorkspaceStore(storage);
 assert.equal(store.state.version,2);assert.equal(store.state.profile.name,'Hawk');assert.deepEqual(store.state.profile.classes.p1,{name:'English',room:'101',teacher:'',url:''});assert.equal(store.state.tasks[0].id,'old-task');assert.equal(store.state.notes,old.notes);assert.equal(store.state.links[0].id,'powerschool');assert.equal(store.state.profile.lunchPassing,0);assert.deepEqual(JSON.parse(storage.getItem('schooltool.v1')),old);
});
test('v2 backup roundtrip retains dates, metadata, dock order, and weekday changes',()=>{
 const s=upgrade(fixture());s.weekdays.Mon.p1={name:'Literature',room:'108',teacher:'Teacher',url:'https://classroom.google.com/h'};s.tasks[0].due='2026-11-02';s.tasks[0].priority='high';s.tasks[0].subject='English';s.links[0].dock=true;s.links[0].order=9;s.exceptions=[{id:'off',date:'2026-11-02',type:'off',note:'No school'}];assert.deepEqual(upgrade(JSON.parse(JSON.stringify(s))),s);
});
test('invalid imported rows cannot shift task metadata onto a different task',()=>{const s=fixture();s.tasks=[null,{id:'one',text:'Essay',due:'2026-11-02',priority:'high'}];const next=upgrade(s);assert.equal(next.tasks[0].priority,'high');assert.equal(next.tasks[0].due,'2026-11-02');assert.equal(validDate('2026-99-99'),false);assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);});
test('weekday class overrides fall back and today override takes precedence over dates',()=>{const s=upgrade();s.weekdays.Mon.p1={name:'Monday class'};s.exceptions=[{id:'x',date:'2026-11-02',type:'off'}];const t={date:'2026-11-02'};assert.equal(selectedClasses(s,'Mon').p1.name,'Monday class');assert.equal(selectedClasses(s,'Tue').p1.name,'Block 1');assert.equal(selectedOverride(s,t).type,'off');s.override={date:t.date,type:'delay'};assert.equal(selectedOverride(s,t).type,'delay');s.override.date='2026-11-01';assert.equal(selectedOverride(s,t).type,'off');});
test('assignment groups and sorting respect due dates, priority, completion, and missing dates',()=>{const tasks=[{id:'a',done:false,due:'',priority:'high'},{id:'b',done:false,due:'2026-10-27',priority:'normal'},{id:'c',done:true,due:'2026-10-26',priority:'high'},{id:'d',done:false,due:'2026-10-27',priority:'high'}];assert.equal(taskGroup(tasks[2],'2026-10-27'),'done');assert.equal(taskGroup(tasks[1],'2026-10-28'),'overdue');assert.deepEqual(sortedTasks(tasks).map(t=>t.id),['d','b','a','c']);});
test('simultaneous tabs merge edits to independent fields and collections',()=>{const mem=new MemoryStorage(),a=new WorkspaceStore(mem),b=new WorkspaceStore(mem);a.state.notes='Tab A';b.state.tasks.push({id:'task-b',text:'Tab B',done:false});a.commit(a.state);b.commit(b.state);a.receive();assert.equal(a.state.notes,'Tab A');assert.equal(a.state.tasks[0].text,'Tab B');assert.deepEqual(a.state,b.state);});
test('same-field concurrent saves retain both versions and warn both tabs',()=>{const mem=new MemoryStorage(),warningsA=[],warningsB=[],a=new WorkspaceStore(mem,()=>{},(m,ok)=>{if(!ok)warningsA.push(m);}),b=new WorkspaceStore(mem,()=>{},(m,ok)=>{if(!ok)warningsB.push(m);});a.state.notes='A';b.state.notes='B';a.commit(a.state);b.commit(b.state);a.receive();assert.equal(a.state.notes,'B');assert.ok(warningsA.length);assert.ok(warningsB.length);assert.deepEqual(a.recovery().records.flatMap(r=>r.patches).filter(p=>p.path[0]==='notes').map(p=>p.value),['A','B']);});
test('unsaved local notes survive incoming remote changes',()=>{const mem=new MemoryStorage(),a=new WorkspaceStore(mem),b=new WorkspaceStore(mem);a.state.notes='Local draft';b.state.notes='Remote';b.commit(b.state);a.receive();assert.equal(a.state.notes,'Local draft');a.commit(a.state);b.receive();assert.equal(b.state.notes,'Local draft');});
test('storage quota errors report failure and keep in-session data',()=>{const mem=new MemoryStorage(),warnings=[],s=new WorkspaceStore(mem,()=>{},(m,ok)=>warnings.push(ok));mem.blocked=true;s.state.notes='Still here';assert.equal(s.commit(s.state),false);assert.equal(s.state.notes,'Still here');assert.equal(warnings.at(-1),false);});
test('pre-import checkpoint and deletion history remain recoverable',()=>{const mem=new MemoryStorage();mem.setItem('schooltool.v1',JSON.stringify(fixture()));const a=new WorkspaceStore(mem);assert.equal(a.checkpoint(a.state),true);a.state.tasks=[];a.commit(a.state);assert.equal(a.state.tasks.length,0);assert.equal(JSON.parse(a.recovery().beforeImport).tasks[0].id,'old-task');assert.ok(a.recovery().records.some(r=>r.patches.some(p=>p.remove&&p.path[0]==='tasks')));});
test('malformed v1 data is preserved for recovery',()=>{const mem=new MemoryStorage();mem.setItem('schooltool.v1','broken JSON');const s=new WorkspaceStore(mem);assert.equal(s.state.version,2);assert.equal(s.recovery().unreadable,'broken JSON');});
test('service worker caches real assets, isolates project paths, and waits for explicit update',async()=>{
 const source=await readFile(new URL('../sw.js',import.meta.url),'utf8');const handlers={},added=[],deleted=[];let skipped=false;
 const scope='https://example.github.io/SchoolTool/';const context={URL,Response,self:{location:new URL(scope+'sw.js'),addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:()=>skipped=true},caches:{open:async()=>({addAll:async files=>added.push(...files)}),keys:async()=>['schooltool-/SchoolTool/-1.0.0','schooltool-/another/-1.0.0','schooltool-/SchoolTool/-2.0.0'],delete:async k=>deleted.push(k),match:async()=>undefined},fetch:async()=>{throw new Error('offline');}};
 vm.runInNewContext(source,context);let work;handlers.install({waitUntil:p=>work=p});await work;for(const name of added)await access(new URL(name==='./'?'../index.html':'../'+name,import.meta.url));assert.equal(skipped,false);handlers.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(skipped,true);handlers.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['schooltool-/SchoolTool/-1.0.0']);let handled=false;handlers.fetch({request:{url:'https://mail.google.com/',method:'GET'},respondWith:()=>handled=true});assert.equal(handled,false);
});
