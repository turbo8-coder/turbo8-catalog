// Faithful translations of the creator's three original requests.
// 01 把电影变相怪杰做成游戏，要有类似变相怪杰的电影封面，精细的像素风格
// 02 动作边缘有异常，game feel和手感需要打磨，敌人倒下方向不对。UI太挫了。整体还需要打磨，好像没有boss？
// 03 另外子弹和枪没对准；玩家应该有更多变化，包括敌人掉落宝物和可以破坏物体拾到宝物，可以是武器，补血等等之类的
const CREATOR_FONT = "fusion-pixel-12";
const CREATOR_REQUESTS = [
 {heading:"THE IDEA",quote:"Turn the movie The Mask into a game, with a cover like The Mask movie poster and a detailed pixel-art style."},
 {heading:"THE POLISH",quote:"There are glitches around the edges of the animations. The game feel and controls need polishing, and enemies fall in the wrong direction. The UI looks awful. The whole game still needs polishing. There doesn't seem to be a boss?"},
 {heading:"MORE VARIETY",quote:"Also, the bullets don't line up with the guns. The player should have more variety, including enemies dropping treasure and breakable objects that yield treasure, such as weapons, health pickups, and so on."}
];
let creatorPage=0, creatorLayouts=[];
function openCreatorNotes(){
 creatorPage=0;
 creatorLayouts=CREATOR_REQUESTS.map(entry=>{
  const lines=[];let current="";
  for(const word of ('"'+entry.quote+'"').split(" ")){
   const next=current?current+" "+word:word;
   if(current&&text_size(next,CREATOR_FONT).width>screen_size().width-112){lines.push(current);current=word;}
   else current=next;
  }
  if(current)lines.push(current);
  const metrics=text_size("Ag",CREATOR_FONT);
  log("CREATOR LAYOUT "+entry.heading+" lines="+lines.length+" height="+(lines.length*metrics.line_height));
  return {lines:lines,lineHeight:metrics.line_height};
 });
 mode="creator";sfx(4);log("CREATOR PAGE 1");
}
function updateCreatorNotes(){
 if(btnp(5)){
  if(creatorPage===0){mode="title";log("CREATOR RETURN TO TITLE");}
  else{creatorPage--;log("CREATOR PAGE "+(creatorPage+1));}
 }else if(btnp(4)){
  if(creatorPage<CREATOR_REQUESTS.length-1){creatorPage++;sfx(0);log("CREATOR PAGE "+(creatorPage+1));}
  else{log("CREATOR START GAME");startGame();}
 }
}
function drawCreatorNotes(){
 const view=screen_size(),w=view.width,h=view.height;
 camera(0,0);clip();cls(0);
 image_region("cover",0,0,1672,941,0,0,w,h);
 deco(18,12,w-36,h-24);
 line(34,30,62,30,9);text("TURBO8 / CREATOR'S NOTES",72,22,10);
 text("This game was created from three prompts.",34,44,6);
 line(34,65,w-35,65,4);
 for(let i=0;i<3;i++){
  const x=35+i*30;
  rectfill(x,77,x+20,94,i===creatorPage?9:1);
  text("0"+(i+1),x+3,79,i===creatorPage?0:6);
 }
 const entry=CREATOR_REQUESTS[creatorPage],layout=creatorLayouts[creatorPage];
 text(entry.heading,143,79,creatorPage===1?14:11);
 for(let i=0;i<layout.lines.length;i++)bprint(layout.lines[i],56,111+i*layout.lineHeight,7,CREATOR_FONT);
 line(34,h-57,w-35,h-57,4);
 text("MADE WITH TURBO8",34,h-46,9);
 const page=(creatorPage+1)+" / "+CREATOR_REQUESTS.length;
 text(page,w-35-text_size(page,FONT).width,h-46,6);
 text(creatorPage===0?"B  TITLE":"B  PREVIOUS",34,h-29,6);
 const next=creatorPage===2?"A  START GAME":"A  NEXT";
 text(next,w-35-text_size(next,FONT).width,h-29,10);
}
