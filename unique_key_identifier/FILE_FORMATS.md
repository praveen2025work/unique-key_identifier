# 📁 Supported File Formats

The Unique Key Identifier application now supports multiple data file formats with **automatic delimiter detection**.

---

## ✅ Supported Formats

| Format | Extension | Description | Example |
|--------|-----------|-------------|---------|
| **CSV** | `.csv` | Comma-separated values | `data.csv` |
| **DAT** | `.dat` | Data files (any delimiter) | `records.dat` |
| **TXT** | `.txt` | Text files (any delimiter) | `export.txt` |

---

## 🔍 Auto-Detected Delimiters

The application automatically detects the following delimiters:

| Delimiter | Symbol | Common Usage |
|-----------|--------|--------------|
| **Comma** | `,` | Standard CSV files |
| **Tab** | `\t` | Tab-separated files |
| **Pipe** | `|` | Database exports |
| **Semicolon** | `;` | European CSV format |
| **Space** | ` ` | Fixed-width style files |

---

## 🎯 How It Works

### 1. **Automatic Detection**
- The application reads the first 5 lines of your file
- Analyzes delimiter patterns using Python's CSV Sniffer
- Falls back to frequency analysis if needed
- Selects the most consistent delimiter

### 2. **Encoding Support**
- **UTF-8** (default, recommended)
- **Latin-1** (fallback for legacy files)
- Automatic encoding detection and fallback

### 3. **Error Handling**
- Skips bad lines automatically
- Provides clear error messages
- Handles mixed encodings gracefully

---

## 📝 File Requirements

### ✅ Required:
- **Headers in first row** - column names must be present
- **Same structure** - both files must have identical columns
- **Valid delimiters** - one of the supported delimiters
- **Text format** - must be readable as text

### ❌ Not Supported:
- Binary files (Excel .xlsx, .xls)
- JSON or XML files
- Multi-line headers
- Files without headers

---

## 💡 Examples

### Example 1: CSV File (comma-delimited)
```csv
desk,book,sedol,quantity,price
DESK1,BOOK1,SED001,100,50.25
DESK2,BOOK2,SED002,200,75.50
```

### Example 2: DAT File (pipe-delimited)
```
desk|book|sedol|quantity|price
DESK1|BOOK1|SED001|100|50.25
DESK2|BOOK2|SED002|200|75.50
```

### Example 3: TXT File (tab-delimited)
```
desk	book	sedol	quantity	price
DESK1	BOOK1	SED001	100	50.25
DESK2	BOOK2	SED002	200	75.50
```

### Example 4: Semicolon-delimited (European format)
```csv
desk;book;sedol;quantity;price
DESK1;BOOK1;SED001;100;50,25
DESK2;BOOK2;SED002;200;75,50
```

---

## 🧪 Testing Your Files

### Quick Test:
1. Place your file in the `unique_key_identifier/` folder
2. Open the application at http://localhost:8000
3. Enter your filename
4. The application will preview columns automatically
5. ✅ **Success:** You'll see your columns listed
6. ❌ **Error:** Check the error message for details

### Sample Files Included:
- `sample_test.dat` - Pipe-delimited test file
- `sample_test.txt` - Tab-delimited test file
- `trading_system_a.csv` - Comma-delimited CSV
- `trading_system_b.csv` - Comma-delimited CSV

---

## 🔧 Troubleshooting

### Problem: "Error reading data files"
**Possible causes:**
- File is not text-readable (might be binary)
- No consistent delimiter found
- File encoding is unusual

**Solution:**
- Verify file opens in text editor
- Check delimiter consistency
- Try converting to UTF-8 encoding

### Problem: "Files have different column structures"
**Cause:** Column headers don't match between File A and File B

**Solution:**
- Ensure both files have identical column names
- Check for extra spaces or typos
- Verify column order is the same

### Problem: Columns detected incorrectly
**Possible causes:**
- Delimiter appears within data values
- Inconsistent delimiter usage
- Mixed delimiters in file

**Solution:**
- Quote values containing delimiters
- Use a different delimiter
- Clean your data file

---

## 🎨 Converting Between Formats

### CSV to DAT (pipe-delimited):
```python
import pandas as pd
df = pd.read_csv('file.csv')
df.to_csv('file.dat', sep='|', index=False)
```

### CSV to TXT (tab-delimited):
```python
import pandas as pd
df = pd.read_csv('file.csv')
df.to_csv('file.txt', sep='\t', index=False)
```

### Any format to CSV:
```python
import pandas as pd
# Automatic delimiter detection
from csv import Sniffer
with open('file.dat') as f:
    delimiter = Sniffer().sniff(f.read(1024)).delimiter
df = pd.read_csv('file.dat', sep=delimiter)
df.to_csv('file.csv', index=False)
```

---

## 📊 Best Practices

### ✅ Recommended:
1. **Use CSV format** when possible (most universal)
2. **Include headers** always as first row
3. **Use UTF-8 encoding** for international characters
4. **Quote special values** if they contain delimiters
5. **Test with small samples** before full analysis

### ⚠️ Avoid:
1. Mixed delimiters in same file
2. Multi-line headers
3. Special characters in column names
4. Inconsistent quoting
5. Empty header columns

---

## 🚀 Performance Tips

- **Large files:** The application reads efficiently but memory usage scales with file size
- **Optimal size:** Under 1GB for best performance
- **Multiple formats:** No performance difference between CSV/DAT/TXT
- **Delimiter detection:** Adds ~0.1 seconds per file (negligible)

---

## 📚 Technical Details

### Implementation:
```python
# Automatic delimiter detection
def detect_delimiter(file_path):
    with open(file_path, 'r') as f:
        sample = f.read(1024)
    sniffer = csv.Sniffer()
    return sniffer.sniff(sample).delimiter

# Smart file reading
def read_data_file(file_path):
    delimiter = detect_delimiter(file_path)
    return pd.read_csv(file_path, sep=delimiter, 
                      encoding='utf-8', on_bad_lines='skip')
```

### Libraries Used:
- **pandas** - Data reading and processing
- **csv.Sniffer** - Delimiter detection
- **FastAPI** - Web framework

---

## ✨ Summary

- ✅ **Multiple formats supported:** CSV, DAT, TXT
- ✅ **Auto-delimiter detection:** No manual configuration
- ✅ **Robust handling:** Automatic encoding detection
- ✅ **Error recovery:** Skips bad lines gracefully
- ✅ **Same great features:** All analysis capabilities work across all formats

**Just place your file and let the application handle the rest!** 🎉

---

## 🆘 Need Help?

- Check [README.md](README.md) for general usage
- See [SETUP_GUIDE.md](SETUP_GUIDE.md) for installation
- Review [COMMANDS.txt](COMMANDS.txt) for quick reference

**Your data, any format, analyzed seamlessly!** 📊

