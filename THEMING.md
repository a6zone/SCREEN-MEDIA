# Light & Dark Mode — Usage Guide

The site now supports two themes: the original **dark** theme and a new **light** theme. No setup or external libraries are required — everything lives in `index.html`.

## How to toggle

Click the sun/moon button in the header (next to the `EN` language toggle):

- 🌙 moon icon → currently in light mode, click to switch to dark
- ☀️ sun icon → shown while in light mode

The button is keyboard-accessible and exposes a localized `aria-label` (Arabic/English, matching the current site language) plus `aria-pressed` state.

## How it works

- **First visit:** the theme follows the visitor's operating-system preference (`prefers-color-scheme`).
- **After toggling:** the choice is saved in `localStorage` under the key `sm-theme` and is restored on every subsequent visit.
- **No flash:** a tiny inline script in `<head>` applies the saved theme before the first paint.
- **Mechanism:** light mode adds the `light` class to `<html>`, which overrides the CSS custom properties (design tokens) defined in `:root`, plus a small set of surface/gradient overrides. Dark mode is the default (no class).
- The `<meta name="theme-color">` (mobile browser chrome color) updates with the theme.

## For developers

- Light-theme tokens: see the `html.light { … }` block near the top of the `<style>` section.
- Light-theme surface overrides (header, hero glow, panels, footer): see the `Light theme — surface & effect overrides` block near the end of the CSS.
- Toggle logic: see the `theme toggle (light / dark)` section in the bottom `<script>`.

Works in all modern browsers (Chrome, Firefox, Safari, Edge) — only standard CSS custom properties, `classList`, `matchMedia` and `localStorage` are used.
