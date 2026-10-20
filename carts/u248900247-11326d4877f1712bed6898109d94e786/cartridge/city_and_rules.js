
const CITY_BLOCKS=[{"x0":0,"x1":120,"y0":0,"y1":128,"dx":40,"dy":-8,"row":0,"col":0},{"x0":200,"x1":312,"y0":0,"y1":128,"dx":16,"dy":0,"row":0,"col":1},{"x0":392,"x1":504,"y0":0,"y1":128,"dx":0,"dy":0,"row":0,"col":2},{"x0":0,"x1":120,"y0":192,"y1":352,"dx":16,"dy":-32,"row":1,"col":0},{"x0":200,"x1":312,"y0":192,"y1":352,"dx":-8,"dy":-8,"row":1,"col":1},{"x0":392,"x1":504,"y0":192,"y1":352,"dx":-24,"dy":8,"row":1,"col":2},{"x0":0,"x1":120,"y0":416,"y1":560,"dx":32,"dy":-32,"row":2,"col":0},{"x0":200,"x1":312,"y0":416,"y1":560,"dx":16,"dy":-16,"row":2,"col":1},{"x0":392,"x1":504,"y0":416,"y1":560,"dx":-8,"dy":8,"row":2,"col":2},{"x0":0,"x1":120,"y0":640,"y1":784,"dx":80,"dy":-24,"row":3,"col":0},{"x0":200,"x1":312,"y0":640,"y1":784,"dx":64,"dy":-8,"row":3,"col":1},{"x0":392,"x1":504,"y0":640,"y1":784,"dx":40,"dy":8,"row":3,"col":2}];
const PIER_LAYOUT=[{"x":544,"y":231,"w":112,"h":32},{"x":555,"y":466,"w":112,"h":32},{"x":601,"y":681,"w":112,"h":32}];
function cityWarp(x,y){return {x:60+.9*x+42*Math.sin((y-580)/190),y:y+.12*(x-360)*Math.sin(Math.PI*y/896)};}
function cityPlace(x,y){for(let b of CITY_BLOCKS)if(x>=b.x0&&x<b.x1&&y>=b.y0&&y<b.y1)return {x:x+b.dx,y:y+b.dy};return cityWarp(x,y);}
function citySeed(x,y,k,a){let p=cityPlace(x,y);return vehicle(p.x,p.y,k,a);}
function cityPath(points){let out=[];for(let i=0;i<points.length-1;i++){let a=points[i],b=points[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/16);for(let j=0;j<n;j++){let t=j/n,p=cityWarp(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);out.push([p.x,p.y]);}}let p=cityWarp(points[points.length-1][0],points[points.length-1][1]);out.push([p.x,p.y]);return out;}
function originalPosition(x,y){let a=x,b=y;for(let i=0;i<5;i++){b=y-.12*(a-360)*Math.sin(Math.PI*b/896);a=(x-60-42*Math.sin((b-580)/190))/.9;}return {x:a,y:b};}

const ART={"titleMark":{"id":3693,"w":200,"h":88},"asphalt":{"id":0,"w":8,"h":8},"paving":{"id":1,"w":8,"h":8},"water":{"id":2,"w":8,"h":8},"roof":{"id":3,"w":8,"h":8},"roofEdge":{"id":4,"w":8,"h":8},"wall":{"id":5,"w":8,"h":8},"window":{"id":6,"w":8,"h":8},"grass":{"id":7,"w":8,"h":8},"curb":{"id":8,"w":8,"h":8},"laneV":{"id":9,"w":8,"h":8},"laneH":{"id":10,"w":8,"h":8},"crossV":{"id":11,"w":8,"h":8},"crossH":{"id":12,"w":8,"h":8},"dock":{"id":13,"w":8,"h":8},"seawall":{"id":14,"w":8,"h":8},"garage":{"id":15,"w":8,"h":8},"stripe":{"id":16,"w":8,"h":8},"cafe":{"id":17,"w":8,"h":8},"blueCanopy":{"id":18,"w":8,"h":8},"sand":{"id":19,"w":8,"h":8},"roofMint":{"id":20,"w":8,"h":8},"drain":{"id":21,"w":8,"h":8},"palm":{"id":22,"w":32,"h":32},"case":{"id":38,"w":16,"h":16},"bin":{"id":42,"w":16,"h":16},"lamp":{"id":46,"w":16,"h":24},"boat":{"id":52,"w":24,"h":48},"vent":{"id":70,"w":24,"h":16},"person0_0":{"id":76,"w":16,"h":16},"person0_1":{"id":80,"w":16,"h":16},"person0_2":{"id":84,"w":16,"h":16},"person0_3":{"id":88,"w":16,"h":16},"person0_4":{"id":92,"w":16,"h":16},"person0_5":{"id":96,"w":16,"h":16},"person1_0":{"id":100,"w":16,"h":16},"person1_1":{"id":104,"w":16,"h":16},"person1_2":{"id":108,"w":16,"h":16},"person1_3":{"id":112,"w":16,"h":16},"person1_4":{"id":116,"w":16,"h":16},"person1_5":{"id":120,"w":16,"h":16},"person2_0":{"id":124,"w":16,"h":16},"person2_1":{"id":128,"w":16,"h":16},"person2_2":{"id":132,"w":16,"h":16},"person2_3":{"id":136,"w":16,"h":16},"person2_4":{"id":140,"w":16,"h":16},"person2_5":{"id":144,"w":16,"h":16},"person3_0":{"id":148,"w":16,"h":16},"person3_1":{"id":152,"w":16,"h":16},"person3_2":{"id":156,"w":16,"h":16},"person3_3":{"id":160,"w":16,"h":16},"person3_4":{"id":164,"w":16,"h":16},"person3_5":{"id":168,"w":16,"h":16},"shoot0":{"id":172,"w":16,"h":16},"shoot1":{"id":176,"w":16,"h":16},"shoot2":{"id":180,"w":16,"h":16},"shoot3":{"id":184,"w":16,"h":16},"car0_0":{"id":188,"w":32,"h":32},"car0_1":{"id":204,"w":32,"h":32},"car0_2":{"id":220,"w":32,"h":32},"car0_3":{"id":236,"w":32,"h":32},"car0_4":{"id":252,"w":32,"h":32},"car0_5":{"id":268,"w":32,"h":32},"car0_6":{"id":284,"w":32,"h":32},"car0_7":{"id":300,"w":32,"h":32},"car1_0":{"id":316,"w":32,"h":32},"car1_1":{"id":332,"w":32,"h":32},"car1_2":{"id":348,"w":32,"h":32},"car1_3":{"id":364,"w":32,"h":32},"car1_4":{"id":380,"w":32,"h":32},"car1_5":{"id":396,"w":32,"h":32},"car1_6":{"id":412,"w":32,"h":32},"car1_7":{"id":428,"w":32,"h":32},"car2_0":{"id":444,"w":32,"h":32},"car2_1":{"id":460,"w":32,"h":32},"car2_2":{"id":476,"w":32,"h":32},"car2_3":{"id":492,"w":32,"h":32},"car2_4":{"id":508,"w":32,"h":32},"car2_5":{"id":524,"w":32,"h":32},"car2_6":{"id":540,"w":32,"h":32},"car2_7":{"id":556,"w":32,"h":32},"car3_0":{"id":572,"w":32,"h":32},"car3_1":{"id":588,"w":32,"h":32},"car3_2":{"id":604,"w":32,"h":32},"car3_3":{"id":620,"w":32,"h":32},"car3_4":{"id":636,"w":32,"h":32},"car3_5":{"id":652,"w":32,"h":32},"car3_6":{"id":668,"w":32,"h":32},"car3_7":{"id":684,"w":32,"h":32},"flowers":{"id":700,"w":24,"h":24},"umbrella":{"id":709,"w":24,"h":24},"bench":{"id":718,"w":16,"h":16},"kiosk":{"id":722,"w":24,"h":24},"balcony":{"id":731,"w":24,"h":16},"gun0_0":{"id":737,"w":16,"h":16},"gun0_1":{"id":741,"w":16,"h":16},"gun0_2":{"id":745,"w":16,"h":16},"gun0_3":{"id":749,"w":16,"h":16},"gun0_4":{"id":753,"w":16,"h":16},"gun1_0":{"id":757,"w":16,"h":16},"gun1_1":{"id":761,"w":16,"h":16},"gun1_2":{"id":765,"w":16,"h":16},"gun1_3":{"id":769,"w":16,"h":16},"gun1_4":{"id":773,"w":16,"h":16},"gun2_0":{"id":777,"w":16,"h":16},"gun2_1":{"id":781,"w":16,"h":16},"gun2_2":{"id":785,"w":16,"h":16},"gun2_3":{"id":789,"w":16,"h":16},"gun2_4":{"id":793,"w":16,"h":16},"gun3_0":{"id":797,"w":16,"h":16},"gun3_1":{"id":801,"w":16,"h":16},"gun3_2":{"id":805,"w":16,"h":16},"gun3_3":{"id":809,"w":16,"h":16},"gun3_4":{"id":813,"w":16,"h":16},"slate":{"id":817,"w":8,"h":8},"flat":{"id":818,"w":8,"h":8},"brick":{"id":819,"w":8,"h":8},"cream":{"id":820,"w":8,"h":8},"glass":{"id":821,"w":8,"h":8},"metal":{"id":822,"w":8,"h":8},"pool":{"id":823,"w":8,"h":8},"cobble":{"id":824,"w":8,"h":8},"hedge":{"id":825,"w":8,"h":8},"crate":{"id":826,"w":8,"h":8},"container":{"id":827,"w":8,"h":8},"sandstone":{"id":828,"w":8,"h":8},"door":{"id":829,"w":8,"h":8},"arch":{"id":830,"w":8,"h":8},"tileBlue":{"id":831,"w":8,"h":8},"npc0_0_0":{"id":832,"w":16,"h":16},"npc0_0_1":{"id":836,"w":16,"h":16},"npc0_0_2":{"id":840,"w":16,"h":16},"npc0_0_3":{"id":844,"w":16,"h":16},"npc0_0_4":{"id":848,"w":16,"h":16},"npc0_0_5":{"id":852,"w":16,"h":16},"npc0_1_0":{"id":856,"w":16,"h":16},"npc0_1_1":{"id":860,"w":16,"h":16},"npc0_1_2":{"id":864,"w":16,"h":16},"npc0_1_3":{"id":868,"w":16,"h":16},"npc0_1_4":{"id":872,"w":16,"h":16},"npc0_1_5":{"id":876,"w":16,"h":16},"npc0_2_0":{"id":880,"w":16,"h":16},"npc0_2_1":{"id":884,"w":16,"h":16},"npc0_2_2":{"id":888,"w":16,"h":16},"npc0_2_3":{"id":892,"w":16,"h":16},"npc0_2_4":{"id":896,"w":16,"h":16},"npc0_2_5":{"id":900,"w":16,"h":16},"npc0_3_0":{"id":904,"w":16,"h":16},"npc0_3_1":{"id":908,"w":16,"h":16},"npc0_3_2":{"id":912,"w":16,"h":16},"npc0_3_3":{"id":916,"w":16,"h":16},"npc0_3_4":{"id":920,"w":16,"h":16},"npc0_3_5":{"id":924,"w":16,"h":16},"npc1_0_0":{"id":928,"w":16,"h":16},"npc1_0_1":{"id":932,"w":16,"h":16},"npc1_0_2":{"id":936,"w":16,"h":16},"npc1_0_3":{"id":940,"w":16,"h":16},"npc1_0_4":{"id":944,"w":16,"h":16},"npc1_0_5":{"id":948,"w":16,"h":16},"npc1_1_0":{"id":952,"w":16,"h":16},"npc1_1_1":{"id":956,"w":16,"h":16},"npc1_1_2":{"id":960,"w":16,"h":16},"npc1_1_3":{"id":964,"w":16,"h":16},"npc1_1_4":{"id":968,"w":16,"h":16},"npc1_1_5":{"id":972,"w":16,"h":16},"npc1_2_0":{"id":976,"w":16,"h":16},"npc1_2_1":{"id":980,"w":16,"h":16},"npc1_2_2":{"id":984,"w":16,"h":16},"npc1_2_3":{"id":988,"w":16,"h":16},"npc1_2_4":{"id":992,"w":16,"h":16},"npc1_2_5":{"id":996,"w":16,"h":16},"npc1_3_0":{"id":1000,"w":16,"h":16},"npc1_3_1":{"id":1004,"w":16,"h":16},"npc1_3_2":{"id":1008,"w":16,"h":16},"npc1_3_3":{"id":1012,"w":16,"h":16},"npc1_3_4":{"id":1016,"w":16,"h":16},"npc1_3_5":{"id":1020,"w":16,"h":16},"npc2_0_0":{"id":1024,"w":16,"h":16},"npc2_0_1":{"id":1028,"w":16,"h":16},"npc2_0_2":{"id":1032,"w":16,"h":16},"npc2_0_3":{"id":1036,"w":16,"h":16},"npc2_0_4":{"id":1040,"w":16,"h":16},"npc2_0_5":{"id":1044,"w":16,"h":16},"npc2_1_0":{"id":1048,"w":16,"h":16},"npc2_1_1":{"id":1052,"w":16,"h":16},"npc2_1_2":{"id":1056,"w":16,"h":16},"npc2_1_3":{"id":1060,"w":16,"h":16},"npc2_1_4":{"id":1064,"w":16,"h":16},"npc2_1_5":{"id":1068,"w":16,"h":16},"npc2_2_0":{"id":1072,"w":16,"h":16},"npc2_2_1":{"id":1076,"w":16,"h":16},"npc2_2_2":{"id":1080,"w":16,"h":16},"npc2_2_3":{"id":1084,"w":16,"h":16},"npc2_2_4":{"id":1088,"w":16,"h":16},"npc2_2_5":{"id":1092,"w":16,"h":16},"npc2_3_0":{"id":1096,"w":16,"h":16},"npc2_3_1":{"id":1100,"w":16,"h":16},"npc2_3_2":{"id":1104,"w":16,"h":16},"npc2_3_3":{"id":1108,"w":16,"h":16},"npc2_3_4":{"id":1112,"w":16,"h":16},"npc2_3_5":{"id":1116,"w":16,"h":16},"npc3_0_0":{"id":1120,"w":16,"h":16},"npc3_0_1":{"id":1124,"w":16,"h":16},"npc3_0_2":{"id":1128,"w":16,"h":16},"npc3_0_3":{"id":1132,"w":16,"h":16},"npc3_0_4":{"id":1136,"w":16,"h":16},"npc3_0_5":{"id":1140,"w":16,"h":16},"npc3_1_0":{"id":1144,"w":16,"h":16},"npc3_1_1":{"id":1148,"w":16,"h":16},"npc3_1_2":{"id":1152,"w":16,"h":16},"npc3_1_3":{"id":1156,"w":16,"h":16},"npc3_1_4":{"id":1160,"w":16,"h":16},"npc3_1_5":{"id":1164,"w":16,"h":16},"npc3_2_0":{"id":1168,"w":16,"h":16},"npc3_2_1":{"id":1172,"w":16,"h":16},"npc3_2_2":{"id":1176,"w":16,"h":16},"npc3_2_3":{"id":1180,"w":16,"h":16},"npc3_2_4":{"id":1184,"w":16,"h":16},"npc3_2_5":{"id":1188,"w":16,"h":16},"npc3_3_0":{"id":1192,"w":16,"h":16},"npc3_3_1":{"id":1196,"w":16,"h":16},"npc3_3_2":{"id":1200,"w":16,"h":16},"npc3_3_3":{"id":1204,"w":16,"h":16},"npc3_3_4":{"id":1208,"w":16,"h":16},"npc3_3_5":{"id":1212,"w":16,"h":16},"car4_0":{"id":1216,"w":32,"h":32},"car4_1":{"id":1232,"w":32,"h":32},"car4_2":{"id":1248,"w":32,"h":32},"car4_3":{"id":1264,"w":32,"h":32},"car4_4":{"id":1280,"w":32,"h":32},"car4_5":{"id":1296,"w":32,"h":32},"car4_6":{"id":1312,"w":32,"h":32},"car4_7":{"id":1328,"w":32,"h":32},"car5_0":{"id":1344,"w":32,"h":32},"car5_1":{"id":1360,"w":32,"h":32},"car5_2":{"id":1376,"w":32,"h":32},"car5_3":{"id":1392,"w":32,"h":32},"car5_4":{"id":1408,"w":32,"h":32},"car5_5":{"id":1424,"w":32,"h":32},"car5_6":{"id":1440,"w":32,"h":32},"car5_7":{"id":1456,"w":32,"h":32},"car6_0":{"id":1472,"w":32,"h":32},"car6_1":{"id":1488,"w":32,"h":32},"car6_2":{"id":1504,"w":32,"h":32},"car6_3":{"id":1520,"w":32,"h":32},"car6_4":{"id":1536,"w":32,"h":32},"car6_5":{"id":1552,"w":32,"h":32},"car6_6":{"id":1568,"w":32,"h":32},"car6_7":{"id":1584,"w":32,"h":32},"car7_0":{"id":1600,"w":32,"h":32},"car7_1":{"id":1616,"w":32,"h":32},"car7_2":{"id":1632,"w":32,"h":32},"car7_3":{"id":1648,"w":32,"h":32},"car7_4":{"id":1664,"w":32,"h":32},"car7_5":{"id":1680,"w":32,"h":32},"car7_6":{"id":1696,"w":32,"h":32},"car7_7":{"id":1712,"w":32,"h":32},"fountain":{"id":1728,"w":32,"h":32},"tree":{"id":1744,"w":24,"h":32},"radioTower":{"id":1756,"w":48,"h":56},"marketStall":{"id":1798,"w":24,"h":24},"pump":{"id":1807,"w":16,"h":24},"hospitalSign":{"id":1813,"w":24,"h":24},"cinemaSign":{"id":1822,"w":24,"h":32},"terminal":{"id":1834,"w":16,"h":16}};
const DECOR=[{"name":"lamp","x":572,"y":193},{"name":"lamp","x":593,"y":195},{"name":"lamp","x":615,"y":197},{"name":"lamp","x":636,"y":198},{"name":"boat","x":632,"y":251},{"name":"lamp","x":573,"y":429},{"name":"lamp","x":595,"y":432},{"name":"lamp","x":616,"y":435},{"name":"lamp","x":638,"y":438},{"name":"boat","x":645,"y":486},{"name":"lamp","x":617,"y":648},{"name":"lamp","x":638,"y":651},{"name":"lamp","x":660,"y":653},{"name":"lamp","x":682,"y":655},{"name":"boat","x":692,"y":699},{"name":"flowers","x":95,"y":88},{"name":"balcony","x":56,"y":80},{"name":"balcony","x":112,"y":80},{"name":"radioTower","x":246,"y":8},{"name":"terminal","x":256,"y":104},{"name":"umbrella","x":462,"y":80},{"name":"palm","x":472,"y":16},{"name":"hospitalSign","x":64,"y":208},{"name":"tree","x":202,"y":207},{"name":"tree","x":277,"y":295},{"name":"bench","x":274,"y":272},{"name":"umbrella","x":384,"y":327},{"name":"umbrella","x":439,"y":327},{"name":"cinemaSign","x":72,"y":420},{"name":"vent","x":104,"y":424},{"name":"marketStall","x":226,"y":491},{"name":"marketStall","x":268,"y":491},{"name":"marketStall","x":301,"y":491},{"name":"umbrella","x":266,"y":524},{"name":"pump","x":390,"y":556},{"name":"pump","x":482,"y":556},{"name":"vent","x":418,"y":480},{"name":"balcony","x":96,"y":710},{"name":"balcony","x":152,"y":710},{"name":"vent","x":288,"y":679},{"name":"palm","x":557,"y":43},{"name":"bench","x":552,"y":113},{"name":"kiosk","x":541,"y":165},{"name":"palm","x":528,"y":284},{"name":"bench","x":536,"y":351},{"name":"kiosk","x":537,"y":401},{"name":"palm","x":550,"y":512},{"name":"bench","x":570,"y":576},{"name":"kiosk","x":578,"y":622},{"name":"palm","x":596,"y":727},{"name":"kiosk","x":614,"y":830},{"name":"palm","x":316,"y":8},{"name":"bin","x":132,"y":115},{"name":"bin","x":305,"y":125},{"name":"bin","x":122,"y":324},{"name":"bin","x":294,"y":346},{"name":"bin","x":467,"y":367},{"name":"bin","x":158,"y":541},{"name":"bin","x":331,"y":562},{"name":"bin","x":544,"y":798},{"name":"flowers","x":23,"y":168},{"name":"flowers","x":200,"y":404},{"name":"flowers","x":373,"y":202},{"name":"flowers","x":427,"y":659},{"name":"flowers","x":606,"y":859},{"name":"flowers","x":280,"y":234},{"name":"flowers","x":280,"y":312},{"name":"kiosk","x":48,"y":384},{"name":"bench","x":104,"y":384},{"name":"kiosk","x":272,"y":632},{"name":"bench","x":328,"y":632},{"name":"fountain","x":317,"y":358}];
const LANDMARKS=[{"text":"BAY FM","x":228,"y":79},{"text":"AZURE","x":404,"y":87},{"text":"CLINIC","x":36,"y":239},{"text":"CAFE SOL","x":380,"y":287},{"text":"RIALTO","x":52,"y":487},{"text":"MARKET","x":232,"y":480},{"text":"MARA AUTO","x":396,"y":527},{"text":"REPAIR","x":418,"y":567},{"text":"BAY PRESS","x":276,"y":719},{"text":"PORT AUTH.","x":444,"y":727},{"text":"BAKERY","x":42,"y":167},{"text":"FRUIT","x":223,"y":390},{"text":"SOUVENIRS","x":386,"y":207},{"text":"LAUNDRY","x":106,"y":623}];
const WW=768, WH=1408;
let view, mode='title', tick=0, camx=0, camy=0;
let player, cars=[], cops=[], walkers=[], shots=[], motes=[], marks=[];
let drive=-1, hp=100, cash=0, heat=0, escape=0, mission=0, phase='pickup', timer=0;
let toast='', toastTicks=0, hurt=0, stepClock=0, fire=0, dir=2, missionDelay=0;
let solid=[], nav=[], bfsQueue=[], bfsPrev=[], bfsStamp=[], bfsRun=0;
const VEHICLES=['ROADSTER','SEDAN','PATROL','COUPE','TAXI','CARGO VAN','SCOOTER','PICKUP','CITY BUS','AMBULANCE','MOTORBIKE','ARMORED'];
const TOPS=[3.2,2.8,2.8,3.3,2.9,2.55,3.0,2.75,2.2,3,3.7,2.5], TURNS=[.046,.038,.045,.042,.043,.032,.075,.036,.028,.04,.085,.03];
const jobs=[
{name:'FIRST SHIFT',sx:296,sy:552,tx:456,ty:568,seconds:0,reward:300,stars:0,drop:'MARA AUTO',item:'TOOL CRATE',need:5,speaker:'MARA',lines:[
'Alex, you are back. Your brother Nico never came home from the docks.',
'His last job was for Vale Shipping. I can ask around, but first we need the garage open.',
'Collect our tools at the market. Use the cream CARGO VAN nearby, then bring them here. No rush.']},
{name:'THE WITNESS',sx:96,sy:304,tx:456,ty:344,seconds:150,reward:500,stars:0,drop:'CAFE SOL',item:'LIO',need:4,speaker:'MARA',lines:[
'Lio saw Nico at the port. He is hiding behind the clinic in Old Town.',
'Take the yellow TAXI to him. Get out and speak to him, then drive him to Cafe Sol.',
'He will tell you what happened once he feels safe.']},
{name:'PAPER TRAIL',sx:648,sy:664,tx:296,ty:776,seconds:180,reward:700,stars:1,drop:'BAY PRESS',item:'SHIPPING LEDGER',need:-1,speaker:'LIO',lines:[
'Nico found Vale paying off the harbor patrol. They locked him on a boat at North Marina.',
'The ledger is on the south pier. Steal it and take it to journalist Iris at Bay Press.',
'The alarm will call patrols. Keep moving, and avoid hurting bystanders.']},
{name:'DEAD AIR',sx:248,sy:120,tx:456,ty:568,seconds:180,reward:900,stars:2,drop:'MARA AUTO',item:'RADIO TERMINAL',need:-1,speaker:'IRIS',lines:[
'These payments prove it. But Vale has jammed Bay FM and controls the port gates.',
'Go to the radio station. Stand by the terminal and HOLD A to copy the gate code.',
'Lose the patrols before returning to Mara. We need her van for the rescue.']},
{name:'LAST CROSSING',sx:648,sy:216,tx:648,ty:664,seconds:180,reward:1200,stars:3,drop:'SOUTH PIER',item:'NICO',need:5,speaker:'MARA',lines:[
'The code opened the gate. Nico is waiting at North Marina. Take the CARGO VAN.',
'Speak to him on foot, then drive him south. Vale will send every patrol he has.',
'I arranged a fishing boat at South Pier. Get your brother out alive.']},
{name:'THE BROADCAST',sx:296,sy:776,tx:248,ty:120,seconds:180,reward:1400,stars:2,drop:'BAY FM',item:'EVIDENCE TAPE',need:-1,speaker:'NICO',lines:[
'You came for me. I kept the recording: Vale ordered everything.',
'Iris has made a broadcast tape at Bay Press. Pick it up and bring it to Bay FM.',
'Go on foot to the transmitter and HOLD A to broadcast. Let the whole bay hear the truth.']}
];
let dialogue=[],dialogueIndex=0,dialogueSpeaker='',dialogueEnd='play',dialogueLines=[];
let savedStory=null,savePending=false;
let dialogueReveal=0,dialogueLength=0,policeShots=[],locals=[],crowd=[],questPerson=null;
Object.assign(ART,{"officerWalk0_0":{"id":172,"w":16,"h":16},"officerWalk0_1":{"id":176,"w":16,"h":16},"officerGun0_0":{"id":180,"w":16,"h":16},"officerGun0_1":{"id":184,"w":16,"h":16},"officerGun0_2":{"id":3968,"w":16,"h":16},"officerGun0_3":{"id":3972,"w":16,"h":16},"officerWalk1_0":{"id":3976,"w":16,"h":16},"officerWalk1_1":{"id":3980,"w":16,"h":16},"officerGun1_0":{"id":3984,"w":16,"h":16},"officerGun1_1":{"id":3988,"w":16,"h":16},"officerGun1_2":{"id":3992,"w":16,"h":16},"officerGun1_3":{"id":3996,"w":16,"h":16},"officerWalk2_0":{"id":4000,"w":16,"h":16},"officerWalk2_1":{"id":4004,"w":16,"h":16},"officerGun2_0":{"id":4008,"w":16,"h":16},"officerGun2_1":{"id":4012,"w":16,"h":16},"officerGun2_2":{"id":4016,"w":16,"h":16},"officerGun2_3":{"id":4020,"w":16,"h":16},"officerWalk3_0":{"id":4024,"w":16,"h":16},"officerWalk3_1":{"id":4028,"w":16,"h":16},"officerGun3_0":{"id":4032,"w":16,"h":16},"officerGun3_1":{"id":4036,"w":16,"h":16},"officerGun3_2":{"id":4040,"w":16,"h":16},"officerGun3_3":{"id":4044,"w":16,"h":16},"civilHit0_0":{"id":4048,"w":16,"h":16},"civilHit0_1":{"id":4052,"w":16,"h":16},"civilHit0_2":{"id":4056,"w":16,"h":16},"civilHit1_0":{"id":4060,"w":16,"h":16},"civilHit1_1":{"id":4064,"w":16,"h":16},"civilHit1_2":{"id":4068,"w":16,"h":16},"civilHit2_0":{"id":4072,"w":16,"h":16},"civilHit2_1":{"id":4076,"w":16,"h":16},"civilHit2_2":{"id":4080,"w":16,"h":16},"civilHit3_0":{"id":4084,"w":16,"h":16},"civilHit3_1":{"id":4088,"w":16,"h":16},"civilHit3_2":{"id":4092,"w":16,"h":16}});
let heatAge=0,pendingHeat=0,dispatchTicks=0,hack=0,repairTicks=0,repairCooldown=0,checkpoint=null;
let pickupHint=0,nearAction=false,gunUnlocked=false;
function wrapWords(s,width){
 let lines=[],line='';for(let w of s.split(' ')){let n=line?line+' '+w:w;if(text_size(n).width>width&&line){lines.push(line);line=w;}else line=n;}if(line)lines.push(line);return lines;
}
function dialog(speaker,lines,end){
 dialogueSpeaker=speaker;dialogue=lines;dialogueIndex=0;dialogueEnd=end||'play';dialogueLines=wrapWords(lines[0],220);dialogueReveal=0;dialogueLength=dialogueLines.join('').length;mode='dialog';fire=0;
}
function beginChapter(i,withDialog){
 mission=i;phase='pickup';questPerson=(i===1||i===4)?stationaryPerson(jobs[i].sx,jobs[i].sy,i===1?0:2):null;crowd=walkers.concat(locals,questPerson?[questPerson]:[]);targetX=jobs[i].sx;targetY=jobs[i].sy;timer=jobs[i].seconds*30;
 hack=0;pendingHeat=0;dispatchTicks=0;if(i>=2&&!owned[0]){owned[0]=true;ammo[0]=36;}gunUnlocked=owned.some(Boolean);
 checkpoint={mission:i,cash:cash,x:player.x,y:player.y,seconds:totalSeconds};
 say(jobs[i].name);if(withDialog){dialog(jobs[i].speaker,jobs[i].lines);saveStory(false);}
 log('CHAPTER '+(i+1)+' '+jobs[i].name+' heat='+heat+' police='+cops.length);
}
function saveStory(finished){
 let v={version:3,mission:mission,cash:cash,x:player.x,y:player.y,seconds:Math.round(totalSeconds),finished:!!finished,gear:gearSnapshot()};
 if(storage_set('story_v2',v)){savedStory=v;savePending=true;}else log('SAVE failed');
}
function continueStory(){
 let sv=savedStory;resetRun();restoreGear(sv.gear);cash=sv.cash;player.x=sv.x;player.y=sv.y;totalSeconds=Number.isFinite(sv.seconds)?Math.max(0,sv.seconds):0;mode='play';
 if(sv.finished){mission=5;freeRide=true;phase='cruise';gunUnlocked=true;say('WELCOME BACK TO SOLEIL BAY');}
 else beginChapter(sv.mission,true);
 camx=clamp(player.x-view.width/2,0,WW-view.width);camy=clamp(player.y-view.height/2,0,WH-view.height);
}
function retryChapter(){
 let cp=checkpoint,keep=gearSnapshot(),wallet=cash;resetRun();restoreGear(keep);armor=0;cash=wallet;player.x=cp.x;player.y=cp.y;totalSeconds=cp.seconds||0;
 beginChapter(cp.mission,true);camx=clamp(player.x-view.width/2,0,WW-view.width);camy=clamp(player.y-view.height/2,0,WH-view.height);
}
function requestHeat(h){
 if(h<=0||h<=heat&&pendingHeat===0)return;pendingHeat=Math.max(h,pendingHeat);if(dispatchTicks<=0)dispatchTicks=60;say('ALARM - PATROLS DISPATCHED');log('DISPATCH requested='+h);
}
function district(){
 if(player.y>=896)return player.y<1060?'SOUTH INDUSTRIAL':player.x<320?'BAY AIRFIELD':'NAVAL YARDS';
 const local=originalPosition(player.x,player.y);
 if(local.x>600)return local.y<350?'NORTH MARINA':local.y<600?'PROMENADE':'SOUTH DOCKS';
 if(local.y<190)return local.x>390?'AZURE HOTEL':local.x>190?'RADIO QUARTER':'OLD TOWN';
 if(local.y<420)return local.x>390?'CAFE SOL':local.x>190?'PALM GARDENS':'OLD TOWN';
 if(local.y<640)return local.x>390?'MARA AUTO':local.x>190?'MARKET SQUARE':'CINEMA ROW';
 return local.x>390?'VALE FREIGHT':local.x>190?'PRESS DISTRICT':'CANAL HOMES';
}
let freeRide=false, totalSeconds=0, sirenTick=0;
let targetX=648,targetY=440;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function distance(x,y,a,b){return Math.sqrt((x-a)*(x-a)+(y-b)*(y-b));}
function art(name,x,y){
 const a=ART[name]; if(!a)return;
 let i=a.id; for(let yy=0;yy<a.h;yy+=8)for(let xx=0;xx<a.w;xx+=8)spr(i++,Math.floor(x+xx),Math.floor(y+yy));
}
function say(s){toast=s;toastTicks=110;}
function blocked(x,y,r){
 if(x-r<8||x+r>=WW-8||y-r<8||y+r>=WH-8)return true;
 return solid[(Math.floor((y-r)/8))*96+Math.floor((x-r)/8)]||solid[(Math.floor((y-r)/8))*96+Math.floor((x+r)/8)]||solid[(Math.floor((y+r)/8))*96+Math.floor((x-r)/8)]||solid[(Math.floor((y+r)/8))*96+Math.floor((x+r)/8)];
}
function moveBody(o,dx,dy,r){
 let hit=false;
 if(!blocked(o.x+dx,o.y,r))o.x+=dx;else hit=true;
 if(!blocked(o.x,o.y+dy,r))o.y+=dy;else hit=true;
 return hit;
}
function vehicle(x,y,kind,angle){return {x:x,y:y,kind:kind,angle:angle,speed:0,health:100,stun:0,route:[],navTick:0};}
function _init(){
 view=screen_size(); use_map(0);
 for(let j of jobs){let a=cityPlace(j.sx,j.sy),b=cityPlace(j.tx,j.ty);j.sx=a.x;j.sy=a.y;j.tx=b.x;j.ty=b.y;}
 for(let y=0;y<176;y++)for(let x=0;x<96;x++)solid.push(fget(mget(x,y),0)?1:0);
 for(let y=0;y<88;y++)for(let x=0;x<48;x++)nav.push(blocked(x*16+8,y*16+8,7)?0:1);
 bfsQueue=new Int32Array(4224); bfsPrev=new Int32Array(4224); bfsStamp=new Int32Array(4224);
 resetRun(); mode='title'; music(0);
 let sv=storage_get('story_v2',null);
 if(sv&&sv.version===2){let p=cityPlace(sv.x,sv.y);sv.x=p.x;sv.y=p.y;sv.version=3;}
 if(sv&&sv.version===3&&Number.isInteger(sv.mission)&&sv.mission>=0&&sv.mission<jobs.length&&Number.isFinite(sv.cash)&&sv.cash>=0&&Number.isFinite(sv.x)&&Number.isFinite(sv.y)&&!blocked(sv.x,sv.y,4))savedStory=sv;
 log('STORAGE resume='+(savedStory?savedStory.mission:-1));

}
function resetRun(){
 player=cityPlace(480,584);cars=[
citySeed(520,584,0,0),citySeed(310,584,5,0),citySeed(144,328,4,0),
citySeed(568,488,6,0),citySeed(536,744,7,0),citySeed(344,216,3,0),citySeed(152,728,1,0),
citySeed(520,616,5,0),citySeed(312,120,6,0)];
for(let i of [0,1,2,3,7,8])cars[i].loan=true;
 cops=[];policeShots=[];shots=[];motes=[];marks=[];walkers=[];
 for(let i=0;i<24;i++){let route=cityPath([[[568,184,376,120][i%4],184],[[568,184,376,120][i%4],850]]),node=Math.floor((i*7)%route.length),p=route[node];walkers.push({x:p[0],y:p[1],dir:2,phase:i*4,kind:i%4,panic:0,path:route,node:node,sign:i%2?1:-1});}
 for(let i=0;i<4;i++){
 let c=citySeed(i%2?144:544,i<2?280:720,[4,5,7,3][i],i%2?0:0.5);
 c.traffic=true;c.path=i%2?[[144,144],[544,144],[544,832],[144,832]]:[[544,832],[144,832],[144,144],[544,144]];
 c.path=cityPath(c.path);let best=1e9;for(let j=0;j<c.path.length;j++){let d=distance(c.x,c.y,c.path[j][0],c.path[j][1]);if(d<best){best=d;c.node=(j+1)%c.path.length;}}cars.push(c);
}
 locals=[cityPlace(480,560),cityPlace(290,760)].map((p,i)=>stationaryPerson(p.x,p.y,i?3:1));
 freeRide=false;totalSeconds=0;sirenTick=0;
 drive=-1;hp=100;cash=0;heat=0;escape=0;mission=0;phase='pickup';timer=jobs[0].seconds*30;tick=0;dir=2;stepClock=0;hurt=0;fire=0;missionDelay=0;
 targetX=jobs[0].sx;targetY=jobs[0].sy;camx=clamp(player.x-view.width/2,0,WW-view.width);camy=clamp(player.y-view.height/2,0,WH-view.height);
 pendingHeat=0;dispatchTicks=0;hack=0;repairTicks=0;repairCooldown=0;gunUnlocked=false;resetExpansion();beginChapter(0,false);say('WELCOME HOME, ALEX');
}
function burst(x,y,col,n){
 for(let i=0;i<n&&motes.length<48;i++){let a=i*2.4+tick; motes.push({x:x,y:y,vx:Math.cos(a)*(1+i%3*.4),vy:Math.sin(a)*(1+i%3*.4),t:12+i%6,c:col});}
}
function findRoute(o,tx,ty){
 let start=clamp(Math.floor(o.y/16),0,87)*48+clamp(Math.floor(o.x/16),0,47);
 let goal=clamp(Math.floor(ty/16),0,87)*48+clamp(Math.floor(tx/16),0,47);
 if(!nav[goal]){let best=1e9;for(let i=0;i<nav.length;i++)if(nav[i]){let dx=i%48*16+8-tx,dy=Math.floor(i/48)*16+8-ty,v=dx*dx+dy*dy;if(v<best){best=v;goal=i;}}}
 bfsRun++;let head=0,tail=0;bfsQueue[tail++]=start;bfsStamp[start]=bfsRun;bfsPrev[start]=-1;
 while(head<tail){let n=bfsQueue[head++];if(n===goal)break;
 for(let k=0;k<4;k++){let next=n+(k===0?-48:k===1?1:k===2?48:-1);if(next<0||next>=4224||!nav[next]||bfsStamp[next]===bfsRun)continue;if((k===1||k===3)&&Math.floor(next/48)!==Math.floor(n/48))continue;bfsStamp[next]=bfsRun;bfsPrev[next]=n;bfsQueue[tail++]=next;}
 }
 o.route.length=0;
 if(bfsStamp[goal]===bfsRun){let n=goal,guard=0;while(n!==start&&n>=0&&guard++<4224){o.route.push(n);n=bfsPrev[n];}}
}
function setHeat(h){
 if(h<=0)return;
 heat=Math.min(5,Math.max(heat,h));escape=0;heatAge=0;
 while(cops.filter(c=>!c.disabled&&c.health>0).length<Math.min(4,heat+1)&&cops.length<10){
 let i=cops.length,spots=[[536,152],[536,416],[536,600],[536,824],[344,152],[344,376],[344,600],[344,824],[152,152],[152,376],[152,600],[152,824]];
 spots=spots.map(q=>{let p=cityWarp(q[0],q[1]);return [p.x,p.y];});spots.push([412,1000],[360,1112],[610,1230],[220,1360]);
 let p=spots[0],best=1e9;
 for(let q of spots){
   let ds=distance(q[0],q[1],player.x,player.y),used=false;
   for(let other of cops)if(distance(q[0],q[1],other.x,other.y)<40)used=true;
   if(ds>=190&&!used&&ds<best){best=ds;p=q;}
 }
 const c=vehicle(p[0],p[1],heat>=3&&i%2===1?11:2,4);c.navTick=i*9;cops.push(c);
 }
}
function enterExit(){
 if(drive>=0){
 const c=cars[drive];if(Math.abs(c.speed)>1.2){say('SLOW DOWN TO EXIT');return;}
 const offsets=[[20,0],[-20,0],[0,24],[0,-24]];
 for(let p of offsets)if(!blocked(c.x+p[0],c.y+p[1],4)){player.x=c.x+p[0];player.y=c.y+p[1];drive=-1;sfx(1);say(gunUnlocked?'A FIRE  B ENTER CAR':'A INTERACT  B ENTER CAR');return;}
 say('DOOR BLOCKED');return;
 }
 let nearest=-1,best=28;
 for(let i=0;i<cars.length;i++){let c=cars[i],d=distance(player.x,player.y,c.x,c.y);if(d<best&&c.health>0){best=d;nearest=i;}}
 if(nearest>=0){drive=nearest;if(cars[drive].traffic&&!cars[drive].loan)requestHeat(1);cars[drive].traffic=false;player.x=cars[drive].x;player.y=cars[drive].y;sfx(1);say('DIRECTIONS DRIVE  A BRAKE');}
 else say('STAND BESIDE A CAR');
}
function _update(){
 if(savePending){let st=storage_status();if(!st.pending){savePending=false;log(st.error?'SAVE ERROR '+st.error:'SAVE ACK chapter='+mission);}}
 tick++;if(mode==='shop'){updateShop();return;}if(mode==='atlas'){if(btnp(9)||btnp(5))mode='play';return;}if(mode==='title'){if(btnp(4)){resetRun();beginChapter(0,true);sfx(1);}else if(btnp(5)&&savedStory)continueStory();return;}
 if(mode==='dialog'){
 if(dialogueReveal<dialogueLength){dialogueReveal=Math.min(dialogueLength,dialogueReveal+1.5);if(tick%5===0)sfx(6);}
 if(btnp(4)){
  if(dialogueReveal<dialogueLength)dialogueReveal=dialogueLength;
  else{dialogueIndex++;if(dialogueIndex>=dialogue.length){mode=dialogueEnd;log('DIALOG END '+mode);}
  else{dialogueLines=wrapWords(dialogue[dialogueIndex],220);dialogueReveal=0;dialogueLength=dialogueLines.join('').length;}}
 }return;
}
 if(mode==='lose'||mode==='win'){
 if(btnp(4)){if(mode==='lose')retryChapter();else {resetRun();beginChapter(0,true);}}
 else if(mode==='win'&&btnp(5)){mode='play';phase='cruise';freeRide=true;hp=100;heat=0;hack=0;nearAction=false;cops=[];say('FREE RIDE - ENJOY SOLEIL BAY');}
 else if(mode==='lose'&&btnp(5)){resetRun();beginChapter(0,true);}
 return;
}
totalSeconds+=1/30;
 if(btnp(9)){mode='atlas';return;}
 if(btnp(8)&&drive<0)cycleWeapon();
 nearShop=drive<0?shopAt(player.x,player.y):null;nearAction=!freeRide&&distance(player.x,player.y,targetX,targetY)<25;
 if(nearShop&&btnp(4)&&!nearAction){if(heat||pendingHeat){say('LOSE POLICE BEFORE SHOPPING');return;}else{mode='shop';shopIndex=0;fire=0;return;}}
 if(shotCooldown>0)shotCooldown--;updateEconomy();
 if(dispatchTicks>0&&--dispatchTicks===0){setHeat(pendingHeat);pendingHeat=0;}
 if(repairCooldown>0)repairCooldown--;
 nearAction=!freeRide&&distance(player.x,player.y,targetX,targetY)<25;
 if(toastTicks>0)toastTicks--;if(hurt>0)hurt--;if(fire>0)fire--;
 let dx=(btn(1)?1:0)-(btn(0)?1:0),dy=(btn(3)?1:0)-(btn(2)?1:0),mag=Math.sqrt(dx*dx+dy*dy);
 if(mag){dx/=mag;dy/=mag;dir=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);}
 if(btnp(5))enterExit();
 if(drive>=0){
 const c=cars[drive];
 if(mag){let goal=Math.atan2(dx,-dy)/(Math.PI*2),diff=goal-c.angle;diff-=Math.round(diff);c.angle+=clamp(diff,-TURNS[c.kind],TURNS[c.kind]);c.speed=Math.min(btn(4)?1:TOPS[c.kind],c.speed+(c.kind===6?.2:.14));}
 else c.speed*=btn(4) ? 0.7 : 0.92;
 let vx=Math.sin(c.angle*Math.PI*2)*c.speed,vy=-Math.cos(c.angle*Math.PI*2)*c.speed;
 if(moveBody(c,vx,vy,c.kind===6?5:8)){if(c.speed>1.7&&hurt===0){c.health-=c.kind===7?4:7;damagePlayer(c.kind===6?6:3);hurt=12;sfx(3);burst(c.x,c.y,26,8);}c.speed*=.35;}
 if(btn(4)&&c.speed>.7&&tick%3===0){marks.push({x:c.x,y:c.y,a:c.angle,t:90});if(marks.length>35)marks.shift();}
 player.x=c.x;player.y=c.y;
 if(tick%10===0&&c.speed>1.3)burst(c.x-vx*4,c.y-vy*4,6,1);
 }else{
 if(mag){let ox=player.x,oy=player.y;moveFoot(player,dx*1.6,dy*1.6);let moved=distance(ox,oy,player.x,player.y);stepClock=moved>.1?stepClock+moved*.3125:0;}else stepClock=0;
 if(btn(4)&&!nearAction&&!nearShop&&gunUnlocked&&shotCooldown===0&&(fire===0||weapon===1&&fire<=8)){
 if(ammo[weapon]>0){fire=16;shotCooldown=weapon===3?48:weapon===2?30:weapon===1?8:16;}else if(btnp(4))say('OUT OF AMMO - VISIT GEAR SHOP');
 }
 if(fire===14)firePlayerShot();
 }
 // Civilian traffic follows road loops; the player's car remains independently steerable.
 for(let i=0;i<cars.length;i++){
 let c=cars[i];if(i===drive)continue;
 if(c.traffic&&!c.destroyed){
 let p=c.path[c.node],dx=p[0]-c.x,dy=p[1]-c.y,dd=Math.sqrt(dx*dx+dy*dy);
 if(dd<5){c.node=(c.node+1)%c.path.length;}else{
 let stop=distance(c.x,c.y,player.x,player.y)<34||trafficMustStop(c,dx,dy);
 let speed=stop?0:0.82;
 if(speed){moveBody(c,dx/dd*speed,dy/dd*speed,7);c.angle=Math.atan2(dx,-dy)/(Math.PI*2);}
 }
 }
 if(drive>=0){
 let pc=cars[drive],dd=distance(pc.x,pc.y,c.x,c.y);
 if(dd<19&&dd>0.1){
 let impact=pc.speed;
 moveBody(pc,(pc.x-c.x)/dd*2,(pc.y-c.y)/dd*2,8);
 if(!c.destroyed)moveBody(c,(c.x-pc.x)/dd*1.5,(c.y-pc.y)/dd*1.5,7);
 pc.speed*=.6;
 if(impact>1.4&&hurt===0){pc.health-=5;damagePlayer(2);hurt=18;burst(pc.x,pc.y,26,6);sfx(3);requestHeat(1);}
 player.x=pc.x;player.y=pc.y;
 }
 }
 }
 if(drive>=0&&tick%20===0&&cars[drive].speed>1)sfx(0);
 if(heat>0&&tick%95===0)sfx(5);
 updatePlayerShots();
 let nearest=999;
 for(let c of cops){
 if(c.disabled||c.health<=0)continue;
 let pd=distance(c.x,c.y,player.x,player.y);nearest=Math.min(nearest,pd);
 if(c.officer){updateOfficer(c);nearest=Math.min(nearest,distance(c.officer?c.officer.x:c.x,c.officer?c.officer.y:c.y,player.x,player.y));continue;}
 if(pd<62&&(drive<0||cars[drive].speed<1.3)&&clearSight(c.x,c.y,player.x,player.y)&&!c.stun){deployOfficer(c);continue;}
 if(c.stun>0){c.stun--;continue;}
 c.navTick--;if(c.navTick<=0){findRoute(c,player.x,player.y);c.navTick=35;}
 let tx=player.x,ty=player.y;
 if(c.route.length){let n=c.route[c.route.length-1];tx=n%48*16+8;ty=Math.floor(n/48)*16+8;if(distance(c.x,c.y,tx,ty)<6)c.route.pop();}
 let vx=tx-c.x,vy=ty-c.y,len=Math.sqrt(vx*vx+vy*vy);
 if(len>1&&distance(c.x,c.y,player.x,player.y)>(drive>=0?25:13)){let ang=Math.atan2(vx,-vy)/(Math.PI*2),dif=ang-c.angle;dif-=Math.round(dif);c.angle+=clamp(dif,-.055,.055);moveBody(c,vx/len*(1.35+heat*.1),vy/len*(1.35+heat*.1),7);}
 // Resolve solid vehicle contact before applying patrol damage.
 for(let v of cars){
 if(v===cars[drive])continue;
 let dd=distance(c.x,c.y,v.x,v.y);
 if(dd>0.1&&dd<23){let push=(23-dd)*0.55;moveBody(c,(c.x-v.x)/dd*push,(c.y-v.y)/dd*push,7);}
 }
 for(let v of cops){if(v===c)continue;let dd=distance(c.x,c.y,v.x,v.y);if(dd>0.1&&dd<24){moveBody(c,(c.x-v.x)/dd,(c.y-v.y)/dd,7);}}
 let ds=distance(c.x,c.y,player.x,player.y);nearest=Math.min(nearest,ds);
 if(drive>=0&&cars[drive].speed>1.3&&ds<25&&hurt===0){damagePlayer(5);hurt=40;sfx(3);burst(player.x,player.y,13,7);let len2=Math.max(1,ds);moveBody(c,(c.x-player.x)/len2*12,(c.y-player.y)/len2*12,7);c.stun=30;}
 }
 updateSpecials();nearest=Math.min(nearest,specialNearest());
 if(heat){heatAge++;if(nearest>115&&heatAge>150)escape++;else escape=Math.max(0,escape-2);if(escape>=150){heat=0;cops=[];escape=0;say('POLICE LOST');sfx(4);}}
 updatePoliceShots();updateVehicleDamage();
 for(let w of crowd){
  if(w.dead){w.deathAge++;if(w.deathAge<10)moveBody(w,(w.kx||0)*.5,(w.ky||0)*.5,4);continue;}
  if(w===questPerson&&phase!=='pickup')continue;
  if(w.hitCooldown>0)w.hitCooldown--;
  if(w.hitTimer>0){
   w.hitTimer--;moveBody(w,w.kx||0,w.ky||0,4);w.kx*=.80;w.ky*=.80;
   if(w.hitTimer===0){w.panic=180;log('PEDESTRIAN recovered');}
  }else if(w.static){let dx=w.homeX-w.x,dy=w.homeY-w.y,len=Math.hypot(dx,dy);w.walking=len>1;if(w.walking){moveBody(w,dx/len*.6,dy/len*.6,4);w.dir=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?2:0;}}
  else{
   if(w.panic>0)w.panic--;
   let speed=w.panic>0?1.05:distance(w.x,w.y,player.x,player.y)<64&&fire>0?.9:.35;
   let p=w.path[w.node],vx=p[0]-w.x,vy=p[1]-w.y,len=Math.hypot(vx,vy);
   if(len<2){w.node+=w.sign;if(w.node<0||w.node>=w.path.length){w.sign=-w.sign;w.node=clamp(w.node,0,w.path.length-1);}}
   else{w.dir=Math.abs(vx)>Math.abs(vy)?vx>0?1:3:vy>0?2:0;if(moveFoot(w,vx/len*speed,vy/len*speed)){w.sign=-w.sign;w.node=clamp(w.node+w.sign,0,w.path.length-1);}}
  }
  if(drive>=0&&!(w.hitCooldown>0)&&distance(w.x,w.y,player.x,player.y)<16&&cars[drive].speed>.65)hitPedestrian(w,cars[drive]);
 }
 for(let i=motes.length-1;i>=0;i--){let p=motes[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.9;p.vy*=.9;if(--p.t<=0)motes.splice(i,1);}
 for(let i=marks.length-1;i>=0;i--)if(--marks[i].t<=0)marks.splice(i,1);

 if(!freeRide){
 const job=jobs[mission];
 if(phase==='pickup'&&nearAction&&drive<0){
   if(mission===3){if(btn(4))hack=Math.min(90,hack+1);else hack=Math.max(0,hack-2);}
   if((mission===3&&hack>=90)||(mission!==3&&btnp(4))){
     phase='deliver';hack=0;targetX=job.tx;targetY=job.ty;timer=job.seconds*30;
     requestHeat(job.stars);say(mission===1?'LIO IS WITH YOU':mission===4?'NICO IS WITH YOU':'COLLECTED: '+job.item);
     sfx(4);log('PICKUP chapter='+mission+' heat='+heat+' pending='+pendingHeat);
   }
 }
 if(phase==='deliver'){
   if(job.seconds>0)timer--;
   if(distance(player.x,player.y,targetX,targetY)<23){
     let vehicleOK=job.need<0||(drive>=0&&cars[drive].kind===job.need);
     let safe=mission!==3||(heat===0&&pendingHeat===0);
     let broadcast=mission!==5;
     if(mission===5&&drive<0&&btn(4))hack=Math.min(90,hack+1);else if(mission===5)hack=Math.max(0,hack-1);
     if(mission===5)broadcast=hack>=90;
     if(vehicleOK&&safe&&broadcast){
       cash+=job.reward;hp=Math.min(100,hp+30);if(drive>=0)cars[drive].health=100;
       heat=0;pendingHeat=0;dispatchTicks=0;cops=[];hack=0;nearAction=false;phase='done';missionDelay=75;
       say('CHAPTER COMPLETE +USD '+job.reward);sfx(4);burst(player.x,player.y,27,16);
       log('COMPLETE chapter='+mission+' cash='+cash);
     }else if(tick%60===0){
       say(!vehicleOK?'ARRIVE IN THE '+VEHICLES[job.need]:!safe?'LOSE THE PATROLS FIRST':'ON FOOT: HOLD A TO BROADCAST');
     }
   }
   if(job.seconds>0&&timer<=0){mode='lose';say('MISSION TIME EXPIRED');log('LOSE timeout');}
 }
 if(phase==='done'&&--missionDelay<=0){
   if(mission+1>=jobs.length){
     saveStory(true);log('STORY COMPLETE cash='+cash);
     dialog('SOLEIL BAY NEWS',[
       'The tape plays across Soleil Bay. Vale can no longer hide behind his patrols.',
       'The port workers open the gates. Nico returns to Mara, and Iris publishes the ledger.',
       'With his accounts frozen, Vale is arrested. The harbor belongs to its people again.',
       'Alex, Nico and Mara reopen the garage. For the first time in weeks, the bay feels like home.'
     ],'win');
   }else beginChapter(mission+1,true);
 }
 }
 if(heat===0&&pendingHeat===0&&distance(player.x,player.y,jobs[0].tx,jobs[0].ty)<35&&repairCooldown===0&&(drive<0||cars[drive].speed<.3)){
   if(++repairTicks>=45){hp=100;if(drive>=0)cars[drive].health=100;repairCooldown=150;repairTicks=0;say('MARA: PATCHED UP. TAKE CARE.');}
 }else repairTicks=0;
 if(hp<=0||(drive>=0&&cars[drive].health<=0))loseEncounter('BUSTED');
 if(contactLost>0&&--contactLost===0)loseEncounter('CONTACT LOST');
 camx=clamp(player.x-view.width*.5,0,WW-view.width);camy=clamp(player.y-view.height*.53,0,WH-view.height);
 if(tick%120===0)log('PLAY job='+mission+' x='+Math.round(player.x)+' y='+Math.round(player.y)+' car='+drive+' hp='+hp+' phase='+phase+' heat='+heat+' armor='+armor+' ammo='+ammo.join(','));
}

function clearSight(x,y,tx,ty){
 let n=Math.ceil(distance(x,y,tx,ty)/5);
 for(let i=1;i<n;i++)if(blocked(x+(tx-x)*i/n,y+(ty-y)*i/n,1))return false;
 return true;
}
function hitPedestrian(w,c){
 let speed=c.speed,a=c.angle*Math.PI*2;
 w.kx=Math.sin(a)*(speed+.8);w.ky=-Math.cos(a)*(speed+.8);
 w.hitTimer=speed>1.4?96:18;w.hitCooldown=w.hitTimer+90;w.panic=180;
 c.speed*=.42;burst(w.x,w.y,6,6);sfx(3);
 if(speed>1.4){damageActor(w,speed*22,false);requestHeat(1);if(!w.dead)say('HIT AND RUN - WITNESS ALERT');}
 else say('WATCH THE SIDEWALK');
 for(let other of walkers)if(other!==w&&distance(w.x,w.y,other.x,other.y)<85){
  other.panic=180;
  let p=other.path[clamp(other.node+other.sign,0,other.path.length-1)];
  if(distance(p[0],p[1],w.x,w.y)<distance(other.x,other.y,w.x,w.y))other.sign=-other.sign;
 }
 log('PEDESTRIAN impact speed='+speed.toFixed(2)+' x='+Math.round(w.x)+' y='+Math.round(w.y));
}
function deployOfficer(c){
 let side=[[20,0],[-20,0],[0,22],[0,-22]];
 for(let p of side)if(!blocked(c.x+p[0],c.y+p[1],4)&&!vehicleAt(c.x+p[0],c.y+p[1],c)){
  c.officer={x:c.x,y:c.y,exitX:c.x+p[0],exitY:c.y+p[1],deploy:18,warning:75,
   attack:0,cooldown:20,stun:0,dir:2,step:0,route:[],navTick:0,hp:70,isOfficer:true};
  c.speed=0;say('POLICE: STOP! HANDS UP!');
  log('POLICE dismount x='+Math.round(c.x)+' y='+Math.round(c.y));return;
 }
 c.stun=15;
}
function updateOfficer(c){
 let o=c.officer,ds=distance(o.x,o.y,player.x,player.y);
 if(o.dead){c.disabled=true;return;}
 if(o.deploy>0){o.x+=(o.exitX-o.x)/o.deploy;o.y+=(o.exitY-o.y)/o.deploy;o.deploy--;o.step+=.25;return;}
 if(o.stun>0){o.stun--;return;}
 if(drive>=0&&cars[drive].speed>1&&ds<16){
  damageActor(o,cars[drive].speed*40,true);o.stun=30;o.attack=0;let a=cars[drive].angle*Math.PI*2;moveBody(o,Math.sin(a)*14,-Math.cos(a)*14,4);
  cars[drive].speed*=.6;burst(o.x,o.y,6,6);sfx(3);requestHeat(Math.min(5,Math.max(heat,pendingHeat)+1));return;
 }
 if(o.warning>0)o.warning--;
 if(ds>160){
  o.attack=0;let d=distance(o.x,o.y,c.x,c.y);
  if(d<7){c.officer=null;c.stun=20;c.navTick=0;log('POLICE reboard');return;}
  moveBody(o,(c.x-o.x)/d*1.4,(c.y-o.y)/d*1.4,4);o.step+=.2;return;
 }
 if(o.attack>0){
  o.attack--;
  if(o.attack===22&&clearSight(o.x,o.y,o.aimX,o.aimY)){
   let dx=o.aimX-o.x,dy=o.aimY-o.y,d=Math.max(1,Math.hypot(dx,dy));
   if(policeShots.length<24)policeShots.push({x:o.x+dx/d*9,y:o.y+dy/d*9,vx:dx/d*3,vy:dy/d*3,t:44});
   sfx(2);log('POLICE shot dir='+o.dir);
  }
  if(o.attack===0)o.cooldown=38+((c.x|0)%20);
  return;
 }
 let vx=player.x-o.x,vy=player.y-o.y;
 o.dir=Math.abs(vx)>Math.abs(vy)?vx>0?1:3:vy>0?2:0;
 if(o.cooldown>0)o.cooldown--;
 let sight=clearSight(o.x,o.y,player.x,player.y);
 if(ds<100&&sight&&o.warning===0&&o.cooldown===0){
  o.attack=36;o.aimX=player.x;o.aimY=player.y;o.step=0;return;
 }
 if(ds>48||!sight){
  if(!sight){if(--o.navTick<=0){findRoute(o,player.x,player.y);o.navTick=40;}if(o.route.length){let n=o.route[o.route.length-1];vx=n%48*16+8-o.x;vy=Math.floor(n/48)*16+8-o.y;if(Math.hypot(vx,vy)<5)o.route.pop();}}
  let d=Math.max(1,Math.hypot(vx,vy));if(moveFoot(o,vx/d*.9,vy/d*.9))moveFoot(o,-vy/d*.9,vx/d*.9);o.step+=.16;
 }else o.step=0;
}
function updatePoliceShots(){
 if(!heat){policeShots.length=0;return;}
 for(let i=policeShots.length-1;i>=0;i--){
  let b=policeShots[i];b.x+=b.vx;b.y+=b.vy;b.t--;
  if(blocked(b.x,b.y,1)){b.t=0;burst(b.x,b.y,26,2);}
  if(b.t>0&&distance(b.x,b.y,player.x,player.y)<(drive>=0?10:5)){
   b.t=0;if(!hurt){damagePlayer(b.damage||(drive>=0?3:8));if(drive>=0)cars[drive].health-=6;hurt=22;sfx(3);burst(b.x,b.y,26,5);log('POLICE hit hp='+hp);}
  }
  for(let c of cars)if(b.t>0&&c!==cars[drive]&&distance(b.x,b.y,c.x,c.y)<11){if(!c.destroyed)c.health-=b.damage||8;b.t=0;}
  if(b.t<=0){if(b.shell){burst(b.x,b.y,26,20);let d=distance(b.x,b.y,player.x,player.y);if(d<26&&!hurt&&clearSight(b.x,b.y,player.x,player.y)){damagePlayer(Math.round(28*(1-d/36)));hurt=22;}for(let c of cars)if(distance(c.x,c.y,b.x,b.y)<28)c.health-=25;}policeShots.splice(i,1);}
 }
}

function stationaryPerson(x,y,kind){return {x,y,homeX:x,homeY:y,kind,static:true,walking:false,dir:2,phase:0};}

function vehicleAt(x,y,except){
 for(let c of cars)if(c!==except&&distance(x,y,c.x,c.y)<(c.kind===6?9:14))return true;
 for(let c of cops)if(c!==except&&distance(x,y,c.x,c.y)<14)return true;
 return false;
}
function moveFoot(o,dx,dy){
 let x=o.x,y=o.y,hit=moveBody(o,dx,dy,4);
 for(let list of [cars,cops])for(let c of list){
  let old=distance(x,y,c.x,c.y),now=distance(o.x,o.y,c.x,c.y),radius=c.kind===6?9:14;
  if(now<radius&&now<old){o.x=x;o.y=y;hit=true;}
 }
 return hit;
}
