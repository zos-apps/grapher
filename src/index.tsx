import React, { useState, useEffect, useRef, useCallback } from 'react';

interface GrapherProps {
  onClose: () => void;
}

interface Equation {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
}

const COLORS = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#9c27b0', '#ff6d00'];

const Grapher: React.FC<GrapherProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [equations, setEquations] = useState<Equation[]>([
    { id: '1', expression: 'Math.sin(x)', color: COLORS[0], visible: true },
  ]);
  const [newEquation, setNewEquation] = useState('');
  const [scale, setScale] = useState(50);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const safeEval = useCallback((expr: string, x: number): number | null => {
    try {
      const fn = new Function('x', 'Math', `return ${expr}`);
      const result = fn(x, Math);
      return isFinite(result) ? result : null;
    } catch {
      return null;
    }
  }, []);

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2 + offset.x;
    const centerY = h / 2 + offset.y;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    for (let x = centerX % scale; x < w; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = centerY % scale; y < h; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, h);
    ctx.stroke();

    equations.filter(eq => eq.visible).forEach(eq => {
      ctx.strokeStyle = eq.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let started = false;
      for (let px = 0; px < w; px++) {
        const x = (px - centerX) / scale;
        const y = safeEval(eq.expression, x);

        if (y !== null) {
          const py = centerY - y * scale;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
    });
  }, [equations, scale, offset, safeEval]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawGraph();
    }
  }, [drawGraph]);

  const addEquation = () => {
    if (!newEquation.trim()) return;
    setEquations(prev => [...prev, {
      id: Date.now().toString(),
      expression: newEquation,
      color: COLORS[prev.length % COLORS.length],
      visible: true,
    }]);
    setNewEquation('');
  };

  const toggleEquation = (id: string) => {
    setEquations(prev => prev.map(eq =>
      eq.id === id ? { ...eq, visible: !eq.visible } : eq
    ));
  };

  const removeEquation = (id: string) => {
    setEquations(prev => prev.filter(eq => eq.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e] text-white">
      <div className="p-3 border-b border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={newEquation}
            onChange={e => setNewEquation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEquation()}
            placeholder="y = Math.sin(x)"
            className="flex-1 px-3 py-2 bg-white/10 rounded text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={addEquation}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {equations.map(eq => (
            <div
              key={eq.id}
              className={`flex items-center gap-2 px-2 py-1 rounded text-xs shrink-0
                ${eq.visible ? 'bg-white/10' : 'bg-white/5 opacity-50'}
              `}
            >
              <div
                className="w-3 h-3 rounded-full cursor-pointer"
                style={{ backgroundColor: eq.color }}
                onClick={() => toggleEquation(eq.id)}
              />
              <span className="font-mono">{eq.expression}</span>
              <button
                onClick={() => removeEquation(eq.id)}
                className="text-white/40 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={() => setScale(s => Math.max(10, s - 10))}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center"
          >
            −
          </button>
          <button
            onClick={() => setScale(s => s + 10)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default Grapher;
