# Fix Dark Mode Color Issues - Record

## Completed Changes

### Sidebar.tsx
1. **Line 53**: Changed navigation active state background
   - FROM: `bg-white`
   - TO: `bg-(--surface)`
   - Effect: Sidebar navigation "全部项目" item now uses proper CSS variable for theming

2. **Lines 70-73**: Removed hardcoded background from user profile card
   - FROM: Had `style={{ background: 'rgba(250, 249, 246, 0.6)' }}`
   - TO: Relies on `glass-card` class for proper theming
   - Effect: User profile card now adapts properly to dark/light mode

### ProjectList.tsx
3. **Line 306**: Fixed "新建手稿" card hover effect
   - FROM: `group-hover:bg-[rgba(107,127,127,0.05)]`
   - TO: `group-hover:bg-(--novel-primary)/5`
   - Effect: Hover effect now works correctly in both light and dark modes using CSS variable

## CSS Variables Used
- `--surface`: Background color for surfaces (adapts to theme)
- `--novel-primary`: Primary accent color with opacity modifier `/5`
- `--novel-text-main`: Main text color
- `--novel-text-muted`: Muted text color

## Pattern Applied
Replace hardcoded colors with CSS custom properties for proper dark mode support.

