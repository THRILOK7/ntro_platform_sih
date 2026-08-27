# NTRO Platform - Design System Specification

## Overview
Modern SaaS dashboard aesthetic inspired by Linear, Notion, and Vercel dashboards. Production-ready design with intelligent content parsing and semantic structure.

---

## Design Tokens

### Colors

#### Background
- **Page**: `#F7F8FA` - Main application background
- **Surface**: `#FFFFFF` - Cards and panels

#### Borders
- **Default**: `#E6E8EC` - Standard borders
- **Strong**: `#D7DAE0` - Emphasized borders

#### Ink (Text Hierarchy)
- **Ink-900**: `#12151C` - Headings, primary text
- **Ink-700**: `#3A3F4B` - Body text
- **Ink-500**: `#6B7280` - Muted/meta text
- **Ink-400**: `#9AA0AC` - Very muted text

#### Accent (Primary Blue)
- **Accent**: `#3D5AFE` - Primary interactive color
- **Accent-ink**: `#2A3FD1` - Darker accent for text
- **Accent-tint**: `#EEF1FF` - Light accent background

#### Success
- **Success**: `#12A150` - Success states, connected indicator
- **Success-tint**: `#E9F9EF` - Light success background

### Typography

#### Font Families
- **UI Text**: Inter (weights 400/500/600/700/800)
- **Data/Mono**: IBM Plex Mono (weights 400/500/600/700)
  - Use for: IDs, timestamps, numbered badges, character counts, any metadata

#### Type Scale
- **Display**: 24px / 2rem, font-weight 800
- **H1**: 22px / font-weight 700
- **H2**: 17px / font-weight 700
- **H3**: 15px / font-weight 700
- **H4**: 13px / font-weight 700, uppercase tracking-wide
- **Body**: 14px / font-weight 400, line-height 1.6
- **Small**: 13px / font-weight 500
- **Micro**: 12px / font-weight 500
- **Tiny**: 11px / font-weight 600

### Spacing Scale (8px Grid)
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 12px (0.75rem)
- **base**: 16px (1rem)
- **lg**: 20px (1.25rem)
- **xl**: 24px (1.5rem)
- **2xl**: 28px (1.75rem)
- **3xl**: 32px (2rem)

### Border Radius
- **Cards**: 14px
- **Panels**: 10px
- **Buttons/Chips**: 7px
- **Small**: 5px

### Shadows
- **Resting**: `0 1px 2px rgba(18, 21, 28, 0.04)`
- **Elevated**: `0 4px 16px rgba(18, 21, 28, 0.06)`
- **Hover**: `0 2px 8px rgba(18, 21, 28, 0.04)`

---

## Component Specifications

### 1. Header Card

```
┌─────────────────────────────────────────────────────────────┐
│  TRANSFORMATION COMPLETE            [New transformation →]  │
│  3 deliverables generated in 2.45s                          │
├─────────────────────────────────────────────────────────────┤
│  📄 Executive Summary  |  📊 Infographic  |  💼 LinkedIn   │ ← Tabs
├─────────────────────────────────────────────────────────────┤
│  [ID: abc123def4]  [⏱ 2.450s]  [# 3 formats]              │ ← Meta strip
├─────────────────────────────────────────────────────────────┤
│  📄 Executive Summary                                       │ ← Type badge
└─────────────────────────────────────────────────────────────┘
```

**Structure**:
- White surface with border
- Rounded 14px
- Shadow: 0 1px 2px rgba(18,21,28,0.04)

**Top Row**:
- Title: 24px, font-weight 700, Ink-900
- Subtitle: 13px, Ink-500
- Button: Dark background, white text, rounded 7px

**Tab Bar**:
- Horizontal scroll on mobile
- Active tab: Accent color + 2px underline
- Padding: 13px vertical, 14px horizontal
- Icons + labels with generous spacing

**Meta Strip**:
- Background: #F7F8FA
- Monospace chips with borders
- Accent-tinted chip for deliverable count

### 2. Content Panel

```
┌─────────────────────────────────────────────────────────────┐
│  Executive Summary              [Copy content]              │
│  1,234 words · 6,789 characters                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [01] SECTION HEADER                                        │
│                                                              │
│  • Bullet point with proper indentation                     │
│  • Another bullet with clean formatting                     │
│  • Bold text rendered properly, no ** symbols               │
│                                                              │
│  [02] Numbered item with bordered badge                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Panel Header**:
- Title: 17px font-weight 700, Ink-900
- Meta: 12px, IBM Plex Mono, Ink-400
- Copy button: Ghost style with border

**Panel Body**:
- Max height: 640px
- Custom scrollbar (8px wide, inside padding)
- Padding: 28px (1.75rem)

### 3. Slide Cards (Presentation Mode)

```
┌─────────────────────────────────────────────────────────────┐
│  [1] Slide Title                                            │ ← Header strip
├─────────────────────────────────────────────────────────────┤
│  • First bullet point with proper formatting                │
│  • Second bullet point                                      │
│  • Third bullet point with bold emphasis                    │
├─────────────────────────────────────────────────────────────┤
│  💬 SPEAKER NOTES                                           │
│  Additional context in italic text with tinted background   │
└─────────────────────────────────────────────────────────────┘
```

**Slide Structure**:
- Border: #E6E8EC
- Rounded: 10px
- Shadow: 0 1px 2px rgba(18,21,28,0.03)
- Gap between slides: 16px

**Slide Header**:
- Background: #F7F8FA
- Number badge: Accent background, white text, IBM Plex Mono, rounded 5px
- Title: 15px font-weight 700, Ink-900

**Slide Content**:
- Bullets: 1.5px dot in accent color
- Text: 14px, Ink-700, leading-relaxed

**Speaker Notes**:
- Background: #EEF1FF (accent-tint)
- Border: 1px solid rgba(61,90,254,0.1)
- Icon: MessageSquare, accent color
- Label: 11px, font-weight 700, uppercase, Accent-ink
- Text: 13px, italic, Ink-700

### 4. Structured Content (Non-Presentation)

**Section Headers**:
```
[01] SECTION TITLE
```
- Number badge: Accent background, white text, 28px wide, 24px tall
- Title: 13px, font-weight 700, uppercase, tracking-wide, Ink-900

**Bullet Lists**:
- Dot marker: 1.5px, accent color
- Border between items (not after last)
- Text: 14px, Ink-700, leading-relaxed
- Inline bold: font-weight 600, Ink-900

**Numbered Lists**:
```
[01] First item with bordered badge
[02] Second item
```
- Badge: 32px wide, 28px tall, white bg, border, IBM Plex Mono
- Text: 14px, Ink-700

### 5. Tweet Cards

```
┌─────────────────────────────────────────────────────────────┐
│  TWEET 1 OF 5                                    245 / 280  │
│                                                              │
│  Tweet content with proper formatting and spacing           │
└─────────────────────────────────────────────────────────────┘
```

**Structure**:
- Border: #E6E8EC
- Rounded: 10px
- Padding: 16px (1rem)
- Hover: border-color #D7DAE0, shadow

**Header**:
- Label: 11px, font-weight 700, IBM Plex Mono, uppercase, accent color
- Count: 11px, IBM Plex Mono, Ink-400

**Content**:
- Text: 14px, Ink-700, leading-relaxed
- Preserves line breaks (whitespace-pre-wrap)

---

## Content Parsing Rules

### Markdown to Structure

**Never show raw markdown symbols**:
- ❌ `**Bold Text**` or `## Header` or `- Bullet`
- ✅ Render as proper HTML with semantic structure

**Parsing Logic**:

1. **Headers**: `##` or `**text**` (standalone, < 60 chars)
   - Convert to numbered section badges + uppercase labels

2. **Bullet Lists**: Lines starting with `- ` or `* `
   - Render with accent-colored dots
   - Parse inline `**bold**` as `<strong>`

3. **Numbered Lists**: Lines starting with `1.`, `2.`, etc.
   - Render with monospace bordered badges

4. **Paragraphs**: Regular text lines
   - Parse inline markdown
   - Proper line height and spacing

5. **Slide Separators**: `---`, `===`, or `Slide N`
   - Split into individual slide cards
   - Never render literally

6. **Speaker Notes**: Text after `Speaker Notes:` (case-insensitive)
   - Render in distinct tinted callout box
   - Italic styling with icon

### Visual Hierarchy

**Data vs. Prose**:
- Monospace font (IBM Plex Mono): IDs, timestamps, counts, badges
- UI font (Inter): All prose content, labels, body text

**Text Hierarchy**:
- Ink-900: Headings, important labels
- Ink-700: Body text, main content
- Ink-500: Supporting text, descriptions
- Ink-400: Very muted text, placeholders

---

## Layout Guidelines

### Max Content Width
- 920px centered
- 24-28px outer padding
- Consistent spacing on all breakpoints

### Breathing Room
- Minimum 12-16px between related elements
- 20-26px padding around card edges
- 16px gap between slide cards
- Nothing should touch edges

### Responsive Behavior
- Tabs: horizontal scroll on mobile (no wrap)
- Stat grids: 4 cols desktop → 2 cols mobile
- Content width adapts with padding
- Scrollable areas maintain padding

### Scrollbar Styling
- Width: 8px
- Track: transparent
- Thumb: #D7DAE0
- Thumb hover: #9AA0AC
- Position: inside padding (never overlaps text)

---

## Interaction States

### Buttons

**Primary (Dark)**:
- Rest: #12151C
- Hover: #2A3FD1 (accent-ink)
- Active: slight scale (0.99)
- Disabled: 50% opacity

**Ghost (Border)**:
- Rest: white bg, border #D7DAE0
- Hover: inverts to dark fill (#12151C) + white text
- Focus: 2px accent ring

### Tabs
- Rest: Ink-500
- Hover: Ink-700
- Active: Accent color + 2px underline + font-weight 600

### Cards/Panels
- Rest: shadow-sm
- Hover: border darkens, shadow-md
- No unnecessary animation

### Copy Feedback
- Success state: green checkmark + "Copied" text
- Duration: 2 seconds
- Smooth transition

---

## Accessibility

### Focus States
- Visible 2px ring in accent color
- Never remove outline without replacement
- Keyboard navigation support

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Ink-900 on white: 13.5:1
- Ink-700 on white: 9.2:1
- Ink-500 on white: 4.8:1
- Accent on white: 4.9:1

### Typography
- Minimum body text: 14px
- Adequate line-height: 1.6 for body
- Clear visual hierarchy

---

## Implementation Notes

### CSS Custom Properties
All design tokens available as CSS variables:
```css
var(--bg-page)
var(--ink-900)
var(--accent)
var(--radius-card)
var(--shadow-sm)
```

### Font Loading
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
```

### Production Ready
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation
- Responsive down to 320px
- No layout shift during load
- Optimized rendering performance

---

## Design Philosophy

1. **Restrained Palette**: One accent color (blue) used consistently
2. **Clear Hierarchy**: Typography and spacing create natural flow
3. **Data Clarity**: Monospace for metadata, prose for content
4. **Generous Spacing**: Nothing cramped, everything breathes
5. **Subtle Shadows**: Depth without heaviness
6. **No Raw Markdown**: Always parse to semantic structure
7. **Production Quality**: Real-world polish, not prototype aesthetics
