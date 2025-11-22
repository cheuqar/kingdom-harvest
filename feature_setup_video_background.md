# Feature: Video Background for Setup Screen

## Description
Added a looping video background to the setup screen using the `opening.mp4` file, creating a more engaging and dynamic start screen experience.

## Implementation

### 1. Video Element (`SetupScreen.jsx`)
**Added HTML5 video element:**
- `autoPlay` - Starts playing automatically
- `loop` - Continuously loops the video
- `muted` - Required for autoplay to work on most browsers
- `playsInline` - Ensures video plays inline on mobile devices
- Source: `/opening.mp4` (from public folder)

### 2. Layout Structure
**New component structure:**
```
.setup-screen (container)
  ├── video.setup-video-background (background layer)
  └── .setup-content (overlay layer)
      ├── h1 (title)
      └── .setup-form (form elements)
```

### 3. CSS Styling (`SetupScreen.css`)

**Video Background:**
- Positioned absolutely to cover entire screen
- Centered using transform: translate(-50%, -50%)
- `object-fit: cover` ensures proper scaling
- `z-index: 0` keeps it behind content

**Content Overlay:**
- Positioned relatively with `z-index: 1`
- Semi-transparent dark background (rgba(0, 0, 0, 0.5))
- Backdrop blur effect for readability
- Rounded corners and padding
- Glassmorphism effect

**Enhanced Form:**
- Slightly more opaque background
- Border for definition
- Box shadow for depth
- Better contrast against video

### 4. Visual Improvements
- Title has text shadow for better visibility
- Form inputs have darker backgrounds
- Overall better contrast for readability
- Professional glassmorphism aesthetic

## Technical Details

**Video Path:**
- File location: `/Users/cheuqarli/Projects/monopoly-bible/app/public/opening.mp4`
- Served as: `/opening.mp4` (public folder automatically served at root)

**Browser Compatibility:**
- `autoPlay` + `muted` works on all modern browsers
- `playsInline` ensures mobile compatibility
- Fallback: If video fails to load, background is still readable

**Performance:**
- Video is only loaded on setup screen
- No impact on gameplay performance
- Muted means no audio processing

## User Experience
- Creates immediate visual engagement
- Professional, polished first impression
- Reinforces theme/branding with custom video
- Content remains fully readable over video
- Smooth, continuous loop without jarring restarts
