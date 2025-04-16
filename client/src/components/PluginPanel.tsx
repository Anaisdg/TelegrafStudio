import { useState } from 'react';
import { PluginType, availablePlugins } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PluginPanelProps {
  onToggleToml: () => void;
}

export default function PluginPanel({ onToggleToml }: PluginPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  // Get recent plugins (this could be enhanced to remember actually used plugins)
  const [recentPlugins, setRecentPlugins] = useState<Array<{type: string, name: string}>>([
    { type: PluginType.INPUT, name: 'cpu' },
    { type: PluginType.INPUT, name: 'mem' },
    { type: PluginType.PROCESSOR, name: 'converter' },
    { type: PluginType.OUTPUT, name: 'influxdb_v2' }
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, pluginType: string, pluginName: string) => {
    event.dataTransfer.setData('application/reactflow/type', pluginType);
    event.dataTransfer.setData('application/reactflow/plugin', pluginName);
    event.dataTransfer.effectAllowed = 'move';
    
    // Add to recent plugins if not already there
    if (!recentPlugins.some(p => p.type === pluginType && p.name === pluginName)) {
      const updatedRecents = [...recentPlugins];
      // Remove oldest if we have more than 5
      if (updatedRecents.length >= 5) {
        updatedRecents.pop();
      }
      // Add new one at the beginning
      updatedRecents.unshift({ type: pluginType, name: pluginName });
      setRecentPlugins(updatedRecents);
    }
  };

  const getColorForPluginType = (type: string) => {
    switch (type) {
      case PluginType.INPUT:
        return '#60A5FA';
      case PluginType.PROCESSOR:
        return '#F97316';
      case PluginType.AGGREGATOR:
        return '#A855F7';
      case PluginType.SERIALIZER:
        return '#EC4899';
      case PluginType.OUTPUT:
        return '#10B981';
      default:
        return '#6B7280';
    }
  };
  
  const getIconForPluginType = (type: string) => {
    switch (type) {
      case PluginType.INPUT:
        return 'download-2-line';
      case PluginType.PROCESSOR:
        return 'settings-line';
      case PluginType.AGGREGATOR:
        return 'bar-chart-box-line';
      case PluginType.SERIALIZER:
        return 'code-s-slash-line';
      case PluginType.OUTPUT:
        return 'upload-2-line';
      default:
        return 'function-line';
    }
  };

  const renderPluginItem = (pluginType: string, plugin: { name: string; description: string; icon: string }) => {
    return (
      <div
        key={`${pluginType}-${plugin.name}`}
        className="plugin-item flex items-center p-3 hover:bg-gray-50 cursor-move border-l-4 border-b border-gray-100"
        style={{ borderLeftColor: getColorForPluginType(pluginType) }}
        draggable
        onDragStart={(e) => onDragStart(e, pluginType, plugin.name)}
      >
        <div
          className="w-8 h-8 mr-3 rounded flex items-center justify-center"
          style={{ backgroundColor: getColorForPluginType(pluginType) }}
        >
          <i className={`ri-${plugin.icon}`}></i>
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{plugin.name}</h3>
          <p className="text-xs text-gray-600">{plugin.description}</p>
        </div>
      </div>
    );
  };

  const filteredPlugins = () => {
    if (!selectedCategory) return {};
    
    const result: Record<string, typeof availablePlugins[keyof typeof availablePlugins]> = {};
    const type = selectedCategory;
    
    if (availablePlugins[type]) {
      result[type] = availablePlugins[type].filter(
        (plugin) =>
          plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  };
  
  const openPluginSelector = (type: string) => {
    setSelectedCategory(type);
    setSearchTerm('');
    setShowDialog(true);
  };
  
  const renderCategoryButton = (type: string, label: string) => {
    return (
      <Button
        variant="outline"
        className="w-full mb-2 h-20 flex flex-col items-center justify-center border-2 transition-all hover:border-blue-500"
        style={{ borderColor: getColorForPluginType(type) }}
        onClick={() => openPluginSelector(type)}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center mb-1 text-white"
          style={{ backgroundColor: getColorForPluginType(type) }}
        >
          <i className={`ri-${getIconForPluginType(type)} text-xl`}></i>
        </div>
        <span className="text-sm font-medium">{label}</span>
      </Button>
    );
  };

  return (
    <div className="bg-white text-gray-800 flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h2 className="font-bold text-lg mb-1">Plugin Categories</h2>
        <p className="text-sm text-gray-600">Select a category to add a plugin</p>
      </div>

      {/* Plugin Categories */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {renderCategoryButton(PluginType.INPUT, 'Inputs')}
          {renderCategoryButton(PluginType.PROCESSOR, 'Processors')}
          {renderCategoryButton(PluginType.AGGREGATOR, 'Aggregators')}
          {renderCategoryButton(PluginType.OUTPUT, 'Outputs')}
        </div>
      </div>
      
      {/* Recent Plugins */}
      <div className="mt-3 p-3 border-t border-gray-200">
        <h3 className="font-semibold text-sm mb-2 text-gray-700">Recent Plugins</h3>
        <div className="space-y-2">
          {recentPlugins.map((plugin, index) => {
            const pluginInfo = availablePlugins[plugin.type]?.find(p => p.name === plugin.name);
            if (!pluginInfo) return null;
            
            return (
              <div 
                key={index}
                className="flex items-center p-2 hover:bg-gray-50 rounded cursor-move border-l-4"
                style={{ borderLeftColor: getColorForPluginType(plugin.type) }}
                draggable
                onDragStart={(e) => onDragStart(e, plugin.type, plugin.name)}
              >
                <div
                  className="w-6 h-6 mr-2 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: getColorForPluginType(plugin.type) }}
                >
                  <i className={`ri-${pluginInfo.icon} text-xs`}></i>
                </div>
                <div className="text-sm font-medium">{plugin.name}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Spacer */}
      <div className="flex-1"></div>
      
      {/* Toggle TOML Button */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <Button
          variant="outline"
          className="w-full px-3 py-2 rounded text-sm border-blue-500 hover:bg-blue-50"
          onClick={onToggleToml}
        >
          <i className="ri-braces-line mr-1"></i> Toggle TOML View
        </Button>
      </div>
      
      {/* Plugin Selection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory && selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Plugins
            </DialogTitle>
          </DialogHeader>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Search plugins..."
              className="w-full pr-8"
              value={searchTerm}
              onChange={handleSearch}
            />
            <i className="ri-search-line absolute right-3 top-2.5 text-gray-400"></i>
          </div>
          
          {/* Plugin List */}
          <ScrollArea className="h-[50vh]">
            {Object.entries(filteredPlugins()).map(([type, plugins]) => (
              <div key={type} className="plugin-list">
                {plugins.map((plugin) => renderPluginItem(type, plugin))}
              </div>
            ))}
            
            {Object.values(filteredPlugins()).flat().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-search-line text-3xl mb-2"></i>
                <p>No plugins found matching your search</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="text-sm text-gray-500 pt-2">
            Drag a plugin to the canvas to add it to your pipeline.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
