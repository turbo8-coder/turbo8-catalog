function pose(tiles,x,y,w,flip){for(let i=0;i<tiles.length;i++){const t=tiles[i];spr(t[0],Math.floor(x+(flip?w-8-t[1]:t[1])),Math.floor(y+t[2]),1,1,flip,false);}}
function heroArt(frame,x,y,flip){pose(HERO_POSES[frame],x-44,y-76,88,flip);}
function mobArt(frame,x,y,flip){pose(MOB_POSES[frame],x-44,y-78,88,flip);}
function bossArt(frame,x,y,flip){pose(BOSS_POSES[frame],x-52,y-92,104,flip);}
function star(x,y,c){line(x-4,y,x+4,y,c);line(x,y-4,x,y+4,c);rectfill(x-1,y-1,x+1,y+1,7);}
function propArt(p){const x=Math.floor(p.x),y=Math.floor(p.y);
 if(p.hp<=0){rectfill(x-13,y-3,x+11,y,4);line(x-10,y-6,x-4,y-2,9);line(x+4,y-4,x+14,y-7,9);return;}
 const a=PROP_POSES[p.kind===0?0:1];ellipsefill(x,y+1,19,4,1);pose(a.tiles,x-a.w/2,y-a.h,a.w,false);
 if(p.hp===1){line(x-2,y-24,x+2,y-17,0);line(x+2,y-17,x-3,y-11,0);}
}
function lootArt(p){const x=Math.floor(p.x),y=Math.floor(p.y-p.z-4+(p.z===0?Math.sin(tick*.13)*2:0));ellipsefill(p.x,p.y,9,2,1);
 if(p.kind==="health"||p.kind==="weapon"){const a=PROP_POSES[p.kind==="health"?2:3];pose(a.tiles,x-a.w/2,y-a.h,a.w,false);}
 else{rectfill(x-6,y-10,x+6,y-1,9);rectfill(x-5,y-12,x+4,y-3,10);line(x-4,y-11,x+3,y-11,7);line(x+4,y-9,x+4,y-4,4);}
 if(tick%25<8)star(x+10,y-16,10);
}
function scene(){
 cls(0);const offset=Math.floor(cam);
 for(let i=Math.floor(offset/512);i<=Math.floor((offset+512)/512);i++){if(stage===0)image_region("street",0,0,1672,941,i*512-offset,0,512,288);else image_region("venues",0,(stage-1)*665,1182,665,i*512-offset,0,512,288);}
 camera(offset+(shake?Math.floor(rnd(3))-1:0),0);
 const order=foes.slice();for(let i=0;i<props.length;i++)order.push(props[i]);order.push(hero);order.sort(function(a,b){return a.y-b.y;});
 for(let i=0;i<order.length;i++){const a=order[i];
 if(a===hero){ellipsefill(hero.x,hero.y,17,4,1);if(hero.spin>0){const f=Math.floor(hero.spin/2)%4;for(let row=0;row<8;row++)sspr(row*64,f*8,64,8,hero.x-32,hero.y-62+row*8,64,8);}else if(hero.inv%6<4)heroArt(heroFrame(),hero.x,hero.y-hero.z,hero.face<0);}
 else if(a.drop!==undefined)propArt(a);
 else{ellipsefill(a.x,a.y,a.kind===2?23:15,4,1);
 if(a.hp>0||a.dead>12||tick%4<2){if(a.kind===2)bossArt(bossFrame(a),a.x,a.y-a.z,a.face>0);else{const f=foeFrame(a);mobArt(f,a.x,a.y-a.z,a.hp<=0?(f===10?a.fallDir>0:a.fallDir<0):a.face>0);}}
 if(a.hp>0&&a.stun===0&&(a.mode==="windup"||a.mode==="shootwind"||a.mode==="chargewind"||a.mode==="heavywind")){
  const label=a.mode==="chargewind"?"RUSH":a.mode==="heavywind"?"MAGIC":a.mode==="shootwind"?"FIRE":"!";
  text(label,a.x-text_size(label,FONT).width/2,a.y-(a.kind===2?110:88),10);
  if(a.mode==="chargewind"||a.mode==="shootwind")for(let k=0;k<8;k++)line(a.x+a.face*k*23,a.y+3,a.x+a.face*(k*23+11),a.y+3,a.mode==="chargewind"?14:9);
 }
 if(a.muzzle>0){const mx=a.x+a.face*29,my=a.y-54;line(mx,my,mx+a.face*7,my,10);line(mx+a.face*3,my-3,mx+a.face*3,my+3,7);}
 if(a.kind!==2&&a.hp<a.maxhp&&a.hp>0){rectfill(a.x-12,a.y-79,a.x+12,a.y-77,0);rectfill(a.x-12,a.y-79,a.x-12+24*a.hp/a.maxhp,a.y-77,8);}
 }}
 for(let i=0;i<loot.length;i++)lootArt(loot[i]);
 for(let i=0;i<shots.length;i++){const b=shots[i],y=b.y-b.z;if(b.friendly)star(b.x,y,10);else if(b.orb){circfill(b.x,y,4,2);star(b.x,y,14);}else{line(b.x-b.vx,y,b.x,y,9);rectfill(b.x-2,y-1,b.x+2,y+1,10);pset(b.x,y,7);}}
 for(let i=0;i<sparks.length;i++){const p=sparks[i];rectfill(p.x,p.y,p.x+2,p.y+1,p.c);}camera(0,0);
}
function deco(x,y,w,h){rectfill(x+3,y,x+w-4,y+h-1,0);rectfill(x,y+3,x+w-1,y+h-4,0);line(x+4,y,x+w-5,y,9);line(x+4,y+h-1,x+w-5,y+h-1,4);line(x,y+4,x,y+h-5,4);line(x+w-1,y+4,x+w-1,y+h-5,4);pset(x+2,y+2,10);pset(x+w-3,y+2,10);}
function hud(){
 deco(8,7,155,40);clip(12,9,30,29);heroArt(6,25,68,false);clip();text("THE MASK",48,9,11);
 for(let i=0;i<8;i++){const x=48+i*13;rectfill(x,28,x+9,35,i<hero.hp?9:1);rectfill(x,27,x+8,32,i<hero.hp?10:5);if(i<hero.hp)line(x+1,28,x+6,28,7);}
 deco(174,7,153,27);text("SCORE",184,12,6);const val=String(score);text(val,316-text_size(val,FONT).width,12,10);
 deco(365,7,139,27);text("SCENE "+(stage+1)+" / "+wave+"-"+STAGES[stage].waves,375,12,7);
 rectfill(14,51,115,56,0);rectfill(15,52,15+Math.floor(hero.meter),54,hero.meter===100?10:11);
 text(hero.meter===100?"A+B  TORNADO":"MAYHEM",14,59,hero.meter===100?10:6);
 if(hero.ammo>0){text("STAR GLOVES",14,77,10);text("A  "+hero.ammo+" SHOTS",14,90,7);}
 if(stage===2){let boss=null;for(let i=0;i<foes.length;i++)if(foes[i].kind===2)boss=foes[i];if(boss&&boss.hp>0){deco(172,40,332,30);text("THE DIRECTOR",184,43,14);text(boss.phase===2?"ENCORE":"MAIN ACT",409,43,10);rectfill(184,60,490,64,1);rectfill(184,60,184+306*boss.hp/boss.maxhp,64,8);}}
 if(noticeTime>0){const w=text_size(notice,FONT).width;deco(Math.floor((512-w-20)/2),264,w+20,20);center(notice,267,10);}
 else if(clearTimer>0)center("GO RIGHT  >>",270,10);
 else if(sceneAge<165&&stage===0)center("DIRECTIONS: MOVE   A: COMBO   B: JUMP",270,7);
 else if(sceneAge<140&&stage===1)center("STEP OUT OF SHOT LANES OR JUMP",270,7);
}
function _draw(){
 if(mode==="creator"){drawCreatorNotes();return;}
 if(mode==="title"){cls(0);image_region("cover",0,0,1672,941,0,0,512,288);deco(157,239,198,23);center("A  START THE MAYHEM",243,tick%45<30?10:7);center("A: COMBO   B: JUMP   A+B: TORNADO",267,7);return;}
 scene();hud();
 if(mode==="interlude"){deco(26,96,302,106);text("THAT'S A WRAP!",42,108,11);text("SCENE "+(stage+1)+" COMPLETE",42,131,10);text(stage===0?"NEXT / THE COCO BALLROOM":"NEXT / THE DIRECTOR",42,152,7);text("A  CONTINUE     HEALTH +3",42,178,6);}
 else if(mode==="lose"||mode==="win"){deco(28,88,319,122);text(mode==="lose"?"ONE MORE TAKE?":"S-S-SMOKIN'!",44,103,mode==="lose"?14:11);text(mode==="lose"?"The city needs an encore.":"THE CITY IS YOUR STAGE.",44,128,7);text("FINAL SCORE  "+score,44,151,10);text(mode==="lose"?"A  RETRY SCENE":"A  PLAY AGAIN",44,177,7);text("B  TITLE",247,177,6);}
}
