import { CONFIG } from '../data/config.js';

export class Entity {
    constructor(ctx, x, y, width, height) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hoverOffset = 0;
        this.hoverDirection = 1;
        this.rotation = 0;
    }

    update(speed) {
        // Move from right to left
        this.x -= speed;
        
        // Add floating animation
        this.hoverOffset += 0.1 * this.hoverDirection;
        if (Math.abs(this.hoverOffset) > CONFIG.ENTITY.HOVER_OFFSET) {
            this.hoverDirection *= -1;
        }
        
        // Add rotation animation for obstacles
        if (this.type === 'obstacle') {
            this.rotation += 0.02;
        }
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    drawTitle(text, color) {
        this.ctx.save();
        // Set up text properties
        this.ctx.font = 'bold 28px "Secular One", "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        // Draw text shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Draw the text
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, this.x + this.width / 2, this.y - 10 + this.hoverOffset);
        
        this.ctx.restore();
    }
    
    drawGuiltScore(score) {
        this.ctx.save();
        // Set up text properties
        this.ctx.font = 'bold 24px "Secular One", "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // Draw text shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Draw the score with + sign and Hebrew label
        this.ctx.fillStyle = '#ffd700'; // Gold color for the score
        this.ctx.fillText(`אשמות: +${score}`, this.x + this.width / 2, this.y + this.height + 5 + this.hoverOffset);
        
        this.ctx.restore();
    }

    drawEmoji(emoji) {
        this.ctx.save();
        this.ctx.font = `${this.height * 0.8}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, this.x + this.width / 2, this.y + this.height / 2 + this.hoverOffset);
        this.ctx.restore();
    }

    drawAvatar(avatarSrc) {
        if (!this.avatarImage) {
            this.avatarImage = new Image();
            this.avatarImage.src = avatarSrc;
        }
        
        if (this.avatarImage.complete) {
            this.ctx.save();
            
            // Create circular clipping path
            this.ctx.beginPath();
            this.ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2 + this.hoverOffset,
                this.width / 2,
                0,
                Math.PI * 2
            );
            this.ctx.clip();
            
            // Draw the image
            this.ctx.drawImage(
                this.avatarImage,
                this.x,
                this.y + this.hoverOffset,
                this.width,
                this.height
            );
            
            // Add a subtle border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
}

export class Task extends Entity {
    constructor(ctx, x, y, name, guiltValue, emoji = CONFIG.ENTITY.DEFAULT_TASK_EMOJI, avatar = null) {
        super(ctx, x, y, CONFIG.ENTITY.TASK_WIDTH, CONFIG.ENTITY.TASK_HEIGHT);
        this.type = 'task';
        this.name = name;
        this.guiltValue = guiltValue;
        this.emoji = emoji;
        this.avatar = avatar;
        if (avatar) {
            this.avatarImage = new Image();
            this.avatarImage.src = avatar;
        }
    }
    
    getValueColor() {
        // Linear interpolation between colors based on guilt value
        const value = Math.min(Math.max(this.guiltValue, 1), 10) / 10; // Normalize between 0 and 1
        
        // Convert hex to RGB for interpolation
        const green = {r: 77, g: 255, b: 77}; // #4dff4d
        const orange = {r: 255, g: 165, b: 0}; // #FFA500
        
        // Interpolate between orange and green
        const r = Math.round(orange.r + (green.r - orange.r) * value);
        const g = Math.round(orange.g + (green.g - orange.g) * value);
        const b = Math.round(orange.b + (green.b - orange.b) * value);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    draw() {
        // Draw the title first
        this.drawTitle(this.name, this.getValueColor());
        
        // Draw the guilt score even further down
        this.ctx.save();
        this.ctx.font = 'bold 24px "Secular One", "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.getValueColor();
        this.ctx.fillText(`אשמות: +${this.guiltValue}`, this.x + this.width / 2, this.y + this.height * 0.45);
        this.ctx.restore();
        
        // Draw the avatar or emoji at the very bottom
        if (this.avatar) {
            this.ctx.save();
            const originalY = this.y;
            this.y = this.y + this.height * 0.9 - this.height / 2;
            this.drawAvatar(this.avatar);
            this.y = originalY;
            this.ctx.restore();
        } else {
            this.ctx.save();
            const originalY = this.y;
            this.y = this.y + this.height * 0.9 - this.height / 2;
            this.drawEmoji(this.emoji);
            this.y = originalY;
            this.ctx.restore();
        }
    }
}

export class Obstacle extends Entity {
    constructor(ctx, x, y, name, emoji = CONFIG.ENTITY.DEFAULT_OBSTACLE_EMOJI, avatar = null) {
        super(ctx, x, y, CONFIG.ENTITY.OBSTACLE_WIDTH, CONFIG.ENTITY.OBSTACLE_HEIGHT);
        this.type = 'obstacle';
        this.name = name;
        this.emoji = emoji;
        this.avatar = avatar;
        if (avatar) {
            this.avatarImage = new Image();
            this.avatarImage.src = avatar;
        }
    }
    
    draw() {
        // Draw warning icon above the title
        if (this.type === 'obstacle') {
            this.ctx.save();
            this.ctx.font = 'bold 32px "Secular One", "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.globalAlpha = 0.95;
            this.ctx.fillText('⚠️', this.x + this.width / 2, this.y - 38 + this.hoverOffset);
            this.ctx.restore();
        }
        // Draw the title
        this.drawTitle(this.name, '#ff2626');
        // Then draw the avatar or emoji
        if (this.avatar) {
            this.drawAvatar(this.avatar);
        } else {
            this.drawEmoji(this.emoji);
        }
    }
}

export class Grandchild extends Entity {
    constructor(ctx, x, y, name, avatar) {
        super(ctx, x, y, CONFIG.ENTITY.GRANDCHILD_WIDTH, CONFIG.ENTITY.GRANDCHILD_HEIGHT);
        this.type = 'grandchild';
        this.name = name;
        this.guiltValue = CONFIG.ENTITY.DEFAULT_GRANDCHILD_GUILT;
        this.avatar = avatar;
        this.jumpOffset = 0;
        this.jumpDirection = 1;
        
        if (avatar) {
            this.avatarImage = new Image();
            this.avatarImage.src = avatar;
        }
    }
    
    update(speed) {
        // Move from right to left
        this.x -= speed;
        
        // Add jumpy, happy animation instead of standard hover
        this.jumpOffset += CONFIG.ENTITY.ANIMATION.GRANDCHILD_JUMP_SPEED * this.jumpDirection;
        if (Math.abs(this.jumpOffset) > CONFIG.ENTITY.ANIMATION.GRANDCHILD_JUMP_HEIGHT) {
            this.jumpDirection *= -1;
        }
    }
    
    draw() {
        // Only draw the avatar with jumpy motion - no title or guilt value shown
        if (this.avatar) {
            this.ctx.save();
            
            // Create circular clipping path
            this.ctx.beginPath();
            this.ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2 + this.jumpOffset,
                this.width / 2,
                0,
                Math.PI * 2
            );
            this.ctx.clip();
            
            // Draw the image
            this.ctx.drawImage(
                this.avatarImage,
                this.x,
                this.y + this.jumpOffset,
                this.width,
                this.height
            );
            
            // Add a cute border with heart pattern
            this.ctx.strokeStyle = 'rgba(255, 105, 180, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            
            // Add a glow effect
            this.ctx.shadowColor = 'rgba(255, 182, 193, 0.6)';
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            
            this.ctx.restore();
            
            // Add small heart or star particles around the grandchild
            this.drawParticles();
        }
    }
    
    drawParticles() {
        const time = performance.now() * 0.001;
        const particleCount = 2;
        
        this.ctx.save();
        this.ctx.font = '12px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"';
        
        for (let i = 0; i < particleCount; i++) {
            const angle = time + (i * Math.PI);
            const distance = this.width * 0.7;
            const x = this.x + this.width / 2 + Math.cos(angle) * distance;
            const y = this.y + this.height / 2 + Math.sin(angle) * distance + this.jumpOffset;
            
            // Alternate between hearts and stars
            const emoji = i % 2 === 0 ? '❤️' : '✨';
            
            this.ctx.fillText(emoji, x, y);
        }
        
        this.ctx.restore();
    }
} 