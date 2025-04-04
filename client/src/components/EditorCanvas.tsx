import { useRef, useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  NodeProps,
  Handle,
  Position,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { v4 as uuidv4 } from 'uuid';
import { PluginType } from '@shared/schema';

// Custom node components
const InputNode = ({ data, id, selected }: NodeProps) => (
  <div className={`node border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} style={{ borderColor: '#60A5FA', minWidth: '150px' }}>
    <div className="bg-plugin-input text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#60A5FA' }}>
      <span>{data.plugin}</span>
      <div className="flex space-x-1">
        <button className="w-5 h-5 rounded hover:bg-blue-400 flex items-center justify-center text-xs">
          <i className="ri-settings-4-line"></i>
        </button>
        <button className="w-5 h-5 rounded hover:bg-blue-400 flex items-center justify-center text-xs">
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
    <div className="p-3 text-sm bg-white rounded-b-lg">
      <div className="text-gray-500 mb-1">Inputs:</div>
      <div className="text-gray-700 mb-2">None</div>
      <div className="text-gray-500 mb-1">Outputs:</div>
      <div className="flex items-center text-gray-700">
        <span className="mr-2">All metrics</span>
        <Handle type="source" position={Position.Right} id="output" />
      </div>
    </div>
  </div>
);

const ProcessorNode = ({ data, id, selected }: NodeProps) => (
  <div className={`node border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} style={{ borderColor: '#F97316', minWidth: '150px' }}>
    <div className="bg-plugin-processor text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#F97316' }}>
      <span>{data.plugin}</span>
      <div className="flex space-x-1">
        <button className="w-5 h-5 rounded hover:bg-orange-400 flex items-center justify-center text-xs">
          <i className="ri-settings-4-line"></i>
        </button>
        <button className="w-5 h-5 rounded hover:bg-orange-400 flex items-center justify-center text-xs">
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
    <div className="p-3 text-sm bg-white rounded-b-lg">
      <div className="text-gray-500 mb-1">Inputs:</div>
      <div className="flex items-center text-gray-700 mb-2">
        <Handle type="target" position={Position.Left} id="input" />
        <span>Processor input</span>
      </div>
      <div className="text-gray-500 mb-1">Outputs:</div>
      <div className="flex items-center text-gray-700">
        <span className="mr-2">Processed data</span>
        <Handle type="source" position={Position.Right} id="output" />
      </div>
    </div>
  </div>
);

const OutputNode = ({ data, id, selected }: NodeProps) => (
  <div className={`node border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} style={{ borderColor: '#10B981', minWidth: '150px' }}>
    <div className="bg-plugin-output text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#10B981' }}>
      <span>{data.plugin}</span>
      <div className="flex space-x-1">
        <button className="w-5 h-5 rounded hover:bg-emerald-400 flex items-center justify-center text-xs">
          <i className="ri-settings-4-line"></i>
        </button>
        <button className="w-5 h-5 rounded hover:bg-emerald-400 flex items-center justify-center text-xs">
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
    <div className="p-3 text-sm bg-white rounded-b-lg">
      <div className="text-gray-500 mb-1">Inputs:</div>
      <div className="flex items-center text-gray-700 mb-2">
        <Handle type="target" position={Position.Left} id="input" />
        <span>Output input</span>
      </div>
      <div className="text-gray-500 mb-1">Outputs:</div>
      <div className="text-gray-700">None</div>
    </div>
  </div>
);

const nodeTypes: NodeTypes = {
  input: InputNode,
  processor: ProcessorNode,
  output: OutputNode,
};

const EditorCanvas = () => {
  const { 
    telegrafConfig, 
    setTelegrafConfig, 
    selectedNode, 
    selectedConnection, 
    setSelectedNode, 
    setSelectedConnection 
  } = useTelegrafConfig();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Convert telegrafConfig nodes to react-flow nodes
  const convertToReactFlowNodes = useCallback(() => {
    return telegrafConfig.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        plugin: node.plugin,
      },
    }));
  }, [telegrafConfig.nodes]);

  // Convert telegrafConfig connections to react-flow edges
  const convertToReactFlowEdges = useCallback(() => {
    return telegrafConfig.connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      type: 'default',
      data: connection.filters,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));
  }, [telegrafConfig.connections]);

  // Update react-flow nodes and edges when telegrafConfig changes
  useEffect(() => {
    setNodes(convertToReactFlowNodes());
    setEdges(convertToReactFlowEdges());
  }, [telegrafConfig, convertToReactFlowNodes, convertToReactFlowEdges, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(telegrafConfig.nodes.find((n) => n.id === node.id) || null);
      setSelectedConnection(null);
    },
    [telegrafConfig.nodes, setSelectedNode, setSelectedConnection]
  );

  // Handle edge selection
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedConnection(telegrafConfig.connections.find((c) => c.id === edge.id) || null);
      setSelectedNode(null);
    },
    [telegrafConfig.connections, setSelectedConnection, setSelectedNode]
  );

  // Handle pane click (deselect all)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedConnection(null);
  }, [setSelectedNode, setSelectedConnection]);

  // Handle connecting two nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source || '',
        target: connection.target || '',
        type: 'default',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };

      setEdges((eds) => [...eds, newEdge]);

      // Update telegrafConfig connections
      const sourceNode = telegrafConfig.nodes.find((n) => n.id === connection.source);
      const targetNode = telegrafConfig.nodes.find((n) => n.id === connection.target);

      if (sourceNode && targetNode) {
        const newConnection = {
          id: newEdge.id,
          source: sourceNode.id,
          target: targetNode.id,
          filters: {},
        };

        setTelegrafConfig({
          ...telegrafConfig,
          connections: [...telegrafConfig.connections, newConnection],
        });
      }
    },
    [telegrafConfig, setTelegrafConfig, setEdges]
  );

  // Handle dropping a new node on the canvas
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (reactFlowWrapper.current && reactFlowInstance) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow/type');
        const pluginName = event.dataTransfer.getData('application/reactflow/plugin');
        
        if (!type || !pluginName) return;

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode = {
          id: `${pluginName}-${uuidv4().slice(0, 4)}`,
          type,
          position,
          data: {
            plugin: pluginName,
            ...telegrafConfig[pluginName],
          },
        };

        // Create the telegraf config node
        const telegrafNode = {
          id: newNode.id,
          type: type as typeof PluginType[keyof typeof PluginType],
          plugin: pluginName,
          position,
          data: { ...telegrafConfig[pluginName] },
        };

        setTelegrafConfig({
          ...telegrafConfig,
          nodes: [...telegrafConfig.nodes, telegrafNode],
        });
      }
    },
    [reactFlowInstance, telegrafConfig, setTelegrafConfig]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="flex-1 overflow-hidden relative" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
        >
          <Controls />
          <Background variant="dots" gap={20} color="#4B5563" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default EditorCanvas;
