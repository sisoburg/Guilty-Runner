export const CONFIG = {
    CANVAS: {
        WIDTH: window.innerWidth,
        HEIGHT: window.innerHeight,
        get GROUND_LEVEL() {
            return this.HEIGHT * 0.8; // Ground at 80% of screen height
        }
    },
    THEMES: {
        RUNNING: {
            name: 'running',
            backgroundColor: '#D35400', // Track color
            topBackground: {
                color: '#228B22', // Forest Green
                height: 40,
                detailColor: '#32CD32' // Lighter green for grass
            },
            bottomBackground: {
                height: 60, // Audience height
                colors: ['#444444', '#666666', '#888888'] // Bleacher colors
            },
            textShadow: {
                color: 'rgba(0, 0, 0, 0.7)',
                blur: 6,
                offsetX: 2,
                offsetY: 2
            }
        },
        SWIMMING: {
            name: 'swimming',
            backgroundColor: '#0077be', // Ocean blue
            topBackground: {
                color: '#87CEEB', // Sky blue
                height: 40,
                detailColor: '#FFFFFF' // White for clouds
            },
            bottomBackground: {
                height: 60,
                colors: ['#006994', '#005477', '#003f5c'] // Deeper water colors
            },
            waves: {
                color: '#FFFFFF',
                opacity: 0.3,
                speed: 1.2
            }
        },
        CYCLING: {
            name: 'cycling',
            backgroundColor: '#808080', // Road gray
            topBackground: {
                color: '#87CEEB', // Sky blue
                height: 40,
                detailColor: '#FFFFFF' // White for clouds
            },
            bottomBackground: {
                height: 60,
                colors: ['#228B22', '#196619', '#145214'] // Green landscape
            },
            road: {
                lineColor: '#FFFFFF',
                lineWidth: 5,
                dashLength: 20
            }
        }
    },
    GAME: {
        INITIAL_SPEED: 5.0,
        INITIAL_SPAWN_RATE: 0.04 * 0.6,
        INITIAL_OBSTACLE_SPAWN_RATE: 0.025 * 0.6,
        DIFFICULTY_INCREASE_INTERVAL: 20000,
        SPEED_INCREASE: 0,
        SPAWN_RATE_INCREASE: 0.0001 * 0.5,
        OBSTACLE_SPAWN_RATE_INCREASE: 0.0001 * 0.5,
        GUILT_INCREASE_RATE: 0.012,
        MAX_GUILT: 100,
        POPUP_DURATION: 1500,
        OBSTACLE_STUN_DURATION: 2000,
        MESSAGE_QUEUE_DELAY: 500
    },
    PLAYER: {
        get WIDTH() {
            return Math.min(80, window.innerWidth * 0.08);
        },
        get HEIGHT() {
            return this.WIDTH * 1.5;
        },
        get START_X() {
            return window.innerWidth * 0.2;
        },
        MOVE_SPEED: 6
    },
    ENTITY: {
        get TASK_WIDTH() {
            return Math.min(60, window.innerWidth * 0.04);
        },
        get TASK_HEIGHT() {
            return this.TASK_WIDTH;
        },
        get OBSTACLE_WIDTH() {
            return Math.min(70, window.innerWidth * 0.05);
        },
        get OBSTACLE_HEIGHT() {
            return this.OBSTACLE_WIDTH;
        },
        get GRANDCHILD_WIDTH() {
            return Math.min(70, window.innerWidth * 0.05);
        },
        get GRANDCHILD_HEIGHT() {
            return this.GRANDCHILD_WIDTH;
        },
        get TEXT_SIZE() {
            return `${Math.max(16, window.innerWidth * 0.015)}px`;
        },
        HOVER_OFFSET: 10, // Maximum vertical movement for floating animation
        AVATAR_SIZE: 40, // Size for avatar images
        DEFAULT_TASK_EMOJI: '✅',
        DEFAULT_OBSTACLE_EMOJI: '⚠',
        DEFAULT_GRANDCHILD_GUILT: 1, // Default guilt value for grandchildren
        ANIMATION: {
            HOVER_SPEED: 0.1, // Speed of floating animation
            ROTATION_SPEED: 0.02, // Speed of rotation for obstacles
            GRANDCHILD_JUMP_HEIGHT: 15, // Height of grandchild jumpy animation
            GRANDCHILD_JUMP_SPEED: 0.2 // Speed of grandchild jumpy animation
        }
    },
    CONFETTI: {
        MIN_PARTICLES: 8,
        MAX_PARTICLES: 20,
        FLOWERS: ['🌸', '🌺', '🌹','🌻', '🌼'],
        FONT_SIZE: 20,
        LIFETIME: 1200,
        GRAVITY: 0.25,
        MAX_INITIAL_VELOCITY: 8,
        CELEBRATION_PAUSE: 300
    },
    MESSAGES: {
        TASK: {
            DURATION: 2000,
            POSITION: 'center',
            STYLE: 'good'
        },
        OBSTACLE: {
            DURATION: 2000,
            POSITION: 'center',
            STYLE: 'danger',
            STUN_DURATION: 1500
        },
        GUILT: {
            DURATION: 2500,
            POSITION: 'bottom-center'
        },
        ACHIEVEMENT: {
            DURATION: 3000,
            POSITION: 'center',
            STYLE: 'achievement'
        },
        GRANDCHILD: {
            DURATION: 2000,
            POSITION: 'center',
            STYLE: 'grandchild'
        }
    },
    ADMIN: {
        GUILT_SLIDER: {
            MIN: 1,
            MAX: 10,
            STEP: 1
        },
        STORAGE_KEYS: {
            TASKS: 'guiltyRunnerTasks',
            OBSTACLES: 'guiltyRunnerObstacles',
            GRANDCHILDREN: 'guiltyRunnerGrandchildren'
        }
    }
}; 