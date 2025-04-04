import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { convertConfigToToml } from '@/utils/telegraf';

export default function TomlEditor() {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [tomlValue, setTomlValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Convert the telegrafConfig to TOML when it changes
  useEffect(() => {
    try {
      const toml = convertConfigToToml(telegrafConfig);
      setTomlValue(toml);
      setError(null);
    } catch (err) {
      setError(`Error generating TOML: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [telegrafConfig]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    
    setTomlValue(value);
    
    // TODO: In a full implementation, we would parse TOML back to telegrafConfig
    // This would involve adding a TOML parser like @iarna/toml and implementing
    // the parseTomlToConfig function in utils/telegraf.ts
    
    // For now, we just display the TOML without syncing back to the visual editor
    // parseTomlToConfig(value).then(config => {
    //   setTelegrafConfig(config);
    // }).catch(err => {
    //   setError(`Error parsing TOML: ${err.message}`);
    // });
  };

  return (
    <div className="flex-1 bg-gray-800 text-white font-mono" id="toml-editor">
      {error && (
        <div className="bg-red-600 text-white p-2 text-sm">
          {error}
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage="toml"
        value={tomlValue}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
}
