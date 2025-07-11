import React, { useEffect, useRef } from 'react';

interface TrustpilotWidgetProps {
  businessunitId: string;
  templateId?: string;
  locale?: string;
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const TrustpilotWidget: React.FC<TrustpilotWidgetProps> = ({
  businessunitId,
  templateId = '5419b6a8b0d04a076446a9ad', // Standard micro review count template
  locale = 'en-US',
  theme = 'light',
  size = 'small',
  className = ''
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Template configurations
  const templates = {
    small: {
      id: '5419b6a8b0d04a076446a9ad', // Micro review count
      height: '24px'
    },
    medium: {
      id: '56278e9abfbbba0bdcd568bc', // Standard review count
      height: '52px'
    },
    large: {
      id: '539ad60dec7e4e09907042a4', // Standard carousel
      height: '140px'
    }
  };

  const currentTemplate = templates[size];

  useEffect(() => {
    const loadTrustpilot = () => {
      // Check if script is already loaded
      if (!document.querySelector('script[src*="trustpilot"]')) {
        const script = document.createElement('script');
        script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
        script.async = true;
        script.onload = initializeWidget;
        script.onerror = () => {
          console.log('Failed to load Trustpilot script');
        };
        document.head.appendChild(script);
      } else {
        initializeWidget();
      }
    };

    const initializeWidget = () => {
      if (hasInitialized.current) return;

      // Wait for Trustpilot to be available
      const checkTrustpilot = () => {
        if (typeof window !== 'undefined' && (window as any).Trustpilot && widgetRef.current) {
          try {
            // Clear any existing content
            if (widgetRef.current) {
              widgetRef.current.innerHTML = `
                <a href="https://www.trustpilot.com/review/ile.africa" target="_blank" rel="noopener noreferrer" style="color: #9CA3AF; font-size: 14px; text-decoration: none;">
                  ⭐ View our reviews on Trustpilot
                </a>
              `;
            }

            // Initialize the widget
            (window as any).Trustpilot.loadFromElement(widgetRef.current, true);
            hasInitialized.current = true;
            console.log('Trustpilot widget initialized successfully');
          } catch (error) {
            console.log('Trustpilot initialization error:', error);
            // Show fallback content
            if (widgetRef.current) {
              widgetRef.current.innerHTML = `
                <a href="https://www.trustpilot.com/review/ile.africa" target="_blank" rel="noopener noreferrer" style="color: #9CA3AF; font-size: 14px; text-decoration: none;">
                  ⭐ View our reviews on Trustpilot
                </a>
              `;
            }
          }
        } else {
          // Retry after a short delay
          setTimeout(checkTrustpilot, 100);
        }
      };

      // Start checking for Trustpilot availability
      setTimeout(checkTrustpilot, 100);
    };

    loadTrustpilot();

    // Cleanup
    return () => {
      hasInitialized.current = false;
    };
  }, [businessunitId, templateId]);

  return (
    <div
      ref={widgetRef}
      className={`trustpilot-widget ${className}`}
      data-locale={locale}
      data-template-id={templateId || currentTemplate.id}
      data-businessunit-id={businessunitId}
      data-style-height={currentTemplate.height}
      data-style-width="100%"
      data-theme={theme}
      data-min-review-count="0"
      data-without-reviews-preferred-string-id="1"
      data-style-alignment="left"
      style={{ minHeight: currentTemplate.height }}
    >
      {/* Fallback content while loading */}
      <a 
        href="https://www.trustpilot.com/review/ile.africa" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-400 text-sm hover:text-gray-300 transition-colors"
      >
        ⭐ View our reviews on Trustpilot
      </a>
    </div>
  );
};