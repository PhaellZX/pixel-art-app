// frontend/src/App.js
import React, { useState, useEffect, useRef } from 'react';
import Canvas from './Canvas';
import './App.css';

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
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [tool, setTool] = useState("pencil");

  const canvasRef = useRef(null);
  const API_BASE_URL = "http://localhost:8000";

  useEffect(() => {
    if (layers.length === 0) {
      addLayer();
    }
    fetchSavedDrawings();
  }, []);

  const addLayer = () => {
    const newLayer = {
      id: Date.now(),
      name: `Camada ${layers.length + 1}`,
      pixels: Array(width * height).fill("transparent"),
      isVisible: true,
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const removeLayer = (id) => {
    if (layers.length <= 1) {
      alert("Não é possível remover a última camada.");
      return;
    }
    const filteredLayers = layers.filter(layer => layer.id !== id);
    setLayers(filteredLayers);
    setActiveLayerId(filteredLayers[filteredLayers.length - 1].id);
  };
  
  const toggleLayerVisibility = (id) => {
    setLayers(layers.map(layer =>
      layer.id === id ? { ...layer, isVisible: !layer.isVisible } : layer
    ));
  };

  const fetchSavedDrawings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drawings/`);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      if (data && Array.isArray(data.drawings)) {
        setSavedDrawings(data.drawings);
      }
    } catch (error) {
      console.error("Erro ao carregar desenhos:", error);
    }
  };

  const handleSave = async () => {
    if (!drawingName) {
      alert("Por favor, digite um nome para o desenho antes de salvar.");
      return;
    }
    
    const payload = {
      name: drawingName,
      width: width,
      height: height,
      layers: layers.map(layer => ({
        name: layer.name,
        pixels: layer.pixels
      })),
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
    }
  };

  const handleLoadDrawing = async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/drawings/${name}`);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();
      
      if (!data || !Array.isArray(data.layers) || data.layers.length === 0) {
        alert("Erro: Dados do desenho inválidos ou vazios.");
        return;
      }
      
      const loadedLayers = data.layers.map((layer, index) => ({
        id: Date.now() + index,
        name: layer.name,
        // Garante que pixels seja um array, mesmo se vier null da API
        pixels: Array.isArray(layer.pixels) ? layer.pixels : Array(data.width * data.height).fill("transparent"),
        isVisible: true,
      }));
      setLayers(loadedLayers);
      setActiveLayerId(loadedLayers[0].id);
      setWidth(data.width);
      setHeight(data.height);
      setDrawingName(name);
      alert(`Desenho '${name}' carregado com sucesso!`);
    } catch (error) {
      console.error("Erro ao carregar desenho:", error);
    }
  };

  const handleNewCanvas = () => {
    const isConfirmed = window.confirm("Certeza que quer criar um novo canvas? Seu desenho atual será perdido.");
    if (isConfirmed) {
      setLayers([]);
      addLayer();
    }
  };

  const onUpdateLayers = (updateCallback) => {
    setLayers(updateCallback);
  };

  return (
    <div className="app-container">
      <h1>Simple Pixel Art Editor</h1>
      
      <div className="controls">
        <div className="color-picker-container">
          <label htmlFor="color-picker">Cor:</label>
          <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} />
        </div>
        <div className="palette-container">
          {COLOR_PALETTE.map((color, index) => (
            <button key={index} className="palette-color" style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />
          ))}
        </div>
        <div className="tool-selector">
          <button className={tool === "pencil" ? "tool-button active" : "tool-button"} onClick={() => setTool("pencil")}>Lápis</button>
          <button className={tool === "eraser" ? "tool-button active" : "tool-button"} onClick={() => setTool("eraser")}>Borracha</button>
          <button className={tool === "fill" ? "tool-button active" : "tool-button"} onClick={() => setTool("fill")}>Balde</button>
        </div>
        <div className="size-controls">
          <label>Largura: <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min="1" max="64" /></label>
          <label>Altura: <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min="1" max="64" /></label>
          <button onClick={handleNewCanvas}>Novo</button>
        </div>
        <div className="zoom-control">
          <label>Zoom: {pixelSize}x</label>
          <input type="range" min="10" max="50" value={pixelSize} onChange={(e) => setPixelSize(Number(e.target.value))} />
        </div>
        <div className="save-load-controls">
          <input type="text" value={drawingName} onChange={(e) => setDrawingName(e.target.value)} placeholder="Nome do Desenho" />
          <button onClick={handleSave}>Salvar</button>
        </div>
      </div>

      <Canvas 
        ref={canvasRef}
        width={width}
        height={height}
        pixelSize={pixelSize}
        selectedColor={selectedColor}
        layers={layers}
        onUpdateLayers={onUpdateLayers}
        activeLayerId={activeLayerId}
        tool={tool}
      />
      
      <div className="layers-panel">
        <h2>Camadas</h2>
        <button onClick={addLayer}>Adicionar Camada</button>
        <ul>
          {layers.map(layer => (
            <li key={layer.id} className={layer.id === activeLayerId ? 'active' : ''}>
              <span onClick={() => setActiveLayerId(layer.id)}>{layer.name}</span>
              <button onClick={() => toggleLayerVisibility(layer.id)}>
                {layer.isVisible ? 'Ocultar' : 'Mostrar'}
              </button>
              <button onClick={() => removeLayer(layer.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="saved-drawings-section">
        <h2>Desenhos Salvos</h2>
        <ul>
          {savedDrawings.length === 0 ? <p>Nenhum desenho salvo ainda.</p> :
            savedDrawings.map((name) => (
              <li key={name}><span>{name}</span><button onClick={() => handleLoadDrawing(name)}>Carregar</button></li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default App;