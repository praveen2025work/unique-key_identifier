# UI Mockup: Intelligent Discovery Toggle

## Visual Preview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Configuration                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📁 Working Directory           📄 File A *              📄 File B *    │
│  ┌────────────────────┐         ┌─────────────────────┐ ┌──────────────┐│
│  │ /path/to/files     │         │ trading_system_a... │ │ trading_sys..││
│  └────────────────────┘         └─────────────────────┘ └──────────────┘│
│                                                                          │
│  🔢 Columns  📊 Max Rows  ☑️ Quality   🔍 Load Columns                  │
│  ┌────┐      ┌────────┐   Check        ┌──────────────────────────┐    │
│  │ 5  │      │ 0      │   [✓]          │ 🔍 Load Columns          │    │
│  └────┘      └────────┘                └──────────────────────────┘    │
│                                                                          │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║  🚀 Intelligent Key Discovery  [RECOMMENDED]                     ║  │
│  ║                                                                   ║  │
│  ║  [●━━━━━━━━━━━━━━━○] ON                                          ║  │
│  ║                                                                   ║  │
│  ║  ✓ Prevents combinatorial explosion, handles 300+ columns        ║  │
│  ║    efficiently                                                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ ⚡ Start Analysis│  │📊 View Previous  │  │🔄 Clone Settings     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Toggle States

### State 1: Intelligent Discovery ENABLED (Default)

```
┌────────────────────────────────────────────────────────────────┐
│ 🚀 Intelligent Key Discovery  [RECOMMENDED]                    │
│                                                                 │
│ [●━━━━━━━━━━━━━━━○] ON                                         │
│                                                                 │
│ ✓ Prevents combinatorial explosion, handles 300+ columns       │
│   efficiently                                                   │
└────────────────────────────────────────────────────────────────┘

Visual Elements:
- Toggle switch: BLUE gradient (ON position)
- Badge: Green "RECOMMENDED"
- Message: Green checkmark with positive message
- Border: Blue
```

### State 2: Intelligent Discovery DISABLED

```
┌────────────────────────────────────────────────────────────────┐
│ 🚀 Intelligent Key Discovery  [RECOMMENDED]                    │
│                                                                 │
│ [○━━━━━━━━━━━━━━━●] OFF                                        │
│                                                                 │
│ ⚠️ Manual combinations only - may crash with many columns      │
└────────────────────────────────────────────────────────────────┘

Visual Elements:
- Toggle switch: GRAY (OFF position)
- Badge: Green "RECOMMENDED" (still visible)
- Message: Warning icon with cautionary message
- Border: Blue
```

---

## Complete UI Flow

### Step 1: Initial State
```
┌─────────────────────────────────────────┐
│ Enter file paths:                       │
│  File A: [                        ]     │
│  File B: [                        ]     │
│                                          │
│ Toggle: [●━━━━○] ON (Intelligent)       │
│                                          │
│ [Load Columns] (disabled - need files)  │
└─────────────────────────────────────────┘
```

### Step 2: Files Entered
```
┌─────────────────────────────────────────┐
│ File A: [trading_system_a.csv    ]     │
│ File B: [trading_system_b.csv    ]     │
│                                          │
│ Toggle: [●━━━━○] ON (Intelligent)       │
│                                          │
│ [Load Columns] (enabled - click me!)    │
└─────────────────────────────────────────┘
```

### Step 3: Columns Loaded
```
┌─────────────────────────────────────────┐
│ File A: [trading_system_a.csv    ]     │
│ File B: [trading_system_b.csv    ]     │
│                                          │
│ ✓ Loaded 300 columns | 7M & 7M rows    │
│                                          │
│ Columns: [5]  Max Rows: [0]             │
│                                          │
│ Toggle: [●━━━━○] ON (Intelligent)       │
│ ✓ Will find best 5-column combos       │
│   from 300 columns automatically        │
│                                          │
│ [Start Analysis] (ready!)               │
└─────────────────────────────────────────┘
```

### Step 4: Analysis Running
```
┌─────────────────────────────────────────┐
│ Analysis in Progress...                 │
│                                          │
│ ⏱️  Stage: Analyzing File A             │
│ 📊 Progress: 65%                        │
│                                          │
│ Using Intelligent Discovery:            │
│ • Analyzed column characteristics       │
│ • Selected top 30 seed columns          │
│ • Testing promising combinations        │
│ • ~1,500 combinations (not 2.1B!)       │
│                                          │
│ [████████████████░░░░░] 65%             │
└─────────────────────────────────────────┘
```

### Step 5: Results
```
┌─────────────────────────────────────────┐
│ ✅ Analysis Complete! (7 min 23 sec)    │
│                                          │
│ Found 47 promising combinations:        │
│                                          │
│ 🏆 Unique Keys (100%):                  │
│   1. transaction_id                     │
│   2. account_id,trade_date              │
│   3. desk,book,trade_id                 │
│                                          │
│ 📊 Near-Unique (>99%):                  │
│   4. customer_id,order_num (99.8%)      │
│   5. trade_date,sequence (99.5%)        │
│   ... 42 more                           │
│                                          │
│ [View Full Results]  [Export]           │
└─────────────────────────────────────────┘
```

---

## Color Scheme

### Intelligent Discovery Toggle Box

**When ENABLED:**
```
Background: Linear gradient from-blue-50 to-indigo-50
Border: 2px solid blue-200
Toggle: Blue-500 to Indigo-600 gradient
Badge: Green-500 background, white text
Text: Gray-800 (heading), Gray-600 (description)
Icon: ✓ (green checkmark)
```

**When DISABLED:**
```
Background: Linear gradient from-blue-50 to-indigo-50
Border: 2px solid blue-200
Toggle: Gray-300 
Badge: Green-500 background, white text
Text: Gray-800 (heading), Gray-600 (description)
Icon: ⚠️ (warning icon)
```

---

## Responsive Behavior

### Desktop (> 1024px)
```
┌───────────────────────────────────────────────────────────────┐
│  Working Dir     |    File A    |    File B                   │
│  [          ]    |  [       ]   |  [       ]                  │
├───────────────────────────────────────────────────────────────┤
│  Cols  | MaxRows | Quality | LoadCols                         │
│  [5]   |  [0]    |  [✓]    | [Load]                          │
├───────────────────────────────────────────────────────────────┤
│  🚀 Intelligent Discovery [●━━○] ON  [RECOMMENDED]            │
│  ✓ Prevents combinatorial explosion...                        │
└───────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────────────────────────────────┐
│  Working Dir                            │
│  [                                ]     │
│                                          │
│  File A              File B             │
│  [             ]     [             ]    │
├─────────────────────────────────────────┤
│  Cols  MaxRows  Quality   LoadCols     │
│  [5]   [0]      [✓]       [Load]       │
├─────────────────────────────────────────┤
│  🚀 Intelligent Discovery               │
│  [●━━━━━━━━━━━━━━━○] ON                │
│  [RECOMMENDED]                          │
│  ✓ Prevents explosion...                │
└─────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────────┐
│  Working Dir           │
│  [                ]    │
│                         │
│  File A                │
│  [                ]    │
│                         │
│  File B                │
│  [                ]    │
├────────────────────────┤
│  Columns: [5]          │
│  Max Rows: [0]         │
│  Quality: [✓]          │
│                         │
│  [Load Columns]        │
├────────────────────────┤
│  🚀 Intelligent        │
│     Discovery          │
│                         │
│  [●━━━━━━○] ON         │
│  [RECOMMENDED]         │
│                         │
│  ✓ Prevents crash      │
│    with 300+ cols      │
└────────────────────────┘
```

---

## User Interactions

### Toggle Click
```
Click on toggle → Smooth animation (250ms)
                → Switch position animates left/right
                → Background color transitions (gray ↔ blue)
                → Help text updates instantly
                → Focus ring appears (blue)
```

### Toggle Keyboard
```
Tab to focus → Blue focus ring appears
Space/Enter → Toggle state changes
            → Same animations as click
```

### Hover States
```
Hover over toggle → Cursor: pointer
                  → Slight scale effect (1.02)
                  → Tooltip: "Click to toggle"

Hover over badge → Cursor: help
                 → Tooltip: "Uses smart algorithm to find keys"
```

---

## Accessibility

### ARIA Labels
```html
<input 
  type="checkbox"
  aria-label="Enable Intelligent Key Discovery"
  aria-describedby="intelligent-discovery-help"
  role="switch"
  aria-checked={isEnabled}
/>

<span id="intelligent-discovery-help" className="sr-only">
  {isEnabled 
    ? "Intelligent discovery is enabled. System will automatically find best column combinations."
    : "Intelligent discovery is disabled. Only manual combinations will be used."}
</span>
```

### Screen Reader Announcement
```
When toggled ON:
"Intelligent Key Discovery enabled. 
System will automatically find best column combinations. 
Prevents combinatorial explosion with large datasets."

When toggled OFF:
"Intelligent Key Discovery disabled. 
Warning: Manual combinations only. 
May crash with many columns."
```

### Keyboard Navigation
```
Tab Order:
1. Working Directory field
2. File A field
3. File B field
4. Columns field
5. Max Rows field
6. Quality Check checkbox
7. Load Columns button
8. Intelligent Discovery toggle ← NEW
9. Start Analysis button
10. View Previous dropdown
11. Clone Settings dropdown
```

---

## Animation Details

### Toggle Switch Animation
```css
/* ON → OFF transition */
.toggle-switch {
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Circle movement */
.toggle-circle {
  transform: translateX(0);      /* OFF */
  transform: translateX(24px);   /* ON */
  transition: transform 250ms ease-in-out;
}

/* Background color */
.toggle-bg {
  background: #d1d5db;           /* OFF - gray */
  background: linear-gradient(   /* ON - blue gradient */
    to right, 
    #3b82f6,   /* blue-500 */
    #6366f1    /* indigo-600 */
  );
}
```

### Help Text Transition
```css
.help-text {
  transition: all 200ms ease-in-out;
  opacity: 0;
}

.help-text.visible {
  opacity: 1;
}
```

---

## Edge Cases

### Case 1: Very Small Dataset
```
Columns: 10
Rows: 1,000

Toggle State: ON (intelligent)
Message: "ℹ️ Small dataset - intelligent discovery optional"
Behavior: Works normally, minimal performance difference
```

### Case 2: Medium Dataset  
```
Columns: 50
Rows: 100,000

Toggle State: ON (intelligent)
Message: "✓ Intelligent discovery recommended for optimal performance"
Behavior: Uses heuristic + intelligent discovery
```

### Case 3: Large Dataset (Your Case)
```
Columns: 300
Rows: 7,000,000

Toggle State: ON (intelligent)
Message: "✓ Prevents combinatorial explosion, handles 300+ columns efficiently"
Behavior: MUST use intelligent discovery to avoid crash
```

### Case 4: Manual Combinations Only
```
Toggle State: OFF
User adds: trade_id, account_id,date

Message: "⚠️ Manual combinations only - may crash with many columns"
Behavior: Only tests specified combinations
```

---

## Summary

**Visual Design:**
- Modern toggle switch (iOS-style)
- Clear visual states (ON/OFF)
- Color-coded feedback (blue = good, gray = off, green = recommended)
- Smooth animations (250ms transitions)

**User Experience:**
- Enabled by default (safe choice)
- Clear explanation of what it does
- Real-time feedback on toggle state
- Warning when disabled
- Fully accessible (keyboard, screen reader)

**Technical:**
- Integrates seamlessly with existing UI
- No breaking changes
- Backward compatible
- Responsive design (mobile, tablet, desktop)

**Your 300-column dataset will now have a simple toggle to enable intelligent discovery! 🎉**

