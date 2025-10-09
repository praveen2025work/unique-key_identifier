"""
Generate realistic trading system data with ~150 columns
This creates sample data for Trading System A and Trading System B
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

# Number of rows
NUM_ROWS = 100

# Generate base data
def generate_trading_data(system_name='A', num_rows=NUM_ROWS):
    data = {}
    
    # Core identifiers
    data['trade_id'] = [f'TRD{system_name}{str(i).zfill(6)}' for i in range(1, num_rows + 1)]
    data['system_id'] = [system_name] * num_rows
    data['trader_id'] = [f'TRADER_{random.randint(1, 20):03d}' for _ in range(num_rows)]
    data['desk'] = np.random.choice(['EQUITY', 'FX', 'FIXED_INCOME', 'COMMODITY', 'DERIVATIVES'], num_rows)
    data['book'] = [f'BOOK_{random.randint(1, 50):03d}' for _ in range(num_rows)]
    
    # Date/Time columns
    start_date = datetime(2024, 1, 1)
    data['trade_date'] = [(start_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d') for _ in range(num_rows)]
    data['trade_time'] = [f'{random.randint(9, 16):02d}:{random.randint(0, 59):02d}:{random.randint(0, 59):02d}' for _ in range(num_rows)]
    data['settlement_date'] = [(start_date + timedelta(days=random.randint(0, 400))).strftime('%Y-%m-%d') for _ in range(num_rows)]
    data['maturity_date'] = [(start_date + timedelta(days=random.randint(400, 1000))).strftime('%Y-%m-%d') for _ in range(num_rows)]
    data['value_date'] = data['settlement_date']
    
    # Instrument details
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'JPM', 'BAC', 'GS', 'MS', 'C', 
               'XOM', 'CVX', 'COP', 'SLB', 'HAL', 'GE', 'BA', 'CAT', 'MMM', 'HON']
    data['symbol'] = np.random.choice(symbols, num_rows)
    data['isin'] = [f'US{random.randint(1000000000, 9999999999)}' for _ in range(num_rows)]
    data['cusip'] = [f'{random.randint(100000000, 999999999)}' for _ in range(num_rows)]
    data['sedol'] = [f'{random.randint(1000000, 9999999)}' for _ in range(num_rows)]
    data['ric'] = [f'{sym}.N' for sym in data['symbol']]
    data['bloomberg_ticker'] = [f'{sym} US Equity' for sym in data['symbol']]
    
    # Asset class details
    data['asset_class'] = np.random.choice(['EQUITY', 'BOND', 'OPTION', 'FUTURE', 'SWAP'], num_rows)
    data['product_type'] = np.random.choice(['STOCK', 'ETF', 'OPTION', 'FUTURE', 'SWAP', 'BOND'], num_rows)
    data['instrument_type'] = np.random.choice(['CASH', 'DERIVATIVE', 'STRUCTURED'], num_rows)
    data['security_type'] = np.random.choice(['COMMON', 'PREFERRED', 'WARRANT', 'RIGHT'], num_rows)
    
    # Trade details
    data['side'] = np.random.choice(['BUY', 'SELL'], num_rows)
    data['quantity'] = np.random.randint(100, 10000, num_rows)
    data['price'] = np.round(np.random.uniform(50, 500, num_rows), 2)
    data['gross_amount'] = np.round(data['quantity'] * data['price'], 2)
    data['net_amount'] = np.round(data['gross_amount'] * np.random.uniform(0.98, 1.0, num_rows), 2)
    
    # Currency and FX
    currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD']
    data['currency'] = np.random.choice(currencies, num_rows)
    data['settlement_currency'] = np.random.choice(currencies, num_rows)
    data['fx_rate'] = np.round(np.random.uniform(0.8, 1.5, num_rows), 4)
    data['usd_equivalent'] = np.round(data['net_amount'] * data['fx_rate'], 2)
    
    # Fees and commissions
    data['commission'] = np.round(data['gross_amount'] * np.random.uniform(0.001, 0.005, num_rows), 2)
    data['clearing_fee'] = np.round(data['gross_amount'] * 0.0001, 2)
    data['exchange_fee'] = np.round(data['gross_amount'] * 0.0002, 2)
    data['regulatory_fee'] = np.round(data['gross_amount'] * 0.00005, 2)
    data['total_fees'] = data['commission'] + data['clearing_fee'] + data['exchange_fee'] + data['regulatory_fee']
    
    # Counterparty details
    data['counterparty_id'] = [f'CP{random.randint(1000, 9999)}' for _ in range(num_rows)]
    data['counterparty_name'] = np.random.choice(['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Citi', 
                                                   'Bank of America', 'UBS', 'Credit Suisse', 'Deutsche Bank'], num_rows)
    data['counterparty_country'] = np.random.choice(['US', 'UK', 'CH', 'DE', 'FR', 'JP'], num_rows)
    data['counterparty_rating'] = np.random.choice(['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-'], num_rows)
    
    # Venue and routing
    data['execution_venue'] = np.random.choice(['NYSE', 'NASDAQ', 'LSE', 'EURONEXT', 'XETRA', 'TSE'], num_rows)
    data['market_center'] = np.random.choice(['ELECTRONIC', 'FLOOR', 'OTC', 'DARK_POOL'], num_rows)
    data['order_type'] = np.random.choice(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'MOC', 'LOC'], num_rows)
    data['time_in_force'] = np.random.choice(['DAY', 'GTC', 'IOC', 'FOK'], num_rows)
    
    # Execution quality metrics
    data['execution_timestamp'] = [f'{random.randint(9, 16):02d}:{random.randint(0, 59):02d}:{random.randint(0, 59):02d}.{random.randint(0, 999):03d}' 
                                   for _ in range(num_rows)]
    data['latency_ms'] = np.random.randint(1, 100, num_rows)
    data['slippage_bps'] = np.round(np.random.uniform(-10, 10, num_rows), 2)
    data['market_impact_bps'] = np.round(np.random.uniform(0, 20, num_rows), 2)
    data['implementation_shortfall'] = np.round(np.random.uniform(-5, 5, num_rows), 4)
    
    # Risk metrics
    data['delta'] = np.round(np.random.uniform(-1, 1, num_rows), 4)
    data['gamma'] = np.round(np.random.uniform(0, 0.1, num_rows), 6)
    data['vega'] = np.round(np.random.uniform(-100, 100, num_rows), 2)
    data['theta'] = np.round(np.random.uniform(-10, 0, num_rows), 4)
    data['rho'] = np.round(np.random.uniform(-50, 50, num_rows), 4)
    data['implied_volatility'] = np.round(np.random.uniform(0.1, 0.5, num_rows), 4)
    data['historical_volatility'] = np.round(np.random.uniform(0.15, 0.45, num_rows), 4)
    
    # Market data at execution
    data['bid_price'] = np.round(data['price'] - np.random.uniform(0.01, 0.5, num_rows), 2)
    data['ask_price'] = np.round(data['price'] + np.random.uniform(0.01, 0.5, num_rows), 2)
    data['mid_price'] = np.round((data['bid_price'] + data['ask_price']) / 2, 2)
    data['bid_size'] = np.random.randint(100, 5000, num_rows)
    data['ask_size'] = np.random.randint(100, 5000, num_rows)
    data['last_price'] = data['price']
    data['open_price'] = np.round(data['price'] * np.random.uniform(0.95, 1.05, num_rows), 2)
    data['high_price'] = np.round(data['price'] * np.random.uniform(1.0, 1.1, num_rows), 2)
    data['low_price'] = np.round(data['price'] * np.random.uniform(0.9, 1.0, num_rows), 2)
    data['close_price'] = np.round(data['price'] * np.random.uniform(0.98, 1.02, num_rows), 2)
    data['vwap'] = np.round(data['price'] * np.random.uniform(0.99, 1.01, num_rows), 2)
    data['volume'] = np.random.randint(100000, 10000000, num_rows)
    
    # Technical indicators
    data['rsi_14'] = np.round(np.random.uniform(20, 80, num_rows), 2)
    data['macd'] = np.round(np.random.uniform(-2, 2, num_rows), 4)
    data['macd_signal'] = np.round(np.random.uniform(-2, 2, num_rows), 4)
    data['macd_histogram'] = data['macd'] - data['macd_signal']
    data['bollinger_upper'] = np.round(data['price'] * 1.02, 2)
    data['bollinger_lower'] = np.round(data['price'] * 0.98, 2)
    data['sma_20'] = np.round(data['price'] * np.random.uniform(0.98, 1.02, num_rows), 2)
    data['sma_50'] = np.round(data['price'] * np.random.uniform(0.97, 1.03, num_rows), 2)
    data['sma_200'] = np.round(data['price'] * np.random.uniform(0.95, 1.05, num_rows), 2)
    data['ema_12'] = np.round(data['price'] * np.random.uniform(0.99, 1.01, num_rows), 2)
    data['ema_26'] = np.round(data['price'] * np.random.uniform(0.98, 1.02, num_rows), 2)
    
    # Portfolio and position
    data['portfolio_id'] = [f'PF{random.randint(100, 999)}' for _ in range(num_rows)]
    data['strategy_id'] = np.random.choice(['MOMENTUM', 'MEAN_REVERSION', 'ARBITRAGE', 'MARKET_MAKING', 'TREND_FOLLOWING'], num_rows)
    data['position_before'] = np.random.randint(-10000, 10000, num_rows)
    data['position_after'] = data['position_before'] + np.where(data['side'] == 'BUY', data['quantity'], -data['quantity'])
    data['average_cost'] = np.round(np.random.uniform(40, 600, num_rows), 2)
    data['unrealized_pnl'] = np.round((data['price'] - data['average_cost']) * data['position_after'], 2)
    data['realized_pnl'] = np.round(np.random.uniform(-10000, 10000, num_rows), 2)
    data['total_pnl'] = data['unrealized_pnl'] + data['realized_pnl']
    
    # Compliance and regulatory
    data['trade_status'] = np.random.choice(['NEW', 'FILLED', 'PARTIAL', 'CANCELLED', 'REJECTED'], num_rows, p=[0.05, 0.80, 0.05, 0.05, 0.05])
    data['settlement_status'] = np.random.choice(['PENDING', 'SETTLED', 'FAILED', 'CANCELLED'], num_rows, p=[0.1, 0.85, 0.03, 0.02])
    data['regulatory_flag'] = np.random.choice(['NONE', 'LARGE_TRADER', 'INSIDER', 'RESTRICTED'], num_rows, p=[0.90, 0.05, 0.03, 0.02])
    data['compliance_checked'] = np.random.choice(['YES', 'NO', 'PENDING'], num_rows, p=[0.95, 0.02, 0.03])
    data['best_execution_flag'] = np.random.choice(['YES', 'NO', 'REVIEW'], num_rows, p=[0.92, 0.05, 0.03])
    
    # Clearing and settlement
    data['clearing_house'] = np.random.choice(['DTC', 'NSCC', 'OCC', 'CME', 'ICE'], num_rows)
    data['custodian'] = np.random.choice(['BNY_MELLON', 'STATE_STREET', 'JPMORGAN', 'CITI'], num_rows)
    data['settlement_method'] = np.random.choice(['DVP', 'FOP', 'RVP'], num_rows)
    data['settlement_instruction'] = [f'SI{random.randint(10000, 99999)}' for _ in range(num_rows)]
    
    # Additional identifiers
    data['order_id'] = [f'ORD{system_name}{str(i).zfill(8)}' for i in range(1, num_rows + 1)]
    data['execution_id'] = [f'EXE{system_name}{str(i).zfill(8)}' for i in range(1, num_rows + 1)]
    data['allocation_id'] = [f'ALO{system_name}{str(i).zfill(8)}' for i in range(1, num_rows + 1)]
    data['confirmation_id'] = [f'CNF{system_name}{str(i).zfill(8)}' for i in range(1, num_rows + 1)]
    
    # System and audit
    data['source_system'] = f'TRADING_SYSTEM_{system_name}'
    data['created_by'] = [f'USER_{random.randint(1, 50):03d}' for _ in range(num_rows)]
    data['created_timestamp'] = [f'2024-{random.randint(1, 12):02d}-{random.randint(1, 28):02d} {random.randint(0, 23):02d}:{random.randint(0, 59):02d}:{random.randint(0, 59):02d}' 
                                 for _ in range(num_rows)]
    data['modified_by'] = data['created_by']
    data['modified_timestamp'] = data['created_timestamp']
    data['version'] = np.random.randint(1, 5, num_rows)
    data['audit_trail'] = [f'AUDIT_{random.randint(100000, 999999)}' for _ in range(num_rows)]
    
    # Additional market data
    data['tick_size'] = np.random.choice([0.01, 0.05, 0.10, 0.25], num_rows)
    data['lot_size'] = np.random.choice([1, 10, 100, 1000], num_rows)
    data['market_cap'] = np.random.choice(['LARGE_CAP', 'MID_CAP', 'SMALL_CAP'], num_rows)
    data['sector'] = np.random.choice(['TECHNOLOGY', 'FINANCIALS', 'HEALTHCARE', 'ENERGY', 'CONSUMER', 'INDUSTRIAL'], num_rows)
    data['industry'] = np.random.choice(['SOFTWARE', 'BANKING', 'PHARMA', 'OIL_GAS', 'RETAIL', 'MANUFACTURING'], num_rows)
    
    # Performance attribution
    data['alpha'] = np.round(np.random.uniform(-0.05, 0.05, num_rows), 4)
    data['beta'] = np.round(np.random.uniform(0.5, 1.5, num_rows), 4)
    data['sharpe_ratio'] = np.round(np.random.uniform(-1, 3, num_rows), 4)
    data['sortino_ratio'] = np.round(np.random.uniform(-1, 4, num_rows), 4)
    data['information_ratio'] = np.round(np.random.uniform(-0.5, 1.5, num_rows), 4)
    data['tracking_error'] = np.round(np.random.uniform(0.01, 0.1, num_rows), 4)
    data['var_95'] = np.round(np.random.uniform(-50000, -1000, num_rows), 2)
    data['cvar_95'] = np.round(np.random.uniform(-70000, -5000, num_rows), 2)
    data['maximum_drawdown'] = np.round(np.random.uniform(-0.3, 0, num_rows), 4)
    
    # Additional flags
    data['block_trade'] = np.random.choice(['YES', 'NO'], num_rows, p=[0.1, 0.9])
    data['cross_trade'] = np.random.choice(['YES', 'NO'], num_rows, p=[0.05, 0.95])
    data['algorithmic'] = np.random.choice(['YES', 'NO'], num_rows, p=[0.7, 0.3])
    data['high_frequency'] = np.random.choice(['YES', 'NO'], num_rows, p=[0.3, 0.7])
    data['dark_pool'] = np.random.choice(['YES', 'NO'], num_rows, p=[0.2, 0.8])
    
    return pd.DataFrame(data)

# Generate data for both systems
print("Generating Trading System A data...")
df_a = generate_trading_data('A', NUM_ROWS)

print("Generating Trading System B data...")
df_b = generate_trading_data('B', NUM_ROWS)

# Add some intentional duplicates for demonstration
# Duplicate some trader_id + desk combinations
for i in range(10):
    if i < len(df_a):
        df_a.loc[i, 'trader_id'] = 'TRADER_001'
        df_a.loc[i, 'desk'] = 'EQUITY'

for i in range(15):
    if i < len(df_b):
        df_b.loc[i, 'trader_id'] = 'TRADER_001'
        df_b.loc[i, 'desk'] = 'EQUITY'

# Save to CSV
print(f"\nSaving trading_system_a.csv ({len(df_a.columns)} columns, {len(df_a)} rows)...")
df_a.to_csv('trading_system_a.csv', index=False)

print(f"Saving trading_system_b.csv ({len(df_b.columns)} columns, {len(df_b)} rows)...")
df_b.to_csv('trading_system_b.csv', index=False)

print(f"\n✅ Data generation complete!")
print(f"   System A: {len(df_a)} rows × {len(df_a.columns)} columns")
print(f"   System B: {len(df_b)} rows × {len(df_b.columns)} columns")
print(f"\nColumn list:")
for i, col in enumerate(df_a.columns, 1):
    print(f"   {i:3d}. {col}")

