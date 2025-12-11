import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, User } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-grima-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/i.png" alt="Grima Financial" className="h-10 w-10" />
              <span className="text-xl font-bold">Grima Financial</span>
            </div>
            <p className="text-grima-100 mb-4 max-w-md">
              Empowering young Canadians with affordable, unbiased, and personalized financial guidance. Helping the next generation build a more secure financial future.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/services" className="text-grima-200 hover:text-white transition-colors">Our Services</Link></li>
              <li><Link to="/booking" className="text-grima-200 hover:text-white transition-colors">Book Session</Link></li>
              {/* Removed About Us link as per request */}
              <li><Link to="/assessments" className="text-grima-200 hover:text-white transition-colors">Assessments</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Socials</h3>
            <div className="space-y-3">
               <a href="https://www.instagram.com/GrimaFinancial" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-grima-200 hover:text-white transition-colors"><Instagram size={20} /><span>Instagram</span></a>
               <a href="https://www.youtube.com/@GrimaFinancial" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-grima-200 hover:text-white transition-colors"><Youtube size={20} /><span>YouTube</span></a>
               <a href="https://www.tiktok.com/@grimafinancial" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-grima-200 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                  <span>TikTok</span>
               </a>
                <a href="https://www.blossomsocial.com/users/Jacob__AbbGWA8gvnvhgThq" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-grima-200 hover:text-white transition-colors"><User size={20} /><span>Grima's Portfolio</span></a>
            </div>
          </div>
        </div>

        <div className="border-t border-grima-600 mt-8 pt-8 text-center">
          <p className="text-grima-200 text-sm">© {new Date().getFullYear()} Grima Financial. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;