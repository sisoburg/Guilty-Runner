import { CONFIG } from '../data/config.js';
import { Player } from './Player.js';
import { Task, Obstacle, Grandchild } from './Entity.js';
import { DEFAULT_TASKS, DEFAULT_OBSTACLES } from '../data/defaultData.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CONFIG.CANVAS.WIDTH;
        this.height = CONFIG.CANVAS.HEIGHT;
        this.running = false;
        this.score = 0;
        this.speed = CONFIG.GAME.INITIAL_SPEED * 0.6;
        this.spawnRate = CONFIG.GAME.INITIAL_SPAWN_RATE * 0.7;
        this.obstacleSpawnRate = CONFIG.GAME.INITIAL_OBSTACLE_SPAWN_RATE * 0.7;
        this.guiltMeter = 0;
        this.entities = [];
        this.difficultyTimer = 0;
        this.frames = 0;
        this.debugMode = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isStunned = false;
        this.stunTimeout = null;
        this.lanes = 8;
        this.laneWidth = 0;
        
        this.currentMessage = '';
        this.messageTimer = 0;
        this.messageDuration = 3000;
        this.lastMessageTime = 0;
        this.messageInterval = 15000;
        this.messageQueue = [];
        this.isShowingMessage = false;
        this.lastGuiltPercent = 0;
        this.guiltChangeThreshold = 0.1;
        
        this.scoreMultiplier = 10;
        this.scoreAccumulating = true;
        
        // Advanced level progression system
        this.taskCollectionGoals = [10, 20, 30]; // Tasks needed for each level
        this.tasksCollected = 0; // Total tasks collected in current environment
        this.timeInEnvironment = 0; // Time spent in current environment
        this.environmentTimeGoals = [60000, 90000, 120000]; // Time goals in ms
        
        // Difficulty progression - task to obstacle ratio for each level
        this.taskObstacleRatios = [0.7, 0.5, 0.3]; // Percentage of tasks vs obstacles (decreases with level)
        
        // Cycling environment shared movement offset
        this.cyclingOffset = 0;
        
        this.guiltMessages = {
            veryLow: [
                { text: "נפש טהורה!", emoji: "😇", value: "צדיקה" },
                { text: "המצפון נקי לחלוטין", emoji: "✨", value: "מושלם" },
                { text: "אין עול על הכתפיים", emoji: "🌟", value: "חופשייה" },
                { text: "הכל בסדר גמור", emoji: "🎉", value: "מאושרת" },
                { text: "אפשר לנוח בשקט", emoji: "🦋", value: "רגועה" }
            ],
            low: [
                { text: "ממשיכה בדרך הנכונה", emoji: "🌈", value: "מצוין" },
                { text: "שומרת על שלוות הנפש", emoji: "🌺", value: "שלווה" },
                { text: "בלי דאגות, בלי אשמה", emoji: "🎭", value: "משוחררת" },
                { text: "החיים יפים וקלים", emoji: "🎪", value: "נהדרת" },
                { text: "הכל יכול לחכות", emoji: "🎡", value: "זורמת" }
            ],
            medium: [
                { text: "המשימות מצטברות...", emoji: "📝", value: "שימי לב" },
                { text: "אולי כדאי להתחיל לזוז", emoji: "🤔", value: "התעוררי" },
                { text: "הרשימה רק מתארכת", emoji: "📋", value: "תזכורת" },
                { text: "הזמן עובר מהר", emoji: "🦥", value: "זהירות" },
                { text: "המצפון מתחיל להציק", emoji: "⚖️", value: "דאגה" }
            ],
            high: [
                { text: "האשמה כבר מעיקה", emoji: "😰", value: "אזהרה" },
                { text: "המשימות קוראות לך!", emoji: "⚠️", value: "דחוף" },
                { text: "אי אפשר להתעלם יותר", emoji: "📚", value: "לחץ" },
                { text: "הגיע זמן לפעולה", emoji: "🤦‍♀️", value: "קריטי" },
                { text: "המצפון לא נותן מנוח", emoji: "😱", value: "חרדה" }
            ],
            veryHigh: [
                { text: "מצב חירום של ממש!", emoji: "🚨", value: "חירום" },
                { text: "העומס בלתי נסבל!", emoji: "⛔", value: "משבר" },
                { text: "טובעת במטלות!", emoji: "🌊", value: "הצילו" },
                { text: "המצפון מתפוצץ!", emoji: "💔", value: "קריסה" },
                { text: "חייבת לעשות משהו!", emoji: "🆘", value: "מצוקה" }
            ]
        };
        
        this.updateDimensions();
        
        this.player = new Player(this.ctx);
        
        this.gameData = {
            tasks: JSON.parse(localStorage.getItem('guiltyRunnerTasks')) || [],
            obstacles: JSON.parse(localStorage.getItem('guiltyRunnerObstacles')) || [],
            grandchildren: JSON.parse(localStorage.getItem('guiltyRunnerGrandchildren')) || []
        };
        
        this.currentTheme = CONFIG.THEMES.RUNNING;
        this.waves = [];
        this.clouds = [];
        
        this.environmentThreshold = 650;
        this.victoryThreshold = 2000;
        this.currentEnvironmentIndex = 0;
        this.environments = ['RUNNING', 'SWIMMING', 'CYCLING'];
        this.completedTasks = new Map();
        this.grandchildrenCollected = 0;
        this.totalGuiltReduced = 0;
        this.startTime = 0;
        this.showingTransitionScreen = false;
        this.soundtrack = null;
        this.isMuted = false;
        this.sfx = {
            task: new Audio('audio/good_pick.mp3'),
            obstacle: new Audio('audio/bad_pick.mp3'),
            grandchild: new Audio('audio/good_pick.mp3'), // Reuse task sound for now
            levelup: new Audio('audio/level_up.mp3'),
            victory: new Audio('audio/victory.mp3'),
            click: new Audio('audio/click.mp3')
        };
        Object.values(this.sfx).forEach(s => { s.volume = 0.7; });
        this.setupMuteButton();
        this.setupButtonClickSound();
        
        this.debugKeys = { shift: false, t: false, p: false };
        document.addEventListener('keydown', this.handleDebugKeys.bind(this));
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.debugKeys.shift = false;
            if (e.key === 't') this.debugKeys.t = false; 
            if (e.key === 'p') this.debugKeys.p = false;
        });
    }
    
    updateDimensions() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        this.width = containerRect.width;
        this.height = containerRect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.grassHeight = Math.floor(this.height * 0.1);
        this.audienceHeight = Math.floor(this.height * 0.15);
        this.trackHeight = this.height - this.grassHeight - this.audienceHeight;
        
        this.laneHeight = this.trackHeight / this.lanes;
        
        this.meterWidth = Math.min(800, this.width * 0.6);
        this.meterHeight = Math.floor(this.height * 0.08);
        this.meterX = (this.width - this.meterWidth) / 2;
        this.meterY = this.height - (this.meterHeight * 1.5);
    }
    
    init() {
        this.reset();
        this.setupEventListeners();
        
        window.addEventListener('resize', () => {
            this.updateDimensions();
        });
    }
    
    reset() {
        this.entities = [];
        this.player = new Player(this.ctx);
        this.guiltMeter = 0;
        this.score = 0;
        this.speed = CONFIG.GAME.INITIAL_SPEED * 0.6 * 0.7; // Slow down the game by 30% more
        this.spawnRate = CONFIG.GAME.INITIAL_SPAWN_RATE * 0.7 * 0.8; // Adjusted from 0.6 to 0.8 - less reduction
        this.obstacleSpawnRate = CONFIG.GAME.INITIAL_OBSTACLE_SPAWN_RATE * 0.7 * 0.8; // Adjusted from 0.6 to 0.8 - less reduction
        this.difficultyTimer = 0;
        this.frames = 0;
        this.isStunned = false;
        this.scoreAccumulating = true;
        // Reset level advancement metrics
        this.tasksCollected = 0;
        // Remove obstacle streak resets
        this.timeInEnvironment = 0;
        if (this.stunTimeout) {
            clearTimeout(this.stunTimeout);
        }
        this.confetti = [];
        this.messageQueue = [];
        this.isShowingMessage = false;
        this.completedTasks.clear();
        this.grandchildrenCollected = 0;
        this.totalGuiltReduced = 0;
        this.startTime = performance.now();
        this.currentEnvironmentIndex = 0;
        this.setTheme(this.environments[this.currentEnvironmentIndex]);
        this.stopSoundtrack();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyD') {
                this.debugMode = !this.debugMode;
                this.toggleDebugButtons(this.debugMode);
            }
        });
    }
    
    toggleDebugButtons(show) {
        let btns = document.getElementById('debugBtnContainer');
        if (show) {
            if (!btns) {
                btns = document.createElement('div');
                btns.id = 'debugBtnContainer';
                btns.innerHTML = `
                    <button class="debug-btn" id="showLevelUpBtn">Show Level Up</button>
                    <button class="debug-btn" id="showVictoryBtn">Show Victory</button>
                    <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px;">
                        <button class="debug-btn env-btn" id="runningEnvBtn">RUNNING</button>
                        <button class="debug-btn env-btn" id="swimmingEnvBtn">SWIMMING</button>
                        <button class="debug-btn env-btn" id="cyclingEnvBtn">CYCLING</button>
                    </div>
                `;
                document.body.appendChild(btns);
                document.getElementById('showLevelUpBtn').onclick = () => this.transitionToNextEnvironment();
                document.getElementById('showVictoryBtn').onclick = () => this.showVictoryScreen();
                
                // Add event listeners for environment buttons
                document.getElementById('runningEnvBtn').onclick = () => this.switchToEnvironment('RUNNING');
                document.getElementById('swimmingEnvBtn').onclick = () => this.switchToEnvironment('SWIMMING');
                document.getElementById('cyclingEnvBtn').onclick = () => this.switchToEnvironment('CYCLING');
            }
            btns.style.display = 'flex';
            btns.style.flexDirection = 'column';
        } else if (btns) {
            btns.style.display = 'none';
        }
    }
    
    // New method to switch environments directly in debug mode
    switchToEnvironment(environmentName) {
        if (!this.environments.includes(environmentName)) return;
        
        // Find the index of the requested environment
        const envIndex = this.environments.indexOf(environmentName);
        this.currentEnvironmentIndex = envIndex;
        
        // Update player outfit based on environment
        this.player.setOutfit(environmentName.toLowerCase());
        
        // Update game theme
        this.setTheme(environmentName);
        
        // Clear notifications about environment change
        const existingPopup = document.getElementById('collectionPopup');
        if (existingPopup && existingPopup.classList.contains('visible')) {
            existingPopup.classList.remove('visible');
        }
        
        // Make sure the game is running
        if (!this.running) {
            this.running = true;
            if (!this.lastTime) {
                this.lastTime = performance.now();
                requestAnimationFrame(this.gameLoop.bind(this));
            }
        }
        
        // Force an immediate redraw to show the new environment
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.player.draw(false, this.currentTheme.name);
        this.drawUI();
        
        // Show a brief message about the environment change
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, 40);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Switched to ${environmentName} environment`, this.width / 2, 26);
        
        // Reset text alignment
        this.ctx.textAlign = 'left';
        
        // Highlight the selected environment button
        const envButtons = document.querySelectorAll('.env-btn');
        envButtons.forEach(btn => {
            if (btn.id === `${environmentName.toLowerCase()}EnvBtn`) {
                btn.style.backgroundColor = '#ffb347';
                btn.style.color = '#000';
            } else {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }
        });
    }
    
    start() {
        this.running = true;
        this.score = 0;
        this.guiltMeter = 0;
        this.speed = CONFIG.GAME.INITIAL_SPEED * 0.6 * 0.7; // Slow down the game by 30% more
        this.spawnRate = CONFIG.GAME.INITIAL_SPAWN_RATE * 0.7 * 0.8; // Adjusted from 0.6 to 0.8 - less reduction
        this.obstacleSpawnRate = CONFIG.GAME.INITIAL_OBSTACLE_SPAWN_RATE * 0.7 * 0.8; // Adjusted from 0.6 to 0.8 - less reduction
        this.entities = [];
        this.difficultyTimer = 0;
        this.frames = 0;
        this.scoreAccumulating = true;
        // Reset level advancement metrics
        this.tasksCollected = 0;
        // Remove obstacle streak resets
        this.timeInEnvironment = 0;
        this.completedTasks.clear();
        this.grandchildrenCollected = 0;
        this.totalGuiltReduced = 0;
        this.startTime = performance.now();
        this.currentEnvironmentIndex = 0;
        this.setTheme(this.environments[this.currentEnvironmentIndex]);
        this.playSoundtrack();
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (!this.running) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        if (!this.celebrationPause && !this.showingTransitionScreen) {
            // Update time in current environment
            this.timeInEnvironment += deltaTime;
            
            this.difficultyTimer += deltaTime;
            if (this.difficultyTimer > CONFIG.GAME.DIFFICULTY_INCREASE_INTERVAL) {
                this.speed += CONFIG.GAME.SPEED_INCREASE * 0.7;
                this.spawnRate += CONFIG.GAME.SPAWN_RATE_INCREASE * 0.8;
                this.obstacleSpawnRate += CONFIG.GAME.OBSTACLE_SPAWN_RATE_INCREASE * 0.8;
                this.difficultyTimer = 0;
            }
            
            // Ensure there's at least one entity on screen at all times
            if (this.entities.length < 3) {
                if (Math.random() < 0.7) { // Bias toward tasks when low on entities
                    this.spawnTask();
                } else {
                    this.spawnObstacle();
                }
            }
            
            // Regular spawning logic
            if (Math.random() < this.spawnRate * 0.6) { // Adjusted from 0.5 to 0.6 for more entities
                // Add chance to spawn grandchildren
                const grandchildChance = 0.1; // 10% chance for grandchild if available
                if (this.gameData.grandchildren.length > 0 && Math.random() < grandchildChance) {
                    this.spawnGrandchild();
                } else {
                    // Use the current level's task-obstacle ratio to determine what to spawn
                    const taskRatio = this.taskObstacleRatios[this.currentEnvironmentIndex] || 0.3; // Default to hardest ratio
                    if (Math.random() < taskRatio) {
                        this.spawnTask();
                    } else {
                        this.spawnObstacle();
                    }
                }
            }
            
            this.updateEntities();
            
            this.guiltMeter += CONFIG.GAME.GUILT_INCREASE_RATE * 2;
            
            // Only update score if not in transition and score accumulation is enabled
            if (!this.showingTransitionScreen && this.scoreAccumulating) {
                this.score += 0.2;
            }
        }
        
        this.updateConfetti();
        this.drawConfetti();
        
        if (!this.isStunned) {
            this.player.update(this.mouseX, this.mouseY, this.currentTheme.name);
        }
        this.player.draw(this.isStunned, this.currentTheme.name);
        
        this.drawUI();
        
        if (this.guiltMeter >= CONFIG.GAME.MAX_GUILT) {
            this.gameOver("המצפון שלך התפוצץ!");
            return;
        }
        
        this.frames++;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    updateEntities() {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(this.speed);
            entity.draw();
            
            if (this.debugMode) {
                this.ctx.strokeStyle = 'red';
                this.ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);
                this.ctx.strokeStyle = 'blue';
                this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
            
            if (this.checkCollision(this.player, entity)) {
                this.handleCollision(entity);
                this.entities.splice(i, 1);
            }
            
            if (entity.isOffScreen()) {
                this.entities.splice(i, 1);
            }
        }
    }
    
    handleCollision(entity) {
        if (entity.type === 'task') {
            this.guiltMeter = Math.max(0, this.guiltMeter - entity.guiltValue);
            const scoreBonus = entity.guiltValue * this.scoreMultiplier;
            this.score += scoreBonus;
            this.totalGuiltReduced += entity.guiltValue;
            
            const taskKey = entity.name;
            this.completedTasks.set(taskKey, (this.completedTasks.get(taskKey) || 0) + 1);
            
            // Increment tasks collected
            this.tasksCollected++;
            
            this.createConfetti(entity.guiltValue);
            
            // Show popup at the entity's position instead of fixed position
            this.showPopupAtLocation({
                emoji: entity.emoji,
                avatar: entity.avatar,
                text: entity.name,
                value: `+${scoreBonus}`
            }, 'TASK', entity.x, entity.y);
            
            // Check for victory condition
            if (this.score >= this.victoryThreshold) {
                this.showVictoryScreen();
                return;
            }
            
            // Check for level transition conditions
            this.checkEnvironmentTransition();
            
            this.playSFX('task');
            
        } else if (entity.type === 'obstacle') {
            // Remove obstacle streak tracking
            
            // Stun player movement
            this.isStunned = true;
            if (this.stunTimeout) {
                clearTimeout(this.stunTimeout);
            }
            this.stunTimeout = setTimeout(() => {
                this.isStunned = false;
            }, CONFIG.MESSAGES.OBSTACLE.STUN_DURATION);
            
            // Stop score accumulation
            this.scoreAccumulating = false;
            setTimeout(() => {
                this.scoreAccumulating = true;
            }, CONFIG.MESSAGES.OBSTACLE.STUN_DURATION * 2);
            
            // Still deduct 10 points
            this.score = Math.max(0, this.score - 10);
            
            // Show popup at the entity's position instead of fixed position
            this.showPopupAtLocation({
                emoji: entity.emoji,
                avatar: entity.avatar,
                text: entity.name,
                value: 'עצור! ×0'
            }, 'OBSTACLE', entity.x, entity.y);
            
            this.playSFX('obstacle');
        } else if (entity.type === 'grandchild') {
            // Handle grandchild collection
            this.guiltMeter = Math.max(0, this.guiltMeter - entity.guiltValue);
            // Bonus score for grandchildren - make it higher than regular tasks
            const scoreBonus = (entity.guiltValue * this.scoreMultiplier) * 2; 
            this.score += scoreBonus;
            
            // Increment counter
            this.grandchildrenCollected++;
            
            // Create more festive confetti for grandchildren
            this.createConfetti(entity.guiltValue * 3);
            
            // Show popup at the entity's position
            this.showPopupAtLocation({
                avatar: entity.avatar,
                text: entity.name,
                value: `+${scoreBonus}`
            }, 'GRANDCHILD', entity.x, entity.y);
            
            // Check for victory condition
            if (this.score >= this.victoryThreshold) {
                this.showVictoryScreen();
                return;
            }
            
            this.playSFX('grandchild');
        }
    }
    
    drawBackground() {
        const theme = this.currentTheme;
        
        this.ctx.fillStyle = theme.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = theme.topBackground.color;
        this.ctx.fillRect(0, 0, this.width, theme.topBackground.height);
        
        switch (theme.name) {
            case 'running':
                this.drawRunningBackground();
                break;
            case 'swimming':
                this.drawSwimmingBackground();
                break;
            case 'cycling':
                this.drawCyclingBackground();
                break;
        }
    }
    
    drawRunningBackground() {
        const theme = this.currentTheme;
        this.ctx.fillStyle = theme.topBackground.detailColor;
        for (let x = 0; x < this.width; x += 15) {
            const heightVar = Math.sin(x * 0.1 + this.frames * 0.05) * 5;
            this.ctx.fillRect(x, theme.topBackground.height - 15 + heightVar, 3, 15);
            this.ctx.fillRect(x + 7, theme.topBackground.height - 12 + heightVar, 3, 12);
        }
        
        const trackTop = theme.topBackground.height;
        const trackBottom = this.height - theme.bottomBackground.height;
        const trackHeight = trackBottom - trackTop;
        const laneHeight = trackHeight / this.lanes;
        
        const trackOffset = (this.frames * this.speed) % 100;
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i <= this.lanes; i++) {
            const y = trackTop + (i * laneHeight);
            
            this.ctx.beginPath();
            this.ctx.setLineDash([20, 20]);
            for (let x = -trackOffset; x < this.width + 20; x += 40) {
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + 20, y);
            }
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px "Press Start 2P"';
        for (let i = 0; i < this.lanes; i++) {
            const y = trackTop + (i * laneHeight) + laneHeight / 2;
            this.ctx.fillText((i + 1).toString(), 20, y + 10);
        }
        
        this.drawAudience(0, this.height - theme.bottomBackground.height, this.width, theme.bottomBackground.height);
    }
    
    drawSwimmingBackground() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.4);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#1E90FF');
        skyGradient.addColorStop(1, '#00008B');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height * 0.4);

        const sunGradient = this.ctx.createRadialGradient(
            this.width * 0.8, this.height * 0.2, 0,
            this.width * 0.8, this.height * 0.2, 50
        );
        sunGradient.addColorStop(0, '#FFD700');
        sunGradient.addColorStop(0.5, '#FFA500');
        sunGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        this.ctx.fillStyle = sunGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.8, this.height * 0.2, 50, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.save();
        this.ctx.globalAlpha = 0.2;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI / 6) + (this.frames * 0.001);
            this.ctx.beginPath();
            this.ctx.moveTo(this.width * 0.8, this.height * 0.2);
            this.ctx.lineTo(
                this.width * 0.8 + Math.cos(angle) * 150,
                this.height * 0.2 + Math.sin(angle) * 150
            );
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        this.ctx.restore();

        this.updateAndDrawClouds();
        
        const deepWaterGradient = this.ctx.createLinearGradient(0, this.height * 0.4, 0, this.height);
        deepWaterGradient.addColorStop(0, '#1E90FF');
        deepWaterGradient.addColorStop(0.5, '#006994');
        deepWaterGradient.addColorStop(1, '#00008B');
        this.ctx.fillStyle = deepWaterGradient;
        this.ctx.fillRect(0, this.height * 0.4, this.width, this.height * 0.6);

        const surfaceGradient = this.ctx.createLinearGradient(0, this.height * 0.4, 0, this.height * 0.5);
        surfaceGradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)');
        surfaceGradient.addColorStop(1, 'rgba(30, 144, 255, 0.1)');
        this.ctx.fillStyle = surfaceGradient;
        this.ctx.fillRect(0, this.height * 0.4, this.width, this.height * 0.1);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        
        for (let wave of this.waves) {
            wave.x -= this.currentTheme.waves.speed;
            if (wave.x + 200 < 0) wave.x = this.width;
            
            this.ctx.beginPath();
            this.ctx.moveTo(wave.x, wave.y);
            
            for (let i = 0; i <= 200; i += 2) {
                const x = wave.x + i;
                const y = wave.y + 
                    Math.sin((x + this.frames * 2) * 0.05) * wave.amplitude +
                    Math.sin((x + this.frames) * 0.1) * (wave.amplitude * 0.5);
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.stroke();
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5; i++) {
            const x = (this.width * 0.8) + Math.cos(this.frames * 0.001 + i) * 100;
            const y = this.height * 0.4 + Math.sin(this.frames * 0.002 + i) * 50;
            
            const reflectionGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 100);
            reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = reflectionGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 100, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    drawCyclingBackground() {
        // Set a pleasant sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');   // Sky blue at top
        skyGradient.addColorStop(1, '#E0F7FF');   // Lighter blue near horizon
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height * 0.6);
        
        // Calculate shared movement offset for synchronization
        // SIGNIFICANTLY REDUCED to match collectable speed
        this.cyclingOffset = (this.frames * this.speed * 0.05) % 40; // Reduced from 0.5 to 0.05 (10x slower)
        
        // Draw distant mountains/hills
        this.drawSoftHills();
        
        // Draw clouds - more subtle
        this.drawSubtleClouds();
        
        // Draw road (2D horizontal instead of perspective)
        // Road background
        const roadHeight = this.height * 0.25;
        const roadY = this.height * 0.6;
        
        // Main road
        const roadGradient = this.ctx.createLinearGradient(0, roadY, 0, roadY + roadHeight);
        roadGradient.addColorStop(0, '#555555');  // Darker at top
        roadGradient.addColorStop(1, '#333333');  // Darker at bottom
        
        this.ctx.fillStyle = roadGradient;
        this.ctx.fillRect(0, roadY, this.width, roadHeight);
        
        // Draw road texture (asphalt pattern) - subtle and sparse
        this.ctx.fillStyle = 'rgba(80, 80, 80, 0.2)';
        const patternSize = 20; // Larger pattern for less noise
        for (let x = 0; x < this.width; x += patternSize) {
            for (let y = roadY; y < roadY + roadHeight; y += patternSize) {
                if ((x + y) % (patternSize * 4) === 0) { // Very sparse pattern
                    const patternOpacity = 0.1 + ((y - roadY) / roadHeight) * 0.2; // More visible at bottom
                    this.ctx.globalAlpha = patternOpacity;
                    this.ctx.fillRect(x, y, patternSize * 0.8, patternSize * 0.8);
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
        
        // Draw center line (dashed) - use the shared cycling offset
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 20]);
        
        const centerY = roadY + (roadHeight / 2);
        const lineOffset = this.cyclingOffset; // Use shared offset for synchronized movement
        
        this.ctx.beginPath();
        for (let x = -lineOffset; x < this.width + 20; x += 40) {
            this.ctx.moveTo(x, centerY);
            this.ctx.lineTo(x + 20, centerY);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw edge lines
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        
        // Top edge
        this.ctx.beginPath();
        this.ctx.moveTo(0, roadY);
        this.ctx.lineTo(this.width, roadY);
        this.ctx.stroke();
        
        // Bottom edge
        this.ctx.beginPath();
        this.ctx.moveTo(0, roadY + roadHeight);
        this.ctx.lineTo(this.width, roadY + roadHeight);
        this.ctx.stroke();
        
        // Draw trees along the sides of the road for 2D horizontal cycling environment
        this.drawSubtleRoadTrees();
        
        // Add some grass below road
        const grassGradient = this.ctx.createLinearGradient(0, roadY + roadHeight, 0, this.height);
        grassGradient.addColorStop(0, '#4D8C57');  // Medium green
        grassGradient.addColorStop(1, '#3A6943');  // Darker green
        
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, roadY + roadHeight, this.width, this.height - (roadY + roadHeight));
    }

    // Hills with softer, more pleasing colors
    drawSoftHills() {
        // Soft natural colors for distant mountains/hills
        const mountainColors = [
            'rgba(121, 145, 168, 0.8)', // Soft blue-gray
            'rgba(142, 168, 195, 0.6)', // Lighter blue-gray
            'rgba(165, 184, 205, 0.4)'  // Very light blue-gray
        ];
        
        // Draw 3 layers of hills at different distances
        const hillCount = 3;
        
        for (let i = 0; i < hillCount; i++) {
            this.ctx.fillStyle = mountainColors[i];
            
            // Each hill layer has different height and wave properties
            const baseHeight = (3 - i) * (this.height * 0.08); // Taller in back
            const waveAmplitude = 20 - (i * 5); // More dramatic in back
            const waveFrequency = 0.005 - (i * 0.001); // Different frequencies
            
            // Position hills with perspective (lower hills are closer)
            const hillY = this.height * (0.35 + (i * 0.05));
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, hillY);
            
            // Draw smooth hill contours
            const step = 30; // Smoother curves with smaller steps
            for (let x = 0; x <= this.width; x += step) {
                // Create natural-looking undulations with multiple sine waves
                const wave1 = Math.sin(x * waveFrequency + this.frames * 0.0005) * waveAmplitude;
                const wave2 = Math.sin(x * waveFrequency * 2.5 + 0.4) * (waveAmplitude * 0.4);
                const hillHeight = baseHeight + wave1 + wave2;
                
                this.ctx.lineTo(x, hillY - hillHeight);
            }
            
            // Complete the hill shape
            this.ctx.lineTo(this.width, hillY);
            this.ctx.lineTo(this.width, this.height * 0.6);
            this.ctx.lineTo(0, this.height * 0.6);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    // Draw clouds that move synchronized with road lines
    drawSubtleClouds() {
        // Very light, almost transparent clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        
        // Draw clouds that move synchronized with the road
        for (let cloud of this.clouds) {
            // Calculate cloud position based on the shared cycling offset
            // Clouds move slower than the road (multiplier 0.2)
            const displacement = (this.cyclingOffset * 0.2) * (this.width / 40);
            const x = (cloud.baseX - displacement) % this.width;
            
            // Handle wrapping around the screen
            const displayX = x < 0 ? x + this.width : x;
            
            // Draw cloud with fixed shape
            this.ctx.beginPath();
            
            // Main cloud body
            this.ctx.arc(displayX, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            
            // Fixed puff positions
            const puffCount = 3;
            for (let i = 0; i < puffCount; i++) {
                const angle = (i / puffCount) * Math.PI;
                const puffX = displayX + Math.cos(angle) * (cloud.size * 0.6);
                const puffY = cloud.y + Math.sin(angle) * (cloud.size * 0.3);
                const puffSize = cloud.size * (0.4 + (i * 0.1));
                
                this.ctx.arc(puffX, puffY, puffSize, 0, Math.PI * 2);
            }
            
            this.ctx.fill();
        }
    }

    // Draw trees along the sides of the road for 2D horizontal cycling environment
    drawSubtleRoadTrees() {
        const roadY = this.height * 0.6;
        const roadHeight = this.height * 0.25;
        
        // Trees in the background (above the road)
        const backgroundTreeCount = Math.ceil(this.width / 250) + 1; // Add one extra tree to prevent gaps
        const backgroundTreeY = roadY - 40; // Just above the road
        
        // Trees in the foreground (below the road)
        const foregroundTreeCount = Math.ceil(this.width / 180) + 1; // Add one extra tree to prevent gaps
        const foregroundTreeY = roadY + roadHeight + 15; // Just below the road
        
        // Synchronize tree movement with road lines
        // Background trees move slower than the road (0.3 multiplier)
        const backgroundSpeed = (this.cyclingOffset * 0.3) * (this.width / 40);
        
        // Draw background trees (smaller)
        this.ctx.globalAlpha = 0.7;
        for (let i = 0; i < backgroundTreeCount; i++) {
            // Fixed starting positions
            const treeSpacing = this.width / (backgroundTreeCount - 1);
            const baseX = i * treeSpacing;
            
            // Calculate position with movement and wrap around
            const x = (baseX - backgroundSpeed) % this.width;
            const displayX = x < 0 ? x + this.width : x;
            
            const scale = 0.6 + ((i % 3) * 0.1); // Deterministic scale
            
            // Choose tree type
            if (i % 3 === 0) {
                this.drawPineTree(displayX, backgroundTreeY, scale);
            } else {
                this.drawRoundTree(displayX, backgroundTreeY, scale);
            }
        }
        
        // Foreground trees move faster than background but still slower than road (0.6 multiplier)
        const foregroundSpeed = (this.cyclingOffset * 0.6) * (this.width / 40);
        
        // Draw foreground trees (larger)
        this.ctx.globalAlpha = 0.9;
        for (let i = 0; i < foregroundTreeCount; i++) {
            // Fixed starting positions
            const treeSpacing = this.width / (foregroundTreeCount - 1);
            const baseX = i * treeSpacing;
            
            // Calculate position with movement and wrap around
            const x = (baseX - foregroundSpeed) % this.width;
            const displayX = x < 0 ? x + this.width : x;
            
            const scale = 0.9 + ((i % 3) * 0.1); // Deterministic scale
            
            // Choose tree type
            if (i % 2 === 0) {
                this.drawPineTree(displayX, foregroundTreeY, scale);
            } else {
                this.drawRoundTree(displayX, foregroundTreeY, scale);
            }
        }
        
        // Reset alpha
        this.ctx.globalAlpha = 1.0;
    }
    
    updateAndDrawClouds() {
        this.ctx.fillStyle = this.currentTheme.topBackground.detailColor;
        for (let cloud of this.clouds) {
            cloud.x += cloud.speed;
            if (cloud.x > this.width) cloud.x = -cloud.size;
            
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.size * 0.5, cloud.y - cloud.size * 0.1, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawAudience(x, y, width, height) {
        const rowHeight = 20;
        const personWidth = 12;
        const rows = Math.floor(height / rowHeight);
        const peoplePerRow = Math.floor(width / personWidth);
        
        for (let row = 0; row < rows; row++) {
            for (let i = 0; i < peoplePerRow; i++) {
                const px = x + i * personWidth;
                const py = y + row * rowHeight;
                
                const waveOffset = Math.sin((this.frames * 0.1) + (i * 0.3)) * 3;
                const rowOffset = row * 5;
                
                const skinTones = ['#FFE4C4', '#DEB887', '#CD853F', '#8B4513'];
                const skinTone = skinTones[(row + i) % skinTones.length];
                
                this.ctx.fillStyle = skinTone;
                this.ctx.fillRect(px + 3, py - rowOffset + waveOffset, 6, 6);
                
                const shirtColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
                this.ctx.fillStyle = shirtColors[(row + i + 2) % shirtColors.length];
                this.ctx.fillRect(px + 2, py + 6 - rowOffset + waveOffset, 8, 8);
                
                if (Math.sin(this.frames * 0.1 + i * 0.5) > 0.3) {
                    this.ctx.fillStyle = skinTone;
                    this.ctx.fillRect(px + 1, py + 4 - rowOffset + waveOffset, 2, 4);
                    this.ctx.fillRect(px + 9, py + 4 - rowOffset + waveOffset, 2, 4);
                }
            }
        }
    }
    
    drawUI() {
        this.ctx.save();
        
        this.ctx.setLineDash([]);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 20, 30);
        
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.meterX, this.meterY, this.meterWidth, this.meterHeight);
        
        const guiltPercent = this.guiltMeter / CONFIG.GAME.MAX_GUILT;
        const gradient = this.ctx.createLinearGradient(this.meterX, 0, this.meterX + this.meterWidth, 0);
        gradient.addColorStop(0, '#4dff4d');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#ff4500');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.meterX, this.meterY, this.meterWidth * guiltPercent, this.meterHeight);
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(this.meterX, this.meterY, this.meterWidth, this.meterHeight);
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '32px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("GUILT-O-METER", this.width / 2, this.meterY - 20);
        this.ctx.textAlign = 'left';
        
        this.updateMessage();
        
        if (this.debugMode) {
            this.ctx.fillText(`Speed: ${this.speed.toFixed(1)}`, 20, 120);
            this.ctx.fillText(`Entities: ${this.entities.length}`, 20, 140);
        }
        
        this.ctx.restore();
    }
    
    spawnTask() {
        const availableTasks = this.gameData.tasks.length > 0 ? this.gameData.tasks : DEFAULT_TASKS;
        const task = availableTasks[Math.floor(Math.random() * availableTasks.length)];
        
        const lane = Math.floor(Math.random() * this.lanes);
        const x = this.width;
        const y = this.grassHeight + (Math.random() * this.trackHeight - CONFIG.ENTITY.TASK_HEIGHT);
        
        const newTask = new Task(
            this.ctx,
            x,
            y,
            task.name,
            task.guiltValue,
            task.avatar ? null : (task.emoji || CONFIG.ENTITY.DEFAULT_TASK_EMOJI),
            task.avatar
        );
        
        this.entities.push(newTask);
    }
    
    spawnObstacle() {
        const availableObstacles = this.gameData.obstacles.length > 0 ? this.gameData.obstacles : DEFAULT_OBSTACLES;
        const obstacle = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];
        
        const lane = Math.floor(Math.random() * this.lanes);
        const x = this.width;
        const y = this.grassHeight + (Math.random() * this.trackHeight - CONFIG.ENTITY.OBSTACLE_HEIGHT);
        
        this.entities.push(new Obstacle(
            this.ctx,
            x,
            y,
            obstacle.name,
            obstacle.avatar ? null : (obstacle.emoji || CONFIG.ENTITY.DEFAULT_OBSTACLE_EMOJI),
            obstacle.avatar
        ));
    }
    
    spawnGrandchild() {
        const availableGrandchildren = this.gameData.grandchildren.length > 0 ? this.gameData.grandchildren : [];
        // Only spawn if there are grandchildren defined
        if (availableGrandchildren.length === 0) return;
        
        const grandchild = availableGrandchildren[Math.floor(Math.random() * availableGrandchildren.length)];
        
        const lane = Math.floor(Math.random() * this.lanes);
        const x = this.width;
        // Position grandchildren slightly higher to make them more visible
        const y = this.grassHeight + (Math.random() * this.trackHeight - CONFIG.ENTITY.GRANDCHILD_HEIGHT) * 0.7;
        
        this.entities.push(new Grandchild(
            this.ctx,
            x,
            y,
            grandchild.name,
            grandchild.avatar
        ));
    }
    
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    gameOver(reason) {
        this.running = false;
        this.stopSoundtrack();
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('gameOverReason').textContent = reason;
        document.getElementById('finalScore').textContent = Math.floor(this.score);
    }
    
    updateMessage() {
        const currentTime = performance.now();
        const guiltPercent = this.guiltMeter / CONFIG.GAME.MAX_GUILT;
            
        // Check if enough time has passed AND guilt has changed significantly
        if (currentTime - this.lastMessageTime > this.messageInterval && 
            Math.abs(guiltPercent - this.lastGuiltPercent) > this.guiltChangeThreshold) {
            
            let messageCategory;
            if (guiltPercent < 0.2) messageCategory = 'veryLow';
            else if (guiltPercent < 0.4) messageCategory = 'low';
            else if (guiltPercent < 0.6) messageCategory = 'medium';
            else if (guiltPercent < 0.8) messageCategory = 'high';
            else messageCategory = 'veryHigh';
            
            const messages = this.guiltMessages[messageCategory];
            const newMessage = messages[Math.floor(Math.random() * messages.length)];
            
            if (!this.currentMessage || this.currentMessage.text !== newMessage.text) {
                this.currentMessage = newMessage;
                this.lastMessageTime = currentTime;
                this.lastGuiltPercent = guiltPercent;
                
                // Ensure guilt messages appear near the guilt meter
                this.queueMessage(newMessage, 'GUILT');
            }
        }
    }
    
    createConfetti(guiltValue) {
        const particleCount = Math.floor(
            CONFIG.CONFETTI.MIN_PARTICLES + 
            (CONFIG.CONFETTI.MAX_PARTICLES - CONFIG.CONFETTI.MIN_PARTICLES) * 
            (guiltValue / 20)
        );
        
        const now = performance.now();
        
        for (let i = 0; i < particleCount; i++) {
            const flower = CONFIG.CONFETTI.FLOWERS[Math.floor(Math.random() * CONFIG.CONFETTI.FLOWERS.length)];
            const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.5);
            const velocity = CONFIG.CONFETTI.MAX_INITIAL_VELOCITY * (0.8 + Math.random() * 0.4);
            
            const confetti = {
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                xVel: Math.cos(angle) * velocity,
                yVel: Math.sin(angle) * velocity - 8,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 8,
                flower: flower,
                createdAt: now,
                scale: 0.8 + Math.random() * 0.4
            };
            this.confetti.push(confetti);
        }

        this.celebrationPause = true;
        setTimeout(() => {
            this.celebrationPause = false;
        }, CONFIG.CONFETTI.CELEBRATION_PAUSE);
    }
    
    updateConfetti() {
        const now = performance.now();
        
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const conf = this.confetti[i];
            
            if (now - conf.createdAt > CONFIG.CONFETTI.LIFETIME) {
                this.confetti.splice(i, 1);
                continue;
            }
            
            if (!this.celebrationPause) {
                conf.x += conf.xVel;
                conf.y += conf.yVel;
                conf.yVel += CONFIG.CONFETTI.GRAVITY;
            }
            conf.rotation += conf.rotationSpeed;
            
            const age = now - conf.createdAt;
            const opacity = 1 - (age / CONFIG.CONFETTI.LIFETIME);
            
            conf.opacity = opacity;
        }
    }
    
    drawConfetti() {
        this.ctx.save();
        
        for (const conf of this.confetti) {
            this.ctx.save();
            this.ctx.translate(conf.x, conf.y);
            this.ctx.rotate((conf.rotation * Math.PI) / 180);
            this.ctx.scale(conf.scale, conf.scale);
            this.ctx.globalAlpha = conf.opacity;
            this.ctx.font = `${CONFIG.CONFETTI.FONT_SIZE}px Arial`;
            this.ctx.fillText(
                conf.flower,
                -CONFIG.CONFETTI.FONT_SIZE/2,
                -CONFIG.CONFETTI.FONT_SIZE/2
            );
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    queueMessage(message, type) {
        // For guilt messages, still use fixed position
        if (type === 'GUILT') {
            const popup = document.getElementById('guiltPopup');
            if (!popup) return;
            
            const popupContent = popup.querySelector('.popup-content');
            
            popupContent.querySelector('.popup-emoji').textContent = message.emoji;
            popupContent.querySelector('.popup-text').textContent = message.text;
            popupContent.querySelector('.popup-value').textContent = message.value;
            
            popup.className = 'popup';
            popup.classList.add('visible');
            popup.classList.add('guilt');
            popup.classList.add('bottom-center');
            
            setTimeout(() => {
                popup.classList.remove('visible');
            }, CONFIG.MESSAGES.GUILT.DURATION);
        }
    }
    
    processMessageQueue() {
        // Method kept for compatibility but no longer used
    }
    
    showPopupAtLocation(message, type, x, y) {
        // Clear any existing popup to prevent queue buildup
        const existingPopup = document.getElementById('collectionPopup');
        if (existingPopup && existingPopup.classList.contains('visible')) {
            existingPopup.classList.remove('visible');
            // Give a tiny delay before showing the next popup for the DOM to update
            setTimeout(() => {
                this.displayPopupAtLocation(message, type, x, y);
            }, 10);
        } else {
            this.displayPopupAtLocation(message, type, x, y);
        }
    }
    
    displayPopupAtLocation(message, type, x, y) {
        const popup = document.getElementById('collectionPopup');
        const popupContent = popup.querySelector('.popup-content');
        
        // Position the popup near the collection point
        // Ensure it stays within screen bounds
        x = Math.max(100, Math.min(x, this.width - 100));
        y = Math.max(100, Math.min(y, this.height - 150));
        
        popup.style.top = `${y - 80}px`;
        popup.style.left = `${x}px`;
        popup.style.transform = 'translate(-50%, -50%)';
        
        const emojiElement = popupContent.querySelector('.popup-emoji');
        const avatarElement = popupContent.querySelector('.popup-avatar');
        
        if (message.avatar) {
            emojiElement.style.display = 'none';
            avatarElement.style.display = 'block';
            avatarElement.src = message.avatar;
        } else {
            emojiElement.style.display = 'block';
            avatarElement.style.display = 'none';
            emojiElement.textContent = message.emoji;
        }
        
        popupContent.querySelector('.popup-text').textContent = message.text;
        popupContent.querySelector('.popup-value').textContent = 
            type === 'TASK' ? `+${message.value.slice(1)}` : message.value;
        
        // Reset classes and add the necessary ones
        popup.className = 'popup';
        popup.classList.add('visible');
        popup.classList.add(CONFIG.MESSAGES[type].STYLE || type.toLowerCase());
        
        // Auto-clear the popup after the duration
        setTimeout(() => {
            popup.classList.remove('visible');
        }, CONFIG.GAME.POPUP_DURATION);
    }

    setTheme(themeName) {
        this.currentTheme = CONFIG.THEMES[themeName.toUpperCase()];
        this.waves = [];
        this.clouds = [];
        if (themeName === 'SWIMMING') {
            this.initializeWaves();
        }
        if (themeName === 'SWIMMING' || themeName === 'CYCLING') {
            this.initializeClouds();
        }
    }

    initializeWaves() {
        const waveCount = Math.ceil(this.width / 100);
        for (let i = 0; i < waveCount; i++) {
            this.waves.push({
                x: i * 100,
                y: this.height * 0.5,
                amplitude: 10 + Math.random() * 10
            });
        }
    }

    initializeClouds() {
        const cloudCount = 5;
        this.clouds = [];
        
        // Create fixed cloud positions that won't change
        for (let i = 0; i < cloudCount; i++) {
            // Space clouds evenly across the width
            const baseX = (this.width / cloudCount) * i + (this.width / cloudCount / 2);
            
            this.clouds.push({
                x: baseX,
                baseX: baseX, // Store the base position
                y: 30 + (i % 3) * 40, // Deterministic heights at different levels
                size: 30 + (i * 5) % 20 // Deterministic sizes
            });
        }
    }

    transitionToNextEnvironment() {
        this.currentEnvironmentIndex = (this.currentEnvironmentIndex + 1) % this.environments.length;
        const nextEnvironment = this.environments[this.currentEnvironmentIndex];
        const envImages = {
            RUNNING: 'img/running.png',
            SWIMMING: 'img/Swimming.png',
            CYCLING: 'img/Cycling.png'
        };
        
        // Get environment names for display
        const currentEnvName = this.environments[this.currentEnvironmentIndex - 1] || 'START';
        const nextEnvName = nextEnvironment;
        
        // Create a simplified, streamlined level-up screen
        this.showingTransitionScreen = true;
        const transitionScreen = document.createElement('div');
        transitionScreen.className = 'transition-screen';
        
        transitionScreen.innerHTML = `
            <div class="transition-content levelup-content compact-layout" style="max-width:480px; padding:2.2rem 1.8rem;">
                <div class="levelup-header" style="font-size:2.4rem;">
                    <span style="color:#FFD700;font-size:1.4em;margin-right:8px;">🎉</span>
                    LEVEL UP!
                    <span style="color:#FFD700;font-size:1.4em;margin-left:8px;">🎉</span>
                </div>
                
                <div class="environment-transition" style="width:90%; margin:1.5rem auto;">
                    <div class="environment-change">
                        <div class="environment-item">
                            <img src="${envImages[currentEnvName === 'START' ? 'RUNNING' : currentEnvName]}" alt="${currentEnvName}" class="character-img small-char" style="width:100px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));" />
                            <span class="environment-name" style="color:#FFD700;font-size:1.3rem;">${currentEnvName}</span>
                        </div>
                        <div class="environment-arrow" style="font-size:1.8em;color:#FFD700;text-shadow:0 0 5px #FFA500;">→</div>
                        <div class="environment-item">
                            <img src="${envImages[nextEnvName]}" alt="${nextEnvName}" class="character-img small-char" style="width:100px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));animation:pulse 1.5s infinite;" />
                            <span class="environment-name" style="color:#FFD700;font-weight:bold;text-shadow:0 0 8px #FFA500;font-size:1.3rem;">${nextEnvName}</span>
                        </div>
                    </div>
                </div>
                
                <div class="levelup-score" style="margin:1.5rem auto 0;background:rgba(0,0,0,0.2);padding:0.9em;border-radius:10px;box-shadow:0 2px 5px rgba(0,0,0,0.2);width:85%;">
                    <span class="score-label" style="color:#FFF;margin-right:5px;font-size:1.2rem;">Score:</span> 
                    <span class="score-value" style="color:#FFD700;text-shadow:0 0 5px #FFD700;font-size:1.8rem;">${Math.floor(this.score)}</span>
                </div>
                
                <button class="continue-btn retro-btn compact-btn" style="margin-top:1.8rem;font-size:1.3rem;padding:0.9em 2.5em;">CONTINUE</button>
            </div>
        `;
        
        document.body.appendChild(transitionScreen);
        
        // Add celebration effect
        this.createConfetti(20);
        this.playSFX('levelup');
        
        // Add click handler to continue
        transitionScreen.querySelector('.continue-btn').addEventListener('click', () => {
            document.body.removeChild(transitionScreen);
            this.showingTransitionScreen = false;
            
            // Update player outfit based on environment
            switch (nextEnvironment) {
                case 'RUNNING':
                    this.player.setOutfit('running');
                    break;
                case 'SWIMMING':
                    this.player.setOutfit('swimming');
                    break;
                case 'CYCLING':
                    this.player.setOutfit('cycling');
                    break;
            }
            
            // Update theme
            this.setTheme(nextEnvironment);
            
            // Slightly increase difficulty
            this.speed += 0.1;
            this.spawnRate += 0.0005;
            
            // Reset level progression metrics for new environment
            this.tasksCollected = 0;
            this.timeInEnvironment = 0;
        });
    }

    getTransitionAnimation(environment) {
        switch (environment) {
            case 'SWIMMING':
                return `
                    <div class="swimming-transition">
                        <div class="wave"></div>
                        <div class="wave"></div>
                        <div class="wave"></div>
                    </div>
                `;
            case 'CYCLING':
                return `
                    <div class="cycling-transition">
                        <div class="road"></div>
                        <div class="trees"></div>
                    </div>
                `;
            default:
                return `
                    <div class="running-transition">
                        <div class="track"></div>
                        <div class="finish-line"></div>
                    </div>
                `;
        }
    }

    showVictoryScreen() {
        this.running = false;
        this.playSFX('victory');
        // Calculate metrics
        const totalTasks = Array.from(this.completedTasks.values()).reduce((a, b) => a + b, 0);
        const totalObstacles = this.entities.filter(e => e.type === 'obstacle').length;
        const totalGrandchildren = this.grandchildrenCollected;
        const totalScore = Math.floor(this.score);
        
        // Character images
        const envImages = {
            RUNNING: 'img/running.png',
            SWIMMING: 'img/Swimming.png',
            CYCLING: 'img/Cycling.png'
        };
        
        // Create a more compact victory screen
        const victoryScreen = document.getElementById('gameOver');
        victoryScreen.innerHTML = `
            <div class="victory-flower-container" style="position:absolute;width:100%;height:100%;overflow:hidden;pointer-events:none;z-index:-1;">
                ${this.generateFlowerElements(12)}
            </div>
            
            <div style="max-width 550px; padding:2.5rem 2rem;">
                <h2 class="victory-title compact-title" style="color:#FFD700;text-shadow:0 2px 10px rgba(255,165,0,0.7);font-size:2.6rem;margin-bottom:1.5rem;">
                    <span style="color:gold;margin-right:0.3em;">🏆</span>
                    VICTORY!
                    <span style="color:gold;margin-left:0.3em;">🏆</span>
                </h2>
                
                <div class="victory-characters" style="display:flex;justify-content:center;gap:1.5rem;margin-bottom:1.8rem;">
                    <div class="victory-char" style="text-align:center;">
                        <img src="${envImages.RUNNING}" alt="Running" class="character-img small-char" style="width:85px;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.4));" />
                    </div>
                    <div class="victory-char" style="text-align:center;">
                        <img src="${envImages.SWIMMING}" alt="Swimming" class="character-img small-char" style="width:85px;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.4));" />
                    </div>
                    <div class="victory-char" style="text-align:center;">
                        <img src="${envImages.CYCLING}" alt="Cycling" class="character-img small-char" style="width:85px;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.4));" />
                    </div>
                </div>
                
                <div class="victory-main-stats compact-stats" style="display:flex;justify-content:center;gap:1.5rem;margin:0 auto 2rem;max-width:90%;">
                    <div class="main-stat-card score-card" style="background:linear-gradient(135deg,#2c3e50,#3c4e60);border-radius:10px;padding:1rem;flex:1;text-align:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);">
                        <div class="main-stat-label" style="color:#FFD700;font-size:1.1rem;margin-bottom:0.5rem;">Score</div>
                        <div class="main-stat-value" style="color:#FFF;font-size:1.8rem;text-shadow:0 0 5px #FFD700;">${totalScore}</div>
                    </div>
                    <div class="main-stat-card good-card" style="background:linear-gradient(135deg,#2c3e50,#3c4e60);border-radius:10px;padding:1rem;flex:1;text-align:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);">
                        <div class="main-stat-label" style="color:#4dff4d;font-size:1.1rem;margin-bottom:0.5rem;">אשמות</div>
                        <div class="main-stat-value" style="color:#FFF;font-size:1.8rem;text-shadow:0 0 5px #4dff4d;">${totalTasks}</div>
                    </div>
                    <div class="main-stat-card bad-card" style="background:linear-gradient(135deg,#2c3e50,#3c4e60);border-radius:10px;padding:1rem;flex:1;text-align:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);">
                        <div class="main-stat-label" style="color:#ff4500;font-size:1.1rem;margin-bottom:0.5rem;">הנאות</div>
                        <div class="main-stat-value" style="color:#FFF;font-size:1.8rem;text-shadow:0 0 5px #ff4500;">${totalObstacles}</div>
                    </div>
                </div>
                
                
                <button id="restartBtn" class="victory-btn retro-btn compact-btn" style="background:linear-gradient(145deg, #ffd700, #ff6a33);color:#222;border:none;border-radius:25px;padding:1em 2.5em;font-family:'Bungee',cursive;font-size:1.3rem;box-shadow:0 3px 10px rgba(255,215,0,0.3);transition:all 0.2s ease;margin-top:1rem;">PLAY AGAIN</button>
            </div>
        `;
        
        // Show victory screen
        victoryScreen.style.display = 'block';
        
        // Add celebration effects
        this.createConfetti(25);
        
        // Add extra confetti for victory - reduced frequency
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.createConfetti(8);
            }, i * 600);
        }
        
        // Add event listener for restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            victoryScreen.style.display = 'none';
            this.reset();
            this.start();
        });
    }
    
    // Helper method to generate flower elements for victory screen
    generateFlowerElements(count) {
        let flowers = '';
        const flowerTypes = CONFIG.CONFETTI.FLOWERS;
        const positions = [];
        
        for (let i = 0; i < count; i++) {
            // Generate random positions that don't overlap
            let position;
            let attempts = 0;
            do {
                position = {
                    top: Math.random() * 80 + 10, // 10-90%
                    left: Math.random() * 80 + 10, // 10-90%
                };
                attempts++;
            } while (
                positions.some(p => 
                    Math.abs(p.top - position.top) < 15 && 
                    Math.abs(p.left - position.left) < 15
                ) && attempts < 30
            );
            
            positions.push(position);
            
            const flower = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
            const size = Math.random() * 2 + 2; // 2-4em
            const rotation = Math.random() * 360;
            const delay = Math.random() * 3;
            const duration = Math.random() * 2 + 3; // 3-5s
            
            flowers += `
                <div class="victory-flower" style="
                    top: ${position.top}%;
                    left: ${position.left}%;
                    font-size: ${size}em;
                    transform: rotate(${rotation}deg);
                    animation-delay: ${delay}s;
                    animation-duration: ${duration}s;
                ">${flower}</div>
            `;
        }
        
        return flowers;
    }

    playSoundtrack() {
        if (!this.soundtrack) {
            this.soundtrack = new Audio('audio/soundtrack.mp3');
            this.soundtrack.loop = true;
            this.soundtrack.volume = 0.5;
            this.soundtrack.muted = this.isMuted;
        }
        this.soundtrack.currentTime = 0;
        this.soundtrack.play();
    }
    
    stopSoundtrack() {
        if (this.soundtrack) {
            this.soundtrack.pause();
            this.soundtrack.currentTime = 0;
        }
    }

    playSFX(name) {
        const sfxFiles = {
            task: 'audio/good_pick.mp3',
            obstacle: 'audio/bad_pick.mp3',
            grandchild: 'audio/good_pick.mp3', // Reuse task sound for now
            levelup: 'audio/level_up.mp3',
            victory: 'audio/victory.mp3',
            click: 'audio/click.mp3'
        };
        if (sfxFiles[name]) {
            const audio = new Audio(sfxFiles[name]);
            audio.volume = name === 'levelup' || name === 'victory' ? 1.0 : 0.7;
            audio.muted = this.isMuted;
            audio.play();
        }
    }

    setupMuteButton() {
        const muteBtn = document.getElementById('muteBtn');
        if (!muteBtn) return;
        const updateIcon = () => {
            muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
        };
        muteBtn.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            if (this.soundtrack) this.soundtrack.muted = this.isMuted;
            Object.values(this.sfx).forEach(s => { s.muted = this.isMuted; });
            updateIcon();
        });
        updateIcon();
    }

    setupButtonClickSound() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' && target.id !== 'muteBtn') {
                this.playSFX('click');
            }
        }, true);
    }

    // Level advancement system that requires only 1 condition to be met
    checkEnvironmentTransition() {
        if (this.showingTransitionScreen) return false;
        
        const nextIndex = this.currentEnvironmentIndex + 1;
        if (nextIndex >= this.environments.length) return false;
        
        // Multiple conditions for level advancement, but only need 1 to advance
        
        // Condition 1: Score threshold
        const scoreGoal = this.environmentThreshold * (nextIndex);
        if (this.score >= scoreGoal) {
            this.transitionToNextEnvironment();
            return true;
        }
        
        // Condition 2: Task collection goal
        const taskGoal = this.taskCollectionGoals[this.currentEnvironmentIndex];
        if (this.tasksCollected >= taskGoal) {
            this.transitionToNextEnvironment();
            return true;
        }
        
        // Condition 3: Time in environment
        const timeGoal = this.environmentTimeGoals[this.currentEnvironmentIndex];
        if (this.timeInEnvironment >= timeGoal) {
            this.transitionToNextEnvironment();
            return true;
        }
        
        return false;
    }

    // Draw a pine/conifer style tree - use consistent random values to prevent flickering
    drawPineTree(x, y, scale) {
        const trunkWidth = 6 * scale;
        const trunkHeight = 30 * scale;
        const greenHeight = 60 * scale;
        
        // Tree trunk
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - trunkWidth/2, y, trunkWidth, trunkHeight);
        
        // Tree foliage (triangle shapes)
        this.ctx.fillStyle = '#2F4F2F';
        
        const segments = 3;
        const width = 50 * scale;
        
        for (let i = 0; i < segments; i++) {
            const segmentY = y - (i * greenHeight/3);
            const segmentWidth = width * (1 - (i * 0.15));
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, segmentY - greenHeight/3);
            this.ctx.lineTo(x - segmentWidth/2, segmentY);
            this.ctx.lineTo(x + segmentWidth/2, segmentY);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    // Draw a round/deciduous style tree - use consistent random values to prevent flickering
    drawRoundTree(x, y, scale) {
        const trunkWidth = 5 * scale;
        const trunkHeight = 20 * scale;
        const leafRadius = 20 * scale;
        
        // Tree trunk
        this.ctx.fillStyle = '#8B5A2B';
        this.ctx.fillRect(x - trunkWidth/2, y, trunkWidth, trunkHeight);
        
        // Softer leaf colors
        const leafColors = [
            'rgba(53, 94, 59, 0.85)',
            'rgba(60, 110, 60, 0.85)',
            'rgba(70, 130, 70, 0.85)'
        ];
        
        // Tree leaves (cluster of circles)
        const centerY = y - trunkHeight/2;
        
        // Main foliage cluster
        this.ctx.fillStyle = leafColors[0];
        this.ctx.beginPath();
        this.ctx.arc(x, centerY - leafRadius * 0.8, leafRadius * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Additional smaller clusters for texture - use fixed pattern based on x position
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const clusterX = x + Math.cos(angle) * (leafRadius * 0.7);
            const clusterY = centerY - leafRadius * 0.5 + Math.sin(angle) * (leafRadius * 0.5);
            // Use deterministic size based on position instead of random
            const clusterRadius = leafRadius * (0.7 + ((x + i) % 10) / 30);
            
            this.ctx.fillStyle = leafColors[i % leafColors.length];
            this.ctx.beginPath();
            this.ctx.arc(clusterX, clusterY, clusterRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    handleDebugKeys(e) {
        // Track key presses
        if (e.key === 'Shift') this.debugKeys.shift = true;
        if (e.key === 't') this.debugKeys.t = true;
        if (e.key === 'p') this.debugKeys.p = true;

        // Check for cheat combo
        if (this.debugKeys.shift && this.debugKeys.t && this.debugKeys.p) {
            this.score += 5000;
            console.log("Cheat activated! +5000 points");
            
            // Visual feedback
            this.showPopupAtLocation({
                text: "CHEAT! +5000",
                value: "⚡"
            }, 'DEBUG', this.player.x, this.player.y);
            
            // Reset keys
            this.debugKeys = { shift: false, t: false, p: false };
        }
    }
} 