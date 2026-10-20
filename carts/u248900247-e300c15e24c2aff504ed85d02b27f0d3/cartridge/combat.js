function attackHits(){
 const m=MOVES[hero.act];
 for(let i=0;i<foes.length;i++){const e=foes[i],dx=(e.x-hero.x)*hero.face;
  if(e.hp>0&&e.mode!=="entrance"&&e.last!==hero.hit&&dx>-4&&dx<m.reach&&Math.abs(e.y-hero.y)<17&&hero.z<48){e.last=hero.hit;hitFoe(e,m.damage,hero.face);}
 }
 for(let i=0;i<props.length;i++){const p=props[i],dx=(p.x-hero.x)*hero.face;if(p.hp>0&&p.last!==hero.hit&&dx>-8&&dx<54&&Math.abs(p.y-hero.y)<22&&hero.z<28){p.last=hero.hit;p.hp-=m.damage;burst(p.x,p.y-15,9,7,hero.face);sfx(2);freeze=1;if(p.hp<=0){dropLoot(p.x,p.y,p.drop);score+=25;log("Breakable destroyed: "+p.drop);}}}
}
function dropLoot(x,y,kind){if(loot.length<12)loot.push({x:x,y:y,z:18,vz:3,kind:kind,age:0});}
function hitFoe(e,damage,dir){
 if(e.mode==="entrance")return;
 e.hp-=damage;e.fallDir=dir;e.vx=dir*(damage===2?3.4:1.5);
 const armor=e.kind===2&&(e.mode==="charge"||e.mode==="heavy");
 if(!armor){e.stun=e.kind===2?6:15;e.mode="stun";e.age=0;}
 hero.meter=Math.min(100,hero.meter+10);score+=damage*50;freeze=damage===2?2:1;shake=damage===2?3:1;
 burst(e.x-dir*7,e.y-40,10,6,dir);burst(e.x,e.y-43,7,3,dir);sfx(2);
 if(e.hp<=0){e.dead=42;e.z=5;e.vz=4;e.vx=dir*3.2;score+=100;sfx(4);dropCount++;dropLoot(e.x+dir*12,e.y,dropCount%4===0?"weapon":dropCount%3===0?"health":"gold");log("Enemy defeated; drop "+dropCount);}
}
function hurtHero(dir){if(hero.inv>0||hero.spin>0)return;hero.hp--;hero.inv=38;hero.x+=dir*10;hero.act=-1;hero.chain=0;hero.age=0;shake=4;freeze=2;sfx(5);burst(hero.x,hero.y-35,8,7,dir);}
function updateFoes(){
 let attackers=0;for(let j=0;j<foes.length;j++)if(foes[j].hp>0&&["windup","punch","shootwind","shoot","chargewind","charge","heavywind","heavy"].indexOf(foes[j].mode)>=0)attackers++;
 for(let i=foes.length-1;i>=0;i--){
 const e=foes[i];if(e.muzzle>0)e.muzzle--;
 if(e.hp<=0){e.x=clamp(e.x+e.vx,cam+18,STAGES[stage].length-20);e.vx*=.91;e.z=Math.max(0,e.z+e.vz);e.vz-=.5;if(--e.dead<=0)foes.splice(i,1);continue;}
 if(e.mode==="entrance"){if(++e.age>65){e.mode="approach";e.age=0;}continue;}
 if(e.kind===2&&e.phase===1&&e.hp<=12){e.phase=2;announce("THE DIRECTOR / ENCORE!");burst(e.x,e.y-45,8,12,0);log("Boss phase two");}
 if(hero.spin>0&&hero.spin%8===0&&Math.abs(e.x-hero.x)<60&&Math.abs(e.y-hero.y)<26){hitFoe(e,1,e.x>hero.x?1:-1);continue;}
 if(e.stun>0){e.stun--;e.x+=e.vx;e.vx*=.7;continue;}
 const dx=hero.x-e.x,dy=hero.y-e.y;
 if(e.mode==="approach"||e.mode==="stun")e.face=dx<0?-1:1;
 if(e.cool>0)e.cool--;
 if(e.mode==="windup"){if(++e.age===18){e.mode="punch";e.age=0;sfx(0);}}
 else if(e.mode==="punch"){e.age++;if(e.age===3&&Math.abs(dx)<43&&Math.abs(dy)<15&&hero.z<23)hurtHero(e.face);if(e.age>9){e.mode="recover";e.age=0;}}
 else if(e.mode==="shootwind"){if(++e.age>=30){e.mode="shoot";e.age=0;}}
 else if(e.mode==="shoot"){e.age++;if((e.age===1||e.age===10)&&shots.length<16){shots.push({x:e.x+e.face*27,y:e.y,z:54,vx:e.face*4,life:130,friendly:false});e.muzzle=3;sfx(6);}if(e.age>23){e.mode="recover";e.age=0;}}
 else if(e.mode==="chargewind"){if(++e.age>=28){e.mode="charge";e.age=0;e.tag=false;sfx(3);}}
 else if(e.mode==="charge"){e.age++;e.x+=e.face*(e.phase===2?5.2:4.5);e.walk+=.4;if(!e.tag&&Math.abs(hero.x-e.x)<36&&Math.abs(dy)<17&&hero.z<32){hurtHero(e.face);e.tag=true;}if(e.age>36||e.x<cam+38||e.x>cam+474){e.mode="brake";e.age=0;}}
 else if(e.mode==="brake"){e.age++;e.x+=e.face*Math.max(0,2-e.age*.25);if(e.age>=8){e.mode="recover";e.age=0;}}
 else if(e.mode==="heavywind"){if(++e.age>=25){e.mode="heavy";e.age=0;sfx(0);}}
 else if(e.mode==="heavy"){e.age++;if(e.age===4){burst(e.x+e.face*39,e.y-72,14,6,e.face);shots.push({x:e.x+e.face*39,y:e.y,z:72,vz:-1.2,vx:e.face*4.2,life:70,friendly:false,orb:true});if(e.phase===2)shots.push({x:e.x+e.face*39,y:e.y+19,z:72,vz:-1.2,vx:e.face*3.6,life:70,friendly:false,orb:true});}if(e.age>=11){e.mode="recover";e.age=0;}}
 else if(e.mode==="recover"){if(++e.age>(e.kind===2?36:22)){e.mode="approach";e.cool=16;}}
 else{
 e.mode="approach";const gap=e.kind===1?145:e.kind===2?(e.pattern%2?53:140):37;
 if(Math.abs(dx)>gap){e.x+=e.face*(e.kind===2?1.25:.9);e.walk+=.22;}else if(e.kind===1&&Math.abs(dx)<75){e.x-=e.face*.7;e.walk+=.16;}
 if(Math.abs(dy)>4)e.y+=Math.sign(dy)*(e.kind===2?.8:.5);
 if(e.x>cam+22&&e.x<cam+490&&Math.abs(dx)<gap+15&&Math.abs(dy)<12&&e.cool===0&&attackers<2){e.age=0;e.lock=e.y;attackers++;if(e.kind===2){e.pattern++;e.mode=e.pattern%2?"chargewind":"heavywind";}else e.mode=e.kind===1?"shootwind":"windup";}
 }
 e.x=clamp(e.x,cam+18,Math.min(gate+110,STAGES[stage].length-20));
 }
}
function updateWorld(){
 for(let i=shots.length-1;i>=0;i--){const b=shots[i];b.x+=b.vx;if(b.vz)b.z=Math.max(20,b.z+b.vz);b.life--;
 if(b.friendly){for(let j=0;j<foes.length;j++){const e=foes[j];if(e.hp>0&&e.mode!=="entrance"&&Math.abs(e.x-b.x)<20&&Math.abs(e.y-b.y)<19){hitFoe(e,1,b.vx>0?1:-1);b.life=0;break;}}}
 else if(Math.abs(b.x-hero.x)<12&&Math.abs(b.y-hero.y)<11&&b.z>hero.z+8&&b.z<hero.z+61){hurtHero(b.vx>0?1:-1);b.life=0;}
 if(b.life<=0||b.x<cam-24||b.x>cam+540)shots.splice(i,1);
 }
 for(let i=0;i<props.length;i++){const p=props[i];if(p.hp>0&&hero.spin>0&&Math.abs(p.x-hero.x)<44&&Math.abs(p.y-hero.y)<24){p.hp=0;dropLoot(p.x,p.y,p.drop);burst(p.x,p.y-15,9,8,hero.face);}}
 for(let i=loot.length-1;i>=0;i--){const p=loot[i];p.age++;p.z=Math.max(0,p.z+p.vz);p.vz-=.4;if(p.z===0)p.vz=0;
 if(p.age>13&&Math.abs(hero.x-p.x)<21&&Math.abs(hero.y-p.y)<16&&hero.z<12){if(p.kind==="health"){hero.hp=Math.min(8,hero.hp+3);announce("SODA / HEALTH +3");}else if(p.kind==="weapon"){hero.ammo=8;announce("STAR GLOVES / 8 POWER SHOTS");}else{score+=250;hero.meter=Math.min(100,hero.meter+15);announce("GOLD / +250 / MAYHEM +15");}log("Pickup "+p.kind+" hp="+hero.hp+" ammo="+hero.ammo);sfx(4);burst(p.x,p.y-12,10,6,0);loot.splice(i,1);}
 }
}
function heroFrame(){
 if(hero.spin>0)return 22;
 if(hero.inv>31)return 18;
 if(hero.jump>0)return 8;
 if(hero.z>0)return hero.vz>2?9:hero.vz>-2?10:11;
 if(hero.land>0)return 11;
 if(hero.act===0)return [12,13,14,15,16,17][Math.min(5,Math.floor(hero.age/2.5))];
 if(hero.act===1)return [18,19,20,21,21,17][Math.min(5,Math.floor(hero.age/3))];
 if(hero.act===2)return [18,22,23,23,16,17][Math.min(5,Math.floor(hero.age/3.5))];
 if(hero.moving)return Math.floor(hero.walk)%6;
 return tick%90<45?6:7;
}
function foeFrame(e){if(e.hp<=0)return e.dead>31?8:10;if(e.stun>0)return e.stun>6?8:9;if(e.mode==="shootwind"||e.mode==="shoot")return 11;if(e.mode==="windup")return 5;if(e.mode==="punch")return e.age<5?6:7;if(e.mode==="recover")return 4;return Math.floor(e.walk)%4;}
function bossFrame(e){if(e.hp<=0)return 7;if(e.stun>0)return 7;if(e.mode==="chargewind")return 3;if(e.mode==="charge")return [4,8,9,10][Math.floor(e.age/3)%4];if(e.mode==="brake")return 11;if(e.mode==="heavywind")return 5;if(e.mode==="heavy")return 6;if(e.mode==="recover")return 7;if(e.mode==="entrance")return 0;return Math.abs(hero.x-e.x)>60?1+Math.floor(e.walk)%2:0;}
