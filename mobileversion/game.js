class TempestGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'playing';
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        
        // Tube properties
        this.tubeRadius = 200;
        this.tubeSegments = 16; // Number of segments around the tube
        this.tubeDepth = 20; // Number of depth levels
        this.scrollSpeed = 0.1; // Speed of tube scrolling
        this.currentScroll = 0; // Current scroll offset
        
        // Player
        this.player = {
            segment: 0, // Which segment around the tube (0-15)
            depth: this.tubeDepth - 1, // Start at the bottom
            color: '#00ff00',
            lastMoveTime: 0, // Track when we last moved
            moveCooldown: 150, // Milliseconds between moves
            depthMoveCooldown: 100, // Faster cooldown for depth movement
            invulnerable: false, // Invulnerability state
            invulnerabilityTime: 0 // When invulnerability ends
        };
        
        // Mobile motion controls
        this.motionData = {
            alpha: 0, // Yaw (rotation around Z-axis)
            beta: 0,  // Pitch (rotation around X-axis)
            gamma: 0, // Roll (rotation around Y-axis)
            isCalibrated: false,
            calibrationOffset: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // Projectiles
        this.playerBullets = [];
        this.enemyBullets = [];
        
        // Enemies
        this.enemies = [];
        this.enemyTypes = [
            { color: '#ff0000', points: 100, speed: 1, health: 1 },
            { color: '#ff6600', points: 150, speed: 2, health: 3 },
            { color: '#ffff00', points: 200, speed: 3, health: 1 }
        ];
        
        // Power-ups
        this.powerUps = [];
        this.powerUpSpawnRate = 5000; // Spawn every 5 seconds
        this.lastPowerUpSpawn = 0;
        
        // Game mechanics
        this.keys = {};
        this.lastShot = 0;
        this.shotCooldown = 200;
        this.enemySpawnRate = 2000;
        this.lastEnemySpawn = 0;
        
        this.setupEventListeners();
        this.setupMotionControls();
        this.spawnInitialEnemies();
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 40; // Account for padding
        const containerHeight = window.innerHeight * 0.7; // 70% of viewport height
        
        this.canvas.width = Math.min(containerWidth, containerHeight * 1.33); // 4:3 aspect ratio
        this.canvas.height = this.canvas.width / 1.33;
        
        // Update tube radius based on canvas size
        this.tubeRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
    }
    
    // Convert 3D tube coordinates to 2D screen coordinates
    tubeToScreen(segment, depth) {
        const angle = (segment / this.tubeSegments) * Math.PI * 2;
        
        // Create spiral effect: radius increases exponentially as depth increases
        const spiralFactor = 1 + (depth / this.tubeDepth) * 2; // Makes the spiral widen more dramatically
        const radius = this.tubeRadius * (depth / this.tubeDepth) * spiralFactor;
        
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
        
        // Fullscreen button
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (!this.isFullscreen) {
                this.resizeCanvas();
            }
        });
        
        // Fullscreen change event
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
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
        // Spawn more enemies based on level
        const baseEnemies = 8;
        const enemiesPerLevel = 3;
        const totalEnemies = baseEnemies + (this.level - 1) * enemiesPerLevel;
        
        for (let i = 0; i < totalEnemies; i++) {
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
            health: type.health // Use the health from enemy type
        });
    }
    
    spawnPowerUp() {
        const segment = Math.floor(Math.random() * this.tubeSegments);
        const depth = Math.floor(Math.random() * 5) + 2;
        
        this.powerUps.push({
            segment: segment,
            depth: depth,
            color: '#0088ff',
            healAmount: 25
        });
    }
    
    setupMotionControls() {
        // Check if device motion is supported
        if (window.DeviceMotionEvent || window.DeviceOrientationEvent) {
            // Request permission for iOS devices
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                this.showMotionPermissionDialog();
            } else {
                this.startMotionTracking();
            }
        } else {
            console.log('Device motion not supported');
            this.setupTouchControls();
            this.showMotionNotSupportedMessage();
        }
    }
    
    showMotionNotSupportedMessage() {
        const message = document.createElement('div');
        message.className = 'motion-not-supported';
        message.innerHTML = `
            <div class="permission-content">
                <h3>Motion Controls Not Available</h3>
                <p>Your device doesn't support motion sensors or they're not enabled.</p>
                <p>You can still play using touch controls - tap the screen to fire!</p>
                <button onclick="this.parentElement.parentElement.remove()" class="permission-btn">OK</button>
            </div>
        `;
        document.body.appendChild(message);
    }
    
    showMotionPermissionDialog() {
        const permissionDialog = document.createElement('div');
        permissionDialog.className = 'motion-permission-dialog';
        permissionDialog.innerHTML = `
            <div class="permission-content">
                <h3>Motion Controls</h3>
                <p>This game uses your device's motion sensors for controls:</p>
                <ul>
                    <li><strong>Tilt Left/Right:</strong> Move ship around the tube</li>
                    <li><strong>Tilt Forward/Back:</strong> Move ship in/out</li>
                    <li><strong>Tap Screen:</strong> Fire weapon</li>
                </ul>
                <p>Please allow motion access to play with tilt controls.</p>
                <button id="enableMotionBtn" class="permission-btn">Enable Motion Controls</button>
                <button id="skipMotionBtn" class="permission-btn secondary">Skip (Use Touch)</button>
            </div>
        `;
        document.body.appendChild(permissionDialog);
        
        document.getElementById('enableMotionBtn').addEventListener('click', () => {
            DeviceMotionEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {
                    this.startMotionTracking();
                    permissionDialog.remove();
                } else {
                    this.setupTouchControls();
                    permissionDialog.remove();
                }
            }).catch(() => {
                this.setupTouchControls();
                permissionDialog.remove();
            });
        });
        
        document.getElementById('skipMotionBtn').addEventListener('click', () => {
            this.setupTouchControls();
            permissionDialog.remove();
        });
    }
    
    startMotionTracking() {
        window.addEventListener('deviceorientation', (event) => {
            if (!this.motionData.isCalibrated) {
                // Calibrate on first reading
                this.motionData.calibrationOffset.alpha = event.alpha || 0;
                this.motionData.calibrationOffset.beta = event.beta || 0;
                this.motionData.calibrationOffset.gamma = event.gamma || 0;
                this.motionData.isCalibrated = true;
                this.showCalibrationSuccess();
            }
            
            // Store calibrated motion data
            this.motionData.alpha = (event.alpha || 0) - this.motionData.calibrationOffset.alpha;
            this.motionData.beta = (event.beta || 0) - this.motionData.calibrationOffset.beta;
            this.motionData.gamma = (event.gamma || 0) - this.motionData.calibrationOffset.gamma;
            
            // Update motion indicator for debugging
            this.updateMotionIndicator();
        });
        
        // Also set up touch controls for firing
        this.setupTouchControls();
        
        // Add recalibration button
        this.addRecalibrationButton();
    }
    
    showCalibrationSuccess() {
        const message = document.createElement('div');
        message.className = 'calibration-success';
        message.innerHTML = `
            <div class="permission-content">
                <h3>Motion Controls Active!</h3>
                <p>Your device has been calibrated. Tilt to move, tap to fire!</p>
                <button onclick="this.parentElement.parentElement.remove()" class="permission-btn">Start Playing</button>
            </div>
        `;
        document.body.appendChild(message);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 3000);
    }
    
    addRecalibrationButton() {
        const recalibrateBtn = document.createElement('button');
        recalibrateBtn.id = 'recalibrateBtn';
        recalibrateBtn.className = 'control-btn';
        recalibrateBtn.textContent = 'Recalibrate Motion';
        recalibrateBtn.style.position = 'fixed';
        recalibrateBtn.style.bottom = '10px';
        recalibrateBtn.style.right = '10px';
        recalibrateBtn.style.zIndex = '100';
        
        recalibrateBtn.addEventListener('click', () => {
            this.recalibrateMotion();
        });
        
        document.body.appendChild(recalibrateBtn);
    }
    
    recalibrateMotion() {
        this.motionData.isCalibrated = false;
        this.motionData.calibrationOffset = { alpha: 0, beta: 0, gamma: 0 };
        
        const message = document.createElement('div');
        message.className = 'calibration-success';
        message.innerHTML = `
            <div class="permission-content">
                <h3>Recalibrating...</h3>
                <p>Hold your device flat and level, then tilt to move.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="permission-btn">OK</button>
            </div>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 2000);
    }
    
    updateMotionIndicator() {
        const indicator = document.getElementById('motionIndicator');
        const alphaSpan = document.getElementById('alphaValue');
        const betaSpan = document.getElementById('betaValue');
        const gammaSpan = document.getElementById('gammaValue');
        
        if (indicator && alphaSpan && betaSpan && gammaSpan) {
            alphaSpan.textContent = Math.round(this.motionData.alpha);
            betaSpan.textContent = Math.round(this.motionData.beta);
            gammaSpan.textContent = Math.round(this.motionData.gamma);
            
            // Show indicator if motion is active (for debugging)
            if (Math.abs(this.motionData.gamma) > 5 || Math.abs(this.motionData.beta) > 5) {
                indicator.classList.add('show');
            } else {
                indicator.classList.remove('show');
            }
        }
    }
    
    setupTouchControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shoot();
        });
        
        // Add visual touch indicator
        this.canvas.style.cursor = 'pointer';
    }
    
    updatePlayer() {
        const currentTime = Date.now();
        
        // Check if invulnerability has expired
        if (this.player.invulnerable && currentTime > this.player.invulnerabilityTime) {
            this.player.invulnerable = false;
        }
        
        // Use motion controls if available, otherwise fall back to keyboard
        if (this.motionData.isCalibrated) {
            this.updatePlayerMotion();
        } else {
            this.updatePlayerKeyboard();
        }
        
        // Constrain player to visible screen area
        this.constrainPlayerToScreen();
        
        // Shooting (handled by touch events for mobile)
        if (this.keys['Space'] && currentTime - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = currentTime;
        }
    }
    
    updatePlayerMotion() {
        const currentTime = Date.now();
        const deadZone = 8; // Reduced dead zone for more responsive controls
        const sensitivity = 1.0; // Increased sensitivity
        
        // Horizontal movement (roll - gamma)
        if (Math.abs(this.motionData.gamma) > deadZone) {
            if (this.motionData.gamma > deadZone && currentTime - this.player.lastMoveTime > this.player.moveCooldown) {
                this.player.segment = (this.player.segment + 1) % this.tubeSegments;
                this.player.lastMoveTime = currentTime;
            } else if (this.motionData.gamma < -deadZone && currentTime - this.player.lastMoveTime > this.player.moveCooldown) {
                this.player.segment = (this.player.segment - 1 + this.tubeSegments) % this.tubeSegments;
                this.player.lastMoveTime = currentTime;
            }
        }
        
        // Vertical movement (pitch - beta)
        if (Math.abs(this.motionData.beta) > deadZone) {
            if (this.motionData.beta > deadZone && currentTime - this.player.lastMoveTime > this.player.depthMoveCooldown) {
                // Tilt forward - move toward center (decrease depth)
                this.player.depth = Math.max(0, this.player.depth - 1);
                this.player.lastMoveTime = currentTime;
            } else if (this.motionData.beta < -deadZone && currentTime - this.player.lastMoveTime > this.player.depthMoveCooldown) {
                // Tilt back - move toward outside (increase depth)
                this.player.depth = Math.min(this.tubeDepth - 1, this.player.depth + 1);
                this.player.lastMoveTime = currentTime;
            }
        }
    }
    
    updatePlayerKeyboard() {
        const currentTime = Date.now();
        
        // Horizontal movement (left/right) with cooldown
        if (this.keys['ArrowLeft'] && currentTime - this.player.lastMoveTime > this.player.moveCooldown) {
            this.player.segment = (this.player.segment - 1 + this.tubeSegments) % this.tubeSegments;
            this.player.lastMoveTime = currentTime;
        }
        if (this.keys['ArrowRight'] && currentTime - this.player.lastMoveTime > this.player.moveCooldown) {
            this.player.segment = (this.player.segment + 1) % this.tubeSegments;
            this.player.lastMoveTime = currentTime;
        }
        
        // Vertical movement (up/down) with separate cooldown
        if (this.keys['ArrowUp'] && currentTime - this.player.lastMoveTime > this.player.depthMoveCooldown) {
            // Move toward center (decrease depth)
            this.player.depth = Math.max(0, this.player.depth - 1);
            this.player.lastMoveTime = currentTime;
        }
        if (this.keys['ArrowDown'] && currentTime - this.player.lastMoveTime > this.player.depthMoveCooldown) {
            // Move toward outside (increase depth)
            this.player.depth = Math.min(this.tubeDepth - 1, this.player.depth + 1);
            this.player.lastMoveTime = currentTime;
        }
    }
    
    constrainPlayerToScreen() {
        const pos = this.tubeToScreen(this.player.segment, this.player.depth);
        const playerSize = Math.max(12, 25 - this.player.depth * 0.8);
        const margin = 20; // Keep player away from screen edges
        
        let needsAdjustment = false;
        let newSegment = this.player.segment;
        let newDepth = this.player.depth;
        
        // Check if player is too close to screen edges
        if (pos.x - playerSize/2 < margin) {
            // Too close to left edge - move inward
            newDepth = Math.max(0, newDepth - 1);
            needsAdjustment = true;
        } else if (pos.x + playerSize/2 > this.width - margin) {
            // Too close to right edge - move inward
            newDepth = Math.max(0, newDepth - 1);
            needsAdjustment = true;
        } else if (pos.y - playerSize/2 < margin) {
            // Too close to top edge - move inward
            newDepth = Math.max(0, newDepth - 1);
            needsAdjustment = true;
        } else if (pos.y + playerSize/2 > this.height - margin) {
            // Too close to bottom edge - move inward
            newDepth = Math.max(0, newDepth - 1);
            needsAdjustment = true;
        }
        
        // Apply adjustments if needed
        if (needsAdjustment) {
            this.player.segment = newSegment;
            this.player.depth = newDepth;
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
            enemy.depth += enemy.speed * 0.005; // Much slower movement toward player
            
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
    
    updatePowerUps() {
        // Spawn new power-ups
        if (Date.now() - this.lastPowerUpSpawn > this.powerUpSpawnRate) {
            this.spawnPowerUp();
            this.lastPowerUpSpawn = Date.now();
        }
        
        // Update existing power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.depth += 0.01; // Slow movement toward player
            return powerUp.depth < this.tubeDepth;
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
            if (this.player.invulnerable) return; // Skip if player is invulnerable
            
            const segmentDiff = Math.abs(bullet.segment - this.player.segment);
            const wrappedSegmentDiff = Math.min(segmentDiff, this.tubeSegments - segmentDiff);
            const depthDiff = Math.abs(bullet.depth - this.player.depth);
            
            if (wrappedSegmentDiff <= 0.5 && depthDiff < 1) {
                this.takeDamage(15); // Take 15 damage from enemy bullets
                this.enemyBullets.splice(index, 1);
                this.updateUI();
                
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        });
        
        // Enemies vs player
        this.enemies.forEach((enemy, index) => {
            if (this.player.invulnerable) return; // Skip if player is invulnerable
            
            const segmentDiff = Math.abs(enemy.segment - this.player.segment);
            const wrappedSegmentDiff = Math.min(segmentDiff, this.tubeSegments - segmentDiff);
            const depthDiff = Math.abs(enemy.depth - this.player.depth);
            
            if (wrappedSegmentDiff <= 0.5 && depthDiff < 1) {
                this.takeDamage(20); // Take 20 damage from enemy collision
                this.updateUI();
                
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        });
        
        // Power-ups vs player
        this.powerUps.forEach((powerUp, index) => {
            const segmentDiff = Math.abs(powerUp.segment - this.player.segment);
            const wrappedSegmentDiff = Math.min(segmentDiff, this.tubeSegments - segmentDiff);
            const depthDiff = Math.abs(powerUp.depth - this.player.depth);
            
            if (wrappedSegmentDiff <= 1 && depthDiff < 2) {
                this.heal(powerUp.healAmount);
                this.powerUps.splice(index, 1);
                this.updateUI();
            }
        });
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
        
        // Make player invulnerable for 2 seconds after taking damage
        this.player.invulnerable = true;
        this.player.invulnerabilityTime = Date.now() + 2000;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        const healthPercent = (this.health / this.maxHealth) * 100;
        document.getElementById('healthBar').style.width = healthPercent + '%';
        document.getElementById('health').textContent = Math.round(healthPercent);
    }
    
    toggleFullscreen() {
        // Check if we're in PWA mode (which provides better fullscreen)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        
        if (isPWA) {
            // In PWA mode, we can use screen orientation API for better control
            this.togglePWAFullscreen();
        } else {
            // Try standard fullscreen API (limited on mobile)
            if (!document.fullscreenElement) {
                // Try different fullscreen methods for better mobile support
                const element = document.documentElement;
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen();
                } else if (element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                } else {
                    this.showFullscreenNotSupported();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    }
    
    togglePWAFullscreen() {
        // In PWA mode, we can lock orientation and hide UI elements
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {
                console.log('Orientation lock not supported');
            });
        }
        
        // Toggle PWA fullscreen mode
        this.isPWAFullscreen = !this.isPWAFullscreen;
        const container = document.querySelector('.game-container');
        
        if (this.isPWAFullscreen) {
            container.classList.add('pwa-fullscreen');
            // Hide UI elements for immersive experience
            document.querySelector('.game-header').style.display = 'none';
            document.querySelector('.game-controls').style.display = 'none';
            document.querySelector('.mobile-controls').style.display = 'none';
        } else {
            container.classList.remove('pwa-fullscreen');
            // Show UI elements
            document.querySelector('.game-header').style.display = 'block';
            document.querySelector('.game-controls').style.display = 'block';
            document.querySelector('.mobile-controls').style.display = 'block';
        }
        
        this.resizeCanvas();
    }
    
    showFullscreenNotSupported() {
        const message = document.createElement('div');
        message.className = 'fullscreen-not-supported';
        message.innerHTML = `
            <div class="permission-content">
                <h3>Fullscreen Not Available</h3>
                <p>Mobile browsers have limited fullscreen support.</p>
                <p><strong>Solution:</strong> Add this page to your home screen for better fullscreen experience!</p>
                <p><em>On iOS: Tap the share button → "Add to Home Screen"</em></p>
                <p><em>On Android: Tap the menu → "Add to Home Screen"</em></p>
                <button onclick="this.parentElement.parentElement.remove()" class="permission-btn">OK</button>
            </div>
        `;
        document.body.appendChild(message);
    }
    
    handleFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
        const container = document.querySelector('.game-container');
        
        if (this.isFullscreen) {
            container.classList.add('fullscreen');
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.tubeRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        } else {
            container.classList.remove('fullscreen');
            this.resizeCanvas();
        }
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        this.updateHealthBar();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    restart() {
        this.gameState = 'playing';
        this.score = 0;
        this.health = this.maxHealth;
        this.level = 1;
        this.player.segment = 0;
        this.player.depth = this.tubeDepth - 1; // Reset to starting depth
        this.player.lastMoveTime = 0;
        this.player.invulnerable = false;
        this.player.invulnerabilityTime = 0;
        this.currentScroll = 0;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.lastShot = 0;
        this.lastEnemySpawn = 0;
        this.lastPowerUpSpawn = 0;
        
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        this.updateUI();
        this.spawnInitialEnemies();
    }
    
    drawTube() {
        // Draw tube segments with scrolling effect
        for (let depth = 0; depth < this.tubeDepth; depth++) {
            // Apply scrolling offset to create movement effect
            const scrollOffset = this.currentScroll + (depth * 0.5);
            
            // Use the same spiral calculation for consistent tube shape
            const spiralFactor = 1 + (depth / this.tubeDepth) * 2;
            const radius = this.tubeRadius * (depth / this.tubeDepth) * spiralFactor;
            
            const alpha = 0.1 + (depth / this.tubeDepth) * 0.3;
            
            this.ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            for (let segment = 0; segment <= this.tubeSegments; segment++) {
                const angle = (segment / this.tubeSegments) * Math.PI * 2 + scrollOffset;
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
        
        // Draw radial lines with scrolling effect (now following spiral shape)
        for (let segment = 0; segment < this.tubeSegments; segment++) {
            const scrollOffset = this.currentScroll;
            const angle = (segment / this.tubeSegments) * Math.PI * 2 + scrollOffset;
            
            // Start from center (small radius)
            const startRadius = this.tubeRadius * 0.1;
            const x1 = this.width / 2 + Math.cos(angle) * startRadius;
            const y1 = this.height / 2 + Math.sin(angle) * startRadius;
            
            // End at outer edge (largest radius with spiral factor)
            const endSpiralFactor = 1 + (this.tubeDepth - 1) / this.tubeDepth * 2;
            const endRadius = this.tubeRadius * ((this.tubeDepth - 1) / this.tubeDepth) * endSpiralFactor;
            const x2 = this.width / 2 + Math.cos(angle) * endRadius;
            const y2 = this.height / 2 + Math.sin(angle) * endRadius;
            
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        
        // Add some particle effects for speed lines
        this.drawSpeedLines();
    }
    
    drawPlayer() {
        const pos = this.tubeToScreen(this.player.segment, this.player.depth);
        const size = Math.max(24, 50 - this.player.depth * 1.6); // 2x bigger player size changes with depth
        
        // Player glow
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 15;
        
        // Draw ship shape (triangle pointing toward center)
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        
        // Calculate the angle to point toward center
        const centerAngle = (this.player.segment / this.tubeSegments) * Math.PI * 2;
        const shipAngle = centerAngle + Math.PI; // Point toward center
        
        // Ship points (triangle shape)
        const tipX = pos.x + Math.cos(shipAngle) * size * 0.6;
        const tipY = pos.y + Math.sin(shipAngle) * size * 0.6;
        
        const leftWingX = pos.x + Math.cos(shipAngle + Math.PI * 0.8) * size * 0.4;
        const leftWingY = pos.y + Math.sin(shipAngle + Math.PI * 0.8) * size * 0.4;
        
        const rightWingX = pos.x + Math.cos(shipAngle - Math.PI * 0.8) * size * 0.4;
        const rightWingY = pos.y + Math.sin(shipAngle - Math.PI * 0.8) * size * 0.4;
        
        this.ctx.moveTo(tipX, tipY);
        this.ctx.lineTo(leftWingX, leftWingY);
        this.ctx.lineTo(rightWingX, rightWingY);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Visual feedback for invulnerability (flashing effect)
        if (this.player.invulnerable) {
            const flash = Math.sin(Date.now() * 0.02) > 0; // Flash every 50ms
            if (flash) {
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        }
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
    
    drawSpeedLines() {
        // Draw speed lines to enhance the feeling of movement
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.random() * Math.PI * 2) + this.currentScroll;
            const startRadius = Math.random() * this.tubeRadius * 0.3;
            const endRadius = this.tubeRadius * 0.8;
            
            const x1 = this.width / 2 + Math.cos(angle) * startRadius;
            const y1 = this.height / 2 + Math.sin(angle) * startRadius;
            const x2 = this.width / 2 + Math.cos(angle) * endRadius;
            const y2 = this.height / 2 + Math.sin(angle) * endRadius;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
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
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            const pos = this.tubeToScreen(powerUp.segment, powerUp.depth);
            const size = Math.max(6, 15 - powerUp.depth * 1.2);
            
            // Power-up glow
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
            this.ctx.shadowBlur = 0;
            
            // Add pulsing effect
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.ctx.globalAlpha = pulse;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(pos.x - size/3, pos.y - size/3, size/1.5, size/1.5);
            this.ctx.globalAlpha = 1;
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
        this.drawPowerUps();
        this.drawBullets();
        this.drawPlayer();
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update tube scrolling
        this.currentScroll += this.scrollSpeed;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerUps();
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
