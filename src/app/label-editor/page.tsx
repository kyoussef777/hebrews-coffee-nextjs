'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LabelEditor from '@/components/LabelEditor';
import Navigation from '@/components/Navigation';
import { LabelSettings } from '@/types';
import { Plus, Settings, Star, StarOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

function LabelEditorContent() {
  const [labelSettings, setLabelSettings] = useState<LabelSettings | undefined>();
  const [savedConfigs, setSavedConfigs] = useState<LabelSettings[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<LabelSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigList, setShowConfigList] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const configId = searchParams?.get('id');

  useEffect(() => {
    loadSavedConfigs();
    loadDefaultConfig();
    if (configId) {
      loadLabelSettings(configId);
    } else {
      setIsLoading(false);
    }
  }, [configId]);

  const loadSavedConfigs = async () => {
    try {
      const response = await fetch('/api/label-settings');
      const data = await response.json();
      if (data.success) {
        setSavedConfigs(data.data);
      }
    } catch (error) {
      console.error('Error loading saved configurations:', error);
    }
  };

  const loadDefaultConfig = async () => {
    try {
      const response = await fetch('/api/settings/default-label-config');
      const data = await response.json();
      if (data.success) {
        setDefaultConfig(data.data);
      }
    } catch (error) {
      console.error('Error loading default configuration:', error);
    }
  };

  const loadLabelSettings = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/label-settings/${id}`);
      const data = await response.json();
      if (data.success) {
        setLabelSettings(data.data);
      } else {
        console.error('Error loading label settings:', data.error);
      }
    } catch (error) {
      console.error('Error loading label settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (settings: Partial<LabelSettings>) => {
    try {
      const url = labelSettings?.id 
        ? `/api/label-settings/${labelSettings.id}`
        : '/api/label-settings';
      
      const method = labelSettings?.id ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        setLabelSettings(data.data);
        await loadSavedConfigs(); // Refresh the list
        
        // If this configuration is the current default, refresh default config too
        if (defaultConfig?.id === data.data.id) {
          await loadDefaultConfig();
        }
        
        alert('Label configuration saved successfully!');
        
        // Update URL if this was a new configuration
        if (!labelSettings?.id) {
          router.push(`/label-editor?id=${data.data.id}`);
        }
      } else {
        alert('Failed to save label configuration: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving label settings:', error);
      alert('Error saving label configuration');
    }
  };

  const handlePreview = async (settings: LabelSettings) => {
    try {
      // Create a temporary order for preview
      const sampleOrder = {
        id: 'preview',
        orderNumber: 1234,
        customerName: 'John Doe',
        drink: 'Cappuccino',
        milk: 'Oat Milk',
        syrup: 'Vanilla',
        foam: 'Extra Foam',
        temperature: 'Extra Hot',
        extraShots: 1,
        notes: 'Extra foam please, thanks!',
        status: 'PENDING' as const,
        price: 4.50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate preview label with custom settings
      const response = await fetch('/api/orders/preview/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: sampleOrder,
          labelSettings: settings,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'label-preview.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const loadConfiguration = (config: LabelSettings) => {
    setLabelSettings(config);
    setShowConfigList(false);
    router.push(`/label-editor?id=${config.id}`);
  };

  const deleteConfiguration = async (config: LabelSettings) => {
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) return;

    try {
      const response = await fetch(`/api/label-settings/${config.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh all related state
        await loadSavedConfigs();
        await loadDefaultConfig();
        
        // If we're deleting the currently loaded config, clear it
        if (labelSettings?.id === config.id) {
          setLabelSettings(undefined);
          router.push('/label-editor');
        }
        
        alert('Configuration deleted successfully!');
      } else {
        alert('Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      alert('Error deleting configuration');
    }
  };

  const setAsDefaultConfig = async (config: LabelSettings) => {
    if (!confirm(`Set "${config.name}" as the default label configuration for the entire app?`)) return;

    try {
      const response = await fetch('/api/settings/default-label-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelConfigId: config.id }),
      });

      const data = await response.json();
      if (data.success) {
        // Update state immediately and refresh from server
        setDefaultConfig(config);
        await loadDefaultConfig(); // Ensure we have the latest server state
        alert('Default label configuration updated successfully!');
      } else {
        alert('Failed to set default configuration: ' + data.error);
      }
    } catch (error) {
      console.error('Error setting default configuration:', error);
      alert('Error setting default configuration');
    }
  };

  const clearDefaultConfig = async () => {
    if (!confirm('Clear the default label configuration? Orders will use a basic default layout.')) return;

    try {
      const response = await fetch('/api/settings/default-label-config', {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Update state immediately and refresh from server
        setDefaultConfig(null);
        await loadDefaultConfig(); // Ensure we have the latest server state
        alert('Default label configuration cleared successfully!');
      } else {
        alert('Failed to clear default configuration: ' + data.error);
      }
    } catch (error) {
      console.error('Error clearing default configuration:', error);
      alert('Error clearing default configuration');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="space-y-3 lg:hidden">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900">Label Editor</h1>
              <button
                onClick={() => {
                  setLabelSettings(undefined);
                  router.push('/label-editor');
                }}
                className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </button>
            </div>
            
            {labelSettings && (
              <div className="text-sm text-gray-600 font-medium truncate">
                Editing: {labelSettings.name}
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              {defaultConfig && (
                <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                  <Star className="h-3 w-3 text-amber-600 flex-shrink-0" />
                  <span className="text-amber-800 truncate">
                    Default: <span className="font-medium">{defaultConfig.name}</span>
                  </span>
                  <button
                    onClick={clearDefaultConfig}
                    className="ml-auto text-amber-600 hover:text-amber-800 flex-shrink-0"
                    title="Clear default"
                  >
                    <StarOff className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowConfigList(!showConfigList)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>Saved Configs ({savedConfigs.length})</span>
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Label Editor
                {labelSettings && (
                  <span className="text-gray-600 ml-2 text-lg font-normal">- {labelSettings.name}</span>
                )}
              </h1>
              {defaultConfig && (
                <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Default: <span className="font-medium">{defaultConfig.name}</span>
                  </span>
                  <button
                    onClick={clearDefaultConfig}
                    className="ml-2 text-amber-600 hover:text-amber-800"
                    title="Clear default configuration"
                  >
                    <StarOff className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfigList(!showConfigList)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <span>Saved Configurations ({savedConfigs.length})</span>
              </button>
              
              <button
                onClick={() => {
                  setLabelSettings(undefined);
                  router.push('/label-editor');
                }}
                className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                <span className='text-white'>New Configuration</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration List */}
      {showConfigList && (
        <div className="bg-gray-100 border-b border-gray-200 max-h-96 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">Saved Configurations</h2>
              <button
                onClick={() => setShowConfigList(false)}
                className="lg:hidden text-gray-400 hover:text-gray-600 text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {savedConfigs.length === 0 ? (
              <p className="text-gray-600 text-sm">No saved configurations yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {savedConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{config.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {config.width}mm × {config.height}mm • {config.elements.length} elements
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated {new Date(config.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => loadConfiguration(config)}
                          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded text-center"
                        >
                          Load
                        </button>
                        {defaultConfig?.id === config.id ? (
                          <div className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs sm:text-sm rounded">
                            <Star className="h-3 w-3" />
                            <span>Default</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAsDefaultConfig(config)}
                            className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs sm:text-sm rounded flex items-center justify-center space-x-1"
                            title="Set as default for all orders"
                          >
                            <Settings className="h-3 w-3" />
                            <span className="hidden sm:inline">Set Default</span>
                            <span className="sm:hidden">Default</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteConfiguration(config)}
                          className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Label Editor */}
      <LabelEditor
        labelSettings={labelSettings}
        onSave={handleSave}
        onPreview={handlePreview}
      />
    </div>
  );
}

export default function LabelEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    }>
      <LabelEditorContent />
    </Suspense>
  );
}