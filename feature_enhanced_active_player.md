# Enhancement: Active Player Visual Prominence

## Overview
Enhanced the visual styling of the current/active player's card to make it stand out much more prominently in the team list.

## Changes Made

### 1. Card-Level Enhancements

**Scale & Shadow:**
- Scale increased: 1.01 → 1.03 (more noticeable size difference)
- Multi-layered shadow with green glow
- Animated pulsing glow effect (green, not generic)
- Border outline that pulses from 2px to 3px

**Background:**
- Changed from solid color to gradient: `linear-gradient(135deg, #1f2b4d 0%, #2a3a5f 100%)`
- Adds depth and visual interest

**Border:**
- Left border color: Default → Bright green (#4ecca3)
- Left border width: 3px → 4px for active player
- Makes it immediately identifiable

### 2. Glow Animation

**Enhanced `active-glow` keyframes:**
- Base state: Strong green shadow layers
- Peak state (50%): Even stronger glows with increased radius
- Three-layer shadow system:
  - Outer glow (40px radius at peak)
  - Ring outline (2-3px, high opacity)
  - Card shadow (depth)

### 3. Stat Boxes Enhancement

**For active player's stat boxes:**
- Border color: Green (#4ecca3) instead of gold
- Border width: 1.5px → 2px
- Box shadow: Stronger green glow
- Background tint: Subtle green gradient overlay
- More cohesive with card theme

### 4. Turn Badge Animation

**New pulsing effect:**
- Gradient background (green shades)
- Text color: Black for better contrast
- Bold font weight
- Continuous pulse animation
- Shadow pulses with scale

## Visual Hierarchy

**Now players can instantly identify:**
1. ✨ **Active Player**: Prominent green glow, larger scale, pulsing badge
2. **Other Players**: Standard appearance
3. **Bankrupt Players**: Grayed out

## Color Scheme
- **Primary**: Green (#4ecca3) - active, fresh, "go"
- **Depth**: Blue gradient (#1f2b4d → #2a3a5f)
- **Contrast**: Black badge text on green background

## Accessibility
- High contrast maintained
- Multiple visual cues (color, size, animation, border)
- Works for color-blind users (size and animation cues)
