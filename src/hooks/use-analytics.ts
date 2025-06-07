import { useCallback } from 'react';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export const useAnalytics = () => {
  const trackEvent = useCallback(({ category, action, label, value }: AnalyticsEvent) => {
    // Here you would typically integrate with your analytics service
    // For example, Google Analytics, Mixpanel, etc.
    console.log('Analytics Event:', {
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
    });

    // Example Google Analytics integration:
    // if (window.gtag) {
    //   window.gtag('event', action, {
    //     event_category: category,
    //     event_label: label,
    //     value: value,
    //   });
    // }
  }, []);

  const trackPageView = useCallback((page: string) => {
    console.log('Page View:', {
      page,
      timestamp: new Date().toISOString(),
    });

    // Example Google Analytics integration:
    // if (window.gtag) {
    //   window.gtag('config', 'YOUR-GA-ID', {
    //     page_path: page,
    //   });
    // }
  }, []);

  const trackFeatureUsage = useCallback((feature: string) => {
    trackEvent({
      category: 'Feature',
      action: 'Use',
      label: feature,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackFeatureUsage,
  };
}; 