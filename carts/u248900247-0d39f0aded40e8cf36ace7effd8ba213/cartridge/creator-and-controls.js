const GAME_KIND=0,TOUCH_ACCENT=12,TOUCH_BG=8,TOUCH_TEXT=7;
const NOTE_PAGES=[
 ["THE IDEA","Create a fictional Tesla flying-car arcade game. Become a test engineer: accelerate along runways, lift over gaps, control the car in the air and land safely."],
 ["THE POLISH","Add Musk's mission briefings and congratulations, a high-score system and AI autoplay. Refine the chrome logo, car, jet flames, music and route pickups; let the challenge grow across the rally."]
];
// Tesla is deliberately keyboard/gamepad-only. No pointer gestures or overlays.
function updateTouch(){pointerMask=pointerEdges=0;}
function drawTouch(){}
// Shared logical controls preserve native keyboard/gamepad/touch aggregation.
let pointerMask=0, pointerEdges=0, touchThrottle=false, notesOpen=false, notesPage=0, pendingRun=false;
function touchHit(x,y,w,h){return mouse_x()>=x&&mouse_x()<x+w&&mouse_y()>=y&&mouse_y()<y+h;}
function controlHeld(i){return btn(i);}
function controlPressed(i){return btnp(i);}
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
 else {score=0;wallet=0;scythe=false;boots=false;elapsed=0;loadStage(0);}
 log("CREATOR NOTES / START GAME");
}
function _update(){
 if(notesOpen){updateNotes();return;}
 pointerMask=0;pointerEdges=0;updateTouch();
 const startScreen=mode==="title"||(GAME_KIND!==0&&mode==="win");
 const startA=controlPressed(4)||(GAME_KIND===2&&mode==="title"&&mouse_btnp(0)&&touchHit(24,207,200,30));
 const startB=GAME_KIND!==2&&mode==="title"&&controlPressed(5);
 if(startScreen&&(startA||startB)){
  pendingRun=GAME_KIND===0?(startB||titleChoice===1):GAME_KIND===1?(startB||mode==="win"):false;
  openNotes();return;
 }
 gameUpdate();
}
function _draw(){
 gameDraw();
 if(notesOpen){drawNotes();return;}
 drawTouch();
}
