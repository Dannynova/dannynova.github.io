// Consent-safe, minimal analytics helper (replace send implementation with your provider)
(function(window){
  function sendEvent(name, data){
    // Example placeholder: replace with Plausible/Fathom/GA4 call after consent
    console.log('analytics event:', name, data);
  }

  window.privacyAnalytics = {
    trackPageView: function(){
      sendEvent('page_view', {path: location.pathname, title: document.title});
    },
    trackEvent: function(name, data){
      sendEvent(name, data || {});
    }
  };

  // Example: call after consent
  // window.privacyAnalytics.trackPageView();
})(window);