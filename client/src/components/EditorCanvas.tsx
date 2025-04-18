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
  <div 
    className={`node node-input border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} 
    style={{ borderColor: '#60A5FA', minWidth: '100px' }}
    data-type="input"
    data-node-id={id}
    data-plugin={data.plugin}
  >
    <div className="bg-plugin-input text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#60A5FA' }}>
      <span>{data.plugin}</span>
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
    <Handle 
      type="source" 
      position={Position.Right} 
      id="output" 
      style={handleStyle}
    />
  </div>
);

const ProcessorNode = ({ data, id, selected, onDelete }: CustomNodeProps) => (
  <div 
    className={`node node-processor border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} 
    style={{ borderColor: '#F97316', minWidth: '100px' }}
    data-type="processor"
    data-node-id={id}
    data-plugin={data.plugin}
  >
    <div className="bg-plugin-processor text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#F97316' }}>
      <span>{data.plugin}</span>
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
);

const OutputNode = ({ data, id, selected, onDelete }: CustomNodeProps) => (
  <div 
    className={`node node-output border-2 rounded-lg shadow-lg flex flex-col ${selected ? 'ring-2 ring-blue-400' : ''}`} 
    style={{ borderColor: '#10B981', minWidth: '100px' }}
    data-type="output"
    data-node-id={id}
    data-plugin={data.plugin}
  >
    <div className="bg-plugin-output text-white px-3 py-2 rounded-t-md font-medium flex items-center justify-between" style={{ backgroundColor: '#10B981' }}>
      <span>{data.plugin}</span>
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
    <Handle 
      type="target" 
      position={Position.Left} 
      id="input" 
      style={handleStyle}
    />
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
      // Add data-type attribute to help with node positioning
      data: {
        ...node.data,
        plugin: node.plugin,
      },
      // Set attributes that will preserve exact positions
      draggable: true,
      selectable: true,
      connectable: true,
      // Add an important data attribute to identify node type in the DOM
      dragHandle: `.node-${node.type}`,
      // Set exact position properties
      positionAbsolute: node.position,
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
    // Apply changes to the local state first
    onNodesChange(changes);
    
    // We only care about final position changes (not during dragging)
    const positionChanges = changes.filter((change: any) => 
      change.type === 'position' && change.position && change.dragging === false
    );
    
    if (positionChanges.length > 0) {
      // Preserve all node positions - important for preventing unwanted shifts
      const currentNodePositions = telegrafConfig.nodes.reduce((acc, node) => {
        acc[node.id] = { ...node.position };
        return acc;
      }, {} as Record<string, {x: number, y: number}>);
      
      // Update node positions in telegrafConfig
      const updatedNodes = telegrafConfig.nodes.map(node => {
        // Find if this node has a position change
        const change = positionChanges.find((c: any) => c.id === node.id);
        
        if (change) {
          // Apply the new position if there's a change
          return {
            ...node,
            position: {
              x: Math.round(change.position.x / 20) * 20, // Snap to grid
              y: Math.round(change.position.y / 20) * 20  // Snap to grid
            }
          };
        } else {
          // Keep the exact same position for unchanged nodes
          return {
            ...node,
            position: currentNodePositions[node.id] || node.position
          };
        }
      });
      
      // Update the entire telegrafConfig with preserved positions
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
      // IMPORTANT: Get a snapshot of all current node positions before any changes
      const currentNodePositions = telegrafConfig.nodes.reduce((acc, node) => {
        acc[node.id] = { ...node.position };
        return acc;
      }, {} as Record<string, {x: number, y: number}>);
      
      // Create a unique ID for this connection
      const connectionId = `e-${connection.source}-${connection.target}-${Date.now().toString(36)}`;
      
      // Create a new edge with the connection
      const newEdge = {
        id: connectionId,
        source: connection.source || '',
        target: connection.target || '',
        type: 'default',
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
        // Explicitly disable any movement or recalculation
        animated: false,
        updatable: false,
        deletable: true,
      };

      // Update telegrafConfig connections
      const sourceNode = telegrafConfig.nodes.find((n) => n.id === connection.source);
      const targetNode = telegrafConfig.nodes.find((n) => n.id === connection.target);

      if (sourceNode && targetNode) {
        // Create a new connection for the Telegraf config
        const newConnection = {
          id: connectionId,
          source: sourceNode.id,
          target: targetNode.id,
          filters: {},
        };

        // Important: Create a completely new set of nodes with the exact same positions
        // This prevents React Flow from recalculating positions when edges are added
        const updatedNodes = telegrafConfig.nodes.map(node => ({
          ...node,
          // Keep the exact same position data
          position: { ...currentNodePositions[node.id] || node.position },
          // Set absolute position to ensure it doesn't move
          positionAbsolute: { ...currentNodePositions[node.id] || node.position },
        }));

        // Add the edge separately after updating the nodes to prevent shifts
        setTimeout(() => {
          // Add the new edge to the set of edges - this needs to be deferred 
          // to prevent React Flow from triggering a layout recomputation
          setEdges(eds => [...eds, newEdge]);
        }, 0);

        // First update the node positions with preserved positions
        setTelegrafConfig({
          ...telegrafConfig,
          nodes: updatedNodes,
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
        // Get a snapshot of all current node positions
        const currentNodePositions = telegrafConfig.nodes.reduce((acc, node) => {
          acc[node.id] = { ...node.position };
          return acc;
        }, {} as Record<string, {x: number, y: number}>);
        
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow/type');
        const pluginName = event.dataTransfer.getData('application/reactflow/plugin');
        
        if (!type || !pluginName) return;

        // Get the position where the node was dropped in the flow space
        const exactPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });
        
        // Snap to grid for cleaner positioning
        const position = {
          x: Math.round(exactPosition.x / 20) * 20,
          y: Math.round(exactPosition.y / 20) * 20
        };

        // Generate a unique ID for the new node
        const nodeId = `${pluginName}-${uuidv4().slice(0, 4)}`;

        // Create the telegraf config node with precise position
        const telegrafNode = {
          id: nodeId,
          type: type as typeof PluginType[keyof typeof PluginType],
          plugin: pluginName,
          // Store the position exactly as calculated (important!)
          position: position,
          positionAbsolute: position,
          data: { ...getDefaultNodeData(pluginName) },
        };

        // Update all existing nodes to preserve their positions
        const preservedNodes = telegrafConfig.nodes.map(node => ({
          ...node,
          // Keep the exact same position data
          position: currentNodePositions[node.id] || node.position,
          positionAbsolute: currentNodePositions[node.id] || node.position,
        }));

        // Update the telegraf config with the new node and preserved positions
        setTelegrafConfig({
          ...telegrafConfig,
          nodes: [...preservedNodes, telegrafNode],
        });
      }
    },
    [reactFlowInstance, telegrafConfig, setTelegrafConfig]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Listen for custom add-node events from the plugin panel
  useEffect(() => {
    const handleAddNode = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, plugin, position } = customEvent.detail;
      
      if (!type || !plugin || !position) return;
      
      // Get a snapshot of all current node positions before any changes
      const currentNodePositions = telegrafConfig.nodes.reduce((acc, node) => {
        acc[node.id] = { ...node.position };
        return acc;
      }, {} as Record<string, {x: number, y: number}>);
      
      // Determine an exact position based on existing nodes of this type
      let exactPos = {...position};
      
      // Find existing nodes of this type to avoid overlap
      const existingNodesOfType = telegrafConfig.nodes.filter(n => n.type === type);
      for (const node of existingNodesOfType) {
        if (Math.abs(node.position.x - exactPos.x) < 20 && 
            Math.abs(node.position.y - exactPos.y) < 20) {
          // Position is too close, adjust the Y position
          exactPos.y += 100;
        }
      }
      
      // Snap to grid for cleaner layout
      const finalPosition = {
        x: Math.round(exactPos.x / 20) * 20,
        y: Math.round(exactPos.y / 20) * 20
      };
      
      // Generate a unique ID for the new node
      const nodeId = `${plugin}-${uuidv4().slice(0, 4)}`;
      
      // Create the telegraf config node with precise position information
      const telegrafNode = {
        id: nodeId,
        type: type as typeof PluginType[keyof typeof PluginType],
        plugin: plugin,
        position: finalPosition,
        positionAbsolute: finalPosition,
        data: { ...getDefaultNodeData(plugin) },
      };
      
      // Update all existing nodes to preserve their positions exactly
      const preservedNodes = telegrafConfig.nodes.map(node => ({
        ...node,
        // Keep the exact same position data
        position: currentNodePositions[node.id] || node.position,
        positionAbsolute: currentNodePositions[node.id] || node.position,
      }));
      
      // Update the telegraf config with the new node and preserved positions
      setTelegrafConfig({
        ...telegrafConfig,
        nodes: [...preservedNodes, telegrafNode],
      });
    };
    
    // Add event listener
    window.addEventListener('telegraf-add-node', handleAddNode);
    
    // Clean up
    return () => {
      window.removeEventListener('telegraf-add-node', handleAddNode);
    };
  }, [telegrafConfig, setTelegrafConfig]);
  
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
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          fitView={false}
          snapToGrid={true}
          snapGrid={[20, 20]}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          preventScrolling={false}
          defaultEdgeOptions={{
            type: 'default',
            style: { strokeWidth: 3, stroke: '#555' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: '#555'
            },
          }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.5}
          maxZoom={2}
          translateExtent={[[-500, -500], [1500, 1500]]}
          nodeExtent={[[-500, -500], [1500, 1500]]}
          elevateNodesOnSelect={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          autoPanOnConnect={false}
          autoPanOnNodeDrag={false}
        >
          <Controls />
          <Background color="#4B5563" gap={20} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default EditorCanvas;
