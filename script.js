// analytics placeholder (only run after consent) — replace with real implementation
window.initAnalytics = window.initAnalytics || function(event){
  // Implement analytics send here (e.g. gtag/GA4 or Plausible)
  console.log('Analytics (placeholder):', event);
};

(function(){
  // utility: safe DOM ready
  function onReady(fn){ if(document.readyState!='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  onReady(function(){
    // set current year
    const y = new Date().getFullYear();
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = y;

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
        if(id.length>1){
          const el = document.querySelector(id);
          if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); el.focus({preventScroll:true}); }
        }
      });
    });

    // Cookie banner handling (HTML banner present to show immediately)
    const cookieBanner = document.getElementById('cookie-overlay');
    const acceptBtn = document.getElementById('acceptCookies');
    const rejectBtn = document.getElementById('rejectCookies');

    function hideBanner(){ if(cookieBanner) { cookieBanner.classList.add('hidden'); cookieBanner.setAttribute('aria-hidden','true'); } }
    function showBanner(){ if(cookieBanner) { cookieBanner.classList.remove('hidden'); cookieBanner.setAttribute('aria-hidden','false'); } }

    // SAFETY: do not load ads unless real IDs are set
    const ADS_CLIENT = 'ca-pub-REPLACE';
    const ADS_SLOT = 'AD_SLOT_ID';

    window.loadAdsense = window.loadAdsense || function(){
      if(window.__adsense_loaded) return;
      // Prevent accidental ad loading while placeholders exist
      if(ADS_CLIENT.includes('REPLACE') || ADS_SLOT.includes('ID')){
        console.warn('AdSense client/slot not set — skipping loadAdsense. Replace ADS_CLIENT/ADS_SLOT with real values to enable.');
        return;
      }
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
      window.__adsense_loaded = true;

      const adSlot = document.getElementById('ad-slot-1');
      if(adSlot){
        adSlot.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${ADS_CLIENT}" data-ad-slot="${ADS_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
        try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
        adSlot.setAttribute('aria-hidden','false');
      }
    };

    // event queue for tracking before consent
    const eventQueue = [];
    function trackEvent(name,data){
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

    // Wire cookie buttons
    if(acceptBtn){
      acceptBtn.addEventListener('click', function(){
        localStorage.setItem('cookieConsent','accepted');
        hideBanner();
        // load ads & analytics
        try{ window.loadAdsense(); } catch(e){ console.warn(e); }
        try{ window.initAnalytics({event:'consent_granted'}); } catch(e){}
        flushEvents();
      });
    }
    if(rejectBtn){
      rejectBtn.addEventListener('click', function(){
        localStorage.setItem('cookieConsent','rejected');
        hideBanner();
      });
    }

    // show/hide based on stored consent state
    const stored = localStorage.getItem('cookieConsent');
    if(stored === 'accepted'){ hideBanner(); try{ window.loadAdsense(); }catch(e){} }
    else if(stored === 'rejected'){ hideBanner(); }
    else { showBanner(); }

    // "Manage cookies" button opens banner again
    const manageCookies = document.getElementById('manage-cookies');
    if(manageCookies && cookieBanner) manageCookies.addEventListener('click', ()=> { cookieBanner.classList.remove('hidden'); cookieBanner.setAttribute('aria-hidden','false'); });

    // Subscribe tracking and AJAX submit
    const ytBtn = document.getElementById('yt-subscribe-btn');
    if(ytBtn) ytBtn.addEventListener('click', function(){ trackEvent('subscribe',{method:'youtube', href:this.href}); });

    const emailForm = document.getElementById('email-subscribe-form');
    if(emailForm){
      emailForm.addEventListener('submit', function(e){
        const action = (emailForm.getAttribute('action') || '');
        // If user didn't replace the Formspree endpoint, fallback to mailto so submissions don't fail
        if(action.includes('your-form-id') || action.trim() === ''){
          e.preventDefault();
          const emailInput = emailForm.querySelector('input[name="email"]');
          const email = emailInput ? emailInput.value.trim() : '';
          const mail = 'techscope60@gmail.com';
          const subject = encodeURIComponent('Subscribe request — TechScope');
          const body = encodeURIComponent('Please add me to the mailing list: ' + email);
          window.location.href = `mailto:${mail}?subject=${subject}&body=${body}`;
        } else {
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
                if(submitBtn) { submitBtn.textContent = 'Sent ✓'; setTimeout(()=> submitBtn.textContent = 'Join by Email', 3000); }
              } else {
                return res.json().then(j=> Promise.reject(j));
              }
            })
            .catch(()=> alert('Submission failed. Please try again or email techscope60@gmail.com'))
            .finally(()=> { if(submitBtn) submitBtn.disabled = false; });
        }
      });
    }

    // reading time injection for article pages
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

    // Load consent-gated embedded media (iframes with data-src) after consent
    function loadConsentEmbeds() {
      document.querySelectorAll('iframe.consent-iframe').forEach(function(iframe){
        if(!iframe.getAttribute('src') || iframe.getAttribute('src') === 'about:blank'){
          const src = iframe.getAttribute('data-src');
          if(src){
            iframe.setAttribute('src', src);
          }
        }
      });
    }

    // Open video in new tab (used when user hasn't given cookie consent)
    document.addEventListener('click', function(e){
      const btn = e.target.closest && e.target.closest('.open-video-btn');
      if(!btn) return;
      const href = btn.getAttribute('data-href');
      if(href){
        window.open(href, '_blank', 'noopener');
      }
    });

    // integrate with existing consent flow
    const acceptBtn = document.getElementById('acceptCookies');
    if(acceptBtn){
      acceptBtn.addEventListener('click', function(){
        localStorage.setItem('cookieConsent','accepted');
        hideBanner && hideBanner(); // preserve existing hideBanner function
        try{ window.loadAdsense && window.loadAdsense(); } catch(e){}
        try{ window.initAnalytics && window.initAnalytics({event:'consent_granted'}); } catch(e){}
        // NEW: load all consented embeds
        try{ loadConsentEmbeds(); } catch(e){ console.warn('loadConsentEmbeds failed', e); }
        // flush queued events if applicable
        try{ flushEvents && flushEvents(); } catch(e){}
      });
    }

    // If consent already accepted on page load, immediately load embeds
    if(localStorage.getItem('cookieConsent') === 'accepted'){
      try{ loadConsentEmbeds(); } catch(e){}
    }

    // expose function for Manage cookies -> re-check and load embeds if consent set
    window.loadConsentEmbeds = loadConsentEmbeds;

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

