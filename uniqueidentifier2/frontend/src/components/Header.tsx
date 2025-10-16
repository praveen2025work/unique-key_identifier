import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KeyIcon, CogIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useApi } from '../contexts/ApiContext';
import AboutDialog from './AboutDialog';

const Header: React.FC = () => {
  const location = useLocation();
  const { endpoint } = useApi();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <header className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20 flex-shrink-0 shadow-lg">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <KeyIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Unique Key Identifier
              </h1>
              <p className="text-xs text-white text-opacity-80">
                v2.0 - Enterprise Edition
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAbout(true)}
              className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-all"
              title="About & User Guide"
            >
              <InformationCircleIcon className="w-6 h-6" />
            </button>

            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                location.pathname === '/' 
                  ? 'bg-white text-primary shadow-md' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Analysis
            </Link>
            
            <Link 
              to="/settings" 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                location.pathname === '/settings' 
                  ? 'bg-white text-primary shadow-md' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <CogIcon className="w-4 h-4" />
              <span>API Settings</span>
            </Link>
            
            <div className="bg-white bg-opacity-20 px-3 py-1.5 rounded-lg">
              <p className="text-xs text-white font-mono">
                {endpoint.replace('http://', '').replace('https://', '')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
    </header>
  );
};

export default Header;