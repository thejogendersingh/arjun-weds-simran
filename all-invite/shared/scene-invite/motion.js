import {createConfetti} from './confetti.js?v=1';
const shared=new URL('./',import.meta.url);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Every scene owns its extra layers and animations, so revisiting starts cleanly.
export function createMotion(r,sample,helpers){
 const {scene,actor,left,right,pendant,bloom,effect}=r,{animate,makeImage,asset}=helpers;
 const extras=[],animations=[];let generation=0;const cleanups=[];
 const add=(name,cls)=>{const el=document.createElement('div');el.className='motion-art '+cls;el.append(makeImage(new URL('motion/'+name+'.webp?v=1',shared).href,'sprite'));scene.append(el);extras.push(el);return el;};
 const addLocal=(name,cls)=>{const el=document.createElement('div');el.className='motion-art '+cls;el.append(makeImage(asset(name+'.webp'),'sprite'));scene.append(el);extras.push(el);return el;};
 const node=(cls,parent=scene)=>{const el=document.createElement('i');el.className=cls;el.setAttribute('aria-hidden','true');parent.append(el);extras.push(el);return el;};
 const run=(el,frames,options={})=>{const a=animate(el,frames,{fill:'forwards',...options});animations.push(a);return a.finished.catch(()=>{});};
 const show=(el,delay=0,duration=650)=>run(el,[{opacity:0},{opacity:1}],{delay,duration});
 const image=el=>el.querySelector('img');
 const pulse=(el,delay=0)=>run(el,[{transform:'scale(1)'},{transform:'scale(1.065)',offset:.35},{transform:'scale(1)'}],{delay,duration:650});
 let hint,target='actor',play,hero,mirrorReflection,art=[];
 const groundPulse=()=>run(actor,[{transform:'rotate(0)'},{transform:'rotate(-1.2deg)',offset:.25},{transform:'rotate(1.2deg)',offset:.65},{transform:'rotate(0)'}],{duration:2200,easing:'ease-in-out'});
 function mirror(){
  const m=add('mirror','story-mirror');
  mirrorReflection=document.createElement('div');mirrorReflection.className='mirror-reflection';mirrorReflection.append(makeImage(asset('couple-wedding.webp'),'sprite'));m.append(mirrorReflection);
  const sheen=node('mirror-sheen',m);return {m,sheen};
 }
 function lamps(parent){return [.13,.33,.52,.72,.89].map(x=>{const flame=node('tiny-flame',parent);flame.style.left=(x*100)+'%';return flame;});}
 function sequential(flames){return Promise.all(flames.map((f,i)=>run(f,[{opacity:0,transform:'scaleY(.1)'},{opacity:1,transform:'scaleY(1)'}],{delay:i*340,duration:550})));}
 function lotus(){
  hero=addLocal('bird','lotus-opening');target='hero';hint='Tap the lotus to unfold our wishes';
  const circles=Array.from({length:3},()=>node('lotus-aura',hero));
  play=()=>Promise.all([run(image(hero),[{clipPath:'circle(18% at 50% 65%)',transform:'scale(.65)'},{clipPath:'circle(80% at 50% 50%)',transform:'scale(1)'}],{duration:2800}),...circles.map((c,i)=>run(c,[{opacity:0,transform:'scale(.4)'},{opacity:.55,offset:.2},{opacity:0,transform:'scale(1.65)'}],{delay:i*550,duration:2200}))]);
 }
 function bouquet(){
  hero=addLocal('bird','welcome-bouquet');target='hero';hint='Tap the bouquet to unfurl our welcome';
  const ribbon=node('bouquet-ribbon',hero);ribbon.textContent=sample.one+' & '+sample.two;
  play=()=>Promise.all([run(hero,[{transform:'rotate(-3deg)'},{transform:'rotate(3deg)',offset:.35},{transform:'rotate(0)'}],{duration:2600}),run(ribbon,[{opacity:0,clipPath:'inset(0 50% 0 50%)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{delay:600,duration:1800})]);
 }
 function petalCurtain(){
  const petals=Array.from({length:16},(_,i)=>{const p=node('falling-petal');p.style.left=(12+((i*19)%77))+'%';p.style.top=(48+(i%3)*3)+'%';return p;});
  return ()=>Promise.all(petals.map((p,i)=>run(p,[{opacity:0,transform:'translate(0,-8cqw) rotate(0)'},{opacity:.9,offset:.16},{opacity:0,transform:`translate(${i%2?'-':'+'}7cqw,56cqw) rotate(${i*45}deg)`}],{delay:i*65,duration:sample.ambient==='forest'?3400:2300,easing:'linear'})));
 }
 if(effect==='walk'){
  hint='Tap the couple to walk with us';
  play=async()=>{
   const travel=sample.ambient==='forest'?3.2:.9;
   const frames=Array.from({length:17},(_,i)=>{const t=i/16,e=1-(1-t)**2;return{offset:t,transform:`translateY(${(-travel*e-.28*Math.sin(4*Math.PI*t)).toFixed(3)}cqw) scale(${(1-.035*e).toFixed(4)})`};});
   await run(actor,frames,{duration:sample.ambient==='forest'?3000:1400,easing:'linear'});
   await Promise.all([run(scene.querySelector('.plate'),[{transform:'scale(1)'},{transform:'scale(1.085)'}],{duration:1100,easing:'ease-in-out'}),run(r.glow,[{opacity:0},{opacity:.4}],{duration:1100})]);
  };
 }else if(effect==='family'){
  if(sample.familyMotion==='heirloom'){
   const {m,sheen}=mirror();hero=m;target='hero';hint='Tap the heirloom frame to reveal our story';
   const shutters=[node('frame-shutter frame-shutter-left',m),node('frame-shutter frame-shutter-right',m)];
   play=()=>Promise.all([show(mirrorReflection,700,900),...shutters.map((sh,i)=>run(sh,[{transform:'perspective(350px) rotateY(0)'},{transform:'perspective(350px) rotateY('+ (i?'100':'-100')+'deg)'}],{duration:2200})),run(sheen,[{opacity:0},{opacity:.4,offset:.45},{opacity:0}],{duration:2500})]);
  }else if(sample.familyMotion==='lotus'){lotus();}
  else if(sample.familyMotion==='bouquet'){bouquet();}
  else if(sample.slug==='rang-mahal'){
   const {m,sheen}=mirror();hero=m;target='hero';hint='Tap the mirror to reveal our story';
   play=async()=>{await Promise.all([show(mirrorReflection,450,1500),run(sheen,[{transform:'translateX(-180%) skewX(-15deg)',opacity:0},{opacity:.8,offset:.25},{transform:'translateX(180%) skewX(-15deg)',opacity:0}],{duration:2400})]);};
  }else if(sample.slug==='neel-sarovar'){
   hero=add('balloon','wish-balloon');target='hero';hint='Tap the balloon to lift our wishes';
   const ribbon=node('wish-ribbon',hero);ribbon.textContent=sample.one+' & '+sample.two;
   play=()=>Promise.all([run(hero,[{transform:'translateY(0) rotate(-2deg)'},{transform:'translate(3cqw,-13cqw) rotate(2deg)',offset:.6},{transform:'translate(2cqw,-18cqw) rotate(0)'}],{duration:3200,easing:'ease-in-out'}),show(ribbon,900,1100)]);
  }else if(sample.slug==='phulkari-courtyard'){
   hero=add('phulkari','family-phulkari');target='hero';hint='Tap the phulkari to unfold our welcome';
   play=()=>run(image(hero),[{clipPath:'inset(0 0 65% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:2700,easing:'cubic-bezier(.2,.8,.3,1)'});
  }else{
   hero=bloom;hero.classList.add('jasmine-welcome');target='hero';hint='Tap the jasmine to welcome our families';
   const rain=petalCurtain();
   const lights=[node('welcome-lamp lamp-left'),node('welcome-lamp lamp-right')];
   play=()=>Promise.all([
    run(bloom,[{clipPath:'inset(0 48% 0 48%)',transform:'translateY(-3cqw) scale(.88)'},{clipPath:'inset(0 0 0 0)',transform:'translateY(0) scale(1)'}],{duration:3200}),
    run(left,[{transform:'translateX(-7cqw)',opacity:.25},{transform:'translateX(0)',opacity:1}],{duration:2200}),
    run(right,[{transform:'translateX(7cqw)',opacity:.25},{transform:'translateX(0)',opacity:1}],{delay:350,duration:2200}),
    ...lights.map((l,i)=>show(l,900+i*550,1700)),rain()
   ]);
  }
 }else if(effect==='balloon'){
  hero=add('balloon','wish-balloon rosewood-balloon');target='hero';hint='Tap the balloon to lift our welcome';
  const ribbon=node('wish-ribbon',hero);ribbon.textContent=sample.one+' & '+sample.two;
  play=()=>Promise.all([run(hero,[{transform:'translate(0,0) rotate(-2deg)'},{transform:'translate(4cqw,-14cqw) rotate(2deg)',offset:.6},{transform:'translate(7cqw,-27cqw) rotate(0)'}],{duration:4200,easing:'ease-in-out'}),show(ribbon,700,1000)]);
 }else if(effect==='lotus'){lotus();}
 else if(effect==='bouquet'){bouquet();}
 else if(effect==='arch'){
  hero=addLocal('garland','opening-arch');target='hero';hint='Tap the floral arch to open our celebration';
  const arch=image(hero);
  play=()=>Promise.all([run(arch,[{clipPath:'inset(0 43% 0 43%)',transform:'scaleX(.84)'},{clipPath:'inset(0 0 0 0)',transform:'scaleX(1)'}],{duration:3000}),run(r.glow,[{opacity:0},{opacity:.3}],{delay:1400,duration:1300})]);
 }else if(effect==='procession'){
  target='left';hint=scene.querySelector('h2').textContent==='Reception'?'Tap the lantern to light the garden':'Tap the lantern to light our welcome';
  const pools=Array.from({length:5},(_,i)=>{const pool=node('aisle-pool');pool.style.left=(6+i*18)+'%';return pool;});
  const a=node('welcome-lamp lamp-left'),b=node('welcome-lamp lamp-right');
  play=()=>Promise.all([...pools.map((p,i)=>run(p,[{opacity:0,transform:'scale(.6)'},{opacity:.8,transform:'scale(1)'}],{delay:i*380,duration:1100})),show(a,0,1200),show(b,1500,1200)]);
 }else if(effect==='candles'){
  target='left';hint='Tap the candle to light the table';
  const flame=node('dinner-flame',left);const glow=node('welcome-lamp lamp-left');
  play=()=>{const box=left.getBoundingClientRect(),img=image(left),ratio=img.naturalWidth/img.naturalHeight,height=Math.min(box.height,box.width/ratio),width=height*ratio;Object.assign(flame.style,{left:((box.width-width)/2+width*.47)+'px',top:(box.height-height+height*.51)+'px',width:width*.08+'px',height:height*.12+'px'});return Promise.all([run(flame,[{opacity:0,transform:'scaleY(0)'},{opacity:1,transform:'scaleY(1)',offset:.25},{transform:'scaleY(.9)',offset:.5},{transform:'scaleY(1.07)',offset:.75},{transform:'scaleY(1)'}],{duration:3000}),show(glow,400,2200)]);};
 }else if(effect==='bells'){
  hero=addLocal('chandelier','chapel-bells');target='hero';hint='Tap the bells to ring in our vows';
  const rings=Array.from({length:3},()=>node('bell-sound',hero));
  play=()=>Promise.all([run(image(hero),[{transform:'rotate(0)'},{transform:'rotate(-12deg)',offset:.18},{transform:'rotate(11deg)',offset:.4},{transform:'rotate(-7deg)',offset:.65},{transform:'rotate(0)'}],{duration:3000}),...rings.map((ring,i)=>run(ring,[{opacity:0,transform:'scale(.7)'},{opacity:.55,offset:.2},{opacity:0,transform:'scale(1.8)'}],{delay:i*600,duration:1800}))]);
 }else if(effect==='waltz'){
  hint='Tap the couple for our first dance';
  const notes=Array.from({length:5},(_,i)=>{const n=node('waltz-note');n.textContent=i%2?'♪':'♫';n.style.left=(20+i*13)+'%';return n;});
  play=()=>Promise.all([run(actor,[{transform:'rotate(0)'},{transform:'rotate(-2deg)',offset:.25},{transform:'rotate(2deg)',offset:.6},{transform:'rotate(0)'}],{duration:3800,easing:'ease-in-out'}),...notes.map((n,i)=>run(n,[{opacity:0,transform:'translateY(0)'},{opacity:.8,offset:.25},{opacity:0,transform:'translateY(-16cqw)'}],{delay:i*300,duration:2500}))]);
 }else if(effect==='haldi'||effect==='maiyan'){
  target='left';hint='Tap the haldi bowl to colour their cheeks';
  const hand=add('haldi-hand','haldi-applicator');
  // Cheeks are attached to the artwork bounds, including its contain letterboxing.
  const positions=sample.haldiCheeks|| (sample.slug==='phulkari-courtyard'?[[.32,.24],[.64,.29]]:sample.slug==='gulabi-darbaar'?[[.37,.16],[.57,.20]]:[[.39,.16],[.64,.22]]);
  const marks=positions.map(([x,y])=>{const mark=node('haldi-stroke',actor);mark.dataset.x=x;mark.dataset.y=y;return mark;});
  const place=()=>{
   const img=image(actor),box=actor.getBoundingClientRect(),ratio=img.naturalWidth/img.naturalHeight;
   const height=Math.min(box.height,box.width/ratio),width=height*ratio;
   marks.forEach(m=>{m.style.left=((box.width-width)/2+Number(m.dataset.x)*width)+'px';m.style.top=(box.height-height+Number(m.dataset.y)*height)+'px';});
  };
  play=async()=>{
   place();const box=scene.getBoundingClientRect(),handBox=hand.getBoundingClientRect();
   const handImg=image(hand),handHeight=Math.min(handBox.height,handBox.width*handImg.naturalHeight/handImg.naturalWidth),handWidth=handHeight*handImg.naturalWidth/handImg.naturalHeight;
   const origin={x:handBox.left-box.left+(handBox.width-handWidth)/2+handWidth*.09,y:handBox.bottom-box.top-handHeight+handHeight*.45};
   const dest=marks.map(m=>{const b=m.getBoundingClientRect();return{x:b.left-box.left-origin.x,y:b.top-box.top-origin.y};});
   await Promise.all([pulse(image(left)),run(hand,[{opacity:0,transform:'translate(0,0) rotate(-10deg)'},{opacity:1,offset:.12},{transform:`translate(${dest[0].x}px,${dest[0].y}px) rotate(0)`,offset:.32},{transform:`translate(${dest[0].x+5}px,${dest[0].y+2}px) rotate(-5deg)`,offset:.43},{transform:`translate(${dest[1].x}px,${dest[1].y}px) rotate(0)`,offset:.66},{transform:`translate(${dest[1].x+5}px,${dest[1].y+2}px) rotate(-5deg)`,offset:.78},{opacity:0,transform:'translate(0,0) rotate(-10deg)'}],{duration:3700,easing:'ease-in-out'}),...marks.map((m,i)=>run(m,[{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:.88,clipPath:'inset(0 0 0 0)'}],{delay:i?2400:1300,duration:500}))]);
  };
 }else if(effect==='mehendi'){
  hero=add('mehendi-hands-plain','mehendi-hands');target='hero';hint='Tap the mehendi hands to reveal the design';
  const pattern=makeImage(new URL('motion/mehendi-hands.webp?v=1',shared).href,'sprite mehendi-pattern');hero.append(pattern);
  const cone=add('henna-cone','henna-applicator');
  play=()=>Promise.all([run(hero,[{transform:'scale(1)'},{transform:'scale(1.13)',offset:.25},{transform:'scale(1.13)'}],{duration:3300}),run(pattern,[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:2600}),run(cone,[{opacity:0,transform:'translate(0,0)'},{opacity:1,offset:.1},{transform:'translate(-3cqw,5cqw) rotate(-5deg)',offset:.4},{transform:'translate(2cqw,9cqw) rotate(3deg)',offset:.65},{opacity:0,transform:'translate(0,0)'}],{duration:3300})]);
 }else if(effect==='dance'||effect==='drum'){
  target='left';hint=effect==='drum'?'Tap the dholki to set the rhythm':scene.querySelector('h2')?.textContent==='Sangeet'?'Tap the dhol to begin the Sangeet':'Tap the dhol to start the dancing';
  const rings=Array.from({length:3},()=>node('rhythm-ring',left));
  const beams=[node('stage-beam beam-left'),node('stage-beam beam-right')];
  play=()=>Promise.all([run(image(left),Array.from({length:13},(_,i)=>({offset:i/12,transform:`rotate(${i===12?0:i%2?4:-4}deg) scale(${i%2?1.06:1})`})),{duration:2900,easing:'linear'}),groundPulse(),...rings.map((ring,i)=>run(ring,[{opacity:0,transform:'scale(.55)'},{opacity:.7,offset:.1},{opacity:0,transform:'scale(1.65)'}],{delay:i*600,duration:1500})),...beams.map((beam,i)=>run(beam,[{opacity:0,transform:`rotate(${i?-12:12}deg)`},{opacity:.45,offset:.2},{transform:`rotate(${i?16:-16}deg)`,opacity:.3,offset:.7},{opacity:0}],{delay:i*250,duration:2900}))]);
 }else if(effect==='jaggo'){
  target='left';hint='Tap the Jaggo lantern to raise the lights';
  const trail=node('jaggo-trail');const bulbs=Array.from({length:9},(_,i)=>{const b=node('jaggo-bulb',trail);b.style.left=(i*11)+'%';b.style.top=(12+Math.sin(i/8*Math.PI)*55)+'%';return b;});
  play=()=>Promise.all([run(left,[{transform:'translate(0,0) rotate(0)'},{transform:'translate(7cqw,-9cqw) rotate(-4deg)',offset:.5},{transform:'translate(11cqw,-12cqw) rotate(3deg)'}],{duration:3100}),...bulbs.map((b,i)=>show(b,i*250,700)),groundPulse()]);
 }else if(effect==='garland'&&sample.slug==='neel-sarovar'){
  const {m,sheen}=mirror();hero=m;target='hero';hint='Tap the mirror to see our forever';
  play=()=>Promise.all([show(mirrorReflection,450,1800),run(sheen,[{transform:'translateX(-180%)',opacity:0},{opacity:.65,offset:.4},{transform:'translateX(180%)',opacity:0}],{duration:2900})]);
 }else if(effect==='garland'){
  hero=bloom;target='hero';hint='Tap the flowers to shower the couple';bloom.classList.add('ceremony-flowers');
  const rain=petalCurtain();
  play=()=>Promise.all([run(bloom,[{transform:'translateY(-5cqw) scale(.95)'},{transform:'translateY(0) scale(1)'}],{duration:1900}),rain()]);
 }else if(effect==='forest-vows'){
  hero=bloom;target='hero';hint='Tap the flowers to shower our vows';bloom.classList.add('forest-vow-flowers');
  const rain=petalCurtain();
  const rings=Array.from({length:3},(_,i)=>{const n=node('forest-vow-ring');n.style.animationDelay=i*350+'ms';return n;});
  play=()=>Promise.all([run(bloom,[{transform:'translateY(-3cqw) scale(.92)'},{transform:'translateY(0) scale(1)'}],{duration:2400}),rain(),...rings.map((n,i)=>run(n,[{opacity:0,transform:'scale(.75)'},{opacity:.55,offset:.3},{opacity:0,transform:'scale(1.35)'}],{delay:i*500,duration:2800})),run(r.glow,[{opacity:0},{opacity:.35,offset:.5},{opacity:.14}],{duration:3400})]);
 }else if(effect==='nikah'){
  target='left';hint='Tap the lantern to light our welcome';
  const glows=[node('welcome-lamp lamp-left'),node('welcome-lamp lamp-right')];
  play=()=>Promise.all(glows.map((g,i)=>run(g,[{opacity:0,transform:'scale(.5)'},{opacity:.9,transform:'scale(1)'}],{delay:i*900,duration:1600})));
 }else if(effect==='blessing'){
  hero=bloom;target='hero';hint='Tap the flowers to open our welcome';bloom.classList.add('gurdwara-welcome');
  const shower=sample.slug==='phulkari-courtyard'?petalCurtain():null;
  play=async()=>{const epoch=generation;await run(bloom,[{clipPath:'inset(0 33% 0 33%)',transform:'scale(.94)'},{clipPath:'inset(0 0 0 0)',transform:'scale(1)'}],{duration:3100});if(shower&&epoch===generation)await shower();};
 }else if(effect==='lights'&&sample.slug==='neel-sarovar'){
  hero=add('lotus-boat','lotus-wish');target='hero';hint='Tap the lotus boat to float a wish';
  const ripples=Array.from({length:3},()=>node('lake-ripple'));
  play=()=>Promise.all([run(hero,[{transform:'translate(0,0) rotate(-2deg)'},{transform:'translate(11cqw,-1cqw) rotate(2deg)',offset:.6},{transform:'translate(14cqw,0) rotate(-1deg)'}],{duration:3900,easing:'linear'}),...ripples.map((p,i)=>run(p,[{opacity:0,transform:'scale(.25)'},{opacity:.6,offset:.2},{opacity:0,transform:'scale(2)'}],{delay:i*650,duration:2300}))]);
 }else if(effect==='lights'){
  hero=add('diya-tray','evening-diyas');target='hero';hint=sample.slug==='noor-e-mohabbat'?'Tap the lamps to illuminate the Walima':'Tap the diyas to light the evening';
  const flames=lamps(hero);play=()=>sequential(flames);
 }else{
  target='actor';hint='Tap the couple to send your warm wishes';
  const rain=petalCurtain();play=rain;
 }
 if(sample.ambient==='forest'){
  // Move just the painted outer foliage; keep the central text and ground still.
  const plate=scene.querySelector('.plate');
  ['left','right'].forEach(side=>{const canopy=document.createElement('div');canopy.className='forest-canopy forest-canopy-'+side;canopy.setAttribute('aria-hidden','true');canopy.append(makeImage(plate.dataset.src,'plate'));scene.append(canopy);});
  [pendant,...scene.querySelectorAll('.pendant-left')].forEach(lamp=>node('forest-lantern-glow',lamp));
  const flyingDove=cls=>{const bird=addLocal('dove-flight-up',cls);bird.setAttribute('aria-hidden','true');image(bird).classList.add('dove-wings-up');bird.append(makeImage(asset('dove-flight-down.webp'),'sprite dove-wings-down'));return bird;};
  const restingBird=flyingDove('forest-bird forest-bird-idle');
  node('forest-mist');
  if(['walk','mehendi','haldi','farewell'].includes(effect))node('forest-water-glint');
  if(effect==='family'||effect==='mehendi'){
   const birds=Array.from({length:effect==='family'?3:2},(_,i)=>{const b=flyingDove('forest-bird forest-bird-response');b.style.left=(-12-i*7)+'%';b.style.bottom=(effect==='family'?34:46)+i*3+'%';return b;});
   const flight=()=>Promise.all(birds.map((b,i)=>{
    const rise=effect==='family'?24:12;
    const frames=Array.from({length:25},(_,step)=>{const t=step/24,arc=Math.sin(Math.PI*t);return{offset:t,opacity:Math.min(1,t/.12,(1-t)/.14)*.9,transform:`translate(${(116*t).toFixed(3)}cqw,${(-rise*t-3*arc).toFixed(3)}cqw) rotate(${(-3+6*arc).toFixed(3)}deg) scale(${(.85+.08*arc).toFixed(3)})`};});
    return run(b,frames,{delay:600+i*350,duration:4800,easing:'linear'});
   }));
   const petals=petalCurtain(),basePlay=play;
   const pools=[node('forest-welcome-glow forest-welcome-left'),node('forest-welcome-glow forest-welcome-right')];
   const flowers=effect==='family'?['left','right'].map(side=>addLocal('swag','forest-welcome-flowers forest-welcome-flowers-'+side)):[];
   play=()=>Promise.all([basePlay(),flight(),petals(),
    ...flowers.map((f,i)=>run(f,[{opacity:0,transform:`translateX(${i?5:-5}cqw) scale(.7)`,clipPath:'inset(0 0 100% 0)'},{opacity:1,transform:'translateX(0) scale(1)',clipPath:'inset(0 0 0 0)'}],{delay:350+i*200,duration:2300})),
    ...pools.map((pool,i)=>run(pool,[{opacity:0,transform:'scale(.5)'},{opacity:.55,transform:'scale(1.05)',offset:.5},{opacity:.2,transform:'scale(1)'}],{delay:400+i*500,duration:3000})),
    run(left,[{transform:'rotate(0)'},{transform:'rotate(-2deg)',offset:.4},{transform:'rotate(0)'}],{duration:2600}),
    run(right,[{transform:'rotate(0)'},{transform:'rotate(2deg)',offset:.4},{transform:'rotate(0)'}],{duration:2600})]);
  }
  Array.from({length:16},(_,i)=>{const mote=node('forest-firefly');mote.style.left=(7+(i*29)%85)+'%';mote.style.top=(48+(i*11)%39)+'%';mote.style.setProperty('--drift',(i%2?1:-1)*(2+i%3)+'cqw');mote.style.animationDelay=(-i*1.73)+'s';mote.style.animationDuration=(12+(i%4)*2)+'s';});
 }
 if(['phulkari-courtyard','gulabi-darbaar'].includes(sample.slug)){
  Array.from({length:8},(_,i)=>{const mote=node('phulkari-firefly');mote.style.left=(9+(i*31)%81)+'%';mote.style.top=(53+(i*7)%31)+'%';mote.style.setProperty('--drift',(i%2?1:-1)*(2+i%3)+'cqw');mote.style.animationDelay=(-i*1.8)+'s';mote.style.animationDuration=(14+(i%4)*2)+'s';});
  if(sample.slug==='phulkari-courtyard'&&effect==='dance'){
   const dove=cls=>{const b=addLocal('dove-flight-up','phulkari-bird '+cls);b.setAttribute('aria-hidden','true');image(b).classList.add('dove-wings-up');b.append(makeImage(asset('dove-flight-down.webp'),'sprite dove-wings-down'));return b;};
   dove('phulkari-bird-idle');
   const birds=Array.from({length:2},(_,i)=>{const b=dove('phulkari-bird-response');b.style.left=(-12-i*7)+'%';b.style.bottom=(46+i*3)+'%';return b;});
   const originalPlay=play;
   play=()=>Promise.all([originalPlay(),...birds.map((b,i)=>{
    const frames=Array.from({length:25},(_,step)=>{const t=step/24,arc=Math.sin(Math.PI*t);return{offset:t,opacity:Math.min(1,t/.12,(1-t)/.14)*.85,transform:`translate(${(116*t).toFixed(3)}cqw,${(-12*t-3*arc).toFixed(3)}cqw) rotate(${(-3+6*arc).toFixed(3)}deg) scale(${(.85+.08*arc).toFixed(3)})`};});
    return run(b,frames,{delay:600+i*350,duration:4800,easing:'linear'});
   })]);
  }
 }
 if(['padma-prangan','rosewood-vows'].includes(sample.slug)){
  Array.from({length:10},(_,i)=>{const mote=node('estate-firefly');mote.style.left=(9+(i*31)%81)+'%';mote.style.top=(44+(i*7)%40)+'%';mote.style.setProperty('--drift',(i%2?1:-1)*(2+i%3)+'cqw');mote.style.animationDelay=(-i*1.8)+'s';mote.style.animationDuration=(14+(i%4)*2)+'s';});
  const shower=()=>{
   const petals=Array.from({length:28},(_,i)=>{const p=node('padma-petal');p.style.left=(7+(i*23)%87)+'%';p.style.top=(42+(i%4)*2)+'%';p.style.setProperty('--petal-size',(.9+(i%5)*.22)+'');return p;});
   return()=>Promise.all(petals.map((p,i)=>{const drift=i%2?9:-9,frames=Array.from({length:13},(_,k)=>{const t=k/12;return{offset:t,opacity:Math.min(1,t/.16,(1-t)/.25)*.88,transform:`translate3d(${drift*t+Math.sin(t*Math.PI*3)*2}cqw,${t*82}cqw,0) rotate(${i*17+t*230}deg) rotateY(${t*330}deg)`};});return run(p,frames,{delay:i*45,duration:3500+(i%4)*220,easing:'linear'});}));
  };
  if(effect==='procession'||effect==='farewell'||(sample.slug==='rosewood-vows'&&effect==='bells')){
   const rain=shower(),originalPlay=play;
   play=effect==='farewell'?rain:()=>Promise.all([originalPlay(),rain()]);
  }
  if(effect==='lotus'||(sample.slug==='rosewood-vows'&&['walk','bouquet','balloon','waltz','farewell'].includes(effect))){
   const birds=Array.from({length:3},(_,i)=>{const b=addLocal('dove-flight-up','padma-bird');b.setAttribute('aria-hidden','true');image(b).classList.add('dove-wings-up');b.append(makeImage(asset('dove-flight-down.webp'),'sprite dove-wings-down'));b.style.left=(-12-i*6)+'%';b.style.bottom=(sample.slug==='rosewood-vows'?60+i*2:45+i*3)+'%';return b;});
   const originalPlay=play;
   play=()=>Promise.all([originalPlay(),...birds.map((b,i)=>{const frames=Array.from({length:25},(_,k)=>{const t=k/24,arc=Math.sin(Math.PI*t);return{offset:t,opacity:Math.min(1,t/.12,(1-t)/.14)*.9,transform:`translate(${116*t}cqw,${-12*t-3*arc}cqw) rotate(${-3+6*arc}deg) scale(${.85+.08*arc})`};});return run(b,frames,{delay:500+i*300,duration:4800,easing:'linear'});})]);
  }
  if(sample.slug==='rosewood-vows'){
   if(['balloon','waltz','farewell'].includes(effect)){
    const b=addLocal('dove-flight-up','padma-bird rosewood-bird-idle');image(b).classList.add('dove-wings-up');b.append(makeImage(asset('dove-flight-down.webp'),'sprite dove-wings-down'));
   }
   if(effect==='candles'){
    const lights=[[12,48],[22,60],[80,48],[90,60],[32,70],[70,73]].map(([x,y])=>{const n=node('rosewood-light-pool');n.style.left=x+'%';n.style.top=y+'%';return n;});
    const originalPlay=play;play=()=>Promise.all([originalPlay(),...lights.map((n,i)=>run(n,[{opacity:0,transform:'scale(.4)'},{opacity:.75,transform:'scale(1)',offset:.4},{opacity:.6,transform:'scale(.92)'}],{delay:i*220,duration:2400}))]);
   }
  }
  if(scene.classList.contains('scene--night')){
   const confetti=createConfetti(scene,{reduced});cleanups.push(confetti.reset);const originalPlay=play;
   play=()=>Promise.all([originalPlay(),confetti.play()]);
  }
 }
 if(hero)scene.classList.add('has-hero');
 if(effect==='family')scene.classList.add('family-'+sample.slug);
 if(effect==='mehendi')scene.classList.add('has-mehendi-hands');
 if(effect==='lights')scene.classList.add('reception-'+sample.slug);
 function reset(){generation++;cleanups.forEach(cleanup=>cleanup());animations.splice(0).forEach(a=>a.cancel());scene.classList.remove('is-acting');}
 return {hint,target,hero,play,reset};
}
