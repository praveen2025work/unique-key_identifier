"""
Test to verify intelligent key discovery returns proper tuple format (not nested with scores)
"""
import pandas as pd
import numpy as np
from intelligent_key_discovery import IntelligentKeyDiscovery, discover_unique_keys_intelligent


def test_intelligent_discovery_output_format():
    """
    Test that intelligent key discovery returns plain tuples, not (combo, score) pairs
    """
    print("=" * 80)
    print("INTELLIGENT KEY DISCOVERY - OUTPUT FORMAT TEST")
    print("=" * 80)
    print()
    
    # Create test dataframe with many columns (to trigger intelligent discovery)
    np.random.seed(42)
    n_rows = 10000
    n_cols = 60  # More than 50 to trigger intelligent discovery
    
    data = {}
    for i in range(n_cols):
        if i < 5:
            # High cardinality ID-like columns
            data[f'id_{i}'] = np.arange(n_rows) + np.random.randint(0, 100, n_rows)
        elif i < 10:
            # Moderate cardinality
            data[f'code_{i}'] = [f'CODE_{j % 500}' for j in range(n_rows)]
        else:
            # Regular columns
            data[f'col_{i}'] = np.random.randint(0, 100, n_rows)
    
    df = pd.DataFrame(data)
    
    print(f"📊 Test dataset: {len(df):,} rows × {len(df.columns)} columns")
    print()
    
    # Test 1: Direct class usage
    print("Test 1: IntelligentKeyDiscovery class")
    print("-" * 40)
    
    discoverer = IntelligentKeyDiscovery(df, max_combination_size=2, max_results=10)
    combinations = discoverer.discover_keys(target_size=2)
    
    print(f"Found {len(combinations)} combinations")
    
    all_valid = True
    for i, combo in enumerate(combinations[:5], 1):
        print(f"  Combo {i}: {combo}")
        print(f"    Type: {type(combo)}")
        
        # Check if it's a plain tuple of strings
        if not isinstance(combo, tuple):
            print(f"    ❌ FAIL: Not a tuple!")
            all_valid = False
        elif len(combo) > 0 and not isinstance(combo[0], str):
            print(f"    ❌ FAIL: First element is {type(combo[0])}, not string!")
            print(f"    ❌ This looks like a (combo, score) pair!")
            all_valid = False
        elif len(combo) > 0 and isinstance(combo[0], (tuple, list)):
            print(f"    ❌ FAIL: Nested structure detected!")
            all_valid = False
        else:
            print(f"    ✓ Valid: Plain tuple of strings")
    
    print()
    
    # Test 2: Wrapper function
    print("Test 2: discover_unique_keys_intelligent function")
    print("-" * 40)
    
    combinations2 = discover_unique_keys_intelligent(df, num_columns=2, max_combinations=10)
    
    print(f"Found {len(combinations2)} combinations")
    
    for i, combo in enumerate(combinations2[:5], 1):
        print(f"  Combo {i}: {combo}")
        print(f"    Type: {type(combo)}")
        
        if not isinstance(combo, tuple):
            print(f"    ❌ FAIL: Not a tuple!")
            all_valid = False
        elif len(combo) > 0 and not isinstance(combo[0], str):
            print(f"    ❌ FAIL: First element is {type(combo[0])}, not string!")
            print(f"    ❌ This looks like a (combo, score) pair!")
            all_valid = False
        elif len(combo) > 0 and isinstance(combo[0], (tuple, list)):
            print(f"    ❌ FAIL: Nested structure detected!")
            all_valid = False
        else:
            print(f"    ✓ Valid: Plain tuple of strings")
    
    print()
    
    # Test 3: Check that combinations can be used directly in analysis
    print("Test 3: Combinations are usable in pandas groupby")
    print("-" * 40)
    
    usable_count = 0
    for combo in combinations[:3]:
        try:
            # Try to use the combination in a groupby (as the analysis code does)
            combo_list = list(combo)
            grouped = df.groupby(combo_list, sort=False).size()
            print(f"  ✓ '{','.join(combo)}' → {len(grouped):,} unique groups")
            usable_count += 1
        except Exception as e:
            print(f"  ❌ '{combo}' → ERROR: {e}")
            all_valid = False
    
    print()
    print("=" * 80)
    
    if all_valid and usable_count == min(3, len(combinations)):
        print("✅ ALL TESTS PASSED!")
        print("   Intelligent key discovery returns proper tuple format.")
        print("   Combinations are ready for analysis without further processing.")
    else:
        print("❌ TESTS FAILED!")
        print("   Intelligent key discovery is still returning nested/scored tuples.")
    
    print("=" * 80)
    
    return all_valid


if __name__ == "__main__":
    success = test_intelligent_discovery_output_format()
    exit(0 if success else 1)

