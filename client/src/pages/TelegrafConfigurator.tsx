import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import EditorCanvas from "@/components/EditorCanvas";
import PluginPanel from "@/components/PluginPanel";
import ConfigPanel from "@/components/ConfigPanel";
import TomlEditor from "@/components/TomlEditor";
import { useTelegrafConfig } from "@/hooks/TelegrafContext";
import { apiRequest } from "@/lib/queryClient";
import { TelegrafConfigRecord, TelegrafConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";

export default function TelegrafConfigurator() {
  const [activeTab, setActiveTab] = useState<"visual" | "toml">("visual");
  const { toast } = useToast();
  const { 
    telegrafConfig, 
    setTelegrafConfig, 
    selectedNode, 
    selectedConnection, 
    setSelectedNode, 
    setSelectedConnection 
  } = useTelegrafConfig();

  const [configName, setConfigName] = useState(telegrafConfig.name || "my_telegraf_config");

  // Load the default configuration
  const { data, isLoading } = useQuery<TelegrafConfigRecord[]>({
    queryKey: ['/api/configs'],
  });

  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updatedConfig = {
        ...telegrafConfig,
        name: configName
      };
      
      if (data && data.length > 0) {
        // Update existing config
        return apiRequest('PUT', `/api/configs/${data[0].id}`, {
          name: configName,
          config: updatedConfig
        });
      } else {
        // Create new config
        return apiRequest('POST', '/api/configs', {
          name: configName,
          config: updatedConfig
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Configuration saved",
        description: "Your Telegraf configuration has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save configuration",
        description: error.message || "An error occurred while saving the configuration.",
        variant: "destructive"
      });
    }
  });

  // Load initial configuration
  useEffect(() => {
    if (data && data.length > 0) {
      const config = data[0];
      setTelegrafConfig(config.config as TelegrafConfig);
      setConfigName(config.name);
    }
  }, [data]);

  const handleSaveConfig = () => {
    saveMutation.mutate();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* App Header */}
      <header className="bg-gray-800 text-white py-2 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <svg 
            className="h-8 w-8 mr-2" 
            viewBox="0 0 32 32" 
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
          >
            <path d="M16 7.737l7.424 4.292v8.583L16 24.905l-7.424-4.293v-8.583L16 7.737zm0-2.646L6.333 10.382v11.879L16 27.551l9.667-5.29V10.382L16 5.091z" />
            <path d="M20.8 14.592l-4.8 2.769-4.8-2.769v-5.538l4.8-2.77 4.8 2.77z" />
          </svg>
          <h1 className="text-xl font-bold">Telegraf Configurator</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="mr-2">Config Name:</span>
            <Input 
              className="bg-gray-700 px-3 py-1 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="my_telegraf_config" 
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={() => {
                setSelectedNode(null);
                setSelectedConnection(null);
                
                // Update the global app state
                const appState = { 
                  activePanel: 'agent-config' 
                };
                
                // Store the state in localStorage for persistence
                localStorage.setItem('telegrafAppState', JSON.stringify(appState));
                
                // Force a re-render
                window.dispatchEvent(new CustomEvent('telegraf-panel-change', { 
                  detail: { panel: 'agent-config' } 
                }));
              }}
            >
              <i className="ri-settings-3-line mr-1"></i> Agent Settings
            </Button>
            <Button 
              variant="outline" 
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={() => {
                setSelectedNode(null);
                setSelectedConnection(null);
                
                // Update the global app state
                const appState = { 
                  activePanel: 'secret-store-config' 
                };
                
                // Store the state in localStorage for persistence
                localStorage.setItem('telegrafAppState', JSON.stringify(appState));
                
                // Force a re-render
                window.dispatchEvent(new CustomEvent('telegraf-panel-change', { 
                  detail: { panel: 'secret-store-config' } 
                }));
              }}
            >
              <i className="ri-key-2-line mr-1"></i> Secret Store
            </Button>
          </div>
          <Button 
            variant="default" 
            className="bg-blue-600 hover:bg-blue-500"
            onClick={handleSaveConfig}
            disabled={saveMutation.isPending}
          >
            <i className="ri-save-line mr-1"></i> Save
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Fixed width */}
        <div className="border-r border-gray-200 flex-shrink-0">
          <PluginPanel
            onToggleToml={() => setActiveTab(activeTab === "visual" ? "toml" : "visual")}
          />
        </div>

        {/* Center & Right Panels - Resizable */}
        <div className="flex-1 h-full">
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            {/* Center Area - Canvas and TOML Editor */}
            <ResizablePanel defaultSize={70} minSize={50} className="flex flex-col">
              {/* Tabs for Visual/TOML */}
              <div className="bg-gray-200 border-b border-gray-300 flex">
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "visual" ? "bg-white text-blue-600 border-t-2 border-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
                  onClick={() => setActiveTab("visual")}
                >
                  Visual Editor
                </button>
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "toml" ? "bg-white text-blue-600 border-t-2 border-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
                  onClick={() => setActiveTab("toml")}
                >
                  TOML Editor
                </button>
              </div>
              
              {/* Visual or TOML Editor */}
              {activeTab === "visual" ? (
                <EditorCanvas />
              ) : (
                <TomlEditor />
              )}
            </ResizablePanel>

            {/* Divider */}
            <ResizableHandle 
              withHandle
              className="bg-gray-200 transition-colors duration-200 hover:bg-gray-300" 
            />

            {/* Right Panel - Config Panel - resizable */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={50} className="relative">
              <ConfigPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
