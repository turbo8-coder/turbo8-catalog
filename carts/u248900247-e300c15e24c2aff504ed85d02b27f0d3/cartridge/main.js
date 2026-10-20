// Ground depth is independent of airborne height; fixed 30 Hz simulation.
let mode="title",tick=0,stage=0,score=0,cam=0,freeze=0,shake=0,sceneAge=0;
let hero,foes=[],sparks=[],shots=[],props=[],loot=[],wave=0,gate=0,clearTimer=0,serial=0,dropCount=0,notice="",noticeTime=0;
const FONT="fusion-pixel-10";
const STAGES=[{name:"NEON STREETS",length:1050,waves:3},{name:"COCO BALLROOM",length:740,waves:2},{name:"THE DIRECTOR",length:512,waves:1}];
const MOVES=[{length:15,start:5,end:7,reach:48,damage:1},{length:17,start:6,end:9,reach:39,damage:1},{length:21,start:8,end:11,reach:52,damage:2}];
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function text(s,x,y,c){bprint(s,Math.floor(x),Math.floor(y),c,FONT);}
function center(s,y,c){text(s,(screen_size().width-text_size(s,FONT).width)/2,y,c);}
function announce(s){notice=s;noticeTime=75;}
function _init(){srand(71);resetHero();music(0);}
function resetHero(){hero={x:100,y:235,z:0,vz:0,face:1,hp:8,inv:0,walk:0,moving:false,act:-1,age:0,chain:0,wait:0,jbuffer:0,meter:0,spin:0,land:0,jump:0,hit:0,idle:0,ammo:0};}
function startGame(){score=0;stage=0;dropCount=0;resetHero();startStage();}
function startStage(){mode="play";foes=[];shots=[];sparks=[];props=[];loot=[];cam=0;wave=0;gate=0;clearTimer=0;sceneAge=0;hero.x=90;hero.y=235;hero.z=0;hero.vz=0;hero.face=1;hero.act=-1;hero.chain=0;hero.spin=0;hero.inv=0;hero.hp=Math.min(8,hero.hp+3);hero.jump=0;hero.land=0;spawnWave();announce(stage===2?"THE DIRECTOR / ROOFTOP SHOWDOWN":"BREAK CRATES / COLLECT THE SPOILS");}
function spawnWave(){
 wave++;gate=stage===2?360:wave*330;
 if(stage===2){foes.push(makeFoe(395,235,2));props.push({x:175,y:257,hp:2,last:-1,drop:"health",kind:1});}
 else{
  foes.push(makeFoe(gate-15,229,0));
  if(wave>1||stage===1)foes.push(makeFoe(gate+65,253,stage===1?1:0));
  if(stage===1&&wave===2)foes.push(makeFoe(gate+10,215,0));
  props.push({x:gate-155,y:240,hp:2,last:-1,drop:wave===1?"weapon":"health",kind:stage});
  props.push({x:gate+20,y:260,hp:1,last:-1,drop:"gold",kind:stage});
 }
 log("Stage "+(stage+1)+" encounter "+wave+" started");
}
function makeFoe(x,y,kind){const hp=kind===2?24:kind===1?4:4;return {id:++serial,x:x,y:y,z:0,vz:0,vx:0,kind:kind,hp:hp,maxhp:hp,face:-1,fallDir:1,mode:kind===2?"entrance":"approach",age:0,stun:0,dead:0,walk:0,last:-1,cool:kind===2?20:30,pattern:0,lock:0,tag:false,phase:1,muzzle:0};}
function burst(x,y,c,count,dir){for(let i=0;i<count&&sparks.length<48;i++)sparks.push({x:x,y:y,vx:(rnd(3)+1)*dir+rnd(2)-1,vy:rnd(5)-3,life:9+rnd(7),c:c});}
function _update(){
 tick++;
 if(mode==="title"){if(btnp(4))openCreatorNotes();return;}
 if(mode==="creator"){updateCreatorNotes();return;}
 if(mode==="win"||mode==="lose"){if(btnp(4)){if(mode==="lose"){hero.hp=8;hero.meter=0;hero.ammo=0;startStage();}else startGame();}if(btnp(5))mode="title";return;}
 if(mode==="interlude"){if(btnp(4)){stage++;startStage();}return;}
 if(btnp(4))hero.wait=8;
 if(btnp(5))hero.jbuffer=7;
 if(freeze>0){freeze--;return;}
 sceneAge++;if(noticeTime>0)noticeTime--;if(shake>0)shake--;
 if(hero.inv>0)hero.inv--;if(hero.wait>0)hero.wait--;if(hero.jbuffer>0)hero.jbuffer--;
 if(hero.land>0)hero.land--;
 if(hero.jbuffer>0&&hero.z===0&&hero.jump===0){
  hero.jbuffer=0;
  if(btn(4)&&hero.meter>=100){hero.spin=36;hero.meter=0;hero.act=-1;sfx(3);announce("TORNADO!");}
  else{hero.jump=2;hero.land=0;hero.act=-1;sfx(1);}
 }
 if(hero.jump>0){hero.jump--;if(hero.jump===0)hero.vz=8;}
 if(hero.vz!==0||hero.z>0){hero.z+=hero.vz;hero.vz-=.64;if(hero.z<=0){hero.z=0;hero.vz=0;hero.land=2;burst(hero.x,hero.y,5,4,0);}}
 hero.moving=false;
 if(hero.spin>0){hero.spin--;hero.inv=Math.max(hero.inv,2);}
 let dx=(btn(1)?1:0)-(btn(0)?1:0),dy=(btn(3)?1:0)-(btn(2)?1:0);
 if(hero.act>=0&&hero.age>MOVES[hero.act].end+3&&!btn(4)&&(dx||dy))hero.act=-1;
 if(hero.act<0&&hero.jump===0&&hero.land===0){const norm=dx&&dy?.78:1;hero.x+=dx*2.7*norm;hero.y+=dy*1.8*norm;hero.moving=!!(dx||dy);if(dx)hero.face=dx;if(hero.moving)hero.walk+=.34;}
 if(hero.act<0){hero.idle++;if(hero.idle>24)hero.chain=0;}
 if(hero.act<0&&(hero.wait>0||btn(4))&&hero.spin===0&&hero.jump===0&&hero.z===0){hero.act=hero.chain%3;hero.chain++;hero.age=0;hero.wait=0;hero.idle=0;hero.hit=++serial;if(dx)hero.face=dx;sfx(0);}
 if(hero.act>=0){const m=MOVES[hero.act];hero.age++;
  if(hero.age===m.start){hero.x+=hero.face*(hero.act===2?4:2);if(hero.ammo>0&&hero.act===0){hero.ammo--;shots.push({x:hero.x+hero.face*33,y:hero.y,z:42+hero.z,vx:hero.face*6,life:65,friendly:true,hit:hero.hit});burst(hero.x+hero.face*33,hero.y-hero.z-42,10,3,hero.face);}}
  if(hero.age>=m.start&&hero.age<=m.end)attackHits();
  if(hero.age>=m.length){hero.act=-1;hero.age=0;}
 }
 hero.x=clamp(hero.x,cam+28,Math.min(gate+85,STAGES[stage].length-28));hero.y=clamp(hero.y,213,263);
 updateFoes();
 if(hero.z<8&&hero.spin===0)for(let i=0;i<foes.length;i++){const e=foes[i];if(e.hp>0&&e.mode!=="charge"&&Math.abs(hero.y-e.y)<13&&Math.abs(hero.x-e.x)<24)hero.x=e.x+(hero.x>=e.x?24:-24);}
 updateWorld();
 hero.x=clamp(hero.x,cam+36,STAGES[stage].length-36);
 for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.24;if(--p.life<=0)sparks.splice(i,1);}
 let living=0;for(let i=0;i<foes.length;i++)if(foes[i].hp>0)living++;
 if(!living){clearTimer++;if(clearTimer===1){hero.meter=Math.min(100,hero.meter+18);log("Encounter "+wave+" cleared");}if(clearTimer>30&&hero.x>gate-70){clearTimer=0;if(wave<STAGES[stage].waves)spawnWave();else{mode=stage<2?"interlude":"win";shots=[];log(stage<2?"Stage cleared":"Victory");sfx(4);}}}
 const desired=clamp(hero.x-180,0,STAGES[stage].length-screen_size().width);cam+=clamp(desired-cam,-5,5);
 if(hero.hp<=0){mode="lose";log("Defeat");}
}
