const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../practice.html'),'utf8');
for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi))new Function(s[1]);
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.hidden=false;this.value='';}
  append(...nodes){this.children.push(...nodes);} replaceChildren(...nodes){this.children=nodes;}
  appendChild(node){this.children.push(node);return node;}
  setAttribute(){} focus(){} setCustomValidity(v){this.invalid=v;} reportValidity(){}
}
const body=new Element('body');body.prepend=(...nodes)=>body.children.unshift(...nodes);
const arena=new Element('arena');let sessions=0,saves=0;
const book={active:'king',profiles:{king:{name:'King',icon:'👑',state:{sessions:4,xp:100,dayStreak:2,skills:{Entries:{rounds:10,correct:7,rCount:5}}}}}};
const context={document:{head:new Element('head'),body,createElement:t=>new Element(t),querySelector:()=>arena},window:{scrollTo(){}},localStorage:{setItem(){},removeItem(){}},BOOK:book,ST:book.profiles.king.state,answering:false,
  activeProfile:()=>book.profiles[book.active],openProfMenu(){},saveState(){saves++;},newProfileId:()=> 'new',unusedIcon:()=> '🌊',normalize:()=>({sessions:0,xp:0,dayStreak:0,skills:{}}),sizeCanvases(){},newSession(){sessions++;}};
context.switchProfile=id=>{book.active=id;context.ST=book.profiles[id].state;};context.applyProfile=()=>{context.ST=book.profiles[book.active].state;};
vm.createContext(context);
const start=html.indexOf('    function initDashboard(){');
const end=html.lastIndexOf('  </script>');
vm.runInContext(html.slice(start,end)+'\ninitDashboard();',context);
const home=body.children[0],back=body.children[1];
const all=e=>[e,...e.children.flatMap(all)];
const find=text=>all(home).find(e=>e.textContent===text);
assert.equal(arena.hidden,true);assert.ok(find('Create your profile'));
find('👑 King').onclick();assert.ok(find('Welcome back, King.'));assert.ok(find('70%'));assert.ok(find('Entries · 70%'));
assert.ok(find('Completed sessions'));assert.equal(book.profiles.king.state.sessions,4);
find('Switch / create profile').onclick();
const form=all(home).find(e=>e.tag==='form'),input=all(form).find(e=>e.tag==='input');
input.value='   ';form.onsubmit({preventDefault(){}});assert.equal(book.active,'king');assert.ok(input.invalid);
input.value='<King Junior>';form.onsubmit({preventDefault(){}});assert.equal(book.active,'new');assert.ok(find('Welcome back, <King Junior>.'));assert.equal(book.profiles.king.state.xp,100);assert.equal(context.ST.xp,0);
find('Enter the Arena →').onclick();assert.equal(home.hidden,true);assert.equal(arena.hidden,false);assert.equal(sessions,1);
context.ST.history=[{date:'2026-10-18T12:00:00Z',focus:'Entries',grade:'B',correct:7,rounds:10,r:2,minutes:3,xp:50,scored:4}];
back.onclick();assert.equal(home.hidden,false);assert.ok(find('B · 7/10 correct · +2.0R'));assert.ok(all(home).some(e=>String(e.textContent).includes('0.50R / decision')));
assert.ok(saves>0);console.log('PASS: syntax, profile entry, returning identity, validation, safe names, profile isolation, training navigation, session history and R metrics.');
const storage=new Map();
const persistence=html.slice(html.indexOf('    const STORE_KEY'),html.indexOf('    let CANDLES'));
function reload(){const ctx={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},THEMES:{classic:[]}};vm.createContext(ctx);vm.runInContext(persistence,ctx);return ctx;}
const before=reload();
vm.runInContext('activeProfile().name="King"; activeProfile().onboarded=true; ST.history=[{grade:"A",r:2}];saveState(ST);',before);
const after=reload();
assert.equal(vm.runInContext('activeProfile().name',after),'King');
assert.equal(vm.runInContext('activeProfile().onboarded',after),true);
assert.equal(vm.runInContext('ST.history[0].r',after),2);
console.log('PASS: profile identity, remembered dashboard and session history persist across app reloads.');
