# sysTrol ERP Icon Design Specification

## Overview
sysTrol ERP uses a custom, precision-crafted icon system built specifically for enterprise productivity, data density, and clear visual hierarchy.

## Grid & Geometry
- **ViewBox**: `0 0 24 24`
- **Live Area**: 20px x 20px active drawing area with 2px outer padding (x: 2..22, y: 2..22).
- **Stroke Width**: `1.75px` consistent stroke weight across all icons.
- **Line Caps & Joins**: `stroke-linecap="round"` and `stroke-linejoin="round"` for a cohesive, refined aesthetic.
- **Fill**: `none` by default; shapes use strokes or specific fill masks.
- **Color**: `currentColor` so icons inherit text and theme colors dynamically.

## Accessibility
- **Decorative Icons**: When accompanied by visible text or purely ornamental, render with `aria-hidden="true"`.
- **Interactive / Standalone Icons**: When used without adjacent text (e.g. icon-only buttons), require an accessible label rendered via `aria-label` and `role="img"`.

## Categories
1. **Navigation & Brand**: Dashboard, Projects, Users, Logs, Settings, Menu, Panel Collapse, Panel Expand, Logout.
2. **Actions**: Plus, Close, Check, Search, Edit, Trash, Download, Filter, Refresh, Copy, More Horizontal, Eye, Eye-Off, Lock, Key.
3. **Status & Data**: Info, Success, Warning, Error, Clock, Calendar, Overtime, User, Shield, Ban, Restore, Activity, Sort-Asc, Sort-Desc, Dot.
4. **Direction & Theme**: Chevron (Up, Down, Left, Right), Arrow (Left, Right), Sun, Moon.
