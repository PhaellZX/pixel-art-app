// frontend/src/Canvas.js
import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import './Canvas.css';

const Canvas = React.forwardRef(({ width, height, pixelSize, selectedColor, layers, onUpdateLayers, activeLayerId, tool }, ref) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingBuffer = useRef(null);

  useEffect(() => {
    drawingBuffer.current = null;
  }, [activeLayerId]);

  const getCombinedPixels = () => {
    if (!layers || layers.length === 0) {
      return Array(width * height).fill('transparent');
    }

    return layers.reduce((acc, layer) => {
      if (!layer || !layer.pixels || !layer.isVisible) {
        return acc;
      }
      return acc.map((pixel, index) =>
        layer.pixels[index] !== 'transparent' ? layer.pixels[index] : pixel
      );
    }, Array(width * height).fill('transparent'));
  };

  useImperativeHandle(ref, () => ({
    getDrawingData: () => {
      return {
        width: width,
        height: height,
        pixels: getCombinedPixels(),
      };
    },
  }));

  const handlePixelAction = (index) => {
    if (tool === "fill") {
      onUpdateLayers(prevLayers => {
        const newLayers = [...prevLayers];
        const activeLayerIndex = newLayers.findIndex(l => l.id === activeLayerId);
        if (activeLayerIndex === -1) return prevLayers;

        const currentPixels = [...newLayers[activeLayerIndex].pixels];
        const targetColor = currentPixels[index];

        if (targetColor === selectedColor || targetColor === 'transparent') return prevLayers;
        
        const stack = [index];
        const visited = new Set();
        while (stack.length > 0) {
          const currentIndex = stack.pop();
          if (visited.has(currentIndex)) continue;
          visited.add(currentIndex);

          if (currentPixels[currentIndex] === targetColor) {
            currentPixels[currentIndex] = selectedColor;
            const row = Math.floor(currentIndex / width);
            const col = currentIndex % width;
            if (row > 0 && !visited.has(currentIndex - width)) stack.push(currentIndex - width);
            if (row < height - 1 && !visited.has(currentIndex + width)) stack.push(currentIndex + width);
            if (col > 0 && !visited.has(currentIndex - 1)) stack.push(currentIndex - 1);
            if (col < width - 1 && !visited.has(currentIndex + 1)) stack.push(currentIndex + 1);
          }
        }
        newLayers[activeLayerIndex].pixels = currentPixels;
        return newLayers;
      });
      return;
    }
    
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || !Array.isArray(activeLayer.pixels)) {
      console.error("A camada ativa ou seus pixels não são válidos.");
      return;
    }

    if (!drawingBuffer.current) {
      drawingBuffer.current = [...activeLayer.pixels];
    }
    
    const colorToPaint = tool === "eraser" ? "transparent" : selectedColor;
    drawingBuffer.current[index] = colorToPaint;
  };

  const handleMouseDown = (index) => {
    if (activeLayerId === null) return;
    setIsDrawing(true);
    handlePixelAction(index);
    // Para cliques, atualiza imediatamente.
    onUpdateLayers(prevLayers => {
        const newLayers = [...prevLayers];
        const activeLayerIndex = newLayers.findIndex(l => l.id === activeLayerId);
        if (activeLayerIndex === -1) return prevLayers;
        newLayers[activeLayerIndex].pixels = drawingBuffer.current;
        return newLayers;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    drawingBuffer.current = null;
  };

  const handleMouseMove = (index) => {
    if (isDrawing && tool !== "fill") {
      handlePixelAction(index);
      onUpdateLayers(prevLayers => {
        const newLayers = [...prevLayers];
        const activeLayerIndex = newLayers.findIndex(l => l.id === activeLayerId);
        if (activeLayerIndex === -1) return prevLayers;
        newLayers[activeLayerIndex].pixels = drawingBuffer.current;
        return newLayers;
      });
    }
  };

  const combinedPixels = getCombinedPixels();

  return (
    <div 
      className="canvas-grid" 
      style={{
        gridTemplateColumns: `repeat(${width}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${height}, ${pixelSize}px)`,
        width: width * pixelSize,
        height: height * pixelSize,
        cursor: tool === "fill" ? "crosshair" : "default",
      }}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      {combinedPixels.map((color, index) => (
        <div 
          key={index} 
          className="pixel"
          style={{ backgroundColor: color }}
          onMouseDown={() => handleMouseDown(index)}
          onMouseMove={() => handleMouseMove(index)}
          onClick={() => tool === "fill" && handlePixelAction(index)}
        />
      ))}
    </div>
  );
});

export default Canvas;