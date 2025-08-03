'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LabelElement, LabelSettings } from '@/types';
import { Save, Trash2, Copy, Eye, Info } from 'lucide-react';

interface LabelEditorProps {
  labelSettings?: LabelSettings;
  onSave: (settings: Partial<LabelSettings>) => void;
  onPreview: (settings: LabelSettings) => void;
}

const DEFAULT_ELEMENTS: LabelElement[] = [
  {
    id: 'header',
    type: 'header',
    x: 45.15,
    y: 4,
    fontSize: 10,
    fontWeight: 'bold',
    fontStyle: 'normal',
    align: 'center',
  },
  {
    id: 'orderNumber',
    type: 'orderNumber',
    x: 45.15,
    y: 8,
    fontSize: 9,
    fontWeight: 'normal',
    fontStyle: 'normal',
    align: 'center',
  },
  {
    id: 'customerName',
    type: 'customerName',
    x: 45.15,
    y: 14,
    fontSize: 12,
    fontWeight: 'bold',
    fontStyle: 'normal',
    align: 'center',
  },
  {
    id: 'drink',
    type: 'drink',
    x: 45.15,
    y: 18,
    fontSize: 10,
    fontWeight: 'normal',
    fontStyle: 'normal',
    align: 'center',
  },
  {
    id: 'details',
    type: 'details',
    x: 45.15,
    y: 22,
    fontSize: 8,
    fontWeight: 'normal',
    fontStyle: 'normal',
    align: 'center',
    maxWidth: 85,
    maxLines: 2,
  },
  {
    id: 'notes',
    type: 'notes',
    x: 45.15,
    y: 26,
    fontSize: 7,
    fontWeight: 'normal',
    fontStyle: 'italic',
    align: 'center',
    maxWidth: 85,
    maxLines: 2,
  },
  {
    id: 'verse',
    type: 'verse',
    x: 45.15,
    y: 31,
    fontSize: 6,
    fontWeight: 'normal',
    fontStyle: 'italic',
    align: 'center',
    maxWidth: 85,
    maxLines: 3,
  },
];

export default function LabelEditor({ labelSettings, onSave, onPreview }: LabelEditorProps) {
  const [name, setName] = useState(labelSettings?.name || 'Custom Label');
  const [width, setWidth] = useState(labelSettings?.width || 90.3);
  const [height, setHeight] = useState(labelSettings?.height || 36);
  const [elements, setElements] = useState<LabelElement[]>(
    labelSettings?.elements || DEFAULT_ELEMENTS
  );
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showHelpTip, setShowHelpTip] = useState(true);

  // Update component state when labelSettings prop changes
  useEffect(() => {
    if (labelSettings) {
      setName(labelSettings.name);
      setWidth(labelSettings.width);
      setHeight(labelSettings.height);
      setElements(labelSettings.elements);
      setSelectedElement(null); // Clear selection when loading new config
    } else {
      // Reset to defaults when no labelSettings provided
      setName('Custom Label');
      setWidth(90.3);
      setHeight(29);
      setElements(DEFAULT_ELEMENTS);
      setSelectedElement(null);
    }
  }, [labelSettings]);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Scale factor for preview (500px width = 90.3mm, so ~5.54px per mm)
  const scale = 500 / width;

  // Auto-hide help tip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelpTip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = elements.find(el => el.id === elementId);
    if (element && previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const elementX = element.x * scale;
      const elementY = element.y * scale;
      
      setDragOffset({
        x: e.clientX - rect.left - elementX,
        y: e.clientY - rect.top - elementY,
      });
    }
  }, [elements, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left - dragOffset.x) / scale;
    const newY = (e.clientY - rect.top - dragOffset.y) / scale;
    
    // Constrain to label bounds
    const constrainedX = Math.max(0, Math.min(width, newX));
    const constrainedY = Math.max(0, Math.min(height, newY));
    
    setElements(prev => prev.map(el => 
      el.id === selectedElement 
        ? { ...el, x: constrainedX, y: constrainedY }
        : el
    ));
  }, [isDragging, selectedElement, dragOffset, scale, width, height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const updateElement = (elementId: string, updates: Partial<LabelElement>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const duplicateElement = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const newElement: LabelElement = {
        ...element,
        id: `${element.id}_copy_${Date.now()}`,
        x: element.x + 5,
        y: element.y + 2,
      };
      setElements(prev => [...prev, newElement]);
    }
  }, [elements]);

  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const handleSave = useCallback(() => {
    onSave({
      name,
      width,
      height,
      elements,
    });
  }, [name, width, height, elements, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      if (e.key === 'Delete' && selectedElement) {
        e.preventDefault();
        deleteElement(selectedElement);
      } else if (e.key === 'Escape') {
        setSelectedElement(null);
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'd' && selectedElement) {
          e.preventDefault();
          duplicateElement(selectedElement);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, deleteElement, duplicateElement, handleSave]);

  const handlePreview = () => {
    onPreview({
      id: labelSettings?.id || 'preview',
      name,
      width,
      height,
      elements,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  const getElementDisplayName = (type: LabelElement['type']) => {
    const names = {
      header: 'Header (HeBrews Coffee)',
      orderNumber: 'Order Number',
      customerName: 'Customer Name', 
      drink: 'Drink Name',
      details: 'Drink Details',
      notes: 'Customer Notes',
      verse: 'Bible Verse (NKJV)',
    };
    return names[type];
  };

  const getSampleText = (type: LabelElement['type']) => {
    const samples = {
      header: 'HeBrews Coffee',
      orderNumber: '#1234',
      customerName: 'John Doe',
      drink: 'Cappuccino',
      details: 'Oat Milk, Vanilla, Extra Hot',
      notes: 'Note: Extra foam please',
      verse: 'The Lord bless you and keep you. - Numbers 6:24',
    };
    return samples[type];
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Controls Panel */}
      <div className="w-80 bg-white p-6 border-r border-gray-200 overflow-y-auto shadow-sm">
        <div className="space-y-6">
          {/* Label Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Label Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Label configuration name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="10"
                    max="200"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (mm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="10"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Element Properties */}
          {selectedElementData && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Element Properties</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Element Type
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600">
                    {getElementDisplayName(selectedElementData.type)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X Position (mm)
                    </label>
                    <input
                      type="number"
                      value={selectedElementData.x.toFixed(1)}
                      onChange={(e) => updateElement(selectedElementData.id, { x: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Y Position (mm)
                    </label>
                    <input
                      type="number"
                      value={selectedElementData.y.toFixed(1)}
                      onChange={(e) => updateElement(selectedElementData.id, { y: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size (pt)
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.fontSize}
                    onChange={(e) => updateElement(selectedElementData.id, { fontSize: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="4"
                    max="24"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={selectedElementData.fontWeight}
                      onChange={(e) => updateElement(selectedElementData.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Style
                    </label>
                    <select
                      value={selectedElementData.fontStyle}
                      onChange={(e) => updateElement(selectedElementData.id, { fontStyle: e.target.value as 'normal' | 'italic' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Alignment
                  </label>
                  <select
                    value={selectedElementData.align}
                    onChange={(e) => updateElement(selectedElementData.id, { align: e.target.value as 'left' | 'center' | 'right' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => duplicateElement(selectedElementData.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Duplicate</span>
                  </button>
                  
                  <button
                    onClick={() => deleteElement(selectedElementData.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </button>
            
            <button
              onClick={handlePreview}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              <Eye className="h-4 w-4" />
              <span>Preview Label</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Label Preview</h2>
            {showHelpTip && (
              <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                <Info className="h-4 w-4" />
                <span>Use keyboard shortcuts: Del to delete, Ctrl+D to duplicate, Ctrl+S to save</span>
                <button 
                  onClick={() => setShowHelpTip(false)}
                  className="ml-2 text-amber-600 hover:text-amber-800"
                >×</button>
              </div>
            )}
          </div>
          <div className="mb-4 text-sm text-gray-600">
            Drag elements to reposition them. Click an element to select and edit its properties.
          </div>
          
          <div className="inline-block bg-white border-2 border-gray-300 shadow-lg relative">
            <div
              ref={previewRef}
              className="relative bg-white cursor-crosshair"
              style={{
                width: `${500}px`, // Larger preview width
                height: `${height * scale}px`,
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Grid lines for alignment */}
              <svg
                className="absolute inset-0 pointer-events-none opacity-20"
                width="100%"
                height="100%"
              >
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ccc" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Label Elements */}
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-pointer border-2 border-transparent hover:border-blue-400 ${
                    selectedElement === element.id ? 'border-blue-600 bg-blue-50' : ''
                  } px-1 py-px rounded whitespace-nowrap`}
                  style={{
                    left: `${element.x * scale}px`,
                    top: `${element.y * scale}px`,
                    fontSize: `${Math.max(10, element.fontSize * scale / 3.5)}px`, // Better scale conversion with larger minimum size
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    textAlign: element.align,
                    transform: element.align === 'center' ? 'translateX(-50%)' : element.align === 'right' ? 'translateX(-100%)' : 'none',
                    transformOrigin: 'top left',
                    maxWidth: element.maxWidth ? `${element.maxWidth * scale}px` : 'none',
                    lineHeight: '1.1',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                >
                  {getSampleText(element.type)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Dimensions: {width}mm × {height}mm | Scale: 1:{(1/scale).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Tip: Click elements to select, drag to reposition
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}