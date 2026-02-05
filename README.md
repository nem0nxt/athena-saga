# Athena Saga 🏛️⚔️

A retro side-scrolling action game inspired by classic 16-bit titles like Rastan Saga (1987).

## 🎮 Play the Game

Open `index.html` in any modern web browser to play!

## 📖 Story

You are **Athena**, the Greek goddess of wisdom and war. Armed with your sacred spear and legendary shield, you must battle through hordes of mythological creatures to reach and defeat the monstrous Cyclops!

## 🎯 Controls

| Key | Action |
|-----|--------|
| ← → (Arrow Keys) | Move left/right |
| ↑ or SPACE | Jump |
| Z | Spear attack |
| X | Shield block |

**Pro Tips:**
- Blocking reduces incoming damage significantly
- Collect golden spear power-ups to increase attack damage and range
- Red heart orbs restore health
- Time your attacks carefully against the Cyclops boss!

## 👾 Enemies

### Skeletons 💀
Undead warriors that patrol the ancient temple grounds. They'll chase you when you get close!

### Harpies 🦅
Flying creatures that swoop down from above. Watch the skies!

### Cyclops (Boss) 👁️
A massive one-eyed giant at the end of the level. He has two attack patterns:
- **Club Swing**: Close-range devastating attack
- **Ground Stomp**: Creates a shockwave - jump to avoid!

## 🏆 Scoring

| Action | Points |
|--------|--------|
| Defeat Skeleton | 100 |
| Defeat Harpy | 150 |
| Defeat Cyclops | 1000 |
| Collect Health | 50 |
| Collect Weapon Upgrade | 100 |
| Victory Bonus | 500 |

## 🎨 Features

- Authentic 16-bit pixel art aesthetic
- Smooth parallax scrolling backgrounds
- Particle effects for attacks, hits, and power-ups
- Screen shake for impactful combat
- Animated torches and environmental details
- Boss health bar
- Weapon upgrade system (3 levels)

## 📁 Project Structure

```
athena-saga/
├── index.html          # Main game page
├── css/
│   └── style.css       # Retro styling & UI
├── js/
│   ├── game.js         # Main game engine
│   ├── player.js       # Athena character
│   ├── enemies.js      # Enemy AI & logic
│   └── level.js        # Level data & rendering
├── assets/             # (placeholder for future sprites)
└── README.md           # This file
```

## 🛠️ Technical Details

- Pure HTML5 Canvas - no external libraries
- 60 FPS game loop with delta time
- Collision detection for platforms and combat
- State machine for player and enemy behaviors
- Parallax scrolling with multiple layers

## 🎭 Credits

Created as a tribute to classic side-scrolling action games of the late 1980s, particularly:
- Rastan Saga (Taito, 1987)
- Golden Axe (Sega, 1989)
- Altered Beast (Sega, 1988)

## 📜 License

This project is open source. Feel free to modify and expand upon it!

---

*"The owl of Athena spreads its wings only with the falling of the dusk."* - Hegel
