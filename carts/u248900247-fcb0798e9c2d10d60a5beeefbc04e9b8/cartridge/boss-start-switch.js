// Set true to start directly at Cyberleek; false restores the full adventure.
// Restart the game after changing this switch.
const BOSS_START_ENABLED = false;

function beginAdventure(){
 notesOpen=false;pointerMask=pointerEdges=0;
 score=0;wallet=0;scythe=false;boots=false;elapsed=0;
 loadStage(BOSS_START_ENABLED?2:0);
 if(!BOSS_START_ENABLED)return;

 // Supply the required weapon and exit fee without changing boss difficulty.
 scythe=true;stageScythe=true;
 wallet=gateCost;stageWallet=wallet;
 p.x=1610;p.y=240;p.vx=0;p.vy=0;p.ground=true;p.coyote=4;
 checkpoint=p.x;checkpointState=null;
 foes=foes.filter(e=>e.x>=1540);
 coins=coins.filter(c=>c.x>=1540);
 chests=[];
 cam=Math.max(0,Math.min(LEVELS[stage].length-screen_size().width,p.x-180));
 boss.active=true;music(4);
 say("CYBERLEEK / A PEEL / X HARVEST / B JUMP");
 log("BOSS START / hp="+p.hp+" weapon="+scythe+" x="+p.x);
}
