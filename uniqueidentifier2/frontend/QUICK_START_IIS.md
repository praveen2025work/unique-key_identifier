# Quick Start Guide - IIS Deployment

## For Developers (Building the Package)

### 1. Update Production Configuration
Edit `.env.production` and set your backend API URL:
```env
VITE_API_URL=http://your-backend-server:8000
```

### 2. Build the Production Bundle
```bash
cd uniqueidentifier2/frontend
npm install
npm run build
```

### 3. Create Deployment Package
The `dist` folder contains everything needed for IIS deployment.

**Option A - Manual ZIP:**
```bash
# Windows PowerShell
Compress-Archive -Path dist\* -DestinationPath frontend-deploy.zip -Force
```

**Option B - Use Deployment Script:**
```powershell
# Windows PowerShell
.\deploy-to-iis.ps1
```

### 4. Transfer to Windows Server
Transfer the deployment package to your Windows Server:
- Copy `dist` folder or `frontend-deploy.zip`
- Transfer via RDP, network share, or FTP

---

## For IT/Server Administrators (IIS Setup)

### Prerequisites Checklist
- [ ] Windows Server with IIS installed
- [ ] URL Rewrite Module installed ([Download](https://www.iis.net/downloads/microsoft/url-rewrite))
- [ ] Deployment package received

### Quick Setup (5 Minutes)

#### Step 1: Create Physical Directory
```powershell
# PowerShell as Administrator
New-Item -Path "C:\inetpub\wwwroot\uniquekey-frontend" -ItemType Directory -Force
```

#### Step 2: Extract Files
```powershell
# If you have a ZIP file
Expand-Archive -Path "frontend-deploy.zip" -DestinationPath "C:\inetpub\wwwroot\uniquekey-frontend" -Force

# Or copy dist folder contents
# Copy-Item -Path "dist\*" -Destination "C:\inetpub\wwwroot\uniquekey-frontend" -Recurse -Force
```

#### Step 3: Create IIS Site

**Option A - Using PowerShell:**
```powershell
# Import IIS module
Import-Module WebAdministration

# Create new website
New-Website -Name "UniqueKeyIdentifierFrontend" `
           -PhysicalPath "C:\inetpub\wwwroot\uniquekey-frontend" `
           -Port 80 `
           -Force

# Or create as application under Default Web Site
New-WebApplication -Name "uniquekey" `
                  -Site "Default Web Site" `
                  -PhysicalPath "C:\inetpub\wwwroot\uniquekey-frontend" `
                  -ApplicationPool "DefaultAppPool"

# Start the site
Start-Website -Name "UniqueKeyIdentifierFrontend"
```

**Option B - Using IIS Manager GUI:**
1. Open IIS Manager
2. Right-click "Sites" → "Add Website"
3. Site name: `UniqueKeyIdentifierFrontend`
4. Physical path: `C:\inetpub\wwwroot\uniquekey-frontend`
5. Port: `80` (or choose available port)
6. Click OK

#### Step 4: Verify

**Check files exist:**
```powershell
# Should show index.html, web.config, assets folder
Get-ChildItem "C:\inetpub\wwwroot\uniquekey-frontend"
```

**Check URL Rewrite:**
1. In IIS Manager, select your site
2. Double-click "URL Rewrite"
3. Verify "React Routes" rule exists

**Test access:**
```
http://localhost
# or
http://your-server-name
```

---

## Verification Checklist

After deployment, verify:

- [ ] **Site loads**: Navigate to the URL in browser
- [ ] **No console errors**: Press F12, check Console tab
- [ ] **Routing works**: Click navigation links
- [ ] **Page refresh works**: On any page, press F5 (should not 404)
- [ ] **API connectivity**: Try an action that calls backend
- [ ] **Static assets load**: Check Network tab in F12

---

## Common Issues & Quick Fixes

### Issue: 404 on Page Refresh
**Fix**: Install URL Rewrite module and verify web.config exists
```powershell
# Check if web.config exists
Test-Path "C:\inetpub\wwwroot\uniquekey-frontend\web.config"
# Should return: True
```

### Issue: Blank Page
**Fix**: Check browser console (F12) for errors
- Usually means wrong API URL or CORS issue
- Update `.env.production` and rebuild

### Issue: API Calls Failing
**Fix**: Update API endpoint
1. Edit `.env.production` on build machine
2. Set correct `VITE_API_URL`
3. Rebuild: `npm run build`
4. Redeploy

### Issue: 500 Internal Server Error
**Fix**: Check IIS logs and verify web.config
```powershell
# View recent IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" | Select-Object -Last 50
```

---

## Environment-Specific URLs

### Development
```
http://localhost:5173
```

### Staging/Testing
```
http://test-server:80
http://test-server/uniquekey  (if deployed as sub-application)
```

### Production
```
http://your-domain.com
https://your-domain.com  (with SSL)
```

---

## Update Process

When deploying updates:

1. **Build new version** (on dev machine)
   ```bash
   npm run build
   ```

2. **Stop IIS site** (on server)
   ```powershell
   Stop-Website -Name "UniqueKeyIdentifierFrontend"
   ```

3. **Backup existing files** (recommended)
   ```powershell
   $backup = "C:\inetpub\wwwroot\uniquekey-frontend-backup-$(Get-Date -Format 'yyyyMMdd')"
   Copy-Item -Path "C:\inetpub\wwwroot\uniquekey-frontend" -Destination $backup -Recurse
   ```

4. **Replace files**
   ```powershell
   Remove-Item "C:\inetpub\wwwroot\uniquekey-frontend\*" -Recurse -Force
   Copy-Item -Path "dist\*" -Destination "C:\inetpub\wwwroot\uniquekey-frontend" -Recurse -Force
   ```

5. **Start IIS site**
   ```powershell
   Start-Website -Name "UniqueKeyIdentifierFrontend"
   ```

---

## Production Recommendations

### Security
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure security headers (already in web.config)
- [ ] Set up firewall rules
- [ ] Consider adding authentication

### Performance
- [ ] Enable compression (already configured)
- [ ] Configure browser caching (already configured)
- [ ] Consider CDN for static assets
- [ ] Monitor performance with IIS logs

### Monitoring
- [ ] Set up IIS logging
- [ ] Monitor application pool health
- [ ] Set up automated health checks
- [ ] Configure email alerts for failures

---

## Support Resources

- **Full Documentation**: See `IIS_DEPLOYMENT_GUIDE.md`
- **IIS Logs**: `C:\inetpub\logs\LogFiles\`
- **Troubleshooting**: Check browser console (F12) and IIS logs
- **URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite

---

## Scripts Reference

```bash
# Development
npm run dev              # Start development server

# Building
npm run build            # Build for production
npm run build:prod       # Build with production config
npm run deploy:check     # Lint + Build

# Preview
npm run preview          # Preview production build locally
```

```powershell
# Deployment (Windows PowerShell)
.\deploy-to-iis.ps1      # Interactive deployment script
```

---

**Need Help?** Check the full deployment guide: `IIS_DEPLOYMENT_GUIDE.md`

