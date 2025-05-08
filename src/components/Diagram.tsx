import React, { useState, useLayoutEffect, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Arrow } from 'react-konva';
import { DiagramElement, Connection, DiagramData } from '../types';
import { debounce } from 'lodash';

interface DiagramProps {
  width: number;
  height: number;
  color: string;
  onDataChange?: (data: DiagramData) => void;
  initialData?: DiagramData;
}

const DIRECTIONS = ['top', 'right', 'bottom', 'left'] as const;

const Diagram: React.FC<DiagramProps> = ({ width, height, color, onDataChange, initialData }) => {
  const [elements, setElements] = useState<DiagramElement[]>(initialData?.elements || []);
  const [connections, setConnections] = useState<Connection[]>(initialData?.connections || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggingConnection, setDraggingConnection] = useState<{
    fromId: string;
    fromPosition: 'top' | 'right' | 'bottom' | 'left';
    toPosition: { x: number; y: number };
  } | null>(null);
  const [showDragPoints, setShowDragPoints] = useState(false);

  const stageRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  useMemo(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (initialData) {
      setElements(initialData.elements);
      setConnections(initialData.connections);
    }
  }, [initialData?.elements, initialData?.connections]);

  // Notify parent of changes only when local state changes
  useEffect(() => {
    console.log('useEffect - local state changed:', {
      isInitialMount: isInitialMount.current,
      elements,
      connections,
    });

    if (isInitialMount.current) return;
    if (onDataChange) {
      onDataChange({ elements, connections });
    }
  }, [elements, connections, onDataChange]);

  const handleElementDrag = (id: string, newX: number, newY: number) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, x: newX, y: newY } : el)));
  };

  const handleConnectionStart = (elementId: string, position: 'top' | 'right' | 'bottom' | 'left', e: any) => {
    console.log('handleConnectionStart:', {
      elementId,
      position,
      event: e,
    });

    e.evt.preventDefault();
    e.evt.stopPropagation();
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    setDraggingConnection({
      fromId: elementId,
      fromPosition: position,
      toPosition: { x: point.x, y: point.y },
    });
  };

  useLayoutEffect(() => {
    if (draggingConnection && draggingConnection.toPosition) {
      // Check if the `toPosition` matches any connection point of existing elements
      const targetElement = elements.find((element) =>
        DIRECTIONS.some((position) => {
          const connectionPoint = getConnectionPoints(element, position as any);
          return Math.abs(connectionPoint.x - draggingConnection.toPosition.x) < 10 && Math.abs(connectionPoint.y - draggingConnection.toPosition.y) < 10;
        })
      );

      if (targetElement) {
        // Prevent self-connections
        if (draggingConnection.fromId === targetElement.id) {
          console.log('Self-connection prevented');
          setDraggingConnection(null); // Reset dragging connection
          return;
        }

        // Find the matching position
        const matchedPosition = DIRECTIONS.find((position) => {
          const connectionPoint = getConnectionPoints(targetElement, position as any);
          return Math.abs(connectionPoint.x - draggingConnection.toPosition.x) < 10 && Math.abs(connectionPoint.y - draggingConnection.toPosition.y) < 10;
        });

        if (matchedPosition) {
          // Create a new connection
          const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            from: {
              elementId: draggingConnection.fromId,
              position: draggingConnection.fromPosition,
            },
            to: {
              elementId: targetElement.id,
              position: matchedPosition as 'top' | 'right' | 'bottom' | 'left',
            },
          };

          console.log('Creating new connection:', newConnection);
          setConnections((prev) => [...prev, newConnection]);
          setDraggingConnection(null); // Reset dragging connection
        }
      }
    }
  }, [draggingConnection, elements]);

  const handleConnectionMove = debounce((e: any) => {
    if (!draggingConnection) return;

    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    setDraggingConnection((prev) => ({
      ...prev!,
      toPosition: { x: point.x, y: point.y },
    }));
  }, 5); // Adjust debounce delay as needed

  const handleStageMouseUp = (e: any) => {
    console.log('Stage mouse up:', { draggingConnection });
    if (draggingConnection) {
      setDraggingConnection(null); // Reset draggingConnection
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
      setElements(elements.filter((el) => el.id !== selectedElement));
      setConnections(connections.filter((conn) => conn.from.elementId !== selectedElement && conn.to.elementId !== selectedElement));
      setSelectedElement(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement]);

  const getConnectionPoints = (element: DiagramElement, position: 'top' | 'right' | 'bottom' | 'left') => {
    if (!element) return { x: 0, y: 0 };

    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    switch (position) {
      case 'top':
        return { x: centerX, y: element.y - 10 };
      case 'right':
        return { x: element.x + element.width + 10, y: centerY };
      case 'bottom':
        return { x: centerX, y: element.y + element.height + 10 };
      case 'left':
        return { x: element.x - 10, y: centerY };
      default:
        console.warn(`Invalid position: ${position}`);
        return { x: centerX, y: centerY }; // Default to center
    }
  };

  const renderedConnections = useMemo(() => {
    return connections.map((connection) => {
      const fromElement = elements.find((el) => el.id === connection.from.elementId);
      const toElement = elements.find((el) => el.id === connection.to.elementId);
      if (!fromElement || !toElement) return null;

      const fromPoint = getConnectionPoints(fromElement, connection.from.position);
      const toPoint = getConnectionPoints(toElement, connection.to.position);

      return (
        <Arrow key={connection.id} points={[fromPoint.x, fromPoint.y, toPoint.x, toPoint.y]} stroke="black" fill="black" pointerLength={10} pointerWidth={10} />
      );
    });
  }, [connections, elements]);

  const renderedElements = useMemo(() => {
    return elements.map((element) => (
      <React.Fragment key={element.id}>
        {element.type === 'rectangle' ? (
          <Rect
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.color || color}
            draggable
            onClick={() => setSelectedElement(element.id)}
            onDragMove={(e) => handleElementDrag(element.id, e.target.x(), e.target.y())}
            onMouseEnter={(e) => {
              console.log('Mouse enter:', e);
              setShowDragPoints(true);
            }}
            onMouseLeave={(e) => {
              console.log('Mouse leave:', e);
              if (draggingConnection) {
                console.log('Dragging connection:', draggingConnection);
                return;
              }
              setShowDragPoints(false);
            }}
          />
        ) : (
          <Circle
            x={element.x + element.width / 2}
            y={element.y + element.height / 2}
            radius={element.width / 2}
            fill={element.color || color}
            draggable
            onClick={() => setSelectedElement(element.id)}
            onDragMove={(e) => handleElementDrag(element.id, e.target.x() - element.width / 2, e.target.y() - element.height / 2)}
            onMouseEnter={(e) => {
              console.log('Mouse enter:', e);
              setShowDragPoints(true);
            }}
            onMouseLeave={(e) => {
              console.log('Mouse leave:', e);
              setShowDragPoints(false);
            }}
          />
        )}

        {showDragPoints
          ? DIRECTIONS.map((position) => (
              <React.Fragment key={`${element.id}-${position}`}>
                <Circle
                  x={getConnectionPoints(element, position as any).x}
                  y={getConnectionPoints(element, position as any).y}
                  radius={20}
                  fill="rgba(0, 0, 255, 0.08)"
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'pointer'; // Change cursor to pointer on hover
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = draggingConnection ? 'crosshair' : 'default'; // Reset cursor
                    }
                  }}
                  onMouseDown={(e) => {
                    e.evt.preventDefault();
                    e.evt.stopPropagation();
                    handleConnectionStart(element.id, position as any, e);
                  }}
                />
              </React.Fragment>
            ))
          : null}
      </React.Fragment>
    ));
  }, [elements, color, draggingConnection]);

  return (
    <Stage width={width} height={height} ref={stageRef} onMouseMove={handleConnectionMove} onMouseUp={handleStageMouseUp}>
      <Layer>
        {renderedConnections}
        {renderedElements}
        {draggingConnection && (
          <Arrow
            points={[
              getConnectionPoints(elements.find((el) => el.id === draggingConnection.fromId)!, draggingConnection.fromPosition).x,
              getConnectionPoints(elements.find((el) => el.id === draggingConnection.fromId)!, draggingConnection.fromPosition).y,
              draggingConnection.toPosition.x,
              draggingConnection.toPosition.y,
            ]}
            stroke="blue"
            fill="blue"
            pointerLength={10}
            pointerWidth={10}
          />
        )}
      </Layer>
    </Stage>
  );
};

export default Diagram;
