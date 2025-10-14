import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CogIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useApi } from '../contexts/ApiContext';

interface ApiSettingsProps {
  currentEndpoint: string;
  onEndpointChange: (endpoint: string) => void;
}

interface FormData {
  endpoint: string;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ currentEndpoint, onEndpointChange }) => {
  const { api } = useApi();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      endpoint: currentEndpoint,
    },
  });

  const watchedEndpoint = watch('endpoint');

  const testConnection = async (endpoint: string) => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${endpoint}/health`);
      if (response.ok) {
        setTestResult('success');
        toast.success('Connection successful!');
      } else {
        setTestResult('error');
        toast.error('Server responded with error');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Failed to connect to server');
    } finally {
      setTesting(false);
    }
  };

  const onSubmit = (data: FormData) => {
    onEndpointChange(data.endpoint);
    toast.success('API endpoint updated!');
  };

  const presetEndpoints = [
    { name: 'Local Development', url: 'http://localhost:8000' },
    { name: 'Local Alternative', url: 'http://127.0.0.1:8000' },
    { name: 'Docker Container', url: 'http://localhost:8001' },
    { name: 'Remote Server', url: 'https://your-server.com' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="flex items-center space-x-3 mb-8">
          <CogIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-800">API Settings</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint URL
            </label>
            <div className="flex space-x-2">
              <input
                {...register('endpoint', { required: true })}
                type="url"
                placeholder="http://localhost:8000"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => testConnection(watchedEndpoint)}
                disabled={testing || !watchedEndpoint}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <span>Test</span>
                    {testResult === 'success' && <CheckIcon className="w-4 h-4" />}
                    {testResult === 'error' && <XMarkIcon className="w-4 h-4" />}
                  </>
                )}
              </button>
            </div>
            
            {testResult && (
              <div className={`mt-2 p-3 rounded-lg flex items-center space-x-2 ${
                testResult === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult === 'success' ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {testResult === 'success' 
                    ? 'Connection successful! Server is responding.' 
                    : 'Connection failed. Please check the URL and ensure the server is running.'
                  }
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presetEndpoints.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setValue('endpoint', preset.url)}
                  className="p-3 text-left border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="font-semibold text-gray-800">{preset.name}</div>
                  <div className="text-sm text-gray-600">{preset.url}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 btn-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• You can run multiple backend instances on different ports</li>
            <li>• Each browser tab can connect to a different endpoint</li>
            <li>• Test the connection before saving to ensure the server is running</li>
            <li>• The endpoint is saved locally in your browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;
