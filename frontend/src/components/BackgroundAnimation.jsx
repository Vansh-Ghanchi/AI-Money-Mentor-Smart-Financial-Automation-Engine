import React, { useEffect, useRef } from 'react';

const BackgroundAnimation = () => {
    const canvasRef = useRef(null);
    // Track mouse separately to avoid re-renders or closure staleness in loop
    const mouse = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, speedX: 0, speedY: 0, active: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', resize);
        resize();

        let lastEmitTime = 0;

        const handleMouseMove = (e) => {
            updateInteraction(e.clientX, e.clientY);
        };
        
        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                updateInteraction(touch.clientX, touch.clientY);
            }
        };

        const handleTouchStart = (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                mouse.current.x = touch.clientX;
                mouse.current.y = touch.clientY;
                mouse.current.lastX = touch.clientX;
                mouse.current.lastY = touch.clientY;
                mouse.current.active = true;
            }
        };

        const updateInteraction = (clientX, clientY) => {
            const now = Date.now();
            const dx = clientX - mouse.current.lastX;
            const dy = clientY - mouse.current.lastY;
            
            mouse.current.x = clientX;
            mouse.current.y = clientY;
            mouse.current.speedX = dx;
            mouse.current.speedY = dy;
            mouse.current.lastX = clientX;
            mouse.current.lastY = clientY;
            mouse.current.active = true;

            const speed = Math.sqrt(dx*dx + dy*dy);
            // Optimization: Throttle emissions and check speed
            if (speed > 4 && now - lastEmitTime > 40) {
                lastEmitTime = now;
                
                // Limit max particles to prevent lag on low-end devices
                if (emitParticles.length < 30) {
                     emitParticles.push(new EmitParticle(
                        clientX, 
                        clientY, 
                        dx * 0.15, // Slightly higher velocity factor for 'air' feel
                        dy * 0.15
                    ));
                }
            }
        };
        
        const handleInteractionEnd = () => { mouse.current.active = false; };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleInteractionEnd);
        
        // Touch events
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleInteractionEnd);

        // Assets
        const symbols = ['$', '₹', '€', '%', '📈', '🪙', '💳', '💰'];

        // --- CLASSES ---

        // 1. Existing Background Particle
        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.z = Math.random() * 2 + 0.5;
                this.size = Math.random() * 20 + 10;
                this.text = symbols[Math.floor(Math.random() * symbols.length)];
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.3 + 0.1;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            }

            update() {
                this.x += this.speedX * this.z;
                this.y += this.speedY * this.z;
                this.rotation += this.rotationSpeed;

                if (this.x > width + 50) this.x = -50;
                if (this.x < -50) this.x = width + 50;
                if (this.y > height + 50) this.y = -50;
                if (this.y < -50) this.y = height + 50;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.opacity;
                ctx.font = `${this.size * this.z}px Arial`;
                ctx.fillStyle = '#60a5fa'; // Blue-400
                ctx.fillText(this.text, -this.size / 2, -this.size / 2);
                ctx.restore();
            }
        }

        // 2. Cursor Emitted Particle
        class EmitParticle {
            constructor(x, y, vx, vy) {
                this.x = x;
                this.y = y;
                // Add randomness to spread
                this.vx = vx + (Math.random() - 0.5) * 2;
                this.vy = vy + (Math.random() - 0.5) * 2;
                this.life = 1.0;
                this.decay = Math.random() * 0.03 + 0.02; // Faster decay (0.02-0.05 per frame) -> shorter life
                this.size = Math.random() * 10 + 8; // Slightly smaller for crisper look
                this.text = symbols[Math.floor(Math.random() * symbols.length)];
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.95; // Drag/friction
                this.vy *= 0.95;
                this.rotation += this.rotationSpeed;
                this.life -= this.decay;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.life * 0.6; // Slightly transparent
                ctx.font = `${this.size}px Arial`;
                // Use a slightly lighter/brighter color for cursor trails
                ctx.fillStyle = '#93c5fd'; // Blue-300
                ctx.fillText(this.text, -this.size / 2, -this.size / 2);
                ctx.restore();
            }
        }

        // 3. Network Nodes
        class Node {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.baseVx = this.vx;
                this.baseVy = this.vy;
            }
            update() {
                // Gentle influence from cursor if close
                const dx = this.x - mouse.current.x;
                const dy = this.y - mouse.current.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 200 && mouse.current.active) {
                    // Push away or pull based on desired effect - let's do a gentle 'turbulence'
                    // actually user wants flow direction: "left to right cursor -> left to right elements"
                    // So add mouse velocity to node velocity temporarily
                    if (Math.abs(mouse.current.speedX) > 1 || Math.abs(mouse.current.speedY) > 1) {
                         this.vx += mouse.current.speedX * 0.005;
                         this.vy += mouse.current.speedY * 0.005;
                    }
                }
                
                // Return to base speed (friction)
                this.vx = this.vx * 0.98 + this.baseVx * 0.02;
                this.vy = this.vy * 0.98 + this.baseVy * 0.02;

                this.x += this.vx;
                this.y += this.vy;

                if(this.x < 0 || this.x > width) { this.vx *= -1; this.baseVx *= -1; }
                if(this.y < 0 || this.y > height) { this.vy *= -1; this.baseVy *= -1; }
            }
        }

        // Initialize
        const particles = Array.from({ length: 30 }, () => new Particle());
        const nodes = Array.from({ length: 20 }, () => new Node());
        const emitParticles = []; // Dynamic array

        const render = () => {
             // Clean Screen
             const gradient = ctx.createLinearGradient(0, 0, 0, height);
             gradient.addColorStop(0, '#0f172a'); 
             gradient.addColorStop(1, '#1e293b'); 
             ctx.fillStyle = gradient;
             ctx.fillRect(0, 0, width, height);
 
             // Grid
             ctx.strokeStyle = '#334155';
             ctx.lineWidth = 0.5;
             ctx.beginPath();
             const gridSize = 50;
             for (let i = 0; i < width; i += gridSize) {
                 ctx.moveTo(i, 0); ctx.lineTo(i, height);
             }
             for (let i = 0; i < height; i += gridSize) {
                 ctx.moveTo(0, i); ctx.lineTo(width, i);
             }
             ctx.globalAlpha = 0.1;
             ctx.stroke();
             ctx.globalAlpha = 1;

            // Update & Draw Background Nodes
            nodes.forEach(node => node.update());
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            for(let i=0; i<nodes.length; i++) {
                for(let j=i+1; j<nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.globalAlpha = 1 - (dist / 150);
                        ctx.stroke();
                    }
                }
                ctx.beginPath();
                ctx.arc(nodes[i].x, nodes[i].y, 3, 0, Math.PI*2);
                ctx.fillStyle = '#60a5fa';
                ctx.globalAlpha = 0.8;
                ctx.fill();
            }

            // Update & Draw Background Particles
            particles.forEach(p => { p.update(); p.draw(); });

            // Update & Draw Cursor Emitted Particles
            for (let i = emitParticles.length - 1; i >= 0; i--) {
                const p = emitParticles[i];
                p.update();
                p.draw();
                if (p.life <= 0) {
                    emitParticles.splice(i, 1);
                }
            }

            // Optional: Draw cursor glow
            if (mouse.current.active) {
                const radial = ctx.createRadialGradient(mouse.current.x, mouse.current.y, 0, mouse.current.x, mouse.current.y, 150);
                radial.addColorStop(0, 'rgba(96, 165, 250, 0.2)');
                radial.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = radial;
                ctx.fillRect(0, 0, width, height);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleInteractionEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleInteractionEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full -z-10 bg-slate-900"
            style={{ pointerEvents: 'none' }} 
        />
    );
};

export default BackgroundAnimation;
