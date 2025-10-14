"""
Enhanced Export Manager
Comprehensive export capabilities for comparison results
"""
import pandas as pd
import os
import json
from datetime import datetime
from typing import Dict, Any, List
import xlsxwriter
from io import BytesIO


class ExportManager:
    """
    Manages export of comparison results in various formats
    """
    
    def __init__(self, working_dir: str):
        """
        Initialize export manager
        
        Args:
            working_dir: Working directory for this run
        """
        self.working_dir = working_dir
        self.exports_dir = os.path.join(working_dir, 'exports')
        os.makedirs(self.exports_dir, exist_ok=True)
    
    def export_comparison_to_csv(
        self, 
        results: Dict[str, Any],
        include_samples: bool = True
    ) -> Dict[str, str]:
        """
        Export comparison results to multiple CSV files
        
        Returns:
            Dictionary mapping export type to file path
        """
        exported_files = {}
        
        # 1. Export summary
        summary_file = os.path.join(self.exports_dir, 'summary.csv')
        summary_df = pd.DataFrame([results['comparison']['summary']])
        summary_df.to_csv(summary_file, index=False)
        exported_files['summary'] = summary_file
        
        # 2. Export matched keys
        if results['comparison']['matched']['sample_keys']:
            matched_file = os.path.join(self.exports_dir, 'matched_keys.csv')
            matched_df = pd.DataFrame({
                'matched_key_hash': results['comparison']['matched']['sample_keys']
            })
            matched_df.to_csv(matched_file, index=False)
            exported_files['matched'] = matched_file
        
        # 3. Export only_in_a keys
        if results['comparison']['only_in_a']['sample_keys']:
            only_a_file = os.path.join(self.exports_dir, 'only_in_a_keys.csv')
            only_a_df = pd.DataFrame({
                'key_hash': results['comparison']['only_in_a']['sample_keys']
            })
            only_a_df.to_csv(only_a_file, index=False)
            exported_files['only_in_a'] = only_a_file
        
        # 4. Export only_in_b keys
        if results['comparison']['only_in_b']['sample_keys']:
            only_b_file = os.path.join(self.exports_dir, 'only_in_b_keys.csv')
            only_b_df = pd.DataFrame({
                'key_hash': results['comparison']['only_in_b']['sample_keys']
            })
            only_b_df.to_csv(only_b_file, index=False)
            exported_files['only_in_b'] = only_b_file
        
        # 5. Export duplicates
        if 'duplicates' in results:
            if results['duplicates'].get('side_a'):
                dup_a_file = os.path.join(self.exports_dir, 'duplicates_side_a.csv')
                dup_a_df = pd.DataFrame(results['duplicates']['side_a'])
                dup_a_df.to_csv(dup_a_file, index=False)
                exported_files['duplicates_a'] = dup_a_file
            
            if results['duplicates'].get('side_b'):
                dup_b_file = os.path.join(self.exports_dir, 'duplicates_side_b.csv')
                dup_b_df = pd.DataFrame(results['duplicates']['side_b'])
                dup_b_df.to_csv(dup_b_file, index=False)
                exported_files['duplicates_b'] = dup_b_file
        
        print(f"📥 Exported {len(exported_files)} CSV files to: {self.exports_dir}")
        
        return exported_files
    
    def export_comparison_to_excel(
        self, 
        results: Dict[str, Any],
        output_filename: str = None
    ) -> str:
        """
        Export comprehensive comparison results to Excel with multiple sheets
        
        Returns:
            Path to Excel file
        """
        if output_filename is None:
            output_filename = f"comparison_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        excel_file = os.path.join(self.exports_dir, output_filename)
        
        with pd.ExcelWriter(excel_file, engine='xlsxwriter') as writer:
            workbook = writer.book
            
            # Define formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#337ab7',
                'font_color': 'white',
                'border': 1
            })
            
            success_format = workbook.add_format({
                'bg_color': '#d4edda',
                'border': 1
            })
            
            warning_format = workbook.add_format({
                'bg_color': '#fff3cd',
                'border': 1
            })
            
            # Sheet 1: Summary
            summary_data = {
                'Metric': [],
                'Value': []
            }
            
            summary = results['comparison']['summary']
            summary_data['Metric'].extend([
                'Total Unique Keys - Side A',
                'Total Unique Keys - Side B',
                'Matched Keys',
                'Only in Side A',
                'Only in Side B',
                'Match Rate (by Keys)',
                'Match Rate (by Rows A)',
                'Match Rate (by Rows B)'
            ])
            summary_data['Value'].extend([
                f"{summary['total_unique_keys_a']:,}",
                f"{summary['total_unique_keys_b']:,}",
                f"{summary['matched_keys']:,}",
                f"{summary['only_in_a_keys']:,}",
                f"{summary['only_in_b_keys']:,}",
                f"{summary['match_rate_by_keys']:.2f}%",
                f"{summary['match_rate_by_rows_a']:.2f}%",
                f"{summary['match_rate_by_rows_b']:.2f}%"
            ])
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Format summary sheet
            worksheet = writer.sheets['Summary']
            worksheet.set_column('A:A', 30)
            worksheet.set_column('B:B', 20)
            
            # Sheet 2: Side A Details
            side_a_data = {
                'Metric': [
                    'Total Rows',
                    'Unique Keys',
                    'Duplicate Keys',
                    'Chunks Processed'
                ],
                'Value': [
                    f"{results['side_a']['total_rows']:,}",
                    f"{results['side_a']['unique_keys']:,}",
                    f"{results['side_a']['duplicate_keys']:,}",
                    results['side_a']['chunks_processed']
                ]
            }
            side_a_df = pd.DataFrame(side_a_data)
            side_a_df.to_excel(writer, sheet_name='Side A Details', index=False)
            
            # Sheet 3: Side B Details
            side_b_data = {
                'Metric': [
                    'Total Rows',
                    'Unique Keys',
                    'Duplicate Keys',
                    'Chunks Processed'
                ],
                'Value': [
                    f"{results['side_b']['total_rows']:,}",
                    f"{results['side_b']['unique_keys']:,}",
                    f"{results['side_b']['duplicate_keys']:,}",
                    results['side_b']['chunks_processed']
                ]
            }
            side_b_df = pd.DataFrame(side_b_data)
            side_b_df.to_excel(writer, sheet_name='Side B Details', index=False)
            
            # Sheet 4: Duplicates Side A (if available)
            if 'duplicates' in results and results['duplicates'].get('side_a'):
                dup_a_list = []
                for dup in results['duplicates']['side_a'][:1000]:  # Limit to 1000
                    dup_a_list.append({
                        'Key': dup['key'],
                        'Occurrences': dup['occurrence_count'],
                        'Key Columns': ', '.join(dup['key_columns'])
                    })
                
                if dup_a_list:
                    dup_a_df = pd.DataFrame(dup_a_list)
                    dup_a_df.to_excel(writer, sheet_name='Duplicates Side A', index=False)
                    
                    worksheet = writer.sheets['Duplicates Side A']
                    worksheet.set_column('A:A', 40)
                    worksheet.set_column('B:B', 15)
                    worksheet.set_column('C:C', 30)
            
            # Sheet 5: Duplicates Side B (if available)
            if 'duplicates' in results and results['duplicates'].get('side_b'):
                dup_b_list = []
                for dup in results['duplicates']['side_b'][:1000]:  # Limit to 1000
                    dup_b_list.append({
                        'Key': dup['key'],
                        'Occurrences': dup['occurrence_count'],
                        'Key Columns': ', '.join(dup['key_columns'])
                    })
                
                if dup_b_list:
                    dup_b_df = pd.DataFrame(dup_b_list)
                    dup_b_df.to_excel(writer, sheet_name='Duplicates Side B', index=False)
                    
                    worksheet = writer.sheets['Duplicates Side B']
                    worksheet.set_column('A:A', 40)
                    worksheet.set_column('B:B', 15)
                    worksheet.set_column('C:C', 30)
            
            # Sheet 6: Metadata
            metadata = {
                'Property': [
                    'Run ID',
                    'Timestamp',
                    'Key Columns',
                    'Working Directory'
                ],
                'Value': [
                    results['run_id'],
                    results['timestamp'],
                    ', '.join(results['key_columns']),
                    self.working_dir
                ]
            }
            metadata_df = pd.DataFrame(metadata)
            metadata_df.to_excel(writer, sheet_name='Metadata', index=False)
        
        print(f"📊 Exported comprehensive Excel report: {excel_file}")
        
        return excel_file
    
    def export_full_data_csv(
        self,
        chunks: List[pd.DataFrame],
        side: str,
        key_columns: List[str],
        filter_type: str = 'all'
    ) -> str:
        """
        Export full data from chunks to CSV
        
        Args:
            chunks: List of DataFrame chunks
            side: 'A' or 'B'
            key_columns: Key columns for filtering
            filter_type: 'all', 'duplicates_only', 'unique_only'
            
        Returns:
            Path to exported file
        """
        output_file = os.path.join(
            self.exports_dir, 
            f"side_{side}_{filter_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        )
        
        # Combine all chunks
        full_df = pd.concat(chunks, ignore_index=True)
        
        if filter_type == 'duplicates_only':
            # Keep only rows with duplicate keys
            duplicates = full_df.duplicated(subset=key_columns, keep=False)
            filtered_df = full_df[duplicates]
        elif filter_type == 'unique_only':
            # Keep only rows with unique keys
            duplicates = full_df.duplicated(subset=key_columns, keep=False)
            filtered_df = full_df[~duplicates]
        else:
            filtered_df = full_df
        
        # Export to CSV
        filtered_df.to_csv(output_file, index=False)
        
        print(f"💾 Exported {len(filtered_df):,} rows to: {output_file}")
        
        return output_file
    
    def create_comparison_report_html(
        self,
        results: Dict[str, Any]
    ) -> str:
        """
        Create an HTML report for comparison results
        
        Returns:
            Path to HTML file
        """
        html_file = os.path.join(
            self.exports_dir, 
            f"comparison_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        )
        
        summary = results['comparison']['summary']
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Comparison Report - {results['run_id']}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #337ab7;
            border-bottom: 3px solid #337ab7;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #5a6268;
            margin-top: 30px;
        }}
        .metric-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .metric-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #337ab7;
        }}
        .metric-label {{
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 5px;
        }}
        .metric-value {{
            font-size: 28px;
            font-weight: bold;
            color: #212529;
        }}
        .match-rate {{
            font-size: 48px;
            text-align: center;
            color: #28a745;
            margin: 20px 0;
        }}
        .details-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .details-table th {{
            background: #337ab7;
            color: white;
            padding: 12px;
            text-align: left;
        }}
        .details-table td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }}
        .details-table tr:hover {{
            background: #f8f9fa;
        }}
        .timestamp {{
            color: #6c757d;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Data Comparison Report</h1>
        <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p class="timestamp">Run ID: {results['run_id']}</p>
        <p class="timestamp">Key Columns: {', '.join(results['key_columns'])}</p>
        
        <div class="match-rate">
            Match Rate: {summary['match_rate_by_keys']:.2f}%
        </div>
        
        <h2>📈 Summary Statistics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">Side A - Unique Keys</div>
                <div class="metric-value">{summary['total_unique_keys_a']:,}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Side B - Unique Keys</div>
                <div class="metric-value">{summary['total_unique_keys_b']:,}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Matched Keys</div>
                <div class="metric-value">{summary['matched_keys']:,}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Only in Side A</div>
                <div class="metric-value">{summary['only_in_a_keys']:,}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Only in Side B</div>
                <div class="metric-value">{summary['only_in_b_keys']:,}</div>
            </div>
        </div>
        
        <h2>📋 Detailed Breakdown</h2>
        <table class="details-table">
            <tr>
                <th>Metric</th>
                <th>Side A</th>
                <th>Side B</th>
            </tr>
            <tr>
                <td>Total Rows</td>
                <td>{results['side_a']['total_rows']:,}</td>
                <td>{results['side_b']['total_rows']:,}</td>
            </tr>
            <tr>
                <td>Unique Keys</td>
                <td>{results['side_a']['unique_keys']:,}</td>
                <td>{results['side_b']['unique_keys']:,}</td>
            </tr>
            <tr>
                <td>Duplicate Keys</td>
                <td>{results['side_a']['duplicate_keys']:,}</td>
                <td>{results['side_b']['duplicate_keys']:,}</td>
            </tr>
            <tr>
                <td>Chunks Processed</td>
                <td>{results['side_a']['chunks_processed']}</td>
                <td>{results['side_b']['chunks_processed']}</td>
            </tr>
            <tr>
                <td>Match Rate (by rows)</td>
                <td>{summary['match_rate_by_rows_a']:.2f}%</td>
                <td>{summary['match_rate_by_rows_b']:.2f}%</td>
            </tr>
        </table>
        
        <h2>📁 Exported Files</h2>
        <p>All detailed results have been exported to: <code>{self.exports_dir}</code></p>
        <ul>
            <li>summary.csv - Summary statistics</li>
            <li>matched_keys.csv - Keys present in both sides</li>
            <li>only_in_a_keys.csv - Keys only in Side A</li>
            <li>only_in_b_keys.csv - Keys only in Side B</li>
            <li>duplicates_side_a.csv - Duplicate records in Side A</li>
            <li>duplicates_side_b.csv - Duplicate records in Side B</li>
        </ul>
    </div>
</body>
</html>
"""
        
        with open(html_file, 'w') as f:
            f.write(html_content)
        
        print(f"📄 Created HTML report: {html_file}")
        
        return html_file

