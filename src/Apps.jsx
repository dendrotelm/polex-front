import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────
// Pliki w public/: tunel.jpeg, adam.jpeg, pudzian.jpeg, image_8cdc9e.jpg, dywan.jpeg, rzepa.png, wyjscie.png
// Audio w public/: freesound_community-horror-ambience-01-66708.mp3, stomping-footsteps-sound-effect.mp3

const ANOMALIES = [
  { id:"no_light", name:"Brak żarówki", hint:"Ciemność tam gdzie świeciła lampa" },
  { id:"figure", name:"Nieznajomy", hint:"Ktoś stoi na końcu korytarza" },
  { id:"open_door", name:"Otwarte drzwi nr 7", hint:"Drzwi 7 są uchylone" },
  { id:"stroller", name:"Wywrócony wózek", hint:"Wózek leży na boku" },
  { id:"writing", name:"Napis na ścianie", hint:"Coś napisano czerwoną farbą" },
  { id:"puddle", name:"Kałuża", hint:"Woda na środku podłogi" },
  { id:"broken_mailbox", name:"Wyrwana skrzynka", hint:"Skrzynki pocztowe wyglądają inaczej" },
  { id:"cat", name:"Czarny kot", hint:"Czarny kot siedzi w cieniu" },
  { id:"jp2_distorted", name:"Straszny papież", hint:"Twarz na obrazie się zmieniła" },
  { id:"malysz_pudzian", name:"Podmienione zdjęcie", hint:"Ten sportowiec wygląda inaczej niż zwykle" },
  { id:"napis_zmiana", name:"Zmieniony napis", hint:"Ten napis jakoś dziwnie brzmi..." },
  { id:"no_mess_7", name:"Zniknął bałagan", hint:"Pod drzwiami 7 jest podejrzanie czysto" },
  { id:"jp2_death_tg", name:"Telegazeta - Papież", hint:"Spójrz na ekran telewizora" },
  { id:"tg_sales", name:"Telegazeta - Cebula", hint:"Ktoś dał ogłoszenie w telewizji" },
  { id:"peephole_eye", name:"Oko w wizjerze", hint:"Sąsiad pod 'piątką' obserwuje cię przez judasza" },
];

// ─── CANVAS TEXTURES ───────────────────────────────────────────────────────

function mkWall() {
  const c = document.createElement("canvas"); c.width=512; c.height=512;
  const g = c.getContext("2d");
  g.fillStyle="#50574A"; g.fillRect(0,0,512,308);
  for(let i=0;i<60;i++){
    const x = Math.random() * 512;
    g.strokeStyle=`rgba(20,25,15,${.04+Math.random()*.08})`;
    g.lineWidth=1+Math.random()*1.5;
    g.beginPath(); g.moveTo(x,0); g.lineTo(x+Math.random()*6-3,308); g.stroke();
  }
  for(let x=0;x<512;x+=68){
    const gr=g.createLinearGradient(x,0,x+68,0);
    gr.addColorStop(0,"rgba(255,255,255,0)");
    gr.addColorStop(.45,"rgba(255,255,255,.05)");
    gr.addColorStop(1,"rgba(255,255,255,0)");
    g.fillStyle=gr; g.fillRect(x,0,68,308);
  }
  g.fillStyle="#8C7C5C"; g.fillRect(0,308,512,204);
  for(let i=0;i<600;i++){
    g.fillStyle=`rgba(60,50,25,${Math.random()*.05})`;
    g.fillRect(Math.random()*512,308+Math.random()*204,Math.random()*4,Math.random()*3);
  }
  g.fillStyle="#1A1208"; g.fillRect(0,300,512,14);
  g.fillStyle="#3A2810"; g.fillRect(0,302,512,8);
  g.fillStyle="#151008"; g.fillRect(0,492,512,20);
  g.fillStyle="#2E2010"; g.fillRect(0,494,512,10);
  for(let x=0;x<=512;x+=68){
    g.fillStyle="#1A1208"; g.fillRect(x-3,0,5,308);
    g.fillStyle="rgba(90,70,25,.25)"; g.fillRect(x+1,0,2,308);
  }
  return c;
}

function mkFloor() {
  const c = document.createElement("canvas"); c.width=512; c.height=512;
  const g = c.getContext("2d");
  g.fillStyle="#6A655A"; g.fillRect(0,0,512,512); 
  for(let i=0;i<1000;i++){
      g.fillStyle=`rgba(0,0,0,${Math.random()*0.15})`;
      g.fillRect(Math.random()*512,Math.random()*512,Math.random()*4,Math.random()*4);
  }
  g.strokeStyle="rgba(0,0,0,0.3)"; g.lineWidth=3;
  for(let x=0;x<=512;x+=128){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,512); g.stroke(); }
  for(let y=0;y<=512;y+=128){ g.beginPath(); g.moveTo(0,y); g.lineTo(512,y); g.stroke(); }
  return c;
}

function mkCeil() {
  const c = document.createElement("canvas"); c.width=512; c.height=512;
  const g = c.getContext("2d");
  g.fillStyle="#D5C8A4"; g.fillRect(0,0,512,512);
  for(let i=0;i<300;i++){
    g.fillStyle="rgba(90,75,45,"+(Math.random()*.035)+")";
    g.fillRect(Math.random()*512,Math.random()*512,Math.random()*5,Math.random()*4);
  }
  return c;
}

function mkEyeTex() {
  const c = document.createElement("canvas"); c.width=64; c.height=64;
  const g = c.getContext("2d");
  g.fillStyle="#1A0A05"; g.fillRect(0,0,64,64);
  g.fillStyle="#FFFFFF"; g.beginPath(); g.ellipse(32,32, 28, 16, 0, 0, Math.PI*2); g.fill();
  g.fillStyle="#4080A0"; g.beginPath(); g.arc(32,32,14,0,Math.PI*2); g.fill();
  g.fillStyle="#000000"; g.beginPath(); g.arc(32,32,7,0,Math.PI*2); g.fill();
  g.fillStyle="#FFFFFF"; g.beginPath(); g.arc(28,28,3,0,Math.PI*2); g.fill();
  return c;
}

function mkNapisZrywaj() {
  const c = document.createElement("canvas"); c.width=512; c.height=80;
  const g = c.getContext("2d"); g.clearRect(0,0,512,80);
  g.font="bold 24px 'Courier New',monospace"; g.textAlign="center";
  g.fillStyle="rgba(220,200,120,.9)"; g.fillText("Zrywaj boki, parskaj w duchu...",256,48);
  return c;
}

function mkNapisNieLekajcie() {
  const c = document.createElement("canvas"); c.width=512; c.height=100;
  const g = c.getContext("2d"); g.clearRect(0,0,512,100);
  g.font="bold 30px 'Courier New',monospace"; g.textAlign="center";
  g.fillStyle="rgba(240,220,130,.95)";
  g.shadowColor="rgba(200,160,0,.6)"; g.shadowBlur=12;
  g.fillText("Nie lękajcie się!",256,58);
  return c;
}

function mkNapisNieZesrajcie() {
  const c = document.createElement("canvas"); c.width=512; c.height=100;
  const g = c.getContext("2d"); g.clearRect(0,0,512,100);
  g.font="bold 28px 'Courier New',monospace"; g.textAlign="center";
  g.fillStyle="rgba(200,60,60,.95)";
  g.shadowColor="rgba(180,0,0,.6)"; g.shadowBlur=14;
  g.fillText("Nie zesrajcie się!",256,58);
  return c;
}

function mkTelegazeta() {
  const c = document.createElement("canvas"); c.width=320; c.height=240;
  const g = c.getContext("2d");
  g.fillStyle="#0000CC"; g.fillRect(0,0,320,240);
  g.fillStyle="#CC0000";
  for(let i=0;i<10;i++){g.fillStyle=i%2===0?"#CC0000":"#AA0000";g.fillRect(i*32,0,32,20);g.fillRect(i*32,220,32,20);}
  g.font="bold 11px monospace"; g.fillStyle="#FFFFFF"; g.fillText("P100  100  05/07  TG1  pon.29.11  21:55",2,14);
  g.fillStyle="#00CCCC"; g.font="bold 16px monospace"; g.textAlign="center"; g.fillText("SPIS TREŚCI  101-104",160,48);
  g.textAlign="left"; g.fillStyle="#FFFFFF"; g.font="12px monospace";
  g.fillText("\"TELEGAZETA\"(R)",55,68); g.fillText("ul. Woronicza 17",55,83);
  g.fillText("00-999 Warszawa",55,98); g.fillText("tel. 022/5476706",55,113);
  g.fillStyle="#FFFF00"; g.font="bold 12px monospace";
  g.fillText("\u25a1 OGLOSZEN.    500",10,145);
  g.fillText("\u25a1 FINANSE      605",10,160);
  g.fillStyle="#FF4444"; g.fillRect(10,163,185,16);
  g.fillStyle="#FFFF00"; g.fillText("\u25a1 AKTUALNOSCI 110",10,175);
  g.fillStyle="#FFFFFF"; g.fillText("\u25a1 SPORT        200",10,191);
  g.fillText("\u25a1 PROGRAM TV  300",10,207);
  g.fillStyle="#0044FF"; g.fillRect(210,28,95,78);
  g.fillStyle="#FFFFFF"; g.font="bold 40px monospace"; g.textAlign="center"; g.fillText("tg",258,85);
  g.fillStyle="#FFFFFF"; g.fillRect(210,148,95,48);
  g.fillStyle="#0000AA"; g.font="bold 20px monospace"; g.fillText("TVP1",258,180);
  for(let y=0;y<240;y+=2){g.fillStyle="rgba(0,0,0,0.35)";g.fillRect(0,y,320,1);}
  return c;
}

function mkTelegazetaDeath() {
  const c = document.createElement("canvas"); c.width=320; c.height=240;
  const g = c.getContext("2d");
  g.fillStyle="#000000"; g.fillRect(0,0,320,240);
  g.fillStyle="#CC0000";
  for(let i=0;i<10;i++){g.fillRect(i*32,0,32,20);g.fillRect(i*32,220,32,20);}
  g.font="bold 11px monospace"; g.fillStyle="#FFFFFF"; g.fillText("P110  110  02/04  TG1  sob.02.04  21:37",2,14);
  g.fillStyle="#FFFFFF"; g.font="bold 18px monospace"; g.textAlign="center"; 
  g.fillText("PILNE WIADOMOŚCI",160,50);
  g.fillStyle="#CC0000"; g.fillRect(20,70,280,30);
  g.fillStyle="#FFFFFF"; g.font="bold 20px monospace";
  g.fillText("NIE ŻYJE PAPIEŻ",160,92);
  g.font="bold 16px monospace"; g.fillStyle="#FFFFFF";
  g.fillText("JAN PAWEŁ II",160,120);
  g.textAlign="left"; g.font="12px monospace"; g.fillStyle="#FFFF00";
  g.fillText("Zmarł dziś o godz. 21:37",30,150);
  g.fillText("w Watykanie.",30,165);
  g.fillStyle="#00CCCC"; g.fillText("Więcej informacji...",30,190);
  for(let y=0;y<240;y+=2){g.fillStyle="rgba(0,0,0,0.35)";g.fillRect(0,y,320,1);}
  return c;
}

function mkTelegazetaSales() {
  const c = document.createElement("canvas"); c.width=320; c.height=240;
  const g = c.getContext("2d");
  g.fillStyle="#0000CC"; g.fillRect(0,0,320,240);
  g.fillStyle="#CC0000";
  for(let i=0;i<10;i++){g.fillRect(i*32,0,32,20);g.fillRect(i*32,220,32,20);}
  g.font="bold 11px monospace"; g.fillStyle="#FFFFFF"; g.fillText("P500  500  12/12  TG1  sob.12.08  14:22",2,14);
  g.fillStyle="#FFFF00"; g.font="bold 16px monospace"; g.textAlign="center"; g.fillText("OGŁOSZENIA DROBNE",160,48);
  g.fillStyle="#FFFFFF"; g.font="14px monospace"; g.textAlign="left";
  g.fillText("SPRZEDAM ŚWIEŻE", 20, 90);
  g.fillText("ZIEMNIAKI I CEBULĘ", 20, 110);
  g.fillText("Z WŁASNEGO POLA.", 20, 130);
  g.fillStyle="#00FFFF";
  g.fillText("Dzwonić pod nr:", 20, 170);
  g.font="bold 18px monospace"; g.fillStyle="#FF4444";
  g.fillText("420 2137 1109", 20, 195);
  for(let y=0;y<240;y+=2){g.fillStyle="rgba(0,0,0,0.35)";g.fillRect(0,y,320,1);}
  return c;
}

function mkCreepyFaceOverlay() {
  const c = document.createElement("canvas"); c.width=256; c.height=356;
  const g = c.getContext("2d"); g.clearRect(0,0,256,356);
  // Puste oczodoły z czerwonymi punktami
  g.fillStyle="rgba(0,0,0,0.85)"; g.beginPath(); g.arc(105, 140, 18, 0, Math.PI*2); g.fill();
  g.beginPath(); g.arc(165, 140, 18, 0, Math.PI*2); g.fill();
  g.fillStyle="#FF0000"; g.shadowColor="#FF0000"; g.shadowBlur=10;
  g.beginPath(); g.arc(105, 140, 4, 0, Math.PI*2); g.fill();
  g.beginPath(); g.arc(165, 140, 4, 0, Math.PI*2); g.fill();
  g.shadowBlur=0;
  // Szeroki uśmiech
  g.beginPath(); g.arc(135, 230, 60, 0, Math.PI, false);
  g.lineWidth=14; g.strokeStyle="rgba(0,0,0,0.9)"; g.stroke();
  g.lineWidth=4; g.strokeStyle="#600000"; g.stroke();
  return c;
}

function mkDoor(num, style=0) {
  const c = document.createElement("canvas"); c.width=256; c.height=512;
  const g = c.getContext("2d");
  const colors = [
    {base:"#5C3A1E", dark:"#3A2210", mid:"#7A5030", trim:"#C8A040"},
    {base:"#1E3A2A", dark:"#0E2218", mid:"#2E5A3E", trim:"#A09060"},
    {base:"#2A2A3A", dark:"#161622", mid:"#3C3C52", trim:"#9A9080"},
    {base:"#5A2A10", dark:"#381808", mid:"#783C18", trim:"#C09030"},
    {base:"#3A3028", dark:"#221E18", mid:"#524840", trim:"#B09050"},
  ];
  const col = colors[style % colors.length];
  g.fillStyle = col.base; g.fillRect(0,0,256,512);
  for(let i=0;i<12;i++){
    g.strokeStyle=`rgba(0,0,0,${.04+Math.random()*.06})`;
    g.lineWidth=1+Math.random()*2;
    g.beginPath(); g.moveTo(Math.random()*40,0); g.bezierCurveTo(Math.random()*256,128,Math.random()*256,384,Math.random()*40+216,512); g.stroke();
  }
  const panels = [[16,14,224,110],[16,138,224,110],[16,264,224,210]];
  panels.forEach(([px,py,pw,ph])=>{
    g.fillStyle=col.dark; g.fillRect(px,py,pw,ph);
    g.fillStyle=col.mid; g.fillRect(px+3,py+3,pw-6,ph-6);
    g.fillStyle=col.base; g.fillRect(px+3,py+3,pw-6,4); g.fillRect(px+3,py+3,4,ph-6);
    g.fillStyle=`rgba(0,0,0,.3)`; g.fillRect(px+3,py+ph-7,pw-6,4); g.fillRect(px+pw-7,py+3,4,ph-6);
  });
  g.fillStyle="#888880"; g.beginPath(); g.arc(218,268,10,0,Math.PI*2); g.fill();
  g.fillStyle="#666860"; g.beginPath(); g.arc(218,268,7,0,Math.PI*2); g.fill();
  g.fillStyle="#A0A098"; g.fillRect(212,272,12,4); g.fillRect(192,273,22,6); g.fillRect(188,268,8,16);
  g.fillStyle="#C8C8C0"; g.fillRect(213,273,10,2);
  g.fillStyle="#1A1A18"; g.beginPath(); g.arc(128,195,7,0,Math.PI*2); g.fill();
  g.fillStyle="#2A2820"; g.beginPath(); g.arc(128,195,5,0,Math.PI*2); g.fill();
  g.fillStyle="rgba(80,100,120,.6)"; g.beginPath(); g.arc(127,194,3,0,Math.PI*2); g.fill();
  g.fillStyle="#D4C080"; g.fillRect(100,468,56,32);
  g.fillStyle="#B8A060"; g.fillRect(102,470,52,28);
  g.fillStyle="#3A2810"; g.font="bold 20px monospace"; g.textAlign="center"; g.fillText(String(num), 128, 492);
  g.fillStyle="#C8C0A0"; g.fillRect(228,296,18,26);
  g.fillStyle="#E0D8B8"; g.fillRect(230,298,14,10);
  g.fillStyle="#A09060"; g.fillRect(228,294,18,4);
  return c;
}

function mkWriting() {
  const c = document.createElement("canvas"); c.width=512; c.height=200;
  const g = c.getContext("2d"); g.clearRect(0,0,512,200);
  g.font="bold 42px monospace"; g.textAlign="center";
  g.fillStyle="rgba(160,8,8,.95)"; g.fillText("JAM JEST 444",256,52);
  g.beginPath(); g.moveTo(55,52); g.lineTo(48,200); g.stroke();
  return c;
}

function mkNotice() {
  const c = document.createElement("canvas"); c.width=400; c.height=300;
  const g = c.getContext("2d");
  g.fillStyle="#E8E0C0"; g.fillRect(0,0,400,300);
  for(let i=0;i<200;i++){
    g.fillStyle=`rgba(100,80,40,${Math.random()*.08})`;
    g.beginPath(); g.arc(Math.random()*400, Math.random()*300, Math.random()*15, 0, Math.PI*2); g.fill();
  }
  
  g.fillStyle="#1A1A1A"; g.font="bold 26px 'Comic Sans MS', cursive"; g.textAlign="left";
  const lines = [
    "Sąsiady z lokalu 7!!!",
    "Weźcie te wory",
    "z cebulom i",
    "ziemniakami z",
    "korytarza bo śmierdzi!"
  ];
  lines.forEach((line, i) => {
    g.fillText(line, 20, 60 + i*42);
  });
  
  g.fillStyle="#A03030";
  g.beginPath(); g.arc(20,20,6,0,Math.PI*2); g.fill();
  g.beginPath(); g.arc(380,20,6,0,Math.PI*2); g.fill();
  return c;
}

// ─── MESH BUILDERS ────────────────────────────────────────────────────────────

const SM = o => new THREE.MeshStandardMaterial(o);
const BX = (w,h,d) => new THREE.BoxGeometry(w,h,d);
const CT = cv => new THREE.CanvasTexture(cv);
const RW = (t,s,r) => { t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(s,r); t.needsUpdate=true; return t; };

function buildAptDoor(num, style=0) {
  const g = new THREE.Group();
  const W_D=1.02, H_D=2.12, D_D=0.08;
  const frameMat = SM({color:0x1A1208, roughness:.9});
  const frameW = 0.07;
  [[0, H_D/2+frameW/2, W_D+frameW*2, frameW, .12],
   [0,-frameW/2, W_D+frameW*2, frameW, .12],
   [-(W_D/2+frameW/2), H_D/2, frameW, H_D+frameW, .12],
   [ (W_D/2+frameW/2), H_D/2, frameW, H_D+frameW, .12]
  ].forEach(([fx,fy,fw,fh,fd])=>{
    const f=new THREE.Mesh(BX(fw,fh,fd), frameMat);
    f.position.set(fx,fy,-.04); g.add(f);
  });
  const doorMat = SM({map:CT(mkDoor(num, style)), roughness:.75});
  const door = new THREE.Mesh(BX(W_D, H_D, D_D), doorMat);
  door.position.set(0, H_D/2, 0); g.add(door);
  const thresh = new THREE.Mesh(BX(W_D+frameW*2, .04, .14), SM({color:0x5A3A18, roughness:.7}));
  thresh.position.set(0,-.02,.0); g.add(thresh);
  const glassMat = new THREE.MeshPhysicalMaterial({color:0x8AAABB, transparent:true, opacity:.35, roughness:.1, metalness:.1});
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(.42,.18), glassMat);
  glass.position.set(0, H_D-.22, D_D/2+.001); g.add(glass);
  const glassFrameMat = SM({color:0x1A1208, roughness:.9});
  [[0,.09,.46,.02,.02],[0,-.09,.46,.02,.02],[.23,0,.02,.2,.02],[-.23,0,.02,.2,.02]].forEach(([gx,gy,gw,gh,gd])=>{
    const gf=new THREE.Mesh(BX(gw,gh,gd),glassFrameMat);
    gf.position.set(gx, H_D-.22+gy, D_D/2+.002); g.add(gf);
  });
  return g;
}

function buildRadiator() {
  const g=new THREE.Group(), m=SM({color:0xC0B8A0,roughness:.5,metalness:.5});
  for(let i=0;i<8;i++){const p=new THREE.Mesh(BX(.06,.82,.13),m);p.position.set(i*.1-.35,.42,0);g.add(p);}
  const bm=SM({color:0xA8A090,roughness:.4,metalness:.6});
  [.84,.02].forEach(y=>{const b=new THREE.Mesh(BX(.85,.07,.15),bm);b.position.set(0,y,0);g.add(b);});
  const vm=SM({color:0x808878,roughness:.4,metalness:.7});
  const v1=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.1,8),vm); v1.rotation.z=Math.PI/2; v1.position.set(.46,.05,0); g.add(v1);
  return g;
}

function buildTV(screenTexture) {
  const g=new THREE.Group();
  const body=new THREE.Mesh(BX(.75,.6,.52),SM({color:0x1E180C,roughness:.85})); body.position.set(0,.3,0); g.add(body);
  const scrMat = new THREE.MeshBasicMaterial({map:screenTexture});
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.58,.44), scrMat); scr.position.set(0,.33,.262); g.add(scr);
  const glow=new THREE.PointLight(0x00A0A0,.6,1.8,2); glow.position.set(0,.33,.4); g.add(glow);
  const bev=SM({color:0x141008,roughness:.9});
  [[-0.34,0,.26,BX(.06,.52,.04)],[.34,0,.26,BX(.06,.52,.04)],[0,.57,.26,BX(.72,.06,.04)],[0,.07,.26,BX(.72,.06,.04)]].forEach(([x,y,z,geo])=>{const m=new THREE.Mesh(geo,bev);m.position.set(x,y,z);g.add(m);});
  const gm=SM({color:0x0E0A06,roughness:.95}); const grill=new THREE.Mesh(BX(.12,.38,.02),gm); grill.position.set(.3,.3,.262); g.add(grill);
  const am=SM({color:0x909088,roughness:.6,metalness:.6});
  [[-0.1,.3],[.1,-.3]].forEach(([ox,rz])=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.55,6),am);a.position.set(ox,.88,0);a.rotation.z=rz;g.add(a);});
  const lm=SM({color:0x100C06,roughness:.9});
  [-.2,.2].forEach(x=>{const l=new THREE.Mesh(BX(.06,.22,.06),lm);l.position.set(x,-.11,0);g.add(l);});
  return g;
}

function buildTVStand(screenTexture) {
  const g=new THREE.Group(); const tm=SM({color:0x3A2C18,roughness:.9});
  const top=new THREE.Mesh(BX(1.0,.06,.6),tm); top.position.set(0,.68,0); g.add(top);
  const shelf=new THREE.Mesh(BX(.96,.04,.56),SM({color:0x2E2210,roughness:.9})); shelf.position.set(0,.36,0); g.add(shelf);
  [[-0.42,-.24],[.42,-.24],[-.42,.24],[.42,.24]].forEach(([lx,lz])=>{const l=new THREE.Mesh(BX(.05,.68,.05),tm);l.position.set(lx,.34,lz);g.add(l);});
  const back=new THREE.Mesh(BX(.92,.32,.02),SM({color:0x2A1E0E,roughness:.95})); back.position.set(0,.52,-.28); g.add(back);
  const tv=buildTV(screenTexture); tv.position.set(0,.71,0); g.add(tv);
  return g;
}

function buildMalyszFrame(imgSrc) {
  const g = new THREE.Group(); const w=.7, h=.9;
  const tex = new THREE.TextureLoader().load(imgSrc);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = new THREE.Mesh(new THREE.PlaneGeometry(w,h), SM({map:tex})); g.add(img);
  const fm = SM({color:0x3A2208,roughness:.7,metalness:.2}); const fw=.045;
  [[0,h/2+fw/2,w+fw*2,fw,.025],[0,-h/2-fw/2,w+fw*2,fw,.025],[w/2+fw/2,0,fw,h,.025],[-w/2-fw/2,0,fw,h,.025]].forEach(([fx,fy,fw2,fh,fd])=>{
    const fr=new THREE.Mesh(BX(fw2,fh,fd),fm); fr.position.set(fx,fy,.01); g.add(fr);
  });
  return g;
}

function buildJP2Frame(imgSrc, isDistorted=false) {
  const g=new THREE.Group(); const w=.82,h=1.14;
  const tex = new THREE.TextureLoader().load(imgSrc);
  tex.colorSpace = THREE.SRGBColorSpace; 
  const img=new THREE.Mesh(new THREE.PlaneGeometry(w,h),SM({map:tex})); g.add(img);
  
  // Zamiast zewnętrznego pliku zniekształcenia, malujemy straszną minę Canvasem!
  if(isDistorted){
    const overlayMat = new THREE.MeshBasicMaterial({map:CT(mkCreepyFaceOverlay()), transparent:true});
    const overlay = new THREE.Mesh(new THREE.PlaneGeometry(w,h), overlayMat);
    overlay.position.z = 0.005;
    img.add(overlay);
  }
  
  const fm=SM({color:0x5A3A08,roughness:.7,metalness:.25}); const fw=.055;
  [[0,h/2+fw/2,w+fw*2,fw,.03],[0,-h/2-fw/2,w+fw*2,fw,.03],[w/2+fw/2,0,fw,h,.03],[-w/2-fw/2,0,fw,h,.03]].forEach(([fx,fy,fw2,fh,fd])=>{
    const fr=new THREE.Mesh(BX(fw2,fh,fd),fm); fr.position.set(fx,fy,.02); g.add(fr);
  });
  const cm=SM({color:0xB89020,roughness:.5,metalness:.6});
  [[w/2,h/2],[w/2,-h/2],[-w/2,h/2],[-w/2,-h/2]].forEach(([cx,cy])=>{
    const cor=new THREE.Mesh(new THREE.SphereGeometry(.04,8,8),cm); cor.position.set(cx,cy,.04); g.add(cor);
  });
  return g;
}

function buildMailboxes(broken) {
  const g=new THREE.Group();
  const m=SM({color:0x808578,roughness:.6,metalness:.3}); const dm=SM({color:0x606558,roughness:.7});
  const hm=SM({color:0xA0A0A0,roughness:.5,metalness:.5});
  const rows=3, cols=4;
  for(let r=0;r<rows;r++) for(let col=0;col<cols;col++){
    if(broken && r===1 && col===2) continue;
    const mbX = col*.36 - (cols-1)*.36/2;
    const mbY = .1 + r*.32; 
    const mb=new THREE.Mesh(BX(.35,.31,.18),m); mb.position.set(mbX, mbY, 0); g.add(mb);
    const door=new THREE.Mesh(BX(.33,.29,.02),dm); door.position.set(mbX, mbY, .09); g.add(door);
    const slot=new THREE.Mesh(BX(.26,.03,.01),SM({color:0x202020})); slot.position.set(mbX, mbY+.1, .105); g.add(slot);
    const lock=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.04,8),hm); lock.rotation.x=Math.PI/2; lock.position.set(mbX+.12, mbY-.08, .11); g.add(lock);
    const num=new THREE.Mesh(BX(.05,.02,.01),SM({color:0x303030})); num.position.set(mbX-.1, mbY-.08, .105); g.add(num);
  }
  if(broken){
    const p=new THREE.Mesh(BX(.35,.31,.18),m); p.position.set(.2,-.2,.4); p.rotation.set(1.2, 0.5, 0.2); g.add(p);
    const pd=new THREE.Mesh(BX(.33,.29,.02),dm); pd.position.set(.2,-.18,.45); pd.rotation.set(1.3, 0.5, 0.25); g.add(pd);
  }
  return g;
}

function buildStroller(knocked) {
  const g=new THREE.Group();
  const m=SM({color:0x6A5C4A,roughness:.9}); 
  const wm=SM({color:0x151008,roughness:.8});
  [[-.18,-.24],[.18,-.24],[-.18,.2],[.18,.2]].forEach(([wx,wz])=>{
    const w=new THREE.Mesh(new THREE.TorusGeometry(.09,.018,8,20),wm); w.rotation.x=Math.PI/2; w.position.set(wx,.09,wz); g.add(w);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.33,6),m); leg.position.set(wx,.25,wz); g.add(leg);
  });
  const fr=new THREE.Mesh(BX(.38,.05,.48),m); fr.position.set(0,.42,0); g.add(fr);
  const se=new THREE.Mesh(BX(.42,.3,.5),m); se.position.set(0,.58,0); g.add(se);
  const ha=new THREE.Mesh(BX(.46,.05,.05),m); ha.position.set(0,.8,-.22); g.add(ha);
  const ho=new THREE.Mesh(BX(.4,.24,.32),m); ho.position.set(0,.82,.1); ho.rotation.x=-.3; g.add(ho);
  if(knocked){g.rotation.z=-1.4;g.position.y=.32;}
  return g;
}

function buildFigure() {
  const g=new THREE.Group(); const m=SM({color:0x040202,roughness:1});
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.18,10,10),m); hd.position.set(0,1.78,0); g.add(hd);
  const bd=new THREE.Mesh(BX(.38,.72,.22),m); bd.position.set(0,1.24,0); g.add(bd);
  [-1,1].forEach(s=>{
    const arm=new THREE.Mesh(BX(.13,.6,.14),m); arm.position.set(s*.28,1.24,0); arm.rotation.z=s*.18; g.add(arm);
    const leg=new THREE.Mesh(BX(.15,.72,.15),m); leg.position.set(s*.1,.52,0); g.add(leg);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,6,6),new THREE.MeshBasicMaterial({color:0x500000})); eye.position.set(s*.065,1.82,-.1); g.add(eye);
  });
  return g;
}

function buildCat() {
  const g=new THREE.Group(); const m=SM({color:0x040202,roughness:.9}); const em=new THREE.MeshBasicMaterial({color:0xD4D000});
  const bd=new THREE.Mesh(new THREE.SphereGeometry(.15,10,10),m); bd.scale.set(1,.82,1.35); bd.position.set(0,.17,0); g.add(bd);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.13,10,10),m); hd.position.set(0,.35,.1); g.add(hd);
  [-1,1].forEach(s=>{
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.042,.1,4),m); ear.position.set(s*.07,.48,.1); g.add(ear);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.018,6,6),em); eye.position.set(s*.045,.37,.22); g.add(eye);
  });
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.45,6),m); tail.position.set(.1,.16,-.22); tail.rotation.z=.5; tail.rotation.x=-.28; g.add(tail);
  return g;
}

function buildBike() {
  const g=new THREE.Group(); const m=SM({color:0x1E3A58,roughness:.6,metalness:.45}); const rm=SM({color:0xB8B8A8,roughness:.4,metalness:.65});
  [-0.56,.56].forEach(xo=>{
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,8,24),rm); rim.rotation.y=Math.PI/2; rim.position.set(xo,.32,0); g.add(rim);
    for(let i=0;i<8;i++){const sp=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.62,4),rm);sp.position.set(xo,.32,0);sp.rotation.z=i*Math.PI/4;g.add(sp);}
  });
  const tt=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,1.24,6),m); tt.rotation.z=Math.PI/2; tt.position.set(0,.62,0); g.add(tt);
  const dt=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.92,6),m); dt.rotation.z=.52; dt.position.set(.1,.4,0); g.add(dt);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.48,6),m); st.rotation.z=.12; st.position.set(.18,.58,0); g.add(st);
  const hb=new THREE.Mesh(BX(.02,.02,.42),m); hb.position.set(-.56,.8,0); g.add(hb);
  const seat=new THREE.Mesh(BX(.18,.04,.08),m); seat.position.set(.22,.84,0); g.add(seat);
  return g;
}

function buildMessOnFloor() {
  const g = new THREE.Group();
  const sackMat = SM({color:0xC0A070, roughness:1}); 
  const onionMat = SM({color:0xA05020, roughness:.8});
  const potatoMat = SM({color:0x908050, roughness:.9});
  const shoeMat = SM({color:0x303030, roughness:.7});
  
  const sack1 = new THREE.Mesh(new THREE.SphereGeometry(.25, 12, 12), sackMat);
  sack1.scale.set(1, 1.4, 1); sack1.position.set(0, .35, 0); g.add(sack1);
  for(let i=0; i<5; i++) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), onionMat);
    o.position.set(Math.random()*.2-.1, .55+Math.random()*.05, Math.random()*.2-.1);
    g.add(o);
  }
  const sack2 = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 12), sackMat);
  sack2.scale.set(1.5, 1, 1); sack2.position.set(.45, .28, .1); sack2.rotation.z = 0.2; g.add(sack2);
  for(let i=0; i<6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), potatoMat);
    p.scale.set(1.2,1,0.8);
    p.position.set(.45+Math.random()*.3-.15, .1, .1+Math.random()*.3);
    p.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(p);
  }
  const shoe1 = new THREE.Mesh(BX(.12, .08, .28), shoeMat);
  shoe1.position.set(-.3, .04, .2); shoe1.rotation.y = 0.4; g.add(shoe1);
  const shoe2 = new THREE.Mesh(BX(.12, .08, .28), shoeMat);
  shoe2.position.set(-.15, .04, .35); shoe2.rotation.y = -0.2; g.add(shoe2);
  return g;
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function PrlExit8() {
  const mountRef = useRef(null);
  const R = useRef({});
  const S = useRef({
    phase:"playing", hasAnomaly:false, anomaly:null,
    exitCount:0, streak:0, sanity: 100, yaw:0, pitch:0,
    keys:{}, decided:false, tunnelLock:false,
    drag:false, dx:0, dy:0, _lastCatPrompt:"0",
    touchMove:{active:false,id:null,sx:0,sy:0},
  });
  const stepCount = useRef(0);
  const ambienceRef = useRef(null);
  const stepsAudioRef = useRef(null);
  const [ui, setUi] = useState({
    phase:"playing", exitCount:0, streak:0, sanity: 100,
    message:"", hint:false, steps:0,
    anomaly:null, hasAnomaly:false,
    rzepaVisible:false, rzepaFound:false, rzepaHint:false,
    catPrompt:"", catMessage:""
  });
  const up = p => setUi(prev=>({...prev,...p}));

  useEffect(()=>{
    const mount = mountRef.current; if(!mount) return;
    const sr = S.current;

    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(mount.clientWidth,mount.clientHeight);
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const ambience = new Audio("freesound_community-horror-ambience-01-66708.mp3");
    ambience.loop = true; ambience.volume = 0.35;
    ambienceRef.current = ambience;
    const stepsAudio = new Audio("stomping-footsteps-sound-effect.mp3");
    stepsAudio.loop = true; stepsAudio.volume = 0.55;
    stepsAudioRef.current = stepsAudio;
    const startAudio = () => { ambience.play().catch(()=>{}); document.removeEventListener("click", startAudio); document.removeEventListener("keydown", startAudio); };
    document.addEventListener("click", startAudio);
    document.addEventListener("keydown", startAudio);
    
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x060504);
    // Neutralna szarość bez czerwonej poświaty
    scene.fog=new THREE.FogExp2(0x0C0C0C,.044);

    const cam=new THREE.PerspectiveCamera(75,mount.clientWidth/mount.clientHeight,.05,80);
    cam.position.set(0,1.52,1.5); cam.rotation.order="YXZ";

    const cvs=renderer.domElement;
    const onMD=e=>{if(e.button===0){sr.drag=true;sr.dx=e.clientX;sr.dy=e.clientY;}};
    const onMU=()=>{sr.drag=false;};
    const onMM=e=>{
      if(!sr.drag)return;
      sr.yaw-=(e.clientX-sr.dx)*.004;
      sr.pitch=Math.max(-.52,Math.min(.52,sr.pitch-(e.clientY-sr.dy)*.004));
      sr.dx=e.clientX; sr.dy=e.clientY;
    };
    const onKD=e=>{
      sr.keys[e.code]=true;
      if(["KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight", "KeyE", "ShiftLeft", "ShiftRight"].includes(e.code))e.preventDefault();
    };
    const onKU=e=>{sr.keys[e.code]=false;};
    const touches={move:null, look:null};
    const onTStart=e=>{
      e.preventDefault();
      for(const t of e.changedTouches){
        const isLeft=t.clientX<mount.clientWidth/2;
        if(isLeft&&!touches.move) touches.move={id:t.identifier,sx:t.clientX,sy:t.clientY,cx:t.clientX,cy:t.clientY};
        else if(!isLeft&&!touches.look) touches.look={id:t.identifier,cx:t.clientX,cy:t.clientY};
      }
    };
    const onTMove=e=>{
      e.preventDefault();
      for(const t of e.changedTouches){
        if(touches.move&&t.identifier===touches.move.id){touches.move.cx=t.clientX;touches.move.cy=t.clientY;}
        if(touches.look&&t.identifier===touches.look.id){
          sr.yaw-=(t.clientX-touches.look.cx)*.004;
          sr.pitch=Math.max(-.52,Math.min(.52,sr.pitch-(t.clientY-touches.look.cy)*.004));
          touches.look.cx=t.clientX; touches.look.cy=t.clientY;
        }
      }
    };
    const onTEnd=e=>{
      for(const t of e.changedTouches){
        if(touches.move&&t.identifier===touches.move.id) touches.move=null;
        if(touches.look&&t.identifier===touches.look.id) touches.look=null;
      }
    };

    cvs.addEventListener("mousedown",onMD);
    window.addEventListener("mouseup",onMU);
    window.addEventListener("mousemove",onMM);
    cvs.addEventListener("touchstart",onTStart,{passive:false});
    cvs.addEventListener("touchmove",onTMove,{passive:false});
    cvs.addEventListener("touchend",onTEnd,{passive:false});
    window.addEventListener("keydown",onKD);
    window.addEventListener("keyup",onKU);

    // ── GEOMETRIA KORYTARZA I PĘTLI ──────────────────────────────────────
    const W=3.6,H=3.2,LEN=56,Z0=-26; 

    const addP=(geo,mat,pos,rx=0,ry=0)=>{const m=new THREE.Mesh(geo,mat);m.rotation.set(rx,ry,0);m.position.set(...pos);m.receiveShadow=true;scene.add(m);return m;};

    // Podłoga Linoleum
    addP(new THREE.PlaneGeometry(W, LEN), SM({map:RW(CT(mkFloor()), 4, 60), roughness:0.8}), [0, 0, Z0], -Math.PI/2);
    
    // Szerszy dywan (chodnik) - 2.6m szerokości (przy 3.6m korytarza)
    const dywanFloorTex = new THREE.TextureLoader().load('dywan.jpeg');
    dywanFloorTex.colorSpace = THREE.SRGBColorSpace;
    const dywanMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, LEN), SM({map:RW(dywanFloorTex, 2, 20), roughness: 0.9}));
    dywanMesh.rotation.x = -Math.PI/2; dywanMesh.position.set(0, 0.005, Z0);
    dywanMesh.receiveShadow = true; scene.add(dywanMesh);

    addP(new THREE.PlaneGeometry(W,LEN),SM({map:RW(CT(mkCeil()),2,14),roughness:.82}),[0,H,Z0],Math.PI/2);
    
    const wallMat=SM({map:RW(CT(mkWall()),10,1.0),roughness:.85});
    addP(new THREE.PlaneGeometry(LEN,H),wallMat,[W/2,H/2,Z0],0,-Math.PI/2); // Prawa ściana
    
    // Lewa ściana (dziury na lewe tunele przy Z=0 i Z=-52)
    addP(new THREE.PlaneGeometry(0.2,H),wallMat,[-1.8,H/2,1.9],0,Math.PI/2);
    addP(new THREE.PlaneGeometry(48.4,H),wallMat,[-1.8,H/2,-26],0,Math.PI/2);
    addP(new THREE.PlaneGeometry(0.2,H),wallMat,[-1.8,H/2,-53.9],0,Math.PI/2);

    // Przód i Tył głównego korytarza (Ściany na końcach)
    addP(new THREE.PlaneGeometry(W,H),wallMat,[0,H/2,-54]);
    addP(new THREE.PlaneGeometry(W,H),wallMat,[0,H/2,2], 0, Math.PI);

    // ── TUNELE (Zejścia z poszerzonymi schodami 3.6m szerokości) ──────────────
    const stepGeo = new THREE.BoxGeometry(0.3, 0.15, 3.6); 
    const stepMat = SM({color: 0x302518, roughness: 0.9});
    const ceilMat = SM({map:RW(CT(mkCeil()), 1, 1), roughness:.82});

    // TUNEL STARTOWY (Z = 0)
    addP(new THREE.PlaneGeometry(2.0, 3.6), SM({map:RW(CT(mkFloor()), 1, 4), roughness:0.8}), [-2.8, 0, 0], -Math.PI/2, 0); // Podest linoleum
    addP(new THREE.PlaneGeometry(2.0, 3.6), ceilMat, [-2.8, H, 0], Math.PI/2, 0); // Sufit podestu
    addP(new THREE.PlaneGeometry(2.0, H), wallMat, [-2.8, H/2, 1.8], 0, Math.PI); // Tył podestu
    addP(new THREE.PlaneGeometry(2.0, H), wallMat, [-2.8, H/2, -1.8], 0, 0);      // Przód podestu

    for (let i = 0; i < 15; i++) {
        addP(stepGeo, stepMat, [-3.95 - i*0.3, -0.075 - i*0.15, 0]);
    }
    addP(new THREE.PlaneGeometry(3.6, H+5), SM({color:0x000000}), [-7.0, H/2 - 2, 0], 0, Math.PI/2); // Ściana mroku

    const tLight1 = new THREE.PointLight(0xFFE0A0, 1.8, 6);
    tLight1.position.set(-2.8, 2.0, 0); scene.add(tLight1);

    // TUNEL KOŃCOWY (Z = -52)
    addP(new THREE.PlaneGeometry(2.0, 3.6), SM({map:RW(CT(mkFloor()), 1, 4), roughness:0.8}), [-2.8, 0, -52], -Math.PI/2, 0); 
    addP(new THREE.PlaneGeometry(2.0, 3.6), ceilMat, [-2.8, H, -52], Math.PI/2, 0); 
    addP(new THREE.PlaneGeometry(2.0, H), wallMat, [-2.8, H/2, -50.2], 0, Math.PI); 
    addP(new THREE.PlaneGeometry(2.0, H), wallMat, [-2.8, H/2, -53.8], 0, 0);      

    for (let i = 0; i < 15; i++) {
        addP(stepGeo, stepMat, [-3.95 - i*0.3, -0.075 - i*0.15, -52]);
    }
    addP(new THREE.PlaneGeometry(3.6, H+5), SM({color:0x000000}), [-7.0, H/2 - 2, -52], 0, Math.PI/2);

    const tLight2 = new THREE.PointLight(0xFFE0A0, 1.8, 6);
    tLight2.position.set(-2.8, 2.0, -52); scene.add(tLight2);

    // Znak wyjścia
    const exitSignTex = new THREE.TextureLoader().load('wyjscie.png');
    exitSignTex.colorSpace = THREE.SRGBColorSpace;
    const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({map:exitSignTex}));
    exitSign.position.set(0, 2.2, -53.9); scene.add(exitSign);
    const exitSignGlow = new THREE.PointLight(0x40FF60,.8,3,2); exitSignGlow.position.set(0,2.2,-53.5); scene.add(exitSignGlow);

    // ── LAMPY ─────────────────────────────────────────────────────────────────
    const lamps=[],lights=[];
    [-3,-13,-25,-37,-49].forEach(z=>{
      const lm=new THREE.Mesh(BX(.9,.07,.16),SM({color:0xFFFFF0,emissive:0xFFFFF0,emissiveIntensity:4}));
      lm.position.set(0,H-.04,z); scene.add(lm); lamps.push(lm);
      const cable=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.12,4),SM({color:0x1A1A1A,roughness:.9}));
      cable.position.set(0,H+.06,z); scene.add(cable);
      // Ściemniono na 1.5 dla lepszego, mroczniejszego klimatu
      const pl=new THREE.PointLight(0xFFF5D0,1.5,16,2); pl.position.set(0,H-.25,z); pl.castShadow=true; scene.add(pl); lights.push(pl);
    });
    // Naturalniejsze światło ambientowe
    scene.add(new THREE.AmbientLight(0x555555,.4)); 

    // ── DRZWI ────────────────────────────────────────────────────────────────
    const addAptDoor = (num, z, side, style=0) => {
      const dx = side*(W/2);
      const ry = side===1 ? -Math.PI/2 : Math.PI/2;
      const door = buildAptDoor(num, style);
      door.rotation.y = ry;
      door.position.set(dx - side*0.05, 0, z);
      scene.add(door);
      return door;
    };

    addAptDoor(3,  -8,  -1, 0);
    addAptDoor(5,  -20,  1, 2);
    addAptDoor(8,  -34, -1, 4);
    addAptDoor(10, -47,  1, 1);

    const d7 = addAptDoor(7, -25, 1, 3);
    const d7piv=new THREE.Group();
    const d7o=new THREE.Mesh(BX(.08,2.12,1.02),SM({map:CT(mkDoor(7,3)),roughness:.75}));
    d7o.rotation.y=-Math.PI/2; d7o.position.set(0,1.06,-.5); d7piv.add(d7o);
    d7piv.position.set(W/2-.05, 0, -25.5); d7piv.rotation.y=-.28; d7piv.visible=false; scene.add(d7piv);
    
    // Zabezpieczenie przed Z-fighting przy drzwiach 7
    const darkRoom=new THREE.Mesh(BX(3.5,H,3.5),SM({color:0x010101,roughness:1,side:THREE.BackSide})); 
    darkRoom.position.set(W/2+1.85,H/2,-25); scene.add(darkRoom);
    const darkLight=new THREE.PointLight(0x101830,.4,3,2); darkLight.position.set(W/2+.5,1.5,-25); scene.add(darkLight);


    // ── PRL DEKORACJE I ANOMALIE ──────────────────────────────────────────────

    const mbN=buildMailboxes(false); mbN.rotation.y=-Math.PI/2; mbN.position.set(W/2-.15, 0.8, -29); scene.add(mbN);
    const mbB=buildMailboxes(true);  mbB.rotation.y=-Math.PI/2; mbB.position.set(W/2-.15, 0.8, -29); mbB.visible=false; scene.add(mbB);

    const notice=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.9),SM({map:CT(mkNotice())}));
    notice.rotation.y=-Math.PI/2; notice.position.set(W/2-.02,1.5,-4.5); scene.add(notice);

    // Obydwa obrazy uzywają podstawowego pliku image_8cdc9e.jpg. Distorted nakłada warstwę 2D.
    const jp2N=buildJP2Frame('image_8cdc9e.jpg', false); jp2N.rotation.y=-Math.PI/2; jp2N.position.set(W/2-.04,1.78,-14); scene.add(jp2N);
    const jp2D=buildJP2Frame('image_8cdc9e.jpg', true); jp2D.rotation.y=-Math.PI/2; jp2D.position.set(W/2-.04,1.78,-14); jp2D.visible=false; scene.add(jp2D);

    const jp2l=new THREE.SpotLight(0xFFE060,1.1,5,.45,.45); jp2l.position.set(W/2-.6,2.9,-14); jp2l.target.position.set(W/2-.04,1.78,-14); scene.add(jp2l); scene.add(jp2l.target);
    const candle=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.12,8),SM({color:0xF8F0D0,roughness:.9})); candle.position.set(W/2-.25,1.0,-14); scene.add(candle);
    const flame=new THREE.PointLight(0xFF8020,.5,1.5,3); flame.position.set(W/2-.25,1.16,-14); scene.add(flame);

    const malyszF = buildMalyszFrame('adam.jpeg'); malyszF.rotation.y=Math.PI/2; malyszF.position.set(-W/2+.04,1.75,-36); scene.add(malyszF);
    const pudzianF = buildMalyszFrame('pudzian.jpeg'); pudzianF.rotation.y=Math.PI/2; pudzianF.position.set(-W/2+.04,1.75,-36); pudzianF.visible=false; scene.add(pudzianF);
    const malyszL = new THREE.SpotLight(0xFFE8A0,.7,4,.5,.5); malyszL.position.set(-W/2+.7,2.8,-36); malyszL.target.position.set(-W/2+.04,1.75,-36); scene.add(malyszL); scene.add(malyszL.target);

    const napisZrywajM = new THREE.Mesh(new THREE.PlaneGeometry(2.0,.45), new THREE.MeshBasicMaterial({map:CT(mkNapisZrywaj()),transparent:true,depthWrite:false}));
    napisZrywajM.rotation.y=Math.PI/2; napisZrywajM.position.set(-W/2+.04,2.35,-17); scene.add(napisZrywajM);

    const napisNieLekM = new THREE.Mesh(new THREE.PlaneGeometry(1.8,.38), new THREE.MeshBasicMaterial({map:CT(mkNapisNieLekajcie()),transparent:true,depthWrite:false}));
    napisNieLekM.rotation.y=-Math.PI/2; napisNieLekM.position.set(W/2-.04,2.4,-41); scene.add(napisNieLekM);
    const napisNieZesrajM = new THREE.Mesh(new THREE.PlaneGeometry(1.8,.38), new THREE.MeshBasicMaterial({map:CT(mkNapisNieZesrajcie()),transparent:true,depthWrite:false}));
    napisNieZesrajM.rotation.y=-Math.PI/2; napisNieZesrajM.position.set(W/2-.04,2.4,-41); napisNieZesrajM.visible=false; scene.add(napisNieZesrajM);

    const rzepaTex = new THREE.TextureLoader().load('rzepa.png');
    const rzepaM = new THREE.Mesh(new THREE.PlaneGeometry(.55,.55), new THREE.MeshBasicMaterial({map:rzepaTex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    rzepaM.position.set(0,1.4,-8); rzepaM.visible=false; scene.add(rzepaM);

    const texTVNormal = CT(mkTelegazeta());
    const texTVDeath = CT(mkTelegazetaDeath());
    const texTVSales = CT(mkTelegazetaSales());
    
    const tvN=buildTVStand(texTVNormal); tvN.position.set(-W/2+.65,0,-20); scene.add(tvN);
    const tvA=buildTVStand(texTVDeath);  tvA.position.set(-W/2+.65,0,-20); tvA.visible=false; scene.add(tvA);
    const tvS=buildTVStand(texTVSales);  tvS.position.set(-W/2+.65,0,-20); tvS.visible=false; scene.add(tvS);

    const rad=buildRadiator(); rad.rotation.y=Math.PI/2; rad.position.set(-W/2+.1,0,-27); scene.add(rad);
    const bike=buildBike(); bike.rotation.y=-.25; bike.position.set(W/2-.75,0,-39); scene.add(bike);

    const mess7 = buildMessOnFloor(); mess7.position.set(W/2-.8, 0, -25); scene.add(mess7);

    const sN=buildStroller(false); sN.position.set(W/2-.68,0,-11); scene.add(sN);
    const sK=buildStroller(true);  sK.position.set(W/2-.68,0,-11); sK.visible=false; scene.add(sK);

    // ── POZOSTAŁE ANOMALIE ────────────────────────────────────────────────────
    const ao={};
    const fig=buildFigure(); fig.position.set(0,0,-32); fig.visible=false; scene.add(fig); ao.figure=fig;
    const wr=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.78),new THREE.MeshBasicMaterial({map:CT(mkWriting()),transparent:true,depthWrite:false}));
    wr.rotation.y=Math.PI/2; wr.position.set(-W/2+.04,2.0,-20); wr.visible=false; scene.add(wr); ao.writing=wr;
    const puddle=new THREE.Mesh(new THREE.CircleGeometry(.85,28),SM({color:0x243040,transparent:true,opacity:.8,roughness:.02,metalness:.7}));
    puddle.rotation.x=-Math.PI/2; puddle.position.set(.25,.009,-17); puddle.visible=false; scene.add(puddle); ao.puddle=puddle;
    const cat=buildCat(); cat.position.set(-.75,0,-13); cat.visible=false; scene.add(cat); ao.cat=cat;
    
    const peepholeEye = new THREE.Mesh(new THREE.PlaneGeometry(.04, .04), new THREE.MeshBasicMaterial({map:CT(mkEyeTex()), transparent:true}));
    peepholeEye.position.set(W/2 - 0.051, 1.313, -20); // Na drzwiach nr 5
    peepholeEye.rotation.y = -Math.PI/2;
    peepholeEye.visible = false;
    scene.add(peepholeEye);
    ao.peephole_eye = peepholeEye;

    const fadeMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthTest:false});
    const fadeMesh=new THREE.Mesh(new THREE.PlaneGeometry(4,4),fadeMat); fadeMesh.position.set(0,0,-.35); fadeMesh.renderOrder=999; cam.add(fadeMesh); scene.add(cam);

    R.current={renderer,cam,lights,lamps,fadeMat,d7,d7piv,sN,sK,mbN,mbB,ao,flame,jp2N,jp2D,malyszF,pudzianF,napisNieLekM,napisNieZesrajM,rzepaM, mess7, tvN, tvA, tvS};

    // ── GENERATE SCENE ────────────────────────────────────────────────────────
    function gen(){
      const ha=Math.random()<.45; const an=ha?ANOMALIES[Math.floor(Math.random()*ANOMALIES.length)]:null;
      sr.hasAnomaly=ha; sr.anomaly=an; sr.decided=false; sr.tunnelLock=false;
      Object.values(ao).forEach(o=>{if(o)o.visible=false;});
      d7.visible=true; d7piv.visible=false; sN.visible=true; sK.visible=false; mbN.visible=true; mbB.visible=false;
      // Przywracanie natężenia światła
      lights.forEach(l=>{l.visible=true;l.intensity=1.5;}); lamps.forEach(l=>{l.material.emissiveIntensity=4;});
      
      jp2N.visible=true; jp2D.visible=false;
      malyszF.visible=true; pudzianF.visible=false;
      napisNieLekM.visible=true; napisNieZesrajM.visible=false;
      mess7.visible=true;
      tvN.visible=true; tvA.visible=false; tvS.visible=false;

      up({anomaly:an,hasAnomaly:ha,hint:false, catPrompt:"", catMessage:""});
      if(!an)return;
      switch(an.id){
        case"no_light": lights[2].visible=false; lamps[2].material.emissiveIntensity=0; break;
        case"figure": ao.figure.visible=true; break;
        case"open_door": d7.visible=false; d7piv.visible=true; break;
        case"stroller": sN.visible=false; sK.visible=true; break;
        case"writing": ao.writing.visible=true; break;
        case"puddle": ao.puddle.visible=true; break;
        case"broken_mailbox": mbN.visible=false; mbB.visible=true; break;
        case"cat": ao.cat.visible=true; break;
        case"jp2_distorted": jp2N.visible=false; jp2D.visible=true; break;
        case"malysz_pudzian": malyszF.visible=false; pudzianF.visible=true; break;
        case"napis_zmiana": napisNieLekM.visible=false; napisNieZesrajM.visible=true; break;
        case"no_mess_7": mess7.visible=false; break;
        case"jp2_death_tg": tvN.visible=false; tvA.visible=true; break;
        case"tg_sales": tvN.visible=false; tvS.visible=true; break;
        case"peephole_eye": ao.peephole_eye.visible=true; break;
      }
    }
    R.current.gen=gen; gen();

    // Fade maskujący teleportację
    function fadeFast(onMid){
      let ph="in",t0=performance.now();
      sr.phase = "busy"; 
      const tick=setInterval(()=>{
        const e=performance.now()-t0;
        if(ph==="in"){
            fadeMat.opacity=Math.min(1,e/120);
            if(fadeMat.opacity>=1){
                ph="out";t0=performance.now();
                onMid?.();
            }
        }else{
            fadeMat.opacity=Math.max(0,1-(performance.now()-t0)/150);
            if(fadeMat.opacity<=0){
                clearInterval(tick);
                sr.phase = "playing"; 
                sr.tunnelLock = false;
            }
        }
      },14);
    }

    function decide(action){
      if(sr.phase!=="playing"||sr.decided)return;
      sr.decided=true;
      const {hasAnomaly,anomaly,exitCount,streak,sanity}=sr;
      // ok to true, jeśli poprawnie wybraliśmy (idziemy w tył, gdy JEST anomalia; idziemy w przód gdy JEJ NIE MA)
      const ok=action==="exit"?!hasAnomaly:hasAnomaly;
      let ne=exitCount, ns=streak, nsan=sanity, msg="";
      
      if(ok){
        ns++;
        ne++; // Exit 8 mechanic: prawidłowa decyzja ZAWSZE popycha nas do przodu!
        if(action==="exit"){
          msg=ne>=8?"":"✓ Wyjście "+ne+"/8";
        }else {
          msg="👁 Dobrze! Wycofano się w porę. W."+ne+"/8";
        }
      } else {
        ne=0;
        ns=0;
        nsan=Math.max(0, nsan - 17); // 100 -> 83 -> 66 -> 49 -> 32 -> 15 -> 0
        msg="✗ "+(action==="exit"?"Była anomalia!":"Nie było anomalii!")+" RESET";
      }
      
      sr.exitCount=ne; sr.streak=ns; sr.sanity=nsan; stepCount.current++;
      
      if(nsan <= 0){
        sr.phase="gameover";
        up({phase:"gameover", sanity:nsan, exitCount:ne, streak:ns, steps:stepCount.current});
        return;
      }
      
      if(ne>=8){
        sr.phase="win";
        up({phase:"win", exitCount:8, streak:ns, steps:stepCount.current});
        return;
      }
      
      up({exitCount:ne, streak:ns, sanity:nsan, message:msg, steps:stepCount.current});
      setTimeout(()=>up({message:""}), 2500);

      fadeFast(() => {
          cam.position.set(0, 1.52, 1.5);
          sr.yaw=0; sr.pitch=0;
          gen();
      });
    }

    // ── ANIMATION LOOP ────────────────────────────────────────────────────────
    let bob=0,flickT=0,flameT=0,animId;
    const fv=new THREE.Vector3(),rv=new THREE.Vector3();

    function animate(){
      animId=requestAnimationFrame(animate);

      if(sr.phase==="playing"){
        cam.rotation.y=sr.yaw; 
        cam.rotation.x=sr.pitch;
        
        const k=sr.keys;
        const isSprinting = k.ShiftLeft || k.ShiftRight;
        
        // Predkosc ruchu i efekty zmysłów
        let speed = isSprinting ? 0.08 : 0.04; 
        let swayFactor = 0;
        
        if (sr.sanity <= 32) {
            speed = isSprinting ? 0.04 : 0.025; 
            swayFactor = 0.02; 
        }
        if (sr.sanity <= 16) {
            speed = isSprinting ? 0.02 : 0.015; 
            swayFactor = 0.045; 
        }

        fv.set(-Math.sin(sr.yaw),0,-Math.cos(sr.yaw));
        rv.set(Math.cos(sr.yaw),0,-Math.sin(sr.yaw));
        let mv=false;

        if(k.KeyW||k.ArrowUp){cam.position.addScaledVector(fv,speed);mv=true;}
        if(k.KeyS||k.ArrowDown){cam.position.addScaledVector(fv,-speed*.75);mv=true;}
        if(k.KeyA||k.ArrowLeft) cam.position.addScaledVector(rv,-speed*.65);
        if(k.KeyD||k.ArrowRight) cam.position.addScaledVector(rv,speed*.65);

        if(touches.move){
          const tx=touches.move.cx-touches.move.sx; const ty=touches.move.cy-touches.move.sy;
          const d=Math.sqrt(tx*tx+ty*ty); const deadzone=12;
          if(d>deadzone){
            const nx=tx/d,ny=ty/d;
            cam.position.addScaledVector(fv,-ny*speed*.9); mv=true;
            cam.position.addScaledVector(rv,nx*speed*.7);
          }
        }

        let minX = -1.35, maxX = 1.35;
        let minZ = -53.2, maxZ = 1.2;

        if (cam.position.z > -1.2 && cam.position.z < 1.2) minX = -5.5;
        if (cam.position.z > -53.2 && cam.position.z < -50.8) minX = -5.5;

        cam.position.x = Math.max(minX, Math.min(maxX, cam.position.x));
        cam.position.z = Math.max(minZ, Math.min(maxZ, cam.position.z));
        
        if (cam.position.x < -4.5 && !sr.decided && !sr.tunnelLock) {
            sr.tunnelLock = true;
            if (cam.position.z < -26) decide("exit");
            else decide("back");
        }
        if (cam.position.x > -2.0) {
            sr.tunnelLock = false;
        }

        // BUJANIE I TRZĘSIENIE EKRANU
        if (mv) {
           bob += isSprinting ? 0.15 : 0.09;
        }
        cam.position.y = 1.52 + (mv ? Math.sin(bob) * 0.045 : 0);
        cam.rotation.z = mv ? Math.cos(bob * 0.5) * swayFactor : 0;

        // Mgła - pozbawiono czerwonej poświaty, zwiększa się gęstość w mroku
        const sanityFactor = (100 - sr.sanity) / 100;
        let tunnelDarkness = 0;
        if (cam.position.x < -1.5) {
            tunnelDarkness = Math.min(1, (-cam.position.x - 1.5) / 2.0); 
        }
        
        let baseDensity = 0.035 + (sanityFactor * 0.01) + (tunnelDarkness * 1.5); 
        scene.fog.density = baseDensity;
        
        const fogLuma = 12 * (1 - tunnelDarkness);
        scene.fog.color.setRGB(fogLuma/255, fogLuma/255, fogLuma/255);

        const sa = stepsAudioRef.current;
        if(sa){
          let pbRate = isSprinting ? 1.2 : 0.8;
          if (sr.sanity <= 32) pbRate -= 0.3;
          if (mv && sa.paused){ sa.playbackRate = pbRate; sa.currentTime=0; sa.play().catch(()=>{}); }
          else if (!mv && !sa.paused){ sa.pause(); }
        }

        // Interakcja z Kotem
        if (R.current.ao?.cat?.visible) {
            const dist = cam.position.distanceTo(R.current.ao.cat.position);
            if (dist < 2.5) {
                if (sr._lastCatPrompt !== "1") {
                    sr._lastCatPrompt = "1";
                    up({catPrompt: "Naciśnij [E] aby pogłaskać kota"});
                }
                if (sr.keys['KeyE']) {
                    up({catMessage: `HATOR, HATOR, HATOR! ${sr.hasAnomaly ? 'Czuję anomalię, miau!' : 'Wszystko normalne, miau...'}`});
                    setTimeout(() => up({catMessage: ""}), 4000);
                    sr.keys['KeyE'] = false; 
                }
            } else {
                if (sr._lastCatPrompt !== "0") {
                    sr._lastCatPrompt = "0";
                    up({catPrompt: ""});
                }
            }
        }

        // Mruganie oka
        if (R.current.ao?.peephole_eye?.visible) {
            R.current.ao.peephole_eye.scale.y = Math.sin(Date.now() * 0.005) > 0.8 ? 0.1 : 1;
        }
      }

      if(R.current.rzepaM){
        const rm=R.current.rzepaM;
        const shouldShow = sr.streak>=4 && !sr._rzepaFound;
        if(shouldShow && !rm.visible){ rm.visible=true; up({rzepaHint:true}); }
        if(!shouldShow && rm.visible && sr._rzepaFound){ rm.visible=false; }
        if(rm.visible){
          rm.rotation.y += .02;
          rm.position.y = 1.4 + Math.sin(Date.now()*.002)*.08;
          const rp=rm.position;
          const dist=Math.sqrt(Math.pow(cam.position.x-rp.x,2)+Math.pow(cam.position.z-rp.z,2));
          if(dist<1.4 && sr.keys['KeyE'] && !sr._rzepaFound){
            sr._rzepaFound=true; rm.visible=false;
            up({rzepaVisible:true, rzepaHint:false});
          }
          if(dist<1.8 && !sr._rzepaFound && !sr._rzepaNearShown){
            sr._rzepaNearShown=true; up({rzepaHint:true});
          }
        }
      }

      if(++flickT%185===0&&Math.random()<.28){
        const li=Math.floor(Math.random()*lights.length);
        if(lights[li].visible&&lights[li].intensity>.5){
          lights[li].intensity=.04; lamps[li].material.emissiveIntensity=.1;
          // Przywracanie poprawnego natężenia do 1.5
          setTimeout(()=>{lights[li].intensity=1.5;lamps[li].material.emissiveIntensity=4;},38+Math.random()*55);
        }
      }
      if(R.current.flame){flameT+=.08;R.current.flame.intensity=.4+Math.sin(flameT)*Math.sin(flameT*1.7)*.15;}

      renderer.render(scene,cam);
    }
    animate();

    const onResize=()=>{cam.aspect=mount.clientWidth/mount.clientHeight;cam.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight);};
    window.addEventListener("resize",onResize);

    return()=>{
      cancelAnimationFrame(animId); window.removeEventListener("resize",onResize);
      window.removeEventListener("keydown",onKD); window.removeEventListener("keyup",onKU);
      window.removeEventListener("mousemove",onMM); window.removeEventListener("mouseup",onMU);
      if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement); renderer.dispose();
      if(ambienceRef.current){ambienceRef.current.pause();ambienceRef.current=null;}
      if(stepsAudioRef.current){stepsAudioRef.current.pause();stepsAudioRef.current=null;}
    };
  },[]);

  const restart=()=>{
    const sr=S.current; Object.assign(sr,{phase:"playing",hasAnomaly:false,anomaly:null,exitCount:0,streak:0,sanity:100,yaw:0,pitch:0,keys:{},decided:false,tunnelLock:false,_lastCatPrompt:"0",_rzepaShown:false,_rzepaFound:false,_rzepaNearShown:false});
    stepCount.current=0; if(R.current.cam)R.current.cam.position.set(0,1.52,1.5); R.current.gen?.();
    if(ambienceRef.current){ambienceRef.current.currentTime=0;ambienceRef.current.play().catch(()=>{});}
    setUi({phase:"playing",exitCount:0,streak:0,sanity:100,message:"",hint:false,steps:0,anomaly:null,hasAnomaly:false,rzepaVisible:false,rzepaFound:false,rzepaHint:false,catPrompt:"",catMessage:""});
  };

  const {phase,exitCount,streak,sanity,message,hint,steps,anomaly,hasAnomaly,rzepaVisible,catPrompt,catMessage}=ui;
  const isMobile=typeof window!=="undefined"&&window.innerWidth<768;

  return(
    <div style={{width:"100%",height:"100vh",background:"#000",overflow:"hidden",position:"relative",fontFamily:"'Courier New',monospace",userSelect:"none",touchAction:"none"}}>
      <div ref={mountRef} style={{width:"100%",height:"100%",cursor:"crosshair"}}/>

      {phase!=="win"&&phase!=="gameover"&&<>
        <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} style={{width:24,height:3,borderRadius:2,background:i<exitCount?"#c8a840":"#1c1408",boxShadow:i<exitCount?"0 0 7px #c8a84099":"none",transition:"background .35s"}}/>
          ))}
        </div>

        <div style={{position:"absolute",top:12,left:12,display:"flex",flexDirection:"column",gap:4}}>
          <div style={{color:"#c8a840",fontSize:"10px",letterSpacing:"2px"}}>POCZYTALNOŚĆ: {sanity}%</div>
          <div style={{width:120,height:5,background:"#1c1408",boxShadow:"inset 0 0 2px #000"}}>
            <div style={{width:`${sanity}%`,height:"100%",background:sanity>50?"#c8a840":sanity>32?"#c86020":"#a82020",transition:"all .4s ease-out"}}/>
          </div>
        </div>

        <div style={{position:"absolute",top:8,right:12,color:"#c8a840",fontSize:"10px",letterSpacing:"2px",textAlign:"right",lineHeight:"1.6"}}>
          <div>W.{exitCount}/8</div>
          <div style={{color:"#444"}}>×{streak}</div>
        </div>

        {isMobile&&<div style={{position:"absolute",bottom:80,left:30,width:80,height:80,borderRadius:"50%",border:"2px solid rgba(200,168,64,.2)",background:"rgba(0,0,0,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{color:"rgba(200,168,64,.3)",fontSize:"18px"}}>✛</div>
        </div>}

        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}>
          <div style={{width:16,height:1,background:"rgba(200,168,64,.35)",position:"absolute",top:0,left:-8}}/>
          <div style={{width:1,height:16,background:"rgba(200,168,64,.35)",position:"absolute",top:-8,left:0}}/>
        </div>

        <div style={{position:"absolute", bottom:isMobile?100:30, width:"100%", textAlign:"center", pointerEvents:"none"}}>
          <div style={{display:"inline-block", background:"rgba(0,0,0,0.8)", border:"1px solid rgba(200,168,64,0.4)", color:"#d8b860", padding:"8px 16px", borderRadius:"4px", fontSize:isMobile?"11px":"13px", letterSpacing:"1px"}}>
            Brak anomalii ➔ idź naprzód &nbsp;&nbsp;|&nbsp;&nbsp; Anomalia ➔ wycofaj się schodami
          </div>
        </div>

        {catPrompt&&<div style={{position:"absolute",bottom:isMobile?150:85,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.85)",border:"1px solid #a86020",color:"#d8b860",padding:"7px 20px",borderRadius:2,fontSize:"11px",letterSpacing:"1px",whiteSpace:"nowrap"}}>
          🐈 {catPrompt}
        </div>}

        {catMessage&&<div style={{position:"absolute",top:"35%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(20,10,0,.92)",border:"1px solid #d8b860",color:"#ffcc60",padding:"12px 30px",borderRadius:4,fontSize:"14px",fontWeight:"bold",letterSpacing:"1px",whiteSpace:"nowrap", textAlign:"center"}}>
          {catMessage}
        </div>}

        {message&&<div style={{position:"absolute",top:"43%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,.92)",border:"1px solid rgba(200,168,64,.2)",color:"#d8b860",padding:"9px 24px",borderRadius:2,fontSize:"12px",letterSpacing:"1px",whiteSpace:"nowrap"}}>
          {message}
        </div>}

        {ui.rzepaHint&&!ui.rzepaFound&&(
          <div style={{position:"absolute",bottom:120,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.85)",border:"1px solid #c8a840",color:"#d8b860",padding:"6px 18px",borderRadius:3,fontSize:"11px",letterSpacing:"2px",whiteSpace:"nowrap"}}>
            🌱 Naciśnij <strong>[E]</strong> — RZEPA!
          </div>
        )}

        {rzepaVisible&&!ui.rzepaFound&&(
          <div style={{position:"absolute",top:"30%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,.95)",border:"2px solid #c8a840",padding:"22px 36px",textAlign:"center",borderRadius:4,zIndex:50}}>
            <div style={{fontSize:48,marginBottom:8}}>🌱</div>
            <div style={{color:"#d8b860",fontSize:"16px",letterSpacing:"3px",marginBottom:6}}>WYCIĄGNĄŁEŚ RZEPĘ!</div>
            <div style={{color:"#888",fontSize:"10px",marginBottom:16}}>Jak dziadek w Familiadzie!</div>
            <button onClick={()=>setUi(p=>({...p,rzepaFound:true,rzepaVisible:false,message:"🎉 Rzepa! Seria x2 reset!"}))} style={{padding:"8px 24px",background:"#c8a840",border:"none",color:"#000",cursor:"pointer",fontSize:"12px",letterSpacing:"2px",borderRadius:2,fontWeight:"bold"}}>
              CIĄGNIJ!
            </button>
          </div>
        )}

        <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",textAlign:"center"}}>
          <button onClick={()=>setUi(p=>({...p,hint:!p.hint}))} style={{background:"none",border:"none",color:"#3a2e1c",cursor:"pointer",fontSize:"9px",letterSpacing:"2px",padding:"4px 8px"}}>
            {hint?"UKRYJ PODPOWIEDŹ":"POKAŻ PODPOWIEDŹ"}
          </button>
          {hint&&<div style={{color:"#6a5838",fontSize:"10px",fontStyle:"italic",marginTop:3,letterSpacing:".5px", background:"rgba(0,0,0,0.5)", padding:"2px 6px", borderRadius:"2px"}}>
            {hasAnomaly&&anomaly?`⚠ ${anomaly.hint}`:"Wszystko wygląda normalnie..."}
          </div>}
        </div>
      </>}

      {phase==="win"&&(
        <div style={{position:"absolute",inset:0,backgroundImage:"url(tunel.jpeg)",backgroundSize:"cover",backgroundPosition:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",padding:"0 0 40px"}}>
          <div style={{background:"rgba(0,0,0,.88)",padding:"24px 40px",textAlign:"center",borderTop:"2px solid rgba(200,168,64,.3)",width:"100%"}}>
            <div style={{fontSize:36,marginBottom:8}}>🚇</div>
            <div style={{color:"#d8b860",fontSize:isMobile?"16px":"20px",letterSpacing:"4px",marginBottom:8}}>WYDOSTAŁEŚ SIĘ!</div>
            <div style={{color:"#aaa",fontSize:"13px",fontStyle:"italic",marginBottom:4}}>"Byle nie do Warszawy..."</div>
            <div style={{color:"#555",fontSize:"10px",marginBottom:16}}>Kroków: {steps} — Seria: {streak}</div>
            <button onClick={restart} style={{padding:"10px 30px",background:"transparent",border:"1px solid #c8a840",color:"#c8a840",cursor:"pointer",fontSize:"12px",letterSpacing:"2px",borderRadius:2}}>ZAGRAJ PONOWNIE</button>
          </div>
        </div>
      )}

      {phase==="gameover"&&(
        <div style={{position:"absolute",inset:0,background:"rgba(10,0,0,.96)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{fontSize:56}}>🧠</div>
          <div style={{color:"#a82020",fontSize:isMobile?"18px":"22px",letterSpacing:"4px",textAlign:"center"}}>POSTRADAŁEŚ ZMYSŁY</div>
          <div style={{color:"#662020",fontSize:"10px",letterSpacing:"2px",marginTop:4}}>Umysł nie wytrzymał błędów w korytarzu.</div>
          <button onClick={restart} style={{marginTop:12,padding:"10px 30px",background:"transparent",border:"1px solid #a82020",color:"#a82020",cursor:"pointer",fontSize:"12px",letterSpacing:"2px",borderRadius:2}}>
            SPRÓBUJ PONOWNIE
          </button>
        </div>
      )}
    </div>
  );
}
