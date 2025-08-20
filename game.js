class TempestGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Tube properties
        this.tubeRadius = 200;
        this.tubeSegments = 16; // Number of segments around the tube
        this.tubeDepth = 20; // Number of depth levels
        this.scrollSpeed = 2;
        this.currentScroll = 0;
        
        // Player
        this.player = {
            segment: 0, // Which segment around the tube (0-15)
            depth: this.tubeDepth - 1, // Always at the bottom
            color: '#00ff00'
        };
        
        // Projectiles
        this.playerBullets = [];
        this.enemyBullets = [];
        
        // Enemies
        this.enemies = [];
        this.enemyTypes = [
            { color: '#ff0000', points: 100, speed: 1 },
            { color: '#ff6600', points: 150, speed: 2 },
            { color: '#ffff00', points: 200, speed: 3 }
        ];
        
        // Game mechanics
        this.keys = {};
        this.lastShot = 0;
        this.shotCooldown = 200;
        this.enemySpawnRate = 2000;
        this.lastEnemySpawn = 0;
        
        this.setupEventListeners();
        this.spawnInitialEnemies();
        this.gameLoop();
    }
    
    // Convert 3D tube coordinates to 2D screen coordinates
    tubeToScreen(segment, depth) {
        const angle = (segment / this.tubeSegments) * Math.PI * 2;
        const radius = this.tubeRadius * (depth / this.tubeDepth);
        const x = this.width / 2 + Math.cos(angle) * radius;
        const y = this.height / 2 + Math.sin(angle) * radius;
        return { x, y };
    }
    
    // Get distance between two tube positions
    getTubeDistance(seg1, depth1, seg2, depth2) {
        const angle1 = (seg1 / this.tubeSegments) * Math.PI * 2;
        const angle2 = (seg2 / this.tubeSegments) * Math.PI * 2;
        const angleDiff = Math.abs(angle1 - angle2);
        const depthDiff = Math.abs(depth1 - depth2);
        
        // Wrap around the tube
        const wrappedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        return Math.sqrt(wrappedAngleDiff * wrappedAngleDiff + depthDiff * depthDiff);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyP') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    spawnInitialEnemies() {
        for (let i = 0; i < 8; i++) {
            this.spawnEnemy();
        }
    }
    
    spawnEnemy() {
        const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
        const segment = Math.floor(Math.random() * this.tubeSegments);
        const depth = Math.floor(Math.random() * 5) + 2; // Spawn between depth 2-6 (further away)
        
        this.enemies.push({
            segment: segment,
            depth: depth,
            speed: type.speed,
            color: type.color,
            points: type.points,
            health: 1
        });
    }
    
    updatePlayer() {
        // Direct responsive movement - no inertia
        if (this.keys['ArrowLeft']) {
            this.player.segment = (this.player.segment - 1 + this.tubeSegments) % this.tubeSegments;
        }
        if (this.keys['ArrowRight']) {
            this.player.segment = (this.player.segment + 1) % this.tubeSegments;
        }
        
        // Shooting
        if (this.keys['Space'] && Date.now() - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = Date.now();
        }
    }
    
    shoot() {
        this.playerBullets.push({
            segment: this.player.segment,
            depth: this.player.depth,
            speed: 8,
            color: '#00ffff',
            // Bullets travel in a straight line toward the center
            targetSegment: this.player.segment,
            targetDepth: 0
        });
    }
    
    updateBullets() {
        // Update player bullets (move toward center of tube)
        this.playerBullets = this.playerBullets.filter(bullet => {
            bullet.depth -= bullet.speed * 0.1;
            return bullet.depth > 0;
        });
        
        // Update enemy bullets (move toward player)
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.depth += bullet.speed * 0.1;
            return bullet.depth < this.tubeDepth;
        });
    }
    
    updateEnemies() {
        // Spawn new enemies
        if (Date.now() - this.lastEnemySpawn > this.enemySpawnRate) {
            this.spawnEnemy();
            this.lastEnemySpawn = Date.now();
        }
        
        // Update existing enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.depth += enemy.speed * 0.02; // Slower movement toward player
            
            // Enemy shooting (less frequent)
            if (Math.random() < 0.002) {
                this.enemyBullets.push({
                    segment: enemy.segment,
                    depth: enemy.depth,
                    speed: 2,
                    color: '#ff0000'
                });
            }
            
            return enemy.depth < this.tubeDepth;
        });
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        this.playerBullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                // Check if bullet and enemy are at the same segment and similar depth
                const segmentDiff = Math.abs(bullet.segment - enemy.segment);
                const wrappedSegmentDiff = Math.min(segmentDiff, this.tubeSegments - segmentDiff);
                const depthDiff = Math.abs(bullet.depth - enemy.depth);
                
                // More lenient collision detection for 3D space
                if (wrappedSegmentDiff <= 1 && depthDiff < 3) {
                    enemy.health--;
                    this.playerBullets.splice(bulletIndex, 1);
                    
                    if (enemy.health <= 0) {
                        this.score += enemy.points;
                        this.enemies.splice(enemyIndex, 1);
                        this.updateUI();
                    }
                }
            });
        });
        
        // Enemy bullets vs player
        this.enemyBullets.forEach((bullet, index) => {
            const segmentDiff = Math.abs(bullet.segment - this.player.segment);
            const wrappedSegmentDiff = Math.min(segmentDiff, this.tubeSegments - segmentDiff);
            const depthDiff = Math.abs(bullet.depth - this.player.depth);
            
            if (wrappedSegmentDiff <= 1 && depthDiff < 2) {
                this.lives--;
                this.enemyBullets.splice(index, 1);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        });
        
        // Enemies vs player
        this.enemies.forEach((enemy, index) => {
            const segmentDiff = Math.abs(enemy.segment - this.player.segment);
            const wrappedSegmentDiff = Math.min(segmentDiff, this.tubeSegments - segmentDiff);
            const depthDiff = Math.abs(enemy.depth - this.player.depth);
            
            if (wrappedSegmentDiff <= 1 && depthDiff < 2) {
                this.lives--;
                this.enemies.splice(index, 1);
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        });
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    restart() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.player.segment = 0;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.lastShot = 0;
        this.lastEnemySpawn = 0;
        
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        this.updateUI();
        this.spawnInitialEnemies();
    }
    
    drawTube() {
        // Draw tube segments
        for (let depth = 0; depth < this.tubeDepth; depth++) {
            const radius = this.tubeRadius * (depth / this.tubeDepth);
            const alpha = 0.1 + (depth / this.tubeDepth) * 0.3;
            
            this.ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            for (let segment = 0; segment <= this.tubeSegments; segment++) {
                const angle = (segment / this.tubeSegments) * Math.PI * 2;
                const x = this.width / 2 + Math.cos(angle) * radius;
                const y = this.height / 2 + Math.sin(angle) * radius;
                
                if (segment === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        
        // Draw radial lines
        for (let segment = 0; segment < this.tubeSegments; segment++) {
            const angle = (segment / this.tubeSegments) * Math.PI * 2;
            const x1 = this.width / 2 + Math.cos(angle) * (this.tubeRadius * 0.1);
            const y1 = this.height / 2 + Math.sin(angle) * (this.tubeRadius * 0.1);
            const x2 = this.width / 2 + Math.cos(angle) * this.tubeRadius;
            const y2 = this.height / 2 + Math.sin(angle) * this.tubeRadius;
            
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }
    
    drawPlayer() {
        const pos = this.tubeToScreen(this.player.segment, this.player.depth);
        const size = 15;
        
        // Player glow
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        this.ctx.shadowBlur = 0;
    }
    
    drawBullets() {
        // Draw player bullets
        this.playerBullets.forEach(bullet => {
            const pos = this.tubeToScreen(bullet.segment, bullet.depth);
            const size = Math.max(2, 6 - bullet.depth * 0.3); // Bullets get smaller as they travel
            
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });
        
        // Draw enemy bullets
        this.enemyBullets.forEach(bullet => {
            const pos = this.tubeToScreen(bullet.segment, bullet.depth);
            const size = Math.max(2, 4 + bullet.depth * 0.2); // Bullets get larger as they approach
            
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const pos = this.tubeToScreen(enemy.segment, enemy.depth);
            const size = Math.max(8, 20 - enemy.depth * 1.5); // Enemies get larger as they approach
            
            // Enemy glow
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 8;
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
            this.ctx.shadowBlur = 0;
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw tube
        this.drawTube();
        
        // Draw game objects
        this.drawEnemies();
        this.drawBullets();
        this.drawPlayer();
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.checkCollisions();
        
        // Level progression
        if (this.enemies.length === 0 && this.score > this.level * 1000) {
            this.level++;
            this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 100);
            this.spawnInitialEnemies();
            this.updateUI();
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new TempestGame();
});
