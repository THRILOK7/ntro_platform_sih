# Quick Design Reference - NTRO Platform

## Color Tokens (Copy & Paste)

```css
/* Background */
#F7F8FA  /* Page background */
#FFFFFF  /* Cards/surfaces */

/* Borders */
#E6E8EC  /* Default border */
#D7DAE0  /* Strong border */

/* Text (Ink) */
#12151C  /* ink-900 - Headings */
#3A3F4B  /* ink-700 - Body */
#6B7280  /* ink-500 - Muted */
#9AA0AC  /* ink-400 - Very muted */

/* Accent (Blue) */
#3D5AFE  /* Primary accent */
#2A3FD1  /* Darker accent */
#EEF1FF  /* Accent tint */

/* Success */
#12A150  /* Success green */
#E9F9EF  /* Success tint */
```

---

## Typography Quick Reference

```typescript
// Headings
text-2xl font-bold text-[#12151C]        // H1 (24px)
text-[17px] font-bold text-[#12151C]     // H2
text-[15px] font-bold text-[#12151C]     // H3
text-[13px] font-bold uppercase          // H4 (section labels)

// Body text
text-[14px] text-[#3A3F4B] leading-relaxed

// Small text
text-[13px] text-[#6B7280]

// Micro text
text-[12px] font-mono text-[#9AA0AC]

// Tiny text (labels)
text-[11px] font-bold uppercase tracking-wider
```

---

## Spacing Scale

```typescript
gap-1    // 4px
gap-2    // 8px
gap-3    // 12px
gap-4    // 16px
gap-5    // 20px
gap-6    // 24px
gap-7    // 28px
gap-8    // 32px

// Card padding
px-7 py-6    // 28px horizontal, 24px vertical
px-7 py-5    // 28px horizontal, 20px vertical
```

---

## Border Radius

```typescript
rounded-[14px]  // Cards (major containers)
rounded-[10px]  // Panels (nested content)
rounded-[7px]   // Buttons/chips
rounded-[5px]   // Small badges
```

---

## Shadows

```typescript
// Resting
shadow-[0_1px_2px_rgba(18,21,28,0.04)]

// Elevated
shadow-[0_4px_16px_rgba(18,21,28,0.06)]

// Hover
hover:shadow-[0_2px_8px_rgba(18,21,28,0.04)]
```

---

## Component Patterns

### Metadata Chip
```tsx
<div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-[#E6E8EC] rounded-[7px]">
  <span className="text-[11px] font-mono font-medium text-[#6B7280]">
    ID: {id.slice(0, 10)}
  </span>
</div>
```

### Accent Chip
```tsx
<div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#EEF1FF] border border-[#3D5AFE]/20 rounded-[7px]">
  <Hash className="w-3 h-3 text-[#3D5AFE]" />
  <span className="text-[11px] font-mono font-semibold text-[#2A3FD1]">
    3 formats
  </span>
</div>
```

### Tab Button
```tsx
<button
  className={`relative flex items-center gap-2.5 px-[14px] py-[13px] text-[13.5px] font-medium ${
    active 
      ? "text-[#3D5AFE] font-semibold" 
      : "text-[#6B7280] hover:text-[#3A3F4B]"
  }`}
>
  <Icon className="h-4 w-4" />
  <span>Label</span>
  {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3D5AFE]" />}
</button>
```

### Section Header
```tsx
<div className="flex items-center gap-3">
  <div className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 bg-[#3D5AFE] text-white text-[11px] font-mono font-bold rounded-[5px]">
    01
  </div>
  <h4 className="text-[13px] font-bold text-[#12151C] uppercase tracking-wide">
    SECTION TITLE
  </h4>
</div>
```

### Bullet List Item
```tsx
<li className="flex items-start gap-3">
  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3D5AFE] flex-shrink-0" />
  <span className="text-[14px] text-[#3A3F4B] leading-relaxed flex-1">
    Content
  </span>
</li>
```

### Numbered List Item
```tsx
<div className="flex items-start gap-3">
  <div className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 bg-white border border-[#D7DAE0] text-[#3A3F4B] text-[12px] font-mono font-semibold rounded-[5px]">
    01
  </div>
  <span className="text-[14px] text-[#3A3F4B] leading-relaxed flex-1 pt-0.5">
    Content
  </span>
</div>
```

### Slide Card
```tsx
<div className="border border-[#E6E8EC] rounded-[10px] overflow-hidden">
  {/* Header */}
  <div className="flex items-center gap-3 px-5 py-3.5 bg-[#F7F8FA] border-b border-[#E6E8EC]">
    <div className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 bg-[#3D5AFE] text-white text-[12px] font-mono font-bold rounded-[5px]">
      1
    </div>
    <h4 className="text-[15px] font-bold text-[#12151C]">Title</h4>
  </div>
  
  {/* Content */}
  <div className="px-5 py-4">
    <ul className="space-y-3">
      {/* Bullets here */}
    </ul>
  </div>
  
  {/* Speaker Notes */}
  <div className="px-5 py-4 bg-[#EEF1FF] border-t border-[#3D5AFE]/10">
    <div className="flex items-start gap-2.5">
      <MessageSquare className="w-4 h-4 text-[#3D5AFE] mt-0.5" />
      <div className="flex-1">
        <p className="text-[11px] font-bold text-[#2A3FD1] uppercase tracking-wider mb-1.5">
          Speaker Notes
        </p>
        <p className="text-[13px] text-[#3A3F4B] leading-relaxed italic">
          Notes content
        </p>
      </div>
    </div>
  </div>
</div>
```

### Ghost Button
```tsx
<button className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#3A3F4B] bg-white border border-[#D7DAE0] hover:bg-[#12151C] hover:text-white hover:border-[#12151C] rounded-[7px] transition-all">
  <Copy className="h-4 w-4" />
  <span>Copy content</span>
</button>
```

### Primary Button
```tsx
<button className="flex items-center gap-2 px-4 py-2.5 bg-[#12151C] text-white text-[13.5px] font-semibold rounded-[7px] hover:bg-[#2A3FD1] transition-colors">
  <RefreshCw className="w-4 h-4" />
  <span>New transformation</span>
</button>
```

---

## Font Usage Rules

### Use IBM Plex Mono for:
- ✅ IDs: `font-mono text-[11px]`
- ✅ Timestamps: `font-mono text-[11px]`
- ✅ Character counts: `font-mono text-[11px]`
- ✅ Numbered badges: `font-mono font-bold`
- ✅ Tweet counters: `font-mono uppercase`
- ✅ Word/char stats: `font-mono text-[12px]`

### Use Inter for:
- ✅ All headings
- ✅ Body text
- ✅ Button labels
- ✅ UI labels
- ✅ Paragraphs

---

## Common Layout Patterns

### Max Width Container
```tsx
<div className="w-full max-w-[920px] mx-auto px-6 py-6">
  {/* Content */}
</div>
```

### Card with Border
```tsx
<div className="bg-white border border-[#E6E8EC] rounded-[14px] shadow-[0_1px_2px_rgba(18,21,28,0.04)] overflow-hidden">
  {/* Card content */}
</div>
```

### Scrollable Content Area
```tsx
<div 
  className="max-h-[640px] overflow-y-auto px-7 py-6 custom-scrollbar"
  style={{
    scrollbarWidth: 'thin',
    scrollbarColor: '#D7DAE0 transparent'
  }}
>
  {/* Scrollable content */}
</div>
```

### Custom Scrollbar CSS
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #D7DAE0;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9AA0AC;
}
```

---

## Interaction States

### Tab States
```typescript
// Rest
"text-[#6B7280]"

// Hover
"hover:text-[#3A3F4B]"

// Active
"text-[#3D5AFE] font-semibold"
```

### Button States
```typescript
// Ghost button rest
"bg-white border border-[#D7DAE0] text-[#3A3F4B]"

// Ghost button hover
"hover:bg-[#12151C] hover:text-white hover:border-[#12151C]"

// Primary button rest
"bg-[#12151C] text-white"

// Primary button hover
"hover:bg-[#2A3FD1]"
```

### Card States
```typescript
// Rest
"border-[#E6E8EC] shadow-[0_1px_2px_rgba(18,21,28,0.03)]"

// Hover
"hover:border-[#D7DAE0] hover:shadow-[0_2px_8px_rgba(18,21,28,0.04)]"
```

---

## Checklist for New Components

- [ ] Uses Inter for UI text
- [ ] Uses IBM Plex Mono for data/metadata
- [ ] Follows 8px spacing grid
- [ ] Uses correct border radius (14px/10px/7px)
- [ ] Applies subtle shadows only
- [ ] Uses accent color (#3D5AFE) for active states
- [ ] Has proper hover states
- [ ] Has visible focus states
- [ ] Respects max-width 920px
- [ ] Parses markdown to semantic HTML
- [ ] No raw `**`, `##`, or `---` visible
- [ ] Generous padding (min 20px in cards)
- [ ] Custom scrollbar if scrollable
- [ ] Responsive on mobile

---

## Common Mistakes to Avoid

❌ **Don't**: Mix multiple accent colors  
✅ **Do**: Use single blue accent (#3D5AFE)

❌ **Don't**: Show raw markdown symbols  
✅ **Do**: Parse to semantic structure

❌ **Don't**: Use default scrollbars  
✅ **Do**: Custom 8px scrollbar with styling

❌ **Don't**: Mix fonts arbitrarily  
✅ **Do**: Inter for prose, IBM Plex Mono for data

❌ **Don't**: Inconsistent spacing  
✅ **Do**: Follow 8px grid system

❌ **Don't**: Heavy drop shadows  
✅ **Do**: Subtle elevation shadows

❌ **Don't**: Cramped layouts  
✅ **Do**: Generous breathing room (min 12-16px)

---

## Quick Terminal Commands

```bash
# Install fonts (if needed)
npm install @fontsource/inter @fontsource/ibm-plex-mono

# Check for accessibility issues
npm run test:a11y

# Build production
npm run build

# Preview production build
npm run preview
```

---

## Resources

- **Design System**: `DESIGN_SYSTEM.md`
- **Visual Comparison**: `VISUAL_COMPARISON.md`
- **Implementation Details**: `DELIVERABLES_V2_REDESIGN.md`
- **Component**: `frontend/src/components/DeliverablesWorkspace.tsx`
- **Styles**: `frontend/src/index.css`

---

## Support

For questions or clarifications about the design system:
1. Check `DESIGN_SYSTEM.md` for detailed specs
2. Review `VISUAL_COMPARISON.md` for before/after examples
3. Examine `DeliverablesWorkspace.tsx` for implementation patterns
