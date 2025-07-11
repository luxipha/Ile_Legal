import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { 
  CheckCircle, 
  Star, 
  Shield, 
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react';
import { EmailCapture } from '../../components/EmailCapture';
import { useSEO } from '../../utils/seo';
import { useAnalytics } from '../../utils/analytics';

interface ServiceData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  benefits: string[];
  process: { step: number; title: string; description: string }[];
  pricing: {
    basic: { price: string; features: string[] };
    premium: { price: string; features: string[] };
  };
  faqs: { question: string; answer: string }[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

const servicesData: { [key: string]: ServiceData } = {
  'property-purchase': {
    slug: 'property-purchase',
    title: 'Property Purchase Agreement Services',
    subtitle: 'Secure Your Property Investment with Expert Legal Documentation',
    description: 'Professional property purchase agreement services ensuring your real estate transactions are legally sound and protected. Our verified lawyers handle all documentation with precision.',
    features: [
      'Comprehensive Due Diligence',
      'Contract Drafting & Review',
      'Title Verification',
      'Legal Risk Assessment',
      'Transaction Oversight',
      'Document Preparation'
    ],
    benefits: [
      'Protect your investment from legal complications',
      'Ensure clear property ownership transfer',
      'Avoid hidden liens and encumbrances',
      'Professional negotiation support',
      'Fast turnaround time (3-7 days)',
      'Money-back guarantee'
    ],
    process: [
      { step: 1, title: 'Submit Requirements', description: 'Provide property details and documentation' },
      { step: 2, title: 'Legal Review', description: 'Expert lawyer reviews all documents and title' },
      { step: 3, title: 'Agreement Drafting', description: 'Professional purchase agreement preparation' },
      { step: 4, title: 'Final Review', description: 'Client review and approval before execution' }
    ],
    pricing: {
      basic: {
        price: '₦50,000 - ₦150,000',
        features: ['Document Review', 'Basic Due Diligence', 'Agreement Drafting', 'Email Support']
      },
      premium: {
        price: '₦200,000 - ₦500,000',
        features: ['Comprehensive Due Diligence', 'On-site Verification', 'Title Insurance', 'Phone Support', 'Expedited Service']
      }
    },
    faqs: [
      {
        question: 'How long does the property purchase process take?',
        answer: 'Typically 3-7 business days for standard transactions. Complex cases may take up to 14 days.'
      },
      {
        question: 'What documents do I need to provide?',
        answer: 'Property details, seller information, survey plans, and any existing documentation related to the property.'
      },
      {
        question: 'Is my money protected during the transaction?',
        answer: 'Yes, we use secure escrow services to protect your funds until all conditions are met.'
      }
    ],
    seo: {
      title: 'Property Purchase Agreement Services | Expert Legal Help Nigeria',
      description: 'Secure property purchase agreements with verified Nigerian lawyers. Professional due diligence, contract drafting, and title verification. Protect your real estate investment today.',
      keywords: 'property purchase agreement Nigeria, real estate lawyer, property documentation, land purchase legal help, property due diligence Nigeria'
    }
  },
  'land-title-verification': {
    slug: 'land-title-verification',
    title: 'Land Title Verification Services',
    subtitle: 'Verify Land Ownership & Prevent Property Fraud',
    description: 'Comprehensive land title verification services to ensure authentic ownership and prevent property fraud. Our expert lawyers conduct thorough searches and provide detailed reports.',
    features: [
      'Title Document Authentication',
      'Ownership History Search',
      'Encumbrance Verification',
      'Survey Plan Validation',
      'Court Records Check',
      'Government Registry Search'
    ],
    benefits: [
      'Prevent property fraud and disputes',
      'Confirm legitimate ownership',
      'Identify potential legal issues',
      'Peace of mind for investments',
      'Comprehensive verification report',
      'Expert legal recommendations'
    ],
    process: [
      { step: 1, title: 'Document Submission', description: 'Submit title documents and property details' },
      { step: 2, title: 'Registry Search', description: 'Search government registries and court records' },
      { step: 3, title: 'Verification Report', description: 'Detailed report on title authenticity and issues' },
      { step: 4, title: 'Recommendations', description: 'Expert advice on next steps and risk mitigation' }
    ],
    pricing: {
      basic: {
        price: '₦25,000 - ₦75,000',
        features: ['Basic Title Search', 'Ownership Verification', 'Digital Report', 'Email Support']
      },
      premium: {
        price: '₦100,000 - ₦200,000',
        features: ['Comprehensive Search', 'Court Records Check', 'Site Verification', 'Legal Opinion', 'Phone Consultation']
      }
    },
    faqs: [
      {
        question: 'How accurate is the title verification process?',
        answer: 'Our verification process is 99.5% accurate, using multiple official sources and expert legal analysis.'
      },
      {
        question: 'What if issues are found with the title?',
        answer: 'We provide detailed recommendations for resolving any issues and can connect you with specialists if needed.'
      },
      {
        question: 'How long does verification take?',
        answer: 'Standard verification takes 2-5 business days. Rush services available for urgent needs.'
      }
    ],
    seo: {
      title: 'Land Title Verification Nigeria | Prevent Property Fraud',
      description: 'Professional land title verification services in Nigeria. Verify ownership, prevent fraud, and secure your property investment. Expert lawyers, fast results.',
      keywords: 'land title verification Nigeria, property title check, land ownership verification, property fraud prevention, title search Nigeria'
    }
  },
  'c-of-o-verification': {
    slug: 'c-of-o-verification',
    title: 'Certificate of Occupancy (C of O) Verification',
    subtitle: 'Authenticate Your C of O & Ensure Legal Compliance',
    description: 'Expert Certificate of Occupancy verification services to confirm authenticity and legal standing. Protect your property investment with thorough C of O validation.',
    features: [
      'C of O Authenticity Check',
      'Government Registry Verification',
      'Compliance Status Review',
      'Renewal Status Check',
      'Legal Standing Assessment',
      'Documentation Review'
    ],
    benefits: [
      'Confirm C of O authenticity',
      'Avoid fraudulent documents',
      'Ensure legal compliance',
      'Identify renewal requirements',
      'Professional legal opinion',
      'Investment protection'
    ],
    process: [
      { step: 1, title: 'C of O Submission', description: 'Submit Certificate of Occupancy for verification' },
      { step: 2, title: 'Registry Check', description: 'Verify with relevant government registries' },
      { step: 3, title: 'Compliance Review', description: 'Check compliance and renewal status' },
      { step: 4, title: 'Verification Report', description: 'Detailed report with legal recommendations' }
    ],
    pricing: {
      basic: {
        price: '₦15,000 - ₦50,000',
        features: ['Basic Verification', 'Registry Check', 'Status Report', 'Email Support']
      },
      premium: {
        price: '₦75,000 - ₦150,000',
        features: ['Full Verification', 'Compliance Review', 'Legal Opinion', 'Renewal Guidance', 'Phone Support']
      }
    },
    faqs: [
      {
        question: 'What is included in C of O verification?',
        answer: 'We verify authenticity, check government records, review compliance status, and provide renewal guidance.'
      },
      {
        question: 'Can you help with C of O renewal?',
        answer: 'Yes, our premium service includes renewal guidance and can connect you with renewal specialists.'
      },
      {
        question: 'How do I know if my C of O is authentic?',
        answer: 'Our verification process cross-references multiple government databases to confirm authenticity.'
      }
    ],
    seo: {
      title: 'C of O Verification Nigeria | Certificate of Occupancy Check',
      description: 'Professional Certificate of Occupancy verification in Nigeria. Confirm C of O authenticity, compliance status, and legal standing. Expert verification services.',
      keywords: 'C of O verification Nigeria, certificate of occupancy check, property title verification, C of O authentication, property compliance Nigeria'
    }
  }
};

interface ServiceLandingPageProps {
  serviceSlug?: string;
}

export const ServiceLandingPage: React.FC<ServiceLandingPageProps> = ({ serviceSlug }) => {
  const { slug } = useParams<{ slug: string }>();
  const currentSlug = serviceSlug || slug;
  const service = currentSlug ? servicesData[currentSlug] : null;
  const { updateSEO } = useSEO();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (service) {
      updateSEO({
        title: service.seo.title,
        description: service.seo.description,
        keywords: service.seo.keywords,
        canonicalUrl: `https://ilelegal.com/services/${service.slug}`,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Service',
          'name': service.title,
          'description': service.description,
          'provider': {
            '@type': 'Organization',
            'name': 'Ile Legal',
            'url': 'https://ilelegal.com'
          },
          'areaServed': 'Nigeria',
          'serviceType': 'Legal Service',
          'offers': {
            '@type': 'Offer',
            'price': service.pricing.basic.price,
            'priceCurrency': 'NGN'
          }
        }
      });
    }
  }, [service, updateSEO]);

  const handleGetQuote = () => {
    trackEvent('get_quote', 'service_inquiry', service?.slug);
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-6">The requested service page could not be found.</p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1B1828] to-[#282536] text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              {service.title}
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              {service.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] font-semibold"
                onClick={handleGetQuote}
              >
                Get Free Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828]"
              >
                <Phone className="mr-2 w-5 h-5" />
                Call Now: +234 706 884 9553
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Included</h2>
            <p className="text-lg text-gray-600">Comprehensive legal services for your property needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {service.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-[#FEC85F] mt-1 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Our Services?</h2>
              <div className="space-y-4">
                {service.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-[#1B1828] mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-[#FEC85F]/20">
              <div className="text-center mb-6">
                <Star className="w-12 h-12 text-[#FEC85F] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted by 1000+ Clients</h3>
                <p className="text-gray-600">4.9/5 average rating from verified clients</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#1B1828]">500+</div>
                  <div className="text-sm text-gray-600">Properties Verified</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1B1828]">99.5%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple 4-step process to secure your property</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {service.process.map((step, index) => (
              <Card key={index} className="text-center border-t-4 border-[#FEC85F]">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#1B1828] text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Choose the service level that fits your needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="border-2 border-gray-200 hover:border-blue-600 transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Basic Service</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">{service.pricing.basic.price}</div>
                  <p className="text-gray-600">Essential legal protection</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {service.pricing.basic.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full" variant="outline">
                  Get Basic Service
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-[#1B1828] relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#1B1828] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Service</h3>
                  <div className="text-3xl font-bold text-[#1B1828] mb-4">{service.pricing.premium.price}</div>
                  <p className="text-gray-600">Comprehensive protection</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {service.pricing.premium.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-[#FEC85F] flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90">
                  Get Premium Service
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-[#FEC85F]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Informed</h2>
            <p className="text-lg text-gray-600">Get updates on property law and special offers</p>
          </div>
          
          <EmailCapture
            variant="updates"
            title="Get Legal Updates"
            subtitle="Receive important updates about property law in Nigeria"
            className="max-w-md mx-auto"
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Common questions about our {service.title.toLowerCase()}</p>
          </div>
          
          <div className="space-y-8">
            {service.faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Property?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Get started with professional legal services today
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]">
              <Mail className="mr-2 w-5 h-5" />
              Get Free Consultation
            </Button>
            <Button size="lg" variant="outline" className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828]">
              <Phone className="mr-2 w-5 h-5" />
              Call: +234 706 884 9553
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};