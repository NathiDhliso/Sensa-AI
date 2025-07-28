# Theme Migration Guide 🎨

## Overview

This guide helps you migrate existing Sensa AI components from hardcoded colors to the new modular theme system. The theme system provides:

- **Centralized color management** across all pages
- **Page-specific themes** for different sections
- **Component-level utilities** for consistent styling
- **Dark mode foundation** for future implementation
- **TypeScript integration** with autocompletion

## Migration Patterns

### 1. Simple Color Replacement

**Before:**
```tsx
<div className="bg-purple-600 text-white border-purple-300">
  <h1 className="text-purple-900">Title</h1>
</div>
```

**After:**
```tsx
import { useComponentColors } from '../contexts/ThemeContext';

function MyComponent() {
  const colors = useComponentColors();
  
  return (
    <div className={colors.card.background + " " + colors.text.primary + " " + colors.card.border}>
      <h1 className={colors.text.heading}>Title</h1>
    </div>
  );
}
```

### 2. Page-Specific Theming

**Before:**
```tsx
<div className="bg-gradient-to-br from-purple-50 to-pink-50">
  <nav className="bg-purple-700">
    <!-- Navigation content -->
  </nav>
</div>
```

**After:**
```tsx
import { usePageTheme } from '../contexts/ThemeContext';

function HomePage() {
  const theme = usePageTheme('home');
  
  return (
    <div className={theme.background.gradient}>
      <nav className={theme.nav.background}>
        <!-- Navigation content -->
      </nav>
    </div>
  );
}
```

### 3. Using HOC for Automatic Page Theming

**Before:**
```tsx
export default function KnowMePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <!-- Page content -->
    </div>
  );
}
```

**After:**
```tsx
import { withPageTheme } from '../contexts/ThemeContext';

function KnowMePage() {
  return (
    <div className="min-h-screen">
      <!-- Page content - background applied automatically -->
    </div>
  );
}

export default withPageTheme('knowMe')(KnowMePage);
```

### 4. Dynamic Theme Classes

**Before:**
```tsx
<button className={`px-4 py-2 rounded-lg ${
  variant === 'primary' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'
}`}>
  {children}
</button>
```

**After:**
```tsx
import { useThemeClasses } from '../contexts/ThemeContext';

function Button({ variant, children }: ButtonProps) {
  const getClasses = useThemeClasses();
  
  const buttonClass = getClasses('button', variant, {
    base: 'px-4 py-2 rounded-lg transition-colors',
    hover: 'hover:opacity-90'
  });
  
  return (
    <button className={buttonClass}>
      {children}
    </button>
  );
}
```

## Component-Specific Migration Examples

### Navigation Components

**Before:**
```tsx
<nav className="bg-purple-700 border-b border-purple-600">
  <div className="text-white">Brand</div>
  <a href="#" className="text-purple-100 hover:text-white">Link</a>
</nav>
```

**After:**
```tsx
import { useComponentColors } from '../contexts/ThemeContext';

function Navigation() {
  const colors = useComponentColors();
  
  return (
    <nav className={`${colors.nav.background} ${colors.nav.border}`}>
      <div className={colors.nav.brand}>Brand</div>
      <a href="#" className={colors.nav.link}>Link</a>
    </nav>
  );
}
```

### Form Components

**Before:**
```tsx
<form className="bg-white p-6 rounded-lg shadow-lg">
  <input className="border border-gray-300 focus:border-purple-500" />
  <button className="bg-purple-600 text-white hover:bg-purple-700">
    Submit
  </button>
</form>
```

**After:**
```tsx
import { useComponentColors } from '../contexts/ThemeContext';

function ContactForm() {
  const colors = useComponentColors();
  
  return (
    <form className={colors.card.container}>
      <input className={colors.form.input} />
      <button className={colors.button.primary}>
        Submit
      </button>
    </form>
  );
}
```

### Card Components

**Before:**
```tsx
<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
  <h3 className="text-gray-900 font-semibold">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

**After:**
```tsx
import { useComponentColors } from '../contexts/ThemeContext';

function InfoCard({ title, content }: CardProps) {
  const colors = useComponentColors();
  
  return (
    <div className={colors.card.container}>
      <h3 className={colors.text.heading}>{title}</h3>
      <p className={colors.text.body}>{content}</p>
    </div>
  );
}
```

## Migration Steps

### Step 1: Identify Current Color Usage

Run this command to find hardcoded colors in your components:

```bash
# Find purple color usage
grep -r "purple-\|bg-purple\|text-purple" src/components/

# Find other brand colors
grep -r "bg-\|text-\|border-" src/components/ | grep -E "(blue|pink|orange|coral|plum)"
```

### Step 2: Import Theme Hooks

Add the appropriate theme hook to your component:

```tsx
// For general component styling
import { useComponentColors } from '../contexts/ThemeContext';

// For page-specific themes
import { usePageTheme } from '../contexts/ThemeContext';

// For dynamic class building
import { useThemeClasses } from '../contexts/ThemeContext';
```

### Step 3: Replace Hardcoded Classes

Use the theme reference below to replace hardcoded Tailwind classes:

| Old Class | New Theme Property |
|-----------|-------------------|
| `bg-purple-600` | `colors.button.primary` |
| `text-white` | `colors.text.primary` |
| `bg-white` | `colors.card.background` |
| `border-gray-200` | `colors.card.border` |
| `text-gray-900` | `colors.text.heading` |
| `text-gray-600` | `colors.text.body` |

### Step 4: Test Your Changes

```bash
# Validate TypeScript types
npm run validate:theme

# Run development server
npm run dev

# Check theme examples
npm run theme:example
```

## Theme Reference

### Available Color Variants

```tsx
// Primary brand colors
theme.primary.base     // Main amethyst
theme.primary.light    // Light amethyst
theme.primary.dark     // Dark amethyst

// Secondary colors
theme.secondary.base   // Plum
theme.accent.base      // Coral

// Semantic colors
theme.success.base     // Green
theme.warning.base     // Yellow
theme.error.base       // Red
theme.info.base        // Blue
```

### Page Themes

```tsx
// Available page themes
'home' | 'memory' | 'course' | 'knowMe' | 'analytics' | 'settings' | 'auth'

// Usage
const theme = usePageTheme('knowMe');
// Returns: background, nav, content specific to Know Me page
```

### Component Colors

```tsx
const colors = useComponentColors();

// Navigation
colors.nav.background
colors.nav.border
colors.nav.brand
colors.nav.link

// Buttons
colors.button.primary
colors.button.secondary
colors.button.success
colors.button.warning

// Forms
colors.form.input
colors.form.focus
colors.form.error
colors.form.label

// Cards
colors.card.container
colors.card.background
colors.card.border
colors.card.hover

// Text
colors.text.primary
colors.text.secondary
colors.text.heading
colors.text.body
colors.text.muted
```

## Advanced Usage

### Custom Theme Extensions

```tsx
// Extend theme for specific components
const customColors = {
  ...useComponentColors(),
  dashboard: {
    widget: 'bg-gradient-to-r from-purple-500 to-pink-500',
    metric: 'text-white font-bold',
    chart: 'bg-white/10 backdrop-blur-sm'
  }
};
```

### Conditional Theming

```tsx
function StatusBadge({ status }: { status: 'success' | 'warning' | 'error' }) {
  const colors = useComponentColors();
  
  const statusColors = {
    success: colors.button.success,
    warning: colors.button.warning,
    error: colors.button.error
  };
  
  return (
    <span className={statusColors[status]}>
      {status}
    </span>
  );
}
```

### Theme-Aware Animations

```tsx
import { motion } from 'framer-motion';
import { usePageTheme } from '../contexts/ThemeContext';

function AnimatedCard() {
  const theme = usePageTheme('memory');
  
  return (
    <motion.div
      className={theme.content.card}
      whileHover={{ scale: 1.02 }}
      style={{
        boxShadow: `0 10px 30px ${theme.primary.base}20`
      }}
    >
      Content
    </motion.div>
  );
}
```

## Common Migration Issues

### Issue 1: Missing Color Properties

**Problem:** `colors.someProperty` is undefined

**Solution:** Check if the property exists in `themes.ts`, or use a fallback:

```tsx
const buttonClass = colors.button?.primary || 'bg-purple-600 text-white';
```

### Issue 2: Complex Conditional Styling

**Problem:** Complex color logic doesn't map well to theme structure

**Solution:** Use `useThemeClasses` for dynamic building:

```tsx
const getClasses = useThemeClasses();
const complexClass = getClasses('button', variant, {
  base: 'px-4 py-2',
  state: isActive ? 'active' : 'inactive',
  size: size
});
```

### Issue 3: Gradient Backgrounds

**Problem:** Complex gradients aren't in the theme

**Solution:** Add them to the page theme or create custom utilities:

```tsx
// In themes.ts - add to page theme
knowMe: {
  background: {
    gradient: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
  }
}
```

## Testing Your Migration

### Visual Testing Checklist

- [ ] Colors match the original design
- [ ] Hover states work correctly
- [ ] Focus states are visible
- [ ] Page themes apply consistently
- [ ] No hardcoded colors remain

### Automated Testing

```bash
# Search for remaining hardcoded colors
grep -r "bg-purple\|text-purple\|border-purple" src/

# Validate TypeScript
npm run validate:theme

# Run component tests
npm run test
```

## Next Steps

1. **Migrate one component type at a time** (buttons → cards → forms → navigation)
2. **Test each component** in isolation
3. **Update page layouts** to use page themes
4. **Consider dark mode preparation** using the theme foundation
5. **Add custom themes** for specific features

## Support

- Check `src/examples/ThemeUsageExample.tsx` for comprehensive examples
- Review `src/styles/themes.ts` for available colors and themes
- See `src/contexts/ThemeContext.tsx` for hook documentation

---

**Happy theming! 🎨** Your components will now be consistent, maintainable, and ready for future design updates. 