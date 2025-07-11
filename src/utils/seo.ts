// SEO utilities for dynamic meta tags and structured data
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

export class SEOManager {
  private static instance: SEOManager;
  
  public static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  updatePageSEO(config: SEOConfig): void {
    // Update title
    document.title = config.title;

    // Remove existing meta tags
    this.removeExistingMetaTags();

    // Add new meta tags
    this.addMetaTag('description', config.description);
    
    if (config.keywords) {
      this.addMetaTag('keywords', config.keywords);
    }

    // Open Graph tags
    this.addMetaTag('og:title', config.ogTitle || config.title, 'property');
    this.addMetaTag('og:description', config.ogDescription || config.description, 'property');
    this.addMetaTag('og:type', config.ogType || 'website', 'property');
    this.addMetaTag('og:url', config.canonicalUrl || window.location.href, 'property');
    
    if (config.ogImage) {
      this.addMetaTag('og:image', config.ogImage, 'property');
      this.addMetaTag('og:image:alt', config.title, 'property');
    }

    // Twitter Card tags
    this.addMetaTag('twitter:card', config.twitterCard || 'summary_large_image', 'name');
    this.addMetaTag('twitter:title', config.twitterTitle || config.title, 'name');
    this.addMetaTag('twitter:description', config.twitterDescription || config.description, 'name');
    
    if (config.twitterImage) {
      this.addMetaTag('twitter:image', config.twitterImage, 'name');
    }

    // Canonical URL
    if (config.canonicalUrl) {
      this.addCanonicalLink(config.canonicalUrl);
    }

    // Structured Data
    if (config.structuredData) {
      this.addStructuredData(config.structuredData);
    }
  }

  private addMetaTag(name: string, content: string, attribute: string = 'name'): void {
    const meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }

  private addCanonicalLink(url: string): void {
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing) {
      existing.remove();
    }
    
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    document.head.appendChild(link);
  }

  private addStructuredData(data: any): void {
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  private removeExistingMetaTags(): void {
    const metaTags = [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[property^="og:"]',
      'meta[name^="twitter:"]'
    ];

    metaTags.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });
  }
}

// SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: 'Ile Legal - Nigeria\'s Premier Property Legal Services Platform',
    description: 'Connect with verified Nigerian lawyers for property legal services. Get expert help with land titles, C of O verification, property documentation, and legal consultations. Trusted by thousands.',
    keywords: 'property lawyer Nigeria, legal services Lagos, land title verification, C of O verification, property documentation, legal consultation Nigeria, deed of assignment, property due diligence',
    ogImage: '/images/ile-legal-og-image.jpg',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Ile Legal',
      'description': 'Nigeria\'s Premier Property Legal Services Platform',
      'url': 'https://ilelegal.com',
      'logo': 'https://ilelegal.com/logo.png',
      'sameAs': [
        'https://www.linkedin.com/company/ileplatform/',
        'https://x.com/IlePlatform',
        'https://www.instagram.com/ileplatform/',
        'https://t.me/ileplatformchat'
      ],
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'Nigeria'
      },
      'serviceArea': {
        '@type': 'Country',
        'name': 'Nigeria'
      }
    }
  },

  lawyerProfile: (lawyerName: string, specializations: string[], rating: number, location: string) => ({
    title: `${lawyerName} - Verified Property Lawyer | Ile Legal`,
    description: `Connect with ${lawyerName}, a verified property lawyer in ${location}. Specializing in ${specializations.join(', ')}. ${rating}/5 rating from verified clients. Get legal consultation today.`,
    keywords: `${lawyerName}, property lawyer ${location}, ${specializations.join(', ')}, legal consultation, verified lawyer Nigeria`,
    ogTitle: `${lawyerName} - Property Lawyer in ${location}`,
    ogDescription: `Verified property lawyer specializing in ${specializations.join(', ')}. ${rating}/5 stars from clients.`,
    ogType: 'profile',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      'name': `${lawyerName} Legal Services`,
      'provider': {
        '@type': 'Person',
        'name': lawyerName,
        'jobTitle': 'Property Lawyer',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': location,
          'addressCountry': 'Nigeria'
        }
      },
      'areaServed': 'Nigeria',
      'serviceType': specializations,
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': rating,
        'bestRating': 5
      }
    }
  }),

  login: {
    title: 'Login - Ile Legal | Access Your Legal Services Account',
    description: 'Login to your Ile Legal account to access property legal services, connect with verified lawyers, and manage your legal consultations.',
    keywords: 'login, legal services account, property lawyer access'
  },

  register: {
    title: 'Join Ile Legal - Connect with Nigeria\'s Best Property Lawyers',
    description: 'Create your Ile Legal account to access verified property lawyers across Nigeria. Get expert legal help for land titles, property documentation, and legal consultations.',
    keywords: 'register lawyer Nigeria, join legal platform, property legal services signup'
  },

  sellerDashboard: {
    title: 'Lawyer Dashboard - Manage Your Legal Practice | Ile Legal',
    description: 'Manage your legal practice on Ile Legal. View client requests, track cases, manage earnings, and grow your property law practice.',
    keywords: 'lawyer dashboard, legal practice management, property law cases'
  },

  buyerDashboard: {
    title: 'Client Dashboard - Your Legal Services Hub | Ile Legal',
    description: 'Access your legal services dashboard. Track your cases, communicate with lawyers, and manage your property legal needs.',
    keywords: 'client dashboard, legal services hub, property legal help'
  },

  services: {
    propertyPurchase: {
      title: 'Property Purchase Agreement Services | Ile Legal',
      description: 'Expert legal help for property purchase agreements in Nigeria. Verified lawyers ensure secure property transactions with proper documentation.',
      keywords: 'property purchase agreement Nigeria, property buying legal help, real estate lawyer'
    },
    landTitleVerification: {
      title: 'Land Title Verification Services | Nigeria Property Lawyers',
      description: 'Professional land title verification services across Nigeria. Ensure your property title is authentic and legally sound with verified property lawyers.',
      keywords: 'land title verification Nigeria, property title check, land ownership verification'
    },
    coVerification: {
      title: 'Certificate of Occupancy (C of O) Verification | Ile Legal',
      description: 'Expert C of O verification services in Nigeria. Verify the authenticity of Certificate of Occupancy with experienced property lawyers.',
      keywords: 'C of O verification Nigeria, certificate of occupancy check, property title verification'
    }
  }
};

// Hook for easy SEO management in React components
export const useSEO = () => {
  const seoManager = SEOManager.getInstance();

  const updateSEO = (config: SEOConfig) => {
    seoManager.updatePageSEO(config);
  };

  return { updateSEO };
};