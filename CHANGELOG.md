# Changelog

All notable changes to the Unique Key Identifier project will be documented in this file.

## [2.0.1] - October 17, 2025

### Added
- **Smart Keys Feature**: Intelligent unique key discovery system
  - Auto Discovery Mode: Searches 2-10 column combinations automatically (100-150 results)
  - Guided Discovery Mode: Enhances user-provided base combinations with 100-150 variations each
  - Optimized for datasets with 300+ columns
- **Memory Optimizations**: Backend memory management improvements
  - Memory monitoring with psutil
  - Automatic DataFrame cleanup after analysis
  - Garbage collection enforcement
  - Memory usage logging for operations >100MB
- **UI Enhancements**: Analysis results display improvements
  - Collapsible groups by base columns
  - Summary banner showing total combinations breakdown
  - Visual hierarchy with base columns highlighted
  - Enhanced variation display with clear formatting
- **Chunked File Viewer Optimizations**:
  - Configurable page size (50-1000 rows, default: 100)
  - Automatic data cleanup on page/chunk switches
  - Lazy rendering for large datasets
  - Support for 200k+ row chunks without memory crashes

### Fixed
- Database corruption handling and repair procedures
- Tuple extraction errors in export generation
- Column count threshold limitations for Smart Keys
- Memory accumulation in chunked file viewer
- CollectionView memory leaks in Wijmo grid
- Long cell value truncation (200 chars max)

### Changed
- Smart Keys now ignores UI column count field and always searches 2-10 columns
- Default page size reduced from 1000 to 100 rows for better performance
- Multiple user-provided combinations now ALL get guided discovery enhancement

### Performance
- 90% memory reduction in chunked file viewer
- 40-60% memory reduction in backend analysis operations
- Support for millions of rows with adaptive sampling (500k-1M samples)
- Balanced combination distribution across all sizes

## [1.0.0] - Initial Release

### Features
- Multi-format file support (CSV, Excel, DAT, TXT)
- File comparison and unique key identification
- Data quality checking
- Audit logging and notifications
- Scheduled comparisons
- Export to CSV/Excel formats
- Chunked processing for large files
- Modern React/Next.js frontend
- FastAPI backend with SQLite database

---

**Note**: Version 2.0+ represents a major enhancement focused on intelligent key discovery and performance optimization for large-scale datasets.
