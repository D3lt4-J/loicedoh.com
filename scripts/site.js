(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const panels = [...document.querySelectorAll('.project-panel')];
  const cartridges = [...document.querySelectorAll('[data-project]')];
  const screen = $('#screen'), rack = $('#cartridges'), empty = $('#empty-screen');
  const eject = $('#eject'), previous = $('#shelf-prev'), next = $('#shelf-next');
  let active = undefined, lang = 'fr';
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
    const slot = cartridges.find(c => c.dataset.project === id)?.parentElement;
    if (!slot) return;
    rack.scrollTo({left: slot.offsetLeft - (rack.clientWidth - slot.offsetWidth) / 2, behavior: smooth && !reduced() ? 'smooth' : 'instant'});
  }
  function select(id, {animate = true, updateHash = true, center = true} = {}) {
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
    eject.disabled = !id || id==='contact-panel';
    $('#contact-shortcut').setAttribute('aria-pressed',String(id==='contact-panel'));
    $('#profile-shortcut').setAttribute('aria-pressed', String(id === 'profile'));
    if (updateHash) history.pushState(null, '', id ? '#' + id : '#empty');
    if (center && id) centerCartridge(id, animate);
    reveal(id);
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
  $('#contact-shortcut').addEventListener('click',()=>{select(active === 'contact-panel' ? null : 'contact-panel',{center:false});screen.focus({preventScroll:true});});
  eject.addEventListener('click', () => {
    const old = cartridges.find(c => c.dataset.project === active);
    select(null, {center:false}); old?.focus({preventScroll:true});
  });
  function hashSelection() {
    const id = location.hash.slice(1);
    select(id === 'empty' ? null : panels.some(p => p.id === id) ? id : 'profile', {updateHash:false,animate:false});
  }
  window.addEventListener('popstate',hashSelection);
  window.addEventListener('hashchange',hashSelection);
  function shelfState() {
    previous.disabled = rack.scrollLeft < 2;
    next.disabled = rack.scrollLeft + rack.clientWidth >= rack.scrollWidth - 2;
  }
  function move(direction) {
    const step = cartridges[0].parentElement.offsetWidth + parseFloat(getComputedStyle(rack).gap || 0);
    rack.scrollBy({left:direction*step*Math.max(1,Math.floor(rack.clientWidth/step)),behavior:reduced()?'instant':'smooth'});
  }
  previous.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
  rack.addEventListener('scroll',shelfState,{passive:true});
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
    if(active)centerCartridge(active,false);
    shelfState();
  }
  new ResizeObserver(fitRack).observe(document.querySelector('.cartridge-module'));
  fitRack();
  function language(value) {
    lang=value==='en'?'en':'fr'; document.documentElement.lang=lang;
    document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
    document.querySelector('meta[name="description"]').content=lang==='fr'?'Portfolio de Loïc Edoh. Conception de jeux et de produits numériques : projets, contexte et contributions.':'Loïc Edoh’s portfolio. Game and digital product design: projects, context and contributions.';
    $('#loaded-name').textContent=active?name(active):(lang==='fr'?'Aucune cartouche insérée':'No cartridge inserted');
    try {localStorage.setItem('portfolio-language',lang);} catch (_) {}
  }
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>language(b.dataset.lang)));
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
