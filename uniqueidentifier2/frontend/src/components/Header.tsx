import React from 'react';
import { KeyIcon, BoltIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <header className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20 flex-shrink-0">
      <div className="w-full px-3 py-2">
        <h1 className="text-xl font-bold text-white text-center flex items-center justify-center space-x-2">
          <KeyIcon className="w-5 h-5" />
          <span>Unique Key Identifier</span>
        </h1>
        <div className="flex justify-center items-center gap-4 mt-2">
          <a 
            href="/" 
            className="text-white text-sm hover:text-blue-200 transition-colors"
          >
            Standard Analysis
          </a>
          <a 
            href="/parallel-comparison" 
            className="text-white text-sm hover:text-blue-200 transition-colors flex items-center gap-1"
          >
            <BoltIcon className="w-4 h-4" />
            <span>⚡ Parallel Comparison</span>
          </a>
          <a 
            href="/data-quality" 
            className="text-white text-sm hover:text-blue-200 transition-colors"
          >
            Data Quality
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;