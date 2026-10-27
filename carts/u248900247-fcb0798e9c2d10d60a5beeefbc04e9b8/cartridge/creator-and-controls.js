const GAME_KIND=2,TOUCH_ACCENT=10,TOUCH_BG=2,TOUCH_TEXT=6;
const NOTE_PAGES=[
 ["THE IDEA","Create Sun Banana Hero: a playful pixel superhero with a banana crown and a recognizable portrait. Explore a strange city, fight fruit robots and save its districts."],
 ["THE POLISH","Move the adventure into cyberspace. Throw banana peels, jump for treasure and face Cyberleek. Refine the downward crescent silhouette, pixel portrait, animated scenery, rewards and combat feedback."]
];
let lastBananaMode="title";
function updateTouch(){if(mode!==lastBananaMode){if(mode==="title")music(3);lastBananaMode=mode;}}
function drawTouch(){}
// Shared logical controls preserve native keyboard/gamepad/touch aggregation.
let pointerMask=0, pointerEdges=0, touchThrottle=false, notesOpen=false, notesPage=0, pendingRun=false;
function touchHit(x,y,w,h){return mouse_x()>=x&&mouse_x()<x+w&&mouse_y()>=y&&mouse_y()<y+h;}
function controlHeld(i){return btn(i)||!!(pointerMask&(1<<i));}
function controlPressed(i){return btnp(i)||!!(pointerEdges&(1<<i));}
function touchBox(x,y,w,h,label,active=false){
 rectroundfill(x,y,x+w-1,y+h-1,3,active?TOUCH_ACCENT:TOUCH_BG);
 rectround(x,y,x+w-1,y+h-1,3,TOUCH_ACCENT);
 const f="fusion-pixel-10",m=text_size(label,f);
 bprint(label,Math.floor(x+(w-m.width)/2),Math.floor(y+(h-m.height)/2),active?0:TOUCH_TEXT,f);
}
function openNotes(){notesOpen=true;notesPage=0;pointerMask=pointerEdges=0;touchThrottle=false;log("CREATOR NOTES OPEN");}
function updateNotes(){
 const click=GAME_KIND!==0&&mouse_btnp(0);
 if(btnp(5)||btnp(0)||(click&&touchHit(24,238,210,36))){if(notesPage>0)notesPage--;else notesOpen=false;}
 else if(btnp(4)||btnp(1)||(click&&touchHit(278,238,210,36))){if(notesPage===0)notesPage=1;else startAfterNotes();}
}
function drawNotes(){
 // Quiet editorial pages: typography and a thin rule, never touch-button chrome.
 camera(0,0);clip();rectfill(0,0,511,287,0);
 const f="fusion-pixel-10",h="fusion-pixel-12";
 bprint("TURBO8 / CREATOR'S NOTES",28,22,TOUCH_ACCENT,h);
 bprint("This game was created from two prompts.",28,49,TOUCH_TEXT,h);
 line(28,76,483,76,TOUCH_ACCENT);
 bprint("0"+(notesPage+1),28,91,TOUCH_ACCENT,h);
 bprint(NOTE_PAGES[notesPage][0],62,91,TOUCH_TEXT,h);
 bprint("PROMPT SUMMARY",28,115,TOUCH_ACCENT,f);
 let lineText="",lines=[];
 for(const word of NOTE_PAGES[notesPage][1].split(" ")){
  const next=lineText?lineText+" "+word:word;
  if(lineText&&text_size(next,h).width>448){lines.push(lineText);lineText=word;}else lineText=next;
 }
 if(lineText)lines.push(lineText);
 for(let i=0;i<lines.length;i++)bprint(lines[i],28,137+i*18,TOUCH_TEXT,h);
 bprint("MADE WITH TURBO8",28,216,TOUCH_ACCENT,f);
 line(28,237,483,237,TOUCH_BG);
 bprint(notesPage?"B  PREVIOUS":"B  BACK",28,251,TOUCH_TEXT,f);
 bprint("0"+(notesPage+1)+" / 02",238,251,TOUCH_ACCENT,f);
 const next=notesPage?"A  START GAME  >":"A  NEXT  >";
 bprint(next,484-text_size(next,f).width,251,TOUCH_TEXT,f);
}
function startAfterNotes(){
 notesOpen=false;pointerMask=pointerEdges=0;
 if(GAME_KIND===0)beginRally(pendingRun);
 else if(GAME_KIND===1)beginRun(pendingRun);
 else {beginAdventure();}
 log("CREATOR NOTES / START GAME");
}
function _update(){
 if(rewardModal){updateReward();return;}
 if(notesOpen){updateNotes();return;}
 pointerMask=0;pointerEdges=0;updateTouch();
 const startScreen=mode==="title"||(GAME_KIND!==0&&mode==="win");
 const startA=controlPressed(4)||(GAME_KIND===2&&mode==="title"&&mouse_btnp(0)&&touchHit(24,207,200,30));
 const startB=GAME_KIND!==2&&mode==="title"&&controlPressed(5);
 if(startScreen&&(startA||startB)){
  pendingRun=GAME_KIND===0?(startB||titleChoice===1):GAME_KIND===1?(startB||mode==="win"):false;
  if(GAME_KIND===2&&BOSS_START_ENABLED){beginAdventure();return;}
  openNotes();return;
 }
 gameUpdate();
}
function _draw(){
 syncGlitchRgb();
 gameDraw();
 if(notesOpen)drawNotes();
 drawTouch();
 if(mode==="play"||mode==="dead"||mode==="clear"){camera(Math.floor(cam),0);clip();drawSideGlitch();drawHackEffects();camera(0,0);}
 drawRewardModal();
}
