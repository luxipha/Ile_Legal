// Google Analytics 4 integration
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // Replace with your actual GA4 tracking ID

// Initialize Google Analytics
export const initGA = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args: any[]) {
    window.dataLayer.push(args);
  };

  // Configure GA
  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track email captures
export const trackEmailCapture = (variant: string, source: string) => {
  trackEvent('email_capture', 'engagement', `${variant}_${source}`);
};

// Track lawyer profile views
export const trackLawyerProfileView = (lawyerId: string) => {
  trackEvent('profile_view', 'lawyer_engagement', lawyerId);
};

// Track service inquiries
export const trackServiceInquiry = (serviceType: string, lawyerId?: string) => {
  trackEvent('service_inquiry', 'conversion', serviceType);
  
  if (lawyerId) {
    trackEvent('lawyer_contact', 'engagement', lawyerId);
  }
};

// Track user registration
export const trackRegistration = (userType: 'buyer' | 'seller') => {
  trackEvent('sign_up', 'conversion', userType);
};

// Track login
export const trackLogin = (method: 'email' | 'google' | 'metamask') => {
  trackEvent('login', 'engagement', method);
};

// Track gig posting
export const trackGigPost = (category: string, budget: number) => {
  trackEvent('post_gig', 'conversion', category, budget);
};

// Track bid submission
export const trackBidSubmission = (gigId: string, bidAmount: number) => {
  trackEvent('submit_bid', 'conversion', gigId, bidAmount);
};

// Enhanced ecommerce tracking for legal services
export const trackServicePurchase = (
  serviceId: string,
  serviceName: string,
  price: number,
  lawyerId: string
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'purchase', {
    transaction_id: `${serviceId}_${Date.now()}`,
    value: price,
    currency: 'NGN',
    items: [
      {
        item_id: serviceId,
        item_name: serviceName,
        category: 'legal_service',
        price: price,
        quantity: 1
      }
    ]
  });

  // Also track as custom event
  trackEvent('service_purchase', 'conversion', serviceName, price);
};

// Load GA script dynamically
export const loadGAScript = () => {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  
  script.onload = () => {
    initGA();
  };

  document.head.appendChild(script);
};

// React hook for analytics
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location]);

  return {
    trackEvent,
    trackEmailCapture,
    trackLawyerProfileView,
    trackServiceInquiry,
    trackRegistration,
    trackLogin,
    trackGigPost,
    trackBidSubmission,
    trackServicePurchase
  };
};