import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import apiService from '../services/api';
import type { Environment } from '../types';
import toast from 'react-hot-toast';

interface EnvironmentSwitcherProps {
  currentEnvironment: string;
  onEnvironmentChange: (env: string) => void;
  children: (environment: string) => React.ReactNode;
}

export default function EnvironmentSwitcher({
  currentEnvironment,
  onEnvironmentChange,
  children,
}: EnvironmentSwitcherProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      const envs = await apiService.getEnvironments();
      setEnvironments(envs);
    } catch (error) {
      console.error('Failed to load environments:', error);
      // Use default environment if none exist
      setEnvironments([
        { id: 'default', name: 'Default', type: 'local', host: 'localhost', port: 8000, description: 'Default environment' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnvironment = () => {
    setShowAddDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2 text-gray-600">Loading environments...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs value={currentEnvironment} onValueChange={onEnvironmentChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-white rounded-lg shadow-sm p-1">
            {environments.map((env) => (
              <TabsTrigger
                key={env.id}
                value={env.name}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {env.name}
                {env.type === 'remote' && (
                  <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <button
            onClick={handleAddEnvironment}
            className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors text-sm font-medium"
          >
            + Add Environment
          </button>
        </div>

        {environments.map((env) => (
          <TabsContent key={env.id} value={env.name} className="mt-4">
            {children(env.name)}
          </TabsContent>
        ))}
      </Tabs>

      {showAddDialog && (
        <AddEnvironmentDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={loadEnvironments}
        />
      )}
    </div>
  );
}

// Simple UI tabs components (you can use a library like Radix UI or Shadcn instead)
function AddEnvironmentDialog({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'local',
    host: '',
    port: 8000,
    basePath: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createEnvironment(
        formData.name,
        formData.type,
        formData.host,
        formData.port,
        formData.basePath,
        formData.description
      );
      toast.success('Environment added successfully');
      onAdd();
      onClose();
    } catch (error) {
      toast.error('Failed to add environment');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add New Environment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="local">Local</option>
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="localhost or remote host"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Environment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

