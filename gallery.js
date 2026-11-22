/* Gallery wording is in copy.js. */
const GT=window.BOOTH_TEXT.gallery;
'use strict';
const stage=document.getElementById('stage');
const controls=document.getElementById('galleryControls');
const counter=document.getElementById('counter');
const progressFill=document.getElementById('progressFill');
const pauseBtn=document.getElementById('pause');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const intervalMs=5000;
let photos=[], urls=[], active=0, timer=null, paused=reducedMotion, touchStart=null;

function buildSnow(){
  if(reducedMotion)return;
  const ambient=document.getElementById('snowfall');
  const globe=document.getElementById('globeFlakes');
  for(let i=0;i<22;i++){
    const f=document.createElement('span');f.className='ambient-flake';f.textContent=i%4===0?'❄':'·';
    f.style.left=`${(i*37.9)%100}%`;f.style.fontSize=`${7+(i%6)*2}px`;
    f.style.setProperty('--duration',`${18+(i%7)*3}s`);f.style.setProperty('--delay',`${-i*2.8}s`);
    ambient.appendChild(f);
  }
  for(let i=0;i<17;i++){
    const f=document.createElement('span');f.className='globe-flake';f.textContent=i%4===0?'❄':'·';
    f.style.left=`${(i*31.7+9)%100}%`;f.style.fontSize=`${8+i%5*2}px`;
    f.style.setProperty('--duration',`${11+i%5*2}s`);f.style.setProperty('--delay',`${-i*1.8}s`);
    globe.appendChild(f);
  }
}
function stop(){if(timer!==null){clearInterval(timer);timer=null}}
function play(){stop();if(!paused&&photos.length>1&&!document.hidden)timer=setInterval(()=>show(active+1),intervalMs)}
function updatePlayButton(){pauseBtn.textContent=paused?'▷ '+GT.play:'Ⅱ '+GT.pause;pauseBtn.setAttribute('aria-pressed',String(paused))}
function describe(p){return p.layout==='polaroid'?'Polaroid':p.layout==='3'||p.layout==='4'?`${p.layout}-photo strip`:String(p.layout||'custom frame').replace(/[-_]/g,' ')}
function releaseUrls(){for(const url of urls)URL.revokeObjectURL(url);urls=[]}
function emptyView(message=GT.empty){
 stage.innerHTML='';const box=document.createElement('div');box.className='empty';box.innerHTML=`<div class="empty-mark" aria-hidden="true">❄</div><h2>${GT.emptyTitle}</h2><p></p><a href="index.html" class="primary-link">${GT.make} ↗</a>`;box.querySelector('p').textContent=message;stage.append(box);
}
function render(){
 stop();releaseUrls();stage.innerHTML='';
 controls.hidden=photos.length===0;
 if(!photos.length){emptyView();return}
 active=Math.min(active,photos.length-1);
 for(let i=0;i<photos.length;i++){
  const p=photos[i];const url=URL.createObjectURL(p.blob);urls.push(url);
  const slide=document.createElement('div');slide.className='slide';slide.setAttribute('aria-hidden','true');
  const img=document.createElement('img');img.src=url;img.alt=`${describe(p)}, created ${new Date(p.createdAt).toLocaleDateString()}`;img.draggable=false;
  slide.append(img);stage.append(slide);
 }
 show(active);play();
}
function show(newIndex){
 if(!photos.length)return;
 const next=(newIndex+photos.length)%photos.length;
 const slides=[...stage.querySelectorAll('.slide')];
 slides.forEach((slide,i)=>{
  const wasActive=slide.classList.contains('active');
  slide.classList.toggle('active',i===next);
  slide.classList.toggle('leaving',i!==next&&wasActive);
  slide.setAttribute('aria-hidden',i===next?'false':'true');
 });
 active=next;
 const p=photos[active];
 counter.textContent=`${String(active+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}   ·   ${describe(p)}`;
 progressFill.style.width=`${(active+1)/photos.length*100}%`;
}
function navigate(delta){show(active+delta);play()}
document.getElementById('prev').addEventListener('click',()=>navigate(-1));
document.getElementById('next').addEventListener('click',()=>navigate(1));
pauseBtn.addEventListener('click',()=>{paused=!paused;updatePlayButton();play()});
document.getElementById('download').addEventListener('click',()=>{
 if(!photos.length)return;
 const a=document.createElement('a');a.href=urls[active];a.download=`snowy-booth-${photos[active].layout||'print'}-${photos[active].createdAt}.png`;document.body.append(a);a.click();a.remove();
});
document.getElementById('delete').addEventListener('click',async()=>{
 if(!photos.length||!confirm(GT.confirmDelete))return;
 try{await PeachyGallery.remove(photos[active].id);photos.splice(active,1);active=Math.min(active,Math.max(photos.length-1,0));render()}
 catch(error){console.warn(error);alert('Could not delete photo.')}
});
stage.addEventListener('touchstart',event=>{touchStart=event.changedTouches[0]?.clientX??null},{passive:true});
stage.addEventListener('touchend',event=>{
 if(touchStart===null||!photos.length)return;
 const distance=(event.changedTouches[0]?.clientX??touchStart)-touchStart;touchStart=null;
 if(Math.abs(distance)>45)navigate(distance<0?1:-1);
},{passive:true});
document.addEventListener('keydown',event=>{
 if(!photos.length||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''))return;
 if(event.key==='ArrowRight')navigate(1);
 if(event.key==='ArrowLeft')navigate(-1);
});
document.addEventListener('visibilitychange',()=>document.hidden?stop():play());
window.addEventListener('pagehide',()=>{stop();releaseUrls()});
window.addEventListener('pageshow',async event=>{if(!event.persisted)return;try{photos=await PeachyGallery.all();render()}catch(error){console.error(error)}});
(async()=>{
 document.getElementById('galleryTitle').firstChild.textContent=GT.title;
 document.getElementById('galleryEyebrow').textContent=GT.eyebrow;
 document.getElementById('galleryIntro').textContent=GT.subtitle;
 document.getElementById('galleryPrivacy').textContent=GT.privacy;
 document.getElementById('galleryBack').lastChild.textContent=' '+GT.back;
 document.getElementById('download').textContent=GT.download;
 document.getElementById('delete').textContent=GT.delete;
 buildSnow();updatePlayButton();
 try{photos=await PeachyGallery.all();render()}
 catch(error){console.warn('Gallery failed:',error);controls.hidden=true;emptyView(GT.saveError)}
})();
