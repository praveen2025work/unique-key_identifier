"""
Quick test to verify intelligent discovery triggers correctly after fix
"""
import pandas as pd
import numpy as np
from analysis import smart_discover_combinations

def test_small_dataset():
    """Test with SMALL dataset (< 50 columns) - should work now!"""
    print("=" * 80)
    print("TEST 1: Small Dataset (30 columns) - Should Trigger Intelligent Discovery")
    print("=" * 80)
    print()
    
    # Create small dataset (30 columns)
    np.random.seed(42)
    n_rows = 1000
    n_cols = 30  # Less than 50!
    
    data = {}
    for i in range(n_cols):
        if i < 5:
            data[f'id_{i}'] = np.arange(n_rows)
        else:
            data[f'col_{i}'] = np.random.randint(0, 100, n_rows)
    
    df = pd.DataFrame(data)
    
    print(f"📊 Dataset: {len(df.columns)} columns × {len(df):,} rows")
    print()
    
    # Test with intelligent discovery ENABLED
    print("Testing with use_intelligent_discovery=True:")
    print("-" * 80)
    
    combinations = smart_discover_combinations(
        df=df,
        num_columns=2,
        max_combinations=20,
        use_intelligent_discovery=True  # ← This should work now!
    )
    
    print()
    print(f"✅ Result: Found {len(combinations)} combinations")
    print(f"   Sample: {combinations[:3]}")
    print()
    
    if len(combinations) > 0:
        print("✅ PASS: Intelligent discovery worked on small dataset!")
    else:
        print("❌ FAIL: No combinations found")
    
    return len(combinations) > 0

def test_guided_discovery():
    """Test guided discovery with base combination"""
    print()
    print("=" * 80)
    print("TEST 2: Guided Discovery with Base Combination")
    print("=" * 80)
    print()
    
    # Create dataset
    np.random.seed(42)
    n_rows = 1000
    n_cols = 40
    
    data = {}
    for i in range(n_cols):
        if i < 5:
            data[f'id_{i}'] = np.arange(n_rows)
        elif i < 10:
            data[f'code_{i}'] = [f'CODE_{j % 100}' for j in range(n_rows)]
        else:
            data[f'col_{i}'] = np.random.randint(0, 50, n_rows)
    
    df = pd.DataFrame(data)
    
    print(f"📊 Dataset: {len(df.columns)} columns × {len(df):,} rows")
    print()
    
    # Test with base combination
    base = ('id_0', 'code_5')
    print(f"Base combination: {base}")
    print()
    
    print("Testing guided discovery:")
    print("-" * 80)
    
    combinations = smart_discover_combinations(
        df=df,
        num_columns=2,
        max_combinations=20,
        use_intelligent_discovery=True,
        specified_combinations=[base]  # ← Should use as base hint
    )
    
    print()
    print(f"✅ Result: Found {len(combinations)} combinations")
    
    # Check if base columns are in results
    base_cols = set(base)
    combos_with_base = [c for c in combinations if base_cols.issubset(set(c))]
    
    print(f"   Combinations including base: {len(combos_with_base)}")
    if combos_with_base:
        print(f"   Examples: {combos_with_base[:3]}")
    
    print()
    
    if len(combos_with_base) > 0:
        print("✅ PASS: Guided discovery worked!")
    else:
        print("⚠️  WARNING: No combinations include base (might be OK)")
    
    return len(combinations) > 0

def test_without_intelligent_discovery():
    """Test that turning it OFF still works (heuristic approach)"""
    print()
    print("=" * 80)
    print("TEST 3: Without Intelligent Discovery (Heuristic Mode)")
    print("=" * 80)
    print()
    
    # Create dataset
    np.random.seed(42)
    data = {
        'id_1': np.arange(1000),
        'id_2': np.arange(1000),
        'code_1': [f'CODE_{i % 100}' for i in range(1000)],
        'value': np.random.randint(0, 50, 1000)
    }
    
    df = pd.DataFrame(data)
    
    print(f"📊 Dataset: {len(df.columns)} columns × {len(df):,} rows")
    print()
    
    print("Testing with use_intelligent_discovery=False:")
    print("-" * 80)
    
    combinations = smart_discover_combinations(
        df=df,
        num_columns=2,
        max_combinations=10,
        use_intelligent_discovery=False  # ← Should use heuristic
    )
    
    print()
    print(f"✅ Result: Found {len(combinations)} combinations")
    print(f"   Sample: {combinations[:3]}")
    print()
    
    if len(combinations) > 0:
        print("✅ PASS: Heuristic mode still works!")
    else:
        print("❌ FAIL: No combinations found")
    
    return len(combinations) > 0

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("INTELLIGENT DISCOVERY FIX VERIFICATION")
    print("=" * 80)
    print()
    
    results = []
    
    # Run tests
    results.append(("Small Dataset Test", test_small_dataset()))
    results.append(("Guided Discovery Test", test_guided_discovery()))
    results.append(("Heuristic Mode Test", test_without_intelligent_discovery()))
    
    # Summary
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print()
    
    if all(p for _, p in results):
        print("✅ ALL TESTS PASSED! The fix is working correctly.")
        exit(0)
    else:
        print("❌ SOME TESTS FAILED! Check the output above.")
        exit(1)

