# Kalisz Street Survivor (Prototype)

A first-map browser prototype inspired by gothic side-scroller pacing, with an original setting in Kalisz, Poland.

## Run

Open `index.html` in a browser.

## Controls (Game Boy style)

- Arrow keys: move and jump (`↑` to jump)
- `S`: attack (A button)
- `D`: interact (B button)

## Current mechanics

- Side-scrolling map with backdrop and layered parallax silhouettes
- Platforms and gravity/jump movement
- Basic melee attack and enemy damage
- Pickups that restore HP
- Interaction objective near the right edge (temporary shelter)

## Image-generation workflow for next iteration

You can replace current procedural pixel-art blocks with generated image assets.

Suggested prompt structure:

1. **Backdrop**
   - "2D side-scrolling game backdrop, gloomy old-town street in Kalisz, Poland, moonlit, muted palette, pixel art, seamless horizontal tiling"
2. **Tiles / level elements**
   - "pixel art cobblestone platform tile set, worn plaster walls, dim street lamps, gothic mood, 16x16 style"
3. **Character sprites**
   - "original homeless survivor character sprite sheet, walk/jump/attack frames, side view, 32x48 proportions, pixel art"
4. **Enemy sprites**
   - "urban stray hostile sprite sheet, patrol animation, hit reaction frames, 32x32 pixel art"

Then pack into a spritesheet and map with a tool like Tiled, and load with JSON metadata in `game.js`.
