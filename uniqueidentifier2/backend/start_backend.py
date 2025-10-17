#!/usr/bin/env python
"""
Wrapper script to start backend with better error handling
"""
import sys
import traceback

try:
    from main import app
    import uvicorn
    
    print("Starting backend with error handling wrapper...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    
except Exception as e:
    print(f"\n{'='*60}")
    print(f"❌ FATAL ERROR: Backend crashed")
    print(f"{'='*60}")
    print(f"Error: {e}")
    print(f"\nFull traceback:")
    traceback.print_exc()
    print(f"{'='*60}\n")
    sys.exit(1)

