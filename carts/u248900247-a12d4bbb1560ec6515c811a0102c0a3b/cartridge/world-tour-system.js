// Six short stages. One deterministic traffic lane keeps timing readable.
let PX=190;
const GROUND=222, GRAVITY=.56;
let moveAxis=0,walkDistance=0,playerFacing=1,walkSpeed=0;
function updatePlayerMovement(){
 const axis=(controlHeld(1)?1:0)-(controlHeld(0)?1:0);
 const oldX=PX;
 const canMove=!stageDone&&siuAge===0;
 const target=canMove?axis*(jumpAge>=0?2.2:2.2):0;
 // A short weight transfer avoids an instant full-speed start or sliding stop.
 const acceleration=axis?.8:1.1;
 walkSpeed+=Math.max(-acceleration,Math.min(acceleration,target-walkSpeed));
 if(Math.abs(walkSpeed)<.01)walkSpeed=0;
 if(canMove){
  if(axis)playerFacing=axis;
  const recovery=jumpAge<0&&landAge>1?.5:1;
  PX=Math.max(36,Math.min(screen_size().width-36,PX+walkSpeed*recovery));
 }else walkSpeed=0;
 moveAxis=Math.sign(PX-oldX);
 if(jumpAge<0&&moveAxis&&landAge<=1)walkDistance+=Math.abs(PX-oldX);
}
const VEHICLES=[
 {name:'SUPERCAR',art:'car0',w:136,h:46,speed:6.0,shape:'car'},
 {name:'SEDAN',art:'car1',w:128,h:48,speed:6.15,shape:'car'},
 {name:'PICKUP',art:'car2',w:144,h:58,speed:6.3,shape:'car'},
 {name:'CLASSIC',art:'car3',w:126,h:58,speed:5.6,shape:'car'},
 {name:'TUNER',art:'car4',w:146,h:48,speed:7.1,shape:'car'},
 {name:'DELIVERY',art:'car5',w:108,h:66,speed:6.6,shape:'car'},
 {name:'MEGA FOOTBALL',art:'ball0',w:56,h:54,speed:6.5,shape:'ball'},
 {name:'ALPINE GOAT',art:'goat',w:70,h:60,speed:6.7,shape:'goat'},
 {name:'BROWN BEAR',art:'bear',w:114,h:76,speed:7.2,shape:'bear'},
 {name:'ARGENTINA 10',art:'athlete',w:56,h:64,speed:7.5,shape:'athlete'},
 {name:'BASKETBALL',art:'basketball',w:48,h:48,speed:6.2,shape:'basketball'},
 {name:'GOLDEN HYPERCAR',art:'hypercar',w:180,h:43,speed:7.4,shape:'hypercar'},
 {name:'SANTA EXPRESS',art:'santa',w:196,h:82,speed:8.1,shape:'santa'},
 {name:'CITY EXPRESS',art:'bus',w:304,h:64,speed:7.8,shape:'bus'},
 {name:'DUCK FAMILY',art:'ducks',w:302,h:57,speed:6.0,shape:'ducks'}
];
const STAGES=[
 {name:'OCEAN DRIVE',tag:'Find your rhythm',line:'Five clean jumps. Watch the yellow launch cue.',order:[0,3,1,11,2],boost:.15,gap:24},
 {name:'RUSH HOUR',tag:'Longer rides',line:'Pickups and vans need a little more airtime.',order:[1,2,13,11,5,14,2,5],boost:.65,gap:18},
 {name:'MATCH DAY',tag:'Football takes over',line:'Rolling footballs and bouncing basketballs.',order:[6,11,13,10,14,4,10,6,13,5],boost:1.2,gap:13},
 {name:'BOARDWALK CHAOS',tag:'Expect the unexpected',line:'Goats change pace. Bears build into a charge.',order:[7,11,8,13,6,12,14,10,13,8,4],boost:1.8,gap:9},
 {name:'AFTER HOURS',tag:'Number ten joins the run',line:'Number ten runs past, then comes back. Jump twice.',order:[9,13,11,8,12,6,13,14,10,14,9,4],boost:2.4,gap:6},
 {name:'WORLD TOUR FINAL',tag:'Become a street legend',line:'Every shape. Every rhythm. Make this run count.',order:[11,13,7,9,12,8,13,10,14,9,12,13,8,10,14],boost:3.0,gap:3}
];
const UPGRADES=[
 {id:'double',name:'AIR STEP',tag:'DOUBLE JUMP',lines:["Tap B again in the air.","One extra jump per leap.","Rescue a late takeoff."],color:11},
 {id:'flip',name:'BACKFLIP',tag:'STYLE +100',lines:["Press A in the air.","Clear a ride: +100.","Land to reset."],color:10},
 {id:'siu',name:'SIUUU!',tag:'CELEBRATION',lines:["Perfect landings: SIU!","Celebrate for +200.","Shake the whole street."],color:8},
 {id:'shield',name:'SAFETY NET',tag:'ONE SAVE / STAGE',lines:["Absorb one collision.","Recharges each stage.","Keep the run alive."],color:12},
 {id:'glide',name:'SOFT SOLES',tag:'AIR CONTROL',lines:["Hold B while falling.","Descend more slowly.","Release B to land."],color:11},
 {id:'focus',name:'IN THE ZONE',tag:'PERFECT WINDOW',lines:["Wider perfect window.","Perfect clears: +100.","Find your flow."],color:10},
 {id:'heart',name:'STEADY FEET',tag:'JUMP BUFFER',lines:["Queue your next jump.","Tap B before landing.","Smoother repeat leaps."],color:8},
 {id:'hype',name:'CROWD FAVORITE',tag:'COMBO POWER',lines:["Double combo points.","Clean landings: +25.","Make the crowd roar."],color:4}
];
let mode='title',tick=0,stage=0,runTick=0,score=0,best=0,combo=0,maxCombo=0,perfects=0,total=0;
let lives=3,maxLives=3,owned={},endless=false,car=null,spawnWait=45,sent=0,stageClears=0,stageGoal=4;
let lift=0,vy=0,jumpAge=-1,flipAge=-1,flipped=false,airStep=false,landAge=0,siuAge=0,landGood=false,landPerfect=false;
let hurt=0,shield=0,jumpBuffer=0,shake=0,cheer=0,stageDone=false,offers=[],choice=0,stageStartScore=0,stageStartTotal=0;
let stageStartPerfects=0,stageStartMaxCombo=0,attempt=1;
let toast='',toastTime=0,toastColor=10,lastGrade='',gradeTime=0,notice='',stagePerfects=0;
let parts=[],partCount=0,impactAge=0,impactPower=1;
function _init(){
 const saved=storage_get(HIGH_SCORE_KEY,0);
 best=Number.isSafeInteger(saved)&&saved>=0?saved:0;
 console.log('HI SCORE LOADED '+best);
 use_map(0);music(0);uiPrepare();
 for(let i=0;i<64;i++)parts.push({x:0,y:0,vx:0,vy:0,t:0,c:7,life:0,kind:0,seed:0});
 console.log('CAR HOP WORLD TOUR: B jump; unlock A flip, air step and SIU.');
}
function pop(s,c=10){toast=s;toastTime=44;toastColor=c;}
function burst(x,y,n,c,power=1){
 const kind=c===7?0:c===10?1:c===11?2:3;
 n=Math.min(n,kind===0?12:18);
 for(let i=0;i<n&&partCount<64;i++){
  let p=parts[partCount++],side=i%2?1:-1;
  p.kind=kind;p.seed=i;p.x=x+side*(5+i%5*2);p.y=y-(kind===1?i%4*2:0);
  p.vx=side*(.65+i%6*.32)*power;p.vy=-(.6+i%5*.33)*power;
  p.life=16+i%7;p.t=p.life;p.c=c;
 }
}
function updateScenery(){
 if(shake>0)shake--;if(cheer>0)cheer--;if(impactAge>0)impactAge--;
 for(let i=partCount-1;i>=0;i--){
  let p=parts[i];p.x+=p.vx;p.y+=p.vy;p.vx*=p.kind===0?.96:.99;p.vy+=p.kind===0?.045:.12;
  if(--p.t<=0){let q=parts[--partCount];parts[partCount]=p;parts[i]=q;}
 }
}
function beginRun(infinite){
 runAssisted=autoEnabled;endless=infinite;stage=0;score=0;combo=0;maxCombo=0;total=0;perfects=0;lives=3;maxLives=3;owned={};
 if(infinite){owned.double=true;owned.flip=true;}
 // SIU is always earned through its upgrade, including Endless Lab.
 stageStartScore=0;stageStartTotal=0;stageStartPerfects=0;stageStartMaxCombo=0;attempt=1;prepareStage();mode='intro';console.log('NEW RUN endless='+endless+' siuUnlocked='+(owned.siu===true));
}
function prepareStage(){
 PX=190;moveAxis=0;walkDistance=0;playerFacing=1;walkSpeed=0;
 car=null;sent=0;stageClears=0;stagePerfects=0;stageGoal=STAGES[stage].order.length;spawnWait=50;runTick=0;
 lift=0;vy=0;jumpAge=-1;flipAge=-1;flipped=false;airStep=false;landAge=0;siuAge=0;hurt=0;jumpBuffer=0;stageDone=false;partCount=0;impactAge=0;
 landGood=false;landPerfect=false;shield=owned.shield?1:0;toast='';toastTime=0;gradeTime=0;mode='intro';
}
function enterStage(){mode='play';music(stage>=3?2:1);pop(stage===0&&!endless?'B TO JUMP':'LET\'S GO!',7);console.log('STAGE '+(stage+1)+' '+STAGES[stage].name);}
function stageFinish(){
 cheer=90;sfx(7);
 if(!endless&&stage===5){mode='win';music(3);burst(256,90,48,10,1.5);console.log('WORLD TOUR COMPLETE score='+score+' total='+total);return;}
 offers=[];let preference=stage===0?[1,0,3]:stage===1?[2,0,4]:stage===2?[0,4,5]:stage===3?[3,6,7]:[2,5,7];
 for(let id of preference)if(!owned[UPGRADES[id].id])offers.push(id);
 for(let i=0;i<UPGRADES.length&&offers.length<3;i++)if(!owned[UPGRADES[i].id]&&offers.indexOf(i)<0)offers.push(i);
 if(offers.length===0){lives=Math.min(maxLives,lives+1);stage=(stage+1)%6;stageStartScore=score;stageStartTotal=total;stageStartPerfects=perfects;stageStartMaxCombo=maxCombo;attempt=1;prepareStage();return;}
 offers=offers.slice(0,3);choice=0;mode='upgrade';music(0);console.log('STAGE CLEAR '+(stage+1)+' upgrades='+offers.map(i=>UPGRADES[i].id).join(','));
}
function takeUpgrade(){
 const u=UPGRADES[offers[choice]];owned[u.id]=true;
 lives=maxLives;
 sfx(1);console.log('UPGRADE '+u.id);stage=(stage+1)%6;stageStartScore=score;stageStartTotal=total;stageStartPerfects=perfects;stageStartMaxCombo=maxCombo;attempt=1;combo=0;prepareStage();
}
function retryStage(){
 attempt++;lives=maxLives;score=stageStartScore;total=stageStartTotal;perfects=stageStartPerfects;maxCombo=stageStartMaxCombo;combo=0;prepareStage();console.log('RETRY STAGE '+(stage+1)+' upgrades retained');
}
function nextType(){let a=STAGES[stage].order,k=a[sent%a.length];return !owned.double?(k===13?2:k===14?0:k):k;}
function spawnCar(){
 let k=nextType(),d=VEHICLES[k];
 car={kind:k,x:546,travel:0,age:0,dir:-1,bounce:0,outbound:false,speed:d.speed+STAGES[stage].boost+(stage?[-.35,.65,-.15,.9,0][sent%5]*stage/5:0)+(endless?Math.min(1.5,total*.018):0),hit:false,passed:false,perfect:false,flip:false,flipAwarded:false};
 if(d.shape==='santa'){car.x=-d.w-34;car.dir=1;}
 if(d.shape==='bus'){car.speed=7.8;pop('LONG BUS / B THEN B IN AIR',10);sfx(6);}
 if(d.shape==='ducks'){car.speed=6.0;pop('DUCK FAMILY / B THEN B AGAIN',10);sfx(6);}
 car.baseSpeed=car.speed;
 car.hops=d.shape==='goat'&&rnd()<.45;
 car.returns=d.shape==='athlete'||(d.shape==='bear'&&rnd()<.4);
 car.hopAge=-1;car.turnAge=-1;car.warning=0;
 if(car.hops){pop('GOAT MAY LEAP!',10);console.log('GOAT VARIANT jump');}
 if(d.shape==='bear')console.log('BEAR VARIANT '+(car.returns?'return':'straight'));
 if(d.shape==='santa'){pop('LEFT: SANTA EXPRESS!',10);sfx(7);}
 sent++;if(k<6||k===11)sfx(5);console.log('SPAWN '+k+' tick='+runTick+' speed='+car.speed.toFixed(2));
}
// Distance-driven gait keeps paws and feet in step with the changing pace.
function moveObstacle(c){
 const d=VEHICLES[c.kind];c.age++;
 if(d.shape==='goat')c.speed=c.baseSpeed*(1+.28*Math.sin(c.age*Math.PI/26));
 else if(d.shape==='bear')c.speed=c.baseSpeed*(1+.32*Math.sin(c.age*Math.PI/36-1.1));
 else if(d.shape==='athlete')c.speed=c.baseSpeed*Math.min(1,.34+Math.abs(c.x-24)/100);
 else c.speed=c.baseSpeed;
 if(d.shape==='bear'&&c.returns&&c.turnAge>=0&&c.dir<0){
  c.turnAge++;c.speed=c.turnAge<12?c.baseSpeed*(1-c.turnAge/12):0;
  if(c.turnAge===28){c.dir=1;c.speed=c.baseSpeed*.45;console.log('BEAR TURN tick='+runTick);}
 }
 if(d.shape==='bear'&&c.dir>0)c.speed=c.baseSpeed*Math.min(1,.45+(c.turnAge++-28)/16);
 c.x+=c.dir*c.speed;c.travel+=c.speed;
 if(d.shape==='bear'&&c.returns&&!c.outbound&&c.x+d.w<PX-22){
  c.outbound=true;c.turnAge=0;c.warning=58;pop('BEAR COMING BACK!',8);sfx(6);console.log('BEAR OUTBOUND CLEAR tick='+runTick);
 }
 if(c.warning>0)c.warning--;
 if(d.shape==='goat'&&c.hops){
  if(c.hopAge<0&&c.x<PX+165){c.hopAge=0;pop('GOAT LEAP!',10);}
  if(c.hopAge>=0){
   c.hopAge++;
   const t=Math.max(0,Math.min(1,(c.hopAge-5)/28));
   c.bounce=112*t*(1-t);
   if(c.hopAge===6){burst(c.x+d.w/2,GROUND,6,7);sfx(0);console.log('GOAT TAKEOFF tick='+runTick);}
   if(c.hopAge===33){burst(c.x+d.w/2,GROUND,8,7);sfx(4);console.log('GOAT LAND tick='+runTick);}
  }
 }
 if(d.shape==='athlete'){
  if(!c.outbound&&c.x+d.w<PX-13){c.outbound=true;pop('COMING BACK!',10);console.log('RUNNER OUTBOUND CLEAR tick='+runTick);}
  if(c.dir<0&&c.x<=24){c.x=24;c.dir=1;console.log('RUNNER TURN tick='+runTick);}
 }
 if(d.shape==='basketball'){
  // Repeating ballistic arcs: 40 ticks, a clear 46px apex, and no visual-only offset.
  const t=c.age%40;c.bounce=.115*t*(40-t);
  if(t===0){sfx(11);burst(c.x+d.w/2,GROUND,4,7);console.log('BASKETBALL BOUNCE tick='+runTick);}
 }
}
function obstacleCleared(c,d){return c.returns||c.dir>0?c.dir>0&&c.x>PX+13:c.x+d.w<PX-13;}
function launch(second){
 const continuingFlip=second&&flipAge>=0&&flipAge<18,previousFlip=flipAge;
 jumpAge=0;vy=second?Math.min(7.2,Math.sqrt(2*GRAVITY*Math.max(4,118-lift))):10.8;flipAge=-1;flipped=false;siuAge=0;landAge=0;jumpBuffer=0;
 if(continuingFlip){flipAge=previousFlip;flipped=true;}
 if(second){airStep=true;burst(PX,GROUND-lift,12,11);sfx(10);pop('AIR STEP',11);}else{airStep=false;landGood=false;landPerfect=false;sfx(0);}
 console.log((second?'AIR STEP':'JUMP')+' tick='+runTick+' x='+(car?car.x.toFixed(1):'-'));
}
function actorName(){
 if(owned.siu===true&&siuAge>0)return siuAge>5?'siu2':'actor14';
 if(jumpAge<0){if(moveAxis&&landAge<=1)return 'actor0';if(landAge>3)return 'actor13';if(landAge>0)return 'actor1';if(car&&!car.passed&&car.x>PX&&car.x<PX+140)return car.x<PX+95?'actor2':'actor1';return 'actor0';}
 if(owned.siu&&((landGood&&landPerfect)||(car&&car.perfect&&!car.hit))&&vy<0&&lift<70&&(flipAge<0||flipAge>=18))return lift>43?'siu0':lift>17?'siu1':'siu2';
 if(flipAge>=0&&flipAge<18)return FLIP_ART[Math.min(5,Math.floor(flipAge/3))];
 if(jumpAge<2)return 'actor3';if(jumpAge<6)return 'actor4';if(vy>1.1)return 'actor5';if(vy>-1.3)return 'actor6';return lift>45?'actor16':'actor7';
}
const FLIP_ART=['actor8','actor9','actor10','actor11','actor12','actor7'];
function roofAt(d,rx,c=null){
 if(d.shape==='ducks')return duckRoof(c,rx);
 if(d.shape==='bus')return rx<8?48:rx<16?58:rx>d.w-9?58:64;
 const frame=c?trafficPose(c):null;
 if(frame)return frame.roof[Math.max(0,Math.min(frame.dw-1,Math.floor(rx)))];
 if(d.shape==='car')return FINE_CARS[d.art].roof[Math.max(0,Math.min(d.w-1,Math.floor(rx)))];
 if(d.shape==='ball'||d.shape==='basketball'){let r=d.w/2,dx=rx-r;return r+Math.sqrt(Math.max(0,r*r-dx*dx))-3;}
 if(FINE_ACTORS[d.shape])return FINE_ACTORS[d.shape].roof[Math.max(0,Math.min(d.w-1,Math.floor(rx)))];
 if(d.shape==='goat')return rx<14?34:rx<34?51:rx<70?38:25;
 if(d.shape==='bear')return rx<19?39:rx<46?55:rx<83?48:27;
 if(d.shape==='athlete')return rx<10||rx>38?25:rx<17?46:59;
 return d.h;
}
function hit(){
 if(shield){shield=0;car.hit=true;pop('SHIELD SAVE',12);sfx(3);burst(PX,GROUND-lift-20,24,12);hurt=10;console.log('SHIELD BLOCK');return;}
 car.hit=true;lives--;combo=0;hurt=24;shake=9;landGood=false;pop(jumpAge>=0&&vy<0?'TOO EARLY':'TOO LATE',8);sfx(2);burst(PX,GROUND-lift-12,18,8);
 console.log('HIT hearts='+lives+' tick='+runTick);
 {mode='over';music(0);console.log('GAME OVER stage='+(stage+1));}
}
function gameUpdate(){
 tick++;updateScenery();if(toastTime>0)toastTime--;if(gradeTime>0)gradeTime--;
 if(mode==='title'){if(controlPressed(4))beginRun(false);else if(controlPressed(5))beginRun(true);return;}
 if(mode==='intro'){if(controlPressed(4))enterStage();else if(controlPressed(5))mode='title';return;}
 if(mode==='upgrade'){
  if(controlPressed(0)){choice=(choice+offers.length-1)%offers.length;sfx(6);}
  if(controlPressed(1)){choice=(choice+1)%offers.length;sfx(6);}
  if(controlPressed(4))takeUpgrade();return;
 }
 if(mode==='over'){if(controlPressed(4))retryStage();else if(controlPressed(5))mode='title';return;}
 if(mode==='win'){if(controlPressed(4))beginRun(true);else if(controlPressed(5))mode='title';return;}
 runTick++;if(hurt>0)hurt--;
 updatePlayerMovement();
 if(controlPressed(5))jumpBuffer=owned.heart?7:4;else if(jumpBuffer>0)jumpBuffer--;
 if(jumpBuffer&&jumpAge<0&&!stageDone)launch(false);
 else if(controlPressed(5)&&jumpAge>3&&owned.double&&!airStep&&!stageDone)launch(true);
 if(jumpAge>=0){
  jumpAge++;lift+=vy;vy-=GRAVITY;
  if(lift>122){lift=122;vy=Math.min(vy,0);}
  if(owned.glide&&controlHeld(5)&&vy<0)vy=Math.max(vy,-3.4);
  if(controlPressed(4)&&owned.flip&&!flipped&&lift>24){
   let remaining=(vy+Math.sqrt(vy*vy+2*GRAVITY*lift))/GRAVITY;
   if(remaining>=18){flipped=true;flipAge=0;sfx(3);}
   else pop('FLIP EARLIER',6);
  }
  if(flipAge>=0){
   flipAge++;
   if(flipAge===18&&car&&!car.hit){
    car.flip=true;
    if(car.passed&&!car.flipAwarded){car.flipAwarded=true;score+=100;lastGrade='FLIP +100';gradeTime=35;sfx(1);}
   }
  }
  if(lift<=0){
   lift=0;jumpAge=-1;flipAge=-1;landAge=6;shake=10;impactAge=14;impactPower=1;burst(PX,GROUND,10,7);sfx(4);
   if(landGood){cheer=32;sfx(9);if(owned.hype){score+=25;burst(PX,GROUND-8,10,10);}
    if(owned.siu===true&&landPerfect){siuAge=32;shake=12;cheer=65;impactAge=21;impactPower=1.6;score+=200;pop('SIUUU!  +200',10);burst(PX,GROUND,24,10,1.5);sfx(8);console.log('SIU LANDING score='+score);}
   }
   console.log('LAND siuUnlocked='+(owned.siu===true)+' celebration='+siuAge);
  }
 }else{if(landAge>0)landAge--;if(siuAge>0)siuAge--;}
 if(car){
  let d=VEHICLES[car.kind];moveObstacle(car);
  let near=Math.abs(car.x+d.w/2-PX);
  if(near<car.speed*(owned.focus?3:1.4)&&lift>(owned.focus?64:82))car.perfect=true;
  let effectiveLift=lift+60-ART_BOTTOM[actorName()];
  let rx=PX-car.x;if(car.dir>0)rx=d.w-1-rx;
  let frame=trafficPose(car);
  let top=roofAt(d,rx,car)+car.bounce,bottom=car.bounce;
  if(frame)bottom=frame.bottom[Math.max(0,Math.min(frame.dw-1,Math.floor(rx)))]+car.bounce;
  if(d.shape==='basketball')bottom=car.bounce+d.h-roofAt(d,rx);
  if(!car.hit&&car.x<PX+8&&car.x+d.w>PX-8&&effectiveLift<top-3&&lift+64>bottom+3)hit();
  if(mode!=='play')return;
  if(!car.passed&&obstacleCleared(car,d)){
   car.passed=true;stageClears++;total++;
   if(!car.hit){
    combo++;maxCombo=Math.max(maxCombo,combo);let award=100+Math.min(combo,20)*(owned.hype?30:15)+(car.perfect?(owned.focus?100:50):0)+(car.flip?100:0);
    score+=award;if(car.flip)car.flipAwarded=true;if(car.perfect){perfects++;stagePerfects++;}landGood=true;landPerfect=car.perfect;
    lastGrade=car.flip?'FLIP +100':car.perfect?'PERFECT':'CLEAN';gradeTime=35;cheer=30;sfx(1);burst(PX,GROUND-lift-30,10,10);
    console.log('CLEAR '+stageClears+'/'+stageGoal+' score='+score);
   }
   if(stageClears>=stageGoal)stageDone=true;
  }
  if((car.dir<0&&!car.returns&&car.x+d.w<-16)||(car.dir>0&&car.x>screen_size().width+32)){car=null;spawnWait=STAGES[stage].gap+(stage?[0,7,2,11,0][sent%5]:0);}
 }else if(!stageDone&&--spawnWait<=0)spawnCar();
 if(stageDone&&jumpAge<0&&landAge===0&&siuAge===0)stageFinish();
}

const HIGH_SCORE_KEY='hiscore';
let hiPending=false,hiError=false,hiDirty=false,hiDelay=0,hiWriting=0;
function updateHighScore(){
 if(!runAssisted&&score>best){best=score;hiDirty=true;hiDelay=6;hiError=false;}
 if(hiDelay>0)hiDelay--;
 if(hiPending){
  const status=storage_status();
  if(!status.pending){
   hiPending=false;hiError=!!status.error;
   console.log(hiError?'HI SCORE SAVE FAILED '+status.error:'HI SCORE SAVED '+hiWriting);
  }
 }
 // Combine clear, flip and landing bonuses; keep disk work outside active jumps.
 const safe=mode!=='play'||(jumpAge<0&&siuAge===0&&landAge===0&&(!car||car.passed));
 if(hiDirty&&!hiPending&&safe&&(hiDelay===0||mode!=='play')){
  hiDirty=false;hiWriting=best;
  if(storage_set(HIGH_SCORE_KEY,hiWriting))hiPending=true;
  else {hiError=true;console.log('HI SCORE SAVE FAILED');}
 }
}
