# Progressive Chunk Loading - Implementation Summary

## Overview
Implemented progressive chunk loading that allows users to view processed data while comparison is still running. Chunks are now 200k rows each instead of 10k for better performance.

## Changes Made

### 1. Backend Changes

#### Database (`database.py`)
- Added `status` column to `comparison_export_files` table to track chunk processing status
- Migration script added to ensure backward compatibility

#### Chunked File Exporter (`chunked_file_exporter.py`)
- **Updated chunk size from 10k to 200k rows** per file for optimal performance
- Added `_register_chunk()` method to register chunks in database immediately after creation
- Chunks are registered with status='completed' as soon as they're written to disk
- Added `_current_columns` attribute to track column combination during export

#### Main API (`main.py`)
- **New Endpoint**: `/api/comparison-export/{run_id}/available-chunks`
  - Returns only NEW chunks since last poll (using `last_chunk_id` parameter)
  - Includes processing status to indicate if more chunks are coming
  - Groups chunks by category (matched, only_a, only_b)
  - Returns `poll_again` flag to hint UI whether to continue polling
  - Optimized for real-time polling every 2 seconds

#### How It Works (Backend)
1. When comparison starts, chunks are created with 200k rows each
2. Each chunk is immediately registered in `comparison_export_files` table
3. Database transaction commits immediately after each chunk creation
4. Frontend polls the API every 2 seconds for new chunks
5. API returns only chunks with `file_id > last_chunk_id` seen by client

### 2. Frontend Changes

#### ChunkedFileListViewer Component (`ChunkedFileListViewer.tsx`)
- **Updated display text**: Changed from "10k records/chunk" to "200k records/chunk"
- **Added progressive loading state**:
  - `isProcessing`: Tracks if comparison is still running
  - `lastChunkId`: Tracks the last chunk ID seen by client
  - `pollingInterval`: Manages polling timer

- **New Function**: `pollForNewChunks()`
  - Calls `/available-chunks` API every 2 seconds when processing
  - Incrementally adds new chunks to the list
  - Shows toast notification when new chunks appear
  - Automatically stops polling when processing completes

- **Enhanced `loadChunkFiles()`**:
  - Checks job status to determine if processing is ongoing
  - Starts polling automatically if processing detected
  - Shows "Processing in progress" message

- **Visual Indicators**:
  - Animated spinner with "Processing... New chunks appearing" when active
  - Toast notifications when new chunks become available
  - Real-time counter updates

## User Experience

### Before (Old Behavior)
- Wait for ALL 7.1M rows to process before seeing ANY results
- Fixed 10k row chunks
- No indication of progress
- Must refresh to see results

### After (New Behavior)
- See first chunk (200k rows) as soon as it's processed
- Continue reviewing data while processing continues
- Real-time notifications when new chunks appear
- Automatic polling - no manual refresh needed
- Larger chunks (200k) = fewer files, better performance
- Processing indicator shows when more chunks are coming

## Configuration

### Chunk Size
- **Default**: 200k rows per chunk
- **Location**: `chunked_file_exporter.py` line 115
- Can be overridden using `max_export_rows` parameter

### Polling Interval
- **Default**: 2 seconds
- **Location**: `ChunkedFileListViewer.tsx` line 88
- Adjust based on network/performance needs

### Max Rows Limit
- When user sets max row limit (e.g., 10k), it's now properly respected:
  - `_extract_unique_keys_chunked()` stops at limit
  - `_export_records_chunked()` stops at limit
  - Both File A and File B comparison use the same limit

## API Endpoints

### Get Available Chunks (Progressive Loading)
```
GET /api/comparison-export/{run_id}/available-chunks?columns={cols}&last_chunk_id={id}
```

**Response:**
```json
{
  "run_id": 123,
  "columns": "col1,col2",
  "new_chunks": [...],
  "chunks_by_category": {
    "matched": [...],
    "only_a": [...],
    "only_b": [...]
  },
  "total_new_chunks": 5,
  "processing_status": {
    "is_processing": true,
    "job_status": "running",
    "job_stage": "generating_comparisons",
    "progress_percent": 75
  },
  "last_chunk_id": 42,
  "poll_again": true
}
```

### Existing Status Endpoint (Enhanced)
```
GET /api/comparison-export/{run_id}/status?columns={cols}
```
Still works as before, returns all available chunks.

## Testing

### Test Progressive Loading
1. Start a comparison with large files (>200k rows)
2. Enable "Generate Comparisons" toggle
3. Set max row limit if desired (e.g., 10k for testing)
4. Navigate to comparison view
5. Observe:
   - First chunk appears immediately when ready
   - "Processing... New chunks appearing" indicator shows
   - Toast notifications when new chunks arrive
   - Chunks increment in real-time
   - Polling stops when processing completes

### Test with Max Row Limit
1. Set max row limit to 10,000
2. Start comparison with 7.1M row file
3. System should only process first 10k rows
4. Chunk files should contain subset of 10k rows
5. Processing should be much faster

## Performance Benefits

1. **Faster User Feedback**: See results in seconds instead of minutes
2. **Better UX**: Review data while processing continues
3. **Larger Chunks**: 200k vs 10k = 20x fewer files to manage
4. **Efficient Polling**: Only fetches NEW chunks, not entire list
5. **Smart Termination**: Polling stops automatically when done

## Database Schema

### comparison_export_files Table
```sql
CREATE TABLE comparison_export_files (
    file_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER,
    column_combination TEXT,
    category TEXT,
    file_path TEXT,
    file_size INTEGER DEFAULT 0,
    row_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    chunk_index INTEGER DEFAULT 1,
    status TEXT DEFAULT 'completed',  -- NEW
    FOREIGN KEY (run_id) REFERENCES runs(run_id)
)
```

## Files Modified

### Backend
- `uniqueidentifier2/backend/database.py` - Added status column
- `uniqueidentifier2/backend/chunked_file_exporter.py` - Updated chunk size, added registration
- `uniqueidentifier2/backend/main.py` - Added available-chunks endpoint

### Frontend
- `uniqueidentifier2/frontend/src/components/ChunkedFileListViewer.tsx` - Added polling mechanism

## Backward Compatibility

- ✅ Old runs without status column will work (migration handles it)
- ✅ Existing chunks are treated as 'completed'
- ✅ Original status endpoint still works
- ✅ Non-progressive clients can still use the system

## Future Enhancements

1. **Server-Sent Events (SSE)**: Replace polling with real-time push
2. **WebSockets**: Bidirectional real-time communication
3. **Chunk Prioritization**: Process "matched" chunks first
4. **Partial Chunk Display**: Show partial chunk before 200k rows complete
5. **Parallel Chunk Processing**: Generate multiple chunks simultaneously

