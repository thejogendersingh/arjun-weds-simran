// Motion matches shivamavantika/resources/js/fx/text.js and its fx/text.css.
// Inline graphemes preserve connected script lettering; restore intact text at rest.
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
export function createTextReveal(copy,{glow=false}={}){
 copy.classList.toggle("glow-reveal",glow);
 let timer,restore=[];
 const reset=()=>{clearTimeout(timer);restore.forEach(([node,value,label])=>{node.textContent=value;if(label===null)node.removeAttribute("aria-label");else node.setAttribute("aria-label",label);});restore=[];copy.classList.remove('text-writing','text-settled');};
 const settle=()=>{restore.forEach(([node,value,label])=>{node.textContent=value;if(label===null)node.removeAttribute("aria-label");else node.setAttribute("aria-label",label);});restore=[];copy.classList.remove('text-writing');copy.classList.add('text-settled');};
 const play=()=>{
  reset();let tail=780;
  [...copy.children].forEach((block,i)=>{
   block.style.setProperty('--text-delay',(glow?200+i*72:i*72)+'ms');block.classList.remove('ink-block');
   let script=[];
   if(block.matches('.script'))script=[block];
   else if(block.matches('.couple-names'))script=[...block.querySelectorAll('span')];
   else if(block.matches('.family-block'))script=[block.querySelector('h3')];
   if(script.length&&!reduced){
    block.classList.add('ink-block');let count=0;
    script.forEach(node=>{const value=node.textContent;restore.push([node,value,node.getAttribute("aria-label")]);node.textContent='';
     const chars=segmenter?[...segmenter.segment(value)].map(s=>s.segment):Array.from(value);
     chars.forEach(char=>{const span=document.createElement('span');span.className='ink-g';if(glow){span.setAttribute('aria-hidden','true');node.setAttribute('aria-label',value);}span.style.setProperty('--letter',count++);span.textContent=char;node.append(span);});
    });tail=Math.max(tail,(glow?200:0)+i*72+Math.max(0,count-1)*(glow?45:38)+(glow?500:560));
   }else tail=Math.max(tail,i*72+780);
  });copy.classList.add('text-writing');timer=setTimeout(settle,(reduced?420:tail)+90);
 };
 return{play,reset};
}
