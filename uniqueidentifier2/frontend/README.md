# Frontend - Unique Key Identifier UI

Modern React application for file comparison and unique key analysis.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Application will run on: **http://localhost:5173**

## Build

```bash
npm run build
```

Production build will be in `dist/` directory.

## Features

### Dashboard
- File configuration (File A, File B, Working Directory)
- Column loading and preview
- Number of columns selector (1-10)
- Max rows limiter
- Data quality check toggle
- Expected/excluded combinations builder
- Recent runs with view/clone functionality

### Workflow View
- Real-time progress tracking
- Processing stages with status indicators
- Auto-refresh every 2 seconds
- Auto-redirect to results when complete
- Error display

### Analysis Results (4 Tabs)

**📊 Analysis Tab**
- Side-by-side comparison table (File A vs File B)
- Sub-tabs: Side-by-Side, Matched, A Only, B Only, Neither
- Uniqueness scores and duplicate counts
- Color-coded unique keys (green highlight)
- CSV/Excel downloads

**⚙️ Workflow Tab**
- Processing stages review
- Progress bar
- Status badge
- Stage timing and details

**🔄 File Comparison Tab**
- Column selector dropdown
- Match rate and summary statistics
- Category tabs with actual data records:
  - ✅ Matched: Records in BOTH files
  - 📘 Only in A: Records ONLY in File A
  - 📙 Only in B: Records ONLY in File B
- Full-screen data grid
- Click to copy any cell value
- Excel download (4 sheets: Summary, Matched, Only A, Only B)

**✅ Data Quality Tab**
- Status summary (Pass/Warning/Critical)
- Issue counts by severity (High/Medium/Low)
- Cross-file discrepancies with full details
- File-specific issues organized by file
- Complete issue descriptions
- Severity badges

## Components

- `App.tsx` - Main application routing
- `FileComparisonApp.tsx` - Dashboard and results (main UI)
- `WorkflowScreen.tsx` - Progress tracking view
- `ComparisonViewer.tsx` - File comparison component (standalone)
- `DataQualityViewer.tsx` - Data quality component (standalone)
- `ui/Input.tsx` - Consistent form components
- `ui/tabs.tsx` - Tab components

## API Service

`services/api.ts` provides methods for:
- Health checks
- Column preview
- Analysis submission
- Status polling
- Results fetching
- Comparison data
- Data quality results
- Downloads

## Configuration

Backend endpoint can be configured in the UI settings (⚙️ icon) or defaults to:
```
http://localhost:8000
```

## Styling

- **Framework**: Tailwind CSS
- **Design**: Compact, professional, modern
- **Colors**: Blue primary, consistent palette
- **Typography**: Small sizes (text-xs, text-sm) for density
- **Icons**: Inline SVGs and emoji icons

## Development

### Hot Module Replacement
Vite provides instant updates during development.

### TypeScript
Full type safety with TypeScript interfaces in `types/index.ts`.

### State Management
React hooks and local state (no external state library needed).

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### Frontend Won't Start
```bash
npm install
npm run dev
```

### Backend Connection Error
1. Verify backend is running on port 8000
2. Check API endpoint in settings (⚙️)
3. Check browser console for errors

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Version

2.0.0 - React 19 with enhanced file comparison and data quality features
