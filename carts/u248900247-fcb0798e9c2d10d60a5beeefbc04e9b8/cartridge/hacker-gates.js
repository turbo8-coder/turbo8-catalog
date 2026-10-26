// Fixed stage budgets include every placed coin and each enemy's guaranteed payout.
let stageCoinTotal=0,stageCollected=0,gateCost=0,gatePaid=false,gateAge=0;
const HACKER_MAX_HP=30,HACKER_BOT_LIMIT=6;
function enemyCoinValue(e){return e.summoned?2:e.kind===2?5:3;}
function prepareGate(retry){
 const l=LEVELS[stage];
 // Count the original roster, not a checkpoint's already-harvested enemies.
 const extras=stage===1?3:stage===2?10:0;
 stageCoinTotal=coins.length+l.enemies.reduce((n,e)=>n+(e[2]===2?5:3),0)+extras+(stage===2?22:0);
 // A saved checkpoint contains all placed and dropped coins, so retain its fixed budget.
 if(retry&&checkpointState){const z=JSON.parse(checkpointState);stageCollected=z.stageCollected||0;gatePaid=!!z.gatePaid;stageCoinTotal=z.stageCoinTotal||stageCoinTotal;}
 else {stageCollected=0;gatePaid=false;}
 gateCost=Math.ceil(stageCoinTotal*.4);gateAge=gatePaid?45:0;
 // Missing the optional first chest must never strand a weaponless later run.
 if(!scythe&&stage>0&&chests.length)chests[0].kind="scythe";
 log("GATE BUDGET stage="+stage+" total="+stageCoinTotal+" price="+gateCost);
}
function recoverCoin(c){
 const platforms=LEVELS[stage].platforms.filter(q=>q[1]===240);
 let floor=platforms[0],dist=Infinity;
 for(const q of platforms){const d=Math.abs(Math.max(q[0]+20,Math.min(q[0]+q[2]-20,c.homeX||c.x))-(c.homeX||c.x));if(d<dist){dist=d;floor=q;}}
 c.x=Math.max(floor[0]+20,Math.min(floor[0]+floor[2]-20,c.homeX||c.x));c.y=floor[1]-22;c.vx=0;c.vy=0;
}
function updateGate(){
 const l=LEVELS[stage],x=l.length-64;
 // The closed door blocks the full actor silhouette, including airborne approaches.
 const stopX=x-64;
 if((!gatePaid||gateAge<40)&&p.x>stopX){p.x=stopX;p.vx=0;}
 if(!gatePaid&&Math.abs(p.x-x)<70&&p.ground&&btnp(2)&&!btn(4)){
  if(boss&&boss.hp>0){say("ACCESS DENIED / DEFEAT CYBERLEEK");sfx(4);}
  else if(wallet<gateCost){say("GATE NEEDS "+gateCost+" TRON / YOU HAVE "+wallet);sfx(4);}
  else {wallet-=gateCost;gatePaid=true;gateAge=0;sfx(7);say("ACCESS GRANTED / GATE UNLOCKED");log("GATE PAID stage="+stage+" amount="+gateCost+" wallet="+wallet);}
 }
 if(gatePaid&&gateAge<45)gateAge++;
 if(gatePaid&&gateAge>=40&&p.x>x-12){p.x=x-12;p.vx=0;}
 if(gatePaid&&gateAge>=40&&p.x>=x-12&&p.ground){p.x=x-12;p.vx=0;quake=0;freeze=0;mode=stage===2?"win":"clear";music(5);sfx(6);log(stage===2?"VICTORY / FINAL GATE OPEN":"STAGE CLEAR "+stage);}
}
function drawLockedGate(){
 const x=LEVELS[stage].length-64;if(x<cam-70||x>cam+screen_size().width+70)return;
 const t=Math.min(1,gateAge/40),ink=gatePaid?31:23;
 // The transparent ring encloses a live energy field, independent of the scenery.
 ellipsefill(x,159,33,58,"#081632");
 ellipsefill(x,159,28,53,gatePaid?"#07374a":"#1b1240");
 for(let i=0;i<14;i++){
  const yy=108+(i*11+Math.floor(tick*(gatePaid?1.8:.5)))%103;
  const half=Math.floor(28*Math.sqrt(Math.max(0,1-((yy-159)/53)**2)));
  if(half>0)line(x-half,yy,x+half,yy,gatePaid?"#12647b":"#342456");
 }
 // The sealed firewall dissolves outward during authorization.
 if(t<1){
  const reach=Math.floor(26*(1-t));
  for(let i=-2;i<=2;i++){
   const xx=x+Math.round(i*reach/2);
   line(xx,120+Math.abs(i)*4,xx,201-Math.abs(i)*4,"#813cb0");
   const yy=126+(tick+i*17+120)%66;
   rectfill(xx-1,yy,xx+1,yy+3,23);
  }
 }else{
  for(let i=0;i<8;i++){
   const yy=118+(i*19+tick*2)%80,xx=x+Math.floor(Math.sin(i*2.4+tick*.04)*21);
   line(xx,yy,xx,yy+3,31);
  }
 }
 image_region("cyber_portal",0,0,272,362,x-60,80,120,168);
 // Floating segmented orbital reticle identifies the authorization core.
 const cy=158;
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+tick*.018,r=gatePaid?15:12;
  const xx=x+Math.round(Math.cos(a)*r),yy=cy+Math.round(Math.sin(a)*r);
  rectfill(xx-1,yy-1,xx+1,yy+1,ink);
 }
 if(!gatePaid){
  rectfill(x-4,153,x+4,163,0);
  line(x-3,153,x,150,31);line(x,150,x+3,153,31);
  line(x-3,163,x,166,31);line(x,166,x+3,163,31);
  line(x,156,x,160,23);
 }else{
  line(x-5,158,x-1,162,31);line(x-1,162,x+6,153,31);
 }
 const tx=Math.max(cam+68,Math.min(cam+screen_size().width-68,x));
 labelCenter(gatePaid?"LINK ONLINE":"TRANSFER / "+gateCost+" TRON",tx,65,ink);
 if(Math.abs(p.x-x)<110)labelCenter(gatePaid?"ENTER":"UP / AUTHORIZE",tx,49,ink);
}
function slipHacker(){
 if(!boss||boss.hp<=0||boss.slip>0||boss.safe>0||boss.airborne)return;
 boss.slip=76;boss.safe=179;boss.teleport=0;sfx(1);puff(boss.x,boss.y-5,11,12);
 say("ROOT ACCESS OPEN / X TO HARVEST");log("BOSS SLIPPED / HARVEST WINDOW 76 frames");
}
function hitBoss(d){
 if(!boss||!boss.active||boss.hp<=0||boss.hit>0||boss.airborne)return;
 if(!boss.slip){sfx(4);puff(boss.x,boss.y-50,31,5);say("FIREWALL / SLIP HIM WITH A PEEL FIRST");return;}
 boss.hp=Math.max(0,boss.hp-5);boss.slip=0;boss.hit=22;boss.safe=90;boss.t=140;boss.commandWarn=false;
 freeze=3;quake=5;sfx(1);puff(boss.x,boss.y-45,11,16);log("BOSS HARVEST hp="+boss.hp);
 const phase=boss.hp<=10?3:boss.hp<=20?2:1;
 if(phase>boss.phase&&boss.hp>0){
  boss.phase=phase;boss.columns=[];boss.rain=[];boss.glitch=null;shots=[];
  boss.t=0;boss.cycle=0;boss.phaseRest=45;boss.commandWarn=false;
  say(phase===2?"PHASE 2 / CODE RAIN UNLOCKED":"PHASE 3 / GLITCH + BOTNET ONLINE");
  sfx(8);log("BOSS PHASE "+phase+" / RESET HAZARDS / REST 45");
 }
 if(boss.hp<=0){
  boss.dead=90;boss.columns=[];boss.rain=[];boss.glitch=null;shots=[];
  const payout=10+(HACKER_BOT_LIMIT-boss.spawned)*2;
  for(let i=0;i<payout;i++)coins.push({x:boss.x+(i-(payout-1)/2)*6,y:204,vx:(i%5-2)*.5,vy:-3.5,drop:true,homeX:boss.x,homeY:240,got:false});
  score+=2000;music(5);sfx(2);say("CONNECTION TERMINATED / UNLOCK THE FINAL GATE");log("BOSS DEFEATED payout="+payout);
 }
}
function summonBots(count){
 if(!boss||boss.hp<=0)return;
 foes=foes.filter(e=>!e.summoned||e.hp>0||e.slip>0);
 let living=foes.filter(e=>e.summoned&&e.hp>0).length;
 for(let i=0;i<count&&living<3&&boss.spawned<HACKER_BOT_LIMIT;i++,living++){
  const x=Math.max(1590,Math.min(1940,boss.x+(i%2?-130:130)));
  foes.push({id:boss.minionId++,x,y:240,home:x,kind:boss.spawned%2,hp:2,t:0,hit:0,dead:0,face:-1,slip:0,safe:0,summoned:true});boss.spawned++;puff(x,204,31,14);
 }
 boss.summonFlash=40;sfx(8);log("BOTNET SUMMON total="+boss.spawned);
}

const RAIN_CHARS="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz<>[]{}!?/%$#=+*";
const RAIN_INK=["#073016","#095322","#0c7430","#15a442","#2fdc67","#82ffad"];
function matrixRain(){
 // Independent heads, finite fading tails, staggered starts and generous safe lanes.
 boss.rain=[];
 const start=Math.max(1490,Math.min(1700,p.x-175));
 const count=boss.phase===2?6:9,spacing=boss.phase===2?52:36;
 for(let i=0;i<count;i++){
  const length=4+i%4;
  boss.rain.push({x:start+i*spacing,y:-18-(i*47)%120,speed:(boss.phase===2?2.6:3.1)+(i%4)*.45,
   length,chars:Array.from({length},()=>RAIN_CHARS[Math.floor(Math.random()*RAIN_CHARS.length)])});
 }
 say("CODE RAIN / DODGE BETWEEN THE STREAMS");sfx(8);log("CODE RAIN START");
}
function updateBoss(){
 if(!boss)return;
 boss.walking=false;
 if(!boss.active&&p.x>1460){boss.active=true;music(4);say("CYBERLEEK / WATCH THE SKY");log("BOSS ACTIVE");}
 if(!boss.active)return;
 if(boss.hp<=0){if(boss.dead>0)boss.dead--;return;}
 updateSideGlitch();
 if(boss.summonFlash>0)boss.summonFlash--;
 if(boss.hit>0)boss.hit--;if(boss.safe>0)boss.safe--;
 for(let i=boss.rain.length-1;i>=0;i--){
  const r=boss.rain[i];r.y+=r.speed;
  if((tick+i)%5===0)r.chars[(tick+i)%r.length]=RAIN_CHARS[Math.floor(Math.random()*RAIN_CHARS.length)];
  // Only the visible head and bright leading glyphs hurt, never an invisible full-height lane.
  for(let k=0;k<Math.min(3,r.length);k++){
   const y=r.y-k*12;
   if(y>=65&&y<238&&Math.abs(p.x-(r.x+4))<13&&y+8>p.y-45&&y<p.y-3)hurt();
  }
  if(r.y-r.length*12>240)boss.rain.splice(i,1);
 }
 if(boss.slip>0){boss.commandWarn=false;boss.slip--;if(boss.slip===0)log("BOSS SLIP RECOVERED");return;}
 if(boss.phaseRest>0){boss.phaseRest--;boss.commandWarn=false;return;}
 boss.t++;const a=boss.t%220;boss.face=p.x<boss.x?-1:1;
 const rainTurn=boss.phase>=2&&(boss.phase===3||boss.cycle%2===1);
 const fireAt=boss.phase===1?104:rainTurn?190:100;
 const warnAt=fireAt-(boss.phase===1?34:boss.phase===2?28:24);
 boss.commandWarn=!boss.airborne&&a>=warnAt&&a<fireAt;
 boss.jumpWarn=rainTurn&&a>=24&&a<42;
 if(boss.airborne){
  boss.airTime++;
  if(boss.airTime<=18){boss.y+=boss.vy;boss.vy+=.36;}
  else if(boss.airTime<=88){boss.y=169+Math.sin(boss.airTime*.1)*2;}
  else {boss.vy+=.55;boss.y+=boss.vy;}
  if(boss.airTime===18)matrixRain();
  if(boss.y>=240){boss.y=240;boss.vy=0;boss.airborne=false;boss.t=144;boss.safe=0;quake=3;sfx(2);log("BOSS LANDED / VULNERABLE");}
  return;
 }
 if(a<(rainTurn?24:60)&&Math.abs(p.x-boss.x)>100){
  const oldX=boss.x;
  boss.x=Math.max(1610,Math.min(1940,boss.x+boss.face*(boss.phase===1?1.1:1.5)));
  const distance=Math.abs(boss.x-oldX);
  boss.walking=distance>.01;
  boss.walkDistance=(boss.walkDistance||0)+distance;
 }
 if(a===24&&boss.phase===3&&boss.cycle%2===0){startSideGlitch();say("GLITCH WALLS / MOVE TO THE CENTER");}
 if(a===42&&rainTurn){boss.airborne=true;boss.airTime=0;boss.vy=-7.1;boss.slip=0;sfx(5);log("BOSS TAKEOFF / INVULNERABLE");}
 if(a===warnAt){say("ROOT COMMAND / JUMP OVER THE TEXT");sfx(4);}
 if(a===fireAt)fireBossCommand();
 // Only the final phase summons; alternate with glitch cycles to preserve safe space.
 if(a===154&&boss.phase===3&&boss.cycle%2===1&&boss.summonCycle!==boss.cycle){boss.summonCycle=boss.cycle;summonBots(2);}
 if(a===0){boss.cycle++;log("BOSS cycle hp="+boss.hp+" player="+p.hp);}
}
function drawHackerRig(){
 if(!boss||!boss.active||boss.hp<=0)return;
 if(!boss.airborne&&!boss.slip&&boss.commandWarn){
  const y=boss.y-20;
  for(let i=32;i<160;i+=16)line(boss.x+boss.face*i,y,boss.x+boss.face*(i+7),y,23);
  labelCenter("EXECUTE >",boss.x,boss.y-130,12);
 }
 if(boss.slip)labelCenter("ROOT UNLOCKED / X",boss.x,boss.y-135,12);
 
}
const RAIN_FADE=[["#ffffff","#e02d2d","#c12727","#a12020","#811a1a","#611313","#410d0d","#210707"],["#ffffff","#2dc2e0","#27a7c1","#208ba1","#1a7081","#135461","#0d3841","#071d21"],["#ffffff","#e0e03c","#c1c133","#a1a12b","#818122","#61611a","#414111","#212109"],["#ffffff","#2fe04b","#28c140","#21a136","#1b812b","#146120","#0e4116","#07210b"],["#ffffff","#e05ab5","#c14d9c","#a14082","#813468","#61274e","#411a35","#210d1b"],["#ffffff","#e0e0e0","#c1c1c1","#a1a1a1","#818181","#616161","#414141","#212121"],["#ffffff","#2d4be0","#2740c1","#2036a1","#1a2b81","#132061","#0d1641","#070b21"],["#ffffff","#e08a2d","#c17727","#a16320","#814f1a","#613c13","#41280d","#211407"]];
function drawHackEffects(){
 if(!boss||!boss.active||boss.hp<=0)return;
 for(const r of boss.rain)for(let i=r.length-1;i>=0;i--){
  const y=Math.floor(r.y-i*12);if(y<-11||y>=screen_size().height)continue;
  const hue=Math.floor(r.x/4)%RAIN_FADE.length;
  const shade=Math.round(i*7/Math.max(1,r.length-1));
  const ink=RAIN_FADE[hue][shade];
  // Opaque terminal cells turn each stream into a black-backed error overlay.
  rectfill(Math.floor(r.x)-2,y,Math.floor(r.x)+9,y+11,"#000000");
  bprint(r.chars[i],Math.floor(r.x),y+1,ink,"press start 2p");
 }
 if(boss.summonFlash>0)labelCenter("BOTNET CONNECTED",boss.x,87,16);
}

function startSideGlitch(){
 if(boss.glitch)return;
 boss.glitch={age:0,cam:cam,left:cam,right:cam+screen_size().width,width:0,target:76+(boss.phase-1)*16};
 sfx(8);log("GLITCH WARNING");
}
function updateSideGlitch(){
 const g=boss.glitch;if(!g)return;
 g.age++;
 if(g.age>=168){boss.glitch=null;log("GLITCH ENDED");return;}
 // One second of warning, then a gradual incursion and readable retreat.
 const grow=Math.min(1,Math.max(0,(g.age-36)/24));
 const fade=Math.min(1,(168-g.age)/18);
 g.width=Math.floor(g.target*grow*fade);
 if(g.age===37)log("GLITCH ACTIVE");
 cacheGlitchText(g);
 if(!g.width)return;
 let leftWidth=0,rightWidth=0;
 for(let band=Math.max(0,Math.floor((p.y-45)/GLITCH_ROW_HEIGHT));band<=Math.min(Math.ceil(screen_size().height/GLITCH_ROW_HEIGHT)-1,Math.floor(p.y/GLITCH_ROW_HEIGHT));band++){
  leftWidth=Math.max(leftWidth,glitchBandWidth(g,0,band));
  rightWidth=Math.max(rightWidth,glitchBandWidth(g,1,band));
 }
 const lo=g.left+leftWidth+10,hi=g.right-rightWidth-10;
 if(p.x<lo){p.x=lo;hurt();p.vx=Math.max(0,p.vx);}
 if(p.x>hi){p.x=hi;hurt();p.vx=Math.min(0,p.vx);}
}
// 24 evenly spaced 12-pixel rows fill the locked 288-pixel canvas.
const GLITCH_ROW_HEIGHT=12;
const GLITCH_CHARS="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz<>[]{}!?/%$#=+*";
const GLITCH_INK=["#ff3333","#33ddff","#ffff44","#35ff55","#ff66ce","#ffffff","#3355ff","#ff9d33"];
function glitchBandWidth(g,side,band){
 const seed=(band*47+side*71+Math.floor(band/3)*29)%101;
 const drift=Math.sin(g.age*.055+band*1.7+side*2)*.12;
 return Math.max(0,Math.round(g.width*(.62+seed/180+drift)/4)*4);
}
function drawSideGlitch(){
 if(!boss||!boss.glitch||boss.hp<=0)return;
 const g=boss.glitch,H=screen_size().height;
 for(let side=0;side<2;side++){
  const edge=side===0?g.left:g.right;
  if(g.age<=36){
   for(let band=0;band<Math.ceil(H/GLITCH_ROW_HEIGHT);band++){
    const w=Math.round(g.target*(.62+((band*47+side*71+Math.floor(band/3)*29)%101)/180));
    const x=side===0?edge+w:edge-w;
    line(x,band*GLITCH_ROW_HEIGHT,x,band*GLITCH_ROW_HEIGHT+7,tick%12<6?23:31);
   }
   labelCenter("! GLITCH !",side===0?edge+g.target/2:edge-g.target/2,72,23);
   continue;
  }
  for(let band=0;band<Math.ceil(H/GLITCH_ROW_HEIGHT);band++){
   const w=glitchBandWidth(g,side,band);
   if(w<=0)continue;
   const x=side===0?edge:edge-w,y=band*GLITCH_ROW_HEIGHT;
   rectfill(x,y,x+w,Math.min(H-1,y+GLITCH_ROW_HEIGHT-1),"#000000");
  }
  const rows=g.rows?g.rows[side]:[];
  for(const r of rows){
   const w=glitchBandWidth(g,side,Math.floor(r.y/GLITCH_ROW_HEIGHT));
   const cols=Math.floor(w/8);if(cols<1)continue;
   const x=side===0?edge:edge-cols*8;
   bprint(r.text.slice(0,cols),x,r.y+2,r.ink,"press start 2p");
   // Sparse atlas fragments replace terminal cells, like corrupted sprite memory.
   const row=Math.floor(r.y/GLITCH_ROW_HEIGHT),epoch=Math.floor(g.age/12);
   if(cols>=3&&(row+side*2+epoch)%3!==0){
    const col=(row*7+side*11+epoch*3)%Math.max(1,cols-2);
    const bx=x+col*8,by=r.y+2,id=(row*3+epoch+side*5)%16;
    rectfill(bx,by,bx+15,by+7,"#000000");
    spr(id,bx,by,1,1,(epoch+row)%2===0,false);
    spr((id+3)%16,bx+8,by,1,1,false,epoch%3===0);
   }

  }
 }
}
function cacheGlitchText(g){
 const epoch=Math.floor(tick/10);
 if(g.epoch===epoch)return;
 g.epoch=epoch;g.rows=[[],[]];
 const rows=Math.ceil(screen_size().height/GLITCH_ROW_HEIGHT);
 for(let side=0;side<2;side++)for(let row=0;row<rows;row++){
  let text="";
  for(let j=0;j<20;j++){
   const base=(row*197+j*73+row*j*19+side*314)%997;
   const n=(base+(base%5<2?epoch*31:0))%997;
   text+=n%17===0?" ":base%9<2?"0":GLITCH_CHARS[n%GLITCH_CHARS.length];
  }
  g.rows[side].push({y:row*GLITCH_ROW_HEIGHT,text,ink:GLITCH_INK[(row*3+side+Math.floor(row/4))%8]});
 }
}

// These strings are decorative projectile labels, never executed.
const BOSS_COMMANDS=["sudo rm -rf /","sudo reboot","sudo poweroff","sudo kill -9 -1","rm -rf /","mkfs /dev/sda"];
function fireBossCommand(){
 if(shots.length>=30)return;
 const text=BOSS_COMMANDS[(boss.cycle+boss.phase-1)%BOSS_COMMANDS.length];
 const w=text_size(text,"press start 2p").width+8;
 shots.push({x:boss.x+boss.face*24,y:boss.y-20,vx:boss.face*Math.max(boss.phase===1?3.1:boss.phase===2?3.6:4.1,(w+18)/24),vy:0,life:180,command:text,w,h:14});
 sfx(8);log("BOSS COMMAND "+text);
}
function drawBossCommand(s){
 const x=Math.floor(s.x-s.w/2),y=Math.floor(s.y-7);
 rectfill(x,y,x+s.w-1,y+13,"#000000");
 line(x,y+13,x+s.w-1,y+13,23);
 bprint(s.command,x+4,y+3,12,"press start 2p");
}

 // Preserve the cartridge's authored display treatment during temporary corruption.
const GLITCH_FX_BASE={"aberration":0.2,"bloom_on":true,"bloom_radius":1.2,"bloom_strength":1.25,"bloom_threshold":0.5,"color_bleed":0,"color_on":true,"contrast":1,"crt_focus":0,"crt_mask":0,"crt_on":false,"dot_pitch":1,"dot_radius":0.45,"dot_strength":1,"dots_on":true,"effects_on":true,"exposure":1.25,"gameboy_brightness":0.408,"gameboy_four_shades":true,"gameboy_gap":1,"gameboy_glare":0,"gameboy_lcd_square":0.038,"gameboy_matrix":true,"gameboy_on":false,"gameboy_palette":0,"gameboy_shadow":0.439,"glass_scatter":0,"grain":0.005,"grain_on":true,"highlight_softness":0,"line_beam":0,"phosphor_mode":0,"rgb_shift_on":true,"saturation":1.03,"scan_pitch":1,"scan_strength":0.18,"scan_width":0.3,"scanlines_on":false,"vignette_on":true,"vignette_strength":0.3,"warmth":0};
let glitchFxPhase=-1,glitchFxPrevious=null;
function syncGlitchRgb(){
 const g=mode==="play"&&boss&&boss.hp>0?boss.glitch:null;
 const phase=!g?-1:g.age<36?0:g.age<60?1:g.age<84?2:g.age<108?3:g.age<132?4:g.age<150?5:6;
 if(phase===glitchFxPhase)return;
 if(phase<0){
  if(glitchFxPrevious)postfx(glitchFxPrevious.preset,glitchFxPrevious.parameters);
  else postfx(null);
  glitchFxPrevious=null;
  log("GLITCH RGB RESTORED");
 }else{
  if(glitchFxPhase<0)glitchFxPrevious=postfx();
  const base=glitchFxPrevious?glitchFxPrevious.parameters:GLITCH_FX_BASE;
  const params=Object.assign({},base,{effects_on:true,rgb_shift_on:true,aberration:[.45,1.25,2.1,.85,1.8,1.1,.45][phase]});
  const ok=postfx(glitchFxPrevious?glitchFxPrevious.preset:"RETRO DOT",params);
  log("GLITCH RGB "+params.aberration+" accepted="+ok);
 }
 glitchFxPhase=phase;
}
