import {DEFAULT_CLASSES} from './schedule.js';
export const DEFAULT_LINKS = [
 {id:'powerschool',name:'PowerSchool',subtitle:'Grades & attendance',url:'https://westdelaware.powerschool.com/guardian/home.html?_userTypeHint=student',icon:'book',color:'blue',group:'School',pinned:true},
 {id:'classroom',name:'Classroom',subtitle:'Assignments & classes',url:'https://classroom.google.com/h',icon:'class',color:'green',group:'School',pinned:true},
 {id:'brightspace',name:'Brightspace',subtitle:'NICC coursework',url:'https://nicc.brightspace.com/d2l/home/127333',icon:'sun',color:'orange',group:'School',pinned:true},
 {id:'gmail',name:'Gmail',subtitle:'Your school inbox',url:'https://mail.google.com/mail/u/0/#inbox',icon:'mail',color:'red',group:'Google',pinned:true},
 {id:'drive',name:'Drive',subtitle:'Files & documents',url:'https://drive.google.com/drive/u/0/my-drive',icon:'drive',color:'yellow',group:'Google',pinned:true},
 {id:'chatgpt',name:'ChatGPT',subtitle:'Your study companion',url:'https://chatgpt.com/',icon:'chat',color:'teal',group:'Study',pinned:true},
 {id:'docs',name:'Google Docs',subtitle:'Write something great',url:'https://docs.google.com/document/u/0/',icon:'note',color:'blue',group:'Google',pinned:false},
 {id:'calendar',name:'Google Calendar',subtitle:'Dates & events',url:'https://calendar.google.com/calendar/u/0/r',icon:'calendar',color:'blue',group:'Google',pinned:false},
 {id:'canva',name:'Canva',subtitle:'Presentations & design',url:'https://www.canva.com/',icon:'edit',color:'purple',group:'Study',pinned:false},
 {id:'wd',name:'West Delaware',subtitle:'School news & resources',url:'https://w-delaware.k12.ia.us/west-delaware-high-school/',icon:'shield',color:'orange',group:'School',pinned:false},
 {id:'athletics',name:'Hawks Athletics',subtitle:'Schedules on Bound',url:'https://www.gobound.com/ia/schools/westdelaware',icon:'trophy',color:'orange',group:'Athletics',pinned:false},
 {id:'nicc',name:'NICC',subtitle:'College resources',url:'https://www.nicc.edu/',icon:'book',color:'blue',group:'School',pinned:false}
];
export function freshState(){return {version:1,profile:{name:'',classes:structuredClone(DEFAULT_CLASSES),intervention:false,lunchPassing:0},links:structuredClone(DEFAULT_LINKS),tasks:[],notes:'',theme:'light',wallpaper:'copper',override:null,focus:{minutes:25,remaining:1500,endAt:null,sessions:0}};}
const clean=(v,max=120)=>typeof v==='string'?v.slice(0,max):'';
export function safeUrl(value) {try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
export function validateState(raw) {
 if(!raw || typeof raw!=='object' || raw.version!==1) throw new Error('This is not a SchoolTool backup (version 1).');
 const s=freshState();const p=raw.profile||{};s.profile.name=clean(p.name,40);
 for(const key of Object.keys(s.profile.classes)) {s.profile.classes[key]={name:clean(p.classes?.[key]?.name,60)||s.profile.classes[key].name,room:clean(p.classes?.[key]?.room,40)};}
 s.profile.intervention=p.intervention===true;s.profile.lunchPassing=Math.min(10,Math.max(0,Math.round(Number(p.lunchPassing)||0)));
 if(Array.isArray(raw.links)) s.links=raw.links.slice(0,100).filter(l=>l&&safeUrl(l.url)&&clean(l.name)).map((l,i)=>({id:clean(l.id,80)||'app-'+i,name:clean(l.name,50),subtitle:clean(l.subtitle,80),url:safeUrl(l.url),icon:['book','class','sun','mail','drive','chat','note','calendar','edit','shield','trophy','link'].includes(l.icon)?l.icon:'link',color:['blue','green','orange','red','yellow','teal','purple'].includes(l.color)?l.color:'blue',group:clean(l.group,25)||'Custom',pinned:!!l.pinned}));
 s.tasks=Array.isArray(raw.tasks)?raw.tasks.slice(0,200).filter(t=>t&&clean(t.text,200)).map((t,i)=>({id:clean(t.id,80)||'task-'+i,text:clean(t.text,200),done:!!t.done})):[];
 s.notes=clean(raw.notes,50000);s.theme=raw.theme==='dark'?'dark':'light';s.wallpaper=raw.wallpaper==='graphite'?'graphite':'copper';
 if(raw.override&&/^\d{4}-\d{2}-\d{2}$/.test(raw.override.date)&&['regular','homeroom','early','delay','off'].includes(raw.override.type)) s.override={date:raw.override.date,type:raw.override.type};
 if(raw.focus&&typeof raw.focus==='object'){s.focus.minutes=[5,25,50].includes(raw.focus.minutes)?raw.focus.minutes:25;s.focus.remaining=Math.min(3000,Math.max(0,Number(raw.focus.remaining)||0));s.focus.endAt=Number.isFinite(raw.focus.endAt)&&raw.focus.endAt>0&&raw.focus.endAt<Date.now()+3001000?raw.focus.endAt:null;s.focus.sessions=Math.max(0,Math.min(99999,Math.floor(Number(raw.focus.sessions)||0)));}
 return s;
}
