import React, { useEffect, useRef } from 'react';

// Refined particle canvas: particles stay firmly inside the viewport,
// gently react and dance around the cursor, and adjust luminosity in light and dark mode.
export const FloatingDotsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: -2000,
      y: -2000,
      radius: 180, // Noticeable interaction zone
      active: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -2000;
      mouse.y = -2000;
      mouse.active = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Vibrant particle colors
    const dotColors = [
      'rgba(20, 184, 166, 0.85)', // teal
      'rgba(168, 85, 247, 0.8)',  // purple
      'rgba(56, 189, 248, 0.85)', // sky
      'rgba(244, 114, 182, 0.8)', // pink
      'rgba(52, 211, 153, 0.85)', // emerald
    ];

    interface Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      angle: number;
      orbitSpeed: number;
      orbitRadius: number;
    }

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 14000), 80);
      const padding = 30; // Keep safely inside edges

      for (let i = 0; i < count; i++) {
        const size = Math.random() * 2.2 + 1.8;
        const x = padding + Math.random() * (width - padding * 2);
        const y = padding + Math.random() * (height - padding * 2);
        const color = dotColors[Math.floor(Math.random() * dotColors.length)];

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          color,
          alpha: Math.random() * 0.35 + 0.55,
          angle: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() - 0.5) * 0.015,
          orbitRadius: Math.random() * 20 + 8,
        });
      }
    };

    initParticles();

    // Render loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains('dark');

      // Subtle cursor spotlight aura
      if (mouse.active) {
        const radial = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        radial.addColorStop(
          0,
          isDark ? 'rgba(45, 212, 191, 0.22)' : 'rgba(13, 148, 136, 0.16)'
        );
        radial.addColorStop(
          0.4,
          isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.08)'
        );
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const padding = 20; // Absolute safety barrier from screen border

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Natural gentle orbital movement around its base position
        p.angle += p.orbitSpeed;
        const targetX = p.baseX + Math.cos(p.angle) * p.orbitRadius;
        const targetY = p.baseY + Math.sin(p.angle) * p.orbitRadius;

        // Base floating drift
        p.baseX += p.vx;
        p.baseY += p.vy;

        // Bounce base position off screen margins
        if (p.baseX < padding) {
          p.baseX = padding;
          p.vx = Math.abs(p.vx);
        } else if (p.baseX > width - padding) {
          p.baseX = width - padding;
          p.vx = -Math.abs(p.vx);
        }

        if (p.baseY < padding) {
          p.baseY = padding;
          p.vy = Math.abs(p.vy);
        } else if (p.baseY > height - padding) {
          p.baseY = height - padding;
          p.vy = -Math.abs(p.vy);
        }

        // 2. Cursor hover interaction
        let offsetX = 0;
        let offsetY = 0;
        let isHovered = false;
        let hoverRatio = 0;

        if (mouse.active) {
          const dx = targetX - mouse.x;
          const dy = targetY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            isHovered = true;
            hoverRatio = (mouse.radius - dist) / mouse.radius;
            const maxPush = 30 * hoverRatio;
            offsetX = (dx / dist) * maxPush;
            offsetY = (dy / dist) * maxPush;
          }
        }

        // 3. Set particle position with spring-like smooth interpolation
        p.x += (targetX + offsetX - p.x) * 0.15;
        p.y += (targetY + offsetY - p.y) * 0.15;

        // Clamp strictly within the viewport boundaries
        p.x = Math.max(padding, Math.min(width - padding, p.x));
        p.y = Math.max(padding, Math.min(height - padding, p.y));

        // 4. Draw particle dot
        const currentSize = p.size * (1 + hoverRatio * 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // 5. Connect line to mouse when within range
        if (isHovered) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = isDark
            ? `rgba(45, 212, 191, ${hoverRatio * 0.45})`
            : `rgba(13, 148, 136, ${hoverRatio * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // 6. Connect line between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distBetween = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (distBetween < 115) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - distBetween / 115) * (isDark ? 0.25 : 0.18);
            ctx.strokeStyle = isDark
              ? `rgba(129, 140, 248, ${lineAlpha})`
              : `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-85 dark:opacity-90"
    />
  );
};
