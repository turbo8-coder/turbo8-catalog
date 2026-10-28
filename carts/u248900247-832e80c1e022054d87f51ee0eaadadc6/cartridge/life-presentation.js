function actor(x,y,f,flip){
 for(let ty=0;ty<10;ty++)for(let tx=0;tx<8;tx++)
  spr(f*80+ty*8+tx,Math.floor(x-32+(flip?7-tx:tx)*8),Math.floor(y-76+ty*8),1,1,flip,false);
}
function terminal(x,id){
 for(let ty=0;ty<10;ty++)for(let tx=0;tx<8;tx++)
  spr(1440+id*80+ty*8+tx,Math.floor(x-32+tx*8),138+ty*8);
 const label=done[id]?'已点亮':labels[chapter][id];
 const tw=text_size(label,F).width;
 rectfill(Math.floor(x-tw/2-5),130,Math.floor(x+tw/2+4),144,0);
 say(label,x-tw/2,130,done[id]?13:12);
 if(done[id]){line(x-4,151,x-1,154,13);line(x-1,154,x+5,148,13);}
 if(near===id&&mode==='room'){
  const hint=done[id]?'A 阅读':'A '+actionNames[chapter];const hw=text_size(hint,F).width;
  rectroundfill(Math.floor(x-hw/2-6),109,Math.floor(x+hw/2+5),125,3,0);
  say(hint,x-hw/2,110,12);line(x-2,126,x,128,14);line(x,128,x+2,126,14);
 }
}
function foreground(f,x,y){
 const base=1680+f*216;
 for(let ty=0;ty<12;ty++)for(let tx=0;tx<18;tx++){
  const dx=Math.floor(x+tx*8);if(dx>=-7&&dx<512)spr(base+ty*18+tx,dx,y+ty*8);
 }
}
function room(){
 camera();cls(0);
 const bg=['study','studio','jam','museum'][chapter],sz=image_size(bg);
 image_region(bg,0,0,sz.width,sz.height,-Math.floor(cam),-20,640,288);
 for(let i=0;i<3;i++)terminal(240+i*120-cam,i);
 ellipsefill(Math.floor(px-cam),214,13,2,15);actor(px-cam,py,pose,face<0);
 foreground(0,-14-cam,187);foreground(1,535-cam,190);
 if(done.every(Boolean)){
  rectroundfill(555-Math.floor(cam),150,633-Math.floor(cam),169,3,0);
  say('A 下一段人生',560-cam,152,12);
 }
 const headW=text_size(chapters[chapter],FH).width+20;
 rectroundfill(8,7,8+headW,32,3,0);rectround(8,7,8+headW,32,3,5);
 say(chapters[chapter],17,12,12,FH);
 rectroundfill(411,7,503,32,3,0);rectround(411,7,503,32,3,5);
 for(let i=0;i<3;i++){rectfill(421+i*27,13,439+i*27,26,done[i]?13:2);if(done[i]){line(425+i*27,19,429+i*27,23,0);line(429+i*27,23,435+i*27,15,0);}}
 const hint=near>=0?'A '+(done[near]?'阅读':actionNames[chapter])+'   B 跳跃   ← → 移动':'← → 移动   A 互动   B 跳跃';
 const hw=text_size(hint,F).width;
 rectroundfill(Math.floor((512-hw)/2)-9,267,Math.floor((512+hw)/2)+8,286,3,0);
 mid(hint,269,11);
}

const facts=[
 ['2008 年，拼命玩三郎开始每天推荐三款小游戏。','到 2013 年，亲自试玩并写推荐已超过 5000 款。','网站后来发展为 WanGa.me「拼命玩游戏」。'],
 ['2014 年，他创办壕游戏，担任创意总监。','团队开发了《锻冶屋英雄谭》。','《锻冶屋英雄谭》曾获 App Store 推荐。'],
 ['2015 年，他参与筹办广州 Game Jam。','开发者聚在一起，把想法做成可玩的作品。','他也主导了纪录片《独行》的拍摄。'],
 ['万物破元电子游戏博物馆于 2023 年开放。','收藏不只用来观看，也让访客真正上手体验。','许多展出的游戏设备来自他的个人收藏。']
];
function drawOpening(){
 challengeBackdrop();
 mid(labels[chapter][game]+' · '+['寻找有趣的路线','抓住节奏的瞬间','读懂游戏的规则'][game],12,12,FH);
 mid('进度 '+phase+'/3     机会 '+tries,47,11);
 if(game===0){
  mid('观察亮起的星星，左右选格，再按 A 收集。',79,12);
  for(let i=0;i<5;i++){let x=87+i*72;rectroundfill(x-25,123,x+25,184,4,i===cursor?3:2);rect(x-25,123,x+25,184,i===cursor?13:4);say(String(i+1),x-4,189,11);}
  const tx=87+[1,3,2][phase]*72;star(tx,109,14);
  actor(87+cursor*72,182,8,false);
 } else if(game===1){
  mid('指针进入青色区域时按 A，连续完成三次。',83,12);
  rectfill(76,142,436,168,2);rectfill(218,142,294,168,13);
  for(let j=0;j<13;j++)line(76+j*30,172,76+j*30,176,4);
  rectfill(74+cursor,134,78+cursor,179,12);star(256,114,14);
 }else{
  mid('按照提示选出下一项：  音乐 → 探索 → 创意',82,12);
  const choices=['探索','创意','音乐'];
  for(let i=0;i<3;i++){let x=114+i*142;rectroundfill(x-51,127,x+51,191,4,i===cursor?3:2);say(choices[i],x-20,153,12,FH);}
  mid('当前要找：'+['音乐','探索','创意'][phase],211,13);
 }
 mid('本挑战为虚构玩法，用来体验发现与分享。',236,11);mid('← → 选择    A 确认    B 返回场景',268,11);
}
function star(x,y,c){line(x-7,y,x+7,y,c);line(x,y-7,x,y+7,c);line(x-4,y-4,x+4,y+4,c);line(x-4,y+4,x+4,y-4,c);}
function _draw(){
 camera();
 if(mode==='title'){drawTitle();return;}
 if(mode==='game'){drawGame();return;}
 if(mode==='sources'){drawSources();return;}
 if(mode==='end'){drawEnding();return;}
 if(mode==='fail'){cls(0);mid(chapter===1&&game===2?'功能超出范围了':'再试一次，就有新发现',92,14,FH);mid(chapter===1&&game===2?'先保住移动与核心交互，暂缓联机。':'保留本章已完成任务，立即重试这一项。',128,11);mid('A 立即重试     B 返回场景',183,13);return;}
 room();
 if(mode==='card'){
  rectfill(28,44,484,132,0);say('回忆 '+(game+1)+'/3',44,53,13,FH);say(facts[chapter][game],44,78,12);
  say('来源：'+sources[chapter][0],44,99,11);say(sources[chapter][1]+'    A 继续',44,115,11);
 }
 if(mode==='chapter'){
  rectfill(22,52,489,163,0);mid(['分享，让热爱被看见','创作，把热爱变成作品','相遇，让创意不再孤单','保存，让记忆继续游玩'][chapter],65,12,FH);
  mid('本章三段回忆已点亮',96,13);mid(chapter===3?'A 走向结局':'A 进入 '+chapters[chapter+1],124,11);
 }
}

function gameFrame(title,subtitle){
 challengeBackdrop();
 mid(title,12,12,FH);mid(subtitle,46,11);
 mid('本挑战为虚构玩法；史实与来源在完成后的回忆中。',237,11);
 mid('← → 选择    A 确认    B 返回场景',268,11);
}
function choiceCards(names){
 for(let i=0;i<names.length;i++){
 const x=114+i*142;rectroundfill(x-53,128,x+53,194,4,i===cursor?3:1);rectround(x-53,128,x+53,194,4,i===cursor?13:4);
 const m=text_size(names[i],F);say(names[i],x-m.width/2,171,12);
 if(chapter===2){portrait(x,145,i);}
 else{rectfill(x-11,139,x+11,157,5);rectfill(x-8,142,x+8,154,12);line(x-5,146,x+5,146,2);line(x-5,151,x+3,151,2);}
 }
}
function portrait(x,y,i){
 // Authored static colleague portraits, separate from player animation.
 rectfill(x-9,y-10,x+9,y+9,[3,14,4][i]);rectfill(x-6,y-9,x+6,y+2,6);
 rectfill(x-7,y-12,x+7,y-7,0);if(i===1)rectfill(x-9,y-8,x-7,y+4,0);
 rectfill(x-3,y-4,x-2,y-3,0);rectfill(x+3,y-4,x+4,y-3,0);line(x-1,y+1,x+3,y+1,5);
}
function drawGame(){
 if(chapter===0){drawOpening();return;}
 if(chapter===1&&game===0){
 gameFrame('原型工坊 · 排好开发步骤','完成 '+phase+'/3   机会 '+tries);
 mid('先做什么？从小而完整的体验开始。',81,13);
 mid(['第1步：先确定玩家要做什么','第2步：把规则做成能运行的东西','第3步：邀请玩家验证是否好玩'][phase],104,12);
 choiceCards(['制作原型','确定玩法','邀请试玩']);
 }else if(chapter===1&&game===1){
 gameFrame('打磨工坊 · 找出异常','已修复 '+phase+'/4   机会 '+tries);
 mid('找出红色异常点，左右选择后按 A 修复。',87,12);
 for(let i=0;i<5;i++){const x=88+i*84;rectfill(x-24,128,x+24,185,i===cursor?3:1);rect(x-24,128,x+24,185,i===cursor?13:4);
 if(i===[2,4,1,3][phase]){circfill(x,151,9,5);line(x-12,144,x+12,158,14);line(x-12,158,x+12,144,14);rectfill(x-3,146,x-2,148,12);rectfill(x+3,146,x+4,148,12);}
 else{line(x-9,150,x-2,158,13);line(x-2,158,x+11,143,13);} }
 }else if(chapter===1){
 const cost=(chosen[0]?2:0)+(chosen[1]?5:0)+(chosen[2]?3:0);
 gameFrame('发布工坊 · 小而完整','开发时间 '+cost+'/5');
 mid('必须能移动，也能完成核心交互。',82,12);mid('只有5天：先做必需功能，联机留给以后。',103,13);
 choiceCards(['移动 · 2天','联机 · 5天','核心交互 · 3天']);
 for(let i=0;i<3;i++)if(chosen[i])say('已选',100+i*142,203,13);
 }else if(chapter===2){
 gameFrame('Game Jam · '+['组织分工','推进协作','准备路演'][game],'任务 '+phase+'/4   剩余 '+Math.max(0,Math.ceil((900-game*120-clock)/30))+'秒   机会 '+tries);
 mid(jamRequests[game][phase][1]+'：交给哪位伙伴？',88,12,FH);
 choiceCards(['程序伙伴','美术伙伴','音乐伙伴']);
 mid('程序负责规则 · 美术负责画面 · 音乐负责声音',208,13);
 }else{
 gameFrame('博物馆 · '+['点亮老主机','连接体验台','开启共享展区'][game],'操作 '+stepsUsed+'/8');
 mid('A 切换所选灯和相邻灯，全部点亮即可连通。',86,12);
 line(68,154,444,154,4);
 for(let i=0;i<3;i++){
 const x=114+i*142;rectroundfill(x-36,120,x+36,191,5,1);rectround(x-36,120,x+36,191,5,i===cursor?12:4);
 circfill(x,146,13,bulbs[i]?13:2);circ(x,146,16,bulbs[i]?4:3);
 if(bulbs[i]){line(x-5,147,x-1,151,0);line(x-1,151,x+7,141,0);}
 say(bulbs[i]?'已通电':'未通电',x-15,171,bulbs[i]?13:11);
 }
 mid('选择位置很重要：一次操作会影响左右邻居。',208,11);
 }
 if(flash>0){rect(3,3,508,284,tries<3?14:13);}
}
function drawEnding(){
 cls(0);image_region('museum',0,0,1672,941,0,0,512,288);
 rectfill(16,35,329,211,0);say('拼命玩，也认真分享',29,47,12,FH);
 say('12段回忆，4段人生旅程。',29,79,13);
 say('从每天三款小游戏，到独立创作，',29,106,11);
 say('从开发者的相遇，到可游玩的博物馆。',29,124,11);
 say('你点亮的，是一段仍在继续的游戏人生。',29,150,12);
 say('这是依据公开经历创作的非官方改编。',29,179,11);
 actor(405,242,8,false);
 rectfill(0,260,511,287,0);mid('A 再玩一次     B 资料来源',269,12);
}
function drawSources(){
 cls(0);mid('事迹来源与改编说明',18,12,FH);
 say('人物：拼命玩三郎',22,49,13);
 say('1. 利器：拼命玩三郎访谈，2016-07-13',22,76,11);
 say('liqi.io/liangtiexin/',32,94,12);
 say('2. 触乐：一个人和中国Game Jam的十年，2025',22,121,11);
 say('chuapp.com/article/290508.html',32,139,12);
 say('3. 新声Pro / 界面：私人游戏博物馆和5000件藏品',22,166,11);
 say('jiemian.com/article/11043773.html',32,184,12);
 say('关卡、场景布局、伙伴形象与对白均为创作改编。',22,221,13);
 mid('A / B 返回结局',264,12);
}

function drawTitle(){
 cls(0);const z=image_size('cover');image_region('cover',0,0,z.width,z.height,0,0,512,288);
 rectroundfill(174,261,337,282,4,0);rectround(174,261,337,282,4,5);
 mid('A 开始游戏',265,12,FH);
}
function challengeBackdrop(){
 camera();cls(0);const bg=['study','studio','jam','museum'][chapter],sz=image_size(bg);
 image_region(bg,0,0,sz.width,sz.height,0,-10,512,288);
 rectroundfill(12,37,499,255,5,0);rectround(12,37,499,255,5,5);
 line(24,62,487,62,5);line(24,229,487,229,5);
 rectroundfill(30,5,481,33,3,0);rectround(30,5,481,33,3,5);
 rectroundfill(98,264,413,285,3,0);
}
