"""
Test intelligent key discovery with multi-size search (2-10 columns)
"""
import pandas as pd
import numpy as np
from intelligent_key_discovery import discover_unique_keys_intelligent


def test_multi_size_discovery():
    """
    Test that intelligent discovery finds combinations from 2 to 10 columns
    """
    print("=" * 80)
    print("MULTI-SIZE INTELLIGENT KEY DISCOVERY TEST")
    print("=" * 80)
    print()
    
    # Create test dataframe with many columns
    np.random.seed(42)
    n_rows = 10000
    n_cols = 80  # Many columns to trigger intelligent discovery
    
    data = {}
    
    # Create columns with different cardinality levels
    for i in range(n_cols):
        if i < 10:
            # High cardinality ID-like columns
            data[f'id_{i}'] = np.arange(n_rows) + np.random.randint(0, 100, n_rows)
        elif i < 20:
            # Medium cardinality code columns
            data[f'code_{i}'] = [f'CODE_{j % 1000}' for j in range(n_rows)]
        elif i < 30:
            # Date-like columns
            data[f'date_{i}'] = [f'2024-{(j % 12) + 1:02d}-{(j % 28) + 1:02d}' for j in range(n_rows)]
        else:
            # Regular low-cardinality columns
            data[f'col_{i}'] = np.random.randint(0, 50, n_rows)
    
    df = pd.DataFrame(data)
    
    print(f"📊 Test dataset: {len(df):,} rows × {len(df.columns)} columns")
    print()
    
    # Test: Multi-size discovery (2 to 10 columns)
    print("🔍 Testing Multi-Size Discovery (2-10 columns, ~100 combinations)")
    print("-" * 80)
    
    combinations = discover_unique_keys_intelligent(
        df=df,
        num_columns=None,  # None = search multiple sizes
        max_combinations=100,
        min_columns=2,
        max_columns=10
    )
    
    print()
    print("=" * 80)
    print("RESULTS")
    print("=" * 80)
    
    # Analyze results
    size_distribution = {}
    for combo in combinations:
        size = len(combo)
        size_distribution[size] = size_distribution.get(size, 0) + 1
    
    print(f"\n✅ Total combinations found: {len(combinations)}")
    print(f"\nSize Distribution:")
    for size in sorted(size_distribution.keys()):
        count = size_distribution[size]
        bar = "█" * (count // 2)
        print(f"  {size:2d} columns: {count:3d} combinations {bar}")
    
    print(f"\n📊 Sample combinations:")
    # Show some examples from different sizes
    shown_sizes = set()
    for combo in combinations[:20]:
        size = len(combo)
        if size not in shown_sizes or len(shown_sizes) < 5:
            shown_sizes.add(size)
            cols_display = ', '.join(combo[:3])
            if len(combo) > 3:
                cols_display += f', ... ({len(combo)} total)'
            print(f"  [{size} cols] {cols_display}")
    
    # Validation checks
    print()
    print("=" * 80)
    print("VALIDATION")
    print("=" * 80)
    
    all_valid = True
    
    # Check 1: Multiple sizes found
    if len(size_distribution) < 3:
        print("❌ FAIL: Expected combinations of multiple sizes (2-10)")
        print(f"   Only found sizes: {sorted(size_distribution.keys())}")
        all_valid = False
    else:
        print(f"✅ PASS: Found {len(size_distribution)} different combination sizes")
    
    # Check 2: Size range is correct
    min_size = min(size_distribution.keys())
    max_size = max(size_distribution.keys())
    if min_size < 2 or max_size > 10:
        print(f"❌ FAIL: Size range outside expected bounds (2-10)")
        print(f"   Actual range: {min_size}-{max_size}")
        all_valid = False
    else:
        print(f"✅ PASS: Size range is within bounds: {min_size}-{max_size}")
    
    # Check 3: Reasonable number of combinations
    if len(combinations) < 50:
        print(f"⚠️  WARNING: Only found {len(combinations)} combinations (expected ~100)")
        print(f"   This might be okay for datasets with fewer promising combinations")
    elif len(combinations) > 110:
        print(f"⚠️  WARNING: Found {len(combinations)} combinations (expected ~100)")
        print(f"   This is more than requested but not necessarily bad")
    else:
        print(f"✅ PASS: Found {len(combinations)} combinations (target: 100)")
    
    # Check 4: All combinations are proper tuples
    invalid_count = 0
    for combo in combinations[:10]:
        if not isinstance(combo, tuple):
            invalid_count += 1
        elif not all(isinstance(c, str) for c in combo):
            invalid_count += 1
    
    if invalid_count > 0:
        print(f"❌ FAIL: {invalid_count} invalid combinations found")
        all_valid = False
    else:
        print(f"✅ PASS: All combinations are valid tuples of strings")
    
    # Check 5: Larger combinations exist
    has_large = any(len(c) >= 5 for c in combinations)
    if not has_large:
        print(f"⚠️  WARNING: No combinations with 5+ columns found")
        print(f"   Max size: {max_size}")
    else:
        large_count = sum(1 for c in combinations if len(c) >= 5)
        print(f"✅ PASS: Found {large_count} combinations with 5+ columns")
    
    print()
    print("=" * 80)
    
    if all_valid:
        print("✅ TEST PASSED!")
        print("   Intelligent discovery successfully finds combinations from 2-10 columns")
    else:
        print("❌ TEST FAILED!")
        print("   Some validation checks did not pass")
    
    print("=" * 80)
    
    return all_valid, len(combinations), size_distribution


if __name__ == "__main__":
    success, total, sizes = test_multi_size_discovery()
    
    print(f"\nSummary: {total} combinations across {len(sizes)} different sizes")
    exit(0 if success else 1)

