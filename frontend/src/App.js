// frontend/src/App.js
import React, { useState, useEffect, useRef } from 'react';
import Canvas from './Canvas';
import './App.css';

// Paleta de cores predefinida
const COLOR_PALETTE = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#00FFFF", "#FF00FF", "#808080", "#C0C0C0"
];

const App = () => {
  const [width, setWidth] = useState(16);
  const [height, setHeight] = useState(16);
  const [pixelSize, setPixelSize] = useState(20);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [drawingName, setDrawingName] = useState("");
  const [savedDrawings, setSavedDrawings] = useState([]);
  const [loadedDrawingData, setLoadedDrawingData] = useState(null);
  const [tool, setTool] = useState("pencil");
  
  const canvasRef = useRef(null);
  const API_BASE_URL = "http://localhost:8000";

  useEffect(() => {
    fetchSavedDrawings();
  }, []);

  const fetchSavedDrawings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drawings/`);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      setSavedDrawings(data.drawings);
    } catch (error) {
      console.error("Erro ao carregar desenhos:", error);
      alert("Erro ao carregar desenhos. Verifique o console para mais detalhes.");
    }
  };

  const handleColorChange = (e) => setSelectedColor(e.target.value);

  const handleSave = async () => {
    if (!drawingName) {
      alert("Por favor, digite um nome para o desenho antes de salvar.");
      return;
    }
    
    const drawingData = canvasRef.current.getDrawingData();
    const payload = {
      name: drawingName,
      width: drawingData.width,
      height: drawingData.height,
      pixels: drawingData.pixels,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/drawings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      alert(data.message);
      setDrawingName("");
      fetchSavedDrawings();
    } catch (error) {
      console.error("Erro ao salvar desenho:", error);
      alert("Erro ao salvar desenho. Verifique o console para mais detalhes.");
    }
  };

  const handleLoadDrawing = async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/drawings/${name}`);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      setLoadedDrawingData(data);
      setWidth(data.width);
      setHeight(data.height);
      setDrawingName(name);
      alert(`Desenho '${name}' carregado com sucesso!`);
    } catch (error) {
      console.error("Erro ao carregar desenho:", error);
      alert("Erro ao carregar desenho. Verifique o console para mais detalhes.");
    }
  };

  const handleNewCanvas = () => {
    const isConfirmed = window.confirm("Certeza que quer criar um novo canvas? Seu desenho atual será perdido.");
    if (isConfirmed) {
      setLoadedDrawingData(null);
    }
  };

  const handleUndo = () => canvasRef.current.undo();
  const handleRedo = () => canvasRef.current.redo();

  return (
    <div className="app-container">
      <h1>Simple Pixel Art Editor</h1>
      
      <div className="controls">
        <div className="color-picker-container">
          <label htmlFor="color-picker">Cor:</label>
          <input 
            id="color-picker"
            type="color" 
            value={selectedColor} 
            onChange={handleColorChange} 
          />
        </div>

        <div className="palette-container">
          {COLOR_PALETTE.map((color, index) => (
            <button
              key={index}
              className="palette-color"
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>

        <div className="tool-selector">
          <button 
            className={tool === "pencil" ? "tool-button active" : "tool-button"}
            onClick={() => setTool("pencil")}
          >
            Lápis
          </button>
          <button 
            className={tool === "eraser" ? "tool-button active" : "tool-button"}
            onClick={() => setTool("eraser")}
          >
            Borracha
          </button>
          <button 
            className={tool === "fill" ? "tool-button active" : "tool-button"}
            onClick={() => setTool("fill")}
          >
            Balde de Tinta
          </button>
        </div>
        
        <div className="undo-redo-controls">
          <button onClick={handleUndo}>Desfazer</button>
          <button onClick={handleRedo}>Refazer</button>
        </div>

        <div className="size-controls">
          <label>Largura:
            <input 
              type="number" 
              value={width} 
              onChange={(e) => setWidth(Number(e.target.value))} 
              min="1" max="64"
            />
          </label>
          <label>Altura:
            <input 
              type="number" 
              value={height} 
              onChange={(e) => setHeight(Number(e.target.value))} 
              min="1" max="64"
            />
          </label>
          <button onClick={handleNewCanvas}>Novo Canvas</button>
        </div>

        <div className="zoom-control">
          <label>Zoom: {pixelSize}x</label>
          <input
            type="range"
            min="10"
            max="50"
            value={pixelSize}
            onChange={(e) => setPixelSize(Number(e.target.value))}
          />
        </div>

        <div className="save-load-controls">
          <input
            type="text"
            value={drawingName}
            onChange={(e) => setDrawingName(e.target.value)}
            placeholder="Nome do Desenho"
          />
          <button onClick={handleSave}>Salvar</button>
        </div>
      </div>

      <Canvas 
        ref={canvasRef}
        width={width}
        height={height}
        pixelSize={pixelSize} 
        selectedColor={selectedColor}
        initialDrawingData={loadedDrawingData}
        tool={tool}
      />

      <div className="saved-drawings-section">
        <h2>Desenhos Salvos</h2>
        {savedDrawings.length === 0 ? (
          <p>Nenhum desenho salvo ainda.</p>
        ) : (
          <ul className="drawing-list">
            {savedDrawings.map((name) => (
              <li key={name}>
                <span>{name}</span>
                <button onClick={() => handleLoadDrawing(name)}>Carregar</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;