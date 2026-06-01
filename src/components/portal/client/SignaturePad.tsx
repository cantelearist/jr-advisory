'use client';

/* ── SignaturePad — canvas-based signature drawing component ── */

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
  onSignatureChange?: (hasSignature: boolean) => void;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  function SignaturePad({ width = 560, height = 200, onSignatureChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    /* Expose methods to parent */
    useImperativeHandle(ref, () => ({
      clear() {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setHasContent(false);
          onSignatureChange?.(false);
        }
      },
      isEmpty() { return !hasContent; },
      toDataURL() { return canvasRef.current?.toDataURL('image/png') || ''; },
    }), [hasContent, onSignatureChange]);

    /* Canvas setup */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Scale for retina
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#c9a96e';
        ctx.lineWidth = 2;
      }
    }, [width, height]);

    const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        const touch = e.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    }, []);

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      lastPoint.current = getPoint(e);
    }, [getPoint]);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || !lastPoint.current) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      const point = getPoint(e);
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      lastPoint.current = point;
      if (!hasContent) {
        setHasContent(true);
        onSignatureChange?.(true);
      }
    }, [isDrawing, getPoint, hasContent, onSignatureChange]);

    const endDrawing = useCallback(() => {
      setIsDrawing(false);
      lastPoint.current = null;
    }, []);

    return (
      <div className="sig-pad">
        <canvas
          ref={canvasRef}
          className="sig-pad__canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <div className="sig-pad__line" />
        {!hasContent && (
          <span className="sig-pad__placeholder">Sign here</span>
        )}
      </div>
    );
  }
);

export default SignaturePad;
