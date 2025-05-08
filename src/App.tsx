import React, { useState } from 'react';
import Diagram from './components/Diagram';
import { DiagramData, DiagramElement } from './types';
import './App.css';

const App: React.FC = () => {
  const [color, setColor] = useState<string>('#4CAF50');
  const [diagramData, setDiagramData] = useState<DiagramData>({
    elements: [],
    connections: [],
  });

  const handleAddRectangle = () => {
    const newElement: DiagramElement = {
      id: `rect-${Date.now()}`,
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 60,
      color: color,
    };
    setDiagramData((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
  };

  const handleAddCircle = () => {
    const newElement: DiagramElement = {
      id: `circle-${Date.now()}`,
      type: 'circle',
      x: 100,
      y: 100,
      width: 60,
      height: 60,
      color: color,
    };
    setDiagramData((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'diagram.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        setDiagramData(jsonData);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={handleAddRectangle}>Add Rectangle</button>
        <button onClick={handleAddCircle}>Add Circle</button>
        <input type="color" value={color} onChange={handleColorChange} title="Choose color" />
        <button onClick={handleExport}>Export JSON</button>
        <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} id="import-json" />
        <label htmlFor="import-json" className="button">
          Import JSON
        </label>
      </div>
      <div className="diagram-container">
        <Diagram width={1200} height={1800} color={color} onDataChange={setDiagramData} initialData={diagramData} />
      </div>
    </div>
  );
};

export default App;
