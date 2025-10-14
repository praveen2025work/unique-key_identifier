# Quick Deployment Guide

## Build for IIS Deployment

### Using the Build Script (Recommended)

**On macOS/Linux:**
```bash
./build-for-iis.sh
```

**On Windows:**
```cmd
build-for-iis.bat
```

The script will:
1. Clean previous builds
2. Check prerequisites
3. Install dependencies
4. Run linting checks
5. Build optimized production files

### Manual Build

```bash
# Install dependencies
npm install

# Build for IIS
npm run build:iis
```

---

## Output

The build creates an `out` directory with:
- `index.html` - Main HTML file
- `web.config` - IIS URL rewriting configuration (CRITICAL!)
- `assets/` - JavaScript, CSS, and other static files

---

## Quick IIS Setup

1. **Copy `out` directory to Windows Server:**
   ```
   C:\inetpub\wwwroot\yourapp\
   ```

2. **Ensure URL Rewrite Module is installed on IIS**
   - Download: https://www.iis.net/downloads/microsoft/url-rewrite

3. **Create IIS Application:**
   - Open IIS Manager
   - Right-click website → Add Application
   - Alias: `yourapp`
   - Physical Path: `C:\inetpub\wwwroot\yourapp`
   - Application Pool: Create new (No Managed Code)

4. **Verify `web.config` is present in the root directory**

5. **Set permissions:**
   - Add `IIS_IUSRS` with Read & Execute
   - Add `IUSR` with Read

6. **Access your app:**
   ```
   http://your-server/yourapp
   ```

---

## Important Files

| File | Purpose | Required? |
|------|---------|-----------|
| `web.config` | IIS URL rewriting & MIME types | ✅ YES |
| `index.html` | Main application entry point | ✅ YES |
| `assets/*` | Application code and styles | ✅ YES |

---

## Troubleshooting

**404 on page refresh?**
- Verify `web.config` is present
- Ensure URL Rewrite Module is installed

**Blank page?**
- Check browser console (F12)
- Verify all files copied correctly
- Check IIS logs

**API not working?**
- Configure CORS on backend
- Set API endpoint in app settings

---

## Complete Documentation

For detailed instructions, see: **[IIS_DEPLOYMENT_GUIDE.md](IIS_DEPLOYMENT_GUIDE.md)**

---

## Support

- Check browser console (F12) for errors
- Review IIS logs: `C:\inetpub\logs\LogFiles\`
- Verify Application Pool is running

