(() => {
  const keys = [...document.querySelectorAll('.hardware, .languages button')];
  function release(){keys.forEach(k=>k.classList.remove('is-pressed'));}
  keys.forEach(key=>{
    if (key.matches('.shelf-arrow')) key.addEventListener('click',()=>{
      key.classList.remove('did-step');
      void key.offsetWidth;
      key.classList.add('did-step');
    });
    key.addEventListener('animationend',()=>key.classList.remove('did-step'));
    key.addEventListener('pointerdown',()=>{if(!key.disabled)key.classList.add('is-pressed')});
    key.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!key.disabled)key.classList.add('is-pressed')});
    key.addEventListener('keyup',release);
    key.addEventListener('blur',release);
  });
  window.addEventListener('pointerup',release);
  window.addEventListener('pointercancel',release);
  window.addEventListener('blur',release);
})();
