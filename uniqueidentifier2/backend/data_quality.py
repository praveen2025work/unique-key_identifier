"""
Data Quality Module - Pattern detection and validation across files
Detects data type inconsistencies, pattern mismatches, and data quality issues
"""
import pandas as pd
import numpy as np
import re
from collections import defaultdict, Counter

def detect_column_pattern(series, sample_size=1000):
    """
    Detect the pattern/type of data in a column
    Returns detailed pattern information including:
    - Primary data type
    - Pattern consistency
    - Sample values
    - Issues found
    """
    # Remove null values for analysis
    non_null_series = series.dropna()
    
    if len(non_null_series) == 0:
        return {
            'pattern_type': 'empty',
            'consistency': 100.0,
            'total_values': 0,
            'null_count': len(series),
            'null_percentage': 100.0,
            'issues': ['Column is entirely null/empty']
        }
    
    # Sample if too large
    if len(non_null_series) > sample_size:
        sample = non_null_series.sample(n=sample_size, random_state=42)
    else:
        sample = non_null_series
    
    # Convert to string for pattern analysis
    str_values = sample.astype(str)
    
    # Pattern detection counters
    patterns = {
        'integer': 0,
        'float': 0,
        'date': 0,
        'datetime': 0,
        'email': 0,
        'phone': 0,
        'alphanumeric': 0,
        'string': 0,
        'boolean': 0,
        'mixed': 0
    }
    
    # Regex patterns
    integer_pattern = re.compile(r'^-?\d+$')
    float_pattern = re.compile(r'^-?\d+\.\d+$')
    date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$|^\d{2}/\d{2}/\d{4}$|^\d{2}-\d{2}-\d{4}$')
    datetime_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}')
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    phone_pattern = re.compile(r'^\+?1?\d{9,15}$|^\(\d{3}\)\s*\d{3}-\d{4}$')
    boolean_pattern = re.compile(r'^(true|false|yes|no|0|1|t|f|y|n)$', re.IGNORECASE)
    alphanumeric_pattern = re.compile(r'^[a-zA-Z0-9]+$')
    
    # Analyze each value
    pattern_examples = defaultdict(list)
    
    for val in str_values:
        val_stripped = val.strip()
        
        if not val_stripped:
            continue
            
        # Check patterns in order of specificity
        if boolean_pattern.match(val_stripped):
            patterns['boolean'] += 1
            if len(pattern_examples['boolean']) < 3:
                pattern_examples['boolean'].append(val_stripped)
        elif integer_pattern.match(val_stripped):
            patterns['integer'] += 1
            if len(pattern_examples['integer']) < 3:
                pattern_examples['integer'].append(val_stripped)
        elif float_pattern.match(val_stripped):
            patterns['float'] += 1
            if len(pattern_examples['float']) < 3:
                pattern_examples['float'].append(val_stripped)
        elif datetime_pattern.match(val_stripped):
            patterns['datetime'] += 1
            if len(pattern_examples['datetime']) < 3:
                pattern_examples['datetime'].append(val_stripped)
        elif date_pattern.match(val_stripped):
            patterns['date'] += 1
            if len(pattern_examples['date']) < 3:
                pattern_examples['date'].append(val_stripped)
        elif email_pattern.match(val_stripped):
            patterns['email'] += 1
            if len(pattern_examples['email']) < 3:
                pattern_examples['email'].append(val_stripped)
        elif phone_pattern.match(val_stripped):
            patterns['phone'] += 1
            if len(pattern_examples['phone']) < 3:
                pattern_examples['phone'].append(val_stripped)
        elif alphanumeric_pattern.match(val_stripped):
            patterns['alphanumeric'] += 1
            if len(pattern_examples['alphanumeric']) < 3:
                pattern_examples['alphanumeric'].append(val_stripped)
        else:
            patterns['string'] += 1
            if len(pattern_examples['string']) < 3:
                pattern_examples['string'].append(val_stripped)
    
    # Determine primary pattern
    total_checked = sum(patterns.values())
    if total_checked == 0:
        primary_pattern = 'unknown'
        consistency = 0.0
    else:
        primary_pattern = max(patterns, key=patterns.get)
        consistency = (patterns[primary_pattern] / total_checked) * 100
    
    # Identify issues
    issues = []
    
    # Check for mixed types (inconsistency)
    if consistency < 95.0:
        # List all pattern types found
        found_patterns = {k: v for k, v in patterns.items() if v > 0}
        if len(found_patterns) > 1:
            pattern_breakdown = ', '.join([f"{k}: {v}" for k, v in sorted(found_patterns.items(), key=lambda x: -x[1])])
            issues.append(f"Mixed data types detected - {pattern_breakdown} values")
    
    # Check null percentage
    null_count = len(series) - len(non_null_series)
    null_percentage = (null_count / len(series)) * 100
    
    if null_percentage > 50:
        issues.append(f"High null percentage: {null_percentage:.1f}%")
    elif null_percentage > 20:
        issues.append(f"Moderate null percentage: {null_percentage:.1f}%")
    
    # Get sample values
    sample_values = non_null_series.head(5).tolist()
    
    return {
        'pattern_type': primary_pattern,
        'consistency': round(consistency, 2),
        'total_values': len(series),
        'non_null_values': len(non_null_series),
        'null_count': null_count,
        'null_percentage': round(null_percentage, 2),
        'pattern_distribution': {k: v for k, v in patterns.items() if v > 0},
        'sample_values': sample_values[:5],
        'pattern_examples': dict(pattern_examples),
        'issues': issues
    }

def analyze_file_quality(df, file_name):
    """
    Analyze data quality for a single file
    Returns comprehensive quality report for each column
    """
    quality_report = {
        'file_name': file_name,
        'total_rows': len(df),
        'total_columns': len(df.columns),
        'columns': {},
        'overall_issues': []
    }
    
    for col in df.columns:
        col_info = detect_column_pattern(df[col])
        quality_report['columns'][col] = col_info
        
        # Add to overall issues if problems found
        if col_info['issues']:
            for issue in col_info['issues']:
                quality_report['overall_issues'].append({
                    'column': col,
                    'issue': issue,
                    'severity': 'high' if 'Mixed data types' in issue else 'medium'
                })
    
    return quality_report

def compare_file_patterns(file1_report, file2_report, df1=None, df2=None):
    """
    Compare patterns between two files and identify mismatches
    Returns list of pattern discrepancies with sample records showing differences
    
    Args:
        file1_report: Quality report for first file
        file2_report: Quality report for second file
        df1: Optional DataFrame for first file (for collecting sample records)
        df2: Optional DataFrame for second file (for collecting sample records)
    """
    discrepancies = []
    
    # Get common columns
    file1_cols = set(file1_report['columns'].keys())
    file2_cols = set(file2_report['columns'].keys())
    
    common_cols = file1_cols.intersection(file2_cols)
    only_in_file1 = file1_cols - file2_cols
    only_in_file2 = file2_cols - file1_cols
    
    # Report missing columns
    if only_in_file1:
        discrepancies.append({
            'type': 'missing_column',
            'severity': 'high',
            'message': f"Columns in {file1_report['file_name']} but not in {file2_report['file_name']}: {', '.join(sorted(only_in_file1))}"
        })
    
    if only_in_file2:
        discrepancies.append({
            'type': 'missing_column',
            'severity': 'high',
            'message': f"Columns in {file2_report['file_name']} but not in {file1_report['file_name']}: {', '.join(sorted(only_in_file2))}"
        })
    
    # Compare patterns for common columns
    for col in sorted(common_cols):
        file1_pattern = file1_report['columns'][col]
        file2_pattern = file2_report['columns'][col]
        
        # Check pattern type mismatch
        if file1_pattern['pattern_type'] != file2_pattern['pattern_type']:
            # Collect sample records showing the difference
            sample_records = []
            if df1 is not None and df2 is not None and col in df1.columns and col in df2.columns:
                # Get up to 10 sample records from each file that demonstrate the pattern difference
                try:
                    # Get non-null values from both files
                    file1_values = df1[col].dropna()
                    file2_values = df2[col].dropna()
                    
                    # Sample up to 10 records from each file
                    num_samples = min(10, len(file1_values), len(file2_values))
                    if num_samples > 0:
                        # Sample from file1
                        if len(file1_values) > num_samples:
                            file1_sample = file1_values.sample(n=num_samples, random_state=42)
                        else:
                            file1_sample = file1_values
                        
                        # Sample from file2
                        if len(file2_values) > num_samples:
                            file2_sample = file2_values.sample(n=num_samples, random_state=42)
                        else:
                            file2_sample = file2_values
                        
                        # Create sample records showing the difference
                        for idx in range(min(len(file1_sample), len(file2_sample), num_samples)):
                            file1_val = file1_sample.iloc[idx]
                            file2_val = file2_sample.iloc[idx]
                            
                            # Get row index to potentially show more context
                            file1_idx = file1_sample.index[idx]
                            file2_idx = file2_sample.index[idx]
                            
                            sample_records.append({
                                'file1_value': str(file1_val),
                                'file1_row_index': int(file1_idx),
                                'file2_value': str(file2_val),
                                'file2_row_index': int(file2_idx),
                                'file1_type': file1_pattern['pattern_type'],
                                'file2_type': file2_pattern['pattern_type']
                            })
                except Exception as e:
                    # If sampling fails, just use the examples from pattern detection
                    print(f"Warning: Could not collect sample records for column {col}: {e}")
            
            discrepancy = {
                'type': 'pattern_mismatch',
                'column': col,
                'severity': 'high',
                'message': f"Column '{col}' has different patterns: {file1_report['file_name']} ({file1_pattern['pattern_type']}) vs {file2_report['file_name']} ({file2_pattern['pattern_type']})",
                'file1_pattern': file1_pattern['pattern_type'],
                'file2_pattern': file2_pattern['pattern_type'],
                'file1_examples': file1_pattern.get('sample_values', []),
                'file2_examples': file2_pattern.get('sample_values', [])
            }
            
            # Add sample records if collected
            if sample_records:
                discrepancy['sample_records'] = sample_records
            
            discrepancies.append(discrepancy)
        
        # Check consistency differences
        consistency_diff = abs(file1_pattern['consistency'] - file2_pattern['consistency'])
        if consistency_diff > 20:
            discrepancies.append({
                'type': 'consistency_difference',
                'column': col,
                'severity': 'medium',
                'message': f"Column '{col}' has significantly different consistency: {file1_report['file_name']} ({file1_pattern['consistency']:.1f}%) vs {file2_report['file_name']} ({file2_pattern['consistency']:.1f}%)",
                'file1_consistency': file1_pattern['consistency'],
                'file2_consistency': file2_pattern['consistency']
            })
        
        # Check null percentage differences
        null_diff = abs(file1_pattern['null_percentage'] - file2_pattern['null_percentage'])
        if null_diff > 30:
            discrepancies.append({
                'type': 'null_difference',
                'column': col,
                'severity': 'medium',
                'message': f"Column '{col}' has significantly different null rates: {file1_report['file_name']} ({file1_pattern['null_percentage']:.1f}%) vs {file2_report['file_name']} ({file2_pattern['null_percentage']:.1f}%)",
                'file1_null_pct': file1_pattern['null_percentage'],
                'file2_null_pct': file2_pattern['null_percentage']
            })
    
    return discrepancies

def generate_quality_summary(file1_report, file2_report, discrepancies):
    """
    Generate overall quality summary
    """
    total_issues = len(file1_report['overall_issues']) + len(file2_report['overall_issues']) + len(discrepancies)
    
    high_severity = sum(1 for d in discrepancies if d.get('severity') == 'high')
    high_severity += sum(1 for i in file1_report['overall_issues'] if i.get('severity') == 'high')
    high_severity += sum(1 for i in file2_report['overall_issues'] if i.get('severity') == 'high')
    
    medium_severity = sum(1 for d in discrepancies if d.get('severity') == 'medium')
    medium_severity += sum(1 for i in file1_report['overall_issues'] if i.get('severity') == 'medium')
    medium_severity += sum(1 for i in file2_report['overall_issues'] if i.get('severity') == 'medium')
    
    # Determine overall status
    if high_severity > 0:
        status = 'critical'
        status_message = f"⚠️ Critical issues found: {high_severity} high severity, {medium_severity} medium severity"
    elif medium_severity > 0:
        status = 'warning'
        status_message = f"⚠️ Quality issues found: {medium_severity} medium severity"
    elif total_issues > 0:
        status = 'minor'
        status_message = f"ℹ️ Minor quality issues found: {total_issues} total"
    else:
        status = 'pass'
        status_message = "✅ No data quality issues detected"
    
    return {
        'status': status,
        'status_message': status_message,
        'total_issues': total_issues,
        'high_severity_count': high_severity,
        'medium_severity_count': medium_severity,
        'file1_issues': len(file1_report['overall_issues']),
        'file2_issues': len(file2_report['overall_issues']),
        'cross_file_issues': len(discrepancies)
    }

def perform_data_quality_check(df1, df2, file1_name, file2_name):
    """
    Main function to perform complete data quality check on two files
    Returns comprehensive quality report with sample records showing differences
    
    Args:
        df1: DataFrame for first file
        df2: DataFrame for second file
        file1_name: Name of first file
        file2_name: Name of second file
    """
    # Analyze each file
    file1_report = analyze_file_quality(df1, file1_name)
    file2_report = analyze_file_quality(df2, file2_name)
    
    # Compare patterns between files, passing dataframes to collect sample records
    discrepancies = compare_file_patterns(file1_report, file2_report, df1, df2)
    
    # Generate summary
    summary = generate_quality_summary(file1_report, file2_report, discrepancies)
    
    return {
        'summary': summary,
        'file1_report': file1_report,
        'file2_report': file2_report,
        'discrepancies': discrepancies
    }

def perform_single_file_quality_check(df, file_name):
    """
    Perform data quality check on a single file
    Useful for standalone quality checks
    """
    report = analyze_file_quality(df, file_name)
    
    # Generate summary for single file
    total_issues = len(report['overall_issues'])
    high_severity = sum(1 for i in report['overall_issues'] if i.get('severity') == 'high')
    medium_severity = sum(1 for i in report['overall_issues'] if i.get('severity') == 'medium')
    
    if high_severity > 0:
        status = 'critical'
        status_message = f"⚠️ Critical issues found: {high_severity} high severity, {medium_severity} medium severity"
    elif medium_severity > 0:
        status = 'warning'
        status_message = f"⚠️ Quality issues found: {medium_severity} medium severity"
    elif total_issues > 0:
        status = 'minor'
        status_message = f"ℹ️ Minor quality issues found: {total_issues} total"
    else:
        status = 'pass'
        status_message = "✅ No data quality issues detected"
    
    return {
        'summary': {
            'status': status,
            'status_message': status_message,
            'total_issues': total_issues,
            'high_severity_count': high_severity,
            'medium_severity_count': medium_severity
        },
        'report': report
    }

