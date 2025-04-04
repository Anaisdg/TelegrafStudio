import { useState } from 'react';
import { PluginType, availablePlugins } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PluginPanelProps {
  onToggleToml: () => void;
}

export default function PluginPanel({ onToggleToml }: PluginPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterByType = (filter: string) => {
    setActiveFilter(filter);
  };

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, pluginType: string, pluginName: string) => {
    event.dataTransfer.setData('application/reactflow/type', pluginType);
    event.dataTransfer.setData('application/reactflow/plugin', pluginName);
    event.dataTransfer.effectAllowed = 'move';
  };

  const renderPluginItem = (pluginType: string, plugin: { name: string; description: string; icon: string }) => {
    return (
      <div
        key={`${pluginType}-${plugin.name}`}
        className="plugin-item flex items-center p-3 hover:bg-gray-700 cursor-move border-l-4"
        style={{ borderColor: getColorForPluginType(pluginType) }}
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
          <h3 className="font-medium">{plugin.name}</h3>
          <p className="text-xs text-gray-400">{plugin.description}</p>
        </div>
      </div>
    );
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

  const filteredPlugins = () => {
    const result: Record<string, typeof availablePlugins[keyof typeof availablePlugins]> = {};

    Object.entries(availablePlugins).forEach(([type, plugins]) => {
      if (activeFilter === 'all' || activeFilter === type) {
        result[type] = plugins.filter(
          (plugin) =>
            plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    });

    return result;
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col border-r border-gray-700 shadow-lg">
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search plugins..."
            className="w-full bg-gray-700 rounded py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <i className="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
        </div>
        <div className="flex mt-3 space-x-1">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={
              activeFilter === 'all'
                ? 'bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs flex-1'
                : 'bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs flex-1 text-white'
            }
            onClick={() => handleFilterByType('all')}
          >
            All
          </Button>
          <Button
            variant={activeFilter === PluginType.INPUT ? 'default' : 'outline'}
            size="sm"
            className={
              activeFilter === PluginType.INPUT
                ? 'bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs flex-1'
                : 'bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs flex-1 text-white'
            }
            onClick={() => handleFilterByType(PluginType.INPUT)}
          >
            Inputs
          </Button>
          <Button
            variant={activeFilter === PluginType.PROCESSOR ? 'default' : 'outline'}
            size="sm"
            className={
              activeFilter === PluginType.PROCESSOR
                ? 'bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs flex-1'
                : 'bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs flex-1 text-white'
            }
            onClick={() => handleFilterByType(PluginType.PROCESSOR)}
          >
            Process
          </Button>
          <Button
            variant={activeFilter === PluginType.OUTPUT ? 'default' : 'outline'}
            size="sm"
            className={
              activeFilter === PluginType.OUTPUT
                ? 'bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs flex-1'
                : 'bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs flex-1 text-white'
            }
            onClick={() => handleFilterByType(PluginType.OUTPUT)}
          >
            Outputs
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {Object.entries(filteredPlugins()).map(([type, plugins]) => (
          <div key={type} className="plugin-category">
            <h2 className="px-4 py-2 text-gray-400 text-xs uppercase font-semibold bg-gray-900">
              {type.charAt(0).toUpperCase() + type.slice(1)} Plugins
            </h2>
            <div className="plugin-list">
              {plugins.map((plugin) => renderPluginItem(type, plugin))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700 bg-gray-900">
        <Button
          variant="outline"
          className="bg-gray-700 hover:bg-gray-600 w-full px-3 py-2 rounded text-sm text-white"
          onClick={onToggleToml}
        >
          <i className="ri-braces-line mr-1"></i> Toggle TOML View
        </Button>
      </div>
    </div>
  );
}
