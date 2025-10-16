/**
 * Wijmo Configuration
 * 
 * This file contains configuration settings for Wijmo components
 * to ensure optimal performance and memory management.
 */

import { setLicenseKey } from '@mescius/wijmo';

/**
 * Initialize Wijmo with license key
 * Call this once at app startup
 */
export function initializeWijmo() {
  // Set your Wijmo license key here
  // You should have received this from MESCIUS after purchasing the license
  // For now, Wijmo will run in evaluation mode
  
  // Example:
  // setLicenseKey('your-license-key-here');
  
  console.log('Wijmo initialized');
}

/**
 * Default grid settings for optimal performance
 */
export const DEFAULT_GRID_CONFIG = {
  pageSize: 100,
  allowPaging: true,
  allowSorting: true,
  allowFiltering: true,
  deferResizing: true,
  quickAutoSize: true,
  virtualScrolling: true,
};

/**
 * Memory optimization settings
 */
export const MEMORY_CONFIG = {
  // Use pagination for datasets larger than this threshold
  paginationThreshold: 1000,
  
  // Virtual scrolling threshold
  virtualScrollThreshold: 100,
  
  // Max items to keep in memory at once
  maxItemsInMemory: 500,
  
  // Enable collection view tracking changes (disable for better performance)
  trackChanges: false,
};

/**
 * Export formats configuration
 */
export const EXPORT_CONFIG = {
  maxRowsForExport: 100000,
  csvEncoding: 'utf-8',
  excelFormat: 'xlsx',
};

export default {
  DEFAULT_GRID_CONFIG,
  MEMORY_CONFIG,
  EXPORT_CONFIG,
  initializeWijmo,
};

