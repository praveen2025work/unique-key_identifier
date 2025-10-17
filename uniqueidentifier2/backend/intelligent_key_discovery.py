"""
Intelligent Key Discovery Algorithm
Finds unique key combinations without exhaustive search - optimized for large datasets
"""
import pandas as pd
import numpy as np
from typing import List, Tuple, Set, Dict
from itertools import combinations
import time


class IntelligentKeyDiscovery:
    """
    Discovers unique key combinations using intelligent heuristics
    instead of brute-force enumeration.
    
    Optimized for: 300 columns, 7M records, finding 5-column combinations
    """
    
    def __init__(self, df: pd.DataFrame, max_combination_size: int = 5, 
                 max_results: int = 50, sample_size: int = None):
        """
        Initialize the key discovery engine.
        
        Args:
            df: DataFrame to analyze
            max_combination_size: Maximum number of columns to combine
            max_results: Maximum number of combinations to return
            sample_size: Use sampling for initial analysis (None = auto-detect)
        """
        self.df = df
        self.total_rows = len(df)
        self.max_combination_size = max_combination_size
        self.max_results = max_results
        
        # Auto-detect sampling strategy
        if sample_size is None:
            if self.total_rows > 5_000_000:
                self.sample_size = 1_000_000  # 1M sample for 5M+ rows
            elif self.total_rows > 1_000_000:
                self.sample_size = 500_000
            else:
                self.sample_size = min(100_000, self.total_rows)
        else:
            self.sample_size = min(sample_size, self.total_rows)
        
        # Use sample for initial analysis
        if self.sample_size < self.total_rows:
            print(f"🎯 Using intelligent sampling: {self.sample_size:,} of {self.total_rows:,} rows")
            self.sample_df = df.sample(n=self.sample_size, random_state=42)
        else:
            self.sample_df = df
        
        # Pre-compute column statistics
        self.column_stats = self._compute_column_statistics()
        
    def _compute_column_statistics(self) -> Dict:
        """Compute statistics for each column to guide search."""
        stats = {}
        
        print("📊 Analyzing column characteristics...")
        for col in self.df.columns:
            nunique = self.sample_df[col].nunique()
            cardinality_ratio = nunique / len(self.sample_df)
            
            # Estimate if this could be part of a unique key
            stats[col] = {
                'nunique': nunique,
                'cardinality_ratio': cardinality_ratio,
                'null_ratio': self.sample_df[col].isnull().sum() / len(self.sample_df),
                'is_id_like': any(keyword in col.lower() for keyword in 
                                 ['id', 'code', 'key', 'number', 'identifier', 'ref']),
                'is_date_like': any(keyword in col.lower() for keyword in 
                                   ['date', 'time', 'timestamp', 'datetime']),
                'dtype': str(self.sample_df[col].dtype)
            }
        
        return stats
    
    def discover_keys(self, target_size: int = None) -> List[Tuple]:
        """
        Discover unique key combinations intelligently.
        
        Args:
            target_size: Specific combination size to find (None = all sizes up to max)
        
        Returns:
            List of promising column combinations
        """
        if target_size is None:
            # Try all sizes from 1 to max_combination_size
            all_combinations = []
            for size in range(1, self.max_combination_size + 1):
                combos = self._discover_keys_of_size(size)
                all_combinations.extend(combos)
                if len(all_combinations) >= self.max_results:
                    break
            return all_combinations[:self.max_results]
        else:
            return self._discover_keys_of_size(target_size)
    
    def _discover_keys_of_size(self, size: int) -> List[Tuple]:
        """Discover unique keys of specific size using intelligent search."""
        
        print(f"\n🔍 Discovering {size}-column combinations...")
        start_time = time.time()
        
        combinations_found = []
        combinations_tested = 0
        
        # Strategy 1: Single column analysis (size=1)
        if size == 1:
            return self._find_single_column_keys()
        
        # Strategy 2: Multi-column combinations
        # Use greedy algorithm instead of exhaustive search
        combinations_found = self._greedy_combination_search(size)
        
        elapsed = time.time() - start_time
        print(f"✅ Found {len(combinations_found)} promising {size}-column combinations in {elapsed:.2f}s")
        
        return combinations_found
    
    def _find_single_column_keys(self) -> List[Tuple]:
        """Find single columns that could be unique keys."""
        candidates = []
        
        # Sort columns by cardinality (highest first)
        sorted_cols = sorted(
            self.column_stats.items(),
            key=lambda x: (-x[1]['cardinality_ratio'], -x[1]['is_id_like'])
        )
        
        for col, stats in sorted_cols[:self.max_results]:
            # High cardinality columns (>80% unique)
            if stats['cardinality_ratio'] >= 0.8 and stats['null_ratio'] < 0.1:
                candidates.append((col,))
            # ID-like columns even with lower cardinality
            elif stats['is_id_like'] and stats['cardinality_ratio'] >= 0.5:
                candidates.append((col,))
        
        return candidates
    
    def _greedy_combination_search(self, size: int) -> List[Tuple]:
        """
        Greedy search for multi-column combinations.
        Uses incremental approach: build on smaller combinations that show promise.
        """
        combinations_found = []
        
        # Step 1: Start with high-cardinality and ID columns as seeds
        seed_columns = self._get_seed_columns(top_n=50)  # Get more seed columns for better coverage
        
        if size == 2:
            # For 2-column combinations, pair seed columns intelligently
            combinations_found = self._find_two_column_combinations(seed_columns)
        else:
            # For 3+ columns, use incremental building
            combinations_found = self._incremental_combination_building(seed_columns, size)
        
        # Validate top combinations on sample
        # For larger sizes, validate more candidates to find the best ones
        candidates_to_validate = min(len(combinations_found), self.max_results * 3)
        validated = self._validate_combinations(combinations_found[:candidates_to_validate])
        
        # Extract just the combinations (drop the scores)
        # Return more results for larger combination sizes
        results_to_return = min(self.max_results, len(validated))
        return [combo for combo, score in validated[:results_to_return]]
    
    def _get_seed_columns(self, top_n: int = 30) -> List[str]:
        """Get the most promising columns to use as seeds."""
        
        # Score each column
        scored_columns = []
        for col, stats in self.column_stats.items():
            score = 0
            
            # High cardinality is good
            score += stats['cardinality_ratio'] * 100
            
            # ID-like columns get bonus
            if stats['is_id_like']:
                score += 50
            
            # Date/time columns are often part of composite keys
            if stats['is_date_like']:
                score += 30
            
            # Penalize high null ratio
            score -= stats['null_ratio'] * 50
            
            scored_columns.append((col, score))
        
        # Sort by score and return top N
        scored_columns.sort(key=lambda x: -x[1])
        return [col for col, score in scored_columns[:top_n]]
    
    def _find_two_column_combinations(self, seed_columns: List[str]) -> List[Tuple]:
        """Find promising 2-column combinations."""
        combinations_found = []
        tested = set()
        
        # Strategy 1: Pair ID columns with high-cardinality columns
        id_columns = [col for col in seed_columns if self.column_stats[col]['is_id_like']]
        high_card_columns = [col for col in seed_columns if self.column_stats[col]['cardinality_ratio'] > 0.5]
        
        # Test ID + high-cardinality pairings (limited)
        for id_col in id_columns[:10]:  # Limit to top 10 ID columns
            for other_col in high_card_columns[:15]:  # Limit to top 15 high-card columns
                if id_col != other_col:
                    combo = tuple(sorted([id_col, other_col]))
                    if combo not in tested:
                        tested.add(combo)
                        combinations_found.append(combo)
                        
                        if len(combinations_found) >= self.max_results * 2:
                            return combinations_found
        
        # Strategy 2: Pair columns from different "categories"
        date_columns = [col for col in seed_columns if self.column_stats[col]['is_date_like']]
        
        for date_col in date_columns[:5]:
            for id_col in id_columns[:10]:
                combo = tuple(sorted([date_col, id_col]))
                if combo not in tested:
                    tested.add(combo)
                    combinations_found.append(combo)
        
        # Strategy 3: Top cardinality pairs (limited)
        for i, col1 in enumerate(seed_columns[:15]):
            for col2 in seed_columns[i+1:20]:
                combo = tuple(sorted([col1, col2]))
                if combo not in tested and len(combinations_found) < self.max_results * 2:
                    tested.add(combo)
                    combinations_found.append(combo)
        
        return combinations_found
    
    def _incremental_combination_building(self, seed_columns: List[str], target_size: int) -> List[Tuple]:
        """
        Build larger combinations incrementally.
        Start with 2-column combinations and add columns that increase uniqueness.
        Enhanced for better discovery of 3-10 column combinations.
        """
        
        # Start with 2-column combinations
        two_col_combos = self._find_two_column_combinations(seed_columns)
        
        # Validate which 2-column combos are most promising
        validated_two = self._validate_combinations(two_col_combos[:100])  # Test more combos
        
        # For larger target sizes, be less strict about uniqueness threshold
        # Composite keys often have lower individual uniqueness but high combined uniqueness
        uniqueness_threshold = max(30, 70 - (target_size * 5))  # Lower threshold for larger sizes
        promising_two = [combo for combo, score in validated_two if score >= uniqueness_threshold][:30]
        
        if target_size == 2:
            return promising_two  # Already extracted combos above
        
        # Build 3+ column combinations from promising 2-column ones
        current_combos = promising_two
        
        for current_size in range(2, target_size):
            next_combos = []
            seen_combos = set()  # Track to avoid duplicates
            
            # Expand from more base combinations for larger target sizes
            expansion_limit = min(25, len(current_combos))
            
            for combo in current_combos[:expansion_limit]:
                # Try adding each seed column
                for col in seed_columns[:50]:  # Try more columns for better coverage
                    if col not in combo:
                        new_combo = tuple(sorted(list(combo) + [col]))
                        
                        # Avoid duplicates
                        if new_combo not in seen_combos:
                            seen_combos.add(new_combo)
                            next_combos.append(new_combo)
                            
                            if len(next_combos) >= self.max_results * 4:  # Generate more candidates
                                break
                
                if len(next_combos) >= self.max_results * 4:
                    break
            
            # Validate and keep best
            if next_combos:
                # For larger sizes, validate more candidates
                validate_count = min(len(next_combos), 150)
                validated = self._validate_combinations(next_combos[:validate_count])
                
                # Adjust threshold based on size
                size_threshold = max(30, 70 - (current_size * 5))
                keep_count = min(30, self.max_results)
                current_combos = [combo for combo, score in validated if score >= size_threshold][:keep_count]
                
                print(f"      Size {current_size + 1}: Generated {len(next_combos)} candidates, kept {len(current_combos)} promising ones")
            else:
                break
        
        return current_combos
    
    def _validate_combinations(self, combinations: List[Tuple]) -> List[Tuple[Tuple, float]]:
        """
        Validate combinations on sample data and return with uniqueness scores.
        
        Returns:
            List of (combination, uniqueness_score) tuples, sorted by score
        """
        results = []
        
        for combo in combinations:
            try:
                # Test on sample data
                if len(combo) == 1:
                    unique_count = self.sample_df[combo[0]].nunique()
                else:
                    unique_count = len(self.sample_df.groupby(list(combo), sort=False))
                
                uniqueness_score = (unique_count / len(self.sample_df)) * 100
                results.append((combo, uniqueness_score))
                
            except Exception as e:
                print(f"⚠️ Error validating {combo}: {e}")
                continue
        
        # Sort by uniqueness score (descending)
        results.sort(key=lambda x: -x[1])
        
        return results
    
    def verify_on_full_dataset(self, combinations: List[Tuple], top_n: int = 10) -> List[Dict]:
        """
        Verify the top combinations on the full dataset.
        
        Args:
            combinations: List of column combinations to verify
            top_n: Number of top combinations to verify
        
        Returns:
            List of analysis results with full dataset statistics
        """
        print(f"\n✅ Verifying top {top_n} combinations on full dataset...")
        
        results = []
        for combo in combinations[:top_n]:
            try:
                combo_list = list(combo)
                
                # Full dataset analysis
                if len(combo_list) == 1:
                    counts = self.df[combo_list[0]].value_counts()
                    unique_rows = len(counts)
                else:
                    grouped = self.df.groupby(combo_list, sort=False, observed=True).size()
                    unique_rows = len(grouped)
                
                uniqueness_score = (unique_rows / self.total_rows) * 100
                is_unique_key = 1 if unique_rows == self.total_rows else 0
                
                results.append({
                    'columns': ','.join(combo),
                    'combination': combo,
                    'total_rows': self.total_rows,
                    'unique_rows': unique_rows,
                    'duplicate_rows': self.total_rows - unique_rows,
                    'uniqueness_score': round(uniqueness_score, 2),
                    'is_unique_key': is_unique_key
                })
                
                print(f"  ✓ {','.join(combo)}: {uniqueness_score:.2f}% unique")
                
            except Exception as e:
                print(f"  ✗ Error verifying {combo}: {e}")
                continue
        
        return results


def discover_unique_keys_intelligent(df: pd.DataFrame, 
                                     num_columns: int = None,
                                     max_combinations: int = 50,
                                     excluded_combinations: List = None,
                                     min_columns: int = None,
                                     max_columns: int = None) -> List[Tuple]:
    """
    Main function to discover unique keys using intelligent algorithm.
    
    Args:
        df: DataFrame to analyze
        num_columns: Target combination size (None = search range from min to max)
        max_combinations: Maximum number of combinations to return
        excluded_combinations: Combinations to exclude from analysis
        min_columns: Minimum combination size (only used if num_columns is None)
        max_columns: Maximum combination size (only used if num_columns is None)
    
    Returns:
        List of promising column combinations
    """
    
    # Apply exclusions
    if excluded_combinations:
        excluded_cols = set()
        for exc in excluded_combinations:
            if len(exc) == 1:
                excluded_cols.add(exc[0])
        
        if excluded_cols:
            df = df[[col for col in df.columns if col not in excluded_cols]]
    
    # Determine combination size strategy
    if num_columns is not None:
        # User specified exact size - use that
        max_size = num_columns
        target_size = num_columns
    else:
        # Search a range of sizes
        max_size = max_columns if max_columns else 10
        target_size = None  # None means search all sizes from min to max
    
    # Initialize discovery engine
    discoverer = IntelligentKeyDiscovery(
        df=df,
        max_combination_size=max_size,
        max_results=max_combinations
    )
    
    # Discover combinations
    if target_size is None:
        # Search multiple sizes (2 to max_size)
        print(f"🔍 Searching for combinations from {min_columns or 2} to {max_size} columns")
        all_combinations = []
        start_size = min_columns if min_columns else 2  # Skip single columns by default
        size_range = range(start_size, max_size + 1)
        num_sizes = len(list(size_range))
        
        # Distribute combinations across sizes
        # Allocate more combinations to smaller sizes (they're more common)
        # But ensure we get some from each size
        combos_per_size = max(10, max_combinations // (num_sizes * 2))  # At least 10 per size
        
        for size in size_range:
            print(f"\n📊 Searching {size}-column combinations...")
            
            # Temporarily adjust max_results for this size
            original_max = discoverer.max_results
            discoverer.max_results = combos_per_size
            
            combos = discoverer._discover_keys_of_size(size)
            
            # Restore original
            discoverer.max_results = original_max
            
            # Add combinations
            all_combinations.extend(combos)
            
            print(f"   Found {len(combos)} promising {size}-column combinations")
            print(f"   Total so far: {len(all_combinations)} combinations")
        
        # If we have too few, try to get more from smaller sizes
        if len(all_combinations) < max_combinations:
            print(f"\n⚡ Need more combinations, getting additional from smaller sizes...")
            for size in range(start_size, min(start_size + 3, max_size + 1)):
                if len(all_combinations) >= max_combinations:
                    break
                needed = max_combinations - len(all_combinations)
                discoverer.max_results = needed
                additional = discoverer._discover_keys_of_size(size)
                # Only add if not already present
                for combo in additional:
                    if combo not in all_combinations:
                        all_combinations.append(combo)
                        if len(all_combinations) >= max_combinations:
                            break
        
        print(f"\n✅ Total: {len(all_combinations)} combinations across {num_sizes} size ranges")
        return all_combinations[:max_combinations]
    else:
        # Search specific size only
        combinations = discoverer.discover_keys(target_size=target_size)
        return combinations


# Example usage and testing
if __name__ == "__main__":
    # Test with sample data
    print("🧪 Testing Intelligent Key Discovery")
    print("=" * 60)
    
    # Create sample data similar to your use case
    np.random.seed(42)
    n_rows = 100000  # Simulating large dataset
    n_cols = 50      # Simulating many columns
    
    # Generate test data
    data = {}
    for i in range(n_cols):
        col_name = f"col_{i}"
        if i < 5:
            # High cardinality ID-like columns
            col_name = f"id_{i}"
            data[col_name] = np.arange(n_rows) + np.random.randint(0, 1000, n_rows)
        elif i < 10:
            # Date-like columns
            col_name = f"date_{i}"
            data[col_name] = pd.date_range('2020-01-01', periods=n_rows, freq='1min')
        else:
            # Regular columns with varying cardinality
            cardinality = np.random.randint(100, n_rows // 10)
            data[col_name] = np.random.randint(0, cardinality, n_rows)
    
    df_test = pd.DataFrame(data)
    
    print(f"📊 Test dataset: {len(df_test):,} rows, {len(df_test.columns)} columns")
    
    # Run discovery
    discoverer = IntelligentKeyDiscovery(df_test, max_combination_size=3, max_results=20)
    
    # Find combinations of size 2
    combos = discoverer.discover_keys(target_size=2)
    
    # Verify on full dataset
    results = discoverer.verify_on_full_dataset(combos, top_n=10)
    
    print("\n📈 Top Results:")
    for result in results[:5]:
        print(f"  {result['columns']}: {result['uniqueness_score']}% unique")

