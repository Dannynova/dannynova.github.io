// analytics placeholder (only run after consent) — replace with real implementation
window.initAnalytics = window.initAnalytics || function(event){
  // Implement analytics send here (e.g. gtag/GA4 or Plausible)
  console.log('Analytics (placeholder):', event);
};

(function(){
  // safe DOM ready
  function onReady(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  // Expose banner control so other modules can call it reliably
  window._cookieControls = window._cookieControls || {};
  window._cookieControls.hideBanner = function(){ 
    const cb = document.getElementById('cookie-banner'); 
    if(cb){ cb.classList.add('hidden'); cb.setAttribute('aria-hidden','true'); } 
    const ov = document.getElementById('cookie-overlay');
    if(ov) ov.remove();
    document.body.style.overflow = '';
  };
  window._cookieControls.showBanner = function(){ 
    const cb = document.getElementById('cookie-banner'); 
    if(cb){ 
      cb.classList.remove('hidden'); 
      cb.setAttribute('aria-hidden','false'); 
      // focus the primary action for accessibility
      const accept = cb.querySelector('#acceptCookies');
      if(accept) accept.focus({preventScroll:true});
    } 
    // add a simple overlay to discourage interaction until a choice is made
     // Cookie banner handling (HTML banner present to show immediately)
    if(!document.getElementById('cookie-overlay')){
      const ov = document.createElement('div');
      ov.id = 'cookie-overlay';
      ov.style.position = 'fixed';
      ov.style.inset = '0';
      ov.style.background = 'rgba(0,0,0,0.32)';
      ov.style.zIndex = '9998';
      ov.style.pointerEvents = 'auto';
      document.body.appendChild(ov);
    }
    // prevent page scrolling while prompt visible
    document.body.style.overflow = 'hidden';
  };

  // Re-prompt timing (ms). 5 minutes per request.
  const REAPPEAR_AFTER = 5 * 60 * 1000; // 5 minutes
  let reappearTimer = null;

  onReady(function(){
    // set current year (existing)
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    // mobile nav toggle
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('main-nav');
    if(menuToggle && mainNav){
      menuToggle.addEventListener('click', function(){
        const open = mainNav.getAttribute('data-open') === 'true';
        mainNav.setAttribute('data-open', String(!open));
        this.setAttribute('aria-expanded', String(!open));
      });
    }

    // smooth internal links
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', function(e){
        const id = this.getAttribute('href');
        if(id && id.length > 1){
          const el = document.querySelector(id);
          if(el){
            e.preventDefault();
            el.scrollIntoView({behavior:'smooth',block:'start'});
            el.focus({preventScroll:true});
          }
        }
      });
    });

    // event queue & tracking (store until consent)
    const eventQueue = [];
    function trackEvent(name, data){
      const ev = {name, data, ts: Date.now()};
      if(localStorage.getItem('cookieConsent') === 'accepted'){
        try{ window.initAnalytics(ev); } catch(e){ console.warn(e); }
      } else {
        eventQueue.push(ev);
      }
    }
    function flushEvents(){
      while(eventQueue.length){
        const ev = eventQueue.shift();
        try{ window.initAnalytics(ev); } catch(e){ console.warn(e); }
      }
    }
    window.flushEvents = flushEvents;

    // Consent-gated embeds loader
    function loadConsentEmbeds(){
      document.querySelectorAll('iframe.consent-iframe').forEach(function(iframe){
        try{
          const current = iframe.getAttribute('src') || '';
          if(!current || current === 'about:blank'){
            const src = iframe.getAttribute('data-src');
            if(src) iframe.setAttribute('src', src);
          }
        }catch(e){ console.warn('embed load error', e); }
      });
    }
    window.loadConsentEmbeds = loadConsentEmbeds;

    // Ad loader (keeps earlier safety checks)
    window.loadAdsense = window.loadAdsense || function(){
      if(window.__adsense_loaded) return;
      try {
        const textLen = (document.body && document.body.innerText) ? document.body.innerText.trim().length : 0;
        if(textLen < 1000){
          console.warn('Ads not loaded: page content below threshold for ad serving (len=' + textLen + ')');
          return;
        }
        const client = 'ca-pub-REPLACE';
        const slot = 'AD_SLOT_ID';
        const s = document.createElement('script');
        s.async = true;
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
        s.crossOrigin = 'anonymous';
        document.head.appendChild(s);
        window.__adsense_loaded = true;
        const adSlot = document.getElementById('ad-slot-1');
        if(adSlot){
          adSlot.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
          try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
          adSlot.setAttribute('aria-hidden','false');
        }
      } catch(e){ console.warn('loadAdsense error', e); }
    };

    // schedule reappearance if rejected
    function scheduleReappearIfRejected(){
      try {
        // clear any existing timer
        if(reappearTimer) { clearTimeout(reappearTimer); reappearTimer = null; }
        const consent = localStorage.getItem('cookieConsent');
        if(consent !== 'rejected') return;
        const rejectedAt = parseInt(localStorage.getItem('cookieConsentRejectedAt') || '0', 10) || 0;
        const now = Date.now();
        const elapsed = now - rejectedAt;
        if(elapsed >= REAPPEAR_AFTER){
          window._cookieControls.showBanner();
        } else {
          reappearTimer = setTimeout(function(){ window._cookieControls.showBanner(); }, REAPPEAR_AFTER - elapsed);
        }
      } catch(e){ console.warn('scheduleReappearIfRejected error', e); }
    }

    // cookie banner elements and handlers
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('acceptCookies');
    const rejectBtn = document.getElementById('rejectCookies');

    function handleAccept(){
      try{
        localStorage.setItem('cookieConsent','accepted');
        localStorage.removeItem('cookieConsentRejectedAt');
        if(reappearTimer){ clearTimeout(reappearTimer); reappearTimer = null; }
        window._cookieControls.hideBanner();
        try{ window.loadAdsense(); } catch(e){}
        try{ window.initAnalytics && window.initAnalytics({event:'consent_granted'}); } catch(e){}
        try{ loadConsentEmbeds(); } catch(e){}
        try{ flushEvents(); } catch(e){}
      }catch(err){ console.warn('accept handler error', err); }
    }
    function handleReject(){
      try{
        localStorage.setItem('cookieConsent','rejected');
        localStorage.setItem('cookieConsentRejectedAt', String(Date.now()));
        window._cookieControls.hideBanner();
        scheduleReappearIfRejected();
      }catch(err){ console.warn('reject handler error', err); }
    }

    if(acceptBtn) acceptBtn.addEventListener('click', function(e){ e.preventDefault(); handleAccept(); });
    if(rejectBtn) rejectBtn.addEventListener('click', function(e){ e.preventDefault(); handleReject(); });

    // delegated fallback for dynamic insertion or missed listeners
    document.addEventListener('click', function(e){
      const accept = e.target.closest && e.target.closest('#acceptCookies');
      const reject = e.target.closest && e.target.closest('#rejectCookies');
      if(accept){ e.preventDefault(); handleAccept(); }
      if(reject){ e.preventDefault(); handleReject(); }
      const openBtn = e.target.closest && e.target.closest('.open-video-btn');
      if(openBtn){
        const href = openBtn.getAttribute('data-href');
        if(href) window.open(href, '_blank', 'noopener');
      }
    });

    // Manage cookies re-opener
    const manageCookies = document.getElementById('manage-cookies');
    if(manageCookies){
      manageCookies.addEventListener('click', function(){ window._cookieControls.showBanner(); });
    }

    // Respect stored consent on load — show banner immediately unless already accepted
    const stored = localStorage.getItem('cookieConsent');
    if (stored === 'accepted') {
      window._cookieControls.hideBanner();
      try{ window.loadAdsense(); } catch(e){}
      try{ loadConsentEmbeds(); } catch(e){}
    } else if (stored === 'rejected') {
      // if rejected earlier, schedule reappear or show if threshold passed
      scheduleReappearIfRejected();
      // keep banner hidden initially for rejected state
      window._cookieControls.hideBanner();
    } else {
      // show the consent prompt immediately on arrival
      window._cookieControls.showBanner();
    }

    // Subscribe tracking: YouTube button
    const ytBtn = document.getElementById('yt-subscribe-btn');
    if(ytBtn) ytBtn.addEventListener('click', function(){ trackEvent('subscribe',{method:'youtube', href:this.href}); });

    // AJAX email subscribe (fixed/complete)
    const emailForm = document.getElementById('email-subscribe-form');
    if(emailForm){
      emailForm.addEventListener('submit', function(e){
        e.preventDefault();
        const submitBtn = emailForm.querySelector('button[type="submit"]');
        if(submitBtn) submitBtn.disabled = true;
        const formData = new FormData(emailForm);
        const action = emailForm.action;
        fetch(action, {method:'POST', body: formData, headers:{'Accept':'application/json'}})
          .then(res => {
            if(res.ok){
              emailForm.reset();
              trackEvent('subscribe',{method:'email'});
              if(submitBtn){ submitBtn.textContent = 'Sent ✓'; setTimeout(()=> submitBtn.textContent = 'Join by Email',3000); }
            } else {
              return res.json().then(j=> Promise.reject(j));
            }
          })
          .catch(()=> alert('Subscription failed. Please try again or email techscope60@gmail.com'))
          .finally(()=> { if(submitBtn) submitBtn.disabled = false; });
      });
    }

    // reading time for article pages
    (function addReadingTime(){
      const article = document.querySelector('article');
      if(!article) return;
      const text = article.innerText || '';
      const words = text.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.round(words / 200));
      const meta = document.createElement('div');
      meta.className = 'article-meta';
      meta.innerHTML = `<span class="meta-author">TechScope</span> · <span class="meta-time">${minutes} min read</span>`;
      const h1 = article.querySelector('h1');
      if(h1) h1.insertAdjacentElement('afterend', meta);
    })();

    // accessibility: skip-link focus fix
    const skip = document.querySelector('.skip-link');
    if(skip){
      skip.addEventListener('click', function(e){
        const target = document.querySelector(this.getAttribute('href'));
        if(target){
          target.tabIndex = -1;
          target.focus();
        }
      });
    }
  }); // onReady
})(); // IIFE

// load AdSense script and inject responsive ad slot (consent required).
window.loadAdsense = window.loadAdsense || function(){
  if(window.__adsense_loaded) return;
  try {
    // Safety check: only load ads on pages with substantive publisher content.
    // Prevent ads on very thin pages (helps compliance during review).
    const textLen = (document.body && document.body.innerText) ? document.body.innerText.trim().length : 0;
    if(textLen < 1000){
      console.warn('Ads not loaded: page content below threshold for ad serving (len=' + textLen + ')');
      return;
    }
    const client = 'ca-pub-REPLACE'; // TODO: replace with your client id after approval
    const slot = 'AD_SLOT_ID';       // TODO: replace with your ad slot id after approval
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    window.__adsense_loaded = true;
    const adSlot = document.getElementById('ad-slot-1');
    if(adSlot){
      adSlot.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
      try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
      adSlot.setAttribute('aria-hidden','false');
    }
  } catch(e){ console.warn('loadAdsense error', e); }
};

// ensure affiliate links have appropriate rel attributes (run on load)
function normalizeAffiliateLinks(){
  document.querySelectorAll('a.affiliate').forEach(function(a){
    const rel = (a.getAttribute('rel') || '').split(/\s+/);
    ['sponsored','nofollow','noopener','noreferrer'].forEach(function(r){
      if(!rel.includes(r)) rel.push(r);
    });
    a.setAttribute('rel', rel.filter(Boolean).join(' '));
  });
}
// call after DOM ready
try{ normalizeAffiliateLinks(); } catch(e){}
