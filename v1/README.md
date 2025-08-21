# Tempest II

A modern browser-based reimagining of the classic 1981 Tempest arcade game, built with HTML5 Canvas and JavaScript. This updated version features authentic 3D tube scrolling, health system, power-ups, and immersive fullscreen gameplay.

## How to Play

1. **Open the game**: Simply open `index.html` in your web browser
2. **Controls**:
   - **Left/Right Arrow Keys**: Move your ship around the tube's circumference
   - **Up/Down Arrow Keys**: Move your ship in/out along the tube's depth
   - **Spacebar**: Fire at enemies
   - **P Key**: Pause/Resume the game
   - **Fullscreen Button**: Toggle immersive fullscreen mode

## Game Features

- **Authentic 3D Tube Scrolling**: Navigate a widening spiral tube with true 3D movement
- **Depth Movement**: Move in and out along the tube's depth using up/down controls
- **Health System**: Health bar instead of lives - take damage and recover with power-ups
- **Power-ups**: Blue health pickups restore your health
- **Multiple Enemy Types**: Different colored enemies with varying health and point values
- **Progressive Difficulty**: Enemies spawn faster and in greater numbers as you advance
- **Invulnerability Frames**: Brief invulnerability after taking damage with visual feedback
- **Fullscreen Mode**: Immersive fullscreen gameplay with overlay controls
- **Responsive Design**: Adapts to any screen size with dynamic canvas scaling
- **Visual Effects**: Zooming effect, speed lines, and smooth animations
- **Ship-like Player**: Triangle-shaped ship that points toward the center

## Game Mechanics

- **Player Ship**: Control a green triangle ship around the edge of the spiral tube
- **3D Movement**: 
  - Left/right: Move around the tube's circumference
  - Up/down: Move in/out along the tube's depth
- **Spiral Tube**: The tube widens as it extends outward, creating a spiral effect
- **Enemies**: Red, orange, and yellow enemies with different health values
- **Shooting**: Fire bullets toward the center to destroy enemies
- **Collision System**: Precise hitbox detection with reduced collision areas
- **Health Management**: Take damage from enemies and bullets, heal with power-ups
- **Movement Cooldown**: Prevents rapid cycling around the tube
- **Screen Constraint**: Player automatically moves inward if too close to screen edges

## Enemy Types

- **Red Enemies**: 1 health, worth 100 points
- **Orange Enemies**: 3 health (harder to kill), worth 150 points  
- **Yellow Enemies**: 1 health, worth 200 points

## Power-ups

- **Blue Health Pickups**: Restore your health when collected
- **Spawn Rate**: Power-ups appear periodically throughout gameplay

## Scoring

- Destroy enemies to earn points
- Higher-level enemies are worth more points
- Your score increases with each enemy destroyed
- Try to achieve the highest score possible!

## UI Features

- **Health Bar**: Visual health indicator with color gradient
- **Score Display**: Real-time score tracking
- **Level Indicator**: Current level display
- **Legend**: Color-coded guide for game elements
- **Controls Panel**: On-screen control instructions
- **Side Panel**: Non-fullscreen layout with controls and legend
- **Fullscreen Overlay**: Controls appear as overlay in fullscreen mode

## Technical Details

- Built with vanilla JavaScript (no external libraries)
- Uses HTML5 Canvas for rendering
- 3D coordinate system with segment and depth positioning
- Responsive CSS design with Flexbox layout
- Modern ES6+ JavaScript features
- Smooth 60fps gameplay
- Fullscreen API integration
- Dynamic canvas resizing

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- CSS3 animations and Flexbox
- Fullscreen API

## Getting Started

1. Download all files to a folder
2. Open `index.html` in your web browser
3. Start playing immediately!

No installation or build process required - just open and play!

## Controls Reference

### Movement
- **Left Arrow**: Move counter-clockwise around tube
- **Right Arrow**: Move clockwise around tube
- **Up Arrow**: Move inward (toward center)
- **Down Arrow**: Move outward (away from center)

### Actions
- **Spacebar**: Fire weapon
- **P**: Pause/Resume game
- **Fullscreen Button**: Toggle fullscreen mode

### Game Elements
- **Green Triangle**: Your ship
- **Red/Orange/Yellow Dots**: Enemies (different health values)
- **Blue Dots**: Health power-ups
- **Cyan Bullets**: Your projectiles
- **Red Bullets**: Enemy projectiles

## Future Enhancements

Potential features for future versions:
- Sound effects and background music
- Additional power-up types
- Boss battles
- High score persistence
- Mobile touch controls
- Additional enemy types
- Particle effects for explosions
- Multiple weapon types
- Level-specific tube shapes

Enjoy Tempest II!
