import { CONFIG } from '../data/config.js';

export class AdminPanel {
    constructor(game) {
        this.game = game;
        this.panel = document.getElementById('adminPanel');
        this.backdrop = document.getElementById('adminPanelBackdrop');
        this.modal = document.getElementById('adminModal');
        this.modalContent = document.getElementById('adminModalContent');
        this.selectedFile = null;
        this.setupEventListeners();
        this.renderLists();
    }
    
    setupEventListeners() {
        // Panel toggle
        const adminBtn = document.getElementById('adminBtn');
        console.log('adminBtn:', adminBtn);
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                this.panel.classList.add('visible');
                this.backdrop.classList.add('visible');
            this.renderLists();
        });
        } else {
            console.warn('adminBtn not found');
        }

        const adminCloseX = document.getElementById('adminCloseX');
        console.log('adminCloseX:', adminCloseX);
        if (adminCloseX) {
            adminCloseX.addEventListener('click', () => {
                this.panel.classList.remove('visible');
                this.backdrop.classList.remove('visible');
            });
        } else {
            console.warn('adminCloseX not found');
        }

        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => {
            this.panel.classList.remove('visible');
                this.backdrop.classList.remove('visible');
            });
        } else {
            console.warn('adminPanelBackdrop not found');
        }

        // Show add forms in modal
        const showAddTaskForm = document.getElementById('showAddTaskForm');
        console.log('showAddTaskForm:', showAddTaskForm);
        if (showAddTaskForm) {
            showAddTaskForm.addEventListener('click', () => this.openTaskModal());
        } else {
            console.warn('showAddTaskForm not found');
        }

        const showAddObstacleForm = document.getElementById('showAddObstacleForm');
        console.log('showAddObstacleForm:', showAddObstacleForm);
        if (showAddObstacleForm) {
            showAddObstacleForm.addEventListener('click', () => this.openObstacleModal());
        } else {
            console.warn('showAddObstacleForm not found');
        }
        
        const showAddGrandchildForm = document.getElementById('showAddGrandchildForm');
        if (showAddGrandchildForm) {
            showAddGrandchildForm.addEventListener('click', () => this.openGrandchildModal());
        } else {
            console.warn('showAddGrandchildForm not found');
        }

        // Modal close (outside click)
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        } else {
            console.warn('adminModal not found');
        }
    }
    
    handleAvatarSelect(event, type) {
        const file = event.target.files[0];
        if (file) {
            // Limit file size to 1MB
            if (file.size > 1024 * 1024) {
                alert('Image is too large. Please select an image smaller than 1MB.');
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById(`${type}AvatarPreview`);
                preview.src = e.target.result;
                preview.classList.add('visible');
                // Hide emoji if avatar is selected
                const emojiPreview = document.getElementById(`${type}EmojiPreview`);
                if (emojiPreview) {
                    emojiPreview.style.display = 'none';
                }
                this.selectedFile = e.target.result;
            };
            reader.onerror = () => {
                alert('Failed to read image file. Please try another image.');
                event.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    }
    
    clearAvatar(type) {
        const preview = document.getElementById(`${type}AvatarPreview`);
        const input = document.getElementById(`${type}Avatar`);
        if (preview) {
        preview.src = '';
        preview.classList.remove('visible');
        }
        if (input) input.value = '';
        // Show emoji back if applicable
        const emojiPreview = document.getElementById(`${type}EmojiPreview`);
        if (emojiPreview) emojiPreview.style.display = 'inline';
        this.selectedFile = null;
    }
    
    addTask() {
        const name = document.getElementById('taskName').value.trim();
        const guiltValue = parseInt(document.getElementById('taskGuiltSlider').value);
        const emoji = document.getElementById('taskEmojiPreview').textContent;
        // Strict validation
        if (!name || isNaN(guiltValue) || guiltValue < CONFIG.ADMIN.GUILT_SLIDER.MIN || guiltValue > CONFIG.ADMIN.GUILT_SLIDER.MAX) {
            alert('Please enter a valid task name and guilt value.');
            return false;
        }
            const task = {
                name,
                guiltValue,
                emoji: this.selectedFile ? null : emoji,
                avatar: this.selectedFile
            };
        console.log('Adding task:', task);
        // Save to localStorage
        const tasks = JSON.parse(localStorage.getItem(CONFIG.ADMIN.STORAGE_KEYS.TASKS)) || [];
        tasks.push(task);
        localStorage.setItem(CONFIG.ADMIN.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
        this.game.gameData.tasks = tasks;
            // Reset form
            document.getElementById('taskName').value = '';
            document.getElementById('taskGuiltSlider').value = CONFIG.ADMIN.GUILT_SLIDER.MIN;
            document.getElementById('taskGuiltValue').textContent = CONFIG.ADMIN.GUILT_SLIDER.MIN;
            document.getElementById('taskEmojiPreview').textContent = CONFIG.ENTITY.DEFAULT_TASK_EMOJI;
            this.clearAvatar('task');
            this.renderTasksList();
        return true;
    }
    
    addObstacle() {
        const name = document.getElementById('obstacleName').value.trim();
        const emoji = document.getElementById('obstacleEmojiPreview').textContent;
        if (!name) {
            alert('Please enter a valid obstacle name.');
            return false;
        }
            const obstacle = {
                name,
                emoji: this.selectedFile ? null : emoji,
                avatar: this.selectedFile
            };
        // Save to localStorage
        const obstacles = JSON.parse(localStorage.getItem(CONFIG.ADMIN.STORAGE_KEYS.OBSTACLES)) || [];
        obstacles.push(obstacle);
        localStorage.setItem(CONFIG.ADMIN.STORAGE_KEYS.OBSTACLES, JSON.stringify(obstacles));
        this.game.gameData.obstacles = obstacles;
            // Reset form
            document.getElementById('obstacleName').value = '';
            document.getElementById('obstacleEmojiPreview').textContent = CONFIG.ENTITY.DEFAULT_OBSTACLE_EMOJI;
            this.clearAvatar('obstacle');
        this.selectedFile = null;
            this.renderObstaclesList();
        return true;
    }
    
    async addGrandchild() {
        const name = document.getElementById('grandchildName').value.trim();
        
        if (!name) {
            alert('Please enter a valid grandchild name.');
            return false;
        }
        
        if (!this.selectedFile) {
            alert('Please upload an image for the grandchild.');
            return false;
        }
        
        const grandchild = {
            name,
            avatar: this.selectedFile
        };
        
        try {
            // Use DatabaseManager instead of localStorage
            await this.databaseManager.addGrandchild(grandchild);
            
            // Refresh the list from IndexedDB
            this.game.gameData.grandchildren = await this.databaseManager.getAllGrandchildren();
            this.renderGrandchildrenList();
            
            // Reset form
            document.getElementById('grandchildName').value = '';
            this.clearAvatar('grandchild');
            this.selectedFile = null;
            return true;
        } catch (error) {
            console.error('Error adding grandchild:', error);
            alert('Failed to add grandchild. Please try again.');
            return false;
        }
    }
    
    renderLists() {
        this.renderTasksList();
        this.renderObstaclesList();
        this.renderGrandchildrenList();
        
        // Ensure the admin panel has the grandchildren section
        this.setupGrandchildrenSection();
    }
    
    setupGrandchildrenSection() {
        const adminLists = document.querySelector('.admin-lists');
        
        // Check if grandchildren section already exists
        if (!document.getElementById('grandchildList')) {
            const grandchildSection = document.createElement('div');
            grandchildSection.className = 'admin-list-section';
            grandchildSection.innerHTML = `
                <h3>Grandchildren</h3>
                <div class="task-list" id="grandchildList"></div>
                <button class="add-btn" id="showAddGrandchildForm">Add Grandchild</button>
            `;
            adminLists.appendChild(grandchildSection);
            
            // Add event listener to the new button
            document.getElementById('showAddGrandchildForm').addEventListener('click', 
                () => this.openGrandchildModal());
        }
    }
    
    renderTasksList() {
        // Always reload from localStorage
        this.game.gameData.tasks = JSON.parse(localStorage.getItem(CONFIG.ADMIN.STORAGE_KEYS.TASKS)) || [];
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        this.game.gameData.tasks.forEach((task, index) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            const displayElement = task.avatar ? 
                `<img src="${task.avatar}" class="item-avatar" alt="${task.name}">` :
                `<span class="item-emoji">${task.emoji}</span>`;
            taskItem.innerHTML = `
                ${displayElement}
                <span class="task-details">
                    <span class="task-name">${task.name}</span>
                    <span class="task-guilt">-${task.guiltValue}</span>
                </span>
                <button class="delete-btn" onclick="window.adminPanel.removeTask(${index})">×</button>
            `;
            taskList.appendChild(taskItem);
        });
    }
    
    renderObstaclesList() {
        // Always reload from localStorage
        this.game.gameData.obstacles = JSON.parse(localStorage.getItem(CONFIG.ADMIN.STORAGE_KEYS.OBSTACLES)) || [];
        const obstacleList = document.getElementById('obstacleList');
        obstacleList.innerHTML = '';
        this.game.gameData.obstacles.forEach((obstacle, index) => {
            const obstacleItem = document.createElement('div');
            obstacleItem.className = 'task-item obstacle-item';
            const displayElement = obstacle.avatar ? 
                `<img src="${obstacle.avatar}" class="item-avatar" alt="${obstacle.name}">` :
                `<div class="obstacle-emoji-wrapper"><span class="item-emoji obstacle-emoji">${obstacle.emoji}</span></div>`;
            obstacleItem.innerHTML = `
                ${displayElement}
                <div class="obstacle-name-wrapper">
                <span class="obstacle-name">${obstacle.name}</span>
                </div>
                <button class="delete-btn" onclick="window.adminPanel.removeObstacle(${index})">×</button>
            `;
            obstacleList.appendChild(obstacleItem);
        });
    }
    
    renderGrandchildrenList() {
        // Always reload from localStorage
        this.game.gameData.grandchildren = JSON.parse(localStorage.getItem(CONFIG.ADMIN.STORAGE_KEYS.GRANDCHILDREN)) || [];
        const grandchildList = document.getElementById('grandchildList');
        if (!grandchildList) return;
        
        grandchildList.innerHTML = '';
        this.game.gameData.grandchildren.forEach((grandchild, index) => {
            const grandchildItem = document.createElement('div');
            grandchildItem.className = 'task-item grandchild-item';
            grandchildItem.innerHTML = `
                <img src="${grandchild.avatar}" class="item-avatar" alt="${grandchild.name}">
                <div class="grandchild-name-wrapper">
                    <span class="grandchild-name">${grandchild.name}</span>
                </div>
                <button class="delete-btn" onclick="window.adminPanel.removeGrandchild(${index})">×</button>
            `;
            grandchildList.appendChild(grandchildItem);
        });
    }
    
    removeTask(index) {
        // Always reload from localStorage
        const tasks = JSON.parse(localStorage.getItem(CONFIG.ADMIN.STORAGE_KEYS.TASKS)) || [];
        tasks.splice(index, 1);
        localStorage.setItem(CONFIG.ADMIN.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
        this.game.gameData.tasks = tasks;
        this.renderTasksList();
    }
    
    removeObstacle(index) {
        // Always reload from localStorage
        const obstacles = JSON.parse(localStorage.getItem(CONFIG.ADMIN.STORAGE_KEYS.OBSTACLES)) || [];
        obstacles.splice(index, 1);
        localStorage.setItem(CONFIG.ADMIN.STORAGE_KEYS.OBSTACLES, JSON.stringify(obstacles));
        this.game.gameData.obstacles = obstacles;
        this.renderObstaclesList();
    }
    
    async removeGrandchild(id) {
        try {
            await this.databaseManager.deleteGrandchild(id);
            this.game.gameData.grandchildren = await this.databaseManager.getAllGrandchildren();
            this.renderGrandchildrenList();
        } catch (error) {
            console.error('Error deleting grandchild:', error);
        }
    }

    openTaskModal() {
        this.modalContent.innerHTML = this.getTaskFormHTML();
        this.modal.classList.add('visible');
        this.setupTaskFormEvents();
    }
    
    openObstacleModal() {
        this.modalContent.innerHTML = this.getObstacleFormHTML();
        this.modal.classList.add('visible');
        this.setupObstacleFormEvents();
    }
    
    openGrandchildModal() {
        this.modalContent.innerHTML = this.getGrandchildFormHTML();
        this.modal.classList.add('visible');
        this.setupGrandchildFormEvents();
    }
    
    closeModal() {
        this.modal.classList.remove('visible');
        this.clearAvatar('task');
        this.clearAvatar('obstacle');
        this.clearAvatar('grandchild');
        this.selectedFile = null;
    }
    
    getTaskFormHTML() {
        return `
            <button class="close-btn" id="closeTaskModal">×</button>
            <h3>Add New Task</h3>
            <div class="task-form">
                <div class="form-group">
                    <label for="taskName">Task Name:</label>
                    <input type="text" id="taskName" placeholder="Enter task name">
                </div>
                <div class="form-group">
                    <label for="taskGuiltSlider">Guilt Value:</label>
                    <div class="slider-container">
                        <input type="range" id="taskGuiltSlider" min="1" max="10" step="1" value="1">
                        <span id="taskGuiltValue">1</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Display Type:</label>
                    <div class="display-options">
                        <div class="emoji-picker">
                            <button id="taskEmojiBtn" class="emoji-btn">Choose Emoji</button>
                            <span id="taskEmojiPreview" class="emoji-preview">✅</span>
                        </div>
                        <div class="avatar-upload">
                            <label for="taskAvatar" class="file-label">Upload Avatar</label>
                            <input type="file" id="taskAvatar" accept="image/*">
                            <button id="clearTaskAvatar" class="clear-btn">Clear</button>
                            <img id="taskAvatarPreview" class="avatar-preview" src="" alt="">
                        </div>
                    </div>
                </div>
                <button id="addTaskBtn" class="add-btn">Add Task</button>
            </div>
        `;
    }
    
    getObstacleFormHTML() {
        return `
            <button class="close-btn" id="closeObstacleModal">×</button>
            <h3>Add New Obstacle</h3>
            <div class="task-form">
                <div class="form-group">
                    <label for="obstacleName">Obstacle Name:</label>
                    <input type="text" id="obstacleName" placeholder="Enter obstacle name">
                </div>
                <div class="form-group">
                    <label>Display Type:</label>
                    <div class="display-options">
                        <div class="emoji-picker">
                            <button id="obstacleEmojiBtn" class="emoji-btn">Choose Emoji</button>
                            <span id="obstacleEmojiPreview" class="emoji-preview">⚠️</span>
                        </div>
                        <div class="avatar-upload">
                            <label for="obstacleAvatar" class="file-label">Upload Avatar</label>
                            <input type="file" id="obstacleAvatar" accept="image/*">
                            <button id="clearObstacleAvatar" class="clear-btn">Clear</button>
                            <img id="obstacleAvatarPreview" class="avatar-preview" src="" alt="">
                        </div>
                    </div>
                </div>
                <button id="addObstacleBtn" class="add-btn">Add Obstacle</button>
            </div>
        `;
    }
    
    getGrandchildFormHTML() {
        return `
            <button class="close-btn" id="closeGrandchildModal">×</button>
            <h3>Add New Grandchild</h3>
            <div class="task-form grandchild-form">
                <div class="form-group">
                    <label for="grandchildName">Grandchild Name:</label>
                    <input type="text" id="grandchildName" placeholder="Enter grandchild name">
                </div>
                <div class="form-group">
                    <label>Image Upload (Required):</label>
                    <div class="display-options">
                        <div class="avatar-upload fullwidth">
                            <label for="grandchildAvatar" class="file-label">Upload Image</label>
                            <input type="file" id="grandchildAvatar" accept="image/*" required>
                            <button id="clearGrandchildAvatar" class="clear-btn">Clear</button>
                            <img id="grandchildAvatarPreview" class="avatar-preview" src="" alt="">
                        </div>
                    </div>
                </div>
                <button id="addGrandchildBtn" class="add-btn">Add Grandchild</button>
            </div>
        `;
    }
    
    setupTaskFormEvents() {
        document.getElementById('closeTaskModal').addEventListener('click', () => this.closeModal());
        const addTaskBtn = document.getElementById('addTaskBtn');
        // Remove previous listeners by cloning the node
        const newAddTaskBtn = addTaskBtn.cloneNode(true);
        addTaskBtn.parentNode.replaceChild(newAddTaskBtn, addTaskBtn);
        newAddTaskBtn.addEventListener('click', () => {
            if (this.addTask()) {
                this.closeModal();
            }
        });
        document.getElementById('taskAvatar').addEventListener('change', (e) => this.handleAvatarSelect(e, 'task'));
        document.getElementById('clearTaskAvatar').addEventListener('click', () => this.clearAvatar('task'));
        document.getElementById('taskGuiltSlider').addEventListener('input', (e) => {
            document.getElementById('taskGuiltValue').textContent = e.target.value;
        });
        // Emoji picker setup for modal
        if (!this.taskEmojiPicker) {
            this.taskEmojiPicker = document.createElement('emoji-picker');
            this.taskEmojiPicker.style.display = 'none';
            this.taskEmojiPicker.style.position = 'absolute';
            this.taskEmojiPicker.style.zIndex = '3001';
            document.body.appendChild(this.taskEmojiPicker);
        }
        const emojiBtn = document.getElementById('taskEmojiBtn');
        emojiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const rect = emojiBtn.getBoundingClientRect();
            this.taskEmojiPicker.style.display = 'block';
            this.taskEmojiPicker.style.top = `${rect.bottom + window.scrollY}px`;
            this.taskEmojiPicker.style.left = `${rect.left + window.scrollX}px`;
        });
        this.taskEmojiPicker.addEventListener('emoji-click', (e) => {
            document.getElementById('taskEmojiPreview').textContent = e.detail.unicode;
            this.taskEmojiPicker.style.display = 'none';
        });
        // Hide picker when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (!this.taskEmojiPicker.contains(e.target) && e.target !== emojiBtn) {
                this.taskEmojiPicker.style.display = 'none';
            }
        });
    }
    
    setupObstacleFormEvents() {
        document.getElementById('closeObstacleModal').addEventListener('click', () => this.closeModal());
        const addObstacleBtn = document.getElementById('addObstacleBtn');
        // Remove previous listeners by cloning the node
        const newAddObstacleBtn = addObstacleBtn.cloneNode(true);
        addObstacleBtn.parentNode.replaceChild(newAddObstacleBtn, addObstacleBtn);
        newAddObstacleBtn.addEventListener('click', () => {
            const name = document.getElementById('obstacleName').value.trim();
            if (name) {
                console.log('addObstacle called');
                this.addObstacle();
                this.closeModal();
            }
        });
        document.getElementById('obstacleAvatar').addEventListener('change', (e) => this.handleAvatarSelect(e, 'obstacle'));
        document.getElementById('clearObstacleAvatar').addEventListener('click', () => this.clearAvatar('obstacle'));
        // Emoji picker setup for modal
        if (!this.obstacleEmojiPicker) {
            this.obstacleEmojiPicker = document.createElement('emoji-picker');
            this.obstacleEmojiPicker.style.display = 'none';
            this.obstacleEmojiPicker.style.position = 'absolute';
            this.obstacleEmojiPicker.style.zIndex = '3001';
            document.body.appendChild(this.obstacleEmojiPicker);
        }
        const emojiBtn = document.getElementById('obstacleEmojiBtn');
        emojiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const rect = emojiBtn.getBoundingClientRect();
            this.obstacleEmojiPicker.style.display = 'block';
            this.obstacleEmojiPicker.style.top = `${rect.bottom + window.scrollY}px`;
            this.obstacleEmojiPicker.style.left = `${rect.left + window.scrollX}px`;
        });
        this.obstacleEmojiPicker.addEventListener('emoji-click', (e) => {
            document.getElementById('obstacleEmojiPreview').textContent = e.detail.unicode;
            this.obstacleEmojiPicker.style.display = 'none';
        });
        // Hide picker when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (!this.obstacleEmojiPicker.contains(e.target) && e.target !== emojiBtn) {
                this.obstacleEmojiPicker.style.display = 'none';
            }
        });
    }
    
    setupGrandchildFormEvents() {
        document.getElementById('closeGrandchildModal').addEventListener('click', () => this.closeModal());
        const addGrandchildBtn = document.getElementById('addGrandchildBtn');
        // Remove previous listeners by cloning the node
        const newAddGrandchildBtn = addGrandchildBtn.cloneNode(true);
        addGrandchildBtn.parentNode.replaceChild(newAddGrandchildBtn, addGrandchildBtn);
        newAddGrandchildBtn.addEventListener('click', () => {
            if (this.addGrandchild()) {
                this.closeModal();
            }
        });
        document.getElementById('grandchildAvatar').addEventListener('change', (e) => this.handleAvatarSelect(e, 'grandchild'));
        document.getElementById('clearGrandchildAvatar').addEventListener('click', () => this.clearAvatar('grandchild'));
    }
} 