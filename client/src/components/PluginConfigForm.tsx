import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PluginConfig, PluginField } from '@/utils/pluginParser';
import { cn } from '@/lib/utils';

interface PluginConfigFormProps {
  pluginConfig: PluginConfig;
  currentValues: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
}

export function PluginConfigForm({ 
  pluginConfig, 
  currentValues, 
  onChange, 
  onSave 
}: PluginConfigFormProps) {
  console.log("PluginConfigForm rendered with:", pluginConfig);
  
  const [data, setData] = useState<Record<string, any>>(currentValues);

  useEffect(() => {
    console.log("PluginConfigForm currentValues updated:", currentValues);
    setData(currentValues);
  }, [currentValues]);

  const handleChange = (field: PluginField, value: any) => {
    // Convert value based on field type
    let parsedValue: any = value;
    
    if (field.type === 'boolean' && typeof value === 'string') {
      parsedValue = value === 'true';
    } else if (field.type === 'number' && typeof value === 'string') {
      parsedValue = parseFloat(value);
    } else if (field.type === 'array' && typeof value === 'string') {
      // Try to parse comma-separated values
      try {
        parsedValue = value.split(',').map(v => v.trim());
      } catch (e) {
        console.error("Failed to parse array value", e);
      }
    } else if (field.type === 'object' && typeof value === 'string') {
      // Try to parse as JSON
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        console.error("Failed to parse object value", e);
      }
    }
    
    const newData = { ...data, [field.name]: parsedValue };
    setData(newData);
    onChange(field.name, parsedValue);
  };

  const renderFieldInput = (field: PluginField) => {
    console.log(`Rendering field: ${field.name}, required: ${field.required}, description: ${field.description}`);
    const value = data[field.name] !== undefined ? data[field.name] : field.default;
    
    switch (field.type) {
      case 'boolean':
        return (
          <div className="space-y-1" key={field.name}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={!!value}
                onCheckedChange={(checked) => handleChange(field, checked)}
              />
              <Label 
                htmlFor={field.name} 
                className={cn(
                  "text-sm font-medium",
                  field.required ? "text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500" : "text-gray-700"
                )}
              >
                {field.name}
              </Label>
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1 ml-6">{field.description}</p>
            )}
          </div>
        );
        
      case 'array':
        return (
          <div className="space-y-1" key={field.name}>
            <Label 
              htmlFor={field.name} 
              className={cn(
                "text-sm font-medium",
                field.required ? "text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500" : "text-gray-700"
              )}
            >
              {field.name}
            </Label>
            <Textarea
              id={field.name}
              value={Array.isArray(value) ? value.join(',') : value}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full font-mono text-sm"
              rows={3}
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
        
      case 'object':
        return (
          <div className="space-y-1" key={field.name}>
            <Label 
              htmlFor={field.name} 
              className={cn(
                "text-sm font-medium",
                field.required ? "text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500" : "text-gray-700"
              )}
            >
              {field.name}
            </Label>
            <Textarea
              id={field.name}
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full font-mono text-sm"
              rows={4}
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
        
      default: // string, number, etc.
        return (
          <div className="space-y-1" key={field.name}>
            <Label 
              htmlFor={field.name} 
              className={cn(
                "text-sm font-medium",
                field.required ? "text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500" : "text-gray-700"
              )}
            >
              {field.name}
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                type={field.type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => handleChange(field, e.target.value)}
                className={cn(
                  "w-full",
                  field.sensitive ? "font-mono" : ""
                )}
              />
              {field.sensitive && (
                <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                  <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">secret</span>
                </div>
              )}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
    }
  };

  // Function to get the GitHub documentation URL for the plugin
  const getGitHubDocsUrl = () => {
    const pluginType = pluginConfig.type === 'input' ? 'inputs' : 
                      pluginConfig.type === 'output' ? 'outputs' : 
                      pluginConfig.type === 'processor' ? 'processors' : 'aggregators';
    
    return `https://github.com/influxdata/telegraf/tree/master/plugins/${pluginType}/${pluginConfig.name}`;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{pluginConfig.displayName}</h3>
          <a 
            href={getGitHubDocsUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            View Docs
          </a>
        </div>
        <p className="text-sm text-gray-500">{pluginConfig.description}</p>
      </div>
      
      <div className="space-y-4">
        {pluginConfig.fields
          .filter(field => field.required)
          .map(field => (
            <div key={field.name}>
              {renderFieldInput(field)}
            </div>
          ))}
      </div>
      
      {pluginConfig.fields.some(field => !field.required) && (
        <div>
          <details className="group">
            <summary className="cursor-pointer list-none font-medium text-sm text-gray-600 hover:text-gray-800">
              <div className="flex items-center">
                <svg 
                  className="h-4 w-4 mr-1 text-gray-500 group-open:rotate-90 transition-transform" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Optional Configuration
              </div>
            </summary>
            <div className="mt-3 space-y-4 pl-6">
              {pluginConfig.fields
                .filter(field => !field.required)
                .map(field => (
                  <div key={field.name}>
                    {renderFieldInput(field)}
                  </div>
                ))}
            </div>
          </details>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-200">
        <Button 
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onSave}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}