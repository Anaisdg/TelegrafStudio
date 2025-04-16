import React, { useState, useEffect } from "react";
import { useTelegrafConfig } from "@/hooks/TelegrafContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Type definitions for secret store plugins
interface SecretField {
  name: string;
  type: 'string' | 'array' | 'number' | 'boolean' | 'object';
  required: boolean;
  description: string;
  default: any;
}

interface SecretStorePlugin {
  id: string;
  name: string;
  description: string;
  docsUrl: string;
  fields: SecretField[];
}

// Available secret store plugins
const SECRET_STORE_PLUGINS: SecretStorePlugin[] = [
  {
    id: "os",
    name: "OS Secret Store",
    description: "Access secrets using the native operating system's keyring",
    docsUrl: "https://github.com/influxdata/telegraf/tree/master/plugins/secretstores/os",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Unique identifier for the secret-store",
        default: "mysecretstore"
      },
      {
        name: "keyring",
        type: "string",
        required: false,
        description: "Name of the keyring to use (Linux only)",
        default: ""
      },
      {
        name: "secrets",
        type: "object",
        required: false,
        description: "Secrets to store",
        default: {}
      }
    ]
  },
  {
    id: "http",
    name: "HTTP Secret Store",
    description: "Query secrets from an HTTP endpoint",
    docsUrl: "https://github.com/influxdata/telegraf/tree/master/plugins/secretstores/http",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Unique identifier for the secret-store",
        default: "mysecretstore"
      },
      {
        name: "url",
        type: "string",
        required: true,
        description: "URL to query for secrets",
        default: "http://localhost:8200/v1/secret/data/telegraf"
      },
      {
        name: "token",
        type: "string",
        required: false,
        description: "Bearer token for authentication",
        default: ""
      },
      {
        name: "username",
        type: "string",
        required: false,
        description: "Username for basic auth",
        default: ""
      },
      {
        name: "password",
        type: "string",
        required: false,
        description: "Password for basic auth",
        default: ""
      }
    ]
  },
  {
    id: "docker",
    name: "Docker Secret Store",
    description: "Use Docker secrets within containers",
    docsUrl: "https://github.com/influxdata/telegraf/tree/master/plugins/secretstores/docker",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Unique identifier for the secret-store",
        default: "dockersecrets"
      },
      {
        name: "docker_secrets_path",
        type: "string",
        required: false,
        description: "Path to the Docker secrets",
        default: "/run/secrets"
      }
    ]
  },
  {
    id: "jose",
    name: "JOSE Secret Store",
    description: "Javascript Object Signing and Encryption",
    docsUrl: "https://github.com/influxdata/telegraf/tree/master/plugins/secretstores/jose",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Unique identifier for the secret-store",
        default: "josesecrets"
      },
      {
        name: "key_file",
        type: "string",
        required: true,
        description: "File containing the key used for encryption/decryption",
        default: ""
      },
      {
        name: "algorithm",
        type: "string",
        required: false,
        description: "Algorithm to use for encryption/decryption",
        default: "PBES2-HS256+A128KW"
      }
    ]
  },
  {
    id: "systemd",
    name: "Systemd Secret Store",
    description: "Access systemd credentials",
    docsUrl: "https://github.com/influxdata/telegraf/tree/master/plugins/secretstores/systemd",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Unique identifier for the secret-store",
        default: "systemdsecrets"
      },
      {
        name: "systemd_service_name",
        type: "string",
        required: false,
        description: "Name of the systemd service",
        default: "telegraf"
      }
    ]
  }
];

export default function SecretStoreConfig() {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  
  // Initialize secretStore if it doesn't exist
  const defaultSecretStore = {
    plugin: "os",
    config: { id: "mystore" },
    secrets: {}
  };
  
  const [selectedSecretStore, setSelectedSecretStore] = useState<string>(
    telegrafConfig.secretStore?.plugin || defaultSecretStore.plugin
  );
  const [secretConfig, setSecretConfig] = useState<Record<string, any>>(
    telegrafConfig.secretStore?.config || defaultSecretStore.config
  );
  const [secrets, setSecrets] = useState<Record<string, string>>(
    telegrafConfig.secretStore?.secrets || defaultSecretStore.secrets
  );
  
  // Find the currently selected plugin
  const selectedPlugin = SECRET_STORE_PLUGINS.find(p => p.id === selectedSecretStore);
  
  // Update the parent Telegraf config when our state changes
  useEffect(() => {
    if (telegrafConfig) {
      setTelegrafConfig({
        ...telegrafConfig,
        secretStore: {
          plugin: selectedSecretStore,
          config: secretConfig,
          secrets: secrets
        }
      });
    }
  }, [selectedSecretStore, secretConfig, secrets]);
  
  // Handle changes to the secret store configuration
  const handleConfigChange = (field: string, value: any) => {
    setSecretConfig({
      ...secretConfig,
      [field]: value
    });
  };
  
  // Add a new secret
  const handleAddSecret = () => {
    setSecrets({
      ...secrets,
      ["new_secret_" + Object.keys(secrets).length]: ""
    });
  };
  
  // Update an existing secret
  const handleSecretChange = (key: string, value: string) => {
    setSecrets({
      ...secrets,
      [key]: value
    });
  };
  
  // Keep track of the current secret key being edited
  const [editingKey, setEditingKey] = useState<{
    oldKey: string;
    newKey: string;
  } | null>(null);

  // Handle when a secret key field changes
  const handleSecretKeyInputChange = (oldKey: string, newValue: string) => {
    setEditingKey({ oldKey, newKey: newValue });
  };

  // Only update the actual secret key when the input loses focus
  const handleSecretKeyBlur = () => {
    if (editingKey && editingKey.oldKey !== editingKey.newKey) {
      const newSecrets = { ...secrets };
      const value = newSecrets[editingKey.oldKey];
      delete newSecrets[editingKey.oldKey];
      newSecrets[editingKey.newKey] = value;
      setSecrets(newSecrets);
    }
    setEditingKey(null);
  };
  
  // Remove a secret
  const handleRemoveSecret = (key: string) => {
    const newSecrets = { ...secrets };
    delete newSecrets[key];
    setSecrets(newSecrets);
  };
  
  // State for toggling secret visibility
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  
  // Generate a sample command for using this secret store
  const generateCommandLine = () => {
    const storeId = secretConfig.id || "mystore";
    let command = `telegraf --secret-store ${selectedSecretStore}:${storeId}`;
    
    // Add extra parameters based on the secret store type
    if (selectedSecretStore === "os") {
      if (secretConfig.keyring) {
        command += ` --secret-store-param ${storeId}:keyring=${secretConfig.keyring}`;
      }
    } else if (selectedSecretStore === "http") {
      command += ` --secret-store-param ${storeId}:url=${secretConfig.url || "http://localhost:8200"}`;
      if (secretConfig.token) {
        command += ` --secret-store-param ${storeId}:token=****`;
      }
    } else if (selectedSecretStore === "docker") {
      if (secretConfig.docker_secrets_path) {
        command += ` --secret-store-param ${storeId}:docker_secrets_path=${secretConfig.docker_secrets_path}`;
      }
    } else if (selectedSecretStore === "jose") {
      command += ` --secret-store-param ${storeId}:key_file=${secretConfig.key_file || "/path/to/key.pem"}`;
      if (secretConfig.algorithm) {
        command += ` --secret-store-param ${storeId}:algorithm=${secretConfig.algorithm}`;
      }
    } else if (selectedSecretStore === "systemd") {
      if (secretConfig.systemd_service_name) {
        command += ` --secret-store-param ${storeId}:systemd_service_name=${secretConfig.systemd_service_name}`;
      }
    }
    
    return command;
  };
  
  // Preview how to reference a secret in TOML
  const generateSecretReference = (key: string) => {
    const storeId = secretConfig.id || "mystore";
    return `@{${storeId}:${key}}`;
  };
  
  return (
    <div className="space-y-6 p-2">
      <div className="border-b border-gray-200 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Secret Store Configuration</h3>
          {selectedPlugin && (
            <a 
              href={selectedPlugin.docsUrl} 
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
          )}
        </div>
        <p className="text-sm text-gray-500">
          Configure a secret store to securely manage sensitive information.
        </p>
      </div>
      
      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="flex mb-4 bg-gray-200 border-b border-gray-300 overflow-hidden">
          <TabsTrigger 
            value="configuration" 
            className="flex-1 px-3 py-2 text-sm font-medium border-r border-gray-300 transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 data-[state=inactive]:hover:bg-gray-100"
          >
            Setup
          </TabsTrigger>
          <TabsTrigger 
            value="secrets"
            className="flex-1 px-3 py-2 text-sm font-medium border-r border-gray-300 transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 data-[state=inactive]:hover:bg-gray-100"
          >
            Secrets
          </TabsTrigger>
          <TabsTrigger 
            value="command"
            className="flex-1 px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-b-0 data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 data-[state=inactive]:hover:bg-gray-100"
          >
            Command
          </TabsTrigger>
        </TabsList>
        
        {/* Secret Store Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <div>
            <Label htmlFor="secret-store-type" className="text-sm font-medium text-gray-700">
              Secret Store Type
            </Label>
            <Select 
              onValueChange={(value) => setSelectedSecretStore(value)} 
              defaultValue={selectedSecretStore}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a secret store type" />
              </SelectTrigger>
              <SelectContent>
                {SECRET_STORE_PLUGINS.map(plugin => (
                  <SelectItem key={plugin.id} value={plugin.id}>
                    {plugin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlugin && (
              <p className="text-xs text-gray-500 mt-1">{selectedPlugin.description}</p>
            )}
          </div>
          
          {/* Dynamic fields based on selected secret store */}
          {selectedPlugin && (
            <div className="space-y-4 pt-2">
              {selectedPlugin.fields.filter(field => field.name !== "secrets").map(field => (
                <div key={field.name} className="space-y-1">
                  <Label 
                    htmlFor={field.name} 
                    className={cn(
                      "text-sm font-medium",
                      field.required ? "text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500" : "text-gray-700"
                    )}
                  >
                    {field.name}
                  </Label>
                  
                  {field.type === 'boolean' ? (
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={field.name}
                        checked={!!secretConfig[field.name]} 
                        onChange={(e) => handleConfigChange(field.name, e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  ) : field.type === 'object' ? (
                    <Textarea
                      id={field.name}
                      value={secretConfig[field.name] ? JSON.stringify(secretConfig[field.name], null, 2) : ''}
                      onChange={(e) => handleConfigChange(field.name, e.target.value)}
                      className="w-full font-mono text-sm"
                      rows={4}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      value={secretConfig[field.name] || ''}
                      onChange={(e) => handleConfigChange(field.name, e.target.value)}
                      className="w-full"
                      placeholder={field.default?.toString() || ''}
                    />
                  )}
                  
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Secrets Management Tab */}
        <TabsContent value="secrets" className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
            <p>
              <strong>Note:</strong> In a production environment, secrets are stored securely in the selected secret store.
              For development purposes, you can define them here to be included in your Telegraf configuration.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium">Secret Keys</h4>
              <Button 
                variant="outline" 
                className="text-sm" 
                onClick={handleAddSecret}
              >
                Add Secret
              </Button>
            </div>
            
            {Object.keys(secrets).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No secrets defined yet. Click "Add Secret" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(secrets).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Input
                      value={editingKey && editingKey.oldKey === key ? editingKey.newKey : key}
                      onChange={(e) => handleSecretKeyInputChange(key, e.target.value)}
                      onBlur={handleSecretKeyBlur}
                      className="flex-1"
                      placeholder="Secret key name"
                    />
                    <div className="flex-1 relative">
                      <Input
                        type={visibleSecrets[key] ? "text" : "password"}
                        value={value}
                        onChange={(e) => handleSecretChange(key, e.target.value)}
                        className="w-full font-mono pr-8"
                        placeholder="Secret value"
                      />
                      <div className="absolute top-0 right-0 h-full flex items-center gap-1 pr-2">
                        <button 
                          type="button"
                          onClick={() => setVisibleSecrets({...visibleSecrets, [key]: !visibleSecrets[key]})}
                          className="text-gray-500 hover:text-blue-600 focus:outline-none"
                          aria-label={visibleSecrets[key] ? "Hide secret" : "Show secret"}
                        >
                          {visibleSecrets[key] ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="text-gray-500 hover:text-red-600" 
                      onClick={() => handleRemoveSecret(key)}
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
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {Object.keys(secrets).length > 0 && (
            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h4 className="text-sm font-medium mb-2">How to reference these secrets</h4>
              <div className="space-y-2">
                {Object.keys(secrets).map(key => (
                  <div key={key} className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <span className="text-sm text-gray-600 truncate">{key}:</span>
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono overflow-x-auto whitespace-nowrap">
                      {generateSecretReference(key)}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Command Line Tab */}
        <TabsContent value="command" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800 text-sm">
            <p>
              <strong>Usage:</strong> To use this secret store configuration, start Telegraf with the command below.
              This will allow Telegraf to access secrets securely during runtime.
            </p>
          </div>
          
          <div className="mt-4">
            <Label className="text-sm font-medium">Command Line</Label>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-sm mt-1 overflow-x-auto">
              {generateCommandLine()}
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm font-medium">Usage Examples</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h5 className="font-medium">In your Telegraf TOML config:</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {`# InfluxDB v2 Output Plugin
[[outputs.influxdb_v2]]
  urls = ["https://cloud2.influxdata.com"]
  # Reference a secret from the store
  token = "${Object.keys(secrets).length > 0 ? generateSecretReference(Object.keys(secrets)[0]) : '@{mystore:token}'}"
  organization = "my-org"
  bucket = "my-bucket"`}
                    </pre>
                  </div>
                  
                  <div>
                    <h5 className="font-medium">Running with the command:</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {generateCommandLine()}
                    </pre>
                    <p className="mt-2 text-gray-600">
                      This tells Telegraf to look for secrets in the configured secret store instead of storing them directly in the configuration file.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}