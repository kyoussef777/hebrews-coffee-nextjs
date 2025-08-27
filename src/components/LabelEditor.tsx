'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LabelElement, LabelSettings } from '@/types';
import { Save, Trash2, Copy, Eye, Info } from 'lucide-react';

interface LabelEditorProps {
  labelSettings?: LabelSettings;
  onSave: (settings: Partial<LabelSettings>) => void;
  onPreview: (settings: LabelSettings) => void;
}

// The default set of label elements shown when creating a new label.
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

// Grid snapping interval (in millimetres).  When dragging an element,
// its position will snap to the nearest multiple of this value.
const GRID_SIZE = 1;

// Additional element types that can be inserted into a label.  Each entry
// provides a unique type and a human‑readable name for the dropdown in the
// editor.  Adding entries here should be mirrored in types/index.ts and
// sample display functions below.
const ADDITIONAL_FIELDS: Array<{ type: LabelElement['type']; name: string }> = [
  { type: 'price', name: 'Price' },
  { type: 'barcode', name: 'Barcode' },
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

  // State for selecting which additional field to add when clicking "Add Element"
  const [newFieldType, setNewFieldType] = useState<LabelElement['type']>('price');


  // Undo/redo history.  Each entry is a snapshot of the elements array.
  const [history, setHistory] = useState<LabelElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  /**
   * Record the current elements into the undo history.  If the user has
   * undone some steps and then performs a new action, this function
   * truncates any redo states.  A maximum of 50 history entries are kept
   * to bound memory usage.
   */
  const recordHistory = useCallback(
    (snapshot: LabelElement[]) => {
      setHistory(prevHistory => {
        // Discard future history if the user undid some actions
        const truncated = prevHistory.slice(0, historyIndex + 1);
        // Clone the snapshot to avoid mutations
        const newEntry = snapshot.map(el => ({ ...el }));
        const updated = [...truncated, newEntry];
        // Limit to last 50 entries
        return updated.slice(-50);
      });
      setHistoryIndex(idx => {
        const newIdx = Math.min(idx + 1, 49);
        return newIdx;
      });
    },
    [historyIndex]
  );

  /**
   * Add a new element of the selected type to the canvas.  The element
   * is positioned near the bottom centre of the label by default.  After
   * insertion, the new element is selected and recorded in the undo history.
   */
  const addField = useCallback(() => {
    const type = newFieldType;
    // Generate a unique identifier for the element
    const id = `${type}_${Date.now()}`;
    const defaultElement: LabelElement = {
      id,
      type,
      x: width / 2,
      y: height - 5,
      fontSize: 8,
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
    };
    setElements(prev => {
      const updated = [...prev, defaultElement];
      recordHistory(updated);
      return updated;
    });
    setSelectedElement(id);
  }, [height, newFieldType, recordHistory, width]);

  // Update component state when labelSettings prop changes
  useEffect(() => {
    if (labelSettings) {
      setName(labelSettings.name);
      setWidth(labelSettings.width);
      setHeight(labelSettings.height);
      setElements(labelSettings.elements);
      setSelectedElement(null); // Clear selection when loading new config
      // Clear undo history when a saved configuration is loaded
      setHistory([]);
      setHistoryIndex(-1);
    } else {
      // Reset to defaults when no labelSettings provided
      setName('Custom Label');
      setWidth(90.3);
      setHeight(29);
      setElements(DEFAULT_ELEMENTS);
      setSelectedElement(null);
      // Clear undo history when resetting to defaults
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [labelSettings]);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Responsive scale factor for preview
  const getPreviewWidth = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) return Math.min(screenWidth - 32, 350); // Mobile: screen width - padding, max 350px
      if (screenWidth < 1024) return 400; // Tablet: 400px
      return 500; // Desktop: 500px
    }
    return 500; // Default for SSR
  };
  
  const [previewWidth, setPreviewWidth] = useState(getPreviewWidth());
  const scale = previewWidth / width;

  // Update preview width on resize
  useEffect(() => {
    const handleResize = () => {
      setPreviewWidth(getPreviewWidth());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-hide help tip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelpTip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    
    // Only enable dragging on non-touch devices or if explicitly enabled
    const isTouch = e.pointerType === 'touch';
    if (!isTouch) {
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
    } else {
      // On mobile, scroll to top to show the properties panel
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [elements, scale]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !selectedElement || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left - dragOffset.x) / scale;
    const newY = (e.clientY - rect.top - dragOffset.y) / scale;
    
    // Constrain to label bounds
    const constrainedX = Math.max(0, Math.min(width, newX));
    const constrainedY = Math.max(0, Math.min(height, newY));

    // Snap to nearest grid interval
    const snappedX = Math.round(constrainedX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(constrainedY / GRID_SIZE) * GRID_SIZE;

    setElements(prev =>
      prev.map(el =>
        el.id === selectedElement
          ? { ...el, x: snappedX, y: snappedY }
          : el
      )
    );
  }, [isDragging, selectedElement, dragOffset, scale, width, height]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    // Record history after a drag operation completes
    recordHistory(elements);
  }, [elements, recordHistory]);

  const updateElement = (elementId: string, updates: Partial<LabelElement>) => {
    setElements(prev => {
      const updated = prev.map(el => (el.id === elementId ? { ...el, ...updates } : el));
      // Record the change for undo history
      recordHistory(updated);
      return updated;
    });
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
      setElements(prev => {
        const updated = [...prev, newElement];
        recordHistory(updated);
        return updated;
      });
    }
  }, [elements, recordHistory]);

  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => {
      const updated = prev.filter(el => el.id !== elementId);
      recordHistory(updated);
      return updated;
    });
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  }, [selectedElement, recordHistory]);

  const handleSave = useCallback(() => {
    onSave({
      name,
      width,
      height,
      elements,
    });
  }, [name, width, height, elements, onSave]);

  // Undo the last change to elements.  When invoked, it replaces the
  // current elements array with the previous snapshot from the history.
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prevIndex => {
        const newIndex = prevIndex - 1;
        const snapshot = history[newIndex];
        if (snapshot) {
          // Replace elements with a deep clone of the snapshot
          setElements(snapshot.map(el => ({ ...el })));
        }
        return newIndex;
      });
    }
  }, [history, historyIndex]);

  // Redo a previously undone change.  Moves forward in the history array
  // and applies the next snapshot to elements.
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        const snapshot = history[newIndex];
        if (snapshot) {
          setElements(snapshot.map(el => ({ ...el })));
        }
        return newIndex;
      });
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault();
        deleteElement(selectedElement);
      } else if (e.key === 'Escape') {
        setSelectedElement(null);
      } else if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'd':
            if (selectedElement) {
              e.preventDefault();
              duplicateElement(selectedElement);
            }
            break;
          case 'z':
            // Undo (Ctrl/Cmd+Z).  If Shift is held, redo instead.
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            // Some users expect Ctrl+Y to redo
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, deleteElement, duplicateElement, handleSave, handleUndo, handleRedo]);

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
    const names: Record<LabelElement['type'], string> = {
      header: 'Header (HeBrews Coffee)',
      orderNumber: 'Order Number',
      customerName: 'Customer Name',
      drink: 'Drink Name',
      details: 'Drink Details',
      notes: 'Customer Notes',
      verse: 'Bible Verse (NKJV)',
      price: 'Price',
      barcode: 'Barcode',
    };
    return names[type];
  };

  const getSampleText = (type: LabelElement['type']) => {
    const samples: Record<LabelElement['type'], string> = {
      header: 'HeBrews Coffee',
      orderNumber: '#1234',
      customerName: 'John Doe',
      drink: 'Cappuccino',
      details: 'Oat Milk, Vanilla, Extra Hot',
      notes: 'Note: Extra foam please',
      verse: 'The Lord bless you and keep you. - Numbers 6:24',
      price: '$4.50',
      barcode: '123456789012',
    };
    return samples[type];
  };



  return (
    <div className="bg-gray-50 min-h-0 flex-1">
      {/* Mobile/Desktop responsive layout */}
      <div className="flex flex-col lg:flex-row min-h-0">
        {/* Controls Panel */}
        <div className="w-full lg:w-80 bg-white p-3 sm:p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto shadow-sm max-h-screen lg:max-h-none">
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Label Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Label Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Label configuration name"
                  style={{ fontSize: '16px' }}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="10"
                    max="200"
                    step="0.1"
                    style={{ fontSize: '16px' }}
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
                    className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="10"
                    max="100"
                    step="0.1"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Element Properties or Selection Prompt */}
          {selectedElementData ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                Element Properties
                <span className="lg:hidden ml-2 text-sm font-normal text-gray-600">
                  ({getElementDisplayName(selectedElementData.type)})
                </span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Element Type
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600">
                    {getElementDisplayName(selectedElementData.type)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X Position (mm)
                    </label>
                    <input
                      type="number"
                      value={selectedElementData.x.toFixed(1)}
                      onChange={(e) => updateElement(selectedElementData.id, { x: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      step="0.1"
                      style={{ fontSize: '16px' }}
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
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      step="0.1"
                      style={{ fontSize: '16px' }}
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
                    className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    min="4"
                    max="24"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={selectedElementData.fontWeight}
                      onChange={(e) => updateElement(selectedElementData.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      style={{ fontSize: '16px' }}
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
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      style={{ fontSize: '16px' }}
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
                    className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => duplicateElement(selectedElementData.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Duplicate</span>
                  </button>
                  
                  <button
                    onClick={() => deleteElement(selectedElementData.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:hidden">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-gray-600 mb-2">
                  <Info className="h-5 w-5 mx-auto mb-2" />
                  Select an Element
                </div>
                <p className="text-sm text-gray-500">
                  Tap any element in the preview below to select and edit its properties.
                </p>
              </div>
            </div>
          )}

          {/* Add Elements and History Controls */}
          <div className="space-y-4 lg:space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Manage Elements</h3>
              <div className="space-y-3">
                <div className="flex items-stretch space-x-2">
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as LabelElement['type'])}
                    className="flex-1 px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    style={{ fontSize: '16px' }}
                  >
                    {ADDITIONAL_FIELDS.map(({ type, name }) => (
                      <option key={type} value={type}>{name}</option>
                    ))}
                  </select>
                  <button
                    onClick={addField}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border ${historyIndex <= 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'}`}
                  >
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1 || historyIndex === -1}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border ${historyIndex >= history.length - 1 || historyIndex === -1 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'}`}
                  >
                    <span>Redo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-lg font-medium"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
              
              <button
                onClick={handlePreview}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium"
              >
                <Eye className="h-4 w-4" />
                <span>Preview Label</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 sm:mb-4 space-y-2 lg:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Label Preview</h2>
            {showHelpTip && (
              <div className="flex items-start space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="hidden lg:inline">Use keyboard shortcuts: Del to delete, Ctrl+D to duplicate, Ctrl+S to save</span>
                  <span className="lg:hidden">Tap elements to select, then edit properties above</span>
                </div>
                <button 
                  onClick={() => setShowHelpTip(false)}
                  className="ml-2 text-amber-600 hover:text-amber-800 text-lg leading-none"
                >×</button>
              </div>
            )}
          </div>
          <div className="mb-4 text-sm text-gray-600">
            <span className="hidden lg:inline">Drag elements to reposition them. Click an element to select and edit its properties.</span>
            <span className="lg:hidden">Tap elements to select, then adjust properties above. Use the numeric inputs for precise positioning.</span>
          </div>
          
          <div className="inline-block bg-white border-2 border-gray-300 shadow-lg relative">
            <div
              ref={previewRef}
              className="relative bg-white cursor-crosshair touch-none"
              style={{
                width: `${previewWidth}px`,
                height: `${height * scale}px`,
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
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
                  className={`absolute cursor-pointer border-2 border-transparent hover:border-blue-400 active:border-blue-600 ${
                    selectedElement === element.id ? 'border-blue-600 bg-blue-50' : ''
                  } px-1 py-px rounded whitespace-nowrap touch-manipulation`}
                  style={{
                    left: `${element.x * scale}px`,
                    top: `${element.y * scale}px`,
                    fontSize: `${Math.max(8, element.fontSize * scale / 3.5)}px`, // Responsive font scaling with mobile minimum
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    textAlign: element.align,
                    transform: element.align === 'center' ? 'translateX(-50%)' : element.align === 'right' ? 'translateX(-100%)' : 'none',
                    transformOrigin: 'top left',
                    maxWidth: element.maxWidth ? `${element.maxWidth * scale}px` : 'none',
                    lineHeight: '1.1',
                    minHeight: '20px', // Minimum touch target size
                    minWidth: '20px',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, element.id)}
                >
                  {getSampleText(element.type)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-600">
              Dimensions: {width}mm × {height}mm | Scale: 1:{(1/scale).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              <span className="hidden lg:inline">Tip: Click elements to select, drag to reposition</span>
              <span className="lg:hidden">Tip: Tap to select, edit above</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}