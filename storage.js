/** Append-only change records prevent one tab from replacing another tab's state.
 * Each record has a unique key. Conflicting values remain in the recovery journal.
 * No secrets or browser data are uploaded to a server.
 */
import {upgrade,uid} from './model.js';
export const PREFIX='schooltool.v2.';
const collections=new Set(['links','tasks','exceptions','events']);
function normalized(state){const result=structuredClone(state);for(const key of collections)result[key]=Object.fromEntries((state[key]||[]).map(x=>[x.id,x]));return result;}
function denormalized(value){const result=structuredClone(value);for(const key of collections)result[key]=Object.values(value[key]||{});return result;}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function changes(before,after,path=[]){
  if(equal(before,after))return [];
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  if(object(before)&&object(after))return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>changes(before[k],after[k],[...path,k]));
  return [{path,before:before===undefined?null:before,absent:before===undefined,value:after===undefined?null:after,remove:after===undefined}];
}
function valueAt(o,path){return path.reduce((v,k)=>v?.[k],o);}
export function applyChanges(base,patches){const result=structuredClone(base);for(const p of patches){if(!p.path.length||p.path.some(k=>['__proto__','constructor','prototype'].includes(k)))continue;let o=result;for(const k of p.path.slice(0,-1)){if(!o[k]||typeof o[k]!=='object')o[k]={};o=o[k];}if(p.remove)delete o[p.path.at(-1)];else o[p.path.at(-1)]=structuredClone(p.value);}return result;}
export class WorkspaceStore {
  constructor(storage,onChange=()=>{},onStatus=()=>{}){
    this.storage=storage;this.onChange=onChange;this.onStatus=onStatus;this.client=uid();this.failed=false;this.serial=0;this.lastTime=0;this.recoveryKey=PREFIX+'recovery';
    try{
      let raw=storage.getItem(PREFIX+'base');
      if(!raw){const legacy=storage.getItem('schooltool.v1');let initial;
        try{initial=upgrade(legacy?JSON.parse(legacy):undefined);}catch{storage.setItem(this.recoveryKey,legacy||'');initial=upgrade();this.onStatus('Saved data needs recovery. The original is preserved; export recovery from Settings.',false);}
        raw=JSON.stringify(normalized(initial));storage.setItem(PREFIX+'base',raw);
      }
      this.base=JSON.parse(raw);this.state=this.read();this.baseline=normalized(this.state);this.seenConflicts=new Set(this.conflictIds);
    }catch{this.failed=true;this.base=normalized(upgrade());this.state=denormalized(this.base);this.baseline=this.base;this.onStatus('Device storage is unavailable. Changes will stay in this session; export a backup.',false);}
  }
  records(){const records=[];for(let i=0;i<this.storage.length;i++){const key=this.storage.key(i);if(key?.startsWith(PREFIX+'op.')){const r=JSON.parse(this.storage.getItem(key));if(r?.patches)records.push(r);}}return records.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));}
  read(){let result=structuredClone(this.base);this.conflictIds=[];for(const r of this.records()){this.lastTime=Math.max(this.lastTime,r.time);if(r.patches.some(p=>!equal(valueAt(result,p.path),p.absent?undefined:p.before)))this.conflictIds.push(r.id);result=applyChanges(result,r.patches);}return denormalized(result);}
  commit(next){const draft=normalized(next),patches=changes(this.baseline,draft);if(!patches.length)return true;
    try{const latest=normalized(this.read());const conflict=patches.some(p=>!equal(valueAt(latest,p.path),p.absent?undefined:p.before));
      const time=Math.max(Date.now(),this.lastTime+1);const record={id:this.client+'-'+(++this.serial),time,patches};
      this.storage.setItem(PREFIX+'op.'+record.id,JSON.stringify(record));this.state=this.read();this.baseline=normalized(this.state);this.failed=false;this.seenConflicts=new Set(this.conflictIds);
      this.onStatus(conflict?'Both tabs edited the same field. Your edit is saved; earlier values remain in Export recovery.':'Saved on this device',!conflict);return true;
    }catch{this.failed=true;this.onStatus('Not saved. Storage is full or unavailable — export a backup before closing.',false);return false;}
  }
  receive(){try{const pending=changes(this.baseline,normalized(this.state)),remote=normalized(this.read());const conflict=pending.some(p=>!equal(valueAt(remote,p.path),p.absent?undefined:p.before))||this.conflictIds.some(id=>!this.seenConflicts?.has(id));this.seenConflicts=new Set(this.conflictIds);this.baseline=remote;this.state=denormalized(applyChanges(remote,pending));this.onChange(this.state);if(conflict)this.onStatus('Tabs edited the same field. Unsaved drafts are kept; both saved values are in Export recovery.',false);}catch{this.onStatus('Unable to read another tab’s update. Export recovery before reloading.',false);}}
  checkpoint(state){try{this.storage.setItem(PREFIX+'checkpoint',JSON.stringify(state));return true;}catch{this.onStatus('Could not create a recovery copy. Export a backup before restoring.',false);return false;}}
  recovery(){const result={format:'schooltool-recovery',created:new Date().toISOString(),base:this.base,records:this.records(),beforeImport:this.storage.getItem(PREFIX+'checkpoint'),legacy:this.storage.getItem('schooltool.v1'),unreadable:this.storage.getItem(this.recoveryKey)};return result;}
}
