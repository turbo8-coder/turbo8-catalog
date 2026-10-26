const FONT="fusion-pixel-10";
let mode="title",tick=0,stage=0,cam=0,p,foes=[],shots=[],motes=[],rings=[],checkpoint=64,score=0,combo=0,chain=0,quake=0,freeze=0,notice="",noticeTime=0,elapsed=0,boss=null;
let rewardModal=null,healingDrops=[];
let peels=[],coins=[],chests=[],wallet=0,magnet=0,scythe=false,harvest=0,harvestCombo=0,stageWallet=0,stageScore=0,shield=0,boots=false,stageScythe=false,stageBoots=false,checkpointState=null;
function art(key,x,y,flip=false){const a=ART[key];if(!a)return;for(let i=0;i<a.length;i++){let z=a[i];spr(z[0],Math.floor(x+(flip?40-z[1]:z[1])),Math.floor(y+z[2]),1,1,flip,false);}}
function small(key,x,y,flip=false){const a=ART[key];if(!a)return;for(let i=0;i<a.length;i++){let z=a[i];spr(z[0],Math.floor(x+(flip?24-z[1]:z[1])),Math.floor(y+z[2]),1,1,flip,false);}}
function txt(s,x,y,col=6){bprint(s,Math.floor(x),Math.floor(y),col,FONT);}
function center(s,y,col=6){txt(s,(screen_size().width-text_size(s,FONT).width)/2,y,col);}
function say(s){notice=s;noticeTime=100;}
function puff(x,y,col,n=8){for(let i=0;i<n&&motes.length<100;i++)motes.push({x,y,vx:(Math.random()-.5)*4,vy:-Math.random()*3,life:12+Math.random()*12,c:col});}
function loadStage(n,retry=false){
 rewardModal=null;healingDrops=[];
 stage=n;use_map(n);cam=0;quake=0;freeze=0;const l=LEVELS[n];if(!retry){checkpoint=64;stageWallet=wallet;stageScore=score;stageScythe=scythe;stageBoots=boots;checkpointState=null;}else{wallet=stageWallet;score=stageScore;checkpoint=64;}
 p={x:checkpoint,y:200,vx:0,vy:0,face:1,hp:6,inv:40,ground:false,coyote:0,at:0,move:0,buffer:0,land:0,walk:0,jt:0,jumpCut:false,throwReady:false};
 foes=l.enemies.map((e,i)=>({id:i,x:e[0],y:e[1],home:e[0],kind:e[2],hp:(e[2]===2?3:2)+(n===2?1:0),t:i*29,hit:0,dead:0,face:-1}));
 peels=[];coins=[];chests=(n===0?[[272,168,"scythe"],[1236,184,"boots"]]:n===1?[[568,184,"magnet"],[1152,136,"shield"]]:[[728,184,"shield"],[944,136,"magnet"]]).map(q=>({x:q[0],y:q[1],open:false,kind:q[2],reveal:0}));magnet=0;shield=0;boots=stageBoots;scythe=stageScythe;harvest=0;harvestCombo=0;
 chests.push({x:[600,1024,1360][n],y:240,open:false,kind:"health",reveal:0});
 for(let x=80;x<=176;x+=24)coins.push({x,y:218,got:false});
 for(let q of l.platforms)for(let x=q[0]+48;x<q[0]+q[2]-24;x+=64){
  const y=q[1]-22;
  const nearChest=chests.some(c=>Math.abs(x-c.x)<64&&y>c.y-112&&y<c.y+18);
  const nearTerminal=Math.abs(x-l.checkpoint)<45&&y>154;
  if(x>240&&!nearChest&&!nearTerminal)coins.push({x,y,got:false});
 }
 if(n>0){for(let x of (n===1?[920]:[1120,1390]))foes.push({id:foes.length,x,y:240,home:x,kind:n===2?2:0,hp:n===2?3:2,t:31,hit:0,dead:0,face:-1});}
 foes.forEach(e=>{e.slip=0;e.safe=0;});if(n===0){foes[0].x=400;foes[0].home=400;}

 shots=[];motes=[];rings=[];combo=0;chain=0;mode="play";boss=n===2?{x:1800,y:240,hp:30,hit:0,t:0,active:false,dead:0,phase:1,slip:0,face:-1,safe:0,cycle:0,minionId:100,columns:[],summonFlash:0,spawned:0,teleport:0,airborne:false,airTime:0,vy:0,rain:[]}:null; say(l.name);music(n);
 if(retry&&checkpointState){const z=JSON.parse(checkpointState);wallet=z.wallet;score=z.score;scythe=z.scythe;shield=z.shield;boots=z.boots;magnet=z.magnet;foes=z.foes;coins=z.coins;chests=z.chests;healingDrops=z.healingDrops||[];checkpoint=z.x;p.x=z.x;p.y=240;}
 prepareGate(retry);log("STAGE "+(n+1)+" checkpoint="+checkpoint);
}
function _init(){music(3);log("UI fonts "+font_list().join(","));for(const row of [["THE CYBERSPACE FRUIT CAPER",FONT,220],["START ADVENTURE","fusion-pixel-12",150],["MEMORY GARDENS",FONT,180],["One district safer. Keep the fruit flying.",FONT,330],["THREE DISTRICTS RESCUED","fusion-pixel-12",225],["the city\'s finest smoothie chef.",FONT,225],["OVERDRIVE / jump the shockwaves!",FONT,460],["CYBERLEEK / peel trap, then X harvest!",FONT,460]]){const w=text_size(row[0],row[1]).width;log("UI FIT "+w+"/"+row[2]+" "+row[0]);if(w>row[2])throw Error("UI exceeds content area");}const s=screen_size();let longest=0;for(const x of ["Fictional comedy. No real-world claims.","A: throw peel / X: harvest scythe","B: jump / Hold B: higher jump","Slip enemies with A, then harvest with X."])longest=Math.max(longest,text_size(x,FONT).width);log("UI width "+longest+" / "+s.width); }
function hurt(){if(p.inv>0||mode!=="play")return;if(shield>0){shield--;p.inv=40;p.shieldGuard=40;p.shieldFlash=14;p.shieldBreak=shield===0?20:0;contactBurst(p.x+p.face*25,p.y-30,-p.face,true);sfx(shield===0?9:4);log("SHIELD absorbed remaining="+shield);return;}p.hp--;p.inv=55;p.vy=-4;p.vx=-p.face*2;quake=5;puff(p.x,p.y-20,23,12);sfx(3);if(p.hp<=0){mode="dead";quake=0;freeze=0;music(-1);log("DEFEAT stage="+stage+" checkpoint="+checkpoint);}}
function strike(e,damage,dir,breaker=false){if(e.dead||e.hit>0)return;const block=!e.slip;
 if(block){e.hit=6;puff(e.x+e.face*12,e.y-18,31,5);sfx(4);return;}
 e.hp-=damage;e.hit=12;e.x+=dir*8;freeze=2;quake=3;puff(e.x,e.y-17,11,9);sfx(1);if(e.hp<=0){e.dead=24;score+=100;puff(e.x,e.y-15,23,12);sfx(2);}}
function startAttack(){
 // Unlimited peels; the authored throw animation sets the firing cadence.
 p.at=1;
}
function slipEnemy(e){
 if(e.hp<=0||e.slip>0||e.safe>0)return;
 e.slip=100;e.slide=e.face*2.4;e.safe=0;sfx(11);puff(e.x,e.y-5,11,9);
 say("ENEMY DOWN / X TO HARVEST");log("SLIP enemy="+e.id+" hp="+e.hp);
}
function gameUpdate(){
 if(mode==="play"||mode==="title")tick++;if(mode==="title"){if(btnp(4)){beginAdventure();}return;}
 if(mode==="dead"){if(btnp(4)){if(BOSS_START_ENABLED)beginAdventure();else loadStage(stage,true);}if(btnp(5))mode="title";return;}
 if(mode==="clear"){if(btnp(4)){if(stage+1<LEVELS.length)loadStage(stage+1);else mode="win";}return;}
 if(mode==="win"){if(btnp(4)){beginAdventure();}if(btnp(5))mode="title";return;}
 if(freeze>0){freeze--;return;}elapsed++;if(quake>0)quake--;if(noticeTime>0)noticeTime--;if(p.inv>0)p.inv--;if(p.shieldGuard>0)p.shieldGuard--;if(p.shieldFlash>0)p.shieldFlash--;if(p.shieldBreak>0)p.shieldBreak--;if(chain>0)chain--;else combo=0;
 for(let c of chests)if(c.reveal>0&&c.reveal<151)c.reveal++;
 const l=LEVELS[stage];const dir=(btn(1)?1:0)-(btn(0)?1:0);
 const committed=harvest>0;
 p.vx+=((committed&&p.ground?0:dir*3.1)-p.vx)*(committed?.7:.45);
 if(dir&&!committed)p.face=dir;
 if(p.ground)p.coyote=4;else p.coyote--;
 if(btnp(5))p.buffer=5;else if(p.buffer>0)p.buffer--;
 if(p.buffer>0&&(p.coyote>0||(boots&&!p.airJump))){if(!p.ground&&p.coyote<=0){p.airJump=true;log("WING BOOTS double jump");}p.vy=-8.8;p.jt=0;p.jumpCut=false;p.ground=false;p.coyote=0;p.buffer=0;puff(p.x,p.y,10,6);sfx(5);}
 // Releasing B ends this jump's ascent boost; pressing again cannot restore it.
 if(!btn(5))p.jumpCut=true;
 if(p.jumpCut&&p.vy<-3.2)p.vy=-3.2;
 if(scythe&&btn(8)&&harvest===0&&p.at===0){harvest=1;harvestCombo=0;p.swingId=(p.swingId||0)+1;}
 // Consume menu confirmation until A is released once in gameplay.
 if(!btn(4))p.throwReady=true;
 if(p.throwReady&&btn(4)&&p.at===0&&harvest===0)startAttack();
 if(harvest>0){harvest++;if(harvest===7)sfx(10);if(harvest>=9&&harvest<=12){let hit=false;for(let e of foes){if(e.hp>0&&e.harvestStamp!==p.swingId&&Math.abs(e.y-p.y)<46&&(e.x-p.x)*p.face>-8&&(e.x-p.x)*p.face<(harvest<10?46:62)){e.harvestStamp=p.swingId;if(!e.slip){contactBurst(e.x-p.face*12,e.y-30,p.face,true);sfx(4);log("HARVEST BLOCKED / banana peel first");continue;}e.hp=0;dropEnemyCoins(e);e.slip=43;e.dead=24;e.slide=p.face*1.4;e.safe=0;score+=80;contactBurst(e.x,e.y-12,p.face,false);hit=true;log("SCYTHE HIT enemy="+e.id+" hp="+e.hp);}}if(harvest===9&&boss&&(boss.x-p.x)*p.face>-12&&(boss.x-p.x)*p.face<78&&Math.abs(p.y-boss.y)<65)hitBoss(5);if(hit){sfx(1);freeze=2;quake=3;}}if(harvest>24)harvest=0;}
 if(p.at>0){
  p.at++;
  if(p.at===10){
   // Read aim at release. Neutral throws never depend on a previous throw or target.
   const aim=btn(3)?"short":btn(2)?"long":"normal";
   const vx=aim==="short"?.8:aim==="long"?5.2:3.3;
   const vy=aim==="short"?-1.5:aim==="long"?-6.2:-5;
   if(peels.length>=6)peels.shift();
   peels.push({x:p.x+p.face*18,y:p.y-36,vx:p.face*vx,vy,age:0,land:false,life:420});
   sfx(0);log("PEEL "+aim.toUpperCase()+" vx="+vx+" vy="+vy);
  }
  if(p.at>27)p.at=0;
 }
 let wasGround=p.ground;let oldY=p.y;p.x=Math.max(12,Math.min(l.length-16,p.x+p.vx));p.vy=Math.min(10,p.vy+.48);p.y+=p.vy;p.ground=false;
 for(let q of l.platforms){if(p.x+9>q[0]&&p.x-9<q[0]+q[2]&&oldY<=q[1]+1&&p.y>=q[1]&&p.vy>=0){p.y=q[1];p.vy=0;p.ground=true;}}
 if(p.ground)p.airJump=false;
 if(p.ground&&!wasGround){p.land=6;puff(p.x,p.y,20,5);}else if(p.land>0)p.land--;
 if(p.ground&&!harvest&&!p.at){if(Math.abs(p.vx)>.4)p.walk+=Math.abs(p.vx)/8;else p.walk=0;}p.jt++;
 if(p.y>320){p.hp=0;mode="dead";quake=0;freeze=0;music(-1);log("FALL stage="+stage+" checkpoint="+checkpoint);}
 if(p.ground&&Math.abs(p.y-240)<2&&Math.abs(p.x-l.checkpoint)<34&&checkpoint<l.checkpoint){checkpoint=l.checkpoint;p.hp=Math.min(6,p.hp+2);say("CHECKPOINT SAVED / terminal online");sfx(6);checkpointState=JSON.stringify({x:checkpoint,wallet,score,scythe,shield,boots,magnet,foes,coins,chests,healingDrops,stageCollected,stageCoinTotal,gatePaid});log("CHECKPOINT "+stage);showReward("checkpoint");return;}
 updateHealingDrops();
 if(magnet>0)magnet--;
 for(let g of coins){if(g.got)continue;
  if(g.drop&&g.vy!==0){let oy=g.y;g.x+=g.vx;g.vy+=.3;g.y+=g.vy;g.vx*=.96;for(let q of l.platforms)if(g.x>=q[0]&&g.x<=q[0]+q[2]&&oy<=q[1]-14&&g.y>=q[1]-14&&g.vy>0){g.y=q[1]-14;g.vy=0;g.vx=0;break;}if(g.y>310)recoverCoin(g);}
  let dx=p.x-g.x,dy=p.y-23-g.y,dist=Math.sqrt(dx*dx+dy*dy);if(magnet>0&&dist<100&&dist>1){g.x+=dx/dist*3;g.y+=dy/dist*3;}if(dist<18){g.got=true;wallet++;stageCollected++;score+=10;sfx(6);log("COIN wallet="+wallet);}}

 for(let c of chests)if(!c.open&&Math.abs(p.x-c.x)<28&&Math.abs(p.y-c.y)<10&&btnp(2)&&!btn(4)){
  const cost=c.kind==="health"||c.kind==="scythe"?0:c.kind==="magnet"?5:c.kind==="shield"?8:6;
  if(wallet<cost){say("Chest needs "+cost+" TRON coins");continue;}
  if(cost>0&&wallet-cost+stageCoinTotal-stageCollected<gateCost&&!gatePaid){say("KEEP COINS FOR THE LOCKED GATE");continue;}
  wallet-=cost;c.open=true;c.reveal=1;sfx(12);
  if(c.kind==="scythe"){scythe=true;say("HARVEST SCYTHE / X slash, A throw peel");}
  if(c.kind==="magnet"){magnet=900;say("MAGNET / nearby TRON coins fly to you");}
  if(c.kind==="shield"){shield=3;say("SHIELD / absorbs three hits");}
  if(c.kind==="boots"){boots=true;say("WING BOOTS / press B again in the air");}
  if(c.kind==="health"){const before=p.hp;p.hp=Math.min(6,p.hp+2);log("CHEST HEAL "+before+" -> "+p.hp);}
  showReward(c.kind);
  log("TREASURE "+c.kind+" cost="+cost+" wallet="+wallet);
  return;
 }
 for(let i=peels.length-1;i>=0;i--){let r=peels[i];r.age++;r.life--;for(const e of foes)if(e.hp>0&&!e.slip&&e.safe<=0&&Math.abs(e.x-r.x)<21&&r.y>e.y-50&&r.y<e.y+5){slipEnemy(e);r.life=0;break;}if(r.life<=0){peels.splice(i,1);continue;}if(!r.land){let oy=r.y;r.x+=r.vx;r.vy+=.38;r.y+=r.vy;for(let q of l.platforms)if(r.x>q[0]&&r.x<q[0]+q[2]&&oy<=q[1]&&r.y>=q[1]&&r.vy>0){r.y=q[1];r.land=true;log("PEEL LANDED x="+Math.round(r.x));puff(r.x,r.y,11,3);break;}}else{for(let e of foes)if(!e.slip&&e.hp>0&&e.safe<=0&&Math.abs(e.x-r.x)<15&&Math.abs(e.y-r.y)<6){slipEnemy(e);r.life=0;break;}}if(r.land&&boss&&!boss.airborne&&boss.active&&boss.hp>0&&!boss.slip&&boss.safe<=0&&Math.abs(boss.x-r.x)<25&&Math.abs(boss.y-r.y)<6){slipHacker();r.life=0;}if(r.life<=0||r.y>320)peels.splice(i,1);}
 for(let e of foes){
 if(e.hp<=0){
  dropEnemyCoins(e);
  if(e.dead>0){e.dead--;e.slip=e.dead>0?43:0;e.x+=e.slide||0;e.slide=(e.slide||0)*.8;}
  continue;
 }
 e.moving=false;e.t++;if(e.safe>0)e.safe--;
 if(e.slip>0){
  // Living foes recover; defeated foes use the separate terminal death branch.
  e.slip--;
  if(e.slip===0){e.safe=45;e.slide=0;log("ENEMY RECOVERED id="+e.id+" hp="+e.hp);}
  if(e.slip>76){let nx=e.x+e.slide;for(let q of l.platforms)if(Math.abs(q[1]-e.y)<2&&nx>q[0]+24&&nx<q[0]+q[2]-24){e.x=nx;break;}e.slide*=.85;}
  continue;
 }
 e.face=p.x<e.x?-1:1;let d=Math.abs(p.x-e.x);
 if(d<270&&d>(e.kind===1?135:29)&&e.t%100<60){let nx=e.x+e.face*((e.kind===2?.65:.9)+stage*.14);for(let q of l.platforms)if(nx>q[0]+20&&nx<q[0]+q[2]-20&&Math.abs(q[1]-e.y)<2){e.walkDistance=(e.walkDistance||0)+Math.abs(nx-e.x);e.moving=true;e.x=nx;break;}}
 if(e.kind===1&&e.t%100===76&&d<290&&shots.length<30){shots.push({x:e.x+e.face*22,y:e.y-35,vx:e.face*(2.5+stage*.45),vy:0,life:100,seed:true});log("GARDENER seed shot");}
 if(e.kind!==1&&e.t%100>75&&e.t%100<86&&d<32&&Math.abs(p.y-e.y)<27)hurt();
 }
 for(let i=shots.length-1;i>=0;i--){let s=shots[i];s.x+=s.vx;s.y+=s.vy;s.life--;const hit=s.command?Math.abs(s.x-p.x)<s.w/2+9&&s.y+7>p.y-45&&s.y-7<p.y-3:Math.abs(s.x-p.x)<10&&Math.abs(s.y-(p.y-20))<17;
 if(hit){hurt();s.life=0;if(s.command)log("COMMAND CONTACT");}if(s.life<=0)shots.splice(i,1);}
 for(let i=motes.length-1;i>=0;i--){let m=motes[i];m.x+=m.vx;m.y+=m.vy;m.vy+=.12;m.life--;if(m.life<=0)motes.splice(i,1);}
 const cameraTarget=Math.max(0,Math.min(l.length-screen_size().width,p.x-180));
 if(!(boss&&boss.glitch)){
  const delta=cameraTarget-cam;
  cam=Math.abs(delta)<.4?cameraTarget:cam+Math.max(-6,Math.min(6,delta*.22));
 }
 updateBoss();
 if(boss&&boss.glitch)cam=boss.glitch.cam;
 for(let x of l.vents){const a=(tick+Math.floor(x/8))%150;if(a>=85&&a<112&&Math.abs(p.x-x)<16&&p.y>195)hurt();}
 if(stage===2&&p.ground&&p.x>580&&p.x<1000)p.x+=.65;
 updateGate();
 if(tick%120===0)log("PLAY stage="+stage+" x="+Math.round(p.x)+" y="+Math.round(p.y)+" hp="+p.hp+" wallet="+wallet+" enemies="+foes.filter(e=>e.hp>0).length);
}
function heroFrame(){
 if(p.at){if(!p.ground)return p.at<10?"airwind":p.at<16?"airrelease":"airfollow";return p.at<5?"wind":p.at<10?"cock":p.at<15?"release":p.at<21?"follow":"rest";}
 if(p.land)return p.land>3?"land":"recover";
 if(!p.ground)return p.jt<3?"takeoff":p.vy<-2?"rise":p.vy<2?"apex":"fall";
 return Math.abs(p.vx)>.4?"run"+Math.floor(p.walk)%6:"idle"+Math.floor(tick/20)%2;
}

function dropEnemyCoins(e){
 if(e.paid)return;e.paid=true;
 if(e.id%3===0&&healingDrops.length<8){healingDrops.push({x:e.x,y:e.y-18,vy:-2.2,life:900});log("HEAL DROP enemy="+e.id);}
 const count=enemyCoinValue(e);
 for(let i=0;i<count;i++)coins.push({x:e.x+(i-(count-1)/2)*5,y:e.y-25,vx:(i-(count-1)/2)*.85,vy:-3.3-(i%2)*.7,drop:true,homeX:e.home||e.x,homeY:e.y,got:false});
 log("ENEMY COIN DROP id="+e.id+" count="+count);
}

function contactBurst(x,y,dir,blocked){
 const colors=blocked?[21,31,7]:[12,11,16];
 for(let i=0;i<7&&motes.length<100;i++){
  const slope=(i-3)*.31,speed=2+(i%3)*.8;
  motes.push({x,y,vx:dir*speed,vy:slope*speed-1,life:blocked?7:11,c:colors[i%3],spark:true});
 }
}

function showReward(kind){
 rewardModal={kind,ready:false};p.vx=0;p.buffer=0;p.throwReady=false;
 log("REWARD MODAL "+kind);
}
function updateReward(){
 if(!btn(4)&&!btn(5)&&!btn(2))rewardModal.ready=true;
 if(rewardModal.ready&&(btnp(4)||btnp(5)||mouse_btnp(0))){
  log("REWARD CLOSED "+rewardModal.kind);rewardModal=null;p.throwReady=false;p.buffer=0;
 }
}
function updateHealingDrops(){
 for(let i=healingDrops.length-1;i>=0;i--){
  const h=healingDrops[i];h.life--;const old=h.y;h.vy+=.22;h.y+=h.vy;
  for(const q of LEVELS[stage].platforms)if(h.x>=q[0]+6&&h.x<=q[0]+q[2]-6&&old<=q[1]-10&&h.y>=q[1]-10&&h.vy>0){h.y=q[1]-10;h.vy=0;break;}
  if(p.hp<6&&Math.abs(p.x-h.x)<19&&Math.abs(p.y-20-h.y)<28){
   const before=p.hp;p.hp=Math.min(6,p.hp+2);sfx(12);say("+2 HEALTH");log("HEAL PICKUP "+before+" -> "+p.hp);healingDrops.splice(i,1);
  }else if(h.life<=0||h.y>310)healingDrops.splice(i,1);
 }
}
