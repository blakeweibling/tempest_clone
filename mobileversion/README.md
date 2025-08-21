# Tempest Clone - Mobile Version

A mobile-friendly clone of the classic Tempest arcade game with PWA (Progressive Web App) support for better fullscreen experience on mobile devices.

## Features

- **Classic Tempest Gameplay**: Navigate through a 3D tube, shoot enemies, and survive waves
- **Mobile Motion Controls**: Tilt your device to control the ship
- **Touch Controls**: Tap to fire weapons
- **PWA Support**: Install as an app for better fullscreen experience
- **Responsive Design**: Works on desktop and mobile devices

## Mobile Fullscreen Issue & Solution

**Problem**: Mobile browsers have very limited fullscreen API support for security reasons. The standard fullscreen button may not work properly on mobile devices.

**Solution**: Install the game as a PWA (Progressive Web App) for better fullscreen support:

### How to Install as PWA:

#### On iOS (iPhone/iPad):
1. Open the game in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install
5. Launch the game from your home screen
6. Now the fullscreen button will work much better!

#### On Android:
1. Open the game in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Follow the prompts to install
5. Launch the game from your home screen

### Benefits of PWA Mode:
- Better fullscreen support
- App-like experience
- Can work offline
- No browser UI elements
- Better performance
- Orientation lock support

## Controls

### Desktop:
- **Arrow Keys**: Move ship around the tube
- **Spacebar**: Fire weapon
- **P**: Pause game
- **Fullscreen Button**: Toggle fullscreen mode

### Mobile:
- **Tilt Left/Right**: Move ship around the tube
- **Tilt Forward/Back**: Move ship in/out
- **Tap Screen**: Fire weapon
- **Fullscreen Button**: Works best when installed as PWA

## Game Elements

- **Green Triangle**: Your ship
- **Red Squares**: Basic enemies (1 HP)
- **Orange Squares**: Tough enemies (3 HP)
- **Yellow Squares**: Fast enemies (1 HP)
- **Blue Squares**: Health power-ups
- **Cyan Squares**: Your bullets
- **Red Squares**: Enemy bullets

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- Uses DeviceOrientation API for motion controls
- PWA manifest for app installation
- Service Worker for offline support
- Responsive design for all screen sizes

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome, Safari (iOS), Samsung Internet
- **PWA Features**: Chrome, Edge, Samsung Internet (Android), Safari (iOS 11.3+)

## Development

To run locally:
1. Clone the repository
2. Serve the files with a local web server (required for PWA features)
3. Open in a supported browser

For PWA testing, use HTTPS or localhost (PWA features require secure context).
