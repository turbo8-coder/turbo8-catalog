
let autoEnabled=false,runAssisted=false,aiMask=0;
const aiObstacle={},aiTop=new Array(160).fill(0),aiBottom=new Array(160).fill(0),aiOverlap=new Array(160).fill(false);
function controlPressed(i){return autoEnabled?(aiMask&(1<<i))!==0:btnp(i);}
function controlHeld(i){return autoEnabled?(aiMask&(1<<i))!==0:btn(i);}
function forecastObstacle(c){
 const d=VEHICLES[c.kind];c.age++;
 if(d.shape==='goat')c.speed=c.baseSpeed*(1+.28*Math.sin(c.age*Math.PI/26));
 else if(d.shape==='bear')c.speed=c.baseSpeed*(1+.32*Math.sin(c.age*Math.PI/36-1.1));
 else if(d.shape==='athlete')c.speed=c.baseSpeed*Math.min(1,.34+Math.abs(c.x-24)/100);
 else c.speed=c.baseSpeed;
 if(d.shape==='bear'&&c.returns&&c.turnAge>=0&&c.dir<0){
  c.turnAge++;c.speed=c.turnAge<12?c.baseSpeed*(1-c.turnAge/12):0;
  if(c.turnAge===28){c.dir=1;c.speed=c.baseSpeed*.45;}
 }
 if(d.shape==='bear'&&c.dir>0)c.speed=c.baseSpeed*Math.min(1,.45+(c.turnAge++-28)/16);
 c.x+=c.dir*c.speed;c.travel+=c.speed;
 if(d.shape==='bear'&&c.returns&&!c.outbound&&c.x+d.w<PX-22){
  c.outbound=true;c.turnAge=0;c.warning=58;
 }
 if(c.warning>0)c.warning--;
 if(d.shape==='goat'&&c.hops){
  if(c.hopAge<0&&c.x<PX+165){c.hopAge=0;}
  if(c.hopAge>=0){
   c.hopAge++;
   const t=Math.max(0,Math.min(1,(c.hopAge-5)/28));
   c.bounce=112*t*(1-t);
   if(c.hopAge===6){}
   if(c.hopAge===33){}
  }
 }
 if(d.shape==='athlete'){
  if(!c.outbound&&c.x+d.w<PX-13){c.outbound=true;}
  if(c.dir<0&&c.x<=24){c.x=24;c.dir=1;}
 }
 if(d.shape==='basketball'){
  // Repeating ballistic arcs: 40 ticks, a clear 46px apex, and no visual-only offset.
  const t=c.age%40;c.bounce=.115*t*(40-t);
  if(t===0){}
 }
}

function aiTrajectory(){
 for(const k in car)aiObstacle[k]=car[k];
 const d=VEHICLES[car.kind];let first=-1,end=159;
 for(let i=0;i<160;i++){
  forecastObstacle(aiObstacle);const c=aiObstacle;
  aiOverlap[i]=c.x<PX+8&&c.x+d.w>PX-8;
  let rx=PX-c.x;if(c.dir>0)rx=d.w-1-rx;
  const f=trafficPose(c);
  aiTop[i]=roofAt(d,rx,c)+c.bounce;
  aiBottom[i]=f?f.bottom[Math.max(0,Math.min(f.dw-1,Math.floor(rx)))]+c.bounce:c.bounce;
  if(d.shape==='basketball')aiBottom[i]=c.bounce+d.h-roofAt(d,rx);
  if(aiOverlap[i]&&first<0)first=i;
  if(first>=0&&!aiOverlap[i]){end=i;break;}
 }
 return first<0?-1:end;
}
function aiMargin(delay,second,end,extra=-1){
 let h=lift,v=vy,air=jumpAge>=0,min=999;
 for(let i=0;i<end;i++){
  if(i===delay){v=second?Math.min(7.2,Math.sqrt(2*GRAVITY*Math.max(4,118-h))):10.8;air=true;}
  if(i===extra){v=Math.min(7.2,Math.sqrt(2*GRAVITY*Math.max(4,118-h)));air=true;}
  if(air){h+=v;v-=GRAVITY;if(h>122){h=122;v=Math.min(v,0);}if(h<=0){h=0;air=false;}}
  if(aiOverlap[i]&&h+64>aiBottom[i]+3)min=Math.min(min,h-aiTop[i]+3);
 }
 return min;
}
function aiThink(){
 aiMask=0;if(!AI_PLAY_ENABLED){autoEnabled=false;return;}if(!autoEnabled)return;
 if(mode==='intro'&&uiAge>36){aiMask=16;return;}
 if(mode==='over'&&uiAge>65){aiMask=16;return;}
 if(mode==='win'&&uiAge>150){beginRun(false);uiAge=0;return;}
 if(mode==='upgrade'){
  if(uiAge===20){
   const priorities=['double','siu','flip','focus','shield','hype','glide','heart'];
   let rank=99;for(let i=0;i<offers.length;i++){const r=priorities.indexOf(UPGRADES[offers[i]].id);if(r<rank){rank=r;choice=i;}}
  }
  if(uiAge>65)aiMask=16;return;
 }
 if(mode!=='play'||!car||car.hit||car.passed||stageDone)return;
 if((VEHICLES[car.kind].shape==='bus'||VEHICLES[car.kind].shape==='ducks')){aiBusThink();return;}
 const end=aiTrajectory();if(end<0)return;
 if(jumpAge<0){
  let delay=-1,margin=-999;
  for(let d=0;d<Math.min(65,end);d++){
   const m=aiMargin(d,false,end);
   if(m>margin){margin=m;delay=d;}
  }
  if(delay===0)aiMask|=32;
 }else{
  if(!car.outbound&&owned.double&&!airStep&&jumpAge>3&&aiMargin(-1,false,end)<2&&aiMargin(0,true,end)>aiMargin(-1,false,end)+3)aiMask|=32;
  if(owned.flip&&!flipped&&jumpAge===7)aiMask|=16;
 }
}

let aiBusCar=null,aiBusJump=-1,aiBusSecond=-1;
function aiBusThink(){
 if(aiBusCar!==car){
  aiBusCar=car;const end=aiTrajectory();let margin=-999;
  aiBusJump=-1;aiBusSecond=-1;
  let first=0;while(first<end&&!aiOverlap[first])first++;
  for(let delay=Math.max(0,first-28);delay<Math.max(1,first-2);delay++)for(let extra=18;extra<40;extra++){
   const m=aiMargin(delay,false,end,delay+extra);
   if(m>margin){margin=m;aiBusJump=car.age+delay;aiBusSecond=car.age+delay+extra;}
  }
  console.log('AI LONG OBSTACLE PLAN '+aiBusJump+'/'+aiBusSecond+' margin='+margin.toFixed(1));
 }
 if(car.age===aiBusJump||car.age===aiBusSecond)aiMask|=32;
 if(owned.flip&&jumpAge===7&&!flipped)aiMask|=16;
}
