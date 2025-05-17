import { CONFIG } from '../data/config.js';

export class Player {
    constructor(ctx) {
        this.ctx = ctx;
        this.width = CONFIG.PLAYER.WIDTH * 1.2;
        this.height = CONFIG.PLAYER.HEIGHT * 1.2;
        this.x = CONFIG.PLAYER.START_X;
        this.y = CONFIG.CANVAS.HEIGHT / 2;  // Start in middle of screen
        this.targetX = this.x;
        this.targetY = this.y;
        this.speed = CONFIG.PLAYER.MOVE_SPEED;
        this.animationFrame = 0;
        this.animationCounter = 0;
        this.facingRight = true;  // Track direction player is facing
        this.currentOutfit = 'running'; // Default outfit
        this.trail = [];
        this.maxTrailLength = 30;

        // Image assets for outfits
        this.images = {
            running: null,
            swimming: null,
            cycling: null
        };
        this.imagesLoaded = {
            running: false,
            swimming: false,
            cycling: false
        };
        // Load images for all outfits
        this.loadOutfitImage('running', 'img/running.png');
        this.loadOutfitImage('swimming', 'img/swimming.png');
        this.loadOutfitImage('cycling', 'img/cycling.png');
    }
    
    loadOutfitImage(outfit, src) {
        const img = new window.Image();
        img.onload = () => {
            this.imagesLoaded[outfit] = true;
        };
        img.onerror = () => {
            this.imagesLoaded[outfit] = false;
        };
        img.src = src;
        this.images[outfit] = img;
    }
    
    setOutfit(outfit) {
        this.currentOutfit = outfit;
    }
    
    update(mouseX, mouseY, environment = 'running') {
        // Calculate direction to target (mouse position)
        const dx = mouseX - (this.x + this.width / 2);
        const dy = mouseY - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Update facing direction
        this.facingRight = dx > 0;
        
        // Move towards mouse if not too close
        if (distance > 5) {
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            
            this.x += moveX;
            this.y += moveY;
            
            // Animation timing
            this.animationCounter++;
            if (this.animationCounter > 5) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationCounter = 0;
            }
        }
        
        // Keep player within bounds
        this.x = Math.max(0, Math.min(this.x, CONFIG.CANVAS.WIDTH - this.width));
        this.y = Math.max(0, Math.min(this.y, CONFIG.CANVAS.HEIGHT - this.height));

        // Add to trail
        this.trail.push({
            x: this.x + this.width / 2,
            y: this.y + this.height * 0.9, // near feet
            env: this.currentOutfit,
            time: performance.now()
        });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    draw(isStunned = false, environment = 'running') {
        this.ctx.save();  // Save current context state
        
        // Draw trail first
        this.drawTrail(environment);
        
        // Draw stun effect if player is stunned
        if (isStunned) {
            const pulseIntensity = Math.sin(performance.now() * 0.005) * 0.5 + 0.5;
            const glowSize = Math.max(50, this.width * 1.0);
            
            const gradient = this.ctx.createRadialGradient(
                this.x + this.width/2, this.y + this.height/2, 0,
                this.x + this.width/2, this.y + this.height/2, glowSize + (pulseIntensity * 25)
            );
            
            gradient.addColorStop(0, `rgba(255, 0, 0, ${0.8 * pulseIntensity})`);
            gradient.addColorStop(0.6, `rgba(255, 0, 0, ${0.3 * pulseIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                this.x - glowSize, 
                this.y - glowSize, 
                this.width + (glowSize * 2), 
                this.height + (glowSize * 2)
            );
            
            // Draw stun symbols
            this.ctx.font = '24px Arial';
            const symbols = ['💫', '⭐', '✨'];
            const radius = this.height * 1.2;
            const time = performance.now() * 0.002;
            
            for (let i = 0; i < 3; i++) {
                const angle = time + (i * ((Math.PI * 2) / 3));
                const x = this.x + (this.width / 2) + Math.cos(angle) * radius;
                const y = this.y - 10 + Math.sin(angle) * (radius * 0.5);
                
                this.ctx.fillText(
                    symbols[i],
                    x - 12,
                    y + Math.sin(time * 2 + i) * 5
                );
            }
        }
        
        // If facing left, flip the context
        if (!this.facingRight) {
            this.ctx.scale(-1, 1);
            this.ctx.translate(-this.x * 2 - this.width, 0);
        }
        
        // Draw the appropriate outfit
        let usedImage = false;
        switch (this.currentOutfit) {
            case 'running':
                usedImage = this.drawRunningOutfit();
                break;
            case 'swimming':
                usedImage = this.drawSwimmingOutfit();
                break;
            case 'cycling':
                usedImage = this.drawCyclingOutfit();
                break;
        }
        
        // Draw head and face (common for all outfits), unless an image was used
        if (!(usedImage)) {
            this.drawHead();
        }
        
        this.ctx.restore();  // Restore context state
    }

    drawHead() {
        // Head
        this.ctx.fillStyle = '#FFE4C4'; // Skin tone
        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.2, this.width * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw curly white-gray hair
        this.ctx.fillStyle = '#E8E8E8';
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const curlX = this.x + this.width * 0.5 + Math.cos(angle) * this.width * 0.25;
            const curlY = this.y + this.height * 0.2 + Math.sin(angle) * this.width * 0.25;
            
            this.ctx.beginPath();
            this.ctx.arc(curlX, curlY, this.width * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw face
        this.ctx.fillStyle = '#000000';
        // Eyes
        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width * 0.4, this.y + this.height * 0.18, this.width * 0.02, 0, Math.PI * 2);
        this.ctx.arc(this.x + this.width * 0.6, this.y + this.height * 0.18, this.width * 0.02, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Smile
        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.22, this.width * 0.05, 0, Math.PI);
        this.ctx.stroke();
    }

    drawRunningOutfit() {
        if (this.imagesLoaded.running && this.images.running) {
            const img = this.images.running;
            const aspect = img.width / img.height;
            let drawWidth = this.width;
            let drawHeight = this.height;
            if (aspect > this.width / this.height) {
                drawWidth = this.width;
                drawHeight = this.width / aspect;
            } else {
                drawHeight = this.height;
                drawWidth = this.height * aspect;
            }
            const drawX = this.x + (this.width - drawWidth) / 2;
            const drawY = this.y + (this.height - drawHeight) / 2;
            this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            return true;
        } else {
            // Fallback: programmatic drawing
            // Draw body
            this.ctx.fillStyle = '#FF69B4'; // Pink shirt
            this.ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.3, this.width * 0.6, this.height * 0.4);
            // Draw shorts
            this.ctx.fillStyle = '#4169E1'; // Royal blue shorts
            this.ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.7, this.width * 0.4, this.height * 0.3);
            // Draw running shoes
            this.ctx.fillStyle = '#FF4500'; // Orange-red shoes
            this.ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.9, this.width * 0.2, this.height * 0.1);
            this.ctx.fillRect(this.x + this.width * 0.6, this.y + this.height * 0.9, this.width * 0.2, this.height * 0.1);
            // Draw flower pattern on shirt
            this.drawFlowerPattern(this.x + this.width * 0.2, this.y + this.height * 0.3, this.width * 0.6, this.height * 0.4);
            // Draw headband
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.fillRect(this.x + this.width * 0.1, this.y + this.height * 0.1, this.width * 0.8, this.height * 0.05);
            // Draw wristbands
            this.ctx.fillStyle = '#4169E1';
            this.ctx.fillRect(this.x + this.width * 0.15, this.y + this.height * 0.4, this.width * 0.1, this.height * 0.05);
            this.ctx.fillRect(this.x + this.width * 0.75, this.y + this.height * 0.4, this.width * 0.1, this.height * 0.05);
            return false;
        }
    }

    drawSwimmingOutfit() {
        if (this.imagesLoaded.swimming && this.images.swimming) {
            const img = this.images.swimming;
            const aspect = img.width / img.height;
            let drawWidth = this.width;
            let drawHeight = this.height;
            if (aspect > this.width / this.height) {
                drawWidth = this.width;
                drawHeight = this.width / aspect;
            } else {
                drawHeight = this.height;
                drawWidth = this.height * aspect;
            }
            const drawX = this.x + (this.width - drawWidth) / 2;
            const drawY = this.y + (this.height - drawHeight) / 2;
            this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            return true;
        } else {
            // Fallback: programmatic drawing
            // Draw swimming suit
            this.ctx.fillStyle = '#FF69B4'; // Pink swimming suit
            this.ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.3, this.width * 0.6, this.height * 0.6);
            
            // Draw swimming cap
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.beginPath();
            this.ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.15, this.width * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw goggles
            this.ctx.fillStyle = '#1E90FF';
            this.ctx.beginPath();
            this.ctx.arc(this.x + this.width * 0.4, this.y + this.height * 0.2, this.width * 0.1, 0, Math.PI * 2);
            this.ctx.arc(this.x + this.width * 0.6, this.y + this.height * 0.2, this.width * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw flower pattern on swimming suit
            this.drawFlowerPattern(this.x + this.width * 0.2, this.y + this.height * 0.3, this.width * 0.6, this.height * 0.6);
            
            // Draw water splashes
            this.drawWaterSplashes();
            return false;
        }
    }

    drawCyclingOutfit() {
        if (this.imagesLoaded.cycling && this.images.cycling) {
            const img = this.images.cycling;
            const aspect = img.width / img.height;
            let drawWidth = this.width;
            let drawHeight = this.height;
            if (aspect > this.width / this.height) {
                drawWidth = this.width;
                drawHeight = this.width / aspect;
            } else {
                drawHeight = this.height;
                drawWidth = this.height * aspect;
            }
            const drawX = this.x + (this.width - drawWidth) / 2;
            const drawY = this.y + (this.height - drawHeight) / 2;
            this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            return true;
        } else {
            // Fallback: programmatic drawing
            // Draw cycling jersey
            this.ctx.fillStyle = '#FF69B4'; // Pink jersey
            this.ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.3, this.width * 0.6, this.height * 0.4);
            
            // Draw cycling shorts
            this.ctx.fillStyle = '#4169E1'; // Royal blue shorts
            this.ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.7, this.width * 0.4, this.height * 0.3);
            
            // Draw helmet
            this.ctx.fillStyle = '#FF4500'; // Orange-red helmet
            this.ctx.beginPath();
            this.ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.15, this.width * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        
            // Draw gloves
            this.ctx.fillStyle = '#4169E1';
            this.ctx.fillRect(this.x + this.width * 0.15, this.y + this.height * 0.4, this.width * 0.1, this.height * 0.05);
            this.ctx.fillRect(this.x + this.width * 0.75, this.y + this.height * 0.4, this.width * 0.1, this.height * 0.05);
            
            // Draw flower pattern on jersey
            this.drawFlowerPattern(this.x + this.width * 0.2, this.y + this.height * 0.3, this.width * 0.6, this.height * 0.4);
            return false;
        }
    }

    drawFlowerPattern(x, y, width, height) {
        const flowerSize = Math.min(width, height) * 0.1;
        const spacing = flowerSize * 2;
        
        for (let i = 0; i < width; i += spacing) {
            for (let j = 0; j < height; j += spacing) {
                // Draw small flower
                this.ctx.fillStyle = '#FFD700'; // Gold center
                this.ctx.beginPath();
                this.ctx.arc(x + i, y + j, flowerSize * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw petals
                this.ctx.fillStyle = '#FFFFFF'; // White petals
                for (let k = 0; k < 5; k++) {
                    const angle = (k * Math.PI * 2) / 5;
        this.ctx.beginPath();
                    this.ctx.arc(
                        x + i + Math.cos(angle) * flowerSize * 0.5,
                        y + j + Math.sin(angle) * flowerSize * 0.5,
                        flowerSize * 0.3,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        }
    }

    drawWaterSplashes() {
        const splashCount = 5;
        for (let i = 0; i < splashCount; i++) {
            const angle = (i * Math.PI * 2) / splashCount;
            const distance = this.width * 0.3;
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
        this.ctx.beginPath();
            this.ctx.moveTo(
                this.x + this.width * 0.5,
                this.y + this.height * 0.5
            );
            this.ctx.lineTo(
                this.x + this.width * 0.5 + Math.cos(angle) * distance,
                this.y + this.height * 0.5 + Math.sin(angle) * distance
            );
        this.ctx.stroke();
        }
    }

    drawTrail(environment) {
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i + 1) / this.trail.length * 0.7; // fade out
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            switch (environment) {
                case 'running':
                    // Draw simple footsteps (ovals)
                    this.ctx.fillStyle = '#444';
                    this.ctx.beginPath();
                    this.ctx.ellipse(t.x - 8, t.y, 7, 3, Math.PI / 8, 0, 2 * Math.PI);
                    this.ctx.ellipse(t.x + 8, t.y, 7, 3, -Math.PI / 8, 0, 2 * Math.PI);
                    this.ctx.fill();
                    break;
                case 'swimming':
                    // Draw foam (white/blue circles)
                    this.ctx.beginPath();
                    this.ctx.arc(t.x, t.y, 7, 0, 2 * Math.PI);
                    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    this.ctx.shadowColor = '#b3e0ff';
                    this.ctx.shadowBlur = 8;
                    this.ctx.fill();
                    break;
                case 'cycling':
                    // Draw dust/road marks (light brown or gray ellipses)
                    this.ctx.fillStyle = 'rgba(180,180,180,0.6)';
                    this.ctx.beginPath();
                    this.ctx.ellipse(t.x, t.y + 5, 10, 4, 0, 0, 2 * Math.PI);
                    this.ctx.fill();
                    break;
            }
            this.ctx.restore();
        }
    }
} 