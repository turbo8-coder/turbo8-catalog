
const F='fusion-pixel-10', FH='fusion-pixel-12';
let mode='title',tick=0,chapter=0,px=175,py=214,vy=0,face=1,walk=0,cam=0,pose=8,act=0,done=[false,false,false],near=-1;
let game=0,phase=0,cursor=0,tries=3,won=false,notice='',clock=0;
let land=0,jumpCharge=0,pendingGame=-1;
let bulbs=[0,0,0],chosen=[false,false,false],mistakes=0,flash=0,stepsUsed=0;
const sources=[['利器 · 拼命玩三郎访谈（2016-07-13）','liqi.io/liangtiexin/'],['利器 · 拼命玩三郎访谈（2016-07-13）','liqi.io/liangtiexin/'],['触乐 · 一个人和中国Game Jam的十年','chuapp.com/article/290508.html'],['新声Pro / 界面 · 私人游戏博物馆','jiemian.com/article/11043773.html']];
const actionNames=['试玩','制作','协作','修复'];
const chapters=['2008 · 每日三款','2014 · 从玩到做','2015 · 让创意相遇','2023 · 记忆继续游玩'];
const labels=[['探索','节奏','解谜'],['原型','打磨','发布'],['创意','协作','路演'],['修复','连接','分享']];
function say(s,x,y,c=12,font=F){bprint(s,Math.floor(x),Math.floor(y),c,font);}
function mid(s,y,c=12,font=F){const m=text_size(s,font);say(s,(512-m.width)/2,y,c,font);}
function _init(){music(0);log('BEGIN chapter 0');}
function start(){mode='room';px=175;py=214;vy=0;done=[false,false,false];cam=0;pose=8;land=0;act=0;pendingGame=-1;jumpCharge=0;notice='← → 移动 · 靠近工作台按 A '+actionNames[chapter]+' · B 跳跃';log('CHAPTER '+chapter);}
function enter(i){game=i;phase=0;clock=0;cursor=0;tries=3;won=false;mode='game';notice='';bulbs=[[1,0,1],[0,1,0],[0,0,1]][i].slice();chosen=[false,false,false];stepsUsed=0;log('ENTER '+chapter+':'+game);}
function finish(){done[game]=true;mode='card';sfx(1);log('COMPLETE '+chapter+':'+game);}
function _update(){
 tick++;if(flash>0)flash--;
 if(mode==='title'){if(btnp(4)){start();sfx(0);}return;}
 if(mode==='card'){if(btnp(4)){mode='room';act=0;pose=8;}return;}
 if(mode==='chapter'){if(btnp(4)){if(chapter===3){mode='end';log('ALL CHAPTERS COMPLETE');}else{chapter++;start();}}return;}
 if(mode==='end'){if(btnp(4)){chapter=0;mistakes=0;start();}if(btnp(5))mode='sources';return;}
 if(mode==='sources'){if(btnp(4)||btnp(5))mode='end';return;}
 if(mode==='fail'){if(btnp(4))enter(game);if(btnp(5))mode='room';return;}
 if(mode==='game'){clock++;if(btnp(5)){mode='room';return;}updateGame();return;}
 if(act>0){
  act--;pose=act>12?15:act>5?16:17;
  if(act===0&&pendingGame>=0){const selected=pendingGame;pendingGame=-1;enter(selected);}
  return;
 }
 const dx=(btn(1)?1:0)-(btn(0)?1:0);
 if(dx){px=Math.max(28,Math.min(610,px+dx*1.8));face=dx;walk++;}
 else walk=0;
 if(btnp(5)&&py>=214&&jumpCharge===0){jumpCharge=3;sfx(2);}
 if(jumpCharge>0){jumpCharge--;if(jumpCharge===0)vy=-7.4;}
 py+=vy;vy+=0.55;
 if(py>=214){if(vy>1)land=9;py=214;vy=0;}
 if(land>0)land--;
 pose=jumpCharge>0?9:py<214?(vy<-1?10:vy<2?11:12):land>4?13:land>0?14:dx?Math.floor(walk/4)%8:8;
 const targetCam=Math.max(0,Math.min(128,px-208));
 cam+=(targetCam-cam)*0.3;if(Math.abs(targetCam-cam)<0.1)cam=targetCam;
 near=-1;
 for(let i=0;i<3;i++)if(Math.abs(px-(240+i*120))<42)near=i;
 if(btnp(4)&&near>=0&&py===214){
  face=px<240+near*120?1:-1;act=18;pose=15;sfx(0);
  if(done[near]){notice='这段回忆已点亮，去试试下一台。';pendingGame=-1;}
  else pendingGame=near;
 }
 if(px>576&&done.every(Boolean)&&btnp(4)){mode='chapter';log('CHAPTER COMPLETE '+chapter);}

}
function updateOpening(){
 if(game===0){
  if(btnp(0))cursor=Math.max(0,cursor-1);if(btnp(1))cursor=Math.min(4,cursor+1);
  if(btnp(4)){const target=[1,3,2][phase];if(cursor===target){phase++;sfx(1);if(phase===3)finish();}else{tries--;mistakes++;flash=8;sfx(3);}}
 }else if(game===1){
  cursor=(clock*3)%360;
  if(btnp(4)){if(cursor>=142&&cursor<=218){phase++;clock=0;sfx(1);if(phase===3)finish();}else{tries--;sfx(3);}}
 }else{
  if(btnp(0))cursor=(cursor+2)%3;if(btnp(1))cursor=(cursor+1)%3;
  if(btnp(4)){if(cursor===[2,0,1][phase]){phase++;sfx(1);if(phase===3)finish();}else{tries--;sfx(3);}}
 }
 if(tries<=0){mode='fail';log('FAIL '+chapter+':'+game);}
}
function miss(){tries--;mistakes++;flash=8;sfx(3);if(tries<=0){mode='fail';log('FAIL '+chapter+':'+game);}}
function moveChoice(n){if(btnp(0))cursor=(cursor+n-1)%n;if(btnp(1))cursor=(cursor+1)%n;}
function advance(){phase++;sfx(1);flash=8;}
const jamRequests=[
 [[0,'角色不能移动'],[1,'主角缺少表情'],[2,'需要开场旋律'],[0,'碰撞穿过墙壁']],
 [[2,'需要脚步声'],[0,'按钮没有响应'],[1,'需要游戏图标'],[2,'结尾缺少乐曲']],
 [[1,'舞台画面未完成'],[2,'没有成功音效'],[0,'开始按钮失灵'],[1,'需要片尾插画']]
];
function updateGame(){
 if(chapter===0){updateOpening();return;}
 if(chapter===1){
  if(game===0){moveChoice(3);if(btnp(4)){if(cursor===[1,0,2][phase]){advance();if(phase===3)finish();}else miss();}}
  if(game===1){moveChoice(5);if(btnp(4)){const target=[2,4,1,3][phase];if(cursor===target){advance();if(phase===4)finish();}else miss();}}
  if(game===2){moveChoice(3);if(btnp(4)&&!chosen[cursor]){chosen[cursor]=true;sfx(0);const cost=(chosen[0]?2:0)+(chosen[1]?5:0)+(chosen[2]?3:0);if(cost>5||(chosen[1]&&cost===5)){mode='fail';mistakes++;log('FAIL scope budget');}else if(chosen[0]&&chosen[2])finish();}}
 }else if(chapter===2){
  moveChoice(3);
  if(clock>900-game*120){mode='fail';mistakes++;log('FAIL jam deadline');return;}
  if(btnp(4)){if(cursor===jamRequests[game][phase][0]){advance();if(phase===4)finish();}else miss();}
 }else{
  moveChoice(3);
  if(btnp(4)){stepsUsed++;for(let j=Math.max(0,cursor-1);j<=Math.min(2,cursor+1);j++)bulbs[j]=1-bulbs[j];sfx(0);if(bulbs.every(Boolean))finish();else if(stepsUsed>=8){mode='fail';mistakes++;log('FAIL circuit');}}
 }
}
