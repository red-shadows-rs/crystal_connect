# 🍬 Crystal Connect - Dots and Boxes Game

🎮 Crystal Connect is a strategic dots and boxes game where players compete to complete squares by drawing lines between dots. Score points by closing boxes, with options to play against an AI bot or another player on the same device.

🌟 This project is part of Red Shadows | RS Project 🌟

## 🧩 How to Play

- Open `play.html` in your browser to start the game.
- Choose your game mode: Play vs Bot or Play vs Human.
- Click on available lines to complete boxes and score points.
- In vs Bot mode: Play against an intelligent AI opponent.
- In vs Human mode: Take turns with another player on the same device.
- The player who completes the most boxes wins!

## 📁 Project Structure

- `VSAI/`: Contains game files for playing against the bot (AI mode).
- `VSPLAYER/`: Contains game files for playing against another human player.
- `play.html`: Main entry point with mode selection.

## 🌍 Language Support

The game interface is in English. If you wish to add support for another language, you will need to manually translate the following files:

- `play.html`
- `VSAI/script.js`
- `VSPLAYER/script.js`

## 🚧 Developer Notes

- The game uses HTML5 Canvas for smooth rendering and interactivity.
- AI logic is implemented in `VSAI/script.js` with strategic move selection.
- Local multiplayer logic is in `VSPLAYER/script.js` for turn-based play.
- Player progress and scores are managed in memory during the session.
- All assets are locally loaded for offline play and better performance.

🔗 This project is a simple yet engaging web game, built with HTML + CSS + JavaScript, featuring a dark, crystal-themed visual design.
