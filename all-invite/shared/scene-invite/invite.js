import {resolveEventArtwork} from './event-artwork.js?v=signature-20261012-1';
import {mountIntroNames} from './js/intro-names.js';
import {createMotion} from './motion.js?v=19';
import {createTextReveal} from './text-reveal.js?v=2';
const shared=new URL('./',import.meta.url);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const root=document.documentElement,viewport=document.querySelector('[data-stage-viewport]');
const nav=document.querySelector('[data-nav-mount]'),rail=nav.querySelector('.dots');
const previous=nav.querySelector('.previous'),next=nav.querySelector('.next');
const autoButton=nav.querySelector('.auto'),soundButton=nav.querySelector('.sound');
const timerBar=nav.querySelector('.timer');
// Vector controls avoid font ascender/baseline offsets inside circular buttons.
function controlIcon(kind){
 const shapes={play:'<path d="M8 5L20 12L8 19Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',pause:'<path d="M9 6V18M15 6V18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',previous:'<path d="M15 6L9 12L15 18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>',next:'<path d="M9 6L15 12L9 18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'};
 return '<svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+shapes[kind]+'</svg>';
}
autoButton.innerHTML=controlIcon('pause');previous.innerHTML=controlIcon('previous');next.innerHTML=controlIcon('next');

let sample,index=0,busy=false,timer,auto=true,opened=false,records=[],actionTimer,transitionTimer;
let audio,musicEnabled=true,transitioning=false,interactionEpoch=0;
function initMusic(){
 audio=document.createElement("audio");audio.src=sample.assets?.music ? new URL(sample.assets.music,location.href) : new URL("audio-sunehra.mp3?v=original-1",shared);audio.loop=true;audio.preload="none";audio.volume=.35;audio.hidden=true;document.body.append(audio);
 const sync=()=>{soundButton.setAttribute("aria-label",audio.paused?"Play music":"Mute music");soundButton.setAttribute("aria-pressed",String(!audio.paused));};
 audio.addEventListener("play",sync);audio.addEventListener("pause",sync);
 const play=()=>audio.play().catch(()=>{});
 const intro=document.querySelector("[data-intro]");
 const start=()=>{if(musicEnabled&&audio.paused)play();};
 intro.addEventListener("pointerup",start,{once:true});intro.addEventListener("click",start,{once:true});
 intro.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" ")start();});
 soundButton.addEventListener("click",()=>{musicEnabled=audio.paused;if(musicEnabled)play();else audio.pause();});
 document.addEventListener("visibilitychange",()=>{if(document.hidden)audio.pause();else if(musicEnabled&&window.MS?.introTapped)play();});
}

const dateDisplay=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?new Date(value+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):value;
const timeDisplay=value=>/^\d{2}:\d{2}$/.test(value)?new Date('2000-01-01T'+value).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}):value;
const text=(tag,content,cls)=>{const el=document.createElement(tag);el.textContent=content;if(cls)el.className=cls;if(['event-date','event-time','event-venue','event-note','closing-copy','family-copy','location','dates'].includes(cls))el.style.whiteSpace='pre-line';if(cls==='flourish')el.setAttribute('aria-hidden','true');return el;};
const makeImage=(path,cls,alt='')=>{const img=document.createElement('img');img.className=cls;img.alt=alt;img.draggable=false;img.decoding='async';img.dataset.src=path;return img;};
const asset=(name)=>{const file=sample.plateOverrides?.[name]||(name==='scene-5.webp'?'scene-5-grounded.webp':name);const url=new URL(sample.assets?.[file]||sample.assetOverrides?.[file]||((sample.assetBase||'./assets/')+file),location.href);url.searchParams.set('v',String(sample.assetVersion||5));return url.href;};
function sprite(section,name,cls){const wrap=document.createElement('div');wrap.className='sprite-wrap '+cls;wrap.append(makeImage(asset(name+'.webp'),'sprite'));section.append(wrap);return wrap;}
function content(scene,id,event){
 const copy=document.createElement('div');copy.className='copy';scene.append(copy);
 if(id==='cover'){
  copy.append(text('p',sample.copy?.coverLine||'Together is a beautiful place to be','eyebrow'));
  const names=document.createElement('h1');names.className='couple-names';names.append(text('span',sample.one),text('b','&'),text('span',sample.two));copy.append(names);
  copy.append(text('div','','flourish'),text('p',sample.date.split(' · ').map(dateDisplay).join(' · '),'dates'));
  const loc=text('p',sample.venue,'location');loc.append(text('small',sample.city));copy.append(loc);
 }else if(id==='family'){
  copy.append(text('p','With the love of our families','eyebrow'),text('h2','Two families, one story','script'),text('p',sample.copy?.familyWelcome||'We joyfully invite you to celebrate the wedding of','family-copy'));
  [sample.one,sample.two].forEach((name,i)=>{const block=document.createElement('div');block.className='family-block';block.append(text('h3',name));if(sample.parents?.[i])block.append(text('p',((i===0)===(sample.partnerOrder!=='brideFirst')?'Son of ':'Daughter of ')+sample.parents[i]));copy.append(block);if(i===0)copy.append(text('p','&','family-join'));});
 }else if(id==='closing'){
  copy.append(text('p','Until we celebrate together','eyebrow'),text('h2','With all our love','script'),text('p',sample.copy?.closingMessage||'Your presence, your laughter and your blessings will make our celebration complete.','closing-copy'),text('p',sample.surname?sample.surname+' Families':'','families'));
  const credit=document.createElement('a');credit.className='credit';credit.href='https://www.lovesolutions.in/';credit.target='_blank';credit.rel='noopener';const logo=document.createElement('img');logo.src=new URL('lovesolutions-logo.png',shared).href;logo.alt='LoveSolutions.in';credit.append(logo,text('span','Made with love by LoveSolutions.in'));scene.append(credit);const replay=text('button','Replay invitation','replay');replay.type='button';replay.addEventListener('click',()=>go(0));scene.append(replay);const rsvp=text('button','Send your RSVP','scene-rsvp-trigger');rsvp.type='button';rsvp.addEventListener('click',openRsvp);copy.append(rsvp);
 }else{
  copy.append(text('p','A moment to make memories','eyebrow'),text('h2',event[0],'script'),text('p',dateDisplay(event[1]),'event-date'),text('p',timeDisplay(event[2]),'event-time'),text('div','','flourish'),text('p',event[3],'event-venue'),text('p',event[4],'event-note'));if(event[7]){try{const u=new URL(event[7]);if(['https:','http:'].includes(u.protocol)){const a=text('a','View location','scene-map');a.href=u.href;a.target='_blank';a.rel='noopener';copy.append(a)}}catch{}}
 }
}
function build(){
 let specs=[['cover',0,'walk','Walk with the couple'],['family',1,'family','Let the family flowers bloom'],...sample.events.map((e,i)=>['event-'+i,e[8]??i+2,e[5],e[6],e]),['closing',0,'farewell','A shower of warm wishes']];
 if(sample.signatureVersion===1){const byId=new Map(specs.map(s=>[s[0],s]));specs=sample.signatureOrder.map(id=>byId.get(id)).filter(Boolean);}
 records=specs.map(([id,plate,effect,hint,event],i)=>{
  const scene=document.createElement('section');scene.className='scene'+(event?' event':'');scene.dataset.scene=id;scene.dataset.effect=effect;scene.dataset.theme=sample.slug;scene.setAttribute('aria-label',event?.[0]||({cover:'Wedding invitation',family:'Our families',closing:'With love'})[id]);scene.hidden=i!==0;if(i!==0)scene.inert=true;
  if(sample.nightPlates?sample.nightPlates.includes(plate):((plate===3&&sample.slug!=='noor-e-mohabbat')||(plate===5&&sample.slug==='neel-sarovar')))scene.classList.add('scene--night');
  scene.append(makeImage(asset('scene-'+plate+'.webp'),'plate'));
  content(scene,id,event);
  const actorName=id==='cover'?'couple-walk':['haldi','mehendi','maiyan','bouquet'].includes(effect)?'couple-haldi':['dance','drum','jaggo','waltz'].includes(effect)?'couple-evening':'couple-wedding';
  const actor=sprite(scene,actorName,'actor');
  let leftName=['dance','drum'].includes(effect)?'drum':['jaggo','haldi','mehendi','maiyan'].includes(effect)?'bowl':effect==='family'?'urn':'bird';
  if(sample.slug==='noor-e-mohabbat'&&['nikah','lights'].includes(effect))leftName='lantern';
  if(effect==='blessing')leftName='urn';
  if(effect==='jaggo'||['candles','procession'].includes(effect))leftName='lantern';
  if(effect==='lotus'||effect==='bouquet')leftName='bird';
  const left=sprite(scene,leftName,'prop-left');
  const right=sprite(scene,sample.ambient==='forest'&&effect==='family'?'urn':effect==='bells'?'bowl':['family','nikah'].includes(effect)?'lantern':'urn','prop-right');
  const pendant=sprite(scene,['dance','lights'].includes(effect)?'chandelier':'lantern','pendant sway');
  if(['dance','lights','jaggo'].includes(effect))sprite(scene,effect==='jaggo'?'bowl':'chandelier','pendant pendant-left sway');
  const bloom=sprite(scene,['blessing','family','mehendi'].includes(effect)?'swag':'garland','bloom');
  const glow=document.createElement('div');glow.className='glow';scene.append(glow);
  const record={scene,actor,left,right,pendant,bloom,glow,effect};
  const motion=createMotion(record,sample,{animate,makeImage,asset});record.motion=motion;record.textReveal=createTextReveal(scene.querySelector('.copy'),{glow:['van-sarovar','phulkari-courtyard','gulabi-darbaar','padma-prangan','rosewood-vows'].includes(sample.slug)});
  const action=text('button','','hotspot action action--'+motion.target);action.type='button';action.setAttribute('aria-label',motion.hint);scene.append(action,text('p',motion.hint,'gesture'));
  action.addEventListener('click',()=>signature());
  const placeTarget=()=>{
   const target=motion.target==='hero'?motion.hero:motion.target==='left'?left:actor;
   const t=target.getBoundingClientRect(),b=scene.getBoundingClientRect();
   if(!t.width||!t.height)return;
   const img=target.querySelector('img'),ratio=img?.naturalWidth/img?.naturalHeight;
   const height=ratio?Math.min(t.height,t.width/ratio):t.height,width=ratio?height*ratio:t.width;
   Object.assign(action.style,{left:(t.left-b.left+(t.width-width)/2)+'px',top:(t.bottom-b.top-height)+'px',width:width+'px',height:height+'px',bottom:'auto'});
  };
  record.placeTarget=placeTarget;
  if(effect!=='family'&&effect!=='walk'){
   const ornament=text('button','','hotspot ornament-touch');ornament.type='button';ornament.setAttribute('aria-label','Sway the hanging '+(sample.slug==='rosewood-vows'?'bells':['dance','lights'].includes(effect)?'chandelier':'lantern'));scene.append(ornament);
   ornament.addEventListener('click',()=>{if(busy)return;clearTimer();animate(pendant.querySelector('img'),[{transform:'rotate(0)'},{transform:'rotate(10deg)'},{transform:'rotate(-6deg)'},{transform:'rotate(0)'}],{duration:1500});schedule();});
  }
  viewport.append(scene);
  const dot=text('button','','dot');dot.type='button';dot.setAttribute('aria-label',(event?.[0]||({cover:'Invitation',family:'Families',closing:'With love'})[id])+` — scene ${i+1} of ${specs.length}`);dot.addEventListener('click',()=>go(i));rail.append(dot);
  return{...record,dot};
 });
 ensure(0);ensure(1);sync();
 // Decode each scene once, spread over idle turns while the curtain plays.
 const warm=(i)=>{if(i>=records.length)return;const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,80));idle(()=>{ensure(i).then(()=>warm(i+1));},{timeout:500});};warm(2);
 new ResizeObserver(()=>records[index]?.placeTarget()).observe(viewport);
}
function ensure(i){
 const rec=records[i];if(!rec)return Promise.resolve();
 if(rec.ready)return rec.ready;
 rec.ready=Promise.all([...rec.scene.querySelectorAll('img[data-src]')].map(img=>{
  img.fetchPriority=i===index?'high':'low';img.src=img.dataset.src;
  return img.decode?.().catch(()=>{});
 }));return rec.ready;
}
function animate(el,frames,options={}){if(!el)return;return el.animate(frames,{duration:reduced?1:1000,easing:'cubic-bezier(.22,.61,.36,1)',...options,...(reduced?{duration:1}:{})});}
function clearTimer(){clearTimeout(timer);timer=undefined;timerBar.classList.remove('running');}
function schedule(){clearTimer();if(!auto||!opened||busy||document.hidden||index===records.length-1)return;void timerBar.offsetWidth;timerBar.classList.add('running');timer=setTimeout(()=>signature(true),6000);}
function sync(){records[index].placeTarget();records.forEach((r,i)=>{r.dot.setAttribute('aria-current',String(i===index));});previous.hidden=index===0;next.hidden=index===records.length-1;viewport.dataset.activeScene=records[index].scene.dataset.scene;ensure(index+1);}
async function go(target,fromSignature=false){
 if(transitioning||target<0||target>=records.length||target===index)return false;
 busy=true;transitioning=true;interactionEpoch++;clearTimeout(actionTimer);clearTimer();
 const outgoing=records[index],incoming=records[target];
 // Keep the previous scene's completed pose visible while the next plate is ready.
 await ensure(target);incoming.motion.reset();incoming.textReveal.reset();
 outgoing.scene.inert=true;incoming.scene.hidden=false;incoming.scene.inert=false;
 fitSceneNames();incoming.placeTarget();index=target;sync();
 incoming.textReveal.play();
 // Fade one incoming layer over an opaque previous plate: no white midpoint flash.
 const duration=reduced?1:650;
 incoming.scene.style.zIndex='2';outgoing.scene.style.zIndex='1';
 const into=animate(incoming.scene,[{opacity:0},{opacity:1}],{duration,fill:'both'});
 await into.finished.catch(()=>{});
 outgoing.scene.hidden=true;outgoing.motion.reset();outgoing.textReveal.reset();
 outgoing.scene.classList.remove('is-acting','scene-arrival','arriving');
 outgoing.scene.querySelectorAll('.particle').forEach(p=>p.remove());
 into.cancel();incoming.scene.style.removeProperty('z-index');outgoing.scene.style.removeProperty('z-index');busy=false;transitioning=false;schedule();return true;
}
async function signature(fromAuto=false){
 if(!opened||busy)return;busy=true;clearTimer();const r=records[index],epoch=++interactionEpoch;r.scene.classList.add('is-acting');
 await r.motion.play();
 if(epoch!==interactionEpoch)return;
 if(fromAuto&&!auto){busy=false;r.scene.classList.remove('is-acting');return;}
 // Let the finished action read before handing over to the next scene.
 actionTimer=setTimeout(()=>{if(epoch!==interactionEpoch)return;if(index<records.length-1){go(index+1,true);}else{busy=false;r.scene.classList.remove('is-acting');schedule();}},reduced?40:850);
}
async function boot(){
 const response=await fetch('./wedding.json',{cache:'no-store'});if(!response.ok)throw Error('Configuration unavailable');sample=await response.json();
 const briefPreview=location.pathname.endsWith('/demo/') && new URLSearchParams(location.search).get('signaturePreview')==='1';
 if(briefPreview){const preview=JSON.parse(sessionStorage.getItem('ls-signature-preview-'+sample.slug)||'null');if(!preview)throw Error('Brief preview unavailable');sample=preview;sample.active=true;}
 const params=new URLSearchParams(location.search);
 if(!sample.editor?.fields&&params.get('personalise')==='1'){const bride=(params.get('bride')||'').trim().slice(0,120),groom=(params.get('groom')||'').trim().slice(0,120);if(bride&&groom){sample.partnerOrder=params.get('side')==='bride'?'brideFirst':'groomFirst';sample.one=sample.partnerOrder==='brideFirst'?bride:groom;sample.two=sample.partnerOrder==='brideFirst'?groom:bride;sample.parents=['',''];sample.surname='';document.title=sample.one+' & '+sample.two+' — Wedding Invitation';}}
 if(sample.active===false){root.classList.remove('intro-active');document.querySelector('[data-intro]').remove();nav.hidden=true;viewport.append(text('div','This invitation is being prepared. Please check back once the couple has shared it.','scene-inactive'));return;}
 await resolveEventArtwork(sample);
 root.style.setProperty('--ink',sample.ink);root.style.setProperty('--accent',sample.accent);root.style.setProperty('--glow',sample.glow);
 window.LS_WEDDING={hints:{intro:'Tap the curtain to open'}};
 build();await Promise.all([ensure(0),document.fonts.load('400 24px Rungkut'),document.fonts.load('400 24px \"Hello Bride\"'),document.fonts.load('400 24px \"Cormorant Garamond\"')]);const video=document.querySelector('[data-intro-video]');mountIntroNames(document.querySelector('[data-intro]'),video,{partnerOne:sample.one,partnerTwo:sample.two,connector:'&'});
 document.addEventListener('intro:done',()=>queueMicrotask(()=>{opened=true;records[0].textReveal.play();schedule();}),{once:true});
 initMusic();
 fitSceneNames();new ResizeObserver(fitSceneNames).observe(viewport);
 if(briefPreview){document.querySelector('[data-intro]').remove();root.classList.remove('intro-active');viewport.removeAttribute('inert');nav.removeAttribute('inert');opened=true;auto=false;records[0].textReveal.play();}else await import('./js/intro.js');
 previous.addEventListener('click',()=>go(index-1));next.addEventListener('click',()=>go(index+1));
 autoButton.addEventListener('click',()=>{auto=!auto;autoButton.setAttribute('aria-pressed',String(auto));autoButton.setAttribute('aria-label',auto?'Pause autoplay':'Start autoplay');autoButton.innerHTML=controlIcon(auto?'pause':'play');schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimer();else schedule();});
 document.addEventListener('keydown',e=>{if(!opened||e.altKey||e.metaKey||e.ctrlKey||rsvpDialog?.open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();go(index+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(index-1);}});
 let start;viewport.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};clearTimer();},{passive:true});viewport.addEventListener('pointerup',e=>{if(start){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){go(index+(dx<0?1:-1));}start=null;}schedule();},{passive:true});viewport.addEventListener('pointercancel',()=>{start=null;schedule();},{passive:true});
}
function fitSceneNames(){
 for(const el of viewport.querySelectorAll('.couple-names span,.family-block h3')){const parent=el.closest('.copy');if(!parent)continue;const max=parent.clientWidth;el.style.fontSize='';el.style.whiteSpace='nowrap';let size=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>max&&size>18){size-=1;el.style.fontSize=size+'px'}if(el.scrollWidth>max){el.style.whiteSpace='normal';el.style.overflowWrap='anywhere'}}
}
let rsvpDialog;
function openRsvp(){
 clearTimer();
 if(!rsvpDialog){
  rsvpDialog=document.createElement('dialog');rsvpDialog.className='scene-rsvp-dialog';
  const form=document.createElement('form');form.method='post';
  const close=text('button','Close','scene-rsvp-close');close.type='button';close.addEventListener('click',()=>rsvpDialog.close());form.append(close,text('h2','Celebrate with us'));
  const defaults=[{key:'guestName',label:'Your name',type:'text',required:true},{key:'mobileNumber',label:'Mobile number',type:'tel',required:true},{key:'guestCount',label:'Number of guests',type:'number',required:true},{key:'attendance',label:'Will you attend?',type:'select',required:true,options:['Yes','No']},{key:'message',label:'A note for the couple',type:'textarea'}];
  for(const f of sample.rsvpForm?.fields||defaults){const label=text('label',f.label||f.key);let input;if(f.type==='select'){input=document.createElement('select');for(const val of f.options||['Yes','No']){const opt=text('option',String(val));opt.value=String(val);input.append(opt)}}else{input=document.createElement(f.type==='textarea'?'textarea':'input');if(input.tagName==='INPUT')input.type=['number','tel','email'].includes(f.type)?f.type:'text'}input.name=f.key;input.required=!!f.required;if(input.type==='number'){input.min='1';input.max='100';input.value='1'}input.maxLength=1000;label.append(input);form.append(label)}
  const submit=text('button','Send RSVP','scene-rsvp-submit');submit.type='submit';const status=text('p','','scene-rsvp-status');status.setAttribute('role','status');form.append(submit,status);
  form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;status.textContent='Sending…';try{const fields=Object.fromEntries(new FormData(form));const response=await fetch('./rsvp/submit.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields})});const data=await response.json();if(!response.ok||!data.ok)throw Error(data.message||data.error||'Could not send RSVP. Please try again.');status.textContent=data.demo?data.message:'Thank you! Your response has been sent to the couple.';if(!data.demo)form.reset()}catch(err){status.textContent=err.message}finally{submit.disabled=false}});
  rsvpDialog.append(form);document.body.append(rsvpDialog);rsvpDialog.addEventListener('close',schedule);
 }
 rsvpDialog.showModal();
}
boot().catch(error=>{console.error(error);document.querySelector('.load-error').hidden=false;});
