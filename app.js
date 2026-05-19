
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
const HERO_BY_SLUG = new Map((window.HEROES || []).map(h => [h.slug, h]));

function heroPageUrl(slug, prefix=''){ return `${prefix}heroes/${slug}.html`; }
function getHero(slug){ return HERO_BY_SLUG.get(slug) || (window.HEROES || [])[0]; }
function setVisible(el, show){ if(el) el.style.display = show ? '' : 'none'; }

function initCommon(){
  buildParticles();
  initSound();
  initMobileNav();
  initFavoritesButtons();
}
function buildParticles(){
  let holder = $('#particles'); if(!holder || holder.dataset.ready) return;
  holder.dataset.ready = '1';
  holder.innerHTML = Array.from({length:14}, (_,i)=>`<span class="particle" style="left:${(i*13)%100}%;animation-delay:${i*.4}s"></span>`).join('');
}
function initSound(){
  $$('.soundToggle').forEach(btn => {
    btn.onclick = () => {
      btn.textContent = btn.textContent.includes('🔊') ? '🔈' : '🔊';
    };
  });
}
function initMobileNav(){
  if(!$('#mobileBottomNav')){
    document.body.insertAdjacentHTML('beforeend', `<nav class="mobileBottomNav" id="mobileBottomNav"><a href="index.html">Home</a><a href="index.html#heroes">Heroes</a><a href="tools.html">Tools</a><a href="matchup.html">Matchup</a><a href="favorites.html">Favs</a></nav>`);
  }
  if($('#heroControls') && !$('#mobileFilterFab')){
    document.body.insertAdjacentHTML('beforeend', `<button class="mobileFilterFab" id="mobileFilterFab">⌕ Filters</button>`);
    $('#mobileFilterFab').onclick = () => document.body.classList.toggle('drawerOpen');
    $('.drawerOverlay')?.addEventListener('click', () => document.body.classList.remove('drawerOpen'));
  }
}
function favs(){ try{return JSON.parse(localStorage.getItem('hcFavs') || '[]')}catch{return []} }
function saveFavs(v){ localStorage.setItem('hcFavs', JSON.stringify([...new Set(v)])); }
function toggleFav(slug){
  const list = favs();
  const next = list.includes(slug) ? list.filter(x=>x!==slug) : [...list, slug];
  saveFavs(next);
  updateFavButtons();
  renderFavorites();
}
function initFavoritesButtons(){
  $$('.save-fav').forEach(btn => btn.onclick = () => toggleFav(btn.dataset.slug));
  updateFavButtons();
}
function updateFavButtons(){
  const list = favs();
  $$('.save-fav').forEach(btn => btn.textContent = list.includes(btn.dataset.slug) ? '★ Saved' : '☆ Save');
}
function renderFavorites(){
  const box = $('#favoriteGrid'); if(!box) return;
  const saved = favs().map(getHero).filter(Boolean);
  $('#favoritePageCount') && ($('#favoritePageCount').textContent = `${saved.length} heroes saved`);
  box.innerHTML = saved.length ? saved.map(h => `<article class="card"><h3>${h.name}</h3><p class="meta">${h.role} • ${h.lane}</p><a class="btn" href="heroes/${h.slug}.html">Open guide</a></article>`).join('') : '<p class="meta">No favorites yet.</p>';
}
function initHome(){
  initCommon();
  const search = $('#search'), role=$('#roleFilter'), lane=$('#laneFilter'), tier=$('#tierFilter'), diff=$('#difficultyFilter');
  function filter(){
    const q=(search?.value||'').toLowerCase();
    let count=0;
    $$('.hero-card').forEach(card => {
      const ok = (card.dataset.search||'').includes(q)
        && (!role || role.value==='All' || card.dataset.role===role.value)
        && (!lane || lane.value==='All' || card.dataset.lane===lane.value)
        && (!tier || tier.value==='All' || card.dataset.tier===tier.value)
        && (!diff || diff.value==='All' || card.dataset.difficulty===diff.value);
      setVisible(card, ok); if(ok) count++;
    });
    $('#count') && ($('#count').textContent = `${count} heroes shown`);
  }
  [search, role, lane, tier, diff].forEach(el => el && el.addEventListener('input', filter));
  $$('.quick-lane').forEach(btn => btn.onclick = () => { if(lane){lane.value = btn.dataset.lane; filter(); location.hash='heroes';} });
  filter();
}
function makeMini(h, prefix=''){
  return `<a class="mini" href="${prefix}heroes/${h.slug}.html"><b>${h.name}</b><br><span class="meta">${h.role} • ${h.lane} • ${h.tier} Tier</span></a>`;
}
function initCounterPage(){
  initCommon();
  const sel = $('#enemyHero'), box=$('#counterResults');
  function run(){
    const h=getHero(sel.value) || (window.HEROES||[])[0];
    if(!box || !h) return;
    box.innerHTML = (h.counters||[]).slice(0,12).map(c => {
      const real=getHero(c.slug);
      return `<a class="mini" href="heroes/${c.slug}.html"><b>${c.name}</b><span class="pill">${c.type||'Counter'}</span><br><span class="meta">${c.reason || (real ? real.role : 'Counter pick')}</span></a>`;
    }).join('') || '<p class="meta">Select a hero.</p>';
  }
  sel && sel.addEventListener('change', run); run();
}
function initDraftPage(){
  initCommon();
  const ids=['enemyOne','enemyTwo','enemyThree'];
  function run(){
    const scores={};
    ids.map(id=>getHero($('#'+id)?.value)).filter(Boolean).forEach(enemy => (enemy.counters||[]).forEach((c,i)=>scores[c.slug]=(scores[c.slug]||0)+(12-i)));
    const results=Object.entries(scores).map(([slug,score])=>({h:getHero(slug),score})).filter(x=>x.h).sort((a,b)=>b.score-a.score).slice(0,10);
    $('#draftResults').innerHTML = results.length ? results.map(x=>`<a class="mini" href="heroes/${x.h.slug}.html"><b>${x.h.name}</b><span class="pill">Score ${x.score}</span><br><span class="meta">${x.h.role} • ${x.h.lane}</span></a>`).join('') : '<p class="meta">Select enemy heroes.</p>';
  }
  ids.forEach(id=>$('#'+id)?.addEventListener('change',run)); $('#draftBtn')?.addEventListener('click',run); run();
}
function initRankPage(){
  initCommon();
  function score(h, role, problem){
    let s=h.powerScore||70; if(role!=='Any Role' && h.lane===role)s+=16; if(h.tier==='S')s+=10; if(problem==='no-damage' && ['Marksman','Mage','Assassin'].includes(h.role))s+=10; if(problem==='too-much-dive' && ['Tank','Fighter'].includes(h.role))s+=8; return s;
  }
  function run(){
    const role=$('#mainRoleSelect')?.value||'Any Role', problem=$('#problemSelect')?.value||'bad-teammates';
    const best=[...HEROES].map(h=>({h,s:score(h,role,problem)})).sort((a,b)=>b.s-a.s).slice(0,6);
    $('#rankResults').innerHTML = `<div class="planCard"><h3>Best heroes for your climb</h3><div class="results">${best.map(x=>`<a class="mini" href="heroes/${x.h.slug}.html"><b>${x.h.name}</b><span class="pill">${Math.round(x.s)}/100</span><br><span class="meta">${x.h.role} • ${x.h.lane}</span></a>`).join('')}</div><h3>Tips</h3><ul class="list good"><li>Play around objectives, not random kills.</li><li>Clear waves before Turtle/Lord fights.</li><li>Pick simple reliable heroes when solo queue feels unstable.</li></ul></div>`;
  }
  ['rankSelect','mainRoleSelect','favoriteHeroSelect','problemSelect'].forEach(id=>$('#'+id)?.addEventListener('change',run)); $('#rankBtn')?.addEventListener('click',run); run();
}
function initPickScorePage(){
  initCommon();
  function chosen(prefix){ return [1,2,3,4,5].map(i=>getHero($('#'+prefix+i)?.value)).filter(Boolean); }
  function run(){
    const my=getHero($('#pickHero')?.value) || HEROES[0], enemies=chosen('pickEnemy'), team=chosen('team');
    let score=55+((my.powerScore||70)-70)*.4+(my.tier==='S'?10:my.tier==='A'?5:0), good=[], warn=[];
    enemies.forEach(e=>{ if((e.counters||[]).some(c=>c.slug===my.slug)){score+=10;good.push(`${my.name} is a listed answer into ${e.name}.`)} if((my.counters||[]).some(c=>c.slug===e.slug)){score-=12;warn.push(`${e.name} is dangerous into ${my.name}.`)} });
    if(team.some(h=>['Tank','Support'].includes(h.role))){score+=8;good.push('Your team has setup/protection.')} else {warn.push('Your team has little protection.')}
    score=Math.max(5,Math.min(98,Math.round(score)));
    $('#pickScoreResults').innerHTML=`<div class="matchCenter"><div class="matchScore">${score}<span>/100</span></div><p class="meta">${score>=75?'Great pick':score>=60?'Good pick':score>=45?'Risky':'Avoid'}</p></div><div class="planCard"><h3>${my.name}</h3><h3>Why it works</h3><ul class="list good">${(good.length?good:['Add more draft info for better advice.']).map(x=>`<li>${x}</li>`).join('')}</ul><h3>Warnings</h3><ul class="list bad">${(warn.length?warn:['No major warning detected.']).map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
  }
  ['pickHero',...Array.from({length:5},(_,i)=>`pickEnemy${i+1}`),...Array.from({length:5},(_,i)=>`team${i+1}`)].forEach(id=>$('#'+id)?.addEventListener('change',run)); $('#pickScoreBtn')?.addEventListener('click',run); run();
}
function initComparePage(){
  initCommon();
  function run(){
    const a=getHero($('#compareA')?.value)||HEROES[0], b=getHero($('#compareB')?.value)||HEROES[1];
    const row=(x,y,z)=>`<tr><th>${x}</th><td>${y}</td><td>${z}</td></tr>`;
    $('#compareResults').innerHTML=`<table class="compareTable"><thead><tr><th></th><th>${a.name}</th><th>${b.name}</th></tr></thead><tbody>${row('Role',a.role,b.role)}${row('Lane',a.lane,b.lane)}${row('Tier',a.tier,b.tier)}${row('Damage',a.damageProfile,b.damageProfile)}${row('Difficulty',a.difficulty,b.difficulty)}${row('Power',a.powerScore,b.powerScore)}</tbody></table>`;
  }
  ['compareA','compareB'].forEach(id=>$('#'+id)?.addEventListener('change',run)); $('#compareBtn')?.addEventListener('click',run); run();
}
function initMatchup(){
  initCommon();
  const params=new URLSearchParams(location.search); if(params.get('hero')) $('#matchHero').value=params.get('hero');
  function run(){
    const a=getHero($('#matchHero')?.value)||HEROES[0], b=getHero($('#matchEnemy')?.value)||HEROES[1];
    let s=50+((a.powerScore||70)-(b.powerScore||70))*.35; if((b.counters||[]).some(c=>c.slug===a.slug))s+=20; if((a.counters||[]).some(c=>c.slug===b.slug))s-=20; s=Math.max(5,Math.min(95,Math.round(s)));
    $('#matchupResults').innerHTML=`<section class="matchupGrid"><article class="matchCard"><div class="matchHead"><div class="matchPortrait"></div><div><h2>${a.name}</h2><p class="meta">${a.role} • ${a.lane}</p></div></div></article><article class="matchCenter"><div class="matchScore">${s}<span>/100</span></div><p class="meta">${s>=70?'Favored':s>=50?'Skill matchup':'Hard matchup'}</p></article><article class="matchCard"><div class="matchHead"><div><h2>${b.name}</h2><p class="meta">${b.role} • ${b.lane}</p></div></div></article></section><section class="cols"><div class="detail"><h2>How to play</h2><ul class="list good"><li>Track key enemy cooldowns before fighting.</li><li>Play around your core item timing.</li><li>Turn kills into Turtle, Lord, turret or jungle control.</li></ul></div><div class="detail"><h2>What to avoid</h2><ul class="list bad"><li>Do not fight with important skills on cooldown.</li><li>Do not stand in obvious engage range.</li></ul></div></section>`;
  }
  ['matchHero','matchEnemy'].forEach(id=>$('#'+id)?.addEventListener('change',run)); $('#matchupBtn')?.addEventListener('click',run); run();
}
function initFavoritesPage(){ initCommon(); renderFavorites(); }

/* ===== Full feature upgrade: smarter tools + favorites preview ===== */
function getAdvanced(h){ return (window.ADVANCED_GUIDES || {})[h?.slug] || {}; }
function roleType(h){
  if(!h) return {};
  const role = h.role || '';
  return {
    frontline: ['Tank','Fighter'].includes(role),
    damage: ['Marksman','Mage','Assassin','Fighter'].includes(role),
    cc: ['Tank','Mage','Support'].includes(role),
    sustain: ['Tank','Fighter','Support'].includes(role),
    burst: ['Assassin','Mage'].includes(role)
  };
}
function teamBalanceScore(team){
  const flags = team.map(roleType);
  let score = 50, notes = [], warnings = [];
  if(flags.some(x=>x.frontline)){ score += 12; notes.push('Team has frontline presence.'); } else { score -= 12; warnings.push('No clear frontline detected.'); }
  if(flags.some(x=>x.damage)){ score += 10; notes.push('Team has reliable damage.'); } else { score -= 10; warnings.push('Low damage draft.'); }
  if(flags.some(x=>x.cc)){ score += 8; notes.push('Team has crowd-control/setup.'); } else { score -= 8; warnings.push('Low crowd-control; fights may be harder to start.'); }
  if(team.filter(h=>h.role==='Marksman').length > 1){ score -= 8; warnings.push('Too many marksmen can make the draft fragile.'); }
  if(team.filter(h=>h.lane).length !== new Set(team.map(h=>h.lane)).size){ score -= 6; warnings.push('Possible lane overlap detected.'); }
  return {score:Math.max(0,Math.min(100,score)), notes, warnings};
}
function improvedCounterReason(enemy, counter){
  const cRole = counter.role || '', eRole = enemy.role || '';
  if(cRole === 'Tank') return `${counter.name} can absorb pressure and provide CC/vision against ${enemy.name}.`;
  if(cRole === 'Assassin' && ['Marksman','Mage'].includes(eRole)) return `${counter.name} can punish ${enemy.name} if they misposition.`;
  if(cRole === 'Mage') return `${counter.name} can control space and punish ${enemy.name}'s approach.`;
  if(cRole === 'Fighter') return `${counter.name} can contest side pressure and survive extended trades.`;
  if(cRole === 'Marksman') return `${counter.name} can scale and shred frontline if protected.`;
  return `${counter.name} is a useful answer depending on draft and positioning.`;
}

function initCounterPage(){
  initCommon();
  const sel = $('#enemyHero'), box=$('#counterResults');
  function run(){
    const enemy=getHero(sel?.value) || HEROES[0];
    if(!box || !enemy) return;
    box.innerHTML = (enemy.counters||[]).slice(0,12).map((c,i)=>{
      const real=getHero(c.slug) || c;
      const stars = i < 3 ? '⭐⭐⭐⭐⭐' : i < 7 ? '⭐⭐⭐⭐' : '⭐⭐⭐';
      const reason = c.reason || improvedCounterReason(enemy, real);
      return `<a class="mini counterRating" href="heroes/${c.slug}.html"><b>${c.name}</b><span class="pill">${stars}</span><br><span class="meta">${reason}</span></a>`;
    }).join('') || '<p class="meta">Select a hero.</p>';
  }
  sel && sel.addEventListener('change', run); run();
}

function initDraftPage(){
  initCommon();
  const ids=['enemyOne','enemyTwo','enemyThree'];
  function run(){
    const enemies = ids.map(id=>getHero($('#'+id)?.value)).filter(Boolean);
    const scores={};
    enemies.forEach(enemy => (enemy.counters||[]).forEach((c,i)=>scores[c.slug]=(scores[c.slug]||0)+(14-i)));
    let results=Object.entries(scores).map(([slug,score])=>({h:getHero(slug),score})).filter(x=>x.h);
    results = results.map(x=>{ if(x.h.role==='Tank') x.score += 5; if(['Marksman','Mage','Assassin'].includes(x.h.role)) x.score += 3; return x; }).sort((a,b)=>b.score-a.score).slice(0,10);
    const warning = enemies.length ? `<div class="note"><b>Draft warning:</b> If your team has no frontline, prioritize Tank/Fighter. If your team has no backline damage, prioritize Marksman/Mage.</div>` : '';
    $('#draftResults').innerHTML = results.length ? warning + results.map(x=>`<a class="mini" href="heroes/${x.h.slug}.html"><b>${x.h.name}</b><span class="pill">Synergy ${Math.round(x.score)}</span><br><span class="meta">${x.h.role} • ${x.h.lane} • ${getAdvanced(x.h).positioning || 'Play around team timing.'}</span></a>`).join('') : '<p class="meta">Select enemy heroes.</p>';
  }
  ids.forEach(id=>$('#'+id)?.addEventListener('change',run)); $('#draftBtn')?.addEventListener('click',run); run();
}

function initPickScorePage(){
  initCommon();
  function chosen(prefix){ return [1,2,3,4,5].map(i=>getHero($('#'+prefix+i)?.value)).filter(Boolean); }
  function run(){
    const my=getHero($('#pickHero')?.value) || HEROES[0], enemies=chosen('pickEnemy'), team=chosen('team').filter(h=>h.slug!==my.slug);
    let score=55+((my.powerScore||70)-70)*.45+(my.tier==='S'?10:my.tier==='A'?5:0);
    let good=[], warn=[];
    enemies.forEach(e=>{
      if((e.counters||[]).some(c=>c.slug===my.slug)){score+=10;good.push(`${my.name} is listed as a strong answer into ${e.name}.`)}
      if((my.counters||[]).some(c=>c.slug===e.slug)){score-=12;warn.push(`${e.name} is dangerous into ${my.name}.`)}
      if(e.role==='Assassin' && my.role==='Marksman'){score-=6;warn.push(`Enemy ${e.name} can dive marksmen, so you need peel and safe positioning.`)}
    });
    const fullTeam = [my, ...team];
    const balance = teamBalanceScore(fullTeam);
    score += (balance.score - 50) * .35;
    good.push(...balance.notes);
    warn.push(...balance.warnings);
    const flags = fullTeam.map(roleType);
    if(flags.some(x=>x.cc)) good.push('Your draft has CC presence for pickoffs/teamfights.');
    if(flags.some(x=>x.frontline)) good.push('Frontline detection passed.');
    if(!flags.some(x=>x.frontline)) warn.push('Frontline detection failed: your carry may be exposed.');
    score=Math.max(5,Math.min(98,Math.round(score)));
    $('#pickScoreResults').innerHTML=`<div class="matchCenter"><div class="matchScore">${score}<span>/100</span></div><p class="meta">${score>=80?'Great pick':score>=65?'Good pick':score>=45?'Playable but risky':'Avoid'}</p></div><div class="planCard"><h3>${my.name}</h3><h3>Why it works</h3><ul class="list good">${(good.length?good:['Add more draft info for better advice.']).slice(0,8).map(x=>`<li>${x}</li>`).join('')}</ul><h3>Warnings</h3><ul class="list bad">${(warn.length?warn:['No major warning detected.']).slice(0,8).map(x=>`<li>${x}</li>`).join('')}</ul><h3>Quick plan</h3><p class="meta">${getAdvanced(my).positioning || 'Play around objective timing and positioning.'}</p></div>`;
  }
  ['pickHero',...Array.from({length:5},(_,i)=>`pickEnemy${i+1}`),...Array.from({length:5},(_,i)=>`team${i+1}`)].forEach(id=>$('#'+id)?.addEventListener('change',run)); $('#pickScoreBtn')?.addEventListener('click',run); run();
}

function renderHomeFavorites(){
  const box = $('#homeFavoriteRail'); if(!box) return;
  const saved = favs().map(getHero).filter(Boolean);
  box.innerHTML = saved.length ? saved.map(h=>`<a class="railCard" href="heroes/${h.slug}.html"><div class="railThumb"></div><div class="railMeta"><b>${h.name}</b><span>${h.role} • ${h.lane}</span></div></a>`).join('') : '<p class="meta">No favorites yet. Open a hero page and tap save.</p>';
}
if (typeof toggleFav === 'function') {
  const oldToggleFav = toggleFav;
  toggleFav = function(slug){ oldToggleFav(slug); renderHomeFavorites(); };
}
if (typeof initHome === 'function') {
  const oldInitHome = initHome;
  initHome = function(){ oldInitHome(); renderHomeFavorites(); };
}


/* Clean skill system helper: official names hidden intentionally */
function renderCleanSkillCards(hero){
  const data = (window.CLEAN_SKILLS || {})[hero?.slug];
  if(!data) return '';
  return data.skills.map(s => `
    <article class="cleanSkillCard">
      <div class="skillSlot">${s.slot}</div>
      <div>
        <span class="typeBadge">Type: ${s.type}</span>
        <p class="meta"><b>Use:</b> ${s.use}</p>
      </div>
    </article>`).join('');
}

/* ===== Pro Matchup Tool Upgrade ===== */
function matchupRoleType(h){
  const role = h?.role || '';
  return {
    frontline: ['Tank','Fighter'].includes(role),
    backline: ['Marksman','Mage','Support'].includes(role),
    burst: ['Assassin','Mage'].includes(role),
    dps: ['Marksman','Fighter'].includes(role),
    cc: ['Tank','Mage','Support'].includes(role),
    sustain: ['Tank','Fighter','Support'].includes(role),
    mobile: ['Assassin','Fighter'].includes(role),
    fragile: ['Marksman','Mage','Assassin'].includes(role)
  };
}
function matchupScoreDetailed(hero, enemy){
  let score = 50 + ((hero.powerScore || 70) - (enemy.powerScore || 70)) * 0.35;
  const good = [], bad = [], interactions = [];

  if((enemy.counters || []).some(c => c.slug === hero.slug)){
    score += 20;
    good.push(`${hero.name} is listed as a strong answer into ${enemy.name}.`);
  }
  if((hero.counters || []).some(c => c.slug === enemy.slug)){
    score -= 22;
    bad.push(`${enemy.name} appears as a counter threat against ${hero.name}.`);
  }

  const h = matchupRoleType(hero), e = matchupRoleType(enemy);

  if(h.frontline && e.burst){
    score += 7;
    good.push(`${hero.name} can survive some burst pressure if played patiently.`);
  }
  if(h.fragile && e.burst){
    score -= 8;
    bad.push(`${enemy.name} has burst threat, so ${hero.name} can be punished if mispositioned.`);
  }
  if(h.backline && e.mobile){
    score -= 7;
    bad.push(`${enemy.name} can reach backline heroes if vision is weak.`);
  }
  if(h.cc && e.mobile){
    score += 6;
    good.push(`${hero.name} has control tools that can punish mobility heroes.`);
  }
  if(h.dps && e.frontline){
    score += 5;
    good.push(`${hero.name} can win extended fights if protected and allowed to DPS.`);
  }

  if(hero.lane === enemy.lane){
    score += 3;
    interactions.push(`Same lane pressure: this matchup may affect early wave control directly.`);
  } else {
    interactions.push(`Different lane matchup: impact depends on rotations, objectives and team fights.`);
  }

  if(enemy.role === 'Tank') interactions.push(`${enemy.name} can start fights; watch engage range and fog-of-war angles.`);
  if(enemy.role === 'Assassin') interactions.push(`${enemy.name} wants isolated targets; stay near vision and teammates.`);
  if(enemy.role === 'Mage') interactions.push(`${enemy.name} can punish grouped enemies; avoid predictable choke points.`);
  if(enemy.role === 'Marksman') interactions.push(`${enemy.name} scales with items; punish before late game if possible.`);

  score = Math.max(5, Math.min(95, Math.round(score)));
  return {score, good, bad, interactions};
}
function matchupBadge(score){
  if(score >= 75) return {text:'Favored Matchup', cls:'goodMatch'};
  if(score >= 58) return {text:'Slightly Favored', cls:'softGoodMatch'};
  if(score >= 43) return {text:'Skill Matchup', cls:'skillMatch'};
  if(score >= 28) return {text:'Hard Matchup', cls:'hardMatch'};
  return {text:'Very Hard Matchup', cls:'veryHardMatch'};
}
function matchupHeroImage(hero){
  const local = window.LOCAL_IMAGES?.heroes?.[hero.name];
  if(local) return local;
  return (window.HERO_IMAGES && HERO_IMAGES[hero.name]) || '';
}

function matchupBuildAdvice(hero, enemy){
  const advice = [];
  const enemyRole = enemy.role || '';
  const enemyDamage = (enemy.damageProfile || '').toLowerCase();

  if(enemyRole === 'Mage' || enemyDamage.includes('magic')){
    advice.push('Consider magic defense when enemy magic burst/control becomes a problem.');
    advice.push('Do not group tightly if the enemy mage has big area damage.');
  }
  if(enemyRole === 'Assassin'){
    advice.push('Prioritize survival, vision and defensive timing against assassin dive.');
    advice.push('Stay near peel or save your escape/CC until the assassin commits.');
  }
  if(enemyRole === 'Marksman'){
    advice.push('Pressure early objectives before the enemy marksman reaches full item scaling.');
    advice.push('Use bushes and engage timing to avoid free DPS from the enemy marksman.');
  }
  if(enemyRole === 'Tank'){
    advice.push('Do not waste all damage on the tank unless it gives Turtle, Lord or turret control.');
    advice.push('Watch for engage tools before walking into river or jungle choke points.');
  }
  if(hero.role === 'Marksman') advice.push('Keep a safe backline angle and hit the closest safe target.');
  if(hero.role === 'Tank') advice.push('Check bushes first and make sure teammates are close before committing.');
  if(hero.role === 'Assassin') advice.push('Wait for enemy CC/escape skills before diving the backline.');

  return [...new Set(advice)].slice(0,5);
}
function matchupHowToWin(hero, enemy, score){
  const tips = [];
  if(score < 45){
    tips.push('Play defensive early and avoid ego fights.');
    tips.push('Only fight when teammates are close or enemy key skills are on cooldown.');
  } else {
    tips.push('Use your power spike to pressure objectives, not random kills.');
  }
  tips.push(`Track ${enemy.name}'s most dangerous engage or burst window.`);
  tips.push(`Play around ${hero.name}'s core item and strongest fight timing.`);
  if(hero.lane === 'Jungle') tips.push('Prioritize Turtle/Lord timing and do not overchase before objectives.');
  if(hero.lane === 'Gold') tips.push('Farm safely, then fight behind frontline once core items are ready.');
  if(hero.lane === 'Mid') tips.push('Clear wave first, then rotate with roam for safer pressure.');
  if(hero.lane === 'Roam') tips.push('Give vision and protect your strongest damage dealer.');
  if(hero.lane === 'Exp') tips.push('Manage side wave before joining objective fights.');
  return tips.slice(0,6);
}
function matchupPlaystyle(hero, enemy, score){
  if(score >= 70) return 'Aggressive but disciplined: pressure the enemy, then convert fights into turret, Turtle, Lord or jungle control.';
  if(score >= 50) return 'Balanced: trade carefully, wait for cooldown mistakes, and fight when your team can follow.';
  return 'Defensive / punish style: avoid solo fights, play around vision, and wait for team setup before committing.';
}
function statBar(label, value){
  value = Math.max(5, Math.min(100, Math.round(value)));
  return `<div class="miniStat"><span>${label}</span><div class="miniStatLine"><b style="width:${value}%"></b></div><em>${value}</em></div>`;
}
function matchupStats(hero, enemy){
  const h = matchupRoleType(hero), e = matchupRoleType(enemy);
  const damage = hero.role === 'Marksman' ? 88 : hero.role === 'Assassin' ? 92 : hero.role === 'Mage' ? 85 : hero.role === 'Fighter' ? 78 : 55;
  const survival = h.frontline ? 85 : h.sustain ? 70 : 45;
  const mobility = h.mobile ? 85 : hero.role === 'Marksman' ? 52 : 58;
  const cc = h.cc ? 78 : 38;
  const risk = e.burst || e.mobile ? 76 : e.cc ? 68 : 48;
  return [
    statBar('Damage', damage),
    statBar('Survival', survival),
    statBar('Mobility', mobility),
    statBar('CC / Setup', cc),
    statBar('Risk vs Enemy', risk)
  ].join('');
}
function initMatchup(){
  initCommon();

  const params = new URLSearchParams(location.search);
  if(params.get('hero') && $('#matchHero')) $('#matchHero').value = params.get('hero');
  if(params.get('enemy') && $('#matchEnemy')) $('#matchEnemy').value = params.get('enemy');

  function run(){
    const hero = getHero($('#matchHero')?.value) || HEROES[0];
    const enemy = getHero($('#matchEnemy')?.value) || HEROES[1];
    const data = matchupScoreDetailed(hero, enemy);
    const badge = matchupBadge(data.score);
    const winTips = matchupHowToWin(hero, enemy, data.score);
    const buildAdvice = matchupBuildAdvice(hero, enemy);
    const playstyle = matchupPlaystyle(hero, enemy, data.score);

    $('#matchupResults').innerHTML = `
      <section class="proMatchupResult">
        <article class="proMatchHero">
          <div class="matchPortrait">${smallHeroPortrait(hero)}</div>
          <div>
            <span class="tier tier${hero.tier || 'A'}">${hero.tier || 'A'} Tier</span>
            <h2>${hero.name}</h2>
            <p class="meta">${hero.role} • ${hero.lane}</p>
          </div>
        </article>

        <article class="proScoreCard ${badge.cls}">
          <span class="matchBadge">${badge.text}</span>
          <div class="scoreNumber">${data.score}<span>/100</span></div>
          <p class="meta">${data.score >= 50 ? 'Playable if you follow the right plan.' : 'Difficult. Play with patience and team support.'}</p>
        </article>

        <article class="proMatchHero enemyHero">
          <div class="matchPortrait">${smallHeroPortrait(enemy)}</div>
          <div>
            <span class="tier tier${enemy.tier || 'A'}">${enemy.tier || 'A'} Tier</span>
            <h2>${enemy.name}</h2>
            <p class="meta">${enemy.role} • ${enemy.lane}</p>
          </div>
        </article>
      </section>

      <section class="proMatchSections">
        <div class="detail">
          <h2>Why this matchup?</h2>
          <ul class="list good">${(data.good.length ? data.good : [`${hero.name} can still win through timing, positioning and objective control.`]).map(x=>`<li>${x}</li>`).join('')}</ul>
          <ul class="list bad">${(data.bad.length ? data.bad : ['No major direct counter warning detected from the current project data.']).map(x=>`<li>${x}</li>`).join('')}</ul>
        </div>

        <div class="detail">
          <h2>How to win</h2>
          <ul class="list good">${winTips.map(x=>`<li>${x}</li>`).join('')}</ul>
        </div>

        <div class="detail">
          <h2>Skill interaction</h2>
          <ul class="list">${data.interactions.map(x=>`<li>${x}</li>`).join('')}</ul>
        </div>

        <div class="detail">
          <h2>Build advice</h2>
          <ul class="list">${buildAdvice.map(x=>`<li>${x}</li>`).join('')}</ul>
        </div>

        <div class="detail">
          <h2>Playstyle switch</h2>
          <p class="meta">${playstyle}</p>
          <div class="note"><b>Rule:</b> Bad matchup does not mean impossible. It means you need better timing, spacing and teamfight patience.</div>
        </div>

        <div class="detail">
          <h2>Mini stats</h2>
          <div class="miniStats">${matchupStats(hero, enemy)}</div>
        </div>
      </section>
    `;
  }

  ['matchHero','matchEnemy'].forEach(id => $('#'+id)?.addEventListener('change', run));
  $('#matchupBtn')?.addEventListener('click', run);
  run();
}







/* ===== Expert Duo Override Upgrade ===== */

function synergyCard(item){
  const hero = getHero(item.slug) || item;
  const source = item.source ? `<strong>${item.source}</strong>` : '';
  return `<a class="synergyCard ${item.source ? 'expertDuoCard' : ''}" href="heroes/${item.slug}.html">
    <div class="synergyPortrait">${synergyHeroImage(hero)}</div>
    <div>
      <b>${item.name}</b>
      <span>${item.role || hero.role} • ${item.lane || hero.lane} • ${item.tier || hero.tier || 'A'} Tier</span>
      <div class="synergyScore"><i style="width:${item.score || 70}%"></i></div>
      <em>${item.score || 70}/100 synergy ${source}</em>
      <p>${item.reason || 'Good role balance and team-fight value.'}</p>
    </div>
  </a>`;
}
function mergeSynergyGroups(hero){
  const generated = (window.SYNERGY || {})[hero.slug] || {};
  const expert = (window.SYNERGY_OVERRIDES || {})[hero.slug] || [];
  const groups = {};

  if(expert.length){
    groups['🔥 Expert Duo Picks'] = expert.slice().sort((a,b)=>(b.score||0)-(a.score||0));
  }

  Object.entries(generated).forEach(([title, arr]) => {
    const expertSlugs = new Set(expert.map(x=>x.slug));
    groups[title] = (arr || []).filter(x => !expertSlugs.has(x.slug));
  });

  return groups;
}
function initSynergyPage(){
  initCommon();
  const params = new URLSearchParams(location.search);
  if(params.get('hero') && $('#synergyHero')) $('#synergyHero').value = params.get('hero');

  function run(){
    const hero = getHero($('#synergyHero')?.value) || HEROES[0];
    const groups = mergeSynergyGroups(hero);
    const box = $('#synergyResults');
    if(!box) return;

    const groupHtml = Object.entries(groups).map(([title, arr]) => `
      <section class="detail synergyGroup ${title.includes('Expert') ? 'expertDuoGroup' : ''}">
        <h2>${title}</h2>
        <div class="synergyGrid">${(arr || []).slice(0, title === 'All Recommendations' ? 12 : 6).map(synergyCard).join('') || '<p class="meta">No heroes found for this group.</p>'}</div>
      </section>
    `).join('');

    box.innerHTML = `
      <section class="proSynergyHeader">
        <div class="synergyMainHero">
          <div class="synergyPortrait big">${synergyHeroImage(hero)}</div>
          <div>
            <span class="badge">Selected Hero</span>
            <h2>${hero.name}</h2>
            <p class="meta">${hero.role} • ${hero.lane} • ${hero.tier || 'A'} Tier</p>
          </div>
        </div>
        <div class="note"><b>How this works:</b> Expert Duo Picks are curated combo recommendations. Other sections are calculated using role, lane, frontline, damage, CC, setup and lane-conflict logic. Edit <b>data/synergy-overrides.js</b> to add your own experience-based duos.</div>
      </section>
      ${groupHtml}
    `;
  }

  $('#synergyHero')?.addEventListener('change', run);
  $('#synergyBtn')?.addEventListener('click', run);
  run();
}


/* ===== Rank Helper Fixed + Smarter Logic ===== */
function rankLaneValue(){
  const v = $('#mainRoleSelect')?.value || 'Any Lane';
  return v === 'Any Role' ? 'Any Lane' : v;
}
function rankProblemText(problem){
  return ({
    'losing-lane': 'Losing lane',
    'bad-teammates': 'Bad teammates',
    'no-roam': 'No roam/support',
    'no-damage': 'Team has no damage',
    'too-much-dive': 'Enemy dives me',
    'late-game-throw': 'Throwing late game',
    'cant-carry': 'I cannot carry alone',
    'stuck-rank': 'Stuck in same rank'
  })[problem] || problem;
}
function rankScoreHero(h, lane, problem, favoriteSlug, rank){
  let s = h.powerScore || 70;

  // exact lane match now works with Gold Lane / Mid Lane / EXP Lane
  if(lane !== 'Any Lane' && h.lane === lane) s += 22;
  if(lane !== 'Any Lane' && h.lane !== lane) s -= 8;

  if(h.tier === 'S') s += 10;
  if(h.tier === 'A') s += 5;
  if(h.slug === favoriteSlug) s += 16;

  // rank-based: lower ranks benefit from easier and durable heroes
  if(['Warrior','Elite','Master','Grandmaster','Epic'].includes(rank)){
    if(h.difficulty === 'Easy') s += 10;
    if(h.difficulty === 'Hard') s -= 7;
    if(['Fighter','Tank','Marksman'].includes(h.role)) s += 4;
  }

  // problem-based logic
  if(problem === 'no-damage' && ['Marksman','Mage','Assassin'].includes(h.role)) s += 14;
  if(problem === 'too-much-dive' && ['Tank','Fighter','Support'].includes(h.role)) s += 14;
  if(problem === 'no-roam' && ['Tank','Support','Fighter'].includes(h.role)) s += 12;
  if(problem === 'bad-teammates' && ['Fighter','Marksman','Mage'].includes(h.role)) s += 8;
  if(problem === 'losing-lane' && ['Fighter','Marksman','Mage'].includes(h.role)) s += 7;
  if(problem === 'late-game-throw' && ['Marksman','Mage','Tank'].includes(h.role)) s += 8;
  if(problem === 'cant-carry' && ['Marksman','Assassin','Fighter','Mage'].includes(h.role)) s += 10;
  if(problem === 'stuck-rank' && h.difficulty !== 'Hard') s += 8;

  return Math.max(1, Math.round(s));
}
function rankPlanTips(rank, lane, problem){
  const tips = [];
  if(problem === 'losing-lane'){
    tips.push('Do not force early trades. Clear wave safely and wait for item/level timing.');
    tips.push('Track enemy roam/jungle before pushing lane.');
  }
  if(problem === 'bad-teammates'){
    tips.push('Play around the teammate who is performing best, not the loudest teammate.');
    tips.push('Pick heroes that can clear waves and take objectives without perfect team support.');
  }
  if(problem === 'no-roam'){
    tips.push('Avoid blind river/jungle walks. Use safer wave clear and wait for enemy mistakes.');
    tips.push('Choose heroes with self-peel, sustain or safer positioning.');
  }
  if(problem === 'no-damage'){
    tips.push('Prioritize reliable damage heroes, but do not ignore positioning and farming.');
  }
  if(problem === 'too-much-dive'){
    tips.push('Stay near CC/frontline and save escape/peel skills until divers commit.');
    tips.push('Defensive item timing can be more valuable than one extra damage item.');
  }
  if(problem === 'late-game-throw'){
    tips.push('After winning a fight, take Lord/turret/objective instead of chasing.');
    tips.push('Do not face-check bushes after 12 minutes.');
  }
  if(problem === 'cant-carry'){
    tips.push('Pick heroes with objective pressure and wave clear, not only kill potential.');
  }
  if(problem === 'stuck-rank'){
    tips.push('Use 2–3 comfort heroes only. Stop changing heroes every game.');
    tips.push('Review deaths first; fewer deaths usually means more comeback chances.');
  }

  if(lane === 'Gold Lane') tips.push('Gold lane rule: farm safely first, carry fights after core items.');
  if(lane === 'Jungle') tips.push('Jungle rule: Turtle/Lord tempo matters more than random kills.');
  if(lane === 'Mid Lane') tips.push('Mid rule: clear wave first, rotate with roam/jungle.');
  if(lane === 'EXP Lane') tips.push('EXP rule: manage side wave before joining objective fights.');
  if(lane === 'Roam') tips.push('Roam rule: vision and setup win games, not random solo fights.');

  if(['Epic','Legend'].includes(rank)) tips.push('Draft safely and avoid first-picking heroes that are easy to counter.');
  if(rank.includes('Mythic')) tips.push('Punish cooldowns, rotate for objectives, and track enemy power spikes.');

  return [...new Set(tips)].slice(0,7);
}
function rankProblemWarnings(problem){
  const warnings = [];
  if(problem === 'bad-teammates') warnings.push('Do not type too much; it usually makes the team worse.');
  if(problem === 'too-much-dive') warnings.push('Avoid standing alone in side lanes after mid game.');
  if(problem === 'late-game-throw') warnings.push('One late death can lose Lord/base. Play slower when ahead.');
  if(problem === 'no-damage') warnings.push('Do not pick another tank/support if your team already lacks damage.');
  if(problem === 'no-roam') warnings.push('Do not expect protection; position as if enemies can always dive.');
  return warnings.length ? warnings : ['Avoid tilt queue after 3 losses in a row. Take a short break.'];
}
function initRankPage(){
  initCommon();

  function run(){
    const rank = $('#rankSelect')?.value || 'Epic';
    const lane = rankLaneValue();
    const favoriteSlug = $('#favoriteHeroSelect')?.value || '';
    const problem = $('#problemSelect')?.value || 'bad-teammates';

    const scored = (window.HEROES || [])
      .map(h => ({h, s: rankScoreHero(h, lane, problem, favoriteSlug, rank)}))
      .sort((a,b) => b.s - a.s)
      .slice(0, 10);

    const tips = rankPlanTips(rank, lane, problem);
    const warnings = rankProblemWarnings(problem);
    const fav = favoriteSlug ? getHero(favoriteSlug) : null;

    const selectedInfo = `
      <div class="rankSummary">
        <div><b>Rank</b><span>${rank}</span></div>
        <div><b>Lane</b><span>${lane}</span></div>
        <div><b>Problem</b><span>${rankProblemText(problem)}</span></div>
        <div><b>Favorite</b><span>${fav ? fav.name : 'Not selected'}</span></div>
      </div>
    `;

    const heroCards = scored.map((x, i) => `
      <a class="mini rankHeroPick" href="heroes/${x.h.slug}.html">
        <b>${i+1}. ${x.h.name}</b>
        <span class="pill">${x.s}/100</span><br>
        <span class="meta">${x.h.role} • ${x.h.lane} • ${x.h.tier || 'A'} Tier • ${x.h.difficulty}</span>
      </a>
    `).join('');

    const box = $('#rankResults');
    if(!box) return;
    box.innerHTML = `
      <div class="planCard rankPlanCard">
        <h3>Your climb setup</h3>
        ${selectedInfo}
        <h3>Best heroes for this situation</h3>
        <div class="results">${heroCards}</div>

        <section class="rankAdviceGrid">
          <div class="detail">
            <h2>Climb plan</h2>
            <ul class="list good">${tips.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>
          <div class="detail">
            <h2>Warnings</h2>
            <ul class="list bad">${warnings.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>
        </section>

        <div class="note"><b>How it calculates:</b> This tool now checks exact lane, rank, difficulty, tier, favorite hero, and your selected problem. Changing lane/problem should change the recommendations.</div>
      </div>
    `;
  }

  ['rankSelect','mainRoleSelect','favoriteHeroSelect','problemSelect'].forEach(id => $('#'+id)?.addEventListener('change', run));
  $('#rankBtn')?.addEventListener('click', run);
  run();
}


/* ===== Matchup image fallback fix ===== */
function robustHeroImage(hero){
  if(!hero) return '';
  const online = (window.HERO_IMAGES && HERO_IMAGES[hero.name]) || `https://mobile-legends.fandom.com/wiki/Special:FilePath/${encodeURIComponent(hero.name.replaceAll(' ','_'))}.png`;
  const local = window.LOCAL_IMAGES?.heroes?.[hero.name];

  // Important:
  // Local images are optional. If local assets are missing, use online image first for visible portraits.
  // Users can later change this priority after adding real local image files.
  return online || local || '';
}

function smallHeroPortrait(hero){
  const src = robustHeroImage(hero);
  const initials = (hero?.name || 'Hero').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();
  if(!src) return `<div class="portraitFallback">${initials}</div>`;
  return `<img src="${src}" alt="${hero.name}" loading="lazy" onerror="this.remove(); this.parentElement.classList.add('imageMissing'); this.parentElement.innerHTML='<div class=&quot;portraitFallback&quot;>${initials}</div>'; ">`;
}

function synergyHeroImage(hero){
  const src = robustHeroImage(hero);
  const initials = (hero?.name || 'Hero').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();
  if(!src) return `<div class="portraitFallback">${initials}</div>`;
  return `<img src="${src}" alt="${hero.name}" loading="lazy" onerror="this.remove(); this.parentElement.classList.add('imageMissing'); this.parentElement.innerHTML='<div class=&quot;portraitFallback&quot;>${initials}</div>'; ">`;
}



/* ===== Searchable Select Upgrade - Mouse Fixed ===== */
function enhanceSearchableSelects(root=document){
  const selects = Array.from(root.querySelectorAll('select')).filter(sel => {
    if(sel.dataset.searchEnhanced === '1') return false;
    if(sel.closest('.searchSelectWrap')) return false;
    if(sel.options.length < 8) return false;
    return true;
  });

  selects.forEach(select => {
    select.dataset.searchEnhanced = '1';

    const wrap = document.createElement('div');
    wrap.className = 'searchSelectWrap';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'searchSelectButton';
    btn.innerHTML = `<span>${select.options[select.selectedIndex]?.text || 'Select'}</span><b>⌕</b>`;
    wrap.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'searchSelectPanel';
    panel.innerHTML = `<input class="searchSelectInput" type="text" placeholder="Search hero..." autocomplete="off"><div class="searchSelectList"></div>`;
    wrap.appendChild(panel);

    const input = panel.querySelector('.searchSelectInput');
    const list = panel.querySelector('.searchSelectList');
    let activeIndex = 0;
    let currentOptions = [];

    function getOptions(){
      return Array.from(select.options).map(opt => ({value: opt.value, text: opt.text}));
    }

    function setActive(index){
      const items = Array.from(list.querySelectorAll('.searchSelectOption'));
      items.forEach(x => x.classList.remove('active'));
      if(items[index]){
        items[index].classList.add('active');
        items[index].scrollIntoView({block:'nearest'});
      }
    }

    function render(filter=''){
      const q = filter.trim().toLowerCase();
      currentOptions = getOptions()
        .filter(o => !q || o.text.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q))
        .slice(0, 80);

      if(activeIndex >= currentOptions.length) activeIndex = Math.max(0, currentOptions.length - 1);

      list.innerHTML = currentOptions.length
        ? currentOptions.map((o, i) => `<button type="button" class="searchSelectOption ${o.value === select.value ? 'selected' : ''} ${i === activeIndex ? 'active' : ''}" data-value="${String(o.value).replaceAll('"','&quot;')}">${o.text}</button>`).join('')
        : `<div class="searchSelectEmpty">No hero found</div>`;
    }

    function open(){
      document.querySelectorAll('.searchSelectWrap.open').forEach(w => {
        if(w !== wrap) w.classList.remove('open');
      });
      wrap.classList.add('open');
      activeIndex = Math.max(0, getOptions().findIndex(o => o.value === select.value));
      input.value = '';
      render('');
      setTimeout(() => input.focus(), 10);
    }

    function close(){
      wrap.classList.remove('open');
    }

    function choose(value){
      select.value = value;
      btn.querySelector('span').textContent = select.options[select.selectedIndex]?.text || 'Select';
      select.dispatchEvent(new Event('input', {bubbles:true}));
      select.dispatchEvent(new Event('change', {bubbles:true}));
      close();
    }

    btn.addEventListener('click', e => {
      e.preventDefault();
      wrap.classList.contains('open') ? close() : open();
    });

    input.addEventListener('input', () => {
      activeIndex = 0;
      render(input.value);
    });

    // Stable mouse support: do not re-render on hover/click.
    list.addEventListener('mousemove', e => {
      const item = e.target.closest('.searchSelectOption');
      if(!item) return;
      const items = Array.from(list.querySelectorAll('.searchSelectOption'));
      const index = items.indexOf(item);
      if(index >= 0 && index !== activeIndex){
        activeIndex = index;
        setActive(activeIndex);
      }
    });

    // mousedown fires before blur/close and is more reliable than click for dropdowns.
    list.addEventListener('mousedown', e => {
      const item = e.target.closest('.searchSelectOption');
      if(!item) return;
      e.preventDefault();
      choose(item.dataset.value);
    });

    input.addEventListener('keydown', e => {
      const items = Array.from(list.querySelectorAll('.searchSelectOption'));
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        activeIndex = Math.min(items.length - 1, activeIndex + 1);
        setActive(activeIndex);
      } else if(e.key === 'ArrowUp'){
        e.preventDefault();
        activeIndex = Math.max(0, activeIndex - 1);
        setActive(activeIndex);
      } else if(e.key === 'Enter'){
        e.preventDefault();
        const item = items[activeIndex];
        if(item) choose(item.dataset.value);
      } else if(e.key === 'Escape'){
        e.preventDefault();
        close();
        btn.focus();
      }
    });

    select.addEventListener('change', () => {
      btn.querySelector('span').textContent = select.options[select.selectedIndex]?.text || 'Select';
    });
  });
}

document.addEventListener('click', e => {
  if(!e.target.closest('.searchSelectWrap')){
    document.querySelectorAll('.searchSelectWrap.open').forEach(w => w.classList.remove('open'));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => enhanceSearchableSelects(), 100);
  setTimeout(() => enhanceSearchableSelects(), 600);
});

(function(){
  const names = ['initHome','initCounterPage','initDraftPage','initRankPage','initPickScorePage','initComparePage','initMatchup','initSynergyPage','initFavoritesPage'];
  setTimeout(() => {
    names.forEach(name => {
      const old = window[name];
      if(typeof old === 'function' && !old.__searchWrapped){
        const wrapped = function(){
          const result = old.apply(this, arguments);
          setTimeout(() => enhanceSearchableSelects(), 80);
          setTimeout(() => enhanceSearchableSelects(), 350);
          return result;
        };
        wrapped.__searchWrapped = true;
        window[name] = wrapped;
      }
    });
  }, 0);
})();


/* ===== Matchup Your/Enemy Labels JS-safe Fix ===== */
function applyMatchupLabels(){
  const heroSelect = document.getElementById('matchHero') || document.getElementById('hero1Select');
  const enemySelect = document.getElementById('matchEnemy') || document.getElementById('hero2Select');

  function wrapField(select, type, labelText){
    if(!select) return null;

    // If searchable select already wrapped it, wrap the visible wrapper instead.
    const visibleTarget = select.closest('.searchSelectWrap') || select;

    if(visibleTarget.closest('.matchRoleField')) {
      const existing = visibleTarget.closest('.matchRoleField');
      existing.classList.add(type);
      const lab = existing.querySelector('.matchRoleLabel');
      if(lab) lab.textContent = labelText;
      return existing;
    }

    const field = document.createElement('div');
    field.className = `matchRoleField ${type}`;

    const label = document.createElement('div');
    label.className = 'matchRoleLabel';
    label.textContent = labelText;

    visibleTarget.parentNode.insertBefore(field, visibleTarget);
    field.appendChild(label);
    field.appendChild(visibleTarget);

    return field;
  }

  const yourField = wrapField(heroSelect, 'yourHeroField', '🟦 Your Hero');
  const enemyField = wrapField(enemySelect, 'enemyHeroField', '🔴 Enemy Hero');

  // Add swap button after enemy field.
  if(heroSelect && enemySelect && !document.getElementById('matchSwapBtn')){
    const swap = document.createElement('button');
    swap.type = 'button';
    swap.id = 'matchSwapBtn';
    swap.className = 'btn ghost matchSwapBtn';
    swap.textContent = '🔄 Swap';

    const insertAfter = enemyField || enemySelect.closest('.searchSelectWrap') || enemySelect;
    insertAfter.parentNode.insertBefore(swap, insertAfter.nextSibling);

    swap.addEventListener('click', () => {
      const temp = heroSelect.value;
      heroSelect.value = enemySelect.value;
      enemySelect.value = temp;

      heroSelect.dispatchEvent(new Event('change', {bubbles:true}));
      enemySelect.dispatchEvent(new Event('change', {bubbles:true}));

      // Update searchable select button text if present.
      document.querySelectorAll('.searchSelectWrap select').forEach(sel => {
        const btn = sel.closest('.searchSelectWrap')?.querySelector('.searchSelectButton span');
        if(btn) btn.textContent = sel.options[sel.selectedIndex]?.text || 'Select';
      });
    });
  }
}

// Run after matchup init and searchable select enhancement.
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(applyMatchupLabels, 120);
  setTimeout(applyMatchupLabels, 700);
});


/* ===== Matchup Swap Guard Fix ===== */
function updateMatchSwapState(){
  const heroSelect = document.getElementById('matchHero') || document.getElementById('hero1Select');
  const enemySelect = document.getElementById('matchEnemy') || document.getElementById('hero2Select');
  const btn = document.getElementById('matchSwapBtn');
  if(!heroSelect || !enemySelect || !btn) return;

  const h = heroSelect.value;
  const e = enemySelect.value;
  const ready = !!h && !!e && h !== e;

  btn.disabled = !ready;
  btn.classList.toggle('disabled', !ready);
  btn.textContent = ready ? '🔄 Swap' : 'Select 2 heroes to swap';
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const heroSelect = document.getElementById('matchHero') || document.getElementById('hero1Select');
    const enemySelect = document.getElementById('matchEnemy') || document.getElementById('hero2Select');
    const btn = document.getElementById('matchSwapBtn');

    if(heroSelect && enemySelect){
      ['change','input'].forEach(evt => {
        heroSelect.addEventListener(evt, updateMatchSwapState);
        enemySelect.addEventListener(evt, updateMatchSwapState);
      });
    }

    if(btn && heroSelect && enemySelect && !btn.dataset.guardAdded){
      btn.dataset.guardAdded = '1';
      btn.addEventListener('click', e => {
        if(btn.disabled || !heroSelect.value || !enemySelect.value || heroSelect.value === enemySelect.value){
          e.preventDefault();
          updateMatchSwapState();
          return false;
        }
      }, true);
    }

    updateMatchSwapState();
  }, 900);
});


/* ===== Human wording polish ===== */
const HUMAN_LINES = {
  playable: [
    'Playable, but do not autopilot this fight.',
    'You can win this if you respect timing and positioning.',
    'Not a free matchup. Play it with patience.',
    'This works better when your team can follow your move.'
  ],
  hard: [
    'Risky pick unless your team helps you.',
    'Difficult matchup. Play safer and punish mistakes.',
    'Do not ego fight this one early.',
    'You need better spacing than usual here.'
  ],
  objective: [
    'After a win, take turret, Turtle/Lord, or enemy jungle. Do not chase forever.',
    'Kills are good, but objectives are what actually close the match.',
    'If enemy runs away, take map control instead of wasting time.'
  ]
};
function humanLine(type){
  const arr = HUMAN_LINES[type] || HUMAN_LINES.playable;
  return arr[Math.floor(Math.random()*arr.length)];
}


/* ===== Active tab / current page highlight ===== */
function setActiveNavTab(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const isHeroPage = location.pathname.includes('/heroes/');
  const links = Array.from(document.querySelectorAll('.navlinks a'));

  function normalize(href){
    try{
      const url = new URL(href, location.href);
      return url.pathname.split('/').pop() || 'index.html';
    }catch(e){
      return href.split('/').pop().split('#')[0] || 'index.html';
    }
  }

  links.forEach(a => {
    a.classList.remove('activeTab');

    const href = a.getAttribute('href') || '';
    const file = normalize(href);
    const text = a.textContent.trim().toLowerCase();

    let active = false;

    if(isHeroPage && (text === 'heroes' || href.includes('#heroes') || href.includes('index.html#heroes'))){
      active = true;
    } else if(path === 'index.html' && (href === 'index.html' || href === './index.html' || href.includes('index.html#discover'))){
      active = href.includes('#discover') || text === 'discover';
    } else if(file === path){
      active = true;
    }

    // Make tool subpages highlight Tools too
    const toolPages = ['counter.html','draft.html','rank-helper.html','pick-score.html','compare.html','synergy.html'];
    if(toolPages.includes(path) && text === 'tools'){
      active = true;
    }

    if(path === 'tier-list.html' && text === 'tier list') active = true;
    if(path === 'guides.html' && text === 'guides') active = true;
    if(path === 'matchup.html' && text === 'matchup') active = true;
    if(path === 'favorites.html' && text === 'favorites') active = true;
    if(['about.html','contact.html','privacy-policy.html','disclaimer.html'].includes(path) && text === 'about') active = true;

    if(active) a.classList.add('activeTab');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNavTab();
  setTimeout(setActiveNavTab, 300);
});
