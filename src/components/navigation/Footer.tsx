import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-500 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center">
              <img 
                src="https://www.ile.africa/images/logo.png" 
                alt="Ilé Legal" 
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-bold text-white font-serif">Ilé Legal</span>
            </Link>
            <p className="mt-4 text-sm text-gray-100">
              Connecting property developers and investors with verified legal professionals 
              for property due diligence and compliance tasks.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-100 hover:text-secondary-500 transition-colors">
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-gray-100 hover:text-secondary-500 transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-100 hover:text-secondary-500 transition-colors">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-gray-100 hover:text-secondary-500 transition-colors">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-500 font-sans">Services</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="#" className="text-gray-100 hover:text-secondary-500 transition-colors text-sm">Land Title Verification</Link></li>
              <li><Link to="#" className="text-gray-100 hover:text-secondary-500 transition-colors text-sm">Contract Review</Link></li>
              <li><Link to="#" className="text-gray-100 hover:text-secondary-500 transition-colors text-sm">Property Surveys</Link></li>
              <li><Link to="#" className="text-gray-100 hover:text-secondary-500 transition-colors text-sm">Compliance Checks</Link></li>
              <li><Link to="#" className="text-gray-100 hover:text-secondary-500 transition-colors text-sm">Due Diligence</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-500 font-sans">Contact Us</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <MapPin size={18} className="mt-1 mr-2 flex-shrink-0 text-secondary-500" />
                <span className="text-sm text-gray-100">123 Legal Square, Victoria Island, Lagos</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 flex-shrink-0 text-secondary-500" />
                <span className="text-sm text-gray-100">+234 123 456 7890</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 flex-shrink-0 text-secondary-500" />
                <span className="text-sm text-gray-100">contact@ilelegal.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-400 pt-6">
          <p className="text-sm text-center text-gray-100">
            © {new Date().getFullYear()} Ilé Legal Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;