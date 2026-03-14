import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { io } from "socket.io-client";

// ─── TARCZA OCHRONNA (ERROR BOUNDARY) ───────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#ff4444', background: '#0a0a0a', padding: '30px', fontFamily: 'monospace', height: '100vh', overflow: 'auto' }}>
          <h2>🚨 KRYTYCZNY BŁĄD GRY / CRITICAL GAME ERROR 🚨</h2>
          <pre style={{ background: '#111', padding: '15px', borderLeft: '4px solid #ff4444', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
            {this.state.error && this.state.error.toString()}
            <br /><br />{this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── SŁOWNIK TŁUMACZEŃ (i18n) ──────────────────────────────────────────
const T = {
  en: {
    title: "POLISH ANOMALIES",
    subtitle: "CORRIDOR EDITION",
    startSolo: "START SOLO",
    multiplayer: "MULTIPLAYER",
    options: "OPTIONS",
    exit: "QUIT",
    musicMenu: "Music: F. Chopin",
    mpTitle: "MULTIPLAYER MODE",
    connecting: "⏳ Connecting to server...",
    connected: "✓ Server connected",
    nickLabel: "YOUR NICKNAME (Visible to others):",
    newGame: "NEW GAME",
    createRoom: "CREATE ROOM",
    joinGame: "JOIN GAME",
    roomCodePlaceholder: "ROOM CODE",
    join: "JOIN",
    backToMenu: "BACK TO MENU",
    room: "ROOM:",
    shareCode: "Share this code with a friend to join.",
    playersInRoom: "PLAYERS IN ROOM:",
    host: "HOST",
    startGameOnline: "START ONLINE GAME",
    waitingHost: "Waiting for the Host to start...",
    leaveRoom: "LEAVE ROOM",
    gameplaySolo: "GAMEPLAY (Solo Only)",
    randomBase: "Random Base (Different sides)",
    hardcoreMode: "Hardcore Mode (Mixed anomalies)",
    roguelikeMode: "Roguelike Mode (Endless)",
    audioVideo: "AUDIO / VIDEO",
    vhsEffect: "VHS Tape Effect",
    musicVol: "Music (Menu):",
    ambVol: "Ambient Sound:",
    stepsVol: "Footsteps Volume:",
    language: "Language / Język",
    back: "BACK",
    paused: "PAUSED",
    resume: "RESUME",
    exitToMenu: "EXIT TO MENU",
    sanity: "SANITY:",
    floor: "F.",
    interactPrompt: "Interact",
    sprint: "SPRINT",
    controlsHintPC: "Move = W, A, S, D\nInteract = E\nSprint = SHIFT\nFlashlight = F",
    instructionHelp: "No anomaly ➔ go forward  |  Anomaly ➔ go back",
    instructionMenu: "[M] Menu",
    hideHint: "HIDE HINT",
    showHint: "SHOW HINT",
    normalStatus: "Everything looks normal...",
    freedom: "FREEDOM!",
    freedomDesc: "\"Maybe it's gray, but at least it's outside...\"",
    stepsCount: "Steps:",
    ending: "Ending",
    lostMind: "YOU LOST YOUR MIND",
    lostMindDesc: "Your mind couldn't handle the anomalies.",
    reachedFloor: "You reached floor:",
    tryAgain: "BACK TO MENU",
    rivalWon: "RIVAL ESCAPED FIRST",
    rivalWonDesc: "You are left alone in the corridor...",
    yourScore: "Your score: F.",
    catPrompt: "Press [E] to pet the cat",
    catPromptMobile: "Press [🖐️] to pet the cat",
    catNormal: "HATOR, HATOR, HATOR! Everything is normal, meow...",
    catAnomaly: "HATOR, HATOR, HATOR! I smell an anomaly, meow!",
    tvPrompt: "Press [E] to hit the TV",
    tvPromptMobile: "Press [🖐️] to hit the TV",
    strollerAttack: "⚠️ THE STROLLER IS ATTACKING! RUN!",
    rzepaHintText: "🌱 Rzepa is NOT an anomaly! Familiada - press [E]",
    rzepaHintTextMobile: "🌱 Rzepa is NOT an anomaly! Familiada - press [🖐️]",
    radPrompt: "Press [E] to tap the radiator back",
    radPromptMobile: "Press [🖐️] to tap the radiator back",
    radMessage: "Tapped back to the neighbor! +5% Sanity",
    karolAsks: "Karol asks:",
    shot: "GUESS",
    famBest: "100% - Top answer!",
    famGood: "Good answer! That gives points!",
    famBad: "No SURVEYED person answered this way! -15% sanity",
    famRecover: "You recover",
    famSanity: "% sanity.",
    exitCorrect: "✓ Exit",
    backCorrect: "👁 Good! You backed out in time. F.",
    resetAnomaly: "✗ There was an anomaly! RESET",
    resetNormal: "✗ There was no anomaly! RESET",
    playerLeft: "🔌 Player left the game!",
    exitScreenTitle: "THANK YOU FOR PLAYING",
    exitScreenDesc: "You can safely close this browser tab.",
  },
  pl: {
    title: "POLISH ANOMALIES",
    subtitle: "KORYTARZ EDITION",
    startSolo: "START SOLO",
    multiplayer: "MULTIPLAYER",
    options: "OPCJE",
    exit: "WYJDŹ",
    musicMenu: "Muzyka: F. Chopin",
    mpTitle: "TRYB MULTIPLAYER",
    connecting: "⏳ Łączenie z serwerem...",
    connected: "✓ Serwer podłączony",
    nickLabel: "TWÓJ NICK (Wyświetlany innym):",
    newGame: "NOWA GRA",
    createRoom: "STWÓRZ POKÓJ",
    joinGame: "DOŁĄCZ DO GRY",
    roomCodePlaceholder: "KOD POKOJU",
    join: "DOŁĄCZ",
    backToMenu: "WRÓĆ DO MENU",
    room: "POKÓJ:",
    shareCode: "Przekaż ten kod znajomemu, aby mógł dołączyć.",
    playersInRoom: "GRACZE W POKOJU:",
    host: "HOST",
    startGameOnline: "ROZPOCZNIJ GRĘ ONLINE",
    waitingHost: "Oczekiwanie, aż Host rozpocznie...",
    leaveRoom: "OPUŚĆ POKÓJ",
    gameplaySolo: "ROZGRYWKA (Tylko Solo)",
    randomBase: "Losowa Baza (Różne strony)",
    hardcoreMode: "Tryb Hardcore (Mix anomalii)",
    roguelikeMode: "Tryb Roguelike (Nieskończoność)",
    audioVideo: "AUDIO / WIDEO",
    vhsEffect: "Efekt Kasety VHS",
    musicVol: "Muzyka (Menu):",
    ambVol: "Dźwięk otoczenia:",
    stepsVol: "Głośność kroków:",
    language: "Język / Language",
    back: "WRÓĆ",
    paused: "PAUZA",
    resume: "WZNÓW",
    exitToMenu: "WYJDŹ DO MENU",
    sanity: "POCZYTALNOŚĆ:",
    floor: "W.",
    interactPrompt: "Interakcja",
    sprint: "BIEG",
    controlsHintPC: "Ruch = W, A, S, D\nInterakcje = E\nSprint = SHIFT\nLatarka = F",
    instructionHelp: "Brak anomalii ➔ idź naprzód  |  Anomalia ➔ wycofaj się",
    instructionMenu: "[M] Menu",
    hideHint: "UKRYJ PODPOWIEDŹ",
    showHint: "POKAŻ PODPOWIEDŹ",
    normalStatus: "Wszystko wygląda normalnie...",
    freedom: "WOLNOŚĆ!",
    freedomDesc: "\"Może i szaro, ale chociaż na zewnątrz...\"",
    stepsCount: "Kroków:",
    ending: "Zakończenie",
    lostMind: "POSTRADAŁEŚ ZMYSŁY",
    lostMindDesc: "Umysł nie wytrzymał błędów w korytarzu.",
    reachedFloor: "Dotarłeś do klatki:",
    tryAgain: "WRÓĆ DO MENU",
    rivalWon: "RYWAL UCIEKŁ PIERWSZY",
    rivalWonDesc: "Zostałeś sam w korytarzu...",
    yourScore: "Twój wynik: W.",
    catPrompt: "Naciśnij [E] aby pogłaskać kota",
    catPromptMobile: "Naciśnij [🖐️] aby pogłaskać kota",
    catNormal: "HATOR, HATOR, HATOR! Wszystko normalne, miau...",
    catAnomaly: "HATOR, HATOR, HATOR! Czuję anomalię, miau!",
    tvPrompt: "Naciśnij [E] aby uderzyć w kineskop",
    tvPromptMobile: "Naciśnij [🖐️] aby uderzyć w kineskop",
    strollerAttack: "⚠️ WÓZEK CIĘ ATAKUJE! WIEJ!",
    rzepaHintText: "🌱 Rzepa to NIE anomalia! Familiada - użyj [E]",
    rzepaHintTextMobile: "🌱 Rzepa to NIE anomalia! Familiada - użyj [🖐️]",
    radPrompt: "Naciśnij [E] aby odstukać sąsiadowi",
    radPromptMobile: "Naciśnij [🖐️] aby odstukać",
    radMessage: "Odstukano sąsiadowi w rury! +5% Poczytalności",
    karolAsks: "Karol pyta:",
    shot: "STRZAŁ",
    famBest: "100% - Najwięcej odpowiedzi!",
    famGood: "Dobra odpowiedź! To punktuje!",
    famBad: "Żaden ANKIETOWANY tak nie odpowiedział! -15% poczytalności",
    famRecover: "Odzyskujesz",
    famSanity: "% poczytalności.",
    exitCorrect: "✓ Wyjście",
    backCorrect: "👁 Dobrze! Wycofano się w porę. W.",
    resetAnomaly: "✗ Była anomalia! RESET",
    resetNormal: "✗ Nie było anomalii! RESET",
    playerLeft: "🔌 Gracz opuścił grę!",
    exitScreenTitle: "DZIĘKUJEMY ZA GRĘ",
    exitScreenDesc: "Możesz bezpiecznie zamknąć kartę przeglądarki.",
  }
};

// ─── KONFIGURACJA ANOMALII ──────────────────────────────────────────────
const getAnomalies = (lang) => [
  { id:"no_light", name: lang==="en"?"Missing bulb":"Brak żarówki", hint: lang==="en"?"Darkness where the lamp shone":"Ciemność tam gdzie świeciła lampa" },
  { id:"figure", name: lang==="en"?"Stranger":"Nieznajomy", hint: lang==="en"?"Someone is standing at the end of the corridor":"Ktoś stoi na końcu korytarza" },
  { id:"open_door", name: lang==="en"?"Open door No. 7":"Otwarte drzwi nr 7", hint: lang==="en"?"Door 7 is ajar":"Drzwi 7 są uchylone" },
  { id:"stroller", name: lang==="en"?"Overturned stroller":"Wywrócony wózek", hint: lang==="en"?"The stroller is lying on its side":"Wózek leży na boku" },
  { id:"writing", name: lang==="en"?"Writing on the wall":"Napis na ścianie", hint: lang==="en"?"Something is written in red paint":"Coś napisano czerwoną farbą" },
  { id:"puddle", name: lang==="en"?"Puddle":"Kałuża", hint: lang==="en"?"Water in the middle of the floor":"Woda na środku podłogi" },
  { id:"broken_mailbox", name: lang==="en"?"Torn mailbox":"Wyrwana skrzynka", hint: lang==="en"?"The mailboxes look different":"Skrzynki pocztowe wyglądają inaczej" },
  { id:"cat", name: lang==="en"?"Black cat":"Czarny kot", hint: lang==="en"?"A black cat sits in the shadows":"Czarny kot siedzi w cieniu" },
  { id:"jp2_distorted", name: lang==="en"?"Scary pope":"Straszny papież", hint: lang==="en"?"The face in the painting has changed":"Twarz na obrazie się zmieniła" },
  { id:"malysz_pudzian", name: lang==="en"?"Swapped photo":"Podmienione zdjęcie", hint: lang==="en"?"This athlete looks different than usual":"Ten sportowiec wygląda inaczej niż zwykle" },
  { id:"napis_zmiana", name: lang==="en"?"Changed sign":"Zmieniony napis", hint: lang==="en"?"This sign sounds weird...":"Ten napis jakoś dziwnie brzmi..." },
  { id:"no_mess_7", name: lang==="en"?"Mess disappeared":"Zniknął bałagan", hint: lang==="en"?"It's suspiciously clean under door 7":"Pod drzwiami 7 jest podejrzanie czysto" },
  { id:"jp2_death_tg", name: lang==="en"?"Teletext - Pope":"Telegazeta - Papież", hint: lang==="en"?"Look at the TV screen":"Spójrz na ekran telewizora" },
  { id:"tg_sales", name: lang==="en"?"Teletext - Onion":"Telegazeta - Cebula", hint: lang==="en"?"Someone posted an ad on TV":"Ktoś dał ogłoszenie w telewizji" },
  { id:"peephole_eye", name: lang==="en"?"Eye in peephole":"Oko w wizjerze", hint: lang==="en"?"The neighbor from number 5 is watching you through the peephole":"Sąsiad pod 'piątką' obserwuje cię przez judasza" },
  { id:"red_lights", name: lang==="en"?"Red lights":"Czerwone światła", hint: lang==="en"?"The light has taken on a bloody color":"Światło przybrało krwisty kolor" },
  { id:"upside_down_jp2", name: lang==="en"?"Upside down Pope":"Odwrócony Papież", hint: lang==="en"?"The painting hangs upside down":"Obraz wisi do góry nogami" },
  { id:"giant_onion", name: lang==="en"?"Giant Onion":"Gigantyczna Cebula", hint: lang==="en"?"A mutated onion under door 7":"Zmutowana cebula pod drzwiami 7" },
  { id:"moving_stroller", name: lang==="en"?"Moving stroller":"Jadący wózek", hint: lang==="en"?"Run! The stroller is chasing you!":"Uciekaj! Wózek cię goni!" },
  { id:"tv_noise", name: lang==="en"?"TV Static":"Szum z TV", hint: lang==="en"?"The TV lost its signal":"Telewizor stracił sygnał" },
  { id:"missing_exit", name: lang==="en"?"Missing sign":"Brak znaku", hint: lang==="en"?"The exit sign ran away from the ceiling":"Znak wyjścia uciekł z sufitu" },
  { id:"blood_trail", name: lang==="en"?"Tracks on the carpet":"Ślady na dywanie", hint: lang==="en"?"Strange, red tracks trail along the corridor":"Dziwne, czerwone ślady ciągną się po korytarzu" },
  { id:"missing_doors", name: lang==="en"?"Missing door 5":"Brak drzwi 5", hint: lang==="en"?"Apartment No. 5 just disappeared":"Mieszkanie nr 5 po prostu zniknęło" },
  { id:"ceiling_eyes", name: lang==="en"?"Eyes on the ceiling":"Oczy na suficie", hint: lang==="en"?"Something is watching you from the darkness above":"Z ciemności na górze coś na ciebie patrzy" },
  { id:"all_doors_open", name: lang==="en"?"Draft":"Przeciąg", hint: lang==="en"?"All apartments are open":"Wszystkie mieszkania są otwarte" },
  { id:"ufo_monument", name: lang==="en"?"UFO Monument":"Pomnik UFO w Emilcinie", hint: lang==="en"?"An alien monument appeared in the corridor":"Na korytarzu wyrósł pomnik lądowania kosmitów" },
  { id:"alien_poster", name: lang==="en"?"Alien Poster":"Plakat z kosmitą", hint: lang==="en"?"An alien face is taped to the door":"Na drzwiach przyklejono plakat z twarzą kosmity" },
  { id:"radiator_tap", name: lang==="en"?"Tapping radiator":"Stukający kaloryfer", hint: lang==="en"?"The neighbor is tapping the pipes":"Sąsiad uderza w rury grzejnika" },
  { id:"doormat_text", name: lang==="en"?"Creepy Doormat":"Dziwna wycieraczka", hint: lang==="en"?"The doormat is telling you to run":"Napis na wycieraczce każe ci uciekać" },
  { id:"jars_creepy", name: lang==="en"?"Creepy Jars":"Upiorne weki", hint: lang==="en"?"Something is wrong with the neighbour's preserves":"Coś nie tak z przetworami sąsiada" },
  { id:"fern_monster", name: lang==="en"?"Mutated Fern":"Zmutowana paprotka", hint: lang==="en"?"The plant grew out of control":"Roślina wymknęła się spod kontroli" },
  { id:"meter_crazy", name: lang==="en"?"Crazy Meter":"Zwariowany licznik", hint: lang==="en"?"The electricity meter is going crazy":"Licznik prądu zwariował i iskrzy" },
  { id:"vent_eyes", name: lang==="en"?"Ventilation":"Coś w wentylacji", hint: lang==="en"?"Something is looking at you from the vent":"Ktoś patrzy na ciebie z kratki wentylacyjnej" },
  { id:"missing_vent", name: lang==="en"?"Missing vent":"Brak kratki", hint: lang==="en"?"One of the ceiling vents is missing":"Brakuje jednej z kratek pod sufitem" },
];

const getFamiliadaQ = (lang) => lang === "en" ? [
  { q: "More than one animal is a...", a: [ {t: "Llama", p: 100}, {t: "Sheep", p: 30}, {t: "Herd", p: 15} ] },
  { q: "Which school subject is least useful in life?", a: [ {t: "Sandwich", p: 100}, {t: "Math", p: 20}, {t: "Art", p: 10}, {t: "PE", p: 5} ] },
  { q: "A word starting with the letter 'Z'?", a: [ {t: "Zebra", p: 100}, {t: "Zoo", p: 40}, {t: "Zombie", p: 20}, {t: "Zero", p: 10} ] },
  { q: "A small, but dangerous animal", a: [ {t: "Dachshund", p: 100}, {t: "Marten", p: 40}, {t: "Tick", p: 20}, {t: "Wasp", p: 10}, {t: "Rat", p: 5} ] }
] : [
  { q: "Więcej niż jedno zwierzę to...", a: [ {t: "Lama", p: 100}, {t: "Owca", p: 30}, {t: "Stado", p: 15} ] },
  { q: "Jaki przedmiot szkolny najmniej przydaje się w życiu?", a: [ {t: "Kanapka", p: 100}, {t: "Matematyka", p: 20}, {t: "Plastyka", p: 10}, {t: "Wf", p: 5} ] },
  { q: "Słowo zaczynające się na literę »ć«?", a: [ {t: "Ćmiel", p: 100}, {t: "Ćma", p: 40}, {t: "Ćwierć", p: 20}, {t: "Ćwok", p: 10} ] },
  { q: "Małe, ale niebezpieczne zwierzę", a: [ {t: "Jamnik", p: 100}, {t: "Kuna", p: 40}, {t: "Kleszcz", p: 20}, {t: "Osa", p: 10}, {t: "Szczur", p: 5} ] }
];

// ─── CANVAS TEXTURES ───────────────────────────────────────────────────────
function mkWall() {
  const c = document.createElement("canvas"); c.width=512; c.height=512; const g = c.getContext("2d");
  g.fillStyle="#50574A"; g.fillRect(0,0,512,308);
  for(let i=0;i<60;i++){ g.strokeStyle=`rgba(20,25,15,${.04+Math.random()*.08})`; g.lineWidth=1+Math.random()*1.5; g.beginPath(); g.moveTo(Math.random()*512,0); g.lineTo(Math.random()*512,308); g.stroke(); }
  for(let x=0;x<512;x+=68){ const gr=g.createLinearGradient(x,0,x+68,0); gr.addColorStop(0,"rgba(255,255,255,0)"); gr.addColorStop(.45,"rgba(255,255,255,.05)"); gr.addColorStop(1,"rgba(255,255,255,0)"); g.fillStyle=gr; g.fillRect(x,0,68,308); }
  g.fillStyle="#8C7C5C"; g.fillRect(0,308,512,204);
  for(let i=0;i<600;i++){ g.fillStyle=`rgba(60,50,25,${Math.random()*.05})`; g.fillRect(Math.random()*512,308+Math.random()*204,Math.random()*4,Math.random()*3); }
  g.fillStyle="#1A1208"; g.fillRect(0,300,512,14); g.fillStyle="#3A2810"; g.fillRect(0,302,512,8); g.fillStyle="#151008"; g.fillRect(0,492,512,20); g.fillStyle="#2E2010"; g.fillRect(0,494,512,10);
  for(let x=0;x<=512;x+=68){ g.fillStyle="#1A1208"; g.fillRect(x-3,0,5,308); g.fillStyle="rgba(90,70,25,.25)"; g.fillRect(x+1,0,2,308); }
  return c;
}
function mkFloor() {
  const c = document.createElement("canvas"); c.width=512; c.height=512; const g = c.getContext("2d");
  g.fillStyle="#6A655A"; g.fillRect(0,0,512,512); 
  for(let i=0;i<1000;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.15})`; g.fillRect(Math.random()*512,Math.random()*512,Math.random()*4,Math.random()*4); }
  g.strokeStyle="rgba(0,0,0,0.3)"; g.lineWidth=3;
  for(let x=0;x<=512;x+=128){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,512); g.stroke(); }
  for(let y=0;y<=512;y+=128){ g.beginPath(); g.moveTo(0,y); g.lineTo(512,y); g.stroke(); }
  return c;
}
function mkCeil() {
  const c = document.createElement("canvas"); c.width=512; c.height=512; const g = c.getContext("2d");
  g.fillStyle="#D5C8A4"; g.fillRect(0,0,512,512);
  for(let i=0;i<300;i++){ g.fillStyle="rgba(90,75,45,"+(Math.random()*.035)+")"; g.fillRect(Math.random()*512,Math.random()*512,Math.random()*5,Math.random()*4); }
  return c;
}
function mkEyeTex() {
  const c = document.createElement("canvas"); c.width=64; c.height=64; const g = c.getContext("2d");
  g.fillStyle="#1A0A05"; g.fillRect(0,0,64,64); g.fillStyle="#FFFFFF"; g.beginPath(); g.ellipse(32,32, 28, 16, 0, 0, Math.PI*2); g.fill();
  g.fillStyle="#4080A0"; g.beginPath(); g.arc(32,32,14,0,Math.PI*2); g.fill(); g.fillStyle="#000000"; g.beginPath(); g.arc(32,32,7,0,Math.PI*2); g.fill();
  g.fillStyle="#FFFFFF"; g.beginPath(); g.arc(28,28,3,0,Math.PI*2); g.fill();
  return c;
}
function mkNapisZrywaj() {
  const c = document.createElement("canvas"); c.width=512; c.height=80; const g = c.getContext("2d"); g.clearRect(0,0,512,80);
  g.font="bold 24px 'Courier New',monospace"; g.textAlign="center"; g.fillStyle="rgba(220,200,120,.9)"; g.fillText("Zrywaj boki, parskaj w duchu...",256,48);
  return c;
}
function mkNapisNieLekajcie() {
  const c = document.createElement("canvas"); c.width=512; c.height=100; const g = c.getContext("2d"); g.clearRect(0,0,512,100);
  g.font="bold 30px 'Courier New',monospace"; g.textAlign="center"; g.fillStyle="rgba(240,220,130,.95)"; g.shadowColor="rgba(200,160,0,.6)"; g.shadowBlur=12; g.fillText("Nie lękajcie się!",256,58);
  return c;
}
function mkNapisNieZesrajcie() {
  const c = document.createElement("canvas"); c.width=512; c.height=100; const g = c.getContext("2d"); g.clearRect(0,0,512,100);
  g.font="bold 28px 'Courier New',monospace"; g.textAlign="center"; g.fillStyle="rgba(200,60,60,.95)"; g.shadowColor="rgba(180,0,0,.6)"; g.shadowBlur=14; g.fillText("Nie zesrajcie się!",256,58);
  return c;
}
function mkTelegazeta() {
  const c = document.createElement("canvas"); c.width=320; c.height=240; const g = c.getContext("2d");
  g.fillStyle="#0000CC"; g.fillRect(0,0,320,240); g.fillStyle="#CC0000";
  for(let i=0;i<10;i++){g.fillStyle=i%2===0?"#CC0000":"#AA0000";g.fillRect(i*32,0,32,20);g.fillRect(i*32,220,32,20);}
  g.font="bold 11px monospace"; g.fillStyle="#FFFFFF"; g.fillText("P100  100  05/07  TG1  pon.29.11  21:55",2,14);
  g.fillStyle="#00CCCC"; g.font="bold 16px monospace"; g.textAlign="center"; g.fillText("SPIS TREŚCI  101-104",160,48);
  g.textAlign="left"; g.fillStyle="#FFFFFF"; g.font="12px monospace";
  g.fillText("\"TELEGAZETA\"(R)",55,68); g.fillText("ul. Woronicza 17",55,83); g.fillText("00-999 Warszawa",55,98); g.fillText("tel. 022/5476706",55,113);
  g.fillStyle="#FFFF00"; g.font="bold 12px monospace"; g.fillText("\u25a1 OGLOSZEN.    500",10,145); g.fillText("\u25a1 FINANSE      605",10,160);
  g.fillStyle="#FF4444"; g.fillRect(10,163,185,16); g.fillStyle="#FFFF00"; g.fillText("\u25a1 AKTUALNOSCI 110",10,175);
  g.fillStyle="#FFFFFF"; g.fillText("\u25a1 SPORT        200",10,191); g.fillText("\u25a1 PROGRAM TV  300",10,207);
  g.fillStyle="#0044FF"; g.fillRect(210,28,95,78); g.fillStyle="#FFFFFF"; g.font="bold 40px monospace"; g.textAlign="center"; g.fillText("tg",258,85);
  g.fillStyle="#FFFFFF"; g.fillRect(210,148,95,48); g.fillStyle="#0000AA"; g.font="bold 20px monospace"; g.fillText("TVP1",258,180);
  for(let y=0;y<240;y+=2){g.fillStyle="rgba(0,0,0,0.35)";g.fillRect(0,y,320,1);}
  return c;
}
function mkTelegazetaDeath() {
  const c = document.createElement("canvas"); c.width=320; c.height=240; const g = c.getContext("2d");
  g.fillStyle="#000000"; g.fillRect(0,0,320,240); g.fillStyle="#CC0000";
  for(let i=0;i<10;i++){g.fillRect(i*32,0,32,20);g.fillRect(i*32,220,32,20);}
  g.font="bold 11px monospace"; g.fillStyle="#FFFFFF"; g.fillText("P110  110  02/04  TG1  sob.02.04  21:37",2,14);
  g.fillStyle="#FFFFFF"; g.font="bold 18px monospace"; g.textAlign="center"; g.fillText("PILNE WIADOMOŚCI",160,50);
  g.fillStyle="#CC0000"; g.fillRect(20,70,280,30); g.fillStyle="#FFFFFF"; g.font="bold 20px monospace"; g.fillText("NIE ŻYJE PAPIEŻ",160,92);
  g.font="bold 16px monospace"; g.fillStyle="#FFFFFF"; g.fillText("JAN PAWEŁ II",160,120);
  g.textAlign="left"; g.font="12px monospace"; g.fillStyle="#FFFF00"; g.fillText("Zmarł dziś o godz. 21:37",30,150); g.fillText("w Watykanie.",30,165);
  g.fillStyle="#00CCCC"; g.fillText("Więcej informacji...",30,190);
  for(let y=0;y<240;y+=2){g.fillStyle="rgba(0,0,0,0.35)";g.fillRect(0,y,320,1);}
  return c;
}
function mkTelegazetaSales() {
  const c = document.createElement("canvas"); c.width=320; c.height=240; const g = c.getContext("2d");
  g.fillStyle="#0000CC"; g.fillRect(0,0,320,240); g.fillStyle="#CC0000";
  for(let i=0;i<10;i++){g.fillRect(i*32,0,32,20);g.fillRect(i*32,220,32,20);}
  g.font="bold 11px monospace"; g.fillStyle="#FFFFFF"; g.fillText("P500  500  12/12  TG1  sob.12.08  14:22",2,14);
  g.fillStyle="#FFFF00"; g.font="bold 16px monospace"; g.textAlign="center"; g.fillText("OGŁOSZENIA DROBNE",160,48);
  g.fillStyle="#FFFFFF"; g.font="14px monospace"; g.textAlign="left"; g.fillText("SPRZEDAM ŚWIEŻE", 20, 90); g.fillText("ZIEMNIAKI I CEBULĘ", 20, 110); g.fillText("Z WŁASNEGO POLA.", 20, 130);
  g.fillStyle="#00FFFF"; g.fillText("Dzwonić pod nr:", 20, 170); g.font="bold 18px monospace"; g.fillStyle="#FF4444"; g.fillText("420 2137 1109", 20, 195);
  for(let y=0;y<240;y+=2){g.fillStyle="rgba(0,0,0,0.35)";g.fillRect(0,y,320,1);}
  return c;
}
function mkTVNoise() {
    const c = document.createElement("canvas"); c.width=320; c.height=240; const g = c.getContext("2d");
    for(let i=0; i<320; i+=4) {
        for(let j=0; j<240; j+=4) {
            const val = Math.floor(Math.random()*255);
            g.fillStyle = `rgb(${val},${val},${val})`;
            g.fillRect(i,j,4,4);
        }
    }
    return c;
}
function mkCreepyFaceOverlay() {
  const c = document.createElement("canvas"); c.width=256; c.height=356; const g = c.getContext("2d"); g.clearRect(0,0,256,356);
  g.fillStyle="rgba(0,0,0,0.85)"; g.beginPath(); g.arc(105, 140, 18, 0, Math.PI*2); g.fill(); g.beginPath(); g.arc(165, 140, 18, 0, Math.PI*2); g.fill();
  g.fillStyle="#FF0000"; g.shadowColor="#FF0000"; g.shadowBlur=10; g.beginPath(); g.arc(105, 140, 4, 0, Math.PI*2); g.fill(); g.beginPath(); g.arc(165, 140, 4, 0, Math.PI*2); g.fill();
  g.shadowBlur=0; g.beginPath(); g.arc(135, 230, 60, 0, Math.PI, false); g.lineWidth=14; g.strokeStyle="rgba(0,0,0,0.9)"; g.stroke(); g.lineWidth=4; g.strokeStyle="#600000"; g.stroke();
  return c;
}
function mkDoor(num, style=0) {
  const c = document.createElement("canvas"); c.width=256; c.height=512; const g = c.getContext("2d");
  const colors = [
    {base:"#5C3A1E", dark:"#3A2210", mid:"#7A5030", trim:"#C8A040"}, {base:"#1E3A2A", dark:"#0E2218", mid:"#2E5A3E", trim:"#A09060"},
    {base:"#2A2A3A", dark:"#161622", mid:"#3C3C52", trim:"#9A9080"}, {base:"#5A2A10", dark:"#381808", mid:"#783C18", trim:"#C09030"},
    {base:"#3A3028", dark:"#221E18", mid:"#524840", trim:"#B09050"}
  ];
  const col = colors[style % colors.length];
  g.fillStyle = col.base; g.fillRect(0,0,256,512);
  for(let i=0;i<12;i++){ g.strokeStyle=`rgba(0,0,0,${.04+Math.random()*.06})`; g.lineWidth=1+Math.random()*2; g.beginPath(); g.moveTo(Math.random()*40,0); g.bezierCurveTo(Math.random()*256,128,Math.random()*256,384,Math.random()*40+216,512); g.stroke(); }
  const panels = [[16,14,224,110],[16,138,224,110],[16,264,224,210]];
  panels.forEach(([px,py,pw,ph])=>{
    g.fillStyle=col.dark; g.fillRect(px,py,pw,ph); g.fillStyle=col.mid; g.fillRect(px+3,py+3,pw-6,ph-6);
    g.fillStyle=col.base; g.fillRect(px+3,py+3,pw-6,4); g.fillRect(px+3,py+3,4,ph-6);
    g.fillStyle=`rgba(0,0,0,.3)`; g.fillRect(px+3,py+ph-7,pw-6,4); g.fillRect(px+pw-7,py+3,4,ph-6);
  });
  g.fillStyle="#888880"; g.beginPath(); g.arc(218,268,10,0,Math.PI*2); g.fill(); g.fillStyle="#666860"; g.beginPath(); g.arc(218,268,7,0,Math.PI*2); g.fill();
  g.fillStyle="#A0A098"; g.fillRect(212,272,12,4); g.fillRect(192,273,22,6); g.fillRect(188,268,8,16); g.fillStyle="#C8C8C0"; g.fillRect(213,273,10,2);
  g.fillStyle="#1A1A18"; g.beginPath(); g.arc(128,195,7,0,Math.PI*2); g.fill(); g.fillStyle="#2A2820"; g.beginPath(); g.arc(128,195,5,0,Math.PI*2); g.fill();
  g.fillStyle="rgba(80,100,120,.6)"; g.beginPath(); g.arc(127,194,3,0,Math.PI*2); g.fill();
  g.fillStyle="#D4C080"; g.fillRect(100,468,56,32); g.fillStyle="#B8A060"; g.fillRect(102,470,52,28);
  g.fillStyle="#3A2810"; g.font="bold 20px monospace"; g.textAlign="center"; g.fillText(String(num), 128, 492);
  g.fillStyle="#C8C0A0"; g.fillRect(228,296,18,26); g.fillStyle="#E0D8B8"; g.fillRect(230,298,14,10); g.fillStyle="#A09060"; g.fillRect(228,294,18,4);
  return c;
}
function mkWriting() {
  const c = document.createElement("canvas"); c.width=512; c.height=200; const g = c.getContext("2d"); g.clearRect(0,0,512,200);
  g.font="bold 32px monospace"; g.textAlign="center"; g.fillStyle="rgba(160,8,8,.95)"; 
  g.fillText("IMIĘ JEGO BĘDZIE",256,70);
  g.fillText("CZTERDZIEŚCI I CZTERY",256,110);
  return c;
}
function mkNotice() {
  const c = document.createElement("canvas"); c.width=600; c.height=400; const g = c.getContext("2d");
  g.fillStyle="#E8E0C0"; g.fillRect(0,0,600,400);
  for(let i=0;i<200;i++){ g.fillStyle=`rgba(100,80,40,${Math.random()*.08})`; g.beginPath(); g.arc(Math.random()*600, Math.random()*400, Math.random()*15, 0, Math.PI*2); g.fill(); }
  
  g.fillStyle="#1A1A1A"; 
  g.textAlign="center"; 
  g.textBaseline="middle";
  const lines = ["SĄSIEDZI z LOKALU 7!!!","WEŹCIE TE WORY","Z CEBULOM I","ZIEMNIAKAMI Z","KORYTARZA BO ŚMIERDZI!"];
  
  lines.forEach((line, i) => {
    g.save();
    g.translate(300, 60 + i*65);
    g.rotate((Math.random() - 0.5) * 0.08); 
    g.font = `bold ${34 + Math.random()*6}px 'Comic Sans MS', 'Brush Script MT', cursive`;
    g.fillText(line, 0, 0);
    g.restore();
  });

  g.fillStyle="#A03030"; g.beginPath(); g.arc(20,20,6,0,Math.PI*2); g.fill(); g.beginPath(); g.arc(580,20,6,0,Math.PI*2); g.fill();
  return c;
}

function mkUfoPlaque() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#3a3a3a"; g.fillRect(0, 0, 256, 256);
  for(let i=0; i<300; i++) {
      g.fillStyle = `rgba(20,20,20,${Math.random()*0.15})`;
      g.fillRect(Math.random()*256, Math.random()*256, Math.random()*10, Math.random()*5);
  }
  g.fillStyle = "#cccccc"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "bold 16px sans-serif"; g.fillText("10 maja 1978 roku", 128, 50);
  g.fillText("w EMILCINIE", 128, 80);
  g.fillText("wylądował obiekt", 128, 110);
  g.font = "bold 32px sans-serif"; g.fillStyle = "#ffffff"; g.fillText("UFO", 128, 150);
  g.font = "italic 13px sans-serif"; g.fillStyle = "#bbbbbb"; g.fillText("Prawda nas jeszcze zadziwi...", 128, 190);
  g.font = "bold 13px sans-serif"; g.fillText("FUNDACJA NAUTILUS 2005 r.", 128, 220);
  return c;
}
function mkDoormat(text) {
  const c = document.createElement("canvas"); c.width=256; c.height=128; const g = c.getContext("2d");
  g.fillStyle="#8B7355"; g.fillRect(0,0,256,128); 
  for(let i=0;i<2000;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.3})`; g.fillRect(Math.random()*256,Math.random()*128,2,2); }
  g.strokeStyle="#4A3A25"; g.lineWidth=8; g.strokeRect(4,4,248,120);
  g.fillStyle="#1A1A1A"; g.font="bold 42px 'Courier New',monospace"; g.textAlign="center"; g.textBaseline="middle";
  g.fillText(text, 128, 64);
  return c;
}
function mkVentTex() {
  const c = document.createElement("canvas"); c.width=128; c.height=128; const g = c.getContext("2d");
  g.fillStyle="#dddddd"; g.fillRect(0,0,128,128);
  g.fillStyle="#222";
  for(let i=10; i<128; i+=15) { g.fillRect(10, i, 108, 8); }
  return c;
}
function mkSticker() {
  const c = document.createElement("canvas"); c.width=128; c.height=128; const g = c.getContext("2d");
  g.fillStyle="#ffcc00"; g.beginPath(); g.moveTo(64,10); g.lineTo(118,110); g.lineTo(10,110); g.fill();
  g.strokeStyle="#000"; g.lineWidth=6; g.stroke();
  g.fillStyle="#000"; g.beginPath(); g.moveTo(64,30); g.lineTo(50,70); g.lineTo(70,70); g.lineTo(60,100); g.lineTo(80,60); g.lineTo(60,60); g.fill();
  return c;
}

// Generatory pod scenę końcową
function mkKostka() {
  const c = document.createElement("canvas"); c.width=256; c.height=256; const g = c.getContext("2d");
  g.fillStyle="#5a5a5a"; g.fillRect(0,0,256,256);
  g.strokeStyle="#333"; g.lineWidth=4;
  for(let y=0; y<256; y+=32) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
      const off = (y/32)%2 === 0 ? 0 : 32;
      for(let x=0; x<256; x+=64) {
          g.beginPath(); g.moveTo(x+off, y); g.lineTo(x+off, y+32); g.stroke();
      }
  }
  for(let i=0; i<1000; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
      g.fillRect(Math.random()*256, Math.random()*256, 3, 3);
  }
  return c;
}
function mkBlok() {
  const c = document.createElement("canvas"); c.width=512; c.height=512; const g = c.getContext("2d");
  g.fillStyle="#888580"; g.fillRect(0,0,512,512); 
  for(let i=0; i<2000; i++) {
      g.fillStyle = `rgba(50,50,40,${Math.random()*0.05})`;
      g.fillRect(Math.random()*512, Math.random()*512, 10, 5);
  }
  for(let y=40; y<512; y+=80) {
      for(let x=40; x<512; x+=60) {
          g.fillStyle="#333"; g.fillRect(x, y, 30, 40); 
          g.fillStyle="#556"; g.fillRect(x+2, y+2, 12, 36); g.fillRect(x+16, y+2, 12, 36); 
          if(Math.random() > 0.7) { g.fillStyle="#aa0"; g.fillRect(x+2, y+2, 12, 36); g.fillRect(x+16, y+2, 12, 36); }
      }
  }
  return c;
}

// ─── MESH BUILDERS ────────────────────────────────────────────────────────────
const SM = o => new THREE.MeshStandardMaterial(o);
const BX = (w,h,d) => new THREE.BoxGeometry(w,h,d);
const CT = cv => new THREE.CanvasTexture(cv);
const RW = (t,s,r) => { t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(s,r); return t; };

function buildAptDoor(num, style=0) {
  const g = new THREE.Group();
  const W_D=1.02, H_D=2.12, D_D=0.08;
  const frameMat = SM({color:0x1A1208, roughness:.9});
  const frameW = 0.07;
  [[0, H_D/2+frameW/2, W_D+frameW*2, frameW, .12],[0,-frameW/2, W_D+frameW*2, frameW, .12],[-(W_D/2+frameW/2), H_D/2, frameW, H_D+frameW, .12],[ (W_D/2+frameW/2), H_D/2, frameW, H_D+frameW, .12]].forEach(([fx,fy,fw,fh,fd])=>{
    const f=new THREE.Mesh(BX(fw,fh,fd), frameMat); f.position.set(fx,fy,-.04); g.add(f);
  });
  const doorMat = SM({map:CT(mkDoor(num, style)), roughness:.75});
  const door = new THREE.Mesh(BX(W_D, H_D, D_D), doorMat); door.position.set(0, H_D/2, 0); g.add(door);
  const thresh = new THREE.Mesh(BX(W_D+frameW*2, .04, .14), SM({color:0x5A3A18, roughness:.7})); thresh.position.set(0,-.02,.0); g.add(thresh);
  const glassMat = new THREE.MeshPhysicalMaterial({color:0x8AAABB, transparent:true, opacity:.35, roughness:.1, metalness:.1});
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(.42,.18), glassMat); glass.position.set(0, H_D-.22, D_D/2+.001); g.add(glass);
  const glassFrameMat = SM({color:0x1A1208, roughness:.9});
  [[0,.09,.46,.02,.02],[0,-.09,.46,.02,.02],[.23,0,.02,.2,.02],[-.23,0,.02,.2,.02]].forEach(([gx,gy,gw,gh,gd])=>{
    const gf=new THREE.Mesh(BX(gw,gh,gd),glassFrameMat); gf.position.set(gx, H_D-.22+gy, D_D/2+.002); g.add(gf);
  });
  return g;
}
function buildAptDoorOpen(num, style=0) {
  const g = new THREE.Group();
  const W_D=1.02, H_D=2.12, D_D=0.08;
  const frameMat = SM({color:0x1A1208, roughness:.9});
  const frameW = 0.07;
  [[0, H_D/2+frameW/2, W_D+frameW*2, frameW, .12],[0,-frameW/2, W_D+frameW*2, frameW, .12],[-(W_D/2+frameW/2), H_D/2, frameW, H_D+frameW, .12],[ (W_D/2+frameW/2), H_D/2, frameW, H_D+frameW, .12]].forEach(([fx,fy,fw,fh,fd])=>{
    const f=new THREE.Mesh(BX(fw,fh,fd), frameMat); f.position.set(fx,fy,-.04); g.add(f);
  });
  const thresh = new THREE.Mesh(BX(W_D+frameW*2, .04, .14), SM({color:0x5A3A18, roughness:.7})); thresh.position.set(0,-.02,.0); g.add(thresh);
  
  // To zaciemnia to co jest z tyłu jak otworzymy drzwi
  const voidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.4), new THREE.MeshBasicMaterial({color: 0x000000})); 
  voidMesh.position.set(0, H_D/2, -0.2); 
  g.add(voidMesh);

  const doorPivot = new THREE.Group(); 
  doorPivot.position.set(W_D/2, 0, 0); 
  
  const doorMat = SM({map:CT(mkDoor(num, style)), roughness:.75});
  const door = new THREE.Mesh(BX(W_D, H_D, D_D), doorMat); door.position.set(-W_D/2, H_D/2, 0); doorPivot.add(door);
  
  const glassMat = new THREE.MeshPhysicalMaterial({color:0x8AAABB, transparent:true, opacity:.35, roughness:.1, metalness:.1});
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(.42,.18), glassMat); glass.position.set(-W_D/2, H_D-.22, D_D/2+.001); doorPivot.add(glass);
  
  const glassFrameMat = SM({color:0x1A1208, roughness:.9});
  [[0,.09,.46,.02,.02],[0,-.09,.46,.02,.02],[.23,0,.02,.2,.02],[-.23,0,.02,.2,.02]].forEach(([gx,gy,gw,gh,gd])=>{
    const gf=new THREE.Mesh(BX(gw,gh,gd),glassFrameMat); gf.position.set(gx - W_D/2, H_D-.22+gy, D_D/2+.002); doorPivot.add(gf);
  });
  
  doorPivot.add(door);
  g.add(doorPivot);
  g.userData.doorPivot = doorPivot;
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
  const lm=SM({color:0x100C06,roughness:.9}); [-.2,.2].forEach(x=>{const l=new THREE.Mesh(BX(.06,.22,.06),lm);l.position.set(x,-.11,0);g.add(l);});
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
  const tex = new THREE.TextureLoader().load(imgSrc); tex.colorSpace = THREE.SRGBColorSpace;
  const img = new THREE.Mesh(new THREE.PlaneGeometry(w,h), SM({map:tex})); g.add(img);
  const fm = SM({color:0x3A2208,roughness:.7,metalness:.2}); const fw=.045;
  [[0,h/2+fw/2,w+fw*2,fw,.025],[0,-h/2-fw/2,w+fw*2,fw,.025],[w/2+fw/2,0,fw,h,.025],[-w/2-fw/2,0,fw,h,.025]].forEach(([fx,fy,fw2,fh,fd])=>{
    const fr=new THREE.Mesh(BX(fw2,fh,fd),fm); fr.position.set(fx,fy,.01); g.add(fr);
  });
  return g;
}
function buildJP2Frame(imgSrc, isDistorted=false) {
  const g=new THREE.Group(); const w=.82,h=1.14;
  const tex = new THREE.TextureLoader().load(imgSrc); tex.colorSpace = THREE.SRGBColorSpace; 
  const img=new THREE.Mesh(new THREE.PlaneGeometry(w,h),SM({map:tex})); g.add(img);
  if(isDistorted){
    const overlayMat = new THREE.MeshBasicMaterial({map:CT(mkCreepyFaceOverlay()), transparent:true});
    const overlay = new THREE.Mesh(new THREE.PlaneGeometry(w,h), overlayMat); overlay.position.z = 0.005; img.add(overlay);
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
  const g = new THREE.Group();
  const m = SM({color:0x4a554a, roughness:.5, metalness:.6, emissive: 0x050a05}); 
  const dm = SM({color:0x3a453a, roughness:.6, metalness:.4, emissive: 0x020502});
  const slotMat = SM({color:0x101010}); const numMat = SM({color:0xdddddd}); 
  const lockMat = SM({color:0xaaaaaa, metalness:0.8, roughness:0.2});

  const rows = 4, cols = 3;
  for(let r=0; r<rows; r++) for(let col=0; col<cols; col++) {
    if(broken && r===1 && col===1) continue;
    const mbX = col*0.38 - (cols-1)*0.38/2; const mbY = 0.2 + r*0.22; 
    const mb = new THREE.Mesh(BX(0.36, 0.20, 0.08), m); mb.position.set(mbX, mbY, 0); g.add(mb);
    const door = new THREE.Mesh(BX(0.34, 0.18, 0.02), dm); door.position.set(mbX, mbY, 0.04); g.add(door);
    const slot = new THREE.Mesh(BX(0.26, 0.015, 0.02), slotMat); slot.position.set(mbX, mbY+0.05, 0.045); g.add(slot);
    const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8), lockMat); lock.rotation.x = Math.PI/2; lock.position.set(mbX+0.13, mbY-0.05, 0.05); g.add(lock);
    const num = new THREE.Mesh(BX(0.06, 0.03, 0.01), numMat); num.position.set(mbX, mbY-0.05, 0.048); g.add(num);
  }
  if(broken){
    const p = new THREE.Mesh(BX(0.36, 0.20, 0.08), m); p.position.set(0, -0.1, 0.2); p.rotation.set(1.2, 0.5, 0.2); g.add(p);
    const pd = new THREE.Mesh(BX(0.34, 0.18, 0.02), dm); pd.position.set(0, -0.08, 0.24); pd.rotation.set(1.3, 0.5, 0.25); g.add(pd);
  }
  return g;
}
function buildStroller(knocked) {
  const g=new THREE.Group();
  const m=SM({color:0x6A5C4A,roughness:.9}); const wm=SM({color:0x151008,roughness:.8});
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
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.45,6),m); 
  tail.position.set(.1,.04,-.22); 
  tail.rotation.z=.5; tail.rotation.x=0.4; 
  g.add(tail);
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
  const sackMat = SM({color:0xC0A070, roughness:1}); const onionMat = SM({color:0xA05020, roughness:.8});
  const potatoMat = SM({color:0x908050, roughness:.9}); const shoeMat = SM({color:0x303030, roughness:.7});
  const sack1 = new THREE.Mesh(new THREE.SphereGeometry(.25, 12, 12), sackMat); sack1.scale.set(1, 1.4, 1); sack1.position.set(0, .35, 0); g.add(sack1);
  for(let i=0; i<5; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), onionMat); o.position.set(Math.random()*.2-.1, .55+Math.random()*.05, Math.random()*.2-.1); g.add(o); }
  const sack2 = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 12), sackMat); sack2.scale.set(1.5, 1, 1); sack2.position.set(.45, .28, .1); sack2.rotation.z = 0.2; g.add(sack2);
  for(let i=0; i<6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), potatoMat); p.scale.set(1.2,1,0.8); p.position.set(.45+Math.random()*.3-.15, .1, .1+Math.random()*.3); p.rotation.set(Math.random(), Math.random(), Math.random()); g.add(p); }
  const shoe1 = new THREE.Mesh(BX(.12, .08, .28), shoeMat); shoe1.position.set(-.3, .04, .2); shoe1.rotation.y = 0.4; g.add(shoe1);
  const shoe2 = new THREE.Mesh(BX(.12, .08, .28), shoeMat); shoe2.position.set(-.15, .04, .35); shoe2.rotation.y = -0.2; g.add(shoe2);
  return g;
}
function buildRzepa3D() {
  const g = new THREE.Group();
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xDCDCB4, roughness: 0.8, emissive: 0x303020, emissiveIntensity: 0.5 }); 
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), bulbMat); bulb.scale.set(1.2, 0.8, 1.2); bulb.position.y = 0.1; g.add(bulb);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x0a200a, emissiveIntensity: 0.3 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.15), leafMat); stem.position.set(0, 0.25, 0); g.add(stem);
  for(let i=0; i<3; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), leafMat); leaf.scale.set(0.7, 1.8, 0.1); 
    const pivot = new THREE.Group(); pivot.position.set(0, 0.3, 0); pivot.rotation.y = (i * Math.PI * 2) / 3;
    leaf.position.set(0, 0.2, 0.1); leaf.rotation.x = -0.4; pivot.add(leaf); g.add(pivot);
  }
  const glow = new THREE.PointLight(0xffffee, 1.5, 4.0); glow.position.set(0, 0.6, 0); g.add(glow);
  return g;
}
function buildUfoMonument() {
  const g = new THREE.Group();
  const baseMat = SM({color:0x4a4a4a, roughness:0.9, bumpScale: 0.02});
  const plaqueMat = SM({map: CT(mkUfoPlaque()), roughness: 0.8});
  const baseMats = [baseMat, baseMat, baseMat, baseMat, plaqueMat, baseMat]; 
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.4), baseMats);
  base.position.set(0, 0.5, 0);
  g.add(base);

  const cubeMat = SM({color:0x776655, metalness:0.7, roughness:0.4});
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), cubeMat);
  cube.position.set(0, 1.25, 0);
  cube.rotation.set(Math.PI/4, Math.PI/4, 0);
  g.add(cube);
  return g;
}

function buildJars(creepy) {
    const g = new THREE.Group();
    const glassMat = new THREE.MeshPhysicalMaterial({color: 0xccffcc, transparent: true, opacity: 0.4, roughness: 0.1, transmission: 0.9});
    const lidMat = SM({color: 0xaaaaaa, metalness: 0.6, roughness: 0.3});
    const fluidNormal = SM({color: 0x55aa22, transparent: true, opacity: 0.8});
    const fluidCreepy = SM({color: 0xaa1111, transparent: true, opacity: 0.9});

    for(let i=0; i<4; i++) {
        const jar = new THREE.Group();
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 16), glassMat);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.04, 16), lidMat); lid.position.y = 0.25;
        const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.4, 16), creepy ? fluidCreepy : fluidNormal); fluid.position.y = -0.04;
        jar.add(b); jar.add(lid); jar.add(fluid);
        
        if (creepy && i === 1) { 
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshBasicMaterial({color: 0xffffff}));
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({color: 0x000000}));
            pupil.position.z = 0.07; eye.add(pupil);
            eye.position.y = 0.05; eye.rotation.y = Math.random() * Math.PI;
            jar.add(eye);
        }
        
        jar.position.set((i%2)*0.45 - 0.22, 0.25, Math.floor(i/2)*0.45 - 0.22);
        g.add(jar);
    }
    return g;
}

function buildFern(monster) {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.3, 16), SM({color: 0x8b5a2b, roughness: 0.9}));
    pot.position.y = 0.15; g.add(pot);
    
    const leafMat = SM({color: monster ? 0x112211 : 0x2e8b57, side: THREE.DoubleSide});
    const numLeaves = monster ? 25 : 12;
    const scaleBase = monster ? 5.0 : 1.0;

    for(let i=0; i<numLeaves; i++) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.6), leafMat);
        leaf.position.y = 0.3;
        
        const pivot = new THREE.Group();
        pivot.position.y = 0.3;
        pivot.rotation.y = (i * Math.PI * 2) / numLeaves;
        pivot.rotation.x = 0.2 + Math.random() * 0.4 * (monster ? 3 : 1);
        
        leaf.position.set(0, (0.3 * scaleBase), 0);
        leaf.scale.set(scaleBase, scaleBase, scaleBase);
        if (monster) {
            leaf.rotation.x = Math.random() * 2;
            leaf.rotation.z = (Math.random() - 0.5);
        }

        pivot.add(leaf);
        g.add(pivot);
    }
    return g;
}

function buildMeter() {
    const g = new THREE.Group();
    const box = new THREE.Mesh(BX(0.45, 0.6, 0.2), SM({color: 0x222222, roughness: 0.8}));
    g.add(box);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshPhysicalMaterial({color: 0xaaaaff, transparent: true, opacity: 0.5}));
    glass.position.set(0, 0.15, 0.101); g.add(glass);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 16), SM({color: 0xaaaaaa, metalness: 0.8}));
    disc.rotation.x = Math.PI/2; disc.position.set(0, 0.15, 0.08); g.add(disc);
    
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), new THREE.MeshBasicMaterial({map: CT(mkSticker()), transparent: true}));
    sticker.position.set(0, -0.15, 0.101); g.add(sticker);

    const sparks = new THREE.PointLight(0x55aaff, 0, 4, 2);
    sparks.position.set(0, 0, 0.3);
    g.add(sparks);

    return { group: g, disc, sparks };
}

// ─── ENDING SCENE PROCEDURAL (POLSKIE PODWÓRKO) ─────────────────────────────
function buildEndingScene() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x8a9ba8);
    s.fog = new THREE.FogExp2(0x8a9ba8, 0.03);

    const amb = new THREE.AmbientLight(0xffffff, 0.6); s.add(amb);
    const dir = new THREE.DirectionalLight(0xffeedd, 0.8); dir.position.set(10, 20, 10); s.add(dir);

    const groundMat = SM({map: CT(mkKostka()), roughness: 0.9});
    groundMat.map.wrapS = groundMat.map.wrapT = THREE.RepeatWrapping; 
    groundMat.map.repeat.set(20, 20);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
    ground.rotation.x = -Math.PI/2; s.add(ground);

    const blokMat = SM({map: CT(mkBlok()), roughness: 1.0});
    blokMat.map.wrapS = blokMat.map.wrapT = THREE.RepeatWrapping; 
    blokMat.map.repeat.set(4, 4);

    const b1 = new THREE.Mesh(BX(30, 20, 10), blokMat); b1.position.set(0, 10, -25); s.add(b1);
    const b2 = new THREE.Mesh(BX(10, 20, 40), blokMat); b2.position.set(-20, 10, -5); s.add(b2);
    const b3 = new THREE.Mesh(BX(10, 20, 40), blokMat); b3.position.set(20, 10, -5); s.add(b3);

    const maluch = new THREE.Group();
    const mMat = SM({color: 0xcc2222, roughness: 0.6}); 
    const body = new THREE.Mesh(BX(1.4, 0.6, 2.8), mMat); body.position.y = 0.5; maluch.add(body);
    const cabin = new THREE.Mesh(BX(1.2, 0.5, 1.4), mMat); cabin.position.set(0, 1.05, -0.2); maluch.add(cabin);
    
    const glassMat = new THREE.MeshPhysicalMaterial({color: 0x111122, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.8});
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.4), glassMat); 
    windshield.rotation.x = -0.2; windshield.position.set(0, 1.05, 0.51); maluch.add(windshield);
    const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.4), glassMat); 
    rearGlass.rotation.x = Math.PI + 0.2; rearGlass.position.set(0, 1.05, -0.91); maluch.add(rearGlass);
    
    const tireMat = SM({color: 0x111111, roughness: 0.9});
    [[-0.7, 0.3, 0.9], [0.7, 0.3, 0.9], [-0.7, 0.3, -0.9], [0.7, 0.3, -0.9]].forEach(pos => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), tireMat);
        tire.rotation.z = Math.PI/2; tire.position.set(...pos); maluch.add(tire);
    });
    
    maluch.position.set(0, 0, -10); 
    maluch.rotation.y = 0.4;
    s.add(maluch);

    return s;
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PrlExit8Game() {
  const mountRef = useRef(null);
  const R = useRef({});
  const socketRef = useRef(null); 
  
  const S = useRef({
    phase:"menu", 
    hasAnomaly:false, anomaly:null, activeAnomalies: [], seenAnomalies: [],
    exitCount:0, streak:0, sanity: 100, yaw:0, pitch:0,
    keys:{}, decided:false, tunnelLock:false,
    drag:false, dx:0, dy:0, _lastCatPrompt:"0", _lastRzepaHint: false, _lastRadPrompt: "0",
    touchMove:{active:false,id:null,sx:0,sy:0},
    familiadaActive: false, hasRzepa: false, rzepaFound: false, hasTappedRadiator: false,
    catPulse: 0,
    vel: 0, lastDirX: 0, lastDirY: 0,
    flashlightOn: false, lastHitTime: 0, lastTvHit: 0,
    helpTimer: null,
    baseSetup: { bikeSide: 1, strollerSide: 1, messSide: 1, paintingSide: 1 },
    mpStep: 0, mpData: null 
  });
  
  const stepCount = useRef(0);
  
  const [ui, setUi] = useState({
    phase:"menu", exitCount:0, streak:0, sanity: 100,
    message:"", hint:false, hintText: "", steps:0, anomaly:null, hasAnomaly:false,
    rzepaHint:false, catPrompt:"", catMessage:"", tvPrompt: false, radPrompt: "", radMessage: "",
    showHelp: false, oppMessage: "",
    familiada: { active: false, qId: 0, step: 'none', points: 0, ansText: "" }
  });

  const [mpState, setMpState] = useState({
    playerName: "Player" + Math.floor(Math.random() * 1000),
    roomCodeInput: "",
    currentRoom: null, 
    error: "",
    opponentsProgress: {},
    isConnected: false
  });
  
  const [opts, setOpts] = useState({ 
    vhs: true, muteMusic: false, muteSounds: false,
    randomBase: false, hardcore: false, endless: false,
    musicVol: 0.4, ambVol: 0.35, stepsVol: 0.55,
    language: "pl"
  });
  const optsRef = useRef(opts);
  const isMpModeRef = useRef(false);
  
  const [famInput, setFamInput] = useState("");
  const up = p => setUi(prev=>({...prev,...p}));

  const t = T[opts.language];

  useEffect(() => {
     return () => {
         if (socketRef.current) socketRef.current.disconnect();
     }
  }, []);

  useEffect(() => {
    optsRef.current = opts;
    if (!R.current.audio) return;
    
    const { chopin, amb, steps, punch, applause, fail, radiator, meow } = R.current.audio;

    if (chopin) { chopin.volume = opts.musicVol; chopin.muted = opts.muteMusic; }
    if (amb) amb.volume = opts.ambVol;
    if (steps) steps.volume = opts.stepsVol;
    
    [amb, steps, punch, applause, fail, radiator, meow].forEach(audio => {
        if(audio) audio.muted = opts.muteSounds;
    });

    if (["menu", "options", "mp_menu", "lobby", "exit_screen"].includes(ui.phase)) {
        if (amb) amb.pause();
        if (steps) steps.pause();
        if (radiator) radiator.pause(); 
        if (!opts.muteMusic && chopin && chopin.paused) {
            chopin.play().catch(() => {});
        }
    } else if (ui.phase === "playing") {
        if (chopin) chopin.pause();
        if (!opts.muteSounds && amb && amb.paused) amb.play().catch(()=>{});
    } else if (["paused", "paused_options", "win", "gameover", "gameover_lost_race"].includes(ui.phase)) {
        if (chopin) chopin.pause();
        if (amb) amb.pause();
        if (steps) steps.pause();
        if (radiator) radiator.pause(); 
    }
  }, [opts, ui.phase]);

  useEffect(()=>{
    const mount = mountRef.current; if(!mount) return;
    const sr = S.current;

    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(mount.clientWidth,mount.clientHeight);
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const audioChopin = new Audio("chopin-fin.m4a"); audioChopin.loop = true;
    const ambience = new Audio("freesound_community-horror-ambience-01-66708.mp3"); ambience.loop = true;
    const stepsAudio = new Audio("stomping-footsteps-sound-effect.mp3"); stepsAudio.loop = true;
    const punchAudio = new Audio("universfield-classic-punch-impact-352711.mp3"); punchAudio.volume = 0.8;
    const applauseAudio = new Audio("youssefmizani-audience-applause-451356.mp3"); applauseAudio.volume = 0.7;
    const failAudio = new Audio("freesound_community-failfare-86009.mp3"); failAudio.volume = 0.7;
    const radiatorAudio = new Audio("grzejnik.mp3"); radiatorAudio.volume = 0.9; radiatorAudio.loop = true;
    const meowAudio = new Audio("meow.mp3"); meowAudio.volume = 1.0;
    
    R.current.audio = { chopin: audioChopin, amb: ambience, steps: stepsAudio, punch: punchAudio, applause: applauseAudio, fail: failAudio, radiator: radiatorAudio, meow: meowAudio };

    const startAudio = () => { 
        if(S.current.phase === "menu" && !optsRef.current.muteMusic) {
            R.current.audio?.chopin.play().catch(()=>{}); 
        }
        document.removeEventListener("click", startAudio); 
        document.removeEventListener("keydown", startAudio);
    };
    document.addEventListener("click", startAudio);
    document.addEventListener("keydown", startAudio);
    
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x020202);
    scene.fog=new THREE.FogExp2(0x020202,.055);

    const cam=new THREE.PerspectiveCamera(75,mount.clientWidth/mount.clientHeight,.05,80);
    cam.position.set(0,1.52,1.5); cam.rotation.order="YXZ";
    
    const flashlight = new THREE.SpotLight(0xffffee, 0, 18, Math.PI/6, 0.4, 1.5);
    flashlight.position.set(0, 0, 0); flashlight.target.position.set(0, 0, -1);
    cam.add(flashlight); cam.add(flashlight.target);
    scene.add(cam);

    const endScene = buildEndingScene();
    const endCam = new THREE.PerspectiveCamera(60, mount.clientWidth/mount.clientHeight, 0.1, 100);
    endCam.position.set(0, 1.6, 5);

    const cvs=renderer.domElement;
    
    const onMD=e=>{
        if(e.button===0 && !sr.familiadaActive && sr.phase==="playing"){sr.drag=true;sr.dx=e.clientX;sr.dy=e.clientY;}
    };
    const onMU=()=>{sr.drag=false;};
    const onMM=e=>{
      if(!sr.drag||sr.familiadaActive||sr.phase!=="playing")return;
      sr.yaw-=(e.clientX-sr.dx)*.004;
      sr.pitch=Math.max(-.52,Math.min(.52,sr.pitch-(e.clientY-sr.dy)*.004));
      sr.dx=e.clientX; sr.dy=e.clientY;
    };
    
    const onKD=e=>{
      if (e.code === 'KeyM') {
          if (sr.phase === "playing" && !sr.familiadaActive) {
              sr.phase = "paused"; sr.drag = false; up({ phase: "paused" });
          } else if (sr.phase === "paused" || sr.phase === "paused_options") {
              sr.phase = "playing"; up({ phase: "playing" });
          }
          return;
      }
      if (sr.familiadaActive || sr.phase!=="playing") return; 
      if(e.code === 'KeyF') {
          sr.flashlightOn = !sr.flashlightOn;
          if(R.current.flashlight) R.current.flashlight.intensity = sr.flashlightOn ? 2.5 : 0;
      }
      sr.keys[e.code]=true;
      if(["KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight", "KeyE", "ShiftLeft", "ShiftRight", "KeyF"].includes(e.code))e.preventDefault();
    };
    const onKU=e=>{ 
        if (sr.familiadaActive) return; 
        sr.keys[e.code]=false; 
    };
    const touches={move:null, look:null};
    const onTStart=e=>{
      if(sr.familiadaActive || (sr.phase!=="playing" && sr.phase!=="menu")) return;
      e.preventDefault();
      for(const t of e.changedTouches){
        const isLeft=t.clientX<mount.clientWidth/2;
        if(isLeft&&!touches.move) touches.move={id:t.identifier,sx:t.clientX,sy:t.clientY,cx:t.clientX,cy:t.clientY};
        else if(!isLeft&&!touches.look) touches.look={id:t.identifier,cx:t.clientX,cy:t.clientY};
      }
    };
    const onTMove=e=>{
      if(sr.familiadaActive || sr.phase!=="playing") return;
      e.preventDefault();
      for(const t of e.changedTouches){
        if(touches.move&&t.identifier===touches.move.id){touches.move.cx=t.clientX;touches.move.cy=t.clientY;}
        if(touches.look&&t.identifier===touches.look.id){
          sr.yaw-=(t.clientX-touches.look.cx)*.004; sr.pitch=Math.max(-.52,Math.min(.52,sr.pitch-(t.clientY-touches.look.cy)*.004));
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

    cvs.addEventListener("mousedown",onMD); window.addEventListener("mouseup",onMU); window.addEventListener("mousemove",onMM);
    cvs.addEventListener("touchstart",onTStart,{passive:false}); cvs.addEventListener("touchmove",onTMove,{passive:false}); cvs.addEventListener("touchend",onTEnd,{passive:false});
    window.addEventListener("keydown",onKD); window.addEventListener("keyup",onKU);

    const W=3.6,H=3.2,LEN=56,Z0=-26; 
    const addP=(geo,mat,pos,rx=0,ry=0)=>{const m=new THREE.Mesh(geo,mat);m.rotation.set(rx,ry,0);m.position.set(...pos);m.receiveShadow=true;scene.add(m);return m;};
    
    const dywanFloorTex = new THREE.TextureLoader().load('dywan.jpeg'); dywanFloorTex.colorSpace = THREE.SRGBColorSpace;
    addP(new THREE.PlaneGeometry(W, LEN), SM({map:RW(dywanFloorTex, 1, 20), roughness: 0.9}), [0, 0, Z0], -Math.PI/2);
    addP(new THREE.PlaneGeometry(W,LEN),SM({map:RW(CT(mkCeil()),2,14),roughness:.82}),[0,H,Z0],Math.PI/2);
    
    const wallMat=SM({map:RW(CT(mkWall()),10,1.0),roughness:.85});
    addP(new THREE.PlaneGeometry(LEN,H),wallMat,[W/2,H/2,Z0],0,-Math.PI/2); 
    addP(new THREE.PlaneGeometry(0.2,H),wallMat,[-1.8,H/2,1.9],0,Math.PI/2);
    addP(new THREE.PlaneGeometry(48.4,H),wallMat,[-1.8,H/2,-26],0,Math.PI/2);
    addP(new THREE.PlaneGeometry(0.2,H),wallMat,[-1.8,H/2,-53.9],0,Math.PI/2);
    addP(new THREE.PlaneGeometry(W,H),wallMat,[0,H/2,-54]);
    addP(new THREE.PlaneGeometry(W,H),wallMat,[0,H/2,2], 0, Math.PI);

    const stepGeo = new THREE.BoxGeometry(0.3, 0.15, 3.6); const stepMat = SM({color: 0x302518, roughness: 0.9});
    const ceilMat = SM({map:RW(CT(mkCeil()), 1, 1), roughness:.82}); const linoMat = SM({map:RW(CT(mkFloor()), 1, 4), roughness:0.8});

    addP(new THREE.PlaneGeometry(2.0, 3.6), linoMat, [-2.8, 0, 0], -Math.PI/2, 0); 
    addP(new THREE.PlaneGeometry(12.0, 3.6), ceilMat, [-7.8, H, 0], Math.PI/2, 0); 
    addP(new THREE.PlaneGeometry(12.0, H+8), wallMat, [-7.8, H/2 - 3, 1.8], 0, Math.PI); 
    addP(new THREE.PlaneGeometry(12.0, H+8), wallMat, [-7.8, H/2 - 3, -1.8], 0, 0);      
    for (let i = 0; i < 35; i++) { addP(stepGeo, stepMat, [-3.95 - i*0.3, -0.075 - i*0.15, 0]); }
    const tLight1 = new THREE.PointLight(0xFFE0A0, 1.2, 8); tLight1.position.set(-2.8, 2.0, 0); scene.add(tLight1);

    addP(new THREE.PlaneGeometry(2.0, 3.6), linoMat, [-2.8, 0, -52], -Math.PI/2, 0); 
    addP(new THREE.PlaneGeometry(12.0, 3.6), ceilMat, [-7.8, H, -52], Math.PI/2, 0); 
    addP(new THREE.PlaneGeometry(12.0, H+8), wallMat, [-7.8, H/2 - 3, -50.2], 0, Math.PI); 
    addP(new THREE.PlaneGeometry(12.0, H+8), wallMat, [-7.8, H/2 - 3, -53.8], 0, 0);      
    for (let i = 0; i < 35; i++) { addP(stepGeo, stepMat, [-3.95 - i*0.3, -0.075 - i*0.15, -52]); }
    const tLight2 = new THREE.PointLight(0xFFE0A0, 1.2, 8); tLight2.position.set(-2.8, 2.0, -52); scene.add(tLight2);

    const exitSignTex = new THREE.TextureLoader().load('wyjscie.png'); exitSignTex.colorSpace = THREE.SRGBColorSpace;
    const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({map:exitSignTex})); exitSign.position.set(0, 2.2, -53.9); scene.add(exitSign);
    const exitSignGlow = new THREE.PointLight(0x40FF60,.8,3,2); exitSignGlow.position.set(0,2.2,-53.5); scene.add(exitSignGlow);

    const lamps=[],lights=[];
    [-3,-13,-25,-31,-37,-49].forEach(z=>{
      const lm=new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24),SM({color:0xFFFFF0,emissive:0xFFFFF0,emissiveIntensity:3}));
      lm.position.set(0,H-.04,z); scene.add(lm); lamps.push(lm);
      const cable=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.12,8),SM({color:0x1A1A1A,roughness:.9})); cable.position.set(0,H+.06,z); scene.add(cable);
      const pl=new THREE.PointLight(0xFFEAA0, 1.0, 10, 2); pl.position.set(0,H-.25,z); pl.castShadow=true; scene.add(pl); lights.push(pl);
    });
    scene.add(new THREE.AmbientLight(0x111111, 0.5)); 

    const addAptDoor = (num, z, side, style=0) => {
      const door = buildAptDoor(num, style); door.rotation.y = side===1 ? -Math.PI/2 : Math.PI/2; door.position.set(side*(W/2) - side*0.05, 0, z); scene.add(door); return door;
    };
    const d3 = addAptDoor(3,  -8,  -1, 0); const d5 = addAptDoor(5,  -20,  1, 2);
    const d7 = addAptDoor(7, -25, 1, 3);
    const d8 = addAptDoor(8,  -34, -1, 4); const d10= addAptDoor(10, -47,  1, 1);
    
    const d7_open = buildAptDoorOpen(7, 3); d7_open.rotation.y = -Math.PI/2; d7_open.position.set(W/2 - 0.05, 0, -25); d7_open.visible = false; scene.add(d7_open);

    const mbN=buildMailboxes(false); mbN.rotation.y=-Math.PI/2; mbN.position.set(W/2-.15, 0.8, -29); scene.add(mbN);
    const mbB=buildMailboxes(true);  mbB.rotation.y=-Math.PI/2; mbB.position.set(W/2-.15, 0.8, -29); mbB.visible=false; scene.add(mbB);

    const alienPosterTex = new THREE.TextureLoader().load('emilcinkosmita.jpg'); alienPosterTex.colorSpace = THREE.SRGBColorSpace;
    const alienPoster = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.8), new THREE.MeshBasicMaterial({map: alienPosterTex}));
    alienPoster.rotation.y = -Math.PI/2; alienPoster.position.set(W/2 - 0.051, 1.5, -20); alienPoster.visible = false; scene.add(alienPoster);

    const jp2N=buildJP2Frame('image_8cdc9e.jpg', false); scene.add(jp2N);
    const jp2D=buildJP2Frame('image_8cdc9e.jpg', true); jp2D.visible=false; scene.add(jp2D);
    const jp2l=new THREE.SpotLight(0xFFE060,1.1,5,.45,.45); scene.add(jp2l); scene.add(jp2l.target);
    const candle=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.12,8),SM({color:0xF8F0D0,roughness:.9})); scene.add(candle);
    const flame=new THREE.PointLight(0xFF8020,.5,1.5,3); scene.add(flame);

    const malyszF = buildMalyszFrame('adam.jpeg'); malyszF.rotation.y=Math.PI/2; malyszF.position.set(-W/2+.04,1.75,-36); scene.add(malyszF);
    const pudzianF = buildMalyszFrame('pudzian.jpeg'); pudzianF.rotation.y=Math.PI/2; pudzianF.position.set(-W/2+.04,1.75,-36); pudzianF.visible=false; scene.add(pudzianF);
    const malyszL = new THREE.SpotLight(0xFFE8A0,.7,4,.5,.5); malyszL.position.set(-W/2+.7,2.8,-36); malyszL.target.position.set(-W/2+.04,1.75,-36); scene.add(malyszL); scene.add(malyszL.target);

    const wr=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.78),new THREE.MeshBasicMaterial({map:CT(mkWriting()),transparent:true,depthWrite:false}));
    wr.rotation.y=Math.PI/2; wr.position.set(-W/2+.04,2.0,-20); wr.visible=false; scene.add(wr); 

    const napisNieLekM = new THREE.Mesh(new THREE.PlaneGeometry(1.8,.38), new THREE.MeshBasicMaterial({map:CT(mkNapisNieLekajcie()),transparent:true,depthWrite:false})); napisNieLekM.rotation.y=-Math.PI/2; napisNieLekM.position.set(W/2-.04,2.4,-41); scene.add(napisNieLekM);
    const napisNieZesrajM = new THREE.Mesh(new THREE.PlaneGeometry(1.8,.38), new THREE.MeshBasicMaterial({map:CT(mkNapisNieZesrajcie()),transparent:true,depthWrite:false})); napisNieZesrajM.rotation.y=-Math.PI/2; napisNieZesrajM.position.set(W/2-.04,2.4,-41); napisNieZesrajM.visible=false; scene.add(napisNieZesrajM);

    const noticeMat = SM({map: CT(mkNotice()), roughness: 0.9, transparent: true});
    const noticeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), noticeMat);
    noticeMesh.rotation.y = -Math.PI/2;
    scene.add(noticeMesh); R.current.noticeMesh = noticeMesh;

    const rzepaM = buildRzepa3D(); rzepaM.position.set(0,0.5,-8); rzepaM.visible=false; scene.add(rzepaM);

    const tvN=buildTVStand(CT(mkTelegazeta())); tvN.position.set(-W/2+.65,0,-20); scene.add(tvN);
    const tvA=buildTVStand(CT(mkTelegazetaDeath())); tvA.position.set(-W/2+.65,0,-20); tvA.visible=false; scene.add(tvA);
    const tvS=buildTVStand(CT(mkTelegazetaSales())); tvS.position.set(-W/2+.65,0,-20); tvS.visible=false; scene.add(tvS);
    const tvNoise=buildTVStand(CT(mkTVNoise())); tvNoise.position.set(-W/2+.65,0,-20); tvNoise.visible=false; scene.add(tvNoise);

    const rad=buildRadiator(); rad.rotation.y=Math.PI/2; rad.position.set(-W/2+.1,0,-27); scene.add(rad);
    const bike=buildBike(); scene.add(bike);

    const mess7 = buildMessOnFloor(); scene.add(mess7);
    const bigOnion = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), SM({color:0xA05020, roughness:.8}));
    bigOnion.position.set(0, 0.6, -24); bigOnion.visible = false; scene.add(bigOnion);

    const sN=buildStroller(false); scene.add(sN);
    const sK=buildStroller(true); sK.visible=false; scene.add(sK);
    const sR=buildStroller(false); sR.visible=false; scene.add(sR);

    const bloodMats = SM({color: 0x550000, transparent: true, opacity: 0.8, depthWrite: false});
    const bloodTrail = new THREE.Group();
    for(let i=0; i<10; i++) {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(0.3 + Math.random()*0.3, 0.3 + Math.random()*0.3), bloodMats);
        b.rotation.x = -Math.PI/2; b.rotation.z = Math.random();
        b.position.set(Math.random()*1.5 - 0.75, 0.01, -5 - i*4); bloodTrail.add(b);
    }
    bloodTrail.visible = false; scene.add(bloodTrail);

    const ufoMonument = buildUfoMonument(); ufoMonument.position.set(-W/2 + 0.6, 0, -41); ufoMonument.visible = false; scene.add(ufoMonument);

    const fig=buildFigure(); fig.position.set(0,0,-32); fig.visible=false; scene.add(fig); 
    const puddle=new THREE.Mesh(new THREE.CircleGeometry(.85,28),SM({color:0x243040,transparent:true,opacity:.8,roughness:.02,metalness:.7}));
    puddle.rotation.x=-Math.PI/2; puddle.position.set(.25,.009,-17); puddle.visible=false; scene.add(puddle); 
    const cat=buildCat(); cat.position.set(-.75,0,-13); cat.visible=false; scene.add(cat); 
    
    const peepholeEye = new THREE.Mesh(new THREE.PlaneGeometry(.04, .04), new THREE.MeshBasicMaterial({map:CT(mkEyeTex()), transparent:true}));
    peepholeEye.position.set(W/2 - 0.051, 1.313, -20); peepholeEye.rotation.y = -Math.PI/2; peepholeEye.visible = false; scene.add(peepholeEye); 
    const peepholeGlow = new THREE.PointLight(0xcc0000, 0.8, 1.5); peepholeGlow.position.set(W/2 - 0.1, 1.313, -20); peepholeGlow.visible = false; scene.add(peepholeGlow); 

    const ceilingEyes = new THREE.Group();
    const e1 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({color: 0xff0000})); e1.position.set(-0.2, H-0.01, -15); e1.rotation.x = Math.PI/2; ceilingEyes.add(e1);
    const e2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({color: 0xff0000})); e2.position.set(0.2, H-0.01, -15); e2.rotation.x = Math.PI/2; ceilingEyes.add(e2);
    ceilingEyes.visible = false; scene.add(ceilingEyes); 

    const matN = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), SM({map: CT(mkDoormat("WITAMY")), roughness: 1}));
    matN.rotation.x = -Math.PI/2; matN.position.set(-W/2+0.5, 0.01, -34); scene.add(matN);
    const matA = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), SM({map: CT(mkDoormat("UCIEKAJ")), roughness: 1}));
    matA.rotation.x = -Math.PI/2; matA.position.set(-W/2+0.5, 0.01, -34); matA.visible = false; scene.add(matA);

    const jarsN = buildJars(false); jarsN.position.set(W/2-0.5, 0, -50.5); scene.add(jarsN);
    const jarsA = buildJars(true); jarsA.position.set(W/2-0.5, 0, -50.5); jarsA.visible = false; scene.add(jarsA);

    const fernN = buildFern(false); fernN.position.set(-W/2+0.5, 0, -49); scene.add(fernN);
    const fernA = buildFern(true); fernA.position.set(-W/2+0.5, 0, -49); fernA.visible = false; scene.add(fernA);

    const meterObj = buildMeter(); meterObj.group.position.set(-W/2+0.1, 1.4, -12); meterObj.group.rotation.y = Math.PI/2; scene.add(meterObj.group);

    const ventTex = CT(mkVentTex());
    const ventsN = [];
    [-12, -28, -44].forEach(z => {
        const ventN = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), SM({map: ventTex, roughness: 0.9}));
        ventN.position.set(W/2-0.01, H-0.4, z); ventN.rotation.y = -Math.PI/2; scene.add(ventN);
        ventsN.push(ventN);
    });
    
    const ventAGroup = new THREE.Group();
    ventAGroup.position.copy(ventsN[1].position); ventAGroup.rotation.y = ventsN[1].rotation.y;
    const ventA_base = ventsN[1].clone(); ventA_base.position.set(0,0,0); ventA_base.rotation.y = 0; ventAGroup.add(ventA_base);
    const vEye1 = new THREE.Mesh(new THREE.SphereGeometry(0.03), new THREE.MeshBasicMaterial({color: 0xff0000})); vEye1.position.set(-0.1, 0, 0.05); ventAGroup.add(vEye1);
    const vEye2 = new THREE.Mesh(new THREE.SphereGeometry(0.03), new THREE.MeshBasicMaterial({color: 0xff0000})); vEye2.position.set(0.1, 0, 0.05); ventAGroup.add(vEye2);
    const smokeMat = new THREE.MeshStandardMaterial({color: 0x333333, transparent: true, opacity: 0.5, depthWrite: false});
    const smokeParts = [];
    for(let i=0; i<6; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.15), smokeMat);
        p.position.set((Math.random()-0.5)*0.3, -Math.random()*2, 0.1);
        p.userData = { speed: 0.01 + Math.random()*0.02, phase: Math.random()*Math.PI*2 };
        ventAGroup.add(p); smokeParts.push(p);
    }
    ventAGroup.visible = false; scene.add(ventAGroup);

    const ao = { bloodTrail, sR, bigOnion, tvNoise, ufoMonument, alienPoster, figure: fig, writing: wr, puddle, cat, peephole_eye: peepholeEye, peephole_glow: peepholeGlow, ceilingEyes, matA, jarsA, fernA, ventsN, ventAGroup };

    const fadeMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthTest:false});
    const fadeMesh=new THREE.Mesh(new THREE.PlaneGeometry(4,4),fadeMat); fadeMesh.position.set(0,0,-.35); fadeMesh.renderOrder=999; cam.add(fadeMesh); scene.add(cam);

    Object.assign(R.current, {
        renderer,cam,lights,lamps,fadeMat,d3,d5,d7,d8,d10,d7_open,sN,sK,mbN,mbB,
        ao,flame,jp2N,jp2D,malyszF,pudzianF,napisNieLekM,napisNieZesrajM,rzepaM, 
        mess7, tvN, tvA, tvS, exitSign, flashlight, endScene, endCam,
        bike, candle, jp2l, rad, noticeMesh, matN, jarsN, fernN, meterObj, ventN, smokeParts
    });

    function gen(){
      let ha = false;
      let activeAnoms = [];
      const currentAnomalies = getAnomalies(optsRef.current.language);

      if (R.current.audio?.radiator) R.current.audio.radiator.pause();

      if (isMpModeRef.current && sr.mpData) {
          ha = sr.mpData.anomalySequence[sr.mpStep % 150];
          if (sr.exitCount === 0) ha = false; 
          if (ha) {
              const anomIndex = (sr.mpStep * 7) % currentAnomalies.length;
              activeAnoms = [currentAnomalies[anomIndex]];
          }
      } else {
          ha = Math.random() < 0.50;
          if (sr.exitCount === 0) ha = false; 
          if (ha) {
              if (optsRef.current.hardcore) {
                  const count = Math.floor(Math.random() * 3) + 1; 
                  const shuffled = [...currentAnomalies].sort(() => 0.5 - Math.random());
                  activeAnoms = shuffled.slice(0, count);
              } else {
                  let availableAnoms = currentAnomalies.filter(a => !sr.seenAnomalies.includes(a.id));
                  if(availableAnoms.length === 0) {
                      sr.seenAnomalies = []; 
                      availableAnoms = currentAnomalies;
                  }
                  const chosen = availableAnoms[Math.floor(Math.random() * availableAnoms.length)];
                  activeAnoms = [chosen];
                  sr.seenAnomalies.push(chosen.id);
              }
          }
      }

      sr.hasAnomaly = ha; sr.activeAnomalies = activeAnoms; sr.decided = false; sr.tunnelLock = false;
      sr.hasTappedRadiator = false; sr._lastAutoTap = 0;
      
      if(sr.sanity <= 63 && Math.random() < 0.40) { sr.hasRzepa = true; sr.rzepaFound = false; } else { sr.hasRzepa = false; }

      const bs = sr.baseSetup || { bikeSide: 1, strollerSide: 1, messSide: 1, paintingSide: 1 };
      
      if (R.current.bike) {
          R.current.bike.position.set(bs.bikeSide * (W/2 - 0.75), 0, -39);
          R.current.bike.rotation.y = bs.bikeSide * -0.25;
      }
      if (R.current.sN) {
          R.current.sN.position.set(bs.strollerSide * (W/2 - 0.68), 0, -11);
          R.current.sN.rotation.y = bs.strollerSide === 1 ? 0 : Math.PI;
          R.current.sK.position.set(R.current.sN.position.x, 0, R.current.sN.position.z);
          R.current.sK.rotation.y = R.current.sN.rotation.y;
      }
      if (R.current.mess7) {
          R.current.mess7.position.set(bs.messSide * (W/2 - 0.5), 0, -24.2);
      }
      if (R.current.jp2N) {
          R.current.jp2N.position.set(bs.paintingSide * (W/2 - 0.04), 1.78, -14);
          R.current.jp2N.rotation.y = bs.paintingSide * -Math.PI/2;
          R.current.jp2D.position.set(R.current.jp2N.position.x, 1.78, -14);
          R.current.jp2D.rotation.y = R.current.jp2N.rotation.y;
          R.current.jp2l.target.position.set(R.current.jp2N.position.x, 1.78, -14);
          R.current.jp2l.position.set(R.current.jp2N.position.x + (bs.paintingSide * -0.6), 2.9, -14);
          R.current.candle.position.set(R.current.jp2N.position.x + (bs.paintingSide * -0.21), 1.0, -14);
          R.current.flame.position.set(R.current.candle.position.x, 1.16, -14);
      }

      Object.values(ao).forEach(o=>{if(o)o.visible=false;});
      d3.visible=d5.visible=d7.visible=d8.visible=d10.visible=true;
      d7_open.visible=false; sN.visible=true; sK.visible=false; mbN.visible=true; mbB.visible=false;
      matN.visible=true; jarsN.visible=true; fernN.visible=true; 
      ao.ventsN.forEach(v => v.visible = true);
      
      lights.forEach(l=>{l.visible=true;l.intensity=1.0;l.color.setHex(0xFFEAA0)}); lamps.forEach(l=>{l.material.emissiveIntensity=3;l.material.emissive.setHex(0xFFFFF0)});
      
      if(d3.userData.doorPivot) d3.userData.doorPivot.rotation.y = 0;
      if(d5.userData.doorPivot) d5.userData.doorPivot.rotation.y = 0;
      if(d7.userData.doorPivot) d7.userData.doorPivot.rotation.y = 0;
      if(d8.userData.doorPivot) d8.userData.doorPivot.rotation.y = 0;
      if(d10.userData.doorPivot) d10.userData.doorPivot.rotation.y = 0;

      jp2N.visible=true; jp2D.visible=false; jp2N.rotation.z = 0;
      malyszF.visible=true; pudzianF.visible=false;
      napisNieLekM.visible=true; napisNieZesrajM.visible=false;
      mess7.visible=true; exitSign.visible=true;
      tvN.visible=true; tvA.visible=false; tvS.visible=false;
      
      if (R.current.noticeMesh) {
          R.current.noticeMesh.visible = true; 
          R.current.noticeMesh.position.set(W/2 - 0.041, 1.6, -3.0); 
      }

      const currentLang = optsRef.current.language;
      const joinStr = currentLang === "en" ? " AND " : " ORAZ ";
      const hintText = activeAnoms.length > 0 ? activeAnoms.map(a => a.hint).join(joinStr) : "";
      
      up({hasAnomaly:ha, hint:false, hintText: hintText, catPrompt:"", catMessage:"", tvPrompt: false, showHelp: true, radPrompt: ""});
      
      if (sr.helpTimer) clearTimeout(sr.helpTimer);
      sr.helpTimer = setTimeout(() => up({showHelp: false}), 12000);

      if(!ha) return;

      activeAnoms.forEach(an => {
          switch(an.id){
            case"no_light": lights[2].visible=false; lamps[2].material.emissiveIntensity=0; break;
            case"figure": ao.figure.visible=true; break;
            case"open_door": if(d7.userData.doorPivot) d7.userData.doorPivot.rotation.y = 1.3; break;
            case"stroller": sN.visible=false; sK.visible=true; break;
            case"writing": ao.writing.visible=true; break;
            case"puddle": ao.puddle.visible=true; break;
            case"broken_mailbox": mbN.visible=false; mbB.visible=true; break;
            case"cat": ao.cat.visible=true; break;
            case"jp2_distorted": jp2N.visible=false; jp2D.visible=true; break;
            case"malysz_pudzian": malyszF.visible=false; pudzianF.visible=true; break;
            case"napis_zmiana": napisNieLekM.visible=false; napisNieZesrajM.visible=true; break;
            case"no_mess_7": mess7.visible=false; if(R.current.noticeMesh) R.current.noticeMesh.visible=false; break;
            case"jp2_death_tg": tvN.visible=false; tvA.visible=true; break;
            case"tg_sales": tvN.visible=false; tvS.visible=true; break;
            case"peephole_eye": ao.peephole_eye.visible=true; ao.peephole_glow.visible=true; break;
            case"red_lights": break; 
            case"upside_down_jp2": jp2N.rotation.z = Math.PI; break;
            case"giant_onion": mess7.visible=false; ao.bigOnion.visible=true; if(R.current.noticeMesh) R.current.noticeMesh.visible=false; break;
            case"moving_stroller": sN.visible=false; ao.sR.visible=true; ao.sR.position.set(0,0,-40); break;
            case"tv_noise": tvN.visible=false; ao.tvNoise.visible=true; break;
            case"missing_exit": exitSign.visible=false; break;
            case"blood_trail": ao.bloodTrail.visible=true; break;
            case"missing_doors": d5.visible=false; break;
            case"ceiling_eyes": ao.ceilingEyes.visible=true; break;
            case"all_doors_open": 
                if(d3.userData.doorPivot) d3.userData.doorPivot.rotation.y = 1.3;
                if(d5.userData.doorPivot) d5.userData.doorPivot.rotation.y = 1.3;
                if(d7.userData.doorPivot) d7.userData.doorPivot.rotation.y = 1.3;
                if(d8.userData.doorPivot) d8.userData.doorPivot.rotation.y = 1.3;
                if(d10.userData.doorPivot) d10.userData.doorPivot.rotation.y = 1.3;
                break;
            case"ufo_monument": ao.ufoMonument.visible = true; break;
            case"alien_poster": ao.alienPoster.visible = true; break;
            case"radiator_tap": break; 
            case"doormat_text": matN.visible=false; ao.matA.visible=true; break;
            case"jars_creepy": jarsN.visible=false; ao.jarsA.visible=true; break;
            case"fern_monster": fernN.visible=false; ao.fernA.visible=true; break;
            case"meter_crazy": break;
            case"vent_eyes": ao.ventsN[1].visible=false; ao.ventAGroup.visible=true; break;
            case"missing_vent": ao.ventsN[1].visible=false; break;
          }
      });
    }
    R.current.gen=gen;

    function fadeFast(onMid){
      let ph="in",t0=performance.now();
      sr.phase = "busy"; 
      const tick=setInterval(()=>{
        const e=performance.now()-t0;
        if(ph==="in"){
            fadeMat.opacity=Math.min(1,e/120);
            if(fadeMat.opacity>=1){ ph="out";t0=performance.now(); onMid?.(); }
        }else{
            fadeMat.opacity=Math.max(0,1-(performance.now()-t0)/150);
            if(fadeMat.opacity<=0){ clearInterval(tick); sr.phase = "playing"; sr.tunnelLock = false; }
        }
      },14);
    }

    function decide(action){
      if(sr.phase!=="playing"||sr.decided||sr.familiadaActive)return;
      sr.decided=true;
      sr.mpStep++; 
      
      const {hasAnomaly,exitCount,streak,sanity}=sr;
      const ok=action==="exit"?!hasAnomaly:hasAnomaly;
      let ne=exitCount, ns=streak, nsan=sanity, msg="";
      
      const lang = optsRef.current.language;
      const curT = T[lang];

      if(ok){ 
          ns++; ne++; 
          const winCheck = optsRef.current.endless ? false : (ne >= 8);
          msg = action==="exit" ? (winCheck?"":`${curT.exitCorrect} ${ne}${optsRef.current.endless?"":"/8"}`) : `${curT.backCorrect}${ne}${optsRef.current.endless?"":"/8"}`; 
      } 
      else { 
          ne=0; ns=0; nsan=Math.max(0, nsan - 17); 
          msg = action==="exit" ? curT.resetAnomaly : curT.resetNormal; 
      }
      
      sr.exitCount=ne; sr.streak=ns; sr.sanity=nsan; stepCount.current++;

      if (socketRef.current && isMpModeRef.current) {
          socketRef.current.emit('update_progress', ne);
      }
      
      if(nsan <= 0){ sr.phase="gameover"; up({phase:"gameover", sanity:nsan, exitCount:ne, streak:ns, steps:stepCount.current}); return; }
      
      if(!optsRef.current.endless && ne>=8){
        if (socketRef.current && isMpModeRef.current) socketRef.current.emit('player_won');
        sr.phase="win"; R.current.fadeMat.opacity = 1.0; 
        up({phase:"win", exitCount:8, streak:ns, steps:stepCount.current});
        let t = 0;
        const winTick = setInterval(() => { t += 0.02; R.current.endCam.position.z -= 0.05; R.current.fadeMat.opacity = Math.max(0, 1 - t); if(S.current.phase !== "win") clearInterval(winTick); }, 30);
        return;
      }
      
      up({exitCount:ne, streak:ns, sanity:nsan, message:msg, steps:stepCount.current});
      setTimeout(()=>up({message:""}), 2500);
      fadeFast(() => { cam.position.set(0, 1.52, 1.5); sr.yaw=0; sr.pitch=0; gen(); });
    }

    let bob=0,flickT=0,flameT=0,animId;
    const fv=new THREE.Vector3(),rv=new THREE.Vector3();

    function animate(){
      animId=requestAnimationFrame(animate);
      if(sr.phase==="win") { renderer.render(R.current.endScene, R.current.endCam); return; }
      
      if(["playing", "menu", "paused", "paused_options", "mp_menu", "lobby", "exit_screen", "gameover", "gameover_lost_race", "busy"].includes(sr.phase)) {
        
        const curLang = optsRef.current.language;
        const curT = T[curLang];
        const isMobile=typeof window!=="undefined"&&window.innerWidth<768;
        
        if (sr.phase === "playing") {
          cam.rotation.y=sr.yaw; cam.rotation.x=sr.pitch;
          let touchMoveActive = false, touchNx = 0, touchNy = 0;
          if(touches.move){
            const tx = touches.move.cx - touches.move.sx, ty = touches.move.cy - touches.move.sy;
            const d = Math.sqrt(tx*tx + ty*ty); if(d > 12){ touchMoveActive = true; touchNx = tx/d; touchNy = ty/d; }
          }
          let isSprinting = sr.keys['ShiftLeft'] || sr.keys['ShiftRight'], maxSpeed = isSprinting ? 0.095 : 0.045, swayFactor = 0;
          if (sr.sanity <= 32) { maxSpeed = isSprinting ? 0.045 : 0.025; swayFactor = 0.02; }
          if (sr.sanity <= 16) { maxSpeed = isSprinting ? 0.025 : 0.015; swayFactor = 0.045; }
          fv.set(-Math.sin(sr.yaw),0,-Math.cos(sr.yaw)); rv.set(Math.cos(sr.yaw),0,-Math.sin(sr.yaw));
          let inputX = 0, inputY = 0;
          if(sr.keys['KeyW']||sr.keys['ArrowUp']) inputY += 1; if(sr.keys['KeyS']||sr.keys['ArrowDown']) inputY -= 0.75;
          if(sr.keys['KeyA']||sr.keys['ArrowLeft']) inputX -= 0.65; if(sr.keys['KeyD']||sr.keys['ArrowRight']) inputX += 0.65;
          if(touchMoveActive){ inputY -= touchNy * 1.0; inputX += touchNx * 0.75; }
          let isMovingInput = (Math.abs(inputX) > 0.01 || Math.abs(inputY) > 0.01);
          if(isMovingInput) { let dirLen = Math.sqrt(inputX*inputX + inputY*inputY); sr.lastDirX = inputX / dirLen; sr.lastDirY = inputY / dirLen; }
          let targetSpeed = isMovingInput ? maxSpeed : 0; sr.vel += (targetSpeed - sr.vel) * 0.15; let mv = sr.vel > 0.005;
          let dx = (fv.x * sr.lastDirY + rv.x * sr.lastDirX) * sr.vel, dz = (fv.z * sr.lastDirY + rv.z * sr.lastDirX) * sr.vel;

          let newX = cam.position.x + dx, newZ = cam.position.z + dz;
          const margin = 0.4; 
          
          const isValidPos = (px, pz) => {
              if (px >= -1.4 && px <= 1.4 && pz >= -53.5 && pz <= 1.8) return true;
              if (px >= -7.5 && px < -1.4 && pz >= -1.5 && pz <= 1.5) return true;
              if (px >= -7.5 && px < -1.4 && pz >= -53.5 && pz <= -50.5) return true;
              
              if (sr.activeAnomalies.some(a => a.id === "open_door" || a.id === "all_doors_open")) {
                  if (px > 1.4 && px <= 3.0 && pz >= -25.5 && pz <= -24.5) return true; 
              }
              if (sr.activeAnomalies.some(a => a.id === "all_doors_open")) {
                  if (px < -1.4 && px >= -3.0 && pz >= -8.5 && pz <= -7.5) return true; 
                  if (px > 1.4 && px <= 3.0 && pz >= -20.5 && pz <= -19.5) return true; 
                  if (px < -1.4 && px >= -3.0 && pz >= -34.5 && pz <= -33.5) return true; 
                  if (px > 1.4 && px <= 3.0 && pz >= -47.5 && pz <= -46.5) return true; 
              }
              
              return false;
          };

          const isObstacle = (px, pz) => {
              if (sr.hasRzepa && !sr.rzepaFound && R.current.rzepaM && R.current.rzepaM.visible) {
                  if (Math.hypot(px - 0, pz - (-8)) < 0.6) return true;
              }
              if ((R.current.tvN && R.current.tvN.visible) || R.current.tvA?.visible || R.current.tvS?.visible || R.current.tvNoise?.visible) {
                  if (px < -0.8 && pz > -20.8 && pz < -19.2) return true;
              }
              if (R.current.sN && (R.current.sN.visible || R.current.sK?.visible || R.current.sR?.visible)) {
                  if (Math.hypot(px - R.current.sN.position.x, pz - R.current.sN.position.z) < 0.6) return true;
              }
              if (R.current.ao?.ufoMonument?.visible) {
                  if (px < -0.8 && pz > -42 && pz < -40) return true;
              }
              if (R.current.jarsN?.visible || R.current.jarsA?.visible) {
                  if (px > 0.8 && pz > -51.5 && pz < -49.5) return true;
              }
              if (R.current.fernN?.visible || R.current.fernA?.visible) {
                  if (px < -1.0 && pz > -50 && pz < -48) return true;
              }
              return false;
          };

          if (!isValidPos(newX, cam.position.z) || isObstacle(newX, cam.position.z)) newX = cam.position.x;
          if (!isValidPos(cam.position.x, newZ) || isObstacle(cam.position.x, newZ)) newZ = cam.position.z;
          
          cam.position.x = newX;
          cam.position.z = newZ;

          if (cam.position.x < -4.5 && !sr.decided && !sr.tunnelLock) { 
              sr.tunnelLock = true; 
              if (cam.position.z < -26) decide("exit"); 
              else decide("back"); 
          }
          if (cam.position.x > -2.0) sr.tunnelLock = false;

          if (mv) bob += (sr.vel * 2.0); 
          let hitShakeY = 0, hitShakeRot = 0;
          if (sr.lastTvHit && Date.now() - sr.lastTvHit < 400) {
              const intensity = (400 - (Date.now() - sr.lastTvHit)) / 400; hitShakeY = (Math.random() - 0.5) * 0.15 * intensity; hitShakeRot = (Math.random() - 0.5) * 0.1 * intensity;
          } else if (sr.lastTvHit) { sr.lastTvHit = 0; }
          cam.position.y = 1.52 + (mv ? Math.sin(bob) * 0.045 : 0) + hitShakeY;
          cam.rotation.z = (mv ? Math.cos(bob * 0.5) * swayFactor : 0) + hitShakeRot;
          cam.rotation.x = sr.pitch + hitShakeRot;
          const sanityFactor = (100 - sr.sanity) / 100;
          let tunnelDarkness = cam.position.x < -1.5 ? Math.min(1, (-cam.position.x - 1.5) / 2.0) : 0;
          scene.fog.density = 0.055 + (sanityFactor * 0.015) + (tunnelDarkness * 1.5); 
          const fogLuma = 3 * (1 - tunnelDarkness); scene.fog.color.setRGB(fogLuma/255, fogLuma/255, fogLuma/255);
          
          const sa = R.current.audio?.steps;
          if(sa){
            let pbRate = isSprinting ? 1.2 : 0.8; if (sr.sanity <= 32) pbRate -= 0.3;
            if (mv && sa.paused){ sa.playbackRate = pbRate; sa.currentTime=0; sa.play().catch(()=>{}); }
            else if (!mv && !sa.paused){ sa.pause(); }
          }

          if (R.current.ao?.cat?.visible) {
              const distToCat = cam.position.distanceTo(R.current.ao.cat.position);
              if (distToCat < 2.5) {
                  if (sr._lastCatPrompt !== "1") { sr._lastCatPrompt = "1"; up({catPrompt: isMobile ? curT.catPromptMobile : curT.catPrompt}); }
                  if (sr.keys['KeyE'] && !sr.familiadaActive) {
                      sr.keys['KeyE'] = false; 
                      if (R.current.audio?.meow && !optsRef.current.muteSounds) {
                          R.current.audio.meow.currentTime = 0;
                          R.current.audio.meow.play().catch(()=>{});
                      }
                      sr.catPulse = 1.0; 
                      up({catMessage: sr.hasAnomaly ? curT.catAnomaly : curT.catNormal});
                      setTimeout(() => up({catMessage: ""}), 4000); 
                  }
              } else { if (sr._lastCatPrompt !== "0") { sr._lastCatPrompt = "0"; up({catPrompt: ""}); } }
          }
          
          if (sr.catPulse > 0) {
              sr.catPulse -= 0.05;
              const scaleVal = 1.0 + Math.sin(sr.catPulse * Math.PI) * 0.25;
              if (R.current.ao?.cat) R.current.ao.cat.scale.set(scaleVal, scaleVal, scaleVal);
          } else if (R.current.ao?.cat) {
              R.current.ao.cat.scale.set(1, 1, 1);
          }

          const distToTv = Math.sqrt(Math.pow(cam.position.x - R.current.tvN.position.x, 2) + Math.pow(cam.position.z - R.current.tvN.position.z, 2));
          if (distToTv < 2.5) {
              if (!sr._lastTVPrompt) { sr._lastTVPrompt = true; up({tvPrompt: true}); }
              if(sr.keys['KeyE']) {
                  sr.keys['KeyE'] = false; sr.lastTvHit = Date.now();
                  if (R.current.audio?.punch && !optsRef.current.muteSounds) {
                      R.current.audio.punch.currentTime = 0;
                      R.current.audio.punch.play().catch(()=>{});
                  }
                  up({ tvPrompt: false }); sr._lastTVPrompt = false; setOpts(prev => ({...prev, vhs: !prev.vhs}));
              }
          } else { if (sr._lastTVPrompt) { sr._lastTVPrompt = false; up({tvPrompt: false}); } }

          if (sr.activeAnomalies.some(a => a.id === "red_lights")) {
              let progress = Math.max(0, Math.min(1, (cam.position.z - 0) / -35)); 
              const lStart = new THREE.Color(0xFFEAA0), lTarget = new THREE.Color(0xff0000);
              const mStart = new THREE.Color(0xFFFFF0), mTarget = new THREE.Color(0xff0000);
              lStart.lerp(lTarget, progress); mStart.lerp(mTarget, progress);
              R.current.lights.forEach(l => { if(l.visible) l.color.copy(lStart); });
              R.current.lamps.forEach(l => { if(l.visible) l.material.emissive.copy(mStart); });
          }

          const isRadiatorAnomaly = sr.activeAnomalies.some(a => a.id === "radiator_tap");
          const radPos = R.current.rad ? R.current.rad.position : new THREE.Vector3(0,0,0);
          const distToRad = Math.sqrt(Math.pow(cam.position.x - radPos.x, 2) + Math.pow(cam.position.z - radPos.z, 2));
          
          if (isRadiatorAnomaly && distToRad < 4.0) { 
              if (!sr.hasTappedRadiator) { 
                  if (R.current.audio?.radiator && R.current.audio.radiator.paused && !optsRef.current.muteSounds) {
                      R.current.audio.radiator.play().catch(()=>{});
                  }
              } else {
                  if (R.current.audio?.radiator && !R.current.audio.radiator.paused) {
                      R.current.audio.radiator.pause();
                  }
              }
          } else {
              if (R.current.audio?.radiator && !R.current.audio.radiator.paused) {
                  R.current.audio.radiator.pause();
              }
          }
          
          if (distToRad < 2.5 && isRadiatorAnomaly) {
              if (sr._lastRadPrompt !== "1") {
                  sr._lastRadPrompt = "1";
                  up({radPrompt: isMobile ? curT.radPromptMobile : curT.radPrompt});
              }
              if (sr.keys['KeyE']) {
                  sr.keys['KeyE'] = false;
                  if (R.current.audio?.punch && !optsRef.current.muteSounds) {
                      R.current.audio.punch.currentTime = 0;
                      R.current.audio.punch.play().catch(()=>{});
                      setTimeout(() => {
                          if (R.current.audio?.punch) {
                              R.current.audio.punch.currentTime = 0;
                              R.current.audio.punch.play().catch(()=>{});
                          }
                      }, 200);
                  }
                  if (!sr.hasTappedRadiator) {
                      sr.hasTappedRadiator = true;
                      sr.sanity = Math.min(100, sr.sanity + 5);
                      up({ radMessage: curT.radMessage, sanity: sr.sanity });
                      setTimeout(() => up({radMessage: ""}), 3000);
                  }
              }
          } else {
              if (sr._lastRadPrompt !== "0") {
                  sr._lastRadPrompt = "0";
                  up({radPrompt: ""});
              }
          }

          if (sr.phase === "gameover_check") { if (sr.sanity <= 0) { sr.phase = "gameover"; up({ phase: "gameover", sanity: sr.sanity, exitCount: sr.exitCount, streak: sr.streak, steps: stepCount.current }); } else sr.phase = "playing"; }
          
          if (R.current.ao?.sR?.visible) {
              const sR = R.current.ao.sR;
              if (sR.position.z < cam.position.z) sR.position.z += 0.2; 
              else if (sR.position.z > cam.position.z) sR.position.z -= 0.2;
              
              const distToStroller = cam.position.distanceTo(sR.position);
              if (distToStroller < 1.8) {
                  const now = Date.now();
                  if (now - sr.lastHitTime > 1000) {
                      sr.lastHitTime = now; 
                      sr.sanity = Math.max(0, sr.sanity - 25); 
                      up({ sanity: sr.sanity, message: curT.strollerAttack });
                      setTimeout(() => up(p => p.message === curT.strollerAttack ? {...p, message:""} : p), 1000); 
                      sr.pitch = Math.min(0.52, sr.pitch + 0.3);
                      if (R.current.audio?.punch && !optsRef.current.muteSounds) {
                          R.current.audio.punch.currentTime = 0;
                          R.current.audio.punch.play().catch(()=>{});
                      }
                      if (sr.sanity <= 0) { sr.phase = "gameover_check"; }
                  }
              }
          }
          if (R.current.ao?.peephole_eye?.visible) { R.current.ao.peephole_eye.scale.y = Math.sin(Date.now() * 0.005) > 0.8 ? 0.1 : 1; R.current.ao.peephole_glow.intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.4; }
          
          if (sr.activeAnomalies.some(a => a.id === "meter_crazy") && R.current.meterObj) {
              R.current.meterObj.disc.rotation.y += 0.5; 
              R.current.meterObj.sparks.intensity = Math.random() > 0.5 ? Math.random() * 5 : 0;
          } else if (R.current.meterObj) {
              R.current.meterObj.disc.rotation.y += 0.01; 
              R.current.meterObj.sparks.intensity = 0;
          }

          if (sr.activeAnomalies.some(a => a.id === "vent_eyes") && R.current.smokeParts) {
              R.current.smokeParts.forEach(p => {
                  p.position.y -= p.userData.speed;
                  p.scale.setScalar(1.0 + Math.sin(Date.now()*0.005 + p.userData.phase)*0.5);
                  if (p.position.y < -3) p.position.y = 0.2; 
              });
          }
        }

        if(R.current.rzepaM){
          const rm = R.current.rzepaM;
          if(sr.hasRzepa && !sr.rzepaFound && sr.phase === "playing"){
            if(!rm.visible) rm.visible = true; rm.rotation.y += .015; rm.position.y = 0.5 + Math.sin(Date.now()*.002)*.08;
            const dist = Math.sqrt(Math.pow(cam.position.x - rm.position.x, 2) + Math.pow(cam.position.z - rm.position.z, 2));
            const shouldShowHint = dist < 2.5; if(shouldShowHint !== sr._lastRzepaHint) { sr._lastRzepaHint = shouldShowHint; up({rzepaHint: shouldShowHint}); }
            if(dist < 2.5 && sr.keys['KeyE'] && !sr.familiadaActive){
              sr.rzepaFound = true; rm.visible = false; sr.keys['KeyE'] = false; sr.familiadaActive = true; sr._lastRzepaHint = false; sr.vel = 0; 
              const currentQList = getFamiliadaQ(optsRef.current.language);
              up({ rzepaHint: false, tvPrompt: false, familiada: { active: true, qId: Math.floor(Math.random()*currentQList.length), step: 'question', points: 0, ansText: "" } });
            }
          } else { if(rm.visible) rm.visible = false; if(sr._lastRzepaHint) { sr._lastRzepaHint = false; up({rzepaHint: false}); } }
        }
        
        if(++flickT%185===0&&Math.random()<.28){
          const li=Math.floor(Math.random()*lights.length);
          if(lights[li].visible&&lights[li].intensity>.5){
            lights[li].intensity=.04; lamps[li].material.emissiveIntensity=.1;
            setTimeout(()=>{lights[li].intensity=1.0;lamps[li].material.emissiveIntensity=3;},38+Math.random()*55);
          }
        }
        if(R.current.flame){flameT+=.08;R.current.flame.intensity=.4+Math.sin(flameT)*Math.sin(flameT*1.7)*.15;}
        
        renderer.render(scene,cam);
      }
    }
    animate();

    const onResize=()=>{cam.aspect=mount.clientWidth/mount.clientHeight;cam.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight);};
    window.addEventListener("resize",onResize);

    return()=>{
      cancelAnimationFrame(animId); window.removeEventListener("resize",onResize);
      window.removeEventListener("keydown",onKD); window.removeEventListener("keyup",onKU);
      window.removeEventListener("mousemove",onMM); window.removeEventListener("mouseup",onMU);
      if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement); renderer.dispose();
    };
  },[]); 

  const submitFamiliada = () => {
      if(!famInput.trim()) return;
      const sr = S.current; const textVal = famInput.trim().toLowerCase(); 
      const currentQList = getFamiliadaQ(optsRef.current.language);
      const q = currentQList[ui.familiada.qId];
      const foundAnswer = q.a.find(ans => ans.t.toLowerCase() === textVal);
      let pts = foundAnswer ? foundAnswer.p : 0;
      
      if (pts > 0) {
          sr.sanity = Math.min(100, sr.sanity + pts);
          if (R.current.audio && !optsRef.current.muteSounds) { R.current.audio.applause.currentTime = 0; R.current.audio.applause.play().catch(()=>{}); }
      } else {
          sr.sanity = Math.max(0, sr.sanity - 15);
          if (R.current.audio && !optsRef.current.muteSounds) { R.current.audio.fail.currentTime = 0; R.current.audio.fail.play().catch(()=>{}); }
      }

      setUi(prev => ({ ...prev, sanity: sr.sanity, familiada: { ...prev.familiada, step: 'result', points: pts, ansText: foundAnswer ? foundAnswer.t : textVal } }));
      setFamInput(""); 
      setTimeout(() => { 
          sr.familiadaActive = false; 
          setUi(prev => ({ ...prev, familiada: { active: false, qId: 0, step: 'none', points: 0, ansText: "" } })); 
          if(sr.sanity <= 0) { sr.phase = "gameover_check"; }
      }, 4000);
  };

  const startActualGame = (isMultiplayer, serverData = null) => {
      const sr = S.current;
      sr.phase = "busy";

      if (isMultiplayer && serverData) {
          isMpModeRef.current = true;
          sr.mpData = serverData;
          sr.mpStep = 0;
          sr.baseSetup = serverData.baseSetup;
      } else {
          isMpModeRef.current = false;
          sr.baseSetup = {
              bikeSide: optsRef.current.randomBase ? (Math.random() > 0.5 ? 1 : -1) : 1,
              strollerSide: optsRef.current.randomBase ? (Math.random() > 0.5 ? 1 : -1) : 1,
              messSide: optsRef.current.randomBase ? (Math.random() > 0.5 ? 1 : -1) : 1,
              paintingSide: optsRef.current.randomBase ? (Math.random() > 0.5 ? 1 : -1) : 1,
          };
      }

      sr.exitCount = 0; sr.streak = 0; sr.sanity = 100; sr.seenAnomalies = [];
      if(R.current.fadeMat) R.current.fadeMat.opacity = 1;
      if(R.current.cam) { R.current.cam.position.set(0, 1.52, 1.5); sr.yaw=0; sr.pitch=0; }
      
      R.current.gen?.();
      setUi(p=>({...p, phase:"playing", exitCount:0, streak:0, sanity:100, oppMessage:""}));

      let t0 = performance.now();
      const fadeIn = setInterval(() => {
          const e = performance.now() - t0;
          if(R.current.fadeMat) R.current.fadeMat.opacity = Math.max(0, 1 - e/400);
          if (e >= 400) { clearInterval(fadeIn); sr.phase = "playing"; sr.tunnelLock = false;}
      }, 14);
  }

  // ─── LOGIKA MULTIPLAYERA (SOCKET.IO) ───
  const initSocket = () => {
      if (!socketRef.current) {
          socketRef.current = io("https://polex-server.onrender.com/"); 

          socketRef.current.on("connect", () => {
              setMpState(p => ({...p, isConnected: true, error: ""}));
          });
          
          socketRef.current.on("connect_error", (err) => {
              setMpState(p => ({...p, isConnected: false, error: "Connection error!"}));
          });
          
          socketRef.current.on("disconnect", () => {
              setMpState(p => ({...p, isConnected: false}));
          });

          socketRef.current.on("room_update", (roomData) => {
              setMpState(p => ({...p, currentRoom: roomData, error: ""}));
              S.current.phase = "lobby";
              up({ phase: "lobby" });
          });

          socketRef.current.on("room_error", (err) => {
              setMpState(p => ({...p, error: err}));
          });

          socketRef.current.on("game_started", (data) => {
              startActualGame(true, data);
          });

          socketRef.current.on("progress_updated", (data) => {
              setMpState(p => {
                  const newProg = {...p.opponentsProgress};
                  newProg[data.id] = { name: data.name, progress: data.progress };
                  return {...p, opponentsProgress: newProg};
              });
          });

          socketRef.current.on("game_over_winner", (winnerName) => {
              S.current.phase = "gameover_lost_race";
              up({ phase: "gameover_lost_race", oppMessage: winnerName });
          });
          
          socketRef.current.on("player_left", (playerName) => {
              const currentLang = optsRef.current.language;
              up({ oppMessage: T[currentLang].playerLeft });
              setTimeout(() => up(p => ({...p, oppMessage: ""})), 4000);
          });
      }
  }

  const goToMpMenu = () => {
      initSocket();
      S.current.phase = "mp_menu";
      up({phase: "mp_menu"});
  }

  const createRoom = () => {
      if(mpState.playerName.trim() === "" || !mpState.isConnected) return;
      socketRef.current.emit("create_room", mpState.playerName);
  }

  const joinRoom = () => {
      if(mpState.playerName.trim() === "" || mpState.roomCodeInput.trim().length !== 4 || !mpState.isConnected) return;
      socketRef.current.emit("join_room", { code: mpState.roomCodeInput, playerName: mpState.playerName });
  }

  const startMultiplayerGame = () => {
      socketRef.current.emit("start_game");
  }

  const disconnectAndReturn = () => {
      if(socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
      }
      setMpState(p => ({...p, currentRoom: null, opponentsProgress: {}, isConnected: false}));
      S.current.phase = "menu";
      up({phase: "menu"});
  }

  const restart=()=>{
    const sr=S.current; Object.assign(sr,{phase:"menu",hasAnomaly:false,anomaly:null,exitCount:0,streak:0,sanity:100,yaw:0,pitch:0,keys:{},decided:false,tunnelLock:false,_lastCatPrompt:"0",_lastRzepaHint:false,hasRzepa:false,rzepaFound:false,familiadaActive:false,vel:0,lastDirX:0,lastDirY:0,flashlightOn:false,lastHitTime:0,lastTvHit:0,hasTappedRadiator:false,_lastRadPrompt:"0",catPulse:0,seenAnomalies:[]});
    stepCount.current=0; if(R.current.cam)R.current.cam.position.set(0,1.52,1.5); 
    disconnectAndReturn();
    if(R.current.fadeMat) R.current.fadeMat.opacity = 0; 
    if(R.current.flashlight) R.current.flashlight.intensity = 0;
    setUi({phase:"menu",exitCount:0,streak:0,sanity:100,message:"",hint:false, hintText:"", steps:0, anomaly:null,hasAnomaly:false,rzepaHint:false,catPrompt:"",catMessage:"", tvPrompt: false, showHelp: false, oppMessage: "", radPrompt: "", radMessage: "", familiada: { active: false, qId: 0, step: 'none', points: 0, ansText: "" }});
    setFamInput("");
  };

  const {phase,exitCount,streak,sanity,message,hint, hintText, steps,hasAnomaly,catPrompt,catMessage, tvPrompt, radPrompt, radMessage, familiada, showHelp, oppMessage}=ui;
  const isMobile=typeof window!=="undefined"&&window.innerWidth<768;
  const btnStyle = { padding:"15px", background:"transparent", border:"2px solid #d8b860", color:"#d8b860", fontSize:"18px", fontWeight:"bold", cursor:"pointer", transition:"0.2s", width: "100%", textAlign: "center" };

  return(
    <div style={{width:"100%",height:"100vh",background:"#000",overflow:"hidden",position:"relative",fontFamily:"'Courier New',monospace",userSelect:"none",touchAction:"none"}}>
      <div ref={mountRef} style={{width:"100%",height:"100%",cursor:"crosshair", position:"absolute", zIndex: 1}}/>

      <style>
        {`
          @keyframes vhs-anim { 0% { background-position: 0 0; } 100% { background-position: 0 10px; } }
          @keyframes pulse-anim { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
          .fam-board { background-color: #1a1a1a; background-image: linear-gradient(rgba(0,0,0,0.8) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,0.8) 2px, transparent 2px); background-size: 14px 24px; border: 6px solid #333; border-radius: 8px; padding: 20px; box-shadow: inset 0 0 40px #000; width: 100%; margin-bottom: 20px; }
          .fam-text { font-family: 'Courier New', monospace; color: #a8cc14; text-shadow: 0 0 6px rgba(168,204,20,0.8); font-weight: bold; font-size: 22px; text-transform: uppercase; letter-spacing: 4px; }
          .opt-section { color: #d8b860; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 15px; font-weight: bold; width: 100%; text-align: left; text-transform: uppercase;}
        `}
      </style>

      {opts.vhs && phase !== "exit_screen" && phase !== "win" && phase !== "gameover" && phase !== "gameover_lost_race" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none", mixBlendMode: "overlay", opacity: (ui.anomaly && ui.anomaly.id === "fake_tv_button" && ui.message) ? 1.0 : 0.8, background: "repeating-linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0) 3px, rgba(0,0,0,0.8) 3px, rgba(0,0,0,0.8) 6px)", animation: "vhs-anim 0.15s linear infinite" }}/>
      )}

      {/* MENU GŁÓWNE */}
      {phase==="menu" && (
          <div style={{position:"absolute", inset:0, zIndex: 100, background:"rgba(0,0,0,0.8)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
              <h1 style={{color:"#d8b860", fontSize: isMobile ? "32px" : "64px", textShadow:"0 0 20px rgba(216,184,96,0.6)", marginBottom:"10px", textAlign:"center"}}>{t.title}</h1>
              <p style={{color:"#888", fontSize:"14px", marginBottom:"50px", letterSpacing:"3px"}}>{t.subtitle}</p>
              <div style={{display:"flex", flexDirection:"column", gap:"20px", width: "200px"}}>
                  <button onClick={() => startActualGame(false)} style={btnStyle}>{t.startSolo}</button>
                  <button onClick={goToMpMenu} style={{...btnStyle, borderColor:"#a86020", color:"#a86020"}}>{t.multiplayer}</button>
                  <button onClick={()=>setUi(p=>({...p, phase:"options"}))} style={{...btnStyle, borderColor:"#555", color:"#aaa"}}>{t.options}</button>
                  <button onClick={()=>setUi(p=>({...p, phase:"exit_screen"}))} style={{...btnStyle, borderColor:"#802020", color:"#802020"}}>{t.exit}</button>
              </div>
              <div style={{position:"absolute", bottom: 20, color:"#444", fontSize:"10px"}}>{t.musicMenu}</div>
          </div>
      )}

      {/* EKRAN WYJŚCIA */}
      {phase==="exit_screen" && (
          <div style={{position:"absolute", inset:0, zIndex: 200, background:"#000", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
              <h1 style={{color:"#d8b860", fontSize:"48px", marginBottom:"20px", textAlign:"center"}}>{t.exitScreenTitle}</h1>
              <p style={{color:"#888", fontSize:"18px", marginBottom:"40px", textAlign:"center"}}>{t.exitScreenDesc}</p>
              <button onClick={() => { if(window.close) window.close(); setUi(p=>({...p, phase:"menu"})); }} style={{...btnStyle, width:"300px"}}>{t.backToMenu}</button>
          </div>
      )}

      {/* MENU MULTIPLAYER (Tworzenie i Dołączanie) */}
      {phase==="mp_menu" && (
          <div style={{position:"absolute", inset:0, zIndex: 100, background:"rgba(0,0,0,0.9)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
              <h2 style={{color:"#d8b860", fontSize:"32px", marginBottom:"10px", textShadow:"0 0 10px rgba(216,184,96,0.5)", textAlign:"center"}}>{t.mpTitle}</h2>
              
              {!mpState.isConnected ? (
                  <div style={{color:"#ff4444", marginBottom:"20px", fontSize:"14px", animation: "pulse-anim 1.5s infinite"}}>{t.connecting}</div>
              ) : (
                  <div style={{color:"#4CAF50", marginBottom:"20px", fontSize:"14px"}}>{t.connected}</div>
              )}

              {mpState.error && <div style={{color:"#ff4444", marginBottom:"15px", background:"rgba(255,0,0,0.1)", padding:"10px", borderRadius:"4px", border:"1px solid #ff4444"}}>{mpState.error}</div>}
              
              <div style={{marginBottom:"40px", textAlign:"center"}}>
                  <div style={{color:"#aaa", fontSize:"14px", marginBottom:"10px"}}>{t.nickLabel}</div>
                  <input value={mpState.playerName} onChange={e=>setMpState(p=>({...p, playerName: e.target.value.substring(0,12)}))} style={{background:"#111", border:"1px solid #d8b860", color:"#fff", padding:"10px", textAlign:"center", fontSize:"18px", width:"220px", borderRadius:"4px", outline:"none"}} />
              </div>

              <div style={{display:"flex", flexDirection: isMobile ? "column" : "row", gap:"30px"}}>
                  <div style={{border:"1px solid #333", padding:"30px", display:"flex", flexDirection:"column", alignItems:"center", width:"260px", borderRadius:"8px", background:"#0a0a0a"}}>
                      <div style={{color:"#fff", marginBottom:"20px", fontSize:"18px", letterSpacing:"2px"}}>{t.newGame}</div>
                      <button onClick={createRoom} disabled={!mpState.isConnected} style={{...btnStyle, width:"100%", opacity: mpState.isConnected ? 1 : 0.5}}>{t.createRoom}</button>
                  </div>
                  <div style={{border:"1px solid #333", padding:"30px", display:"flex", flexDirection:"column", alignItems:"center", width:"260px", borderRadius:"8px", background:"#0a0a0a"}}>
                      <div style={{color:"#fff", marginBottom:"20px", fontSize:"18px", letterSpacing:"2px"}}>{t.joinGame}</div>
                      <input placeholder={t.roomCodePlaceholder} value={mpState.roomCodeInput} onChange={e=>setMpState(p=>({...p, roomCodeInput: e.target.value.toUpperCase().substring(0,4)}))} style={{background:"#111", border:"1px solid #555", color:"#d8b860", padding:"10px", textAlign:"center", fontSize:"22px", width:"100%", marginBottom:"15px", letterSpacing:"10px", borderRadius:"4px", outline:"none", textTransform:"uppercase"}} />
                      <button onClick={joinRoom} disabled={!mpState.isConnected} style={{...btnStyle, borderColor:"#555", color:"#aaa", width:"100%", opacity: mpState.isConnected ? 1 : 0.5}}>{t.join}</button>
                  </div>
              </div>
              <button onClick={disconnectAndReturn} style={{...btnStyle, width:"200px", marginTop:"40px", borderColor:"#555", color:"#aaa"}}>{t.backToMenu}</button>
          </div>
      )}

      {/* LOBBY POKOJU */}
      {phase==="lobby" && mpState.currentRoom && (
          <div style={{position:"absolute", inset:0, zIndex: 100, background:"rgba(0,0,0,0.9)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
              <h2 style={{color:"#fff", fontSize:"24px", marginBottom:"20px"}}>{t.room} <span style={{color:"#d8b860", fontSize:"48px", letterSpacing:"5px"}}>{mpState.currentRoom.id}</span></h2>
              <div style={{color:"#888", fontSize:"12px", marginBottom:"30px", textAlign:"center"}}>{t.shareCode}</div>
              
              <div style={{border:"1px solid #333", padding:"20px", width:"300px", marginBottom:"40px", background:"#0a0a0a", borderRadius:"8px"}}>
                  <div style={{color:"#aaa", borderBottom:"1px solid #333", paddingBottom:"10px", marginBottom:"15px", display:"flex", justifyContent:"space-between"}}>
                      <span>{t.playersInRoom}</span>
                      <span>{mpState.currentRoom.players.length}/4</span>
                  </div>
                  {mpState.currentRoom.players.map((p, idx) => (
                      <div key={p.id} style={{color: p.id === socketRef.current?.id ? "#d8b860" : "#fff", fontSize:"18px", padding:"8px 0", display:"flex", alignItems:"center"}}>
                          <span style={{marginRight:"10px", color:"#555"}}>{idx + 1}.</span> 
                          {p.name} {p.id === socketRef.current?.id ? '(Ty/You)' : ''}
                          {p.id === mpState.currentRoom.host && <span style={{fontSize:"10px", color:"#a86020", border:"1px solid #a86020", padding:"2px 5px", borderRadius:"3px", marginLeft:"auto"}}>{t.host}</span>}
                      </div>
                  ))}
              </div>

              {mpState.currentRoom.host === socketRef.current?.id ? (
                  <button onClick={startMultiplayerGame} style={{...btnStyle, width:"300px"}}>{t.startGameOnline}</button>
              ) : (
                  <div style={{color:"#d8b860", fontSize:"18px", animation: "pulse-anim 1.5s infinite", padding:"15px", textAlign:"center"}}>{t.waitingHost}</div>
              )}
              
              <button onClick={disconnectAndReturn} style={{...btnStyle, width:"300px", marginTop:"20px", borderColor:"#a82020", color:"#a82020"}}>{t.leaveRoom}</button>
          </div>
      )}

      {/* OPCJE Z MENU GŁÓWNEGO */}
      {phase==="options" && (
          <div style={{position:"absolute", inset:0, zIndex: 100, background:"rgba(10,10,10,0.95)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflowY:"auto", padding: "40px 0"}}>
              <h2 style={{color:"#d8b860", fontSize:"32px", marginBottom:"30px"}}>{t.options}</h2>
              <div style={{display:"flex", flexDirection:"column", gap:"15px", width: "350px", marginBottom: "40px"}}>
                  
                  <div className="opt-section">{t.gameplaySolo}</div>
                  <label style={{color:"#fff", fontSize:"14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer"}}>
                      {t.randomBase}
                      <input type="checkbox" checked={opts.randomBase} onChange={(e)=>setOpts(p=>({...p, randomBase: e.target.checked}))} style={{transform:"scale(1.5)"}}/>
                  </label>
                  <label style={{color:"#fff", fontSize:"14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer"}}>
                      {t.hardcoreMode}
                      <input type="checkbox" checked={opts.hardcore} onChange={(e)=>setOpts(p=>({...p, hardcore: e.target.checked}))} style={{transform:"scale(1.5)"}}/>
                  </label>
                  <label style={{color:"#fff", fontSize:"14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer"}}>
                      {t.roguelikeMode}
                      <input type="checkbox" checked={opts.endless} onChange={(e)=>setOpts(p=>({...p, endless: e.target.checked}))} style={{transform:"scale(1.5)"}}/>
                  </label>

                  <div className="opt-section" style={{marginTop: "15px"}}>{t.audioVideo}</div>
                  
                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginBottom:"15px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.language}</span>
                      </label>
                      <div style={{display:"flex", gap:"10px"}}>
                          <button onClick={()=>setOpts(p=>({...p, language:"pl"}))} style={{...btnStyle, padding:"8px", fontSize:"14px", borderColor: opts.language==="pl"?"#d8b860":"#555", color: opts.language==="pl"?"#d8b860":"#555"}}>POLSKI</button>
                          <button onClick={()=>setOpts(p=>({...p, language:"en"}))} style={{...btnStyle, padding:"8px", fontSize:"14px", borderColor: opts.language==="en"?"#d8b860":"#555", color: opts.language==="en"?"#d8b860":"#555"}}>ENGLISH</button>
                      </div>
                  </div>

                  <label style={{color:"#fff", fontSize:"14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", marginBottom: "15px"}}>
                      {t.vhsEffect} <input type="checkbox" checked={opts.vhs} onChange={(e)=>setOpts(p=>({...p, vhs: e.target.checked}))} style={{transform:"scale(1.5)"}}/>
                  </label>
                  
                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginTop:"10px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.musicVol} {Math.round(opts.musicVol * 100)}%</span>
                          <input type="checkbox" checked={opts.muteMusic} onChange={(e)=>setOpts(p=>({...p, muteMusic: e.target.checked}))}/>
                      </label>
                      <input type="range" min="0" max="1" step="0.05" value={opts.musicVol} onChange={(e)=>setOpts(p=>({...p, musicVol: parseFloat(e.target.value)}))} disabled={opts.muteMusic} style={{cursor:"pointer"}}/>
                  </div>

                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginTop:"15px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.ambVol} {Math.round(opts.ambVol * 100)}%</span>
                          <input type="checkbox" checked={opts.muteSounds} onChange={(e)=>setOpts(p=>({...p, muteSounds: e.target.checked}))}/>
                      </label>
                      <input type="range" min="0" max="1" step="0.05" value={opts.ambVol} onChange={(e)=>setOpts(p=>({...p, ambVol: parseFloat(e.target.value)}))} disabled={opts.muteSounds} style={{cursor:"pointer"}}/>
                  </div>

                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginTop:"15px", marginBottom:"15px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.stepsVol} {Math.round(opts.stepsVol * 100)}%</span>
                      </label>
                      <input type="range" min="0" max="1" step="0.05" value={opts.stepsVol} onChange={(e)=>setOpts(p=>({...p, stepsVol: parseFloat(e.target.value)}))} disabled={opts.muteSounds} style={{cursor:"pointer"}}/>
                  </div>
              </div>
              <button onClick={()=>setUi(p=>({...p, phase:"menu"}))} style={{...btnStyle, width:"200px"}}>{t.back}</button>
          </div>
      )}

      {/* MENU PAUZY */}
      {phase==="paused" && (
          <div style={{position:"absolute", inset:0, zIndex: 100, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
              <h2 style={{color:"#d8b860", fontSize:"48px", marginBottom:"40px", textShadow:"0 0 20px rgba(216,184,96,0.6)"}}>{t.paused}</h2>
              <div style={{display:"flex", flexDirection:"column", gap:"20px", width: "250px"}}>
                  <button onClick={() => { S.current.phase = "playing"; setUi(p=>({...p, phase:"playing"})); }} style={btnStyle}>{t.resume}</button>
                  <button onClick={() => setUi(p=>({...p, phase:"paused_options"}))} style={{...btnStyle, borderColor:"#555", color:"#aaa"}}>{t.options}</button>
                  <button onClick={restart} style={{...btnStyle, borderColor:"#a82020", color:"#a82020"}}>{t.exitToMenu}</button>
              </div>
          </div>
      )}

      {/* OPCJE Z POZIOMU PAUZY */}
      {phase==="paused_options" && (
          <div style={{position:"absolute", inset:0, zIndex: 100, background:"rgba(10,10,10,0.95)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflowY:"auto", padding: "40px 0"}}>
              <h2 style={{color:"#d8b860", fontSize:"32px", marginBottom:"30px"}}>{t.options}</h2>
              <div style={{display:"flex", flexDirection:"column", gap:"15px", width: "350px", marginBottom: "40px"}}>
                  <div className="opt-section" style={{marginTop: "15px"}}>{t.audioVideo}</div>
                  
                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginBottom:"15px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.language}</span>
                      </label>
                      <div style={{display:"flex", gap:"10px"}}>
                          <button onClick={()=>setOpts(p=>({...p, language:"pl"}))} style={{...btnStyle, padding:"8px", fontSize:"14px", borderColor: opts.language==="pl"?"#d8b860":"#555", color: opts.language==="pl"?"#d8b860":"#555"}}>POLSKI</button>
                          <button onClick={()=>setOpts(p=>({...p, language:"en"}))} style={{...btnStyle, padding:"8px", fontSize:"14px", borderColor: opts.language==="en"?"#d8b860":"#555", color: opts.language==="en"?"#d8b860":"#555"}}>ENGLISH</button>
                      </div>
                  </div>

                  <label style={{color:"#fff", fontSize:"14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", marginBottom: "15px"}}>
                      {t.vhsEffect} <input type="checkbox" checked={opts.vhs} onChange={(e)=>setOpts(p=>({...p, vhs: e.target.checked}))} style={{transform:"scale(1.5)"}}/>
                  </label>
                  
                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginTop:"10px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.musicVol} {Math.round(opts.musicVol * 100)}%</span>
                          <input type="checkbox" checked={opts.muteMusic} onChange={(e)=>setOpts(p=>({...p, muteMusic: e.target.checked}))}/>
                      </label>
                      <input type="range" min="0" max="1" step="0.05" value={opts.musicVol} onChange={(e)=>setOpts(p=>({...p, musicVol: parseFloat(e.target.value)}))} disabled={opts.muteMusic} style={{cursor:"pointer"}}/>
                  </div>

                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginTop:"15px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.ambVol} {Math.round(opts.ambVol * 100)}%</span>
                          <input type="checkbox" checked={opts.muteSounds} onChange={(e)=>setOpts(p=>({...p, muteSounds: e.target.checked}))}/>
                      </label>
                      <input type="range" min="0" max="1" step="0.05" value={opts.ambVol} onChange={(e)=>setOpts(p=>({...p, ambVol: parseFloat(e.target.value)}))} disabled={opts.muteSounds} style={{cursor:"pointer"}}/>
                  </div>

                  <div style={{display:"flex", flexDirection:"column", gap:"5px", marginTop:"15px", marginBottom:"15px"}}>
                      <label style={{color:"#aaa", fontSize:"12px", display:"flex", justifyContent:"space-between"}}>
                          <span>{t.stepsVol} {Math.round(opts.stepsVol * 100)}%</span>
                      </label>
                      <input type="range" min="0" max="1" step="0.05" value={opts.stepsVol} onChange={(e)=>setOpts(p=>({...p, stepsVol: parseFloat(e.target.value)}))} disabled={opts.muteSounds} style={{cursor:"pointer"}}/>
                  </div>
              </div>
              <button onClick={()=>setUi(p=>({...p, phase:"paused"}))} style={{...btnStyle, width:"200px"}}>{t.back}</button>
          </div>
      )}

      {/* UI GRY */}
      {(phase==="playing" || phase==="paused" || phase==="paused_options") && <>
        {!isMobile && (
          <div style={{ position:"absolute", bottom:20, left:20, zIndex:50, background:"rgba(0,0,0,0.6)", border:"1px solid rgba(200,168,64,0.3)", color:"#aaa", padding:"10px 15px", borderRadius:"4px", fontSize:"11px", lineHeight:"1.6", pointerEvents:"none", whiteSpace:"pre-wrap" }}>
            {t.controlsHintPC}
          </div>
        )}
        <div style={{position:"absolute", zIndex: 50, top:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
          {opts.endless ? (
             <div style={{color:"#c8a840", fontSize:"14px", fontWeight:"bold"}}>{t.floor}{exitCount}</div>
          ) : (
             Array.from({length:8}).map((_,i)=>( <div key={i} style={{width:24,height:3,borderRadius:2,background:i<exitCount?"#c8a840":"#1c1408",boxShadow:i<exitCount?"0 0 7px #c8a84099":"none",transition:"background .35s"}}/> ))
          )}
        </div>
        <div style={{position:"absolute", zIndex: 50, top:12,left:12,display:"flex",flexDirection:"column",gap:4}}>
          <div style={{color:"#c8a840",fontSize:"10px",letterSpacing:"2px"}}>{t.sanity} {sanity}%</div>
          <div style={{width:120,height:5,background:"#1c1408",boxShadow:"inset 0 0 2px #000"}}>
            <div style={{width:`${sanity}%`,height:"100%",background:sanity>50?"#c8a840":sanity>32?"#c86020":"#a82020",transition:"all .4s ease-out"}}/>
          </div>
        </div>

        {/* HUD MULTIPLAYER (Wyniki) */}
        <div style={{position:"absolute", zIndex: 50, top:8,right:12,color:"#c8a840",fontSize:"10px",letterSpacing:"2px",textAlign:"right",lineHeight:"1.6"}}>
          <div>{isMpModeRef.current ? "TY: " : ""}{t.floor}{exitCount}{opts.endless ? "" : "/8"}</div>
          <div style={{color:"#444", marginBottom:"10px"}}>×{streak}</div>
          
          {isMpModeRef.current && mpState.currentRoom && (
              <div style={{background:"rgba(0,0,0,0.7)", border:"1px solid #333", padding:"8px", borderRadius:"4px", textAlign:"left"}}>
                  <div style={{color:"#888", fontSize:"9px", marginBottom:"5px", borderBottom:"1px solid #333", paddingBottom:"3px"}}>{t.playersInRoom}</div>
                  {mpState.currentRoom.players.filter(p => p.id !== socketRef.current?.id).map(p => (
                      <div key={p.id} style={{color:"#ff6666", fontSize:"11px", fontWeight:"bold", marginTop:"4px"}}>
                          {p.name}: {t.floor}{mpState.opponentsProgress[p.id]?.progress || 0}/8
                      </div>
                  ))}
              </div>
          )}
        </div>

        {isMobile&&<div style={{position:"absolute", zIndex: 50, bottom:40, left:20, width:80, height:80, borderRadius:"50%", border:"2px solid rgba(200,168,64,.2)", background:"rgba(0,0,0,.15)", display:"flex", alignItems:"center", justifyContent:"center"}}><div style={{color:"rgba(200,168,64,.3)",fontSize:"18px"}}>✛</div></div>}
        
        {/* Mobile MENU BUTTON */}
        {isMobile&&<div onClick={() => { S.current.phase = "paused"; up({ phase: "paused" }); if(R.current.audio && R.current.audio.steps) R.current.audio.steps.pause(); }} style={{ position:"absolute", top:45, left:12, width:40, height:40, borderRadius:"4px", border:"1px solid rgba(200,168,64,.5)", background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", userSelect:"none", zIndex:120, touchAction:"none", cursor:"pointer" }}>⚙️</div>}
        
        {/* Przycisk INTERAKCJA Mobile */}
        {isMobile&&<div onPointerDown={(e) => { e.preventDefault(); S.current.keys['KeyE'] = true; e.target.style.background="rgba(200,168,64,.6)"; }} onPointerUp={(e) => { e.preventDefault(); S.current.keys['KeyE'] = false; e.target.style.background="rgba(0,0,0,.3)"; }} style={{ position:"absolute", bottom:140, right:20, width:80, height:80, borderRadius:"50%", border:"2px solid rgba(200,168,64,.5)", background:"rgba(0,0,0,.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(200,168,64,1)", fontSize:"24px", userSelect:"none", zIndex:90, touchAction:"none", cursor:"pointer" }}>🖐️</div>}
        {isMobile&&<div onPointerDown={(e) => { e.preventDefault(); S.current.keys['ShiftLeft'] = true; e.target.style.background="rgba(200,168,64,.4)"; }} onPointerUp={(e) => { e.preventDefault(); S.current.keys['ShiftLeft'] = false; e.target.style.background="rgba(0,0,0,.15)"; }} onPointerCancel={(e) => { e.preventDefault(); S.current.keys['ShiftLeft'] = false; e.target.style.background="rgba(0,0,0,.15)"; }} style={{ position:"absolute", bottom:40, right:20, width:80, height:80, borderRadius:"50%", border:"2px solid rgba(200,168,64,.2)", background:"rgba(0,0,0,.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(200,168,64,.8)", fontSize:"14px", fontWeight:"bold", userSelect:"none", zIndex:90, touchAction:"none", cursor:"pointer" }}>{t.sprint}</div>}
        {isMobile&&<div onClick={() => { S.current.flashlightOn = !S.current.flashlightOn; if(R.current.flashlight) R.current.flashlight.intensity = S.current.flashlightOn ? 2.5 : 0; }} style={{ position:"absolute", bottom:40, right:120, width:60, height:60, borderRadius:"50%", border:"2px solid rgba(200,168,64,.4)", background:"rgba(0,0,0,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", userSelect:"none", zIndex:90, touchAction:"none", cursor:"pointer" }}>💡</div>}

        <div style={{position:"absolute", zIndex: 50, top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}><div style={{width:16,height:1,background:"rgba(200,168,64,.35)",position:"absolute",top:0,left:-8}}/><div style={{width:1,height:16,background:"rgba(200,168,64,.35)",position:"absolute",top:-8,left:0}}/></div>

        {/* Pasek instrukcji ze znikaniem */}
        {showHelp && (
          <div style={{position:"absolute", zIndex: 50, bottom: isMobile ? "auto" : 30, top: isMobile ? 80 : "auto", width:"100%", textAlign:"center", pointerEvents:"none", transition: "opacity 1s ease-out"}}>
            <div style={{display:"inline-block", background:"rgba(0,0,0,0.8)", border:"1px solid rgba(200,168,64,0.4)", color:"#d8b860", padding:"8px 16px", borderRadius:"4px", fontSize:isMobile?"11px":"13px", letterSpacing:"1px"}}> {t.instructionHelp} {!isMobile && <span style={{color:"#888", marginLeft:"15px"}}>{t.instructionMenu}</span>} </div>
          </div>
        )}

        {/* Komunikat z powiadomieniami MP */}
        {oppMessage && (
           <div style={{position:"absolute", zIndex: 50, top: isMobile ? 120 : 80, left:"50%",transform:"translateX(-50%)",background:"rgba(168,32,32,.85)",border:"1px solid #ff4444",color:"#fff",padding:"7px 20px",borderRadius:2,fontSize:"13px",letterSpacing:"1px",whiteSpace:"nowrap", fontWeight:"bold"}}>
             {oppMessage}
           </div>
        )}

        {catPrompt&&<div style={{position:"absolute", zIndex: 50, top: isMobile ? 120 : "auto", bottom: isMobile ? "auto" : 85, left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.85)",border:"1px solid #a86020",color:"#d8b860",padding:"7px 20px",borderRadius:2,fontSize:"11px",letterSpacing:"1px",whiteSpace:"nowrap"}}> 🐈 {catPrompt} </div>}
        {tvPrompt&&<div style={{position:"absolute", zIndex: 50, top: isMobile ? 120 : "auto", bottom: isMobile ? "auto" : 85, left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.85)",border:"1px solid #a86020",color:"#d8b860",padding:"7px 20px",borderRadius:2,fontSize:"11px",letterSpacing:"1px",whiteSpace:"nowrap"}}> 📺 {isMobile ? t.tvPromptMobile : t.tvPrompt} </div>}
        {radPrompt&&<div style={{position:"absolute", zIndex: 50, top: isMobile ? 120 : "auto", bottom: isMobile ? "auto" : 85, left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.85)",border:"1px solid #a86020",color:"#d8b860",padding:"7px 20px",borderRadius:2,fontSize:"11px",letterSpacing:"1px",whiteSpace:"nowrap"}}> 🔧 {radPrompt} </div>}
        
        {catMessage&&<div style={{position:"absolute", zIndex: 50, top:"35%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(20,10,0,.92)",border:"1px solid #d8b860",color:"#ffcc60",padding:"12px 30px",borderRadius:4,fontSize:"14px",fontWeight:"bold",letterSpacing:"1px",whiteSpace:"nowrap", textAlign:"center"}}> {catMessage} </div>}
        {radMessage&&<div style={{position:"absolute", zIndex: 50, top:"35%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(20,10,0,.92)",border:"1px solid #d8b860",color:"#ffcc60",padding:"12px 30px",borderRadius:4,fontSize:"14px",fontWeight:"bold",letterSpacing:"1px",whiteSpace:"nowrap", textAlign:"center"}}> {radMessage} </div>}
        {message&&<div style={{position:"absolute", zIndex: 50, top:"43%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,.92)",border:"1px solid rgba(200,168,64,.2)",color:"#d8b860",padding:"9px 24px",borderRadius:2,fontSize:"12px",letterSpacing:"1px",whiteSpace:"nowrap"}}> {message} </div>}
        {ui.rzepaHint && !ui.familiada.active && ( <div style={{position:"absolute", zIndex: 50, top: isMobile ? 150 : "auto", bottom: isMobile ? "auto" : 120, left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.85)",border:"1px solid #c8a840",color:"#d8b860",padding:"6px 18px",borderRadius:3,fontSize:"11px",letterSpacing:"2px",whiteSpace:"nowrap"}}> {isMobile ? t.rzepaHintTextMobile : t.rzepaHintText} </div> )}

        {/* TABLICA FAMILIADY */}
        {familiada.active && (() => {
            const currentQList = getFamiliadaQ(opts.language);
            return (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:100}}>
             {familiada.step === 'question' && (
                 <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
                     <div style={{color:"#fff", fontSize:"20px", marginBottom:"20px", textAlign:"center", maxWidth:"600px", textShadow:"0 0 10px #fff"}}> {t.karolAsks} "{currentQList[familiada.qId].q}" </div>
                     <div className="fam-board"> {Array.from({length: 5}).map((_, i) => { const ans = currentQList[familiada.qId].a[i]; const isRevealed = familiada.step === 'result' && familiada.ansText.toLowerCase() === (ans ? ans.t.toLowerCase() : ""); let rowText = "..................", rowPts = "--"; if (ans && isRevealed) { rowText = ans.t.toUpperCase().padEnd(18, ' '); rowPts = ans.p.toString().padStart(2, '0'); } else if (!ans) { rowText = "                  "; rowPts = "  "; } return ( <div key={i} className="fam-text" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}> <div style={{ display: 'flex', gap: '15px' }}> <span>{ans ? i+1 : '\u00A0'}</span> <span style={{ whiteSpace: 'pre' }}>{rowText}</span> </div> <span>{rowPts}</span> </div> ); })} </div>
                     <div style={{display:"flex", flexDirection:"row", gap:"10px", width:"100%", maxWidth:"600px", justifyContent:"center"}}>
                         <input type="text" autoFocus value={famInput} onChange={e => setFamInput(e.target.value)} onKeyDown={e => { e.stopPropagation(); if(e.key === 'Enter') submitFamiliada(); }} placeholder="..." style={{padding:"12px", fontSize:"18px", width:"70%", borderRadius:"4px", border:"2px solid #555", background:"#111", color:"#fff", outline:"none", textAlign:"center", fontFamily: 'monospace'}} />
                         <button onClick={submitFamiliada} style={{background:"#4CAF50", border:"none", color:"#fff", padding:"10px 20px", fontSize:"16px", cursor:"pointer", borderRadius:"4px", fontWeight:"bold"}}> {t.shot} </button>
                     </div>
                 </div>
             )}
             {familiada.step === 'result' && (
                 <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
                     {familiada.points === 0 && ( <div style={{position: 'absolute', color: '#ff0000', fontSize: '180px', fontWeight: 'bold', textShadow: '0 0 40px #ff0000', zIndex: 110}}> X </div> )}
                     <div className="fam-board"> {Array.from({length: 5}).map((_, i) => { const ans = currentQList[familiada.qId].a[i]; const isRevealed = familiada.step === 'result' && familiada.ansText.toLowerCase() === (ans ? ans.t.toLowerCase() : ""); let rowText = "..................", rowPts = "--"; if (ans && isRevealed) { rowText = ans.t.toUpperCase().padEnd(18, ' '); rowPts = ans.p.toString().padStart(2, '0'); } else if (!ans) { rowText = "                  "; rowPts = "  "; } return ( <div key={i} className="fam-text" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}> <div style={{ display: 'flex', gap: '15px' }}> <span>{ans ? i+1 : '\u00A0'}</span> <span style={{ whiteSpace: 'pre' }}>{rowText}</span> </div> <span>{rowPts}</span> </div> ); })} </div>
                     <div style={{background:"#0a0f18", border:"3px solid #f0b000", borderRadius:"12px", padding:"15px", textAlign:"center", maxWidth:"350px", zIndex: 105}}>
                         <img src="strasburger.jpg" alt="Host" style={{width:"100%", height:"140px", objectFit:"contain", backgroundColor:"#000", borderRadius:"8px", marginBottom:"10px", border:"2px solid #555"}} />
                         <div style={{color: familiada.points === 100 ? "#4CAF50" : (familiada.points > 0 ? "#f0b000" : "#d32f2f"), fontSize:"18px", fontWeight:"bold", marginBottom:"5px"}}> {familiada.points === 100 ? t.famBest : (familiada.points > 0 ? t.famGood : t.famBad)} </div>
                         <div style={{color:"#fff", fontSize:"14px"}}> {familiada.points > 0 ? <span>{t.famRecover} <span style={{color:"#f0b000", fontWeight:"bold"}}>{familiada.points}</span>{t.famSanity}</span> : <span style={{color:"#d32f2f", fontWeight:"bold"}}>-15% poczytalności</span>} </div>
                     </div>
                 </div>
             )}
          </div>
        );})()}

        <div style={{position:"absolute", zIndex: 50, top: isMobile ? 12 : 40, left:"50%", transform:"translateX(-50%)", textAlign:"center"}}>
          <button onClick={()=>setUi(p=>({...p,hint:!p.hint}))} style={{background:"none",border:"none",color:"#3a2e1c",cursor:"pointer",fontSize:"9px",letterSpacing:"2px",padding:"4px 8px"}}> {hint?t.hideHint:t.showHint} </button>
          {hint&&<div style={{color:"#6a5838",fontSize:"10px",fontStyle:"italic",marginTop:3,letterSpacing:".5px", background:"rgba(0,0,0,0.5)", padding:"2px 6px", borderRadius:"2px"}}> {hasAnomaly?`⚠ ${hintText}`:t.normalStatus} </div>}
        </div>
      </>}

      {/* WYGRANA */}
      {phase==="win"&&(
        <div style={{position:"absolute", zIndex: 100, inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", padding:"0 0 40px"}}>
          <div style={{background:"rgba(0,0,0,.85)",padding:"24px 40px",textAlign:"center",borderTop:"2px solid rgba(200,168,64,.3)",width:"100%"}}>
            <div style={{fontSize:36,marginBottom:8}}>🏢</div>
            <div style={{color:"#d8b860",fontSize:isMobile?"16px":"20px",letterSpacing:"4px",marginBottom:8}}>{t.freedom}</div>
            <div style={{color:"#aaa",fontSize:"13px",fontStyle:"italic",marginBottom:4}}>{t.freedomDesc}</div>
            <div style={{color:"#555",fontSize:"10px",marginBottom:16}}>{t.stepsCount} {steps} — {t.ending}</div>
            <button onClick={restart} style={btnStyle}>{t.exitToMenu}</button>
          </div>
        </div>
      )}

      {/* PORAŻKA - BRAK ZDROWIA */}
      {phase==="gameover"&&(
        <div style={{position:"absolute", zIndex: 100, inset:0,background:"rgba(10,0,0,.96)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{fontSize:56}}>🧠</div>
          <div style={{color:"#a82020",fontSize:isMobile?"18px":"22px",letterSpacing:"4px",textAlign:"center"}}>{t.lostMind}</div>
          <div style={{color:"#662020",fontSize:"10px",letterSpacing:"2px",marginTop:4}}>{t.lostMindDesc}</div>
          {opts.endless && <div style={{color:"#d8b860",fontSize:"14px", marginTop: "10px"}}>{t.reachedFloor} {exitCount}</div>}
          <button onClick={restart} style={{...btnStyle, width: "200px", borderColor:"#a82020", color:"#a82020", marginTop: "20px"}}> {t.tryAgain} </button>
        </div>
      )}

      {/* PORAŻKA - RYWAL BYŁ SZYBSZY */}
      {phase==="gameover_lost_race"&&(
        <div style={{position:"absolute", zIndex: 100, inset:0,background:"rgba(10,0,0,.96)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{position:"relative", width:"400px", height:"250px", background:"rgba(0,0,0,0.95)", border:"2px solid #a82020", borderRadius:"4px", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"inset 0 0 50px rgba(100,0,0,0.5)"}}>
              <div style={{position:"absolute", inset: 0, background: "repeating-linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0) 3px, rgba(0,0,0,0.8) 3px, rgba(0,0,0,0.8) 6px)"}}></div>
              <div style={{color:"#a82020", fontSize:"28px", fontWeight:"bold", textShadow:"0 0 15px #ff0000", zIndex: 10, letterSpacing:"2px"}}>WIDZISZ TYLKO PUSTKĘ...</div>
          </div>
          <div style={{color:"#a82020",fontSize:isMobile?"18px":"22px",letterSpacing:"4px",textAlign:"center", fontWeight:"bold", textShadow:"0 0 10px #ff4444"}}>{t.rivalWon}</div>
          <div style={{color:"#662020",fontSize:"10px",letterSpacing:"2px",marginTop:4}}>{t.rivalWonDesc} ({oppMessage})</div>
          <div style={{color:"#d8b860",fontSize:"14px", marginTop: "10px"}}>{t.yourScore}{exitCount}</div>
          <button onClick={restart} style={{...btnStyle, width: "200px", borderColor:"#a82020", color:"#a82020", marginTop: "20px"}}> {t.tryAgain} </button>
        </div>
      )}
    </div>
  );
} 
