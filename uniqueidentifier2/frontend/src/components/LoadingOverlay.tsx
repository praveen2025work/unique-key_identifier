import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { ProgressStep } from '../types';

interface LoadingOverlayProps {
  show: boolean;
  steps: ProgressStep[];
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, steps }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div 
              className="absolute inset-0 w-16 h-16 border-4 border-secondary border-b-transparent rounded-full animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1s' }}
            ></div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mt-6">Analyzing Files...</h3>
          <p className="text-gray-600 mt-2 text-center">Please wait while we process your data</p>
          
          {/* Progress Steps */}
          <div className="w-full mt-6 space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                  ${step.status === 'completed' 
                    ? 'bg-green-500' 
                    : step.status === 'active' 
                      ? 'bg-primary animate-pulse' 
                      : 'bg-gray-300'
                  }
                `}>
                  {step.status === 'completed' ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`
                  text-sm
                  ${step.status === 'active' 
                    ? 'text-gray-800 font-semibold' 
                    : step.status === 'pending' 
                      ? 'text-gray-600' 
                      : 'text-green-600'
                  }
                `}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
