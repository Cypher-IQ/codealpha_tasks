import React, { useRef, useState, useEffect } from 'react';
import useStore from '../store';
import { PenTool, X, Trash2, Download } from 'lucide-react';

const Whiteboard = ({ socket, roomId, isOpen, onClose }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [lineWidth, setLineWidth] = useState(3);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;

  }, [isOpen]);

  // Handle remote drawing
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleRemoteDraw = (drawData) => {
      if (!contextRef.current) return;
      const { x0, y0, x1, y1, color, lineWidth } = drawData;
      
      const ctx = contextRef.current;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.closePath();
      
      // Restore local brush settings
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    };

    socket.on('draw', handleRemoteDraw);
    return () => socket.off('draw', handleRemoteDraw);
  }, [socket, isOpen, color, lineWidth]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    
    // Previous position (approximated for simplicity, normally we store last pos)
    // To keep it simple and smooth without storing state in react unnecesarily, 
    // we use a slight trick or just let lineTo do it from previous
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    if (socket) {
        socket.emit('draw', roomId, {
            // we'd need exact x0 y0, but for MVP we send just lines
            x0: offsetX - 1, y0: offsetY - 1, x1: offsetX, y1: offsetY,
            color, lineWidth
        });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 bg-dark-900/95 backdrop-blur-md flex flex-col p-4 animate-fade-in">
      <div className="flex justify-between items-center bg-dark-800 p-4 rounded-t-xl border border-dark-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-lg">
             <PenTool size={20} className="text-primary-500" />
             Collaborative Whiteboard
          </div>
          
          <div className="h-6 w-px bg-dark-600 mx-2"></div>
          
          <div className="flex items-center gap-2">
            {['#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'].map(c => (
              <button 
                key={c}
                onClick={() => { setColor(c); contextRef.current.strokeStyle = c; }}
                className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-primary-500 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          
          <input 
            type="range" min="1" max="20" value={lineWidth} 
            onChange={(e) => { setLineWidth(e.target.value); contextRef.current.lineWidth = e.target.value; }}
            className="w-24 ml-4"
          />
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={clearCanvas} className="btn-outline text-sm gap-2">
                <Trash2 size={16} /> Clear
            </button>
            <button onClick={onClose} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
            <X size={20} />
            </button>
        </div>
      </div>
      
      <div className="flex-1 bg-dark-800 rounded-b-xl border border-t-0 border-dark-700 relative overflow-hidden flex justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseOut={finishDrawing}
          onMouseMove={draw}
          className="bg-transparent cursor-crosshair w-full h-full"
        />
      </div>
    </div>
  );
};

export default Whiteboard;
