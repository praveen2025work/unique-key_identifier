"""
Test script to verify the tuple flattening fix works correctly
"""

def parse_combination_old(combination):
    """OLD BUGGY VERSION - for comparison"""
    if isinstance(combination, str):
        column_list = [c.strip() for c in combination.split(',')]
    else:
        column_list = list(combination)  # PROBLEM: doesn't handle nesting
    return column_list


def parse_combination_new(combination):
    """NEW FIXED VERSION"""
    if isinstance(combination, str):
        column_list = [c.strip() for c in combination.split(',')]
    else:
        # Flatten nested tuples/lists (e.g., (('col1', 'col2'),) -> ['col1', 'col2'])
        temp_list = list(combination)
        # Check if we have nested tuples/lists
        if temp_list and isinstance(temp_list[0], (tuple, list)):
            # If first element is tuple/list, flatten it
            column_list = [str(c).strip() for c in temp_list[0]]
        else:
            # Normal case - just convert to list of strings
            column_list = [str(c).strip() for c in temp_list]
    
    # Validate we have a proper list of column names
    if not column_list or not all(isinstance(c, str) for c in column_list):
        return None
    
    return column_list


def run_tests():
    """Test various combination formats"""
    
    test_cases = [
        # (input, expected_output, description)
        (
            "GBP currency amount,sap cost centre",
            ["GBP currency amount", "sap cost centre"],
            "String format (comma-separated)"
        ),
        (
            ("GBP currency amount", "sap cost centre"),
            ["GBP currency amount", "sap cost centre"],
            "Normal tuple (flat)"
        ),
        (
            (("GBP currency amount", "sap cost centre"),),
            ["GBP currency amount", "sap cost centre"],
            "Nested tuple (THE PROBLEM CASE)"
        ),
        (
            ["GBP currency amount", "sap cost centre"],
            ["GBP currency amount", "sap cost centre"],
            "List format"
        ),
        (
            (["GBP currency amount", "sap cost centre"],),
            ["GBP currency amount", "sap cost centre"],
            "Nested list in tuple"
        ),
        (
            ("column1",),
            ["column1"],
            "Single column tuple"
        ),
        (
            (("column1",),),
            ["column1"],
            "Single column nested tuple"
        ),
    ]
    
    print("=" * 80)
    print("TUPLE FLATTENING FIX - TEST RESULTS")
    print("=" * 80)
    print()
    
    all_passed = True
    
    for i, (input_val, expected, description) in enumerate(test_cases, 1):
        print(f"Test {i}: {description}")
        print(f"  Input:    {repr(input_val)}")
        print(f"  Expected: {expected}")
        
        # Test old version (to show the bug)
        try:
            old_result = parse_combination_old(input_val)
            old_status = "✓" if old_result == expected else "✗"
            print(f"  Old Code: {old_status} {old_result}")
        except Exception as e:
            print(f"  Old Code: ✗ ERROR: {e}")
            old_status = "✗"
        
        # Test new version (should work)
        try:
            new_result = parse_combination_new(input_val)
            new_status = "✓" if new_result == expected else "✗"
            print(f"  New Code: {new_status} {new_result}")
            
            if new_result != expected:
                all_passed = False
                print(f"  ❌ FAILED!")
        except Exception as e:
            print(f"  New Code: ✗ ERROR: {e}")
            all_passed = False
            print(f"  ❌ FAILED!")
        
        print()
    
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED! The fix handles all combination formats correctly.")
    else:
        print("❌ SOME TESTS FAILED! The fix needs adjustment.")
    print("=" * 80)
    
    return all_passed


if __name__ == "__main__":
    run_tests()

