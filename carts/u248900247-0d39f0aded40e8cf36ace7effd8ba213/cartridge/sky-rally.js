
const W=screen_size().width,H=screen_size().height,F="fusion-pixel-10";
let mode="title",stage=0,tick=0,px=90,py=205,vx=0,vy=0,angle=0,ground=true,fuel=100,cam=0,checkpoint=90,score=0,rings=0,crashes=0,choice=0,upgrade=0,notice="",noticeTime=0,shake=0,elapsed=0;
let terrain=[],gates=[],particles=[],boost=false,lastBoost=false,stageRings=0,stageCrashes=0,lap=0;
const stageNames=["SUNSET CAUSEWAY","STARPORT MESA","NEON OVERPASS","AFTERBURN FINALE"];
// Alternating flight heights, short recharge islands and long commitment runways.
const tracks=[
 [[0,480,218,218],[750,1090,211,198],[1390,1610,218,218],[1890,2250,199,216],[2570,2800,213,201],[3120,3540,218,218]],
 [[0,480,218,209],[790,1450,207,207],[1790,2010,218,203],[2360,2630,202,217],[2980,3200,216,206],[3560,3820,206,218],[4180,4610,218,218]],
 [[0,470,218,218],[800,1460,207,207],[1830,2050,218,202],[2400,2620,208,218],[3010,3240,201,214],[3610,3840,218,204],[4240,4480,208,218],[4860,5320,218,218]],
 [[0,470,218,209],[820,1500,207,207],[1900,2120,218,202],[2500,2710,204,218],[3120,3350,218,201],[3740,3970,205,218],[4400,4620,218,202],[5030,5270,207,218],[5690,6170,218,218]]
];
const limits=tracks.map(t=>t[t.length-1][1]-130);
const gateHeights=[[146,172,138,170,148],[143,171,135,173,139,167],[140,174,133,169,138,173,142],[137,173,132,170,136,174,133,166]];
let stageEntryScore=0,stageEntryRings=0,stageEntryCells=0;
const totalGates=gateHeights.reduce((n,a)=>n+a.length,0);
let wheelPhase=0,wheelRate=0;
let cells=[],cellCount=0,stageCells=0,titleChoice=0,commsReveal=0;
let loopTrack=null,loopActive=false,loopTheta=0;
const speedCaps=[6.0,6.5,6.9,7.2];
let airTurn=0,rollAward=false,landPulse=0,wind=0;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function wrap(a){while(a>Math.PI)a-=Math.PI*2;while(a< -Math.PI)a+=Math.PI*2;return a;}
function msg(s){notice=s;noticeTime=100;}
function txt(s,x,y,c=7){bprint(s,Math.floor(x),Math.floor(y),c,F);}
function center(s,y,c=7){txt(s,(W-text_size(s,F).width)/2,y,c);}
function road(x){for(let i=0;i<terrain.length;i++){let t=terrain[i];if(x>=t[0]&&x<=t[1])return t[2]+(t[3]-t[2])*(x-t[0])/(t[1]-t[0]);}return 999;}
function slope(x){for(let t of terrain)if(x>=t[0]&&x<=t[1])return -Math.atan2(t[3]-t[2],t[1]-t[0]);return 0;}
function puff(x,y,col,n,power){for(let i=0;i<n&&particles.length<90;i++)particles.push({x:x,y:y,vx:(rnd(2)-1)*power,vy:-rnd(power),life:14+rnd(15),max:29,c:col,r:1+rnd(3)});}
function startStage(restarting=false){
 if(!restarting){stageEntryScore=score;stageEntryRings=rings;stageEntryCells=cellCount;stageCrashes=0;}
 score=stageEntryScore;rings=stageEntryRings;cellCount=stageEntryCells;
 wheelPhase=0;wheelRate=0;airTurn=0;rollAward=false;landPulse=0;
 terrain=tracks[stage];gates=[];
 for(let i=0;i<terrain.length-1;i++){let a=terrain[i][1],b=terrain[i+1][0];gates.push({x:(a+b)/2,y:gateHeights[stage][i],gap:i,low:gateHeights[stage][i]>=167,got:false});}
 buildRoute();buildLoop();music(stage+1);
 px=90;py=road(px)-11;vx=0;vy=0;angle=0;ground=true;fuel=100;cam=0;checkpoint=90;particles=[];stageRings=0;elapsed=0;mode="race";
 msg(["EVERY RING REQUIRED / missed bridge = stage restart", "LOOP REQUIRED / land first, build speed, hold RIGHT", "HIGH / LOW SLALOM / short runways, precise lift", "FINAL GAUNTLET / all rings, full loop, no checkpoints"][stage]);
 log("STAGE "+(stage+1)+" START "+stageNames[stage]);
}
function retry(){
 touchThrottle=false;startStage(true);msg("STAGE RESTART / ALL GATES AND LOOPS REQUIRED");log("RETRY STAGE "+(stage+1)+" x=90 gates=0 score="+score);
}
function crash(reason){music(5);mode="crash";crashes++;stageCrashes++;sfx(3);shake=6;puff(px,py,22,24,5);notice=reason;log("CRASH "+reason+" x="+Math.floor(px));}
function _init(){
 const polished=[["AFTERBURN FINALE",240,HF],["START WORLD RALLY",165,HF],["STAGE CLEAR",200,HF],["SCORE 999999     GATES 26 / 26",330,HF],["Ground recharge",145,F],["Stronger thrusters",145,F]];
 for(let q of polished)if(text_size(q[0],q[2]).width>q[1])log("UI OVERFLOW "+q[0]);
 const checks=[["RIGHT drive / A lift / UP DOWN pitch / B brake + level",476],["FULL ROTATION +400 / LEVEL BEFORE LANDING",476],["CEILING STRIKE - use a shorter A burst",326],["HARD LANDING - use A to soften descent",326],["A  RESTART STAGE / all gates reset",326],["> FAST REFILL  / faster ground recharge",344],["FICTIONAL FAN ARCADE / NOT AFFILIATED WITH TESLA",488]];
 let widest=0;for(let q of checks){let w=text_size(q[0],F).width;widest=Math.max(widest,w);if(w>q[1])log("LAYOUT OVERFLOW "+q[0]+" width="+w);}
 log("LAYOUT measured "+checks.length+" longest prompts; widest="+widest);
 const saved=storage_get("hiscore",0);hiScore=typeof saved==="number"&&Number.isFinite(saved)?Math.max(0,Math.floor(saved)):0;
 srand(19);music(0);log("TESLA SKY RALLY: RIGHT drive, A lift, UP/DOWN pitch, B landing assist.");}
function rallyUpdate(){
 tick++;if(landPulse>0)landPulse--;if(noticeTime>0)noticeTime--;if(shake>0)shake--;
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.life--;if(p.life<=0)particles.splice(i,1);}
 if(mode==="title"){if(controlPressed(2)||controlPressed(3)){titleChoice=1-titleChoice;sfx(0);}if(controlPressed(4)||controlPressed(5))beginRally(controlPressed(5)||titleChoice===1);return;}
 if(mode==="briefing"||mode==="debrief"){
  if(autoplay&&controlPressed(5)){returnTitle();return;}
  commsAge++;
  const length=commsLines().join("").length;
  const before=commsReveal;commsReveal=Math.min(length,commsReveal+1);
  if(commsReveal>before&&commsAge%5===0)sfx(8);
  if(!autoplay&&controlPressed(4)&&commsAge>12){
   if(commsReveal<length){commsReveal=length;sfx(0);}
   else {mode=commsNext;noticeTime=100;sfx(0);if(mode==="race")music(stage+1);}
  }else if(autoplay&&commsAge>length+75){mode=commsNext;noticeTime=100;if(mode==="race")music(stage+1);}
  return;
 }
 if(autoplay&&controlPressed(5)){returnTitle();return;}
 if(mode==="crash"){if(controlPressed(4)||(autoplay&&++autoWait>70)){autoWait=0;retry();}return;}
 if(mode==="service"){
  if(controlPressed(0)||controlPressed(1)){choice=1-choice;sfx(0);}
  if(controlPressed(4)||(autoplay&&++autoWait>100)){autoWait=0;upgrade=choice;stage++;startStage();sfx(4);}return;
 }
 if(mode==="win"){if(controlPressed(4)){returnTitle();sfx(0);}return;}
 if(updateLoop())return;
 elapsed++;if(elapsed%30===0)log("DRIVE stage="+stage+" x="+Math.round(px)+" y="+Math.round(py)+" vx="+vx.toFixed(2)+" vy="+vy.toFixed(2)+" ground="+ground+" gas="+Math.round(fuel));lastBoost=boost;boost=driveBtn(4)&&fuel>0;
 const oldY=py,oldX=px;
 if(driveBtn(1))vx+=ground?.15:.045;else vx*=ground?.975:.998;
 if(driveBtn(0))vx-=.17;
 if(driveBtn(5)&&ground)vx*=.90;
 vx=clamp(vx,0,speedCaps[stage]);
 if(ground){
  angle+=wrap(slope(px)-angle)*.35;
  fuel=Math.min(100,fuel+(upgrade===0?1.8:1.3));
  if(boost){ground=false;airTurn=0;rollAward=false;vy=-3.4;fuel-=3;sfx(1);puff(px,py+10,12,9,2);}
 }
 if(!ground){
  if(driveBtn(2)){angle+=.10;airTurn+=.10;}if(driveBtn(3)){angle-=.10;airTurn-=.10;}
  if(Math.abs(airTurn)>=6.1&&!rollAward){rollAward=true;score+=400;msg("FULL ROTATION +400 / LEVEL BEFORE LANDING");sfx(4);}
  if(driveBtn(5)&&!driveBtn(2)&&!driveBtn(3))angle+=wrap(-angle)*.13;
  angle=wrap(angle);
  wind=0;
  if(stage>=1){for(let i=0;i<terrain.length-1;i++)if(px>terrain[i][1]&&px<terrain[i+1][0])wind=(i%2===0?-.025:.025)*(stage===3?1.6:1);}
  vy+=.22+wind;
  if(driveBtn(5)&&vy>0)vy*=.975;
  if(boost){vy-=(vy>0?.55:(upgrade===1?.30:.265))*(.82+.18*Math.cos(angle));fuel=Math.max(0,fuel-[.75,.85,.95,1.0][stage]);vx+=Math.sin(angle)*.02;if(tick%14===0)sfx(2);}
  vy=clamp(vy,-4.2,7.5);
 }
 px+=vx;py+=vy;
 // Wheel travel follows the six-pixel tire radius; airborne rims coast.
 wheelRate=ground?vx/6:wheelRate+(Math.max(.16,vx/9)-wheelRate)*.08;
 wheelPhase=(wheelPhase+wheelRate)%(Math.PI*2);
 const floor=road(px);
 if(ground){
  if(floor<900)py=floor-11;
  else {ground=false;vy=-.7;}
 }else if(floor<900&&oldY+11<=floor+8&&py+11>=floor&&vy>=0){
  if(Math.abs(wrap(angle-slope(px)))>.60||vy>[6.5,6.2,6.0,5.8][stage]){crash(Math.abs(angle)>.60?"LEVEL YOUR WHEELS BEFORE TOUCHDOWN":"HARD LANDING - use A to soften descent");return;}
  ground=true;landPulse=7;py=floor-11;vy=0;
  const clean=Math.abs(angle)<.23;score+=clean?100:40;sfx(clean?4:5);puff(px,py+12,clean?12:23,14,3);shake=clean?2:4;msg(clean?"PRECISION LANDING +100":"LANDED +40");log("LAND x="+Math.floor(px)+" score="+score);
 }
 {for(let g of gates){if(!g.low)continue;if(Math.abs(px-g.x)<61&&py<116){crash("CEILING STRIKE - use a shorter A burst");return;}}}
 // Falling below the bridge deck is terminal, even if thrust could recover later.
 let deck=floor;
 if(deck>900){for(let i=0;i<terrain.length-1;i++)if(px>terrain[i][1]&&px<terrain[i+1][0]){const a=terrain[i],b=terrain[i+1];deck=a[3]+(b[2]-a[3])*(px-a[1])/(b[0]-a[1]);break;}}
 if(py+11>deck+7||py>H){crash("BELOW THE BRIDGE / STAGE FAILED");return;}
 if(py<85){py=85;vy=Math.max(0,vy);fuel=Math.max(0,fuel-1);}
 for(let g of gates)if(!g.got&&Math.abs(px-g.x)<19&&Math.abs(py-g.y)<[22,20,18,17][stage]){g.got=true;log("RING PASSED "+(g.gap+1)+" / "+gates.length);score+=250;rings++;stageRings++;fuel=Math.min(100,fuel+24);sfx(4);puff(g.x,g.y,22,16,3);msg("SKY GATE +250 / COLD GAS +24");}
 for(const g of gates)if(!g.got&&px>g.x+20){crash("MISSED SKY RING / STAGE FAILED");return;}
 if(loopTrack&&!loopTrack.done&&!loopActive&&px>loopTrack.x+22){crash("MISSED 360 LOOP / STAGE FAILED");return;}
 collectRoute();
 if(boost&&tick%2===0)puff(px-12,py+16,12,2,1.6);
 if(ground&&vx>1&&tick%4===0)puff(px-24,py+11,23,1,1.1);
 cam+=(Math.max(0,px-150)-cam)*.18;
 if(px>=limits[stage]){
  if(gates.some(g=>!g.got)||(loopTrack&&!loopTrack.done)){crash("ROUTE INCOMPLETE / STAGE FAILED");return;}
  score+=500;vx=0;sfx(6);log("STAGE "+(stage+1)+" CLEAR gates="+stageRings+" crashes="+stageCrashes);
  if(stage===stageNames.length-1){mode="win";log("RALLY COMPLETE score="+score+" crashes="+crashes);}
  else {mode="service";choice=0;}
  commsNext=mode;mode="debrief";commsAge=0;commsReveal=0;music(5);
 }
}
function backdrop(){
 const id=stage===1?"desert":stage>=2?"night":"bay";
 const sz=image_size(id);
 // Stable integer source windows preserve scenery during camera travel.
 const viewWidth=Math.floor(sz.height*W/H);
 const sx=Math.floor(Math.min(sz.width-viewWidth,cam*.115));
 image_region(id,sx,0,viewWidth,sz.height,0,0,W,H);
 if(stage===1){
  // Small detached heat ribbons; architecture remains sharp.
  for(let i=0;i<7;i++){let x=(i*89-cam*.22+tick*.18)%600;
   line(x,239+i%3*4,x+18,239+i%3*4,23);}
 }else{
  for(let i=0;i<18;i++){let x=((i*83-cam*.28+tick*.22)%580+580)%580-34;
   let y=218+(i*17)%67;line(x,y,x+6+i%4*3,y,i%5===0?(stage>=2?11:23):9);}
 }
}
function roadDraw(){
 for(let i=0;i<terrain.length;i++){let t=terrain[i],l=Math.floor(t[0]-cam),r=Math.floor(t[1]-cam);if(r<0||l>W)continue;
  for(let x=Math.max(0,l);x<=Math.min(W,r);x+=8){
   let y=Math.floor(t[2]+(t[3]-t[2])*(x+cam-t[0])/(t[1]-t[0]));
   rectfill(x,y,x+7,y+5,20);rectfill(x,y+6,x+7,y+15,9);rectfill(x,y+16,x+7,y+19,18);
   if((Math.floor((x+cam)/32)%2)===0)rectfill(x,y+2,x+7,y+3,7);
   if(Math.floor((x+cam)/8)%4===0){line(x,y+7,x+7,y+14,19);pset(x+2,y+7,20);}
   if(Math.floor((x+cam)/8)%8===0){line(x,y,x,y+5,18);line(x+1,y,x+1,y+5,19);}
   line(x,y+16,x+7,y+16,19);
  }
  for(let x=t[0]+12;x<t[1]-54;x+=64){
   let sx=x-cam;if(sx< -70||sx>W)continue;let y=road(x);
   line(sx,y-8,sx+34,y-8,19);line(sx,y-7,sx+34,y-7,8);
   line(sx,y-8,sx,y-1,20);line(sx+34,y-8,sx+34,y-1,20);
   rectfill(sx+13,y-7,sx+17,y-6,22);
  }
  if(stage>=2){for(let x=t[0]+10;x<t[1]-30;x+=80){let sx=x-cam;if(sx< -40||sx>W+40)continue;let y=road(x);rectfill(sx,y+8,sx+33,y+9,stage===3?22:12);}}
  for(let x=t[0]+45;x<t[1];x+=120){let sx=x-cam;if(sx< -30||sx>W+30)continue;let y=road(x);rectfill(sx,y+20,sx+14,H,18);rectfill(sx+2,y+20,sx+4,H,9);line(sx,y+20,sx+44,y+65,9);}
  if(i<terrain.length-1){let ex=r,y=t[3];rectfill(ex-43,y-5,ex-4,y-2,22);for(let a=0;a<3;a++){line(ex-39+a*12,y-14,ex-33+a*12,y-10,22);line(ex-33+a*12,y-10,ex-39+a*12,y-6,22);}line(ex,y-25,ex,y,18);circfill(ex,y-27,3,14);}
  if(i>0){let sx=l+22,y=t[2];line(sx,y-26,sx,y,19);rectfill(sx+1,y-26,sx+40,y-15,9);txt("LAND",sx+3,y-27,12);}
 }
 const finish=limits[stage]-cam;if(finish<W&&finish> -100){for(let a=0;a<2;a++){rectfill(finish+a*72,135,finish+a*72+4,218,21);}rectfill(finish,135,finish+76,150,18);for(let x=0;x<9;x++)for(let y=0;y<2;y++)rectfill(finish+x*8,135+y*8,finish+x*8+7,142+y*8,(x+y)%2?21:18);}
}
function worldHint(s,x,y,c){const z=text_size(s,F);rectfill(x-2,y-1,x+z.width+1,y+12,0);txt(s,x,y,c);}
function gateDraw(front){
 for(let g of gates){let x=g.x-cam;if(x< -30||x>W+30)continue;const c=g.got?9:22;
  if(!front&&stage>=1&&!g.got){
   const gi=gates.indexOf(g);
   for(let n=0;n<5;n++){let xx=x-53+n*26,yy=g.y+40+((tick*2+n*9)%34);line(xx,yy,xx+(gi%2?8:-8),yy-5,stage===1?20:11);}
   worldHint(gi%2?"DOWNDRAFT":"UPDRAFT",x-26,76,12);
  }
  if(!front&&g.low){rectfill(x-42,90,x+42,100,18);for(let z=-40;z<42;z+=12){line(x+z,90,x+z+9,99,22);line(x+z+1,90,x+z+10,99,22);}line(x-40,55,x-40,90,19);line(x+40,55,x+40,90,19);worldHint("FLY LOW",x-22,104,22);}
  if(!front){ellipse(x,g.y,15,34,c);ellipse(x,g.y,12,31,g.got?8:7);line(x-15,g.y-11,x-15,g.y+11,c);}
  else{line(x+14,g.y-9,x+14,g.y+9,c);if(!g.got){worldHint("PASS "+(g.gap+1),x-20,g.y-53,7);circfill(x,g.y-35,2,tick%20<10?7:22);}}
 }
}
function carDraw(x,y,a){
 let f=((Math.round(a*18/Math.PI)%36)+36)%36;
 if(boost&&mode==="race"){
  const cs=Math.cos(a),sn=Math.sin(a);
  for(let q of [-25,18]){
   const jx=x+q*cs+9*sn,jy=y-q*sn+9*cs;
   const length=27+(tick%4)*3;
   for(let d=length;d>=0;d-=2){
    const r=Math.max(1,5*(1-d/length));
    circfill(jx+sn*d,jy+cs*d,r,d>length*.7?14:11);
    if(d<length*.72)circfill(jx+sn*d,jy+cs*d,Math.max(1,r-2),12);
    if(d<12)circfill(jx+sn*d,jy+cs*d,2,21);
   }
   circfill(jx,jy,4,21);
  }
 }
 if(ground&&landPulse>3)y+=1;
 sspr((f%6)*80,Math.floor(f/6)*80,80,80,Math.floor(x)-40,Math.floor(y)-40);
 const ac=Math.cos(f*Math.PI/18),as=Math.sin(f*Math.PI/18);
 const detail=(x1,y1,x2,y2,col)=>line(x+x1*ac+y1*as,y-x1*as+y1*ac,x+x2*ac+y2*as,y-x2*as+y2*ac,col);
 detail(-32,-7,-24,-14,19);detail(-30,-7,-22,-14,19);detail(-37,-14,-19,-14,21);detail(-36,-13,-20,-13,14);
 detail(-14,-10,7,-10,12);detail(-12,-9,3,-9,11);
 detail(-13,9,12,9,12);detail(-12,10,11,10,11);
 detail(28,-3,35,-3,21);detail(30,-2,35,-2,12);detail(-36,-3,-31,-3,14);
 // Match the authored chassis frame, not the unsnapped physics angle.
 const body=f*Math.PI/18,cs=Math.cos(body),sn=Math.sin(body);
 for(let axle of [-22,21]){
  const wx=Math.floor(x)+Math.round(axle*cs+5*sn);
  const wy=Math.floor(y)+Math.round(-axle*sn+5*cs);
  circfill(wx,wy,4,19);circfill(wx,wy,3,8);
  for(let k=0;k<3;k++){
   const a=wheelPhase-body+k*Math.PI*2/3;
   const ex=wx+Math.round(Math.cos(a)*3),ey=wy+Math.round(Math.sin(a)*3);
   line(wx,wy,ex,ey,21);
   pset(wx+Math.round(Math.cos(a+.3)*3),wy+Math.round(Math.sin(a+.3)*3),11);
  }
  // A valve marker makes rotation readable without flashing the whole tire.
  const va=wheelPhase-body;
  pset(wx+Math.round(Math.cos(va)*5),wy+Math.round(Math.sin(va)*5),20);
  pset(wx,wy,21);
 }
}
const glyph={T:["11111","00100","00100","00100","00100","00100","00100"],E:["11111","10000","10000","11110","10000","10000","11111"],S:["11111","10000","10000","11111","00001","00001","11111"],L:["10000","10000","10000","10000","10000","10000","11111"],A:["01110","11011","10001","11111","10001","10001","10001"],K:["10001","10010","10100","11000","10100","10010","10001"],Y:["10001","10001","01010","00100","00100","00100","00100"],R:["11110","10001","10001","11110","10100","10010","10001"]," ":["00000","00000","00000","00000","00000","00000","00000"]};
function logo(s,x,y,z,c){for(let n=0;n<s.length;n++){let g=glyph[s[n]];if(!g)continue;for(let j=0;j<7;j++)for(let i=0;i<5;i++)if(g[j][i]==="1")rectfill(x+n*6*z+i*z+Math.floor((6-j)/3),y+j*z,x+n*6*z+i*z+z-1+Math.floor((6-j)/3),y+j*z+z-1,c);}}
const HF="fusion-pixel-12";
function heading(s,x,y,c=7){bprint(s,Math.floor(x),Math.floor(y),c,HF);}
function titleCenter(s,y,c=7){heading(s,(W-text_size(s,HF).width)/2,y,c);}
function uiPanel(x,y,w,h,accent){
 rectroundfill(x,y,x+w-1,y+h-1,4,0);
 line(x+12,y+1,x+w-13,y+1,9);
 rectfill(x+12,y+1,x+43,y+2,accent);
}
function actionChip(letter,x,y){
 rectroundfill(x,y,x+15,y+15,3,12);
 heading(letter,x+4,y,0);
}
function hud(){
 rectfill(0,0,W-1,51,0);line(12,51,W-13,51,9);
 rectfill(12,7,35,28,17);heading("0"+(stage+1),15,9,7);
 heading(stageNames[stage],44,5,7);
 txt(autoplay?"AUTOPILOT / B EXIT":"TEST PILOT / HI "+hiScore,44,25,autoplay?22:19);
 txt("SCORE",392,3,19);heading(String(score).padStart(6,"0"),435,17,22);
 txt("GAS",12,36,12);rectfill(40,38,131,43,8);
 for(let i=0;i<15;i++)if(fuel>i*100/15)rectfill(41+i*6,39,44+i*6,42,fuel<25?14:12);
 txt(Math.floor(vx*32)+" KM/H",148,35,7);
 txt("DATA "+stageCells+" / "+cells.length,250,35,12);
 txt("GATES "+stageRings+" / "+gates.length,376,35,22);
 if(mode==="race"){rectfill(12,52,W-13,68,0);txt(noticeTime>0?notice:"RIGHT DRIVE / A LIFT / UP DOWN PITCH / B LEVEL",22,53,noticeTime>0?7:20);}
 rectfill(12,H-4,W-13,H-3,8);rectfill(12,H-4,12+(W-25)*Math.min(1,px/limits[stage]),H-3,12);
}
function gameDraw(){
 camera();cls(0);
 if(mode==="title"){
  const sz=image_size("title");if(sz)image_region("title",0,0,sz.width,sz.height,0,0,W,H);
  drawTitle();return;
 }
 backdrop();roadDraw();loopDraw();routeDraw();gateDraw(false);
 if(ground)ellipsefill(px-cam,road(px)-1,29,3,18);
 for(let p of particles){let r=p.r*(p.life/p.max);circfill(p.x-cam,p.y,r,p.life<8?9:p.c);}
 carDraw(px-cam,py,angle);gateDraw(true);hud();
 if(mode==="briefing"||mode==="debrief")drawComms();
 if(mode==="crash"){
  uiPanel(74,77,365,87,14);heading("FLIGHT INTERRUPTED",93,86,14);txt(notice,93,110,7);actionChip("A",93,138);txt("RESTART STAGE  /  ALL PROGRESS RESET",116,138,12);
 }
 if(mode==="service"){
  uiPanel(36,69,440,164,12);heading("ENGINEERING BAY",53,78,12);txt("NEXT / TEST 0"+(stage+2),348,81,19);
  txt("Choose your upgrade for the next test",53,102,7);
  for(let i=0;i<2;i++){
   let x=51+i*210;rectfill(x,125,x+198,193,choice===i?9:8);
   rectfill(x,125,x+198,127,choice===i?12:19);
   heading(i===0?"01 / RAPID REFILL":"02 / VECTOR LIFT",x+10,136,choice===i?7:20);
   txt(i===0?"Recharge faster on road":"Stronger airborne thrust",x+10,163,choice===i?12:19);
   if(choice===i)txt("SELECTED",x+10,179,22);
  }
  txt("LEFT / RIGHT  SELECT",53,210,19);actionChip("A",359,207);txt("INSTALL",382,209,7);
 }
 if(mode==="win"){
  uiPanel(78,68,357,154,22);titleCenter("SKY RALLY / FINISH",79,22);center("EVERY RUNWAY BEHIND YOU.",106,20);
  titleCenter("SCORE "+score+"     GATES "+rings+" / "+totalGates,135,12);center((crashes===0?"S / CLEAN SWEEP":crashes<5?"A / SKY ACE":"B / RALLY FINISHER")+"   RECOVERIES "+crashes,159,20);center(autoplay?"AI SCORE / NOT ELIGIBLE FOR HI SCORE":"HI SCORE  "+hiScore+(recordSet?" / NEW RECORD":""),181,22);center("A  RETURN TO TITLE",202,7);
 }
}

// Run provenance never changes during a rally, including full-stage retries.
let autoplay=false,hiScore=0,recordSet=false,autoWait=0;
let commsAge=0,commsNext="race",saveFailed=false;
function beginRally(ai){
 autoplay=ai;recordSet=false;autoWait=0;stage=0;score=0;rings=0;crashes=0;upgrade=0;
 cellCount=0;startStage();mode="briefing";commsAge=0;commsReveal=0;commsNext="race";music(0);sfx(0);
 log("RUN START "+(autoplay?"AI / RECORD INELIGIBLE":"HUMAN / RECORD ELIGIBLE"));
}
function gameUpdate(){
 rallyUpdate();
 if(!autoplay&&score>hiScore){
  hiScore=score;recordSet=true;saveFailed=!storage_set("hiscore",hiScore);
 }
}
// Feedback pilot uses the same throttle, lift and stabilizer as the player.
// It never moves the car directly, awards points or bypasses collision checks.
function driveBtn(button){
 if(!autoplay)return controlHeld(button);
 if(button===1)return true;
 if(button===5)return !ground&&!loopActive;
 if(button!==4)return false;
 if(loopActive)return false;
 let segment=terrain.findIndex(t=>px>=t[0]&&px<=t[1]);
 if(ground)return segment>=0&&segment<terrain.length-1&&terrain[segment][1]-px<65;
 let gap=-1;
 for(let i=0;i<terrain.length-1;i++)if(px>=terrain[i][1]-80&&px<terrain[i+1][0]+45){gap=i;break;}
 let target=195;
 if(gap>=0){
  const gate=gates[gap],landing=terrain[gap+1];
  const blend=clamp((px-gate.x-15)/(landing[0]-gate.x+15),0,1);
  target=gate.y+(landing[2]-11-gate.y)*blend;
 }
 if(loopTrack&&!loopTrack.done&&px>terrain[1][0]+15&&px<loopTrack.x)target=road(px)+6;
 const desired=clamp((target-py)*.11,-3.4,3.2);
 return vy>desired+.05;
}
const praise=[
 ["Great work! Takeoff and landing checks passed.", "Next: short runways and a mandatory 360 loop."],
 ["Nicely done, engineer. Wind tests complete!", "Next: low ceilings and a full 360-degree loop."],
 ["Precise flying! That is excellent test data.", "Final test: a faster loop and longer sky jumps."],
 ["Congratulations! All four flight tests passed.", "You made the impossible fly. Great job, engineer!"]
];
function drawComms(){
 const y=70+Math.round(130*Math.pow(Math.max(0,1-commsAge/16),3));
 uiPanel(18,y,476,166,12);
 // Reuse the original authored Musk portrait from the title image.
 image_region("title",1210,15,400,490,29,y+14,82,101);
 rectfill(29,y+116,110,y+134,9);txt("ELON MUSK",36,y+118,7);
 txt("TESLA / FLIGHT TEST CONTROL",124,y+12,12);
 heading(mode==="briefing"?"MISSION BRIEF":"TEST PASSED  "+(stage+1)+" / 4",124,y+33,22);
 const lines=commsLines();let remaining=commsReveal;
 for(let i=0;i<lines.length;i++){
  let shown=lines[i].slice(0,Math.max(0,remaining));txt(shown,124,y+61+i*20,7);
  if(remaining>=0&&remaining<lines[i].length&&tick%20<12)rectfill(124+text_size(shown,F).width,y+71+i*20,128+text_size(shown,F).width,y+72+i*20,12);
  remaining-=lines[i].length;
 }
 txt(autoplay?"AI TEST FLIGHT / SCORE EXCLUDED FROM HI SCORE":"RIGHT DRIVE / A LIFT / UP DOWN PITCH / B LEVEL",29,y+140,19);
 if(!autoplay){actionChip("A",382,y+116);txt(commsReveal<commsLines().join("").length?"REVEAL":"CONTINUE",404,y+118,12);}
 else txt("AUTO NEXT",405,y+118,22);
}

function returnTitle(){mode="title";boost=false;titleChoice=0;music(0);}
function commsLines(){return mode==="briefing"?[
 "Welcome, Tesla flying-car test engineer!",
 "Every sky ring and the full loop are mandatory.",
 "Below the bridge or missed gate? Restart this stage."
]:praise[stage];}
function buildRoute(){
 cells=[];stageCells=0;
 for(let i=0;i<gates.length;i++){
  const left=terrain[i],right=terrain[i+1],gate=gates[i];
  for(let j=0;j<7;j++){
   const t=(j+1)/8,x=left[1]-45+(right[0]-left[1]+75)*t;
   const start=left[3]-24,end=right[2]-22;
   const y=x<gate.x?start+(gate.y-start)*Math.sin(clamp((x-left[1]+45)/(gate.x-left[1]+45),0,1)*Math.PI/2):gate.y+(end-gate.y)*Math.pow(clamp((x-gate.x)/(right[0]+30-gate.x),0,1),1.6);
   cells.push({x,y,got:false});
  }
 }
}
function collectRoute(){
 for(let c of cells)if(!c.got&&Math.abs(px-c.x)<22&&Math.abs(py-c.y)<25){
  c.got=true;cellCount++;stageCells++;score+=25;fuel=Math.min(100,fuel+2);
  sfx(7);puff(c.x,c.y,12,5,1.7);
  if(stageCells%7===0){score+=75;msg("DATA CHAIN +75 / TELEMETRY UPLOADED");}
 }
}
function routeDraw(){
 for(let i=0;i<cells.length;i++){
  const c=cells[i],x=Math.floor(c.x-cam),y=Math.floor(c.y);if(c.got||x< -10||x>W+10)continue;
  const pulse=(tick+i*3)%30<15;
  line(x,y-5,x+5,y,9);line(x+5,y,x,y+5,9);line(x,y+5,x-5,y,9);line(x-5,y,x,y-5,9);
  rectfill(x-2,y-2,x+2,y+2,pulse?12:11);pset(x,y,21);
  if(i%7<6){const next=cells[i+1];if(!next.got){let nx=next.x-cam,ny=next.y;for(let k=1;k<4;k++)pset(x+(nx-x)*k/4,y+(ny-y)*k/4,9);}}
 }
}
function drawTitle(){
 // Heavy, beveled flight badge. Shine belongs to the letter surfaces.
 rectfill(16,17,285,145,0);
 txt("VECTOR-X  /  ELECTRIC FLIGHT",26,24,19);
 drawChromeWord(chromeTesla,25,43,0);
 drawChromeWord(chromeRally,25,98,8);
 line(27,135,135,135,9);line(135,135,144,126,9);
 rectfill(27,134,58,136,12);txt("FLIGHT TEST PROGRAM",157,133,19);
 for(let i=0;i<2;i++){
  let y=152+i*34;rectfill(20,y,270,y+29,titleChoice===i?9:0);
  rectfill(20,y,23,y+29,titleChoice===i?12:19);
  actionChip(i===0?"A":"B",30,y+7);heading(i===0?"START TEST FLIGHT":"WATCH AI AUTOPLAY",54,y+6,titleChoice===i?7:20);
 }
 rectfill(20,223,270,258,0);txt("HI SCORE  "+hiScore,24,227,22);txt("UP / DOWN SELECT  /  A START",24,243,20);
 rectfill(0,H-24,W,H,0);center("FICTIONAL FAN ARCADE / NOT AFFILIATED WITH TESLA",H-20,20);
 if(saveFailed||storage_status().error)txt("RECORD SAVE ERROR",310,246,14);
}

function buildLoop(){
 loopActive=false;loopTheta=0;
 loopTrack=stage>=1?{x:terrain[1][0]+300,r:stage===1?44:stage===2?48:54,bottom:road(terrain[1][0]+300)-11,done:false}:null;
}
function updateLoop(){
 if(!loopTrack||loopTrack.done)return false;
 const l=loopTrack;
 if(!loopActive){
  if(!ground||px<l.x||px>l.x+20)return false;
  if(vx<([0,4.8,5.4,5.8][stage])){crash("LOOP SPEED LOW - HOLD RIGHT TO COMMIT");return true;}
  loopActive=true;loopTheta=0;px=l.x;py=l.bottom;boost=false;
  msg("360 LOOP / HOLD RIGHT / A POWER ASSIST");log("LOOP ENTER stage="+(stage+1));sfx(1);
 }
 elapsed++;boost=driveBtn(4)&&fuel>0;
 if(driveBtn(1))vx+=.10;if(driveBtn(0)||driveBtn(5))vx-=.12;
 if(boost){vx+=.13;fuel=Math.max(0,fuel-.5);if(tick%14===0)sfx(2);}
 vx=clamp(vx-.075*Math.sin(loopTheta),0,speedCaps[stage]);
 if(vx<3.6){crash("LOOP STALLED / HOLD RIGHT + A");return true;}
 loopTheta+=vx/l.r;wheelRate=vx/6;wheelPhase=(wheelPhase+wheelRate)%(Math.PI*2);
 px=l.x+Math.sin(loopTheta)*l.r;py=l.bottom-l.r+Math.cos(loopTheta)*l.r;
 angle=wrap(loopTheta);ground=false;
 cam+=(Math.max(0,px-150)-cam)*.12;
 if(tick%3===0)puff(px,py+7,12,1,1);
 if(loopTheta>=Math.PI*2){
  loopActive=false;l.done=true;px=l.x+8;py=road(px)-11;vy=0;ground=true;angle=slope(px);
  score+=300;msg("360 LOOP VERIFIED +300");sfx(6);log("LOOP COMPLETE stage="+(stage+1));
 }
 return true;
}
function loopDraw(){
 if(!loopTrack)return;const l=loopTrack,x=l.x-cam,y=l.bottom-l.r;
 if(x+l.r<0||x-l.r>W)return;
 // Continuous circular road, with light bands indicating travel direction.
 for(let r=l.r+8;r<=l.r+17;r++)ellipse(x,y,r,r,r<l.r+12?20:8);
 ellipse(x,y,l.r+9,l.r+9,12);ellipse(x,y,l.r+16,l.r+16,19);
 for(let i=0;i<16;i++){
  let a=i*Math.PI/8,r=l.r+13;
  const ax=x+Math.sin(a)*r,ay=y+Math.cos(a)*r;
  line(ax,ay,ax+Math.cos(a)*5,ay-Math.sin(a)*5,((tick/5|0)%16===i)?21:22);
 }
 line(x-l.r-13,y,x-l.r-22,218,9);line(x+l.r+13,y,x+l.r+22,218,9);
 worldHint(l.done?"LOOP VERIFIED":"360 / HOLD RIGHT",x-43,y-9,l.done?12:22);
 for(let i=0;i<3;i++){
  let ax=x-110+i*20,ay=l.bottom-3;
  line(ax,ay-5,ax+6,ay,12);line(ax+6,ay,ax,ay+5,12);
 }
}

// Pixel-finished industrial outlines. Polygons are rasterized once at the
// final logical size; there are no enlarged bitmap cells or fractional pixels.
function industrialGlyph(ch,w,h){
 const s=h>32?8:6,c=2,m=(h-s)/2,half=h/2;
 const box=(l,t,r,b)=>[[l,t],[r,t],[r,b],[l,b]];
 const cutBox=(l,t,r,b)=>[[l+c,t],[r-c,t],[r,t+c],[r,b-c],[r-c,b],[l+c,b],[l,b-c],[l,t+c]];
 const stem=box(0,0,s,h);
 switch(ch){
  case "T":return {parts:[cutBox(0,0,w,s),box((w-s)/2,s,(w+s)/2,h)]};
  case "E":return {parts:[stem,cutBox(0,0,w,s),box(0,m,w-3,m+s),cutBox(0,h-s,w,h)]};
  case "S":return {p:[[c,0],[w,0],[w,s],[s+c,s],[s,s+c],[s,m-c],[s+c,m],[w-c,m],[w,m+c],[w,h-c],[w-c,h],[0,h],[0,h-s],[w-s-c,h-s],[w-s,h-s-c],[w-s,m+s+c],[w-s-c,m+s],[c,m+s],[0,m+s-c],[0,c]]};
  case "L":return {parts:[stem,cutBox(0,h-s,w,h)]};
  case "A":return {p:[[c,0],[w-c,0],[w,c],[w,h],[w-s,h],[w-s,m+s],[s,m+s],[s,h],[0,h],[0,c]],h:cutBox(s,s,w-s,m)};
  case "R":return {parts:[stem,cutBox(0,0,w,m+s),[[w-s-(h-m-s),m+s],[w-(h-m-s),m+s],[w,h],[w-s,h]]],h:cutBox(s,s,w-s,m)};
  case "K":return {parts:[stem,[[s,half],[s+s,half],[s+s+half,0],[s+half,0]],[[s,half],[s+s,half],[s+s+half,h],[s+half,h]]]};
  case "Y":{
   const d=(w-s)/2;
   return {parts:[[[0,0],[s,0],[d+s,d],[d,d]],[[w-s,0],[w,0],[d+s,d],[d,d]],box(d,d,d+s,h)]};
  }
 }
}
function insideGlyph(x,y,points){
 let hit=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
 }
 return hit;
}
function metalTone(t){
 // Fine cool-silver ramp with a narrow reflected horizon, not broad stripes.
 const stops=[[0,[196,222,234]],[.36,[135,173,194]],[.48,[109,148,173]],[.52,[73,113,144]],[.59,[94,144,169]],[1,[173,220,230]]];
 let a=stops[0],b=stops[stops.length-1];
 for(let i=1;i<stops.length;i++)if(t<=stops[i][0]){a=stops[i-1];b=stops[i];break;}
 const f=(t-a[0])/(b[0]-a[0]);let hex="#";
 for(let i=0;i<3;i++)hex+=Math.round(a[1][i]+(b[1][i]-a[1][i])*f).toString(16).padStart(2,"0");
 return hex;
}
function chromeWord(text,glyphWidth,height,gap){
 const width=text.replace(/ /g,"").length*(glyphWidth+gap)+text.split(" ").length*3+Math.ceil(height/4)+16;
 const mask=new Uint8Array(width*height);let advance=0;
 for(const ch of text){
  if(ch===" "){advance+=Math.floor(glyphWidth*.4);continue;}
  const glyph=industrialGlyph(ch,glyphWidth,height);
  for(let y=0;y<height;y++)for(let x=0;x<glyphWidth;x++){
   const xx=x+.5,yy=y+.5;
   const filled=glyph.parts?glyph.parts.some(part=>insideGlyph(xx,yy,part)):insideGlyph(xx,yy,glyph.p);
   if(filled&&(!glyph.h||!insideGlyph(xx,yy,glyph.h)))mask[y*width+advance+x+Math.floor((height-1-y)/4)]=1;
  }
  advance+=glyphWidth+gap;
 }
 const occupied=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&mask[y*width+x]===1;
 const runs=[],surface=[];
 for(let y=0;y<height;y++){
  const tone=metalTone(y/(height-1));
  for(let x=0;x<width;){
   if(!occupied(x,y)){x++;continue;}
   let end=x+1;while(occupied(end,y))end++;runs.push({x,y,w:end-x});
   let previous=null,start=x;
   for(let q=x;q<=end;q++){
    let col=q===end?null:!occupied(q,y-1)?(!occupied(q-1,y)||!occupied(q+1,y)?"#bdd9e6":"#e7f6fc"):!occupied(q,y+1)?"#31566d":!occupied(q-1,y)?"#a9cddd":!occupied(q+1,y)?"#426e86":tone;
    if(col!==previous){if(previous!==null)surface.push({x:start,y,w:q-start,c:previous});start=q;previous=col;}
   }
   x=end;
  }
 }
 return {runs,surface,height,width:advance-gap+Math.floor(height/4)};
}
const chromeTesla=chromeWord("TESLA",40,44,6);
const chromeRally=chromeWord("SKY RALLY",26,28,1);
function drawChromeWord(word,x,y,delay){
 const phase=(tick-delay+180)%180;
 const shine=phase>=18&&phase<=76?Math.floor((phase-18)*(word.width+65)/58)-32:-100;
 for(const r of word.runs)rectfill(x+r.x+2,y+r.y+3,x+r.x+r.w+1,y+r.y+3,8);
 for(const r of word.surface)rectfill(x+r.x,y+r.y,x+r.x+r.w-1,y+r.y,r.c);
 if(shine> -100)for(const r of word.runs){
  const edge=shine-Math.floor(r.y*.55);
  let l=Math.max(r.x,edge-7),right=Math.min(r.x+r.w-1,edge+12);
  if(l<=right)rectfill(x+l,y+r.y,x+right,y+r.y,"#c5e7ed");
  l=Math.max(r.x,edge-1);right=Math.min(r.x+r.w-1,edge+5);
  if(l<=right)rectfill(x+l,y+r.y,x+right,y+r.y,"#f2fcff");
 }
 for(let i=0;i<2;i++){
  const life=Math.abs(phase-(i===0?33:60));if(life>4)continue;
  const radius=5-life,gx=Math.floor(x+word.width*(i===0?.27:.70)),gy=y+(i===0?1:word.height-3);
  line(gx-radius,gy,gx+radius,gy,"#c5e7ed");line(gx,gy-radius,gx,gy+radius,"#c5e7ed");
  line(gx-1,gy,gx+1,gy,"#ffffff");line(gx,gy-1,gx,gy+1,"#ffffff");
 }
}
