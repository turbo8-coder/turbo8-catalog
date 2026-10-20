const F='fusion-pixel-10', FH='fusion-pixel-12';
let W=512,H=288, tick=0, mode='title', stage=0, cam=0, hp=3, seeds=0, elapsed=0;
let bridgeTime=0, bridgeLocked=false, stageSeeds=0, bumps=0;
let p, mother, leopard, landings=[], stones=[], gems=[], sparks=[], message='', messageTime=0, helped=false, checkpoint=60;
const stages=[
{name:'第一程 · 妈妈，等等我',length:1050,gap:[620,748],rocks:[270,450],gems:[170,330,520,683,860],kind:'help'},
{name:'第二程 · 豹拉的石桥',length:1180,gap:[580,800],rocks:[240,400,930],gems:[160,310,470,675,1010],kind:'timed'},
{name:'第三程 · 这次我来带路',length:1260,gap:[620,850],rocks:[250,440,1030],gems:[170,330,530,720,1130],kind:'hop'}
];
const stepping=[{x:640,y:224,w:40},{x:692,y:201,w:48},{x:754,y:213,w:48},{x:820,y:224,w:54}];

function say(s,n=110){message=s;messageTime=n;}
function resetStage(){const st=stages[stage];cam=0;checkpoint=60;helped=false;bridgeTime=0;bridgeLocked=false;stageSeeds=seeds;sparks.length=0;
p={x:60,y:224,vy:0,vx:0,ground:true,face:1,walk:0,land:0,call:0,hurt:0,jump:0,preJump:0};
mother={x:stage===2?st.gap[1]+90:160,walk:0,moving:false,reply:0};leopard={x:stage===1?st.gap[0]-70:st.gap[1]+95,walk:0,moving:false};
stones=st.rocks.map(x=>({x,y:224,w:stage===0?38:28,h:stage===0?25:14,snake:stage===0}));
gems=st.gems.map((x,i)=>({x,y:(x>st.gap[0]&&x<st.gap[1])?171:172+(i%2)*12,got:false}));
say(stage===0?'方向键移动 · B 跳跃 · A 呼唤妈妈':stage===1?'豹拉在河边等你。A 呼唤，石桥维持七秒。':'妈妈在对岸等你。看准高低石头，再起跳。',180);}
function _init(){const sz=screen_size();W=sz.width;H=sz.height;prepareMaker();resetStage();}
function start(){mode='play';stage=0;hp=3;seeds=0;elapsed=0;bumps=0;resetStage();music(0);}
function burst(x,y,c){for(let i=0;i<9;i++)if(sparks.length<70)sparks.push({x,y,vx:Math.cos(i*2.4)*1.8,vy:-1-Math.sin(i)*2,t:22,c});}
function hurt(snake=false){if(p.hurt||mode!=='play')return;hp--;bumps++;p.hurt=42;sfx(2);burst(p.x,p.y-20,9);
if(hp<=0){mode='lose';return;}p.x=checkpoint;p.y=224;p.vy=0;p.vx=0;p.ground=true;say(snake?'小绳头在前面！按 B 跳过它。':'跌倒了也能站起来。再试一次！');}
function groundAt(x){const st=stages[stage],g=st.gap;if(x>g[0]&&x<g[1]){if(st.kind==='hop'){for(let s of stepping)if(Math.abs(x-s.x)<s.w/2)return s.y;return 999;}return helped?224:999;}return 224;}
function _update(){tick++;if(mode==='title'){if(btnp(4))showMaker();return;}
if(mode==='maker'){if(btnp(5))mode='title';else if(btnp(4))start();return;}
if(mode==='lose'||mode==='win'){if(btnp(5)){mode='title';stage=0;resetStage();}else if(btnp(4)){if(mode==='lose'){hp=3;seeds=stageSeeds;resetStage();mode='play';}else start();}return;}
if(mode==='next'){if(btnp(5)){mode='title';resetStage();return;}if(btnp(4)){stage++;hp=Math.min(3,hp+1);resetStage();mode='play';}return;}
elapsed++;if(messageTime>0)messageTime--;if(p.hurt>0)p.hurt--;if(p.land>0)p.land--;if(p.call>0)p.call--;if(mother.reply>0)mother.reply--;
if(bridgeTime>0&&!bridgeLocked&&--bridgeTime===0){helped=false;say('石桥沉下去了。回到豹拉身边，按 A 再试。');}
const st=stages[stage];let dir=(btn(1)?1:0)-(btn(0)?1:0);
p.vx+=(dir*2.35-p.vx)*0.42;if(Math.abs(p.vx)<0.07)p.vx=0;
if(dir)p.face=dir;
if(btnp(5)&&p.ground&&!p.preJump)p.preJump=2;
if(p.preJump>0&&--p.preJump===0){p.vy=-8.3;p.ground=false;p.jump=0;sfx(0);}
if(btnp(4)&&!p.call){p.call=22;mother.reply=44;sfx(3);
if(st.kind==='hop'){say('牛来：这次我能行！B 跳上高处的石头。');}
else if(st.kind==='timed'&&Math.abs(p.x-leopard.x)<150&&p.x>st.gap[0]-180&&!bridgeLocked){helped=true;bridgeTime=210;say('豹拉：石桥撑住了！快过来！',95);burst(st.gap[0]+32,215,18);}
else if(st.kind==='help'&&Math.abs(p.x-mother.x)<135&&p.x>st.gap[0]-180&&!helped){helped=true;say('妈妈：牛来，踩着石头，慢慢过来。',150);burst(st.gap[0]+32,215,18);}
else if(st.kind==='timed')say('靠近河边的豹拉，按 A 请他帮忙。');
else if(Math.abs(p.x-mother.x)<135)say(stage===0?'妈妈：牛来，小心草蛇，B 跳过去。':'妈妈：看清脚下，B 跳过石头。');
else say('妈妈：我在前面等你！');}

let oldY=p.y,oldX=p.x;p.x=Math.max(24,Math.min(st.length-28,p.x+p.vx));
if(!p.ground){p.jump++;p.vy+=btn(5)&&p.vy<0?0.34:0.53;p.y+=p.vy;}
let gy=groundAt(p.x);if(p.ground&&gy<p.y-6){p.x=oldX;p.vx=0;gy=groundAt(p.x);}if(p.vy>=0&&oldY<=gy+2&&p.y>=gy){if(!p.ground){p.land=7;sfx(1);}p.y=gy;p.vy=0;p.ground=true;}else if(p.ground&&gy>p.y+2){p.ground=false;p.vy=0;}
if(p.y>H+45)hurt();
if(p.ground&&Math.abs(p.vx)>.2)p.walk+=Math.abs(p.vx);
for(let r of stones){if(Math.abs(p.x-r.x)<r.w/2+9&&p.y>r.y-r.h+5&&p.y<r.y+20){hurt(r.snake);break;}}
for(let g of gems){if(!g.got&&Math.abs(p.x-g.x)<24&&Math.abs(p.y-30-g.y)<36){g.got=true;seeds++;sfx(4);burst(g.x,g.y,10);}}
if(!helped&&st.kind!=='hop'&&p.x>st.gap[0]-155&&p.x<st.gap[0]&&messageTime<30)say(st.kind==='timed'?'河边的豹拉能撑起石桥。按 A 呼唤。':'前面是河流，按 A 请妈妈帮忙。',90);
if(p.x>st.gap[0]-155&&p.x<st.gap[0]&&checkpoint===60)checkpoint=st.gap[0]-155;
let target=Math.min(st.gap[0]-62,p.x+110);
if(helped)target=Math.min(st.length-105,p.x+105);
if(st.kind==='hop')target=st.length-115;
let md=Math.max(-1.4,Math.min(1.4,target-mother.x));mother.x+=md;mother.walk+=Math.abs(md);mother.moving=Math.abs(md)>.1;
if(st.kind==='timed'&&helped){let ld=Math.max(0,Math.min(1.5,p.x+65-leopard.x));leopard.x+=ld;leopard.walk+=ld;leopard.moving=ld>.1;}
if(p.x>st.gap[1]+28&&checkpoint<st.gap[1]){bridgeLocked=true;checkpoint=st.gap[1]+28;say('云雀：做得好，前面就是集合点！');}
if(p.x>st.length-100){mode=stage===stages.length-1?'win':'next';sfx(5);}
cam=Math.max(0,Math.min(st.length-W,p.x-155));
for(let i=sparks.length-1;i>=0;i--){let a=sparks[i];a.x+=a.vx;a.y+=a.vy;a.vy+=.12;if(--a.t<=0)sparks.splice(i,1);}
}
function text(s,x,y,c=7,font=F){bprint(s,Math.floor(x),Math.floor(y),c,font);}
function center(s,y,c=7,font=F){text(s,(W-text_size(s,font).width)/2,y,c,font);}
const calfRows=[0,320,635,938,1254], calfBase=[309,306,309,309,299,300,299,298,290,291,279,303,284,285,284,287];
function calf(frame,x,y,flip=false,size=68){const row=Math.floor(frame/4),cx=Math.floor((frame%4)*313.5),cw=Math.floor(((frame%4)+1)*313.5)-cx,sy=calfRows[row],sh=calfRows[row+1]-sy,sc=size/313.5;
image_region('calf',cx,sy,cw,sh,Math.floor(x-size/2),Math.floor(y-calfBase[frame]*sc),size,sh*sc,flip);}
function friendFrame(frame,x,y,w,h){const ys=[0,350,699,1014,1254];let row=Math.floor(frame/4),cx=Math.floor((frame%4)*313.5),cw=Math.floor(((frame%4)+1)*313.5)-cx;
image_region('friends',cx,ys[row],cw,ys[row+1]-ys[row],x-w/2,y-h,w,h);}
function mom(frame,x,y){friendFrame(frame,x,y+1,90,110);}
function cat(frame,x,y){friendFrame(9+Math.min(2,frame),x,y+1,62,64);}
function rock(x,y,w=36,h=20){friendFrame(14,x,y,w,h);}
function sign(x,y){friendFrame(15,x,y,36,34);}
function bird(x,y){friendFrame(12+Math.floor(tick/7)%2,x,y+12,32,24);}
function shadow(x,y,w){const airborne=Math.abs(x-(p.x-cam))<1?Math.max(0,224-p.y):0;const ww=Math.max(3,Math.floor(w*.65-airborne*.025));ellipsefill(Math.floor(x),Math.floor(y)+1,ww,3,20);ellipsefill(Math.floor(x),Math.floor(y)+1,Math.max(2,ww-3),1,21);}
function scenery(decor=true){cls(1);image_region('land',0,0,1672,941,-Math.floor(cam*.12)%120,0,640,288,stage===1);
let off=-(Math.floor(cam)%512);for(let i=0;i<3;i++)image_region('land',0,740,1672,201,off+i*512,224,512,64);
if(!decor)return;
const st=stages[stage], gx=st.gap[0]-cam,gw=st.gap[1]-st.gap[0];
if(gx<W&&gx+gw>0){image_region('river',Math.floor(tick/3)%160,0,1600,887,gx,224,gw,64);
for(let k=0;k<4;k++){rock(gx-3+(k%2)*3,239+k*15,20-k*2,19);rock(gx+gw+2-(k%2)*4,238+k*15,23-k*2,21);}
if(st.kind==='hop'){for(let s of stepping)rock(s.x-cam,s.y+8,s.w,25);}else if(helped){for(let x=st.gap[0]+15;x<st.gap[1];x+=30)rock(x-cam,229,40,23);}else{rock(gx-5,233,30,22);rock(gx+gw+5,233,30,22);}}
for(let r of stones)if(r.x-cam>-40&&r.x-cam<W+40){if(r.snake)drawSnake(r.x-cam,r.y,Math.floor(tick/9+ r.x/40)%4);else rock(r.x-cam,r.y+2,r.w+8,r.h+5);}
sign(116-cam,224);sign(st.length-68-cam,224);
for(let g of gems)if(!g.got&&g.x-cam>-15&&g.x-cam<W+15){let yy=g.y+Math.sin(tick*.08+g.x)*3;circfill(g.x-cam,yy,5,9);circfill(g.x-cam-1,yy-1,3,10);line(g.x-cam,yy-8,g.x-cam,yy-6,7);}
}
function drawActors(){let my=224;shadow(mother.x-cam,my,20);mom(mother.moving?Math.floor(mother.walk/5)%8:8,mother.x-cam,my);
shadow(leopard.x-cam,224,12);cat(leopard.moving?1+Math.floor(leopard.walk/6)%2:0,leopard.x-cam,224);
bird(p.x-cam+65,110+Math.sin(tick*.06)*6);
let f=8;if(p.hurt>30)f=14;else if(p.call)f=15;else if(p.preJump)f=9;else if(!p.ground)f=p.vy<-3?10:p.vy<2?11:p.y>groundAt(p.x)-26?13:12;else if(p.land)f=p.land>4?14:p.land>2?13:8;else if(Math.abs(p.vx)>.2)f=Math.floor(p.walk/4)%8;
if(p.y<=224)shadow(p.x-cam,224,12);
if(p.hurt%6<4)calf(f,p.x-cam,p.y,p.face<0);
for(let a of sparks)rectfill(a.x-cam,a.y,a.x-cam+1,a.y+1,a.c);
if(p.call){let xx=Math.max(10,Math.min(W-70,p.x-cam-66));box(xx,65,60,23);text('妈妈！',xx+8,69,17,FH);}
if(mother.reply){const mx=mother.x-cam,off=mx<30||mx>W-30;const w=off?96:60;const xx=Math.max(10,Math.min(W-w-10,mx-w/2));box(xx,89,w,23);text(off?'妈妈：牛来！':'牛来！',xx+8,93,18,FH);}
}

function box(x,y,w,h,fill=16){rectroundfill(x,y,x+w-1,y+h-1,4,fill);}
function label(s,x,y,col=17,font=FH){text(s,x+1,y+1,16,font);text(s,x,y,col,font);}
function heart(x,y,on){let c=on?18:19;circfill(x-2,y-1,3,c);circfill(x+2,y-1,3,c);for(let j=0;j<5;j++)line(x-5+j,y+j,x+5-j,y+j,c);}
function keycap(key,x,y){box(x,y,18,18,18);text(key,x+5,y+3,16,F);}
function control(key,desc,x,y){keycap(key,x,y);label(desc,x+24,y+2,17,F);}
function hud(){
box(10,8,248,28);text(stages[stage].name,19,14,17,FH);
box(W-125,8,115,28);for(let i=0;i<3;i++)heart(W-109+i*16,20,i<hp);text('星光 '+seeds,W-62,15,18,F);
let ratio=Math.max(0,Math.min(1,p.x/(stages[stage].length-100)));
line(18,41,246,41,19);line(18,41,18+228*ratio,41,18);circfill(18+228*ratio,41,2,17);
if(messageTime){let tw=text_size(message,FH).width;box((W-tw)/2-12,254,tw+24,28);center(message,260,17,FH);}
else{box(119,258,274,25);text('方向键 移动   B 跳跃   A 呼唤',134,264,17,F);}
if(stages[stage].kind==='timed'&&helped&&!bridgeLocked){box(W/2-51,52,102,25);text('石桥 '+Math.ceil(bridgeTime/30)+' 秒',W/2-39,58,18,FH);}
if(!helped&&stages[stage].kind!=='hop'&&p.x>stages[stage].gap[0]-155){let x=(stage===1?leopard.x:mother.x)-cam;box(x-20,98,40,22);text('A 求助',x-16,102,18,F);}
}
function titleScreen(){
image_region('title_ink',0,0,1672,941,28,27,218,123);
label('跟 上 妈 妈',57,149,17,FH);
label('三段旅程，一起走到终点。',29,181,17,F);
box(28,207,159,30);keycap('A',38,213);text('开始同行',67,214,17,FH);
mom(8,350,224);cat(0,434,224);calf(8,274,224,false,78);bird(410,90+Math.sin(tick*.05)*3);
box(25,259,462,23);text('方向键 移动',40,264,17,F);text('B 跳跃',191,264,17,F);text('A 呼唤妈妈',310,264,17,F);
}
function resultScreen(){
const lose=mode==='lose',win=mode==='win';
box(58,65,396,125);line(78,75,434,75,18);
center(lose?'再站起来一次':win?'牛来，你已经学会勇敢了':'一起走过了这一程',86,18,FH);
center(lose?'妈妈在等你。看清石头，再起跳。':'收集星光 '+seeds+'   ·   同行 '+Math.floor(elapsed/30)+' 秒',115,17,FH);
if(win)center(seeds>=13?'星光满途 · 最勇敢的牛来':seeds>=9?'伙伴同行 · 闪亮的旅程':'平安抵达 · 下次收集更多星光',136,18,F);
center(mode==='next'?'A 继续旅程   ·   B 返回封面':lose?'A 重试本程   ·   B 返回封面':'A 再次出发   ·   B 返回封面',165,17,F);
}
function _draw(){scenery(mode!=='title'&&mode!=='maker');
if(mode==='maker'){drawMaker();return;}
if(mode==='title'){titleScreen();return;}
drawActors();hud();
if(mode==='lose'||mode==='win'||mode==='next')resultScreen();
}

const makerQuotes=['把电影牛来做成游戏','优化UI和文字，封面使用电影字体'];
let makerLines=[];
function prepareMaker(){
  makerLines=makerQuotes.map(quote=>{
    const lines=[];let row='';
    for(const ch of quote){
      if(row&&text_size(row+ch,FH).width>W-180){lines.push(row);row='';}
      row+=ch;
    }
    if(row)lines.push(row);
    return lines;
  });
}
function showMaker(){mode='maker';sfx(3);}
function drawMaker(){
  box(24,16,W-48,H-32,16);
  line(43,36,79,36,18);text('TURBO8 · 创作手记',91,29,18,F);
  center('这个游戏由两句话生成',57,17,FH);
  line(55,96,55,199,19);
  const labels=['第一句 · 让想法成为游戏','第二句 · 让角色回到电影'];
  for(let i=0;i<2;i++){
    const y=94+i*64;
    box(43,y,25,21,18);text(i===0?'01':'02',49,y+4,16,F);
    text(labels[i],82,y+1,18,F);
    for(let j=0;j<makerLines[i].length;j++)text(makerLines[i][j],82,y+23+j*18,17,FH);
  }
  line(43,224,W-44,224,19);
  center('从一个念头，到一起走过三段旅程。',234,18,F);
  center('A 开始同行     B 返回封面',253,17,F);
}

function drawSnake(x,y,frame){
  const base=frame<2?30:29;
  for(let ty=0;ty<4;ty++)for(let tx=0;tx<6;tx++)spr(frame*24+ty*6+tx,Math.floor(x)-24+tx*8,y-base+ty*8);
}
