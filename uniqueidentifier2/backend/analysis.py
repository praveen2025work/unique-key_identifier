"""
Data analysis operations - combination discovery and uniqueness analysis
"""
from itertools import combinations
from config import MAX_COMBINATIONS

def smart_discover_combinations(df, num_columns, max_combinations=50, excluded_combinations=None, use_intelligent_discovery=True, specified_combinations=None):
    """
    Intelligently discover the best column combinations to analyze.
    
    Args:
        df: DataFrame to analyze
        num_columns: Target combination size
        max_combinations: Maximum number of combinations to return
        excluded_combinations: Combinations to exclude
        use_intelligent_discovery: Use new intelligent algorithm (prevents combinatorial explosion)
        specified_combinations: User-specified combinations (first one used as base hint)
    
    Returns:
        List of column combinations (tuples)
    """
    
    # NEW: Use intelligent discovery when enabled by user
    # Intelligent discovery works for any dataset but is especially useful for large ones
    if use_intelligent_discovery:
        print(f"🚀 Using Intelligent Key Discovery (avoiding combinatorial explosion)")
        print(f"   Dataset: {len(df.columns)} columns × {len(df):,} rows")
        
        from intelligent_key_discovery import discover_unique_keys_intelligent
        
        try:
            # NEW FEATURE: Guided Discovery - Use first specified combination as base hint
            base_combination = None
            if specified_combinations and len(specified_combinations) > 0:
                base_combination = specified_combinations[0]
                print(f"🎯 Guided Discovery: Using first specified combination as base hint")
                print(f"   Base: {', '.join(base_combination)}")
            
            # Search for combinations from 2 to 10 columns
            # When Smart Keys is enabled, ALWAYS search 2-10 columns (ignore UI's num_columns field)
            # For large datasets (300+ cols), get 100-150 combinations with balanced distribution
            target_combinations = 150 if len(df.columns) > 200 else 100
            
            print(f"   Smart Keys Mode: Searching 2-10 column combinations (ignoring UI column count)")
            
            combinations_found = discover_unique_keys_intelligent(
                df=df,
                num_columns=None,  # Search multiple sizes, not just one
                max_combinations=target_combinations,  # 100-150 based on dataset size
                excluded_combinations=excluded_combinations,
                min_columns=2,  # Start from 2-column combinations
                max_columns=10,  # ALWAYS 10 when Smart Keys enabled (don't use num_columns from UI)
                base_combination=base_combination  # NEW: Use first combo as hint
            )
            
            if combinations_found:
                print(f"✅ Found {len(combinations_found)} promising combinations intelligently")
                print(f"   Sizes: {min(len(c) for c in combinations_found)}-{max(len(c) for c in combinations_found)} columns")
                return combinations_found
            else:
                print("⚠️ Intelligent discovery returned no results, falling back to heuristic approach")
        except Exception as e:
            print(f"⚠️ Intelligent discovery error: {e}, falling back to heuristic approach")
            import traceback
            traceback.print_exc()
    
    # ORIGINAL HEURISTIC APPROACH (for smaller datasets or fallback)
    columns = df.columns.tolist()
    total_rows = len(df)
    
    # Filter out excluded columns
    excluded_cols = set()
    excluded_combos = set()
    if excluded_combinations:
        for exc in excluded_combinations:
            if len(exc) == 1:
                # Single column exclusion
                excluded_cols.add(exc[0])
            else:
                # Combination exclusion
                excluded_combos.add(tuple(sorted(exc)))
    
    # Remove excluded single columns from consideration
    columns = [col for col in columns if col not in excluded_cols]
    
    if not columns:
        return []  # All columns excluded
    
    # Strategy 1: Single columns with high cardinality (likely unique)
    single_col_candidates = []
    for col in columns:
        nunique = df[col].nunique()
        cardinality_ratio = nunique / total_rows
        if cardinality_ratio >= 0.8:  # At least 80% unique
            single_col_candidates.append((col, cardinality_ratio))
    
    # Sort by cardinality
    single_col_candidates.sort(key=lambda x: -x[1])
    
    # Strategy 2: ID-like columns (contains 'id', 'code', 'number')
    id_columns = [col for col in columns if any(keyword in col.lower() 
                  for keyword in ['id', 'code', 'number', 'key', 'identifier'])]
    
    # Strategy 3: If user wants specific column count, prioritize combinations with ID columns
    selected_combos = []
    
    # Add top single ID columns
    for col in id_columns[:5]:
        if col in columns:
            selected_combos.append((col,))
    
    # Add top single high-cardinality columns
    for col, ratio in single_col_candidates[:5]:
        if (col,) not in selected_combos:
            selected_combos.append((col,))
    
    # For 2+ columns, combine ID columns with other significant columns
    if num_columns >= 2:
        for id_col in id_columns[:3]:
            for other_col in columns:
                if other_col != id_col and len(selected_combos) < max_combinations:
                    combo = tuple(sorted([id_col, other_col]))
                    if combo not in selected_combos and len(combo) == num_columns:
                        selected_combos.append(combo)
        
        # Add high-cardinality combinations
        for i, (col1, _) in enumerate(single_col_candidates[:5]):
            for col2, _ in single_col_candidates[i+1:5]:
                combo = tuple(sorted([col1, col2]))
                if combo not in selected_combos and len(combo) == num_columns and len(selected_combos) < max_combinations:
                    selected_combos.append(combo)
    
    # FIXED: Only add more combinations if we have a reasonable number of columns
    # PREVENT combinatorial explosion by limiting this to small datasets
    if len(selected_combos) < max_combinations and len(columns) <= 30:
        # SAFE: Only enumerate when column count is reasonable
        all_combos = list(combinations(columns, num_columns))
        
        # SAFETY CHECK: Don't process if too many combinations
        if len(all_combos) > 10000:
            print(f"⚠️ Too many combinations ({len(all_combos):,}), limiting to heuristic selection")
        else:
            for combo in all_combos:
                if combo not in selected_combos:
                    selected_combos.append(combo)
                    if len(selected_combos) >= max_combinations:
                        break
    elif len(selected_combos) < max_combinations:
        # For large column sets, use stratified sampling of combinations
        print(f"ℹ️ Large dataset ({len(columns)} columns) - using heuristic selection only")
    
    # Filter out explicitly excluded combinations
    if excluded_combos:
        filtered_combos = []
        for combo in selected_combos:
            sorted_combo = tuple(sorted(combo))
            # Check if this combination is excluded
            is_excluded = sorted_combo in excluded_combos
            # Also check if any column in the combo is in an excluded combination
            if not is_excluded:
                for exc_combo in excluded_combos:
                    if len(exc_combo) == len(combo) and all(c in combo for c in exc_combo):
                        is_excluded = True
                        break
            if not is_excluded:
                filtered_combos.append(combo)
        selected_combos = filtered_combos
    
    return selected_combos[:max_combinations]

def analyze_file_combinations(df, num_columns, specified_combinations=None, excluded_combinations=None, use_intelligent_discovery=True):
    """Analyze all column combinations for a single file - MEMORY OPTIMIZED"""
    results = []
    columns = df.columns.tolist()
    total_rows = len(df)
    
    # Debug logging for input validation
    if specified_combinations:
        print(f"📊 Analyzing {len(specified_combinations)} specified combinations")
        # Validate structure
        for i, combo in enumerate(specified_combinations[:3]):  # Check first 3
            print(f"   Combo {i+1} type: {type(combo)}, content: {combo}")
    
    # Memory optimization: Convert to categorical if beneficial
    for col in columns:
        if df[col].dtype == 'object':
            cardinality_ratio = df[col].nunique() / len(df)
            if cardinality_ratio < 0.5:
                df[col] = df[col].astype('category')
    
    # Determine which combinations to analyze
    if specified_combinations and use_intelligent_discovery:
        # GUIDED DISCOVERY MODE: Use FIRST combination as base, keep others separate
        print(f"🎯 Guided Discovery: Using FIRST of {len(specified_combinations)} combination(s) as base")
        print(f"   First combo will be enhanced with intelligent discovery (base + 2-10 additional columns)")
        if len(specified_combinations) > 1:
            print(f"   Remaining {len(specified_combinations) - 1} combination(s) will be analyzed individually")
        
        # Get intelligent combinations using first as base
        guided_combos = smart_discover_combinations(
            df, 
            num_columns, 
            max_combinations=MAX_COMBINATIONS, 
            excluded_combinations=excluded_combinations, 
            use_intelligent_discovery=True,
            specified_combinations=[specified_combinations[0]]  # Only pass first combo as base
        )
        
        # Add remaining specified combinations (if any) for individual analysis
        if len(specified_combinations) > 1:
            remaining_combos = specified_combinations[1:]
            print(f"   Adding {len(remaining_combos)} additional user-specified combinations")
            combos_to_analyze = guided_combos + remaining_combos
        else:
            combos_to_analyze = guided_combos
            
    elif specified_combinations:
        # MANUAL MODE: Use ONLY user-specified combinations (Smart Keys OFF)
        print(f"📊 Manual Mode: Analyzing {len(specified_combinations)} user-specified combination(s) only")
        print(f"   No intelligent enhancement (Smart Keys disabled)")
        combos_to_analyze = specified_combinations[:MAX_COMBINATIONS]
        if len(specified_combinations) > MAX_COMBINATIONS:
            print(f"⚠️ Limiting to first {MAX_COMBINATIONS} combinations for performance")
    else:
        # AUTO DISCOVERY MODE: No combinations specified, use Smart Keys
        if use_intelligent_discovery:
            print(f"🚀 Auto Discovery Mode: Smart Keys enabled, no base combination")
        combos_to_analyze = smart_discover_combinations(
            df, 
            num_columns, 
            max_combinations=MAX_COMBINATIONS, 
            excluded_combinations=excluded_combinations, 
            use_intelligent_discovery=use_intelligent_discovery,
            specified_combinations=None
        )
    
    for combo in combos_to_analyze:
        try:
            # Handle nested tuples - flatten if needed
            if combo and isinstance(combo[0], (tuple, list)):
                # If first element is tuple/list, flatten it
                combo = combo[0] if len(combo) == 1 else combo
            
            # Ensure combo is a sequence of strings
            combo = tuple(str(c) for c in combo) if combo else ()
            
            if not combo:
                continue
                
            combo_str = ','.join(combo)
            combo_list = list(combo)
        except (TypeError, AttributeError, IndexError) as e:
            print(f"⚠️ Skipping invalid combination: {combo}")
            print(f"   Error: {e}")
            print(f"   Type: {type(combo)}")
            continue
        
        # OPTIMIZATION 1: Use value_counts instead of groupby for better performance
        # This is faster for counting occurrences
        if len(combo_list) == 1:
            # Single column - use value_counts (fastest)
            counts = df[combo_list[0]].value_counts()
            unique_rows = len(counts)
            duplicate_mask = counts > 1
            duplicate_count = counts[duplicate_mask].sum() if duplicate_mask.any() else 0
            duplicate_rows = duplicate_count - duplicate_mask.sum() if duplicate_mask.any() else 0
            
            # Top duplicates
            top_duplicates = []
            if duplicate_mask.any():
                top_dup_counts = counts[duplicate_mask].nlargest(5)
                top_duplicates = [
                    {combo_list[0]: idx, 'count': int(val)} 
                    for idx, val in top_dup_counts.items()
                ]
        else:
            # OPTIMIZATION 2: Use groupby with sort=False for multi-column (faster)
            grouped = df.groupby(combo_list, sort=False, observed=True).size()
            
            unique_rows = len(grouped)
            duplicate_mask = grouped > 1
            duplicate_count = grouped[duplicate_mask].sum() if duplicate_mask.any() else 0
            duplicate_rows = duplicate_count - duplicate_mask.sum() if duplicate_mask.any() else 0
            
            # Top duplicates
            top_duplicates = []
            if duplicate_mask.any():
                top_dup = grouped[duplicate_mask].nlargest(5)
                top_duplicates = [
                    {**dict(zip(combo_list, idx if isinstance(idx, tuple) else (idx,))), 'count': int(val)}
                    for idx, val in top_dup.items()
                ]
        
        # Calculate uniqueness score (0-100%)
        uniqueness_score = (unique_rows / total_rows) * 100 if total_rows > 0 else 0
        is_unique_key = 1 if unique_rows == total_rows else 0
        
        results.append({
            'columns': combo_str,
            'total_rows': total_rows,
            'unique_rows': unique_rows,
            'duplicate_rows': duplicate_rows,
            'duplicate_count': int(duplicate_count),
            'uniqueness_score': round(uniqueness_score, 2),
            'is_unique_key': is_unique_key,
            'top_duplicates': top_duplicates
        })
    
    # Sort by uniqueness score (descending) then by duplicate count (ascending)
    results.sort(key=lambda x: (-x['uniqueness_score'], x['duplicate_count']))
    
    return results

