'use strict';
function surface(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  const c = canvas.getContext('2d');
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, w, h);
  return {c, w, h};
}
function stroke(c, points, color, width = 1) {
  c.beginPath();
  points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
const wave = document.querySelector('#wave'), toggle = document.querySelector('#motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let playing = !reduced.matches, visible = true, phase = 0, frame = 0, previous = 0;
function drawWave() {
  const {c,w,h} = surface(wave);
  for(let x=10;x<w;x+=22) for(let y=8;y<h;y+=22) {
    c.fillStyle='#a3af8f38'; c.fillRect(x,y,1,1);
  }
  const position = (a,b) => {
    const u=a+.25*Math.sin(phase), v=b-.16*Math.cos(phase);
    const peak = Math.exp(-2.3*(u*u+v*v))*(.64+.34*Math.cos(6*u-3*v-phase));
    return [w*(.50+.345*a+.115*b),h*(.66+.20*b-.045*a-.48*peak)];
  };
  for(let i=0;i<=52;i++) {
    const b=i/26-1;
    const points=Array.from({length:81},(_,j)=>position(j/40-1,b));
    stroke(c,points,'rgba(251,174,109,'+(.42+i/120)+')',1);
  }
  for(let j=0;j<=36;j++){
    const a=j/18-1;
    stroke(c,Array.from({length:53},(_,i)=>position(a,i/26-1)),'#f5ab6a53',.8);
  }
}
function animate(now) {
  frame=0;
  if(previous) phase+=Math.min(now-previous,60)*.00045;
  previous=now;drawWave();
  if(playing && visible && !document.hidden) frame=requestAnimationFrame(animate);
}
function refresh(){
  cancelAnimationFrame(frame);previous=0;drawWave();
  toggle.textContent=playing?'Pause motion':'Play motion';
  if(playing && visible && !document.hidden) frame=requestAnimationFrame(animate);
}
toggle.hidden=false;
toggle.addEventListener('click',()=>{playing=!playing;refresh()});
reduced.addEventListener('change',()=>{playing=!reduced.matches;refresh()});
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;refresh()}).observe(wave);
document.addEventListener('visibilitychange',refresh);
function drawProject(canvas){
  const {c,w,h}=surface(canvas);
  if(canvas.dataset.art==='grid'){
    for(let i=0;i<12;i++) stroke(c,[[i*w/11,0],[i*w/11,h]],'#f9bb7e20');
    for(let j=1;j<5;j++) stroke(c,[[0,j*h/5],[w,j*h/5]],'#f9bb7e20');
    for(let k=0;k<3;k++) stroke(c,Array.from({length:160},(_,i)=>{
      const t=i/159;return [w*t,h*(.48+.115*k+.08*Math.sin(t*28+k)-(.43-k*.12)*Math.exp(-1400*(t-.64)**2))];
    }),['#ffba84','#e58e61','#a57861'][k],2);
  }else if(canvas.dataset.art==='route'){
    const pts=[[.08,.68],[.23,.34],[.39,.67],[.53,.29],[.7,.53],[.91,.26],[.18,.92],[.52,.89],[.83,.86]].map(([x,y])=>[x*w,y*h]);
    for(const [a,b] of [[0,1],[1,3],[1,2],[2,3],[3,4],[4,5],[0,6],[6,2],[2,7],[7,4],[7,8],[8,5]])stroke(c,[pts[a],pts[b]],'#74938c',1.3);
    stroke(c,[0,1,3,4,5].map(i=>pts[i]),'#cceab7',3);
    for(const [x,y] of pts){c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fillStyle='#dbefdf';c.fill()}
  }else{
    for(let i=1;i<9;i++){c.beginPath();c.arc(w*.5,h*.84,i*18,Math.PI*1.11,Math.PI*1.89);c.strokeStyle=i%2?'#d5b978':'#907a50';c.stroke()}
    c.beginPath();c.arc(w*.5,h*.84,5,0,Math.PI*2);c.fillStyle='#f7d995';c.fill();
  }
}
const previews=[...document.querySelectorAll('[data-art]')];
function redraw(){refresh();previews.forEach(drawProject)}
new ResizeObserver(redraw).observe(document.body);
redraw();

const track = document.querySelector('#project-track');
const cards = [...track.querySelectorAll('article')];
const prev = document.querySelector('#prev'), next = document.querySelector('#next');
const counter = document.querySelector('#position');
function leftEdge(card) { return card.getBoundingClientRect().left - track.getBoundingClientRect().left; }
function nearestCard() {
  return cards.reduce((best, card, i) => Math.abs(leftEdge(card)) < Math.abs(leftEdge(cards[best])) ? i : best, 0);
}
function syncGallery() {
  const index = nearestCard(), value = (index + 1) + ' / ' + cards.length;
  if(counter.textContent !== value) counter.textContent = value;
  prev.disabled = index === 0;
  next.disabled = index === cards.length - 1;
}
function selectCard(index) {
  const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
  track.scrollBy({left:leftEdge(card), behavior:reduced.matches?'instant':'smooth'});
}
prev.addEventListener('click', () => selectCard(nearestCard()-1));
next.addEventListener('click', () => selectCard(nearestCard()+1));
track.addEventListener('keydown', event => {
  const index = nearestCard();
  const target = {ArrowLeft:index-1, ArrowRight:index+1, Home:0, End:cards.length-1}[event.key];
  if(target !== undefined){event.preventDefault();selectCard(target)}
});
track.addEventListener('scroll', syncGallery, {passive:true});
new ResizeObserver(syncGallery).observe(track);
document.querySelector('.gallery-controls').hidden = false;
syncGallery();
