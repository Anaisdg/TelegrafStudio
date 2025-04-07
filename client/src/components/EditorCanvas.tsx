import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
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
import { getDefaultNodeData } from '@/utils/telegraf';

// Custom node components with delete functionality
type CustomNodeProps = NodeProps & {
  onDelete?: (id: string) => void;
}

// Custom styling for the Handle components
const handleStyle = {
  width: '16px',
  height: '16px',
  background: '#555',
  border: '2px solid white'
};

const InputNode = ({ data, id, selected, onDelete }: CustomNodeProps) => (
  <div className={`node border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} style={{ borderColor: '#60A5FA', minWidth: '120px' }}>
    <div className="bg-plugin-input text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#60A5FA' }}>
      <span>{data.plugin}</span>
      <div className="flex space-x-1">
        <button 
          className="w-5 h-5 rounded hover:bg-blue-400 flex items-center justify-center text-xs"
          onClick={(e) => {
            e.stopPropagation();
            // This button is just for show, no action needed
          }}
        >
          <i className="ri-settings-4-line"></i>
        </button>
        <button 
          className="w-5 h-5 rounded hover:bg-blue-400 flex items-center justify-center text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(id);
          }}
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
    <div className="p-3 text-sm bg-white rounded-b-lg flex flex-col items-center">
      <div className="flex items-center justify-end w-full py-2">
        <Handle 
          type="source" 
          position={Position.Right} 
          id="output" 
          style={handleStyle}
        />
      </div>
    </div>
  </div>
);

const ProcessorNode = ({ data, id, selected, onDelete }: CustomNodeProps) => (
  <div className={`node border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} style={{ borderColor: '#F97316', minWidth: '120px' }}>
    <div className="bg-plugin-processor text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#F97316' }}>
      <span>{data.plugin}</span>
      <div className="flex space-x-1">
        <button 
          className="w-5 h-5 rounded hover:bg-orange-400 flex items-center justify-center text-xs"
          onClick={(e) => {
            e.stopPropagation();
            // This button is just for show, no action needed
          }}
        >
          <i className="ri-settings-4-line"></i>
        </button>
        <button 
          className="w-5 h-5 rounded hover:bg-orange-400 flex items-center justify-center text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(id);
          }}
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
    <div className="p-3 text-sm bg-white rounded-b-lg flex flex-col items-center">
      <div className="flex items-center w-full justify-between py-2">
        <Handle 
          type="target" 
          position={Position.Left} 
          id="input" 
          style={handleStyle}
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          id="output" 
          style={handleStyle}
        />
      </div>
    </div>
  </div>
);

const OutputNode = ({ data, id, selected, onDelete }: CustomNodeProps) => (
  <div className={`node border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} style={{ borderColor: '#10B981', minWidth: '120px' }}>
    <div className="bg-plugin-output text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#10B981' }}>
      <span>{data.plugin}</span>
      <div className="flex space-x-1">
        <button 
          className="w-5 h-5 rounded hover:bg-emerald-400 flex items-center justify-center text-xs"
          onClick={(e) => {
            e.stopPropagation();
            // This button is just for show, no action needed
          }}
        >
          <i className="ri-settings-4-line"></i>
        </button>
        <button 
          className="w-5 h-5 rounded hover:bg-emerald-400 flex items-center justify-center text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(id);
          }}
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
    <div className="p-3 text-sm bg-white rounded-b-lg flex flex-col items-center">
      <div className="flex items-center justify-start w-full py-2">
        <Handle 
          type="target" 
          position={Position.Left} 
          id="input" 
          style={handleStyle}
        />
      </div>
    </div>
  </div>
);

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

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    // Remove the node from telegrafConfig
    const updatedNodes = telegrafConfig.nodes.filter(node => node.id !== nodeId);
    
    // Remove any connections that involve this node
    const updatedConnections = telegrafConfig.connections.filter(
      connection => connection.source !== nodeId && connection.target !== nodeId
    );
    
    // Update the telegrafConfig
    setTelegrafConfig({
      ...telegrafConfig,
      nodes: updatedNodes,
      connections: updatedConnections
    });
    
    // If the deleted node was selected, clear the selection
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  }, [telegrafConfig, setTelegrafConfig, selectedNode, setSelectedNode]);

  // Create memoized node types to avoid React Flow warning
  const nodeTypes = useMemo(() => ({
    input: (props: NodeProps) => <InputNode {...props} onDelete={handleNodeDelete} />,
    processor: (props: NodeProps) => <ProcessorNode {...props} onDelete={handleNodeDelete} />,
    output: (props: NodeProps) => <OutputNode {...props} onDelete={handleNodeDelete} />,
  }), [handleNodeDelete]);

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
      style: { 
        strokeWidth: 3, 
        stroke: '#555' 
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: '#555'
      },
    }));
  }, [telegrafConfig.connections]);

  // Update react-flow nodes and edges when telegrafConfig changes
  useEffect(() => {
    setNodes(convertToReactFlowNodes());
    setEdges(convertToReactFlowEdges());
  }, [telegrafConfig, convertToReactFlowNodes, convertToReactFlowEdges, setNodes, setEdges]);

  // When nodes change position, update the telegrafConfig
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    
    // Filter for position changes only
    const positionChanges = changes.filter((change: any) => 
      change.type === 'position' && change.position && change.dragging === false
    );
    
    if (positionChanges.length > 0) {
      // Update node positions in telegrafConfig
      const updatedNodes = [...telegrafConfig.nodes];
      
      positionChanges.forEach((change: any) => {
        const nodeIndex = updatedNodes.findIndex(node => node.id === change.id);
        if (nodeIndex !== -1) {
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            position: change.position
          };
        }
      });
      
      setTelegrafConfig({
        ...telegrafConfig,
        nodes: updatedNodes
      });
    }
  }, [onNodesChange, telegrafConfig, setTelegrafConfig]);

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
        style: { 
          strokeWidth: 3, 
          stroke: '#555' 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#555'
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

        // Get the position where the node was dropped in the flow space
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Generate a unique ID for the new node
        const nodeId = `${pluginName}-${uuidv4().slice(0, 4)}`;

        // Create the telegraf config node
        const telegrafNode = {
          id: nodeId,
          type: type as typeof PluginType[keyof typeof PluginType],
          plugin: pluginName,
          // Store the position explicitly
          position: {
            x: position.x,
            y: position.y
          },
          data: { ...getDefaultNodeData(pluginName) },
        };

        // Update the telegraf config with the new node
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
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#555', strokeWidth: 3 }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
        >
          <Controls />
          <Background color="#4B5563" gap={20} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default EditorCanvas;
