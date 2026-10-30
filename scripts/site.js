(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const panels = [...document.querySelectorAll('.project-panel')];
  const cartridges = [...document.querySelectorAll('[data-project]')];
  const screen = $('#screen'), rack = $('#cartridges'), empty = $('#empty-screen');
  const eject = $('#eject'), previous = $('#shelf-prev'), next = $('#shelf-next');
  let active = undefined, lang = 'fr', railIndex = 0, railAnimation = 0, railMoving = false, selectionRun = 0, changingCartridge = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const name = id => id === 'contact-panel' ? 'Contact' : id === 'profile' ? (lang === 'fr' ? 'Profil' : 'Profile') : cartridges.find(c => c.dataset.project === id)?.getAttribute('aria-label');
  function stopMedia() {
    panels.forEach(p => {
      p.querySelectorAll('video').forEach(v => v.pause());
      p.querySelectorAll('iframe').forEach(f => {f.removeAttribute('src');f.hidden=true;});
      p.querySelectorAll('.video-poster').forEach(b=>b.hidden=false);
    });
  }
  function reveal(id) {
    panels.forEach(p => { p.hidden = p.id !== id; });
    empty.hidden = !!id;

    screen.scrollTop = 0;
    screen.classList.remove('switching');
    $('#loaded-name').textContent = id ? name(id) : (lang === 'fr' ? 'Aucune cartouche insérée' : 'No cartridge inserted');
  }
  function centerCartridge(id, smooth) {
    const card = cartridges.find(c => c.dataset.project === id);
    if (!card) return;
    railIndex = cartridges.indexOf(card);
    shelfState();
    const bounds = card.getBoundingClientRect();
    const seat = document.querySelector('.slot-seat')?.getBoundingClientRect();
    const viewport = rack.getBoundingClientRect();
    const anchor = seat ? seat.left + seat.width / 2 : viewport.left + viewport.width / 2;
    const from = rack.scrollLeft;
    const target = Math.max(0, Math.min(rack.scrollWidth - rack.clientWidth,
      from + bounds.left + bounds.width / 2 - anchor));
    cancelAnimationFrame(railAnimation);
    railMoving = smooth && !reduced() && Math.abs(target - from) > 1;
    if (!railMoving) {
      rack.scrollTo({left:target, behavior:'instant'});
      shelfState();
      return;
    }
    const started = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - started) / 260);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      rack.scrollTo({left:from + (target - from) * eased, behavior:'instant'});
      shelfState();
      if (progress < 1) railAnimation = requestAnimationFrame(frame);
      else {railMoving = false; shelfState();}
    }
    railAnimation = requestAnimationFrame(frame);
  }
  function commitSelection(id, {animate = true, updateHash = true, center = true} = {}) {
    if (!panels.some(p => p.id === id)) id = null;
    if (id === active) return;
    active = id;
    $('#screen-role').textContent = !id || id==='profile' || id==='contact-panel' ? 'Designer' : id==='jam-in' ? 'Product Designer' : 'Game Designer';
    stopMedia();
    cartridges.forEach(c => {
      const selected = c.dataset.project === id;
      c.setAttribute('aria-expanded', String(selected));
      c.parentElement.classList.toggle('active', selected);
    });
    $('.equipment').classList.toggle('is-loaded', !!id);
    eject.disabled = !id;
    $('#contact-shortcut').setAttribute('aria-pressed',String(id==='contact-panel'));
    $('#profile-shortcut').setAttribute('aria-pressed', String(id === 'profile'));
    if (updateHash) history.pushState(null, '', id ? '#' + id : '#empty');
    if (center && id) centerCartridge(id, animate);
    if (id || !changingCartridge) reveal(id);
    shelfState();
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function select(id, options = {}) {
    const run = ++selectionRun;
    const equipment = $('.equipment');
    changingCartridge = false;
    equipment.dataset.cartridgePhase = 'idle';
    const target = cartridges.find(c => c.dataset.project === id);
    const old = cartridges.find(c => c.dataset.project === active);
    if (!target || id === active || options.animate === false || reduced()) {
      commitSelection(id, options);
      shelfState();
      return;
    }
    changingCartridge = true;
    if (old) {
      equipment.dataset.cartridgePhase = 'ejecting';
      commitSelection(null, {center:false, updateHash:false});
      await pause(160);
      if (run !== selectionRun) return;
    }
    equipment.dataset.cartridgePhase = 'scrolling';
    centerCartridge(id, true);
    if (railMoving) await pause(270);
    if (run !== selectionRun) return;
    equipment.dataset.cartridgePhase = 'inserting';
    commitSelection(id, {...options, center:false});
    await pause(160);
    if (run !== selectionRun) return;
    changingCartridge = false;
    equipment.dataset.cartridgePhase = 'idle';
    shelfState();
  }
  cartridges.forEach(c => c.addEventListener('click', e => {
    e.preventDefault(); select(c.dataset.project === active ? null : c.dataset.project);
  }));
  document.querySelectorAll('[data-insert]').forEach(b => b.addEventListener('click', () => select(b.dataset.insert)));
  document.querySelectorAll('.index-link,.wordmark').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); select(a.hash.slice(1)); screen.focus({preventScroll:true});
  }));
  $('#profile-shortcut').addEventListener('click', () => {
    select(active === 'profile' ? null : 'profile');
  });
  $('#contact-shortcut').addEventListener('click',()=>{select(active === 'contact-panel' ? null : 'contact-panel');screen.focus({preventScroll:true});});
  eject.addEventListener('click', () => {
    const old = cartridges.find(c => c.dataset.project === active);
    select(null, {center:false}); old?.focus({preventScroll:true});
  });
  function hashSelection() {
    const id = location.hash.slice(1);
    select(id === 'empty' ? null : panels.some(p => p.id === id) ? id : 'seekers', {updateHash:false,animate:false});
  }
  window.addEventListener('popstate',hashSelection);
  window.addEventListener('hashchange',hashSelection);
  function shelfState() {
    previous.disabled = changingCartridge || railIndex <= 0;
    next.disabled = changingCartridge || railIndex >= cartridges.length - 1;
    const seat = document.querySelector('.slot-seat');
    const selected = cartridges.find(c => c.dataset.project === active);
    const target = seat.getBoundingClientRect();
    const card = selected?.getBoundingClientRect();
    seat.classList.toggle('lit', !!card && Math.abs(card.left + card.width / 2 - target.left - target.width / 2) < 2);
  }
  function move(direction) {
    const index = Math.max(0, Math.min(cartridges.length - 1, railIndex + direction));
    if (index === railIndex) return;
    centerCartridge(cartridges[index].dataset.project, true);
  }
  previous.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
  rack.addEventListener('scroll', shelfState, {passive:true});
  // Touch/trackpad scrolling settles on the nearest physical cartridge detent.
  function settleRail() {
    if (railMoving || changingCartridge) return;
    const seat = document.querySelector('.slot-seat').getBoundingClientRect();
    const anchor = seat.left + seat.width / 2;
    const nearest = cartridges.reduce((best, card, i) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - anchor);
      return distance < best.distance ? {index:i, distance} : best;
    }, {index:0, distance:Infinity});
    centerCartridge(cartridges[nearest.index].dataset.project, false);
    shelfState();
  }
  rack.addEventListener('scrollend', settleRail);
  rack.addEventListener('keydown',e=>{
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key) || !e.target.matches('[data-project]')) return;
    e.preventDefault();
    const i=cartridges.indexOf(e.target);
    const j=e.key==='Home'?0:e.key==='End'?cartridges.length-1:Math.max(0,Math.min(cartridges.length-1,i+(e.key==='ArrowRight'?1:-1)));
    cartridges[j].focus({preventScroll:true});centerCartridge(cartridges[j].dataset.project,true);
  });
  function fitRack() {
    const module = document.querySelector('.cartridge-module');
    rack.parentElement.style.width = '100%';
    centerCartridge(cartridges[railIndex].dataset.project,false);
    shelfState();
  }
  new ResizeObserver(fitRack).observe(document.querySelector('.equipment'));
  fitRack();
  function language(value) {
    lang=value==='en'?'en':'fr'; document.documentElement.lang=lang;
    document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
    document.querySelector('meta[name="description"]').content=lang==='fr'?'Portfolio de Loïc Edoh. Conception de jeux et de produits numériques : projets, contexte et contributions.':'Loïc Edoh’s portfolio. Game and digital product design: projects, context and contributions.';
    $('#loaded-name').textContent=active?name(active):(lang==='fr'?'Aucune cartouche insérée':'No cartridge inserted');
    try {localStorage.setItem('portfolio-language',lang);} catch (_) {}
  }
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>language(lang==='fr'?'en':'fr')));
  let preferred=navigator.language.toLowerCase().startsWith('fr')?'fr':'en';
  try {preferred=localStorage.getItem('portfolio-language')||preferred;} catch (_) {}
  const form=$('#contact-form'), result=$('#contact-result');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    const button=form.querySelector('[type=submit]');button.disabled=true;
    result.textContent=lang==='fr'?'Envoi en cours…':'Sending…';
    try{
      const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form))),signal:AbortSignal.timeout(20000)});
      const data=await response.json();
      if(!response.ok||!data.success)throw new Error('send-failed');
      result.textContent=lang==='fr'?'Votre message a été envoyé.':'Your message has been sent.';form.reset();
    }catch(_){result.textContent=lang==='fr'?'L’envoi n’a pas pu être confirmé. Vous pouvez réessayer ou utiliser le lien courriel ci-dessous.':'Sending could not be confirmed. Please try again or use the email link below.';}
    finally{button.disabled=false;}
  });
  document.querySelectorAll('.video-poster').forEach(button=>button.addEventListener('click',()=>{
    const frame=button.parentElement.querySelector('iframe');
    frame.src=frame.dataset.src+'&autoplay=1';frame.hidden=false;button.hidden=true;
  }));
  const viewer = document.createElement('dialog');
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-label','Médias du projet / Project media');
  viewer.innerHTML = '<button type="button" class="image-viewer-close" aria-label="Fermer / Close">×</button><div class="viewer-media"></div><nav class="viewer-navigation" aria-label="Navigation médias"><button type="button" class="viewer-prev" aria-label="Média précédent / Previous media">‹</button><span class="viewer-count" aria-live="polite"></span><button type="button" class="viewer-next" aria-label="Média suivant / Next media">›</button></nav>';
  document.body.append(viewer);
  const mediaHost=viewer.querySelector('.viewer-media');
  let mediaItems=[],mediaIndex=0;
  function projectMedia(panel){
    const items=[];
    const frame=panel.querySelector('.lead-media iframe');
    const video=panel.querySelector('.lead-media video');
    const hero=panel.querySelector('.lead-media img');
    if(frame) items.push({type:'iframe',src:frame.dataset.src,title:frame.title});
    else if(video) items.push({type:'video',src:video.querySelector('source')?.src||video.src,poster:video.poster});
    else if(hero) items.push({type:'img',src:hero.src,title:hero.alt});
    panel.querySelectorAll('.gallery-grid a').forEach(link=>items.push({type:'img',src:link.href,title:link.querySelector('img')?.alt||''}));
    return items;
  }
  function showMedia(index){
    mediaHost.replaceChildren();
    mediaIndex=(index+mediaItems.length)%mediaItems.length;
    const item=mediaItems[mediaIndex],node=document.createElement(item.type);
    node.src=item.src;
    if(item.type==='img')node.alt=item.title;
    if(item.type==='video'){node.controls=true;node.playsInline=true;node.poster=item.poster;}
    if(item.type==='iframe'){node.title=item.title;node.allow='fullscreen; encrypted-media; picture-in-picture';node.allowFullscreen=true;}
    mediaHost.append(node);
    viewer.querySelector('.viewer-count').textContent=`${mediaIndex+1} / ${mediaItems.length}`;
    viewer.querySelectorAll('.viewer-prev,.viewer-next').forEach(button=>button.disabled=mediaItems.length<2);
  }
  const closeViewer=()=>viewer.close();
  viewer.addEventListener('close',()=>mediaHost.replaceChildren());
  viewer.querySelector('.image-viewer-close').addEventListener('click',closeViewer);
  viewer.querySelector('.viewer-prev').addEventListener('click',()=>showMedia(mediaIndex-1));
  viewer.querySelector('.viewer-next').addEventListener('click',()=>showMedia(mediaIndex+1));
  viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer();});
  viewer.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,video'))return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();showMedia(mediaIndex+(e.key==='ArrowRight'?1:-1));}
  });
  let touchX=null;
  mediaHost.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;},{passive:true});
  mediaHost.addEventListener('touchend',e=>{if(touchX!==null){const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>60)showMedia(mediaIndex+(delta<0?1:-1));touchX=null;}},{passive:true});
  document.querySelectorAll('.gallery-grid a').forEach(link=>{
    link.removeAttribute('target');
    link.addEventListener('click',e=>{
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      e.preventDefault();mediaItems=projectMedia(link.closest('.project-panel'));
      showMedia(mediaItems.findIndex(item=>item.src===link.href));viewer.showModal();
    });
  });
  const backToTop=$('#back-to-top');
  function updateBackToTop(){backToTop.hidden=window.scrollY<70;}
  window.addEventListener('scroll',updateBackToTop,{passive:true});
  backToTop.addEventListener('click',()=>{
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  updateBackToTop();
  language(preferred); hashSelection(); shelfState();
  window.addEventListener("load", () => {window.scrollTo(0, 0);screen.scrollTop=0;requestAnimationFrame(()=>{window.scrollTo(0,0);screen.scrollTop=0;});}, {once:true});
})();
