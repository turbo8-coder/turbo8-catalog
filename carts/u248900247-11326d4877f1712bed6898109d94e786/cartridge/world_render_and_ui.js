
function textAt(s,x,y,c){bprint(s,Math.floor(x),Math.floor(y),c);}
function centered(s,y,c){let w=text_size(s).width;textAt(s,(view.width-w)/2,y,c);}
function carDraw(c){
 const frame=((Math.round(c.angle*8)%8)+8)%8;
 art('car'+c.kind+'_'+frame,c.x-16,c.y-16);
 if(c.kind===2){let flash=Math.floor(tick/5)%2;rectfill(c.x-4,c.y-1,c.x-1,c.y,flash?13:5);rectfill(c.x+1,c.y-1,c.x+4,c.y,flash?5:28);}
 if(c.health<45&&tick%6<3){circfill(c.x,c.y+7,3,3);}
}
function personDraw(x,y,d,f,shoot){
 ellipsefill(x+1,y+6,5,2,7);
 let gunFrame=fire>=15?0:fire>=13?1:fire>=10?2:fire>=6?3:4;
 art(shoot?'gun'+d+'_'+gunFrame:'person'+d+'_'+f,x-8,y-8);
}
function marker(x,y){
 let bob=Math.floor(Math.sin(tick*.12)*2);
 rect(x-10,y-9,x+10,y+9,26);
 for(let i=0;i<4;i++)line(x-4+i,y-18+bob+i,x+4-i,y-18+bob+i,27);
 if(phase==='pickup')art('case',x-8,y-8);
}
function scene(){
 camera(Math.floor(camx),Math.floor(camy));cls(18);
 let mx=Math.floor(camx/8),my=Math.floor(camy/8);
 map(mx,my,mx*8,my*8,Math.min(34,96-mx),Math.min(32,112-my));
 // Low-amplitude wave bands keep the water alive without shifting the land.
 for(let wy=Math.floor(camy/24)*24;wy<camy+view.height;wy+=24)for(let wx=616;wx<WW;wx+=32){
 if(wx<camx-16||wx>camx+view.width+16)continue;
 let yy=wy+Math.floor(Math.sin(tick*.035+wx)*2),xx=wx+(Math.floor(tick/8)%8);
 if(!blocked(xx,yy,1)||mget(Math.floor(xx/8),Math.floor(yy/8))!==ART.water.id)continue;
 line(xx,yy,xx+5,yy,20);line(xx+6,yy-1,xx+9,yy-1,19);
 }
 for(let m of marks){line(m.x-5,m.y,m.x-5,m.y+3,1);line(m.x+5,m.y,m.x+5,m.y+3,1);}
 // Independent boats and rooftop details remain fixed in world space.
 for(let d of DECOR)if(d.name!=='palm'&&d.name!=='lamp'&&d.x>camx-48&&d.x<camx+view.width&&d.y>camy-48&&d.y<camy+view.height)art(d.name,d.x,d.y);
 for(let y of [208,432,656]){
 for(let x=608;x<=688;x+=24){rectfill(x,y-10,x+3,y-5,8);rectfill(x,y-11,x+3,y-8,5);rectfill(x,y+32,x+3,y+36,8);rectfill(x,y+31,x+3,y+33,5);}
 }
 if((phase==='pickup'||phase==='deliver'))marker(targetX,targetY);
 for(let c of cars)if(c.x>camx-32&&c.x<camx+view.width+32&&c.y>camy-32&&c.y<camy+view.height+32)carDraw(c);
 for(let w of walkers)if(w.y>camy-20&&w.y<camy+view.height+20&&w.x>camx-20&&w.x<camx+view.width)personDraw(w.x,w.y,w.dir,Math.floor(tick/8+w.phase)%6,false);
 for(let c of cops)carDraw(c);
 if(drive<0&&(hurt%6<3||hurt===0))personDraw(player.x,player.y,dir,Math.floor(stepClock)%6,fire>0);
 for(let d of DECOR)if((d.name==='palm'||d.name==='lamp')&&d.x>camx-48&&d.x<camx+view.width&&d.y>camy-48&&d.y<camy+view.height)art(d.name,d.x,d.y);
 // Keep the courier readable through the pier canopy.
 if(drive<0){for(let d of DECOR){if(d.name==='palm'&&player.x>d.x-5&&player.x<d.x+37&&player.y>d.y-6&&player.y<d.y+34){personDraw(player.x,player.y,dir,Math.floor(stepClock)%6,fire>0);break;}}}
 for(let b of shots)line(b.x,b.y,b.x-b.vx,b.y-b.vy,27);
 for(let p of motes)rectfill(p.x,p.y,p.x+1,p.y+1,p.c);
 // The garage's label is part of the environment.
 textAt('AUTO',432,540,27);
 camera(0,0);
}
function star(x,y,on){let c=on?27:2;line(x+3,y,x+3,y+6,c);line(x,y+2,x+6,y+2,c);line(x+1,y+6,x+5,y+2,c);line(x+5,y+6,x+1,y+2,c);}
function minimap(){
 let x=6,y=view.height-68,w=47,h=48;
 rectfill(x-1,y-1,x+w+1,y+h+1,0);rectfill(x,y,x+w,y+h,6);rectfill(x+37,y,x+w,y+h,18);
 for(let rx of [152,344,536])rectfill(x+rx/16-1,y,x+rx/16+1,y+h,2);
 for(let ry of [152,376,600,824])rectfill(x,y+ry/19-1,x+36,y+ry/19+1,2);
 if((phase==='pickup'||phase==='deliver')){rectfill(x+targetX/16-1,y+targetY/19-1,x+targetX/16+1,y+targetY/19+1,27);}
 for(let c of cops)pset(x+c.x/16,y+c.y/19,13);
 let px=x+player.x/16,py=y+player.y/19;rectfill(px-1,py-1,px+1,py+1,5);
}
function hud(){
 rectfill(0,0,view.width-1,14,0);
 textAt('USD '+cash,5,4,25);
 for(let i=0;i<3;i++)star(93+i*10,4,i<heat);
 rectfill(140,4,185,10,1);rectfill(140,4,140+Math.max(0,hp)*.45,10,13);
 textAt(drive>=0?'CAR':'FOOT',196,4,5);
 rectfill(0,15,view.width-1,29,16);
 let task=phase==='pickup'?'GET CASE '+(mission+1)+'/3 - ON FOOT':phase==='deliver'?'TO '+jobs[mission].drop:phase==='cruise'?'FREE RIDE - SOLEIL BAY':'DELIVERY COMPLETE';
 textAt(task,5,18,5);
 if(phase==='deliver')textAt(''+Math.ceil(timer/30),222,18,timer<600?13:27);
 minimap();
 if(heat){textAt('HIDE',143,view.height-29,20);rectfill(60,view.height-29,137,view.height-24,0);rectfill(61,view.height-28,61+escape/150*75,view.height-25,20);}
 // A compass pointer remains visible when the destination is off-screen.
 if((phase==='pickup'||phase==='deliver')){
 let sx=targetX-camx,sy=targetY-camy;
 if(sx<10||sx>view.width-10||sy<36||sy>view.height-25){let a=Math.atan2(targetY-player.y,targetX-player.x),ex=clamp(sx,10,view.width-10),ey=clamp(sy,40,view.height-32);circfill(ex,ey,5,0);line(ex-Math.cos(a)*3,ey-Math.sin(a)*3,ex+Math.cos(a)*4,ey+Math.sin(a)*4,27);pset(ex+Math.cos(a)*4,ey+Math.sin(a)*4,5);}
 }
 rectfill(0,view.height-17,view.width-1,view.height-1,0);
 let hint=drive>=0?'A BRAKE   B EXIT':'A FIRE   B ENTER CAR';
 textAt(hint,5,view.height-12,5);
 if(toastTicks>0){let w=text_size(toast).width;rectfill((view.width-w)/2-3,34,(view.width+w)/2+3,46,0);centered(toast,37,27);}
}
const LETTERS={
H:['101','101','111','101','101'],A:['010','101','111','101','101'],R:['110','101','110','101','101'],B:['110','101','110','101','110'],O:['010','101','101','101','010'],E:['111','100','110','100','111'],T:['111','010','010','010','010']
};
function logo(word,x,y,s,c){for(let i=0;i<word.length;i++){let a=LETTERS[word[i]];for(let yy=0;yy<5;yy++)for(let xx=0;xx<3;xx++)if(a[yy][xx]==='1')rectfill(x+i*4*s+xx*s,y+yy*s,x+i*4*s+xx*s+s-1,y+yy*s+s-1,c);}}
function _draw(){
 scene();
 if(mode==='play'){hud();return;}
 if(mode==='title'){
 rectfill(5,24,151,100,0);rectfill(5,24,8,100,13);
 logo('HARBOR',17,33,5,8);logo('HARBOR',15,31,5,5);
 logo('HEAT',17,65,6,14);logo('HEAT',15,63,6,13);
 textAt('SOLEIL BAY',15,112,0);
 rectfill(0,156,view.width-1,view.height-1,0);
 centered('TAKE THE JOB. LOSE THE HEAT.',164,6);
 centered('DIRECTIONS MOVE / DRIVE',181,5);
 centered('A FIRE / BRAKE   B ENTER',195,5);
 centered('A START',219,tick%40<28?27:5);
 }else{
 rectfill(0,55,view.width-1,177,0);
 centered(mode==='win'?'CLEAN GETAWAY':'BUSTED',72,mode==='win'?27:13);
 centered(mode==='win'?'THE BAY IS YOURS.':timer<=0?'THE CLOCK RAN OUT.':'THEY CAUGHT YOUR TRAIL.',95,5);
 centered('TAKE: USD '+cash,119,25);
 if(mode==='win')centered('TIME '+Math.round(totalSeconds)+'s',133,6);
 centered('A PLAY AGAIN',151,5);
 if(mode==='win')centered('B FREE RIDE',166,20);
 }
}
