import pandas as pd
import itertools
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
import uuid
from datetime import datetime
from app.utils.file_processor import FileProcessor
from app.core.config import settings

class AnalysisEngine:
    """Core analysis engine for unique key identification"""
    
    def __init__(self):
        self.results = {}
        
    @staticmethod
    def generate_combinations(columns: List[str], num_columns: int, 
                            included_combinations: List[str] = None,
                            excluded_combinations: List[str] = None) -> List[Tuple[str, ...]]:
        """Generate column combinations for analysis"""
        
        if included_combinations:
            # Use only specified combinations
            combinations = []
            for combo_str in included_combinations:
                combo = tuple(col.strip() for col in combo_str.split(','))
                # Validate columns exist
                for col in combo:
                    if col not in columns:
                        raise ValueError(f"Column '{col}' in included combinations not found in files")
                combinations.append(combo)
            return combinations
        
        # Generate all combinations of specified length
        combinations = list(itertools.combinations(columns, num_columns))
        
        # Remove excluded combinations if specified
        if excluded_combinations:
            excluded_set = set()
            for combo_str in excluded_combinations:
                combo = tuple(sorted(col.strip() for col in combo_str.split(',')))
                excluded_set.add(combo)
            
            # Filter out excluded combinations
            combinations = [combo for combo in combinations 
                          if tuple(sorted(combo)) not in excluded_set]
        
        # Limit combinations to prevent excessive processing
        if len(combinations) > settings.MAX_COMBINATIONS:
            raise ValueError(f"Too many combinations ({len(combinations)}). "
                           f"Maximum allowed: {settings.MAX_COMBINATIONS}. "
                           f"Please use row limits or specify explicit combinations.")
        
        return combinations
    
    @staticmethod
    def analyze_combination(df_a: pd.DataFrame, df_b: pd.DataFrame, 
                          combination: Tuple[str, ...]) -> Dict[str, Any]:
        """Analyze a single column combination"""
        try:
            combo_list = list(combination)
            
            # Create combination values for both files
            df_a_combo = df_a[combo_list].copy()
            df_b_combo = df_b[combo_list].copy()
            
            # Handle missing values
            df_a_combo = df_a_combo.dropna()
            df_b_combo = df_b_combo.dropna()
            
            # Create composite keys
            df_a_keys = df_a_combo.apply(
                lambda row: '|'.join(str(val) for val in row), axis=1
            )
            df_b_keys = df_b_combo.apply(
                lambda row: '|'.join(str(val) for val in row), axis=1
            )
            
            # Calculate statistics
            total_a = len(df_a_keys)
            total_b = len(df_b_keys)
            unique_a = df_a_keys.nunique()
            unique_b = df_b_keys.nunique()
            
            # Find common keys
            keys_a_set = set(df_a_keys)
            keys_b_set = set(df_b_keys)
            common_keys = keys_a_set & keys_b_set
            
            # Calculate match statistics
            common_count = len(common_keys)
            only_in_a = len(keys_a_set - keys_b_set)
            only_in_b = len(keys_b_set - keys_a_set)
            
            # Calculate uniqueness scores
            uniqueness_score_a = unique_a / total_a if total_a > 0 else 0
            uniqueness_score_b = unique_b / total_b if total_b > 0 else 0
            avg_uniqueness = (uniqueness_score_a + uniqueness_score_b) / 2
            
            # Calculate overlap score
            total_unique_keys = len(keys_a_set | keys_b_set)
            overlap_score = common_count / total_unique_keys if total_unique_keys > 0 else 0
            
            # Calculate final score (weighted average)
            final_score = (avg_uniqueness * 0.6) + (overlap_score * 0.4)
            
            # Determine if this could be a unique key
            is_unique_key = (uniqueness_score_a >= 0.95 and 
                           uniqueness_score_b >= 0.95 and 
                           overlap_score > 0.1)
            
            return {
                'combination': ','.join(combination),
                'columns': combo_list,
                'total_rows_a': total_a,
                'total_rows_b': total_b,
                'unique_values_a': unique_a,
                'unique_values_b': unique_b,
                'uniqueness_score_a': round(uniqueness_score_a, 4),
                'uniqueness_score_b': round(uniqueness_score_b, 4),
                'common_keys': common_count,
                'only_in_a': only_in_a,
                'only_in_b': only_in_b,
                'overlap_score': round(overlap_score, 4),
                'final_score': round(final_score, 4),
                'is_unique_key': is_unique_key,
                'recommendation': AnalysisEngine._get_recommendation(
                    uniqueness_score_a, uniqueness_score_b, overlap_score
                )
            }
            
        except Exception as e:
            return {
                'combination': ','.join(combination),
                'columns': list(combination),
                'error': str(e),
                'final_score': 0,
                'is_unique_key': False
            }
    
    @staticmethod
    def _get_recommendation(uniqueness_a: float, uniqueness_b: float, 
                          overlap: float) -> str:
        """Get recommendation based on scores"""
        if uniqueness_a >= 0.95 and uniqueness_b >= 0.95:
            if overlap >= 0.8:
                return "Excellent unique key - high uniqueness and overlap"
            elif overlap >= 0.5:
                return "Good unique key - high uniqueness, moderate overlap"
            elif overlap >= 0.1:
                return "Potential unique key - high uniqueness, low overlap"
            else:
                return "Poor unique key - high uniqueness but no overlap"
        elif uniqueness_a >= 0.8 and uniqueness_b >= 0.8:
            return "Moderate unique key - good uniqueness scores"
        elif uniqueness_a >= 0.5 and uniqueness_b >= 0.5:
            return "Weak unique key - moderate uniqueness scores"
        else:
            return "Not suitable as unique key - low uniqueness scores"
    
    @staticmethod
    async def run_analysis(file_a: str, file_b: str, num_columns: int,
                          max_rows: int = 0, working_directory: str = "",
                          included_combinations: List[str] = None,
                          excluded_combinations: List[str] = None,
                          data_quality_check: bool = False) -> str:
        """Run complete analysis and return run ID"""
        
        try:
            run_id = str(uuid.uuid4())
            
            # Load data
            path_a = FileProcessor.get_file_path(file_a, working_directory)
            path_b = FileProcessor.get_file_path(file_b, working_directory)
            
            FileProcessor.validate_file_exists(path_a)
            FileProcessor.validate_file_exists(path_b)
            
            df_a = FileProcessor.load_csv_data(path_a, max_rows)
            df_b = FileProcessor.load_csv_data(path_b, max_rows)
            
            # Get common columns
            common_columns = FileProcessor.get_common_columns(df_a, df_b)
            
            if not common_columns:
                raise ValueError("No common columns found between files")
            
            # Generate combinations
            combinations = AnalysisEngine.generate_combinations(
                common_columns, num_columns, included_combinations, excluded_combinations
            )
            
            if not combinations:
                raise ValueError("No valid combinations to analyze")
            
            # Analyze each combination
            results = []
            for combination in combinations:
                result = AnalysisEngine.analyze_combination(df_a, df_b, combination)
                results.append(result)
            
            # Sort results by final score (descending)
            results.sort(key=lambda x: x.get('final_score', 0), reverse=True)
            
            # Store results (in a real app, this would go to a database)
            analysis_result = {
                'run_id': run_id,
                'timestamp': datetime.now(),
                'file_a': file_a,
                'file_b': file_b,
                'working_directory': working_directory,
                'num_columns': num_columns,
                'max_rows': max_rows,
                'included_combinations': included_combinations,
                'excluded_combinations': excluded_combinations,
                'data_quality_check': data_quality_check,
                'total_combinations': len(results),
                'results': results,
                'summary': {
                    'best_combination': results[0] if results else None,
                    'unique_key_candidates': [r for r in results if r.get('is_unique_key', False)],
                    'total_analyzed': len(results)
                }
            }
            
            # In a real application, save to database here
            # For now, we'll just store in memory (this is for demo purposes)
            if not hasattr(AnalysisEngine, '_stored_results'):
                AnalysisEngine._stored_results = {}
            AnalysisEngine._stored_results[run_id] = analysis_result
            
            return run_id
            
        except Exception as e:
            raise ValueError(f"Analysis failed: {str(e)}")
    
    @staticmethod
    def get_analysis_result(run_id: str) -> Optional[Dict[str, Any]]:
        """Get stored analysis result"""
        if hasattr(AnalysisEngine, '_stored_results'):
            return AnalysisEngine._stored_results.get(run_id)
        return None
    
    @staticmethod
    def list_analysis_runs() -> List[Dict[str, Any]]:
        """List all analysis runs"""
        if not hasattr(AnalysisEngine, '_stored_results'):
            return []
        
        runs = []
        for run_id, result in AnalysisEngine._stored_results.items():
            runs.append({
                'id': run_id,
                'label': f"Run {run_id[:8]} - {result['file_a']} vs {result['file_b']}",
                'file_a': result['file_a'],
                'file_b': result['file_b'],
                'num_columns': result['num_columns'],
                'max_rows': result['max_rows'],
                'working_directory': result.get('working_directory', ''),
                'data_quality_check': result.get('data_quality_check', False),
                'expected_combinations': '\n'.join(result.get('included_combinations', [])) if result.get('included_combinations') else '',
                'excluded_combinations': '\n'.join(result.get('excluded_combinations', [])) if result.get('excluded_combinations') else '',
                'created_at': result['timestamp'],
                'status': 'completed'
            })
        
        # Sort by timestamp (newest first)
        runs.sort(key=lambda x: x['created_at'], reverse=True)
        return runs