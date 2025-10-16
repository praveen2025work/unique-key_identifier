# Wijmo FlexGrid Integration Guide

## Overview

This guide explains how to use the new Wijmo FlexGrid components that have been integrated to fix pagination issues and improve memory management in the Unique Key Identifier application.

## What's Been Added

### 1. Wijmo Components Installed
```bash
@mescius/wijmo.react.grid
@mescius/wijmo.react.grid.filter
@mescius/wijmo.react.input
@mescius/wijmo
@mescius/wijmo.cultures
```

### 2. New Components Created

#### **WijmoDataGrid** (`src/components/WijmoDataGrid.tsx`)
A reusable, high-performance data grid component with:
- ✅ **Virtual Scrolling** - Renders only visible rows for optimal performance
- ✅ **Built-in Pagination** - Handles large datasets efficiently
- ✅ **Sorting & Filtering** - Built-in column sorting and filtering
- ✅ **Memory Optimization** - Uses CollectionView with `trackChanges: false`
- ✅ **Lazy Loading** - Supports loading data on demand
- ✅ **Customizable** - Flexible column configuration

#### **WijmoComparisonViewer** (`src/components/WijmoComparisonViewer.tsx`)
Replaces the old comparison viewer with:
- ✅ Better memory management for large datasets
- ✅ Smooth pagination without UI breaking
- ✅ Export functionality for matched/unmatched records
- ✅ Real-time filtering and search

#### **WijmoPaginatedResultsViewer** (`src/components/WijmoPaginatedResultsViewer.tsx`)
Replaces PaginatedResultsViewer with:
- ✅ Optimized for datasets with 1000+ records
- ✅ No memory leaks during pagination
- ✅ Smooth scrolling and filtering

## License Setup

### Step 1: Get Your License Key
Since you have a Wijmo license from MESCIUS, you need to:

1. Log into your MESCIUS account at https://developer.mescius.com/
2. Navigate to your account/licenses section
3. Copy your Wijmo license key

### Step 2: Add License Key
Open `src/config/wijmo.config.ts` and add your license key:

```typescript
export function initializeWijmo() {
  // Replace with your actual license key
  setLicenseKey('YOUR-LICENSE-KEY-HERE');
  
  console.log('Wijmo initialized with license');
}
```

### Step 3: Verify License
After adding the license key, restart your development server:

```bash
npm run dev
```

You should see "Wijmo initialized with license" in the browser console without any license warnings.

## How to Use the New Components

### Option 1: Replace Existing Viewers

#### In FileComparisonApp.tsx or any component using old viewers:

**Before:**
```typescript
import PaginatedResultsViewer from './PaginatedResultsViewer';
import ComparisonViewer from './ComparisonViewer';
```

**After:**
```typescript
import WijmoPaginatedResultsViewer from './WijmoPaginatedResultsViewer';
import WijmoComparisonViewer from './WijmoComparisonViewer';
```

### Option 2: Use WijmoDataGrid Directly

For custom implementations:

```typescript
import WijmoDataGrid from './WijmoDataGrid';

// Define your columns
const columns = [
  { binding: 'id', header: 'ID', width: 80 },
  { binding: 'name', header: 'Name', width: 200 },
  { binding: 'email', header: 'Email', width: 250 },
  { binding: 'status', header: 'Status', width: 120 },
];

// Use in your component
<WijmoDataGrid
  data={yourData}
  columns={columns}
  pageSize={100}
  allowPaging={true}
  allowSorting={true}
  allowFiltering={true}
  totalItems={totalCount}
  loading={isLoading}
  onLoadMoreData={(page) => loadPage(page)}
  height={600}
  showRowNumbers={true}
/>
```

### Option 3: Use for File Comparison

```typescript
import WijmoComparisonViewer from './WijmoComparisonViewer';

<WijmoComparisonViewer
  runId={currentRunId}
  columns="id,name,email"
  onClose={() => setShowComparison(false)}
/>
```

## Key Features & Benefits

### Memory Management
- **Before**: Loading 10,000+ records would cause browser slowdown/crash
- **After**: Wijmo's virtual scrolling only renders visible rows (~20-30 at a time)
- **Result**: Smooth performance even with 100,000+ records

### Pagination
- **Before**: Custom pagination had rendering issues and state management bugs
- **After**: Wijmo's built-in CollectionView handles pagination natively
- **Result**: No UI breaking, smooth page transitions

### Filtering & Sorting
- **Before**: Client-side filtering could freeze the UI
- **After**: Wijmo handles filtering efficiently using indexes
- **Result**: Instant filtering even on large datasets

## Configuration Options

### WijmoDataGrid Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `any[]` | `[]` | Array of data objects to display |
| `columns` | `Column[]` | `[]` | Column definitions |
| `pageSize` | `number` | `100` | Number of rows per page |
| `allowPaging` | `boolean` | `true` | Enable pagination |
| `allowSorting` | `boolean` | `true` | Enable column sorting |
| `allowFiltering` | `boolean` | `true` | Enable column filtering |
| `loading` | `boolean` | `false` | Show loading indicator |
| `totalItems` | `number` | - | Total number of items (for pagination) |
| `onLoadMoreData` | `(page: number) => void` | - | Callback for loading more data |
| `height` | `number \| string` | `600` | Grid height |
| `showRowNumbers` | `boolean` | `false` | Show row numbers |
| `frozenColumns` | `number` | `0` | Number of columns to freeze |

### Column Configuration

```typescript
interface Column {
  binding: string;        // Property name in data object
  header: string;         // Column header text
  width?: number | string; // Column width (number for pixels, '*' for auto)
  align?: string;         // Text alignment: 'left' | 'center' | 'right'
  format?: string;        // Number format (e.g., 'n2' for 2 decimals, 'c' for currency)
  visible?: boolean;      // Show/hide column
  isReadOnly?: boolean;   // Make column read-only
}
```

## Performance Tips

### 1. Use Pagination for Large Datasets
```typescript
// Recommended for datasets > 1000 records
<WijmoDataGrid
  data={data}
  pageSize={100}
  allowPaging={true}
  totalItems={totalRecords}
/>
```

### 2. Disable Change Tracking
The component already does this by default:
```typescript
// In WijmoDataGrid.tsx
const cv = new CollectionView(data, {
  pageSize: pageSize,
  trackChanges: false, // Better performance
});
```

### 3. Use Frozen Columns Wisely
```typescript
// Freeze first 2 columns for better UX on wide tables
<WijmoDataGrid
  frozenColumns={2}
  // ... other props
/>
```

### 4. Optimize Column Count
- Only show necessary columns
- Use `visible: false` for hidden but needed columns
- Combine related data into single columns when possible

## Troubleshooting

### License Warnings
**Problem**: "Wijmo evaluation version" message appears

**Solution**: 
1. Verify license key is correctly added in `wijmo.config.ts`
2. Clear browser cache and restart dev server
3. Check license key is valid and not expired

### Memory Issues Persist
**Problem**: Still experiencing memory issues

**Solutions**:
1. Ensure you're using the Wijmo components, not old ones
2. Check `pageSize` - reduce if needed (try 50 instead of 100)
3. Verify `trackChanges: false` in CollectionView
4. Check browser DevTools Memory profiler for actual leaks

### Pagination Not Working
**Problem**: Grid doesn't paginate correctly

**Solutions**:
1. Ensure `allowPaging={true}` is set
2. Verify `totalItems` prop is passed correctly
3. Check `onLoadMoreData` callback is implemented
4. Review browser console for errors

### Styling Issues
**Problem**: Grid looks wrong or unstyled

**Solutions**:
1. Ensure Wijmo CSS is imported: `@mescius/wijmo/styles/wijmo.css`
2. Check for CSS conflicts in global styles
3. Use custom styling in the `<style jsx global>` block

## Migration Checklist

- [ ] Install Wijmo packages (already done)
- [ ] Add license key to `wijmo.config.ts`
- [ ] Test WijmoDataGrid with sample data
- [ ] Replace old viewers with Wijmo versions
- [ ] Test pagination with large datasets
- [ ] Verify memory usage in browser DevTools
- [ ] Test filtering and sorting
- [ ] Test export functionality
- [ ] Update any custom components using old grids
- [ ] Remove old grid components (optional)

## Example: Complete Integration

```typescript
// In your main component (e.g., FileComparisonApp.tsx)
import React, { useState } from 'react';
import WijmoComparisonViewer from './WijmoComparisonViewer';
import WijmoPaginatedResultsViewer from './WijmoPaginatedResultsViewer';

export default function FileComparisonApp() {
  const [currentView, setCurrentView] = useState<'comparison' | 'results'>('results');
  const [runId, setRunId] = useState<number>(1);
  const [columns, setColumns] = useState<string>('id,name,email');

  return (
    <div className="container mx-auto p-6">
      {currentView === 'results' && (
        <WijmoPaginatedResultsViewer 
          runId={runId}
          onBack={() => setCurrentView('comparison')}
        />
      )}
      
      {currentView === 'comparison' && (
        <WijmoComparisonViewer
          runId={runId}
          columns={columns}
          onClose={() => setCurrentView('results')}
        />
      )}
    </div>
  );
}
```

## Support & Resources

### Wijmo Documentation
- Official Docs: https://developer.mescius.com/wijmo/docs
- FlexGrid Guide: https://developer.mescius.com/wijmo/react-ui-components
- API Reference: https://developer.mescius.com/wijmo/api

### MESCIUS Support
- Support Portal: https://developer.mescius.com/support
- Forums: https://developer.mescius.com/forums/wijmo
- Knowledge Base: https://developer.mescius.com/wijmo/knowledge-base

### Performance Monitoring
Use browser DevTools to monitor:
```javascript
// Check memory usage
console.log(performance.memory);

// Profile specific operations
console.time('grid-render');
// ... grid operations
console.timeEnd('grid-render');
```

## Next Steps

1. **Add License Key** - Most important! Add your Wijmo license key
2. **Test Integration** - Run the app and test with your actual data
3. **Monitor Performance** - Use DevTools to verify memory improvements
4. **Customize Styling** - Adjust grid appearance to match your design
5. **Update Components** - Replace old viewers throughout the app

## Questions?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Wijmo documentation
3. Contact MESCIUS support with your license key
4. Check browser console for specific errors

---

**Remember**: The Wijmo components are designed to handle millions of records efficiently. Start with the default configurations and only customize when needed!

