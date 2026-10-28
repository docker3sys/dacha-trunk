import {ITEMS,LEVELS,cellsFor,canPlace,placePiece,removePiece,isSolved,findHint} from './engine.js';
import {icon,itemArt,scenery} from './art.js';
import {loadProgress,saveProgress,awardLevel} from './progress.js';

const app=document.querySelector('#app'),modal=document.querySelector('#modal'),ghost=document.querySelector('#drag-ghost');
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('unavailable')}};}
let progress=loadProgress(storage),level,placements={},selected=null,rotation=0,history=[],moves=0,hintsUsed=0,won=false,drag=null,ignoreClickUntil=0,toastTimer,adPending=false;
let sessionReward=0,doubled=false,audioContext;
const themes={sand:{name:'Медовый',price:0,color:'#e7bc6a'},sage:{name:'Шалфей',price:120,color:'#91ac90'},sky:{name:'Голубой',price:160,color:'#8eafbc'},berry:{name:'Брусника',price:200,color:'#ba8590'}};
function capabilities(){try{return JSON.parse(window.DachaNative?.getCapabilities()||'{}');}catch{return {};}}
function persist(){if(!saveProgress(storage,progress))toast('Сохранение недоступно. Не закрывай вкладку, чтобы не потерять прогресс.');}
function toast(text){clearTimeout(toastTimer);const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
function sound(type='place'){
 if(!progress.sound)return;
 try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='sine';o.frequency.setValueAtTime(type==='win'?660:430,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(type==='win'?990:620,audioContext.currentTime+.1);g.gain.setValueAtTime(.045,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.18);o.start();o.stop(audioContext.currentTime+.2);}catch{}
}
function safeDraft(l,raw){let result={};for(const p of l.pieces){const v=raw?.[p.id];if(v&&canPlace(l,result,p.id,v.x,v.y,v.rotation))result=placePiece(l,result,p.id,v.x,v.y,v.rotation);}return result;}
function saveDraft(){progress.drafts[level.id]={placements,moves,hintsUsed};progress.current=level.id;persist();}
function loadLevel(id){
 level=LEVELS.find(l=>l.id===id)||LEVELS[0];const draft=progress.drafts[level.id];placements=safeDraft(level,draft?.placements);moves=Number.isInteger(draft?.moves)?Math.max(0,draft.moves):0;hintsUsed=Number.isInteger(draft?.hintsUsed)?Math.max(0,draft.hintsUsed):0;
 if(isSolved(level,placements))placements={};
 selected=null;rotation=0;history=[];won=false;sessionReward=0;doubled=false;progress.current=level.id;persist();closeModal();render();
}
function pieceVisual(piece,rot=0,unit=30){const cells=cellsFor(piece,rot),w=Math.max(...cells.map(c=>c[0]))+1,h=Math.max(...cells.map(c=>c[1]))+1;return `<span class="shape" style="width:${w*unit}px;height:${h*unit}px;--piece-color:${ITEMS[piece.kind].color}">${cells.map(([x,y])=>`<i class="shape-cell" style="left:${x*unit}px;top:${y*unit}px;width:${unit}px;height:${unit}px"></i>`).join('')}<span class="shape-art" style="transform:rotate(${rot*90}deg)">${itemArt(piece.kind)}</span></span>`;}
function render(){
 const placed=Object.keys(placements).length,total=level.pieces.length,done=Object.keys(progress.completed).length;
 const chapter=Math.ceil(level.id/10),chapterNames=['Дачный сезон','На природу','Большое путешествие'];
 document.documentElement.style.setProperty('--car-color',themes[progress.theme]?.color||themes.sand.color);
 app.innerHTML=`<header class="topbar"><a class="brand" href="#" data-act="home" aria-label="Багажник на дачу, текущая поездка"><img src="./public/icon.svg" alt="" width="42" height="42"><span>багажник<span class="brand-small">на дачу</span></span></a><nav aria-label="Меню"><button class="nav-item current" data-act="home">Играть</button><button class="nav-item" data-act="levels">Поездки <span class="nav-count">${done}/30</span></button><button class="nav-item" data-act="help">Как играть</button></nav><div class="header-actions"><button class="coin-pill" data-act="garage" aria-label="Гараж, ${progress.coins} монет">${icon('coin',19)}<b>${progress.coins}</b></button><button class="icon-btn sound-btn" data-act="sound" aria-label="${progress.sound?'Выключить':'Включить'} звук">${icon(progress.sound?'sound':'muted',21)}</button></div></header>
 <main class="layout"><aside class="intro"><div class="eyebrow"><span class="live-dot"></span>МАЛЕНЬКОЕ ПРИКЛЮЧЕНИЕ</div><h1>Всё<br><em>поместится.</em></h1><p class="intro-copy">Чемодан, рассада и ещё<br>пара совершенно нужных вещей.</p>${scenery()}<div class="route-card"><span class="mini-label">ТВОЙ МАРШРУТ</span><div class="route-title">${icon('road',22)}${chapterNames[chapter-1]}</div><div class="route-dots">${Array.from({length:10},(_,i)=>{let id=(chapter-1)*10+i+1;return `<button data-act="level" data-id="${id}" class="route-dot ${progress.completed[id]?'done':''} ${id===level.id?'active':''}" aria-label="Поездка ${id}" ${unlocked(id)?'':'disabled'}>${progress.completed[id]?icon('check',11):id}</button>`;}).join('')}</div><button class="text-button" data-act="levels">Все поездки ${icon('arrow',16)}</button></div><p class="quiet-note">${icon('leaf',15)}Никакой спешки. Только ты и багажник.</p></aside>
 <section class="game-section" aria-label="Игровое поле"><div class="level-heading"><div><span class="mini-label">ПОЕЗДКА ${String(level.id).padStart(2,'0')} / 30</span><h2>${level.title}</h2></div><button class="small-pill" data-act="levels" aria-label="Выбрать поездку">${icon('grid',17)}<span>Маршрут</span></button></div><div class="car-stage"><div class="car-mirror left"></div><div class="car-mirror right"></div><div class="car-shell"><div class="car-window"><span></span><span></span><div class="window-line"></div></div><div class="trunk-rim"><div id="board" class="board" role="group" aria-label="Багажник: ${level.cols} на ${level.rows} клеток" style="--cols:${level.cols};--rows:${level.rows}"></div></div><div class="car-bumper"><span class="tail-light"></span><span class="plate">НА ДАЧУ <i>♥</i></span><span class="tail-light"></span></div></div></div><div class="packing-status"><span><i class="status-dot ${placed===total?'complete':''}"></i><b>${placed}</b> из ${total} вещей в багажнике</span><span class="move-count">${moves} ${plural(moves,'ход','хода','ходов')}</span></div><div class="game-toolbar"><button class="tool-button" data-act="rotate" ${!selected||won?'disabled':''}>${icon('rotate',20)}<span>Повернуть</span><kbd>R</kbd></button><button class="tool-button" data-act="undo" ${!history.length||won?'disabled':''}>${icon('undo',20)}<span>Отменить</span></button><button class="tool-button" data-act="reset" ${!placed&&!moves?'disabled':''}>${icon('reset',20)}<span>Заново</span></button><button class="tool-button hint" data-act="hint" ${won||adPending?'disabled':''}>${icon('bulb',20)}<span>Подсказка</span><b>${progress.hints||'+'}</b></button></div><p class="board-tip">${icon('help',15)}<span id="selection-tip">${selected?`${ITEMS[level.pieces.find(p=>p.id===selected).kind].name}: выбери место в багажнике`:'Перетащи вещь в багажник или выбери её и нажми на клетку'}</span></p></section>
 <aside class="luggage-panel"><div class="luggage-heading"><div><span class="mini-label">СПИСОК НА ВЫХОДНЫЕ</span><h2>Берём с собой</h2></div><span class="counter">${total-placed}</span></div><div class="luggage-grid">${level.pieces.map(p=>`<button class="piece-source ${placements[p.id]?'packed':''} ${p.id===selected?'selected':''}" data-piece="${p.id}" aria-label="${ITEMS[p.kind].name}${placements[p.id]?', в багажнике':''}" aria-pressed="${selected===p.id}"><span class="item-thumb">${pieceVisual(p,p.id===selected?rotation:placements[p.id]?.rotation||0,22)}</span><span class="piece-name">${ITEMS[p.kind].name}</span><span class="piece-size">${placements[p.id]?icon('check',14)+'Уложено':cellsFor(p,0).length+' кл.'}</span></button>`).join('')}</div><div class="packing-note">${icon('bulb',22)}<p>Большие вещи — первыми.<br>Маленькие найдут своё место.</p></div><button class="garage-link" data-act="garage">${icon('gift',19)}<span>Заглянуть в гараж</span>${icon('arrow',17)}</button></aside></main><footer><span>Сделано для маленьких перерывов</span><div><button data-act="privacy">О данных</button><span>•</span><span>${capabilities().platform==='android'?(capabilities().adsMode==='test'?'Тестовая сборка Android':capabilities().rewardedAds?'Android':'Android · без рекламы'):'Браузерная версия · без рекламы'}</span></div></footer>`;
 drawBoard();
}
function plural(n,a,b,c){return n%10===1&&n%100!==11?a:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?b:c;}
function drawBoard(){
 const board=document.querySelector('#board');if(!board)return;
 const size=board.clientWidth/level.cols;
 board.innerHTML=Array.from({length:level.rows*level.cols},(_,i)=>{const x=i%level.cols,y=Math.floor(i/level.cols),blocked=level.blocked.some(c=>c[0]===x&&c[1]===y);return `<button class="board-cell ${blocked?'blocked':''}" data-cell="${x},${y}" style="left:${x/level.cols*100}%;top:${y/level.rows*100}%;width:${100/level.cols}%;height:${100/level.rows}%" aria-label="Ряд ${y+1}, место ${x+1}" ${blocked?'disabled':''}></button>`;}).join('')+Object.entries(placements).map(([id,p])=>{const piece=level.pieces.find(x=>x.id===id);return `<button class="board-piece ${selected===id?'selected':''}" data-piece="${id}" style="left:${p.x*size}px;top:${p.y*size}px" aria-label="${ITEMS[piece.kind].name}, ряд ${p.y+1}, место ${p.x+1}">${pieceVisual(piece,p.rotation,size)}</button>`;}).join('');
}
new ResizeObserver(()=>drawBoard()).observe(app);
function unlocked(id){return id===1||!!progress.completed[id]||!!progress.completed[id-1];}
function snapshot(){history.push({placements:structuredClone(placements),moves,hintsUsed});if(history.length>100)history.shift();}
function select(id){if(selected!==id)rotation=placements[id]?.rotation||0;selected=id;render();}
function put(id,x,y,rot){const next=placePiece(level,placements,id,x,y,rot);if(!next){toast('Здесь не помещается. Попробуй повернуть вещь.');return false;}if(JSON.stringify(next)===JSON.stringify(placements))return true;snapshot();placements=next;moves++;selected=null;rotation=0;sound();saveDraft();render();if(isSolved(level,placements))finish();return true;}
function finish(){
 if(won)return;won=true;const stars=hintsUsed===0?3:hintsUsed<=2?2:1;
 const result=awardLevel(progress,level.id,stars);progress=result.progress;sessionReward=result.reward;delete progress.drafts[level.id];persist();sound('win');render();
 const finishedLevel=level.id;setTimeout(()=>{if(won&&level.id===finishedLevel)showWin(stars);},280);
 if(Object.keys(progress.completed).length>=3&&!progress.reviewAsked&&capabilities().review){progress.reviewAsked=true;persist();setTimeout(()=>window.DachaNative?.requestReview(),2000);}
}
function closeModal(){if(adPending)return;if(modal.open)modal.close();modal.innerHTML='';}
function dialog(content,cls=''){modal.className=cls;modal.innerHTML=`<button class="modal-close icon-btn" data-act="close" aria-label="Закрыть">${icon('close')}</button>${content}`;if(!modal.open)modal.showModal();}
function showWin(stars=progress.completed[level.id]){dialog(`<div class="win-icon">${icon('check',40)}</div><span class="mini-label">МОЖНО ВЫЕЗЖАТЬ</span><h2 id="modal-title">Всё поместилось!</h2><p>Даже самое необходимое.<br>Хороших выходных!</p><div class="stars">${[1,2,3].map(i=>`<span class="${i<=stars?'earned':''}">${icon('star',31)}</span>`).join('')}</div><div class="win-stats"><span><b>${moves}</b> ${plural(moves,'ход','хода','ходов')}</span><span>${icon('coin',20)}<b>+${sessionReward}</b> монет</span></div>${sessionReward&&!doubled?`<button class="secondary wide" data-act="double">${icon('play',18)}${capabilities().rewardedAds?'Удвоить монеты за рекламу':'Получить бонус · бесплатно'}</button>`:''}<button class="primary wide" data-act="next">${level.id<30?'Следующая поездка':'Все поездки пройдены'} ${icon('arrow',20)}</button><button class="text-button" data-act="levels">Посмотреть маршрут</button>`,'win-modal');}
function showLevels(){dialog(`<span class="mini-label">30 МАЛЕНЬКИХ ПРИКЛЮЧЕНИЙ</span><h2 id="modal-title">Куда отправимся?</h2><p>Новые поездки открываются по порядку.</p>${['Дачный сезон','На природу','Большое путешествие'].map((name,c)=>`<h3 class="chapter-title"><span>0${c+1}</span>${name}</h3><div class="level-grid">${LEVELS.slice(c*10,c*10+10).map(l=>`<button class="level-tile ${progress.completed[l.id]?'completed':''} ${l.id===level.id?'active':''}" data-act="level" data-id="${l.id}" ${unlocked(l.id)?'':'disabled'} aria-label="Поездка ${l.id}: ${l.title}"><b>${unlocked(l.id)?l.id:icon('lock',20)}</b><small>${progress.completed[l.id]?'★'.repeat(progress.completed[l.id]):unlocked(l.id)?'в путь':'позже'}</small></button>`).join('')}</div>`).join('')}`,'levels-modal');}
function showGarage(){dialog(`<span class="mini-label">МАЛЕНЬКИЕ РАДОСТИ</span><h2 id="modal-title">Твой гараж</h2><p>Проходи поездки и выбирай цвет машины.<br>Всё покупается за заработанные в игре монеты.</p><div class="garage-balance">${icon('coin',23)}${progress.coins} монет</div><div class="theme-grid">${Object.entries(themes).map(([id,t])=>`<button class="theme-card ${progress.theme===id?'active':''}" data-act="theme" data-id="${id}"><span class="paint-swatch" style="background:${t.color}">${icon('bag',30)}</span><b>${t.name}</b><small>${progress.theme===id?'Выбран':progress.owned.includes(id)?'Выбрать':t.price+' монет'}</small></button>`).join('')}</div>`,'garage-modal');}
function showHelp(){dialog(`<span class="mini-label">ВСЁ ПРОСТО</span><h2 id="modal-title">Уложи все вещи</h2><div class="help-steps"><p><b>1</b><span>Перетащи предмет из списка в багажник. Или выбери предмет, затем нажми на свободную клетку.</span></p><p><b>2</b><span>Поворачивай выбранную вещь кнопкой ${icon('rotate',17)} или клавишей <kbd>R</kbd>. Перемещай уже уложенные предметы.</span></p><p><b>3</b><span>Заполни багажник без наложений. Все уровни можно пройти без подсказок и рекламы.</span></p></div><div class="help-note">Перетащи вещь за пределы багажника, чтобы вернуть её в список. Отмена и повторная попытка всегда бесплатные.</div><button class="primary wide" data-act="close">Понятно, поехали ${icon('arrow',18)}</button>`);}
function showPrivacy(){dialog(`<span class="mini-label">ПРОЗРАЧНО И ПРОСТО</span><h2 id="modal-title">О твоих данных</h2><p>Поездки, монеты, подсказки и настройки хранятся только на этом устройстве. Аккаунт не нужен. При очистке данных приложения или браузера прогресс будет потерян.</p><p>Браузерная версия не подключает рекламные сети. В первой Android-версии реклама также отключена. Если она появится в обновлении, просмотр будет добровольным; рекламный сервис может обрабатывать технические данные устройства по своим правилам.</p><p><a href="https://docker3sys.github.io/dacha-trunk/public/privacy.html" data-external target="_blank" rel="noopener">Политика конфиденциальности игры</a></p><button class="primary wide" data-act="close">Понятно</button>`);}
function applyHint(){if(won)return;const hint=findHint(level,placements);if(!hint)return;snapshot();for(const id of hint.clearIds)placements=removePiece(placements,id);placements=placePiece(level,placements,hint.pieceId,hint.x,hint.y,hint.rotation)||placements;progress.hints=Math.max(0,progress.hints-1);hintsUsed++;moves++;selected=null;saveDraft();sound();render();toast(hint.clearIds.length?'Освободили место и уложили одну вещь.':'Одну вещь уложили. Попробуй продолжить!');if(isSolved(level,placements))finish();}
function rewardPrompt(kind){
 const cap=capabilities();
 if(!cap.rewardedAds){dialog(`<div class="reward-icon">${icon(kind==='hint'?'bulb':'gift',34)}</div><h2 id="modal-title">Бонус для знакомства</h2><p>В этой версии рекламы нет.<br>${kind==='hint'?'Можно бесплатно получить одну подсказку.':'Можно бесплатно удвоить награду за эту поездку.'}</p><button class="primary wide" data-act="demo-reward" data-kind="${kind}">Получить бесплатно ${icon('arrow',19)}</button>`);return;}
 dialog(`<div class="reward-icon">${icon('play',32)}</div><h2 id="modal-title">${kind==='hint'?'Нужна подсказка?':'Удвоить награду?'}</h2><p>Посмотри рекламу до получения награды — и ${kind==='hint'?'получи одну подсказку.':'забери ещё '+sessionReward+' монет.'}</p>${cap.adsMode==='test'?'<p class="help-note">Тестовая реклама. Эта сборка не приносит рекламный доход.</p>':''}<button class="primary wide" data-act="native-reward" data-kind="${kind}" ${cap.rewardedAds?'':'disabled'}>${cap.rewardedAds?'Смотреть рекламу':'Реклама ещё не подключена'}</button><button class="text-button" data-act="close">Продолжить без рекламы</button>`);
}
function deliverReward(kind){if(kind==='hint'){progress.hints++;persist();closeModal();applyHint();}else if(kind==='double'&&sessionReward>0&&!doubled){progress.coins+=sessionReward;sessionReward*=2;doubled=true;persist();render();showWin();}}
function nativeReward(kind){if(adPending||!['hint','double'].includes(kind))return;adPending=true;const rewardLevel=level.id;let settled=false;const requestId=crypto.randomUUID?.()||String(Date.now());dialog(`<div class="reward-icon">${icon('play',34)}</div><h2 id="modal-title">Загружаем рекламу</h2><p>Награда появится после просмотра.</p>`);modal.querySelector('[data-act="close"]').disabled=true;let timeout;
 const settle=(status)=>{if(settled)return;settled=true;window.removeEventListener('native-ad-result',onResult);clearTimeout(timeout);adPending=false;if(status==='rewarded'&&level.id===rewardLevel)deliverReward(kind);else{closeModal();toast(status==='dismissed'?'Просмотр завершён без награды.':'Реклама сейчас недоступна. Можно продолжить играть.');if(won)showWin();}};
 const onResult=(e)=>{if(e.detail?.requestId===requestId)settle(e.detail.status);};window.addEventListener('native-ad-result',onResult);timeout=setTimeout(()=>settle('error'),180000);
 try{window.DachaNative.showRewarded(requestId);}catch{settle('error');}
}
document.addEventListener('click',e=>{
 if(Date.now()<ignoreClickUntil||adPending)return;
 const external=e.target.closest('a[data-external]');if(external&&window.DachaNative){e.preventDefault();window.DachaNative.openExternal(external.href);return;}
 const action=e.target.closest('[data-act]');
 if(action){e.preventDefault();const act=action.dataset.act;if(action.disabled)return;
  if(act==='home'){closeModal();return;}
  if(act==='close'){closeModal();return;}
  if(act==='levels'){showLevels();return;}
  if(act==='level'){const id=+action.dataset.id;if(unlocked(id))loadLevel(id);return;}
  if(act==='help'){showHelp();return;}
  if(act==='privacy'){showPrivacy();return;}
  if(act==='garage'){showGarage();return;}
  if(act==='sound'){progress.sound=!progress.sound;persist();render();if(progress.sound)sound();return;}
  if(act==='theme'){const id=action.dataset.id,t=themes[id];if(!t)return;if(!progress.owned.includes(id)){if(progress.coins<t.price){toast('Ещё немного поездок — и этот цвет твой!');return;}progress.coins-=t.price;progress.owned.push(id);}progress.theme=id;persist();render();showGarage();return;}
  if(act==='rotate'&&selected&&!won){const next=(rotation+1)%4;if(placements[selected]){if(put(selected,placements[selected].x,placements[selected].y,next))rotation=next;}else{rotation=next;render();toast('Предмет повёрнут. Выбери место.');}return;}
  if(act==='undo'&&history.length&&!won){const old=history.pop();placements=old.placements;moves=old.moves;hintsUsed=Math.max(hintsUsed,old.hintsUsed);selected=null;saveDraft();render();return;}
  if(act==='reset'){dialog(`<h2 id="modal-title">Уложить заново?</h2><p>Вещи вернутся в список. Пройденные поездки и монеты останутся.</p><button class="primary wide" data-act="reset-confirm">Начать эту поездку заново</button>`);return;}
  if(act==='reset-confirm'){placements={};history=[];moves=0;selected=null;won=false;saveDraft();closeModal();render();return;}
  if(act==='hint'&&!won){if(progress.hints)applyHint();else rewardPrompt('hint');return;}
  if(act==='double'){rewardPrompt('double');return;}
  if(act==='demo-reward'){if(!capabilities().rewardedAds)deliverReward(action.dataset.kind);return;}
  if(act==='native-reward'){nativeReward(action.dataset.kind);return;}
  if(act==='next'){if(level.id<30)loadLevel(level.id+1);else showLevels();return;}
 }
 const cell=e.target.closest('[data-cell]');if(cell&&selected&&!won){const [x,y]=cell.dataset.cell.split(',').map(Number);put(selected,x,y,rotation);return;}
 const p=e.target.closest('[data-piece]');if(p&&!won)select(p.dataset.piece);
});
document.addEventListener('pointerdown',e=>{
 const target=e.target.closest('[data-piece]');if(!target||won||modal.open||adPending||drag||!e.isPrimary||e.button!==0)return;
 const piece=level.pieces.find(p=>p.id===target.dataset.piece);const old=placements[piece.id];
 const priorSelected=selected;selected=piece.id;rotation=old?.rotation??(priorSelected===piece.id?rotation:0);
 const board=document.querySelector('#board'),rect=board.getBoundingClientRect(),unit=rect.width/level.cols,cells=cellsFor(piece,rotation),w=Math.max(...cells.map(c=>c[0]))+1,h=Math.max(...cells.map(c=>c[1]))+1;
 drag={pointerId:e.pointerId,id:piece.id,piece,startX:e.clientX,startY:e.clientY,active:false,rotation,fromBoard:target.classList.contains('board-piece'),ax:old&&target.classList.contains('board-piece')?Math.floor((e.clientX-rect.left)/unit)-old.x:Math.floor(w/2),ay:old&&target.classList.contains('board-piece')?Math.floor((e.clientY-rect.top)/unit)-old.y:Math.floor(h/2),unit};
});
document.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.pointerId)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6&&!drag.active)return;
 drag.active=true;e.preventDefault();const rect=document.querySelector('#board').getBoundingClientRect(),unit=rect.width/level.cols;drag.unit=unit;
 ghost.innerHTML=pieceVisual(drag.piece,drag.rotation,unit);ghost.style.display='block';ghost.style.left=(e.clientX-(drag.ax+.5)*unit)+'px';ghost.style.top=(e.clientY-(drag.ay+.5)*unit)+'px';
 const x=Math.floor((e.clientX-rect.left)/unit)-drag.ax,y=Math.floor((e.clientY-rect.top)/unit)-drag.ay;drag.x=x;drag.y=y;drag.inside=e.clientX>=rect.left&&e.clientX<rect.right&&e.clientY>=rect.top&&e.clientY<rect.bottom;
 document.querySelectorAll('.board-cell').forEach(c=>c.classList.remove('preview-good','preview-bad'));
 if(drag.inside){const valid=canPlace(level,placements,drag.id,x,y,drag.rotation);for(const [cx,cy] of cellsFor(drag.piece,drag.rotation)){const cell=document.querySelector(`[data-cell="${x+cx},${y+cy}"]`);cell?.classList.add(valid?'preview-good':'preview-bad');}}
},{passive:false});
document.addEventListener('pointerup',e=>{
 if(!drag||e.pointerId!==drag.pointerId)return;const d=drag;drag=null;ghost.style.display='none';document.querySelectorAll('.board-cell').forEach(c=>c.classList.remove('preview-good','preview-bad'));
 if(!d.active)return;ignoreClickUntil=Date.now()+250;
 if(d.inside)put(d.id,d.x,d.y,d.rotation);else if(d.fromBoard){snapshot();placements=removePiece(placements,d.id);moves++;selected=null;saveDraft();render();}else render();
});
document.addEventListener('pointercancel',e=>{if(!drag||e.pointerId!==drag.pointerId)return;drag=null;ghost.style.display='none';drawBoard();});
document.addEventListener('keydown',e=>{if(modal.open||drag||adPending)return;if(e.key.toLowerCase()==='r'||e.key.toLowerCase()==='к'){e.preventDefault();document.querySelector('[data-act="rotate"]')?.click();}if(e.key==='Escape'){selected=null;render();}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();document.querySelector('[data-act="undo"]')?.click();}});
window.addEventListener('native-back',()=>{if(adPending)return;if(modal.open)closeModal();else dialog(`<h2 id="modal-title">Сделаем перерыв?</h2><p>Прогресс сохранён. Продолжишь с этого места.</p><button class="primary wide" data-act="close">Остаться в игре</button><button class="text-button" id="exit-native">Выйти</button>`);document.querySelector('#exit-native')?.addEventListener('click',()=>window.DachaNative?.closeApp());});
modal.addEventListener('cancel',e=>{if(adPending)e.preventDefault();});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
loadLevel(progress.current);
