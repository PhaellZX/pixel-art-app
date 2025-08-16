// frontend/src/Canvas.js
import React, { useState, useEffect, useImperativeHandle } from 'react';
import './Canvas.css';

const Canvas = React.forwardRef(({ width, height, pixelSize, selectedColor, initialDrawingData, tool }, ref) => {
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false); // Linha adicionada para corrigir o erro
  
  const pixels = history[historyIndex];

  useEffect(() => {
    let initialPixels = [];
    if (initialDrawingData && initialDrawingData.pixels) {
      initialPixels = initialDrawingData.pixels;
    } else {
      initialPixels = Array(width * height).fill("#FFFFFF");
    }
    setHistory([initialPixels]);
    setHistoryIndex(0);
  }, [width, height, initialDrawingData]);

  const addToHistory = (newPixels) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPixels);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  useImperativeHandle(ref, () => ({
    getDrawingData: () => ({
      width: width,
      height: height,
      pixels: pixels,
    }),
    undo: undo,
    redo: redo,
  }));

  const handlePixelClick = (index) => {
    const newPixels = [...pixels];
    
    if (tool === "fill") {
      const targetColor = pixels[index];
      if (targetColor === selectedColor) return;
      
      const stack = [index];
      const visited = new Set();

      while (stack.length > 0) {
        const currentIndex = stack.pop();
        
        if (visited.has(currentIndex)) continue;
        visited.add(currentIndex);

        if (newPixels[currentIndex] === targetColor) {
          newPixels[currentIndex] = selectedColor;

          const row = Math.floor(currentIndex / width);
          const col = currentIndex % width;

          if (row > 0 && !visited.has(currentIndex - width)) stack.push(currentIndex - width);
          if (row < height - 1 && !visited.has(currentIndex + width)) stack.push(currentIndex + width);
          if (col > 0 && !visited.has(currentIndex - 1)) stack.push(currentIndex - 1);
          if (col < width - 1 && !visited.has(currentIndex + 1)) stack.push(currentIndex + 1);
        }
      }
      addToHistory(newPixels);
    } else {
      const colorToPaint = tool === "eraser" ? "#FFFFFF" : selectedColor;
      newPixels[index] = colorToPaint;
      addToHistory(newPixels);
    }
  };

  const handleMouseDown = (index) => {
    if (tool !== "fill") {
      const newPixels = [...pixels];
      const colorToPaint = tool === "eraser" ? "#FFFFFF" : selectedColor;
      newPixels[index] = colorToPaint;
      addToHistory(newPixels);
      setIsDrawing(true);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseMove = (index) => {
    if (isDrawing && tool !== "fill") {
      const newPixels = [...pixels];
      const colorToPaint = tool === "eraser" ? "#FFFFFF" : selectedColor;
      newPixels[index] = colorToPaint;
      addToHistory(newPixels);
    }
  };

  return (
    <div 
      className="canvas-grid" 
      style={{
        gridTemplateColumns: `repeat(${width}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${height}, ${pixelSize}px)`,
        width: width * pixelSize,
        height: height * pixelSize,
        cursor: tool === "fill" ? "crosshair" : "default"
      }}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      {pixels.map((color, index) => (
        <div 
          key={index} 
          className="pixel"
          style={{ backgroundColor: color }}
          onMouseDown={() => handleMouseDown(index)}
          onMouseMove={() => handleMouseMove(index)}
          onClick={() => handlePixelClick(index)}
        />
      ))}
    </div>
  );
});

export default Canvas;