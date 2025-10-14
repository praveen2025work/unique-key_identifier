"""
File comparison module - Generate matched, A-only, and B-only records
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional


def compare_files_by_columns(df_a: pd.DataFrame, df_b: pd.DataFrame, columns: List[str]) -> Dict:
    """
    Compare two dataframes by specified columns and return matched, A-only, B-only records.
    
    Args:
        df_a: First dataframe
        df_b: Second dataframe
        columns: List of column names to use as keys for comparison
        
    Returns:
        Dictionary containing comparison statistics and data
    """
    # Validate columns exist in both dataframes
    for col in columns:
        if col not in df_a.columns:
            raise ValueError(f"Column '{col}' not found in File A")
        if col not in df_b.columns:
            raise ValueError(f"Column '{col}' not found in File B")
    
    # Create composite key for comparison
    df_a_copy = df_a.copy()
    df_b_copy = df_b.copy()
    
    # Create key column by concatenating specified columns
    df_a_copy['_key'] = df_a_copy[columns].astype(str).agg('||'.join, axis=1)
    df_b_copy['_key'] = df_b_copy[columns].astype(str).agg('||'.join, axis=1)
    
    # Get unique keys
    keys_a = set(df_a_copy['_key'].unique())
    keys_b = set(df_b_copy['_key'].unique())
    
    # Find matched and unique keys
    matched_keys = keys_a & keys_b
    only_a_keys = keys_a - keys_b
    only_b_keys = keys_b - keys_a
    
    # Calculate match rate
    total_unique_keys = len(keys_a | keys_b)
    match_rate = (len(matched_keys) / total_unique_keys * 100) if total_unique_keys > 0 else 0
    
    return {
        'matched_count': len(matched_keys),
        'only_a_count': len(only_a_keys),
        'only_b_count': len(only_b_keys),
        'total_a': len(keys_a),
        'total_b': len(keys_b),
        'match_rate': round(match_rate, 2),
        'matched_keys': matched_keys,
        'only_a_keys': only_a_keys,
        'only_b_keys': only_b_keys,
        'df_a_with_key': df_a_copy,
        'df_b_with_key': df_b_copy,
        'key_columns': columns
    }


def get_comparison_data(
    comparison_result: Dict,
    category: str,
    offset: int = 0,
    limit: int = 100
) -> Dict:
    """
    Get paginated comparison data for a specific category.
    
    Args:
        comparison_result: Result from compare_files_by_columns
        category: 'matched', 'only_a', or 'only_b'
        offset: Offset for pagination
        limit: Number of records to return
        
    Returns:
        Dictionary with records and pagination info
    """
    df_a = comparison_result['df_a_with_key']
    df_b = comparison_result['df_b_with_key']
    
    if category == 'matched':
        keys = list(comparison_result['matched_keys'])
        source_df = df_a
    elif category == 'only_a':
        keys = list(comparison_result['only_a_keys'])
        source_df = df_a
    elif category == 'only_b':
        keys = list(comparison_result['only_b_keys'])
        source_df = df_b
    else:
        raise ValueError(f"Invalid category: {category}")
    
    # Sort keys for consistent ordering
    keys.sort()
    
    # Paginate keys
    paginated_keys = keys[offset:offset + limit]
    
    # Filter dataframe
    filtered_df = source_df[source_df['_key'].isin(paginated_keys)].copy()
    
    # Drop the temporary _key column
    filtered_df = filtered_df.drop(columns=['_key'])
    
    # Convert to records
    records = filtered_df.to_dict('records')
    
    # Convert NaN to None for JSON serialization
    for record in records:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None
    
    return {
        'records': records,
        'total': len(keys),
        'offset': offset,
        'limit': limit,
        'has_more': offset + limit < len(keys)
    }


def generate_comparison_summary(df_a: pd.DataFrame, df_b: pd.DataFrame, columns: List[str]) -> Dict:
    """
    Generate a quick summary of comparison without loading all data.
    
    Args:
        df_a: First dataframe
        df_b: Second dataframe  
        columns: List of column names to use as keys
        
    Returns:
        Summary dictionary
    """
    # Create composite keys
    key_a = df_a[columns].astype(str).agg('||'.join, axis=1)
    key_b = df_b[columns].astype(str).agg('||'.join, axis=1)
    
    # Get unique keys
    keys_a = set(key_a.unique())
    keys_b = set(key_b.unique())
    
    # Calculate statistics
    matched_count = len(keys_a & keys_b)
    only_a_count = len(keys_a - keys_b)
    only_b_count = len(keys_b - keys_a)
    total_unique = len(keys_a | keys_b)
    match_rate = (matched_count / total_unique * 100) if total_unique > 0 else 0
    
    return {
        'matched_count': matched_count,
        'only_a_count': only_a_count,
        'only_b_count': only_b_count,
        'total_a': len(keys_a),
        'total_b': len(keys_b),
        'match_rate': round(match_rate, 2),
        'columns': ','.join(columns),
        'file_a_rows': len(df_a),
        'file_b_rows': len(df_b)
    }

