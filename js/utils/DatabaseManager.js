// Database Manager for Guilty Runner
// Handles all IndexedDB operations for storing game entities

export class DatabaseManager {
    constructor() {
        this.dbName = 'GameDataDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('obstacles')) {
                    db.createObjectStore('obstacles', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('grandchildren')) {
                    db.createObjectStore('grandchildren', { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async addTask(task) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('tasks', 'readwrite');
            const store = transaction.objectStore('tasks');
            const request = store.add(task);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async addObstacle(obstacle) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('obstacles', 'readwrite');
            const store = transaction.objectStore('obstacles');
            const request = store.add(obstacle);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async addGrandchild(grandchild) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('grandchildren', 'readwrite');
            const store = transaction.objectStore('grandchildren');
            const request = store.add(grandchild);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAllTasks() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('tasks', 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAllObstacles() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('obstacles', 'readonly');
            const store = transaction.objectStore('obstacles');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAllGrandchildren() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('grandchildren', 'readonly');
            const store = transaction.objectStore('grandchildren');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async deleteTask(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('tasks', 'readwrite');
            const store = transaction.objectStore('tasks');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async deleteObstacle(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('obstacles', 'readwrite');
            const store = transaction.objectStore('obstacles');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async deleteGrandchild(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('grandchildren', 'readwrite');
            const store = transaction.objectStore('grandchildren');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Helper method to convert data URL to Blob
    dataURLToBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], {type: mime});
    }

    // Helper method to create object URL from blob for display
    createImageURL(blob) {
        return URL.createObjectURL(blob);
    }

    // Helper method to revoke an object URL when no longer needed
    revokeImageURL(url) {
        URL.revokeObjectURL(url);
    }

    // This method helps migrate data from localStorage to IndexedDB (one-time)
    async migrateFromLocalStorage() {
        // Check if we've already migrated
        const migrated = localStorage.getItem('dbMigrationComplete');
        if (migrated) return;
        
        try {
            // Migrate tasks
            const tasksJson = localStorage.getItem('guiltyRunnerTasks');
            if (tasksJson) {
                const tasks = JSON.parse(tasksJson);
                for (const task of tasks) {
                    // Convert data URL to Blob if it exists
                    if (task.avatar) {
                        task.imageBlob = this.dataURLToBlob(task.avatar);
                        delete task.avatar; // Remove the data URL to save space
                    }
                    await this.addTask(task);
                }
            }
            
            // Migrate obstacles
            const obstaclesJson = localStorage.getItem('guiltyRunnerObstacles');
            if (obstaclesJson) {
                const obstacles = JSON.parse(obstaclesJson);
                for (const obstacle of obstacles) {
                    // Convert data URL to Blob if it exists
                    if (obstacle.avatar) {
                        obstacle.imageBlob = this.dataURLToBlob(obstacle.avatar);
                        delete obstacle.avatar; // Remove the data URL to save space
                    }
                    await this.addObstacle(obstacle);
                }
            }
            
            // Migrate grandchildren
            const grandchildrenJson = localStorage.getItem('guiltyRunnerGrandchildren');
            if (grandchildrenJson) {
                const grandchildren = JSON.parse(grandchildrenJson);
                for (const grandchild of grandchildren) {
                    // Convert data URL to Blob if it exists
                    if (grandchild.avatar) {
                        grandchild.imageBlob = this.dataURLToBlob(grandchild.avatar);
                        delete grandchild.avatar; // Remove the data URL to save space
                    }
                    await this.addGrandchild(grandchild);
                }
            }
            
            // Mark migration as complete
            localStorage.setItem('dbMigrationComplete', 'true');
            console.log('Migration from localStorage to IndexedDB complete');
            
        } catch (error) {
            console.error('Error during migration:', error);
        }
    }

    async getGrandchildrenFromDB() {
        const transaction = this.db.transaction([this.STORES.GRANDCHILDREN], 'readonly');
        const objectStore = transaction.objectStore(this.STORES.GRANDCHILDREN);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const grandchildren = event.target.result;
            console.log('Retrieved grandchildren:', grandchildren);
            // Update your game data with the retrieved grandchildren
            game.gameData.grandchildren = grandchildren;
        };

        request.onerror = (event) => {
            console.error('Error retrieving grandchildren:', event.target.error);
        };
    }

    setupEventListeners() {
        // ... other event listeners ...
        
        // Update delete button event delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') && e.target.closest('#grandchildList')) {
                const id = parseInt(e.target.dataset.id);
                this.removeGrandchild(id);
            }
        });
    }
}

export const databaseManager = new DatabaseManager(); 