const NOTE_ACCENT=11,NOTE_RULE=1,NOTE_TEXT=7;
const NOTE_PAGES=[
 ["THE IDEA","Turn IShowSpeed into a pixel-art game, with a recognizable pixel portrait and his signature backflip. Jump traffic, build a combo and take the show on a world tour."],
 ["THE POLISH","Make the pixel art finer and the action easier to read. Ground the vehicles on the road, polish the character and scenery, and connect new moves, upgrades and retry screens into a complete arcade run."]
];
let notesOpen=false,notesPage=0,pendingRun=false;
function openNotes(){notesOpen=true;notesPage=0;log("CREATOR NOTES OPEN");}
function updateNotes(){
 if(btnp(5)||btnp(0)){if(notesPage>0)notesPage--;else notesOpen=false;}
 else if(btnp(4)||btnp(1)){if(notesPage===0)notesPage=1;else startAfterNotes();}
}
function drawNotes(){
 // Quiet editorial pages: typography and a thin rule, plain logical-key navigation.
 camera(0,0);clip();rectfill(0,0,511,287,0);
 const f="fusion-pixel-10",h="fusion-pixel-12";
 bprint("TURBO8 / CREATOR'S NOTES",28,22,NOTE_ACCENT,h);
 bprint("This game was created from two prompts.",28,49,NOTE_TEXT,h);
 line(28,76,483,76,NOTE_ACCENT);
 bprint("0"+(notesPage+1),28,91,NOTE_ACCENT,h);
 bprint(NOTE_PAGES[notesPage][0],62,91,NOTE_TEXT,h);
 bprint("PROMPT SUMMARY",28,115,NOTE_ACCENT,f);
 let lineText="",lines=[];
 for(const word of NOTE_PAGES[notesPage][1].split(" ")){
  const next=lineText?lineText+" "+word:word;
  if(lineText&&text_size(next,h).width>448){lines.push(lineText);lineText=word;}else lineText=next;
 }
 if(lineText)lines.push(lineText);
 for(let i=0;i<lines.length;i++)bprint(lines[i],28,137+i*18,NOTE_TEXT,h);
 bprint("MADE WITH TURBO8",28,216,NOTE_ACCENT,f);
 line(28,237,483,237,NOTE_RULE);
 bprint(notesPage?"B  PREVIOUS":"B  BACK",28,251,NOTE_TEXT,f);
 bprint("0"+(notesPage+1)+" / 02",238,251,NOTE_ACCENT,f);
 const next=notesPage?"A  START GAME  >":"A  NEXT  >";
 bprint(next,484-text_size(next,f).width,251,NOTE_TEXT,f);
}
function startAfterNotes(){
 notesOpen=false;beginRun(pendingRun);log("CREATOR NOTES / START GAME");
}
function _update(){
 const beforeMode=mode,beforeScore=score;uiAge++;if(scorePulse>0)scorePulse--;
 if(notesOpen){updateNotes();return;}
 if(AI_PLAY_ENABLED&&btnp(8)){
  autoEnabled=!autoEnabled;
  if(autoEnabled){runAssisted=true;if(mode==='title')beginRun(false);}
  console.log('AUTO PLAY '+autoEnabled+' ranked='+!runAssisted);
 }
 aiThink();
 if(!autoEnabled&&(mode==='title'||mode==='win')&&(btnp(4)||(mode==='title'&&btnp(5)))){
  pendingRun=btnp(5)||mode==='win';openNotes();return;
 }
 gameUpdate();updateHighScore();
 if(mode!==beforeMode)uiAge=0;if(score>beforeScore)scorePulse=15;
}
function _draw(){gameDraw();if(notesOpen)drawNotes();}
