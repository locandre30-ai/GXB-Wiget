const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../practice.html'),'utf8');
for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi))new Function(s[1]);
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.hidden=false;this.value='';this.style={};}
  append(...nodes){this.children.push(...nodes);} replaceChildren(...nodes){this.children=nodes;}
  appendChild(node){this.children.push(node);return node;}
  setAttribute(k,v){this[k]=v;} focus(){} setCustomValidity(v){this.invalid=v;} reportValidity(){}
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
const find=text=>all(home).find(e=>e.textContent===text||e['aria-label']===text);
assert.equal(arena.hidden,true);assert.ok(find('Create your profile'));
find('👑 King').onclick();assert.ok(find('Welcome back, King.'));assert.ok(find('70%'));assert.ok(find('Entries · 70%'));
assert.ok(find('Start Here'));assert.ok(find('Gold'));assert.ok(find('Bitcoin'));
assert.ok(all(home).some(e=>e.innerHTML&&e.innerHTML.includes('Gold bullion bars')));
assert.ok(all(home).some(e=>e.innerHTML&&e.innerHTML.includes('Bitcoin coin')));
assert.equal(find('Edit name / icon'),undefined);
find('Explore Gold →').onclick();assert.equal(context.ST.journey.market,'gold');
find('Begin first mission →').onclick();assert.ok(find('What is day trading?'));
find('Show me the chart →').onclick();find('Falling').onclick();assert.ok(find('Complete mission →')===undefined);
find('Rising').onclick();find('Next chart →').onclick();find('Falling').onclick();find('Next chart →').onclick();find('Sideways').onclick();find('Complete mission →').onclick();
assert.ok(context.ST.journey.completed.gold);assert.equal(context.ST.sessions,4);
const chapters=[
 ['Read the trend',['Rising trend','One candle is not enough to establish a reversal','Sideways range']],
 ['Understand pullbacks',['Possible pullback','Reassess the structure','Wait for clearer evidence']],
 ['Define risk',['$2','5','No, fills can slip']],
 ['Practice entries',['Wait for the planned setup','A trigger and a defined invalidation point','No trade']],
 ['Manage exits',['Honor the planned exit','No','Whether the decision followed a sound plan']],
 ['Review a session',['+4R','The setup, execution and whether the plan was followed','Wait for the pullback confirmation required by my plan']]
];
for(const [name,answers] of chapters){
  assert.ok(find(`Continue: ${name} →`));find(`Continue: ${name} →`).onclick();
  answers.forEach((answer,i)=>{const figure=all(home).find(e=>e.tag==='figure');assert.ok(figure,'Every skill checkpoint needs a chart');assert.ok(figure.innerHTML.includes('<svg'));assert.ok(!figure.innerHTML.includes('NaN'));find(answer).onclick();find(i<2?'Next checkpoint →':'Finish skill →').onclick();});
}
assert.equal(context.ST.journey.skills.gold.length,6);
assert.equal(context.ST.sessions,4);assert.ok(find('Continue in Free Practice →'));
find('Return to my journey →').onclick();find('Change market').onclick();find('Explore Bitcoin →').onclick();
assert.equal(context.ST.journey.market,'bitcoin');assert.equal(context.ST.journey.completed.bitcoin,undefined);assert.ok(context.ST.journey.completed.gold);
find('Begin first mission →').onclick();find('Show me the chart →').onclick();
find('Rising').onclick();find('Next chart →').onclick();find('Falling').onclick();find('Next chart →').onclick();find('Sideways').onclick();find('Complete mission →').onclick();
assert.ok(context.ST.journey.completed.bitcoin);find('Return to my journey →').onclick();
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
vm.runInContext('activeProfile().name="King"; activeProfile().onboarded=true; ST.history=[{grade:"A",r:2}]; ST.journey={market:"gold",completed:{gold:{version:1}}};saveState(ST);',before);
const after=reload();
assert.equal(vm.runInContext('activeProfile().name',after),'King');
assert.equal(vm.runInContext('activeProfile().onboarded',after),true);
assert.equal(vm.runInContext('ST.history[0].r',after),2);
assert.equal(vm.runInContext('ST.journey.market',after),'gold');
assert.equal(vm.runInContext('ST.journey.completed.gold.version',after),1);
console.log('PASS: Gold and Bitcoin lessons, retry feedback, independent market progress, lesson/session separation, journey persistence.');
console.log('PASS: profile identity, remembered dashboard and session history persist across app reloads.');
