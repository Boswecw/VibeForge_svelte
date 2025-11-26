# Testing Task 6: Enhanced Context Management UI

## Quick Start

1. Start the dev server: `cd vibeforge && pnpm dev`
2. Open the workbench at http://localhost:5173/workbench
3. Click the **Context** tab in the left column

## Test Scenarios

### 1. Drag-and-Drop Reordering

**Steps:**

1. Switch to Context tab in left column
2. Add 3-4 context blocks (click "New" button)
3. Ensure blocks are active (toggle switches on right should be amber)
4. Look for the drag handle (⋮ icon) on the left of each card
5. Drag a block by clicking and holding
6. Drop it above/below another block
7. Verify the order changes

**Expected:**

- Dragging shows 50% opacity
- Drop target shows ember ring highlight
- Order persists after drop
- Drag handle cursor changes to "move"

---

### 2. Context Metrics Display

**Steps:**

1. Add several context blocks with varying content sizes
2. Toggle some blocks active, leave others inactive
3. Observe the **Context Analytics** card at the top

**Expected Metrics:**

```
┌─────────────────────────────────────┐
│ Context Analytics    [75% efficiency]│
├─────────────────────────────────────┤
│  Active Blocks  │  Total Tokens │ Est. Cost │
│       3 / 4     │     2.5k      │  $0.075   │
├─────────────────────────────────────┤
│ Breakdown by Type:                  │
│ [system] 2/3     1.2k    $0.036     │
│ [code]   1/1     1.3k    $0.039     │
└─────────────────────────────────────┘
```

**Verify:**

- Active blocks count updates when toggling
- Token count reflects only active blocks
- Cost calculation shows (tokens/1000) \* $0.03
- Efficiency percentage shows active/total ratio
- Breakdown shows per-type metrics

---

### 3. Include/Exclude Toggles

**Steps:**

1. Create several context blocks
2. Click the toggle switch on right side of each card
3. Click "Enable All" / "Disable All" in header

**Expected:**

- Toggle active: Amber background, switch moves right
- Toggle inactive: Gray background, switch moves left
- Hover shows tooltip: "Exclude from execution" / "Include in execution"
- "Enable All" activates all blocks
- "Disable All" deactivates all blocks
- Metrics update immediately

---

### 4. Enhanced Stats Display

**Steps:**

1. Add blocks and toggle them
2. Observe the header stats section

**Expected Display:**

```
┌───────────────────────────────────────────┐
│ [📋 3/5] [📄 2.5k] [💲 ~$0.075] [Enable All] │
│ ⋮ Drag to reorder                          │
└───────────────────────────────────────────┘
```

**Features:**

- Block count with icon (clipboard)
- Token count with icon (document)
- Cost estimate with icon (dollar)
- Action buttons with icons
- Drag hint when 2+ active blocks

---

### 5. Visual States Testing

**Test Each State:**

**Active Block:**

- Ember (#FBBF24) border
- Shadow effect
- Drag handle visible
- Cost displayed in metadata

**Inactive Block:**

- Gray border
- No shadow
- No drag handle
- No cost displayed

**Dragging:**

- 50% opacity on dragged card
- Cursor shows "move" icon
- Other cards show normal cursor

**Drop Target:**

- Ember ring (2px) around card
- Ring offset from card edge
- Removes when drag leaves

---

### 6. Metrics Accuracy

**Test Calculations:**

Add blocks with known content:

1. Block A: 400 characters → ~100 tokens → ~$0.003
2. Block B: 800 characters → ~200 tokens → ~$0.006
3. Block C: 1200 characters → ~300 tokens → ~$0.009

**Verify:**

- Individual tokens = chars / 4 (rounded up)
- Total tokens = sum of active blocks
- Cost = (tokens / 1000) \* $0.03
- Efficiency = (active / total) \* 100

---

## Visual Checklist

### ContextMetrics Component

- [ ] Shows "Context Analytics" header
- [ ] Displays efficiency badge (color-coded)
- [ ] Three metric cards visible
- [ ] Breakdown by type section
- [ ] Contextual tip at bottom
- [ ] Icons render correctly
- [ ] Numbers format properly (e.g., "2.5k" not "2500")

### ContextBlockCard

- [ ] Drag handle (⋮) on active blocks only
- [ ] Toggle switch smooth animation
- [ ] Metadata row shows 4-6 items
- [ ] Icons appear next to numbers
- [ ] Cost shows only on active blocks
- [ ] Usage rate shows if > 0%
- [ ] Kind tag colored correctly

### ContextColumn Header

- [ ] Tab navigation works (Prompts/Context)
- [ ] Stats show 3 tags + button
- [ ] Drag hint appears when 2+ active
- [ ] Enable/Disable All buttons functional
- [ ] Icons render in all tags

---

## Known Issues (Transient)

- Svelte snippet syntax warnings in IDE (false positives)
- A11y warning about drag handlers (fixed with role="listitem")

---

## Performance Tests

1. **Add 10 blocks:** Should render instantly
2. **Drag reorder:** Should feel smooth (no lag)
3. **Toggle all:** Should update in <50ms
4. **Metrics recalc:** Should update on every change

---

## Edge Cases to Test

- [ ] Zero blocks (should show "Add your first context block")
- [ ] Single block (no drag hint, can't reorder)
- [ ] All inactive (metrics show 0%, gray tags)
- [ ] Very large block (10k+ chars, test scrolling)
- [ ] Rapid toggles (should not cause flicker)
- [ ] Drag cancel (press Esc while dragging)

---

## Success Criteria

✅ All drag-and-drop operations work smoothly
✅ Metrics display accurate calculations
✅ Toggles update immediately with visual feedback
✅ No console errors during normal operation
✅ UI remains responsive with 10+ blocks
✅ Visual states clearly communicate block status

---

## Next Steps

After testing Task 6:

1. Proceed to **Phase 2: Analytics & Deployments**
2. Or refine existing features based on feedback
3. Or implement DataForge persistence for contexts
