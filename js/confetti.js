// Adapted from the supplied ConfettiBackground: depth, drift and four paper shapes.
// A finite, scene-sized burst; no animation loop survives navigation or replay.
export function createConfetti(scene,{reduced=false}={}){
 const canvas=document.createElement('canvas');canvas.className='padma-confetti';canvas.setAttribute('aria-hidden','true');scene.append(canvas);
 const ctx=canvas.getContext('2d');let raf=0,finish,width=0,height=0;
 function reset(){cancelAnimationFrame(raf);raf=0;ctx?.clearRect(0,0,width,height);if(finish){const resolve=finish;finish=null;resolve();}}
 function play(){
  reset();if(reduced||!ctx)return Promise.resolve();
  const box=scene.getBoundingClientRect();width=box.width;height=box.height;
  // Bound the raster resolution on high-DPI phones and zoomed desktop previews.
  const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  const pieces=Array.from({length:72},(_,i)=>({x:Math.random()*width,y:(.1+Math.random()*.42)*height,z:350+Math.random()*650,vx:(Math.random()-.5)*width*.05,vy:height*(.12+Math.random()*.1),vz:100+Math.random()*110,rotation:Math.random()*Math.PI*2,spin:(Math.random()-.5)*2.3,size:width*(.009+Math.random()*.011),phase:Math.random()*Math.PI*2,shape:i%4,color:['#fffdf5','#f8fafc','#eee8dd','#e8dcbd'][i%4]}));
  return new Promise(resolve=>{
   finish=resolve;let start,previous;
   const frame=now=>{
    if(start===undefined){start=now;previous=now;}
    const elapsed=(now-start)/1000,dt=Math.min((now-previous)/1000,.05);previous=now;
    if(elapsed>=4.8||scene.hidden){reset();return;}
    ctx.clearRect(0,0,width,height);
    const fade=Math.min(1,elapsed/.35,(4.8-elapsed)/1.1);
    for(const p of pieces){
     p.phase+=dt*1.8;p.x+=(p.vx+Math.sin(p.phase)*width*.012)*dt;p.y+=p.vy*dt;p.z=Math.max(50,p.z-p.vz*dt);p.rotation+=p.spin*dt;
     const scale=800/(800+p.z),size=p.size*scale,x=width/2+(p.x-width/2)*scale,y=height/2+(p.y-height/2)*scale;
     ctx.save();ctx.translate(x,y);ctx.rotate(p.rotation);ctx.globalAlpha=fade*scale*.78;ctx.fillStyle=p.color;
     if(p.shape===0)ctx.fillRect(-size*.7,-size*.35,size*1.4,size*.7);
     else if(p.shape===1){ctx.beginPath();ctx.arc(0,0,size*.45,0,Math.PI*2);ctx.fill();}
     else{ctx.beginPath();const points=p.shape===2?12:4;for(let i=0;i<points;i++){const radius=p.shape===2&&i%2?size*.3:size*.65,angle=i*Math.PI*2/points-Math.PI/2;if(i)ctx.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);else ctx.moveTo(Math.cos(angle)*radius,Math.sin(angle)*radius);}ctx.closePath();ctx.fill();}
     ctx.restore();
    }
    raf=requestAnimationFrame(frame);
   };raf=requestAnimationFrame(frame);
  });
 }
 return{play,reset};
}
