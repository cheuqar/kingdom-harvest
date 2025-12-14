# Feature: Retro Desert Background

## Description
Created a textured, retro-style desert background for the main game board, replacing the dark solid background with a warm, sandy aesthetic.

## Design Elements

### 1. Base Desert Gradient
- **Color Palette**: Warm sandy tones
  - Light tan: `#c19a6b` (top)
  - Tan: `#d2b48c` 
  - Goldenrod: `#daa520`
  - Dark tan: `#8b7355` (bottom)
- **Direction**: Top to bottom (180deg)
- Creates depth with darker colors at bottom

### 2. Sand Dunes Pattern
**Three overlapping elliptical gradients:**
- Dune 1: 800px × 100px at 20% horizontal, 60% vertical
- Dune 2: 600px × 80px at 70% horizontal, 40% vertical  
- Dune 3: 700px × 90px at 40% horizontal, 80% vertical
- **Effect**: Creates subtle rolling hills/dune shapes
- **Colors**: Light variations of tan/beige with low opacity

### 3. Texture/Grain Effect
**Dual repeating grids:**
- Horizontal lines (0deg)
- Vertical lines (90deg)
- 2px spacing with 2px stripes
- Very low opacity (0.03)
- **Effect**: Creates fine grain/texture like old paper or sand

## Color Scheme
All colors are warm earth tones typical of desert landscapes:
- Browns
- Tans
- Goldenrods
- Beiges

## Retro Aesthetic
- Gradient transitions (classic retro)
- Grainy texture (vintage feel)
- Warm color palette (70s/80s style)
- Subtle patterns (not too modern/sharp)

## Technical Implementation
- **Multiple background layers** stacked using CSS
- **Radial gradients** for organic dune shapes
- **Repeating linear gradients** for grain texture
- **All pure CSS** - no images needed
- **Performant** - uses GPU-accelerated gradients

## Result
A warm, textured desert background that:
- Evokes retro gaming aesthetics
- Provides visual interest without distraction
- Maintains readability of game elements
- Creates thematic atmosphere
