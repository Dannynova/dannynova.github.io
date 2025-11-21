// small UI helpers: mobile menu + year fill
document.addEventListener('DOMContentLoaded', function(){
  // Set current year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = y;

  // Mobile nav toggle
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('main-nav');
  if(menuToggle && mainNav){
    menuToggle.addEventListener('click', function(){
      const open = mainNav.getAttribute('data-open') === 'true';
      mainNav.setAttribute('data-open', String(!open));
      this.setAttribute('aria-expanded', String(!open));
    });
  }

  // Keyboard-friendly skip-link focus fix (for some browsers)
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

  // Progressive enhancement: smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', function(e){
      const id = this.getAttribute('href');
      if(id.length>1){
        const el = document.querySelector(id);
        if(el){
          e.preventDefault();
          el.scrollIntoView({behavior:'smooth',block:'start'});
          el.focus({preventScroll:true});
        }
      }
    });
  });
});

// Simple analytics placeholder (replace MEASUREMENT_ID and implement consent gating)
function initAnalytics(){ /* load GA or other analytics here after consent */ }

// basic cookie consent banner
if(!localStorage.getItem('cookieConsent')){
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = 'We use cookies for analytics and ads. <button id="acceptCookies">Accept</button>';
  document.body.appendChild(banner);
  document.getElementById('acceptCookies').addEventListener('click', ()=>{
    localStorage.setItem('cookieConsent','1');
    banner.remove();
    // initAnalytics(); // call your analytics/ads init here
  });
} else {
  // initAnalytics();
}
