'use client'

import { useState } from 'react';
import ModernDropdown from './ModernDropdown';
import { 
  UserIcon, 
  GlobeAltIcon, 
  CpuChipIcon,
  StarIcon 
} from '@heroicons/react/24/outline';

/**
 * Demo component showcasing all features of ModernDropdown
 * This component can be used for testing and as a reference
 */
const ModernDropdownDemo = () => {
  const [singleValue, setSingleValue] = useState('');
  const [multiValue, setMultiValue] = useState<(string | number)[]>([]);
  const [searchableValue, setSearchableValue] = useState('');
  const [variantValue, setVariantValue] = useState('');

  const countries = [
    { value: 'us', label: 'United States', icon: <GlobeAltIcon className="w-4 h-4" />, description: 'North America' },
    { value: 'uk', label: 'United Kingdom', icon: <GlobeAltIcon className="w-4 h-4" />, description: 'Europe' },
    { value: 'ca', label: 'Canada', icon: <GlobeAltIcon className="w-4 h-4" />, description: 'North America' },
    { value: 'au', label: 'Australia', icon: <GlobeAltIcon className="w-4 h-4" />, description: 'Oceania' },
    { value: 'de', label: 'Germany', icon: <GlobeAltIcon className="w-4 h-4" />, description: 'Europe' },
    { value: 'fr', label: 'France', icon: <GlobeAltIcon className="w-4 h-4" />, description: 'Europe' },
    { value: 'jp', label: 'Japan', icon: <GlobeAltIcon className="w-4 h-4" />, description: 'Asia' },
  ];

  const users = [
    { value: '1', label: 'John Doe', badge: 'Admin', icon: <UserIcon className="w-4 h-4" /> },
    { value: '2', label: 'Jane Smith', badge: 'Editor', icon: <UserIcon className="w-4 h-4" /> },
    { value: '3', label: 'Bob Johnson', badge: 'Viewer', icon: <UserIcon className="w-4 h-4" /> },
    { value: '4', label: 'Alice Williams', badge: 'Admin', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const technologies = [
    { value: 'react', label: 'React', icon: <CpuChipIcon className="w-4 h-4" />, badge: '★★★★★' },
    { value: 'vue', label: 'Vue.js', icon: <CpuChipIcon className="w-4 h-4" />, badge: '★★★★' },
    { value: 'angular', label: 'Angular', icon: <CpuChipIcon className="w-4 h-4" />, badge: '★★★' },
    { value: 'svelte', label: 'Svelte', icon: <CpuChipIcon className="w-4 h-4" />, badge: '★★★★' },
  ];

  const statusOptions = [
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Modern Dropdown Component</h1>
        <p className="text-gray-600 mb-8">
          A feature-rich dropdown component with search, multi-select, icons, badges, and more.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Dropdown */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Basic Dropdown</h2>
            <ModernDropdown
              label="Select a user"
              value={singleValue}
              onChange={(value) => setSingleValue(value as string)}
              options={users}
              placeholder="Choose a user..."
              hint="Select one user from the list"
            />
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              Selected: <strong>{singleValue || 'None'}</strong>
            </div>
          </div>

          {/* Multi-Select Dropdown */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Multi-Select</h2>
            <ModernDropdown
              label="Select technologies"
              value={multiValue}
              onChange={(value) => setMultiValue(value as (string | number)[])}
              options={technologies}
              placeholder="Choose multiple..."
              multiple={true}
              hint="You can select multiple technologies"
            />
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              Selected: <strong>{multiValue.length} item(s)</strong>
            </div>
          </div>

          {/* Searchable Dropdown */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Searchable with Icons</h2>
            <ModernDropdown
              label="Select a country"
              value={searchableValue}
              onChange={(value) => setSearchableValue(value as string)}
              options={countries}
              placeholder="Search countries..."
              searchable={true}
              clearable={true}
              icon={<GlobeAltIcon className="w-5 h-5" />}
              hint="Start typing to search"
            />
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              Selected: <strong>{searchableValue || 'None'}</strong>
            </div>
          </div>

          {/* Variant Styles */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Variant Styles</h2>
            <ModernDropdown
              label="Select status"
              value={variantValue}
              onChange={(value) => setVariantValue(value as string)}
              options={statusOptions}
              placeholder="Choose status..."
              variant={variantValue as 'default' | 'success' | 'error' | 'warning' | 'info' || 'default'}
            />
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setVariantValue('success')}
                className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Set Success
              </button>
              <button
                onClick={() => setVariantValue('error')}
                className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Set Error
              </button>
              <button
                onClick={() => setVariantValue('warning')}
                className="w-full px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              >
                Set Warning
              </button>
            </div>
          </div>

          {/* Size Variants */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
            <div className="space-y-4">
              <ModernDropdown
                label="Small"
                value=""
                onChange={() => {}}
                options={users}
                placeholder="Small dropdown..."
                size="sm"
              />
              <ModernDropdown
                label="Medium (Default)"
                value=""
                onChange={() => {}}
                options={users}
                placeholder="Medium dropdown..."
                size="md"
              />
              <ModernDropdown
                label="Large"
                value=""
                onChange={() => {}}
                options={users}
                placeholder="Large dropdown..."
                size="lg"
              />
            </div>
          </div>

          {/* Disabled State */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Disabled State</h2>
            <ModernDropdown
              label="Disabled dropdown"
              value="3"
              onChange={() => {}}
              options={users}
              placeholder="You can't select this..."
              disabled={true}
              hint="This dropdown is disabled"
            />
          </div>
        </div>

        {/* Feature List */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <StarIcon className="w-6 h-6 mr-2 text-yellow-500" />
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Custom dropdown menu (not native HTML select)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Search/filter functionality</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Multi-select support with chips</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Keyboard navigation (Arrow keys, Enter, Escape)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Click-outside to close</span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Custom option rendering (icons, badges, descriptions)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Multiple size variants (sm, md, lg)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Color variants (default, success, error, warning, info)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Smooth animations and transitions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Clearable option with X button</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-8 bg-gray-900 text-gray-100 p-6 rounded-lg shadow-md overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-white">Usage Example</h2>
          <pre className="text-sm">
{`import ModernDropdown from './ui/ModernDropdown';

<ModernDropdown
  label="Select a user"
  value={selectedUser}
  onChange={setSelectedUser}
  options={[
    { 
      value: '1', 
      label: 'John Doe', 
      badge: 'Admin',
      icon: <UserIcon className="w-4 h-4" />,
      description: 'System Administrator'
    },
    // ... more options
  ]}
  placeholder="Choose a user..."
  searchable={true}
  clearable={true}
  size="md"
  variant="default"
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ModernDropdownDemo;
