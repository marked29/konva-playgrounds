export interface DiagramElement {
  id: string;
  type: 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Connection {
  id: string;
  from: {
    elementId: string;
    position: 'top' | 'right' | 'bottom' | 'left';
  };
  to: {
    elementId: string;
    position: 'top' | 'right' | 'bottom' | 'left';
  };
}

export interface DiagramData {
  elements: DiagramElement[];
  connections: Connection[];
}
