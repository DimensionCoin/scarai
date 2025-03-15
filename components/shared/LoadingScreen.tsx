"use client";

import { useEffect, useRef } from "react";

export default function LoadingScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);

    // Neural network nodes
    class Node {
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
      connections: Node[];
      speed: number;
      directionX: number;
      directionY: number;
      directionZ: number;
      pulsePhase: number;
      pulseSpeed: number;

      constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = Math.random() * 2 + 1;
        this.color = `rgba(20, 217, 196, ${0.3 + Math.random() * 0.7})`;
        this.connections = [];
        this.speed = 0.2 + Math.random() * 0.3;
        this.directionX = Math.random() * 2 - 1;
        this.directionY = Math.random() * 2 - 1;
        this.directionZ = Math.random() * 2 - 1;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.03;
      }

      update(width: number, height: number) {
        // Move in 3D space
        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;
        this.z += this.directionZ * this.speed;

        // Bounce off boundaries
        if (this.x < 0 || this.x > width) this.directionX *= -1;
        if (this.y < 0 || this.y > height) this.directionY *= -1;
        if (this.z < -500 || this.z > 500) this.directionZ *= -1;

        // Update pulse phase
        this.pulsePhase += this.pulseSpeed;
        if (this.pulsePhase > Math.PI * 2) this.pulsePhase = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Calculate perspective scale based on z-position
        const scale = 1500 / (1500 + this.z);
        const x = this.x * scale;
        const y = this.y * scale;
        const radius = this.radius * scale;

        // Pulse effect
        const pulseScale = 0.5 + Math.sin(this.pulsePhase) * 0.5;

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, radius * (1 + pulseScale), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 15 * pulseScale;
        ctx.shadowColor = "rgba(20, 217, 196, 0.7)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      drawConnections(ctx: CanvasRenderingContext2D) {
        this.connections.forEach((node) => {
          // Calculate perspective for both nodes
          const scale1 = 1500 / (1500 + this.z);
          const scale2 = 1500 / (1500 + node.z);

          const x1 = this.x * scale1;
          const y1 = this.y * scale1;
          const x2 = node.x * scale2;
          const y2 = node.y * scale2;

          // Calculate distance for opacity
          const dx = x2 - x1;
          const dy = y2 - y1;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            // Pulse effect along the connection
            const pulsePos = (Date.now() % 2000) / 2000;

            // Draw connection
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            // Gradient for connection
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, "rgba(20, 217, 196, 0.1)");
            gradient.addColorStop(pulsePos, "rgba(116, 235, 213, 0.8)");
            gradient.addColorStop(1, "rgba(20, 217, 196, 0.1)");

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5 * Math.min(scale1, scale2);
            ctx.stroke();
          }
        });
      }
    }

    // Create nodes
    const nodeCount = Math.min(80, Math.floor(window.innerWidth / 20));
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const z = Math.random() * 1000 - 500;
      nodes.push(new Node(x, y, z));
    }

    // Connect nodes
    nodes.forEach((node) => {
      const connectionCount = 2 + Math.floor(Math.random() * 3);
      const otherNodes = [...nodes].sort(() => Math.random() - 0.5);

      for (let i = 0; i < connectionCount; i++) {
        if (otherNodes[i] !== node) {
          node.connections.push(otherNodes[i]);
        }
      }
    });

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw connections first (behind nodes)
      nodes.forEach((node) => {
        node.update(canvas.width, canvas.height);
      });

      // Sort nodes by z-index for proper 3D rendering
      const sortedNodes = [...nodes].sort((a, b) => b.z - a.z);

      // Draw connections
      sortedNodes.forEach((node) => {
        node.drawConnections(ctx);
      });

      // Draw nodes
      sortedNodes.forEach((node) => {
        node.draw(ctx);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 overflow-hidden">
      {/* Neural network canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Overlay with loading text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Futuristic logo/spinner */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-70 blur-md animate-pulse"></div>
          <div className="relative h-16 w-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-teal-400/30 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-cyan-400 animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-l-indigo-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 animate-pulse"></div>
          </div>
        </div>

        {/* Loading text with glitch effect */}
        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-500 animate-pulse">
            INITIALIZING
          </h2>

          {/* Animated dots */}
          <div className="flex justify-center mt-2 space-x-1">
            <div className="h-2 w-2 rounded-full bg-teal-400 animate-[bounce_1s_infinite_0ms]"></div>
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-[bounce_1s_infinite_200ms]"></div>
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_400ms]"></div>
          </div>
        </div>

        {/* Status text */}
        <p className="mt-4 text-zinc-400 text-sm md:text-base font-mono">
          Establishing SCAR connections
        </p>
      </div>
    </div>
  );
}
