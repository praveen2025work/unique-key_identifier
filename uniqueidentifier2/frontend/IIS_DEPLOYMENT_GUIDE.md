# IIS Deployment Guide for React Frontend

## Overview
This guide walks you through deploying the React frontend application to Windows Server IIS as a standalone web application.

---

## Prerequisites

### On Your Development Machine:
- ✅ Node.js (v18 or higher)
- ✅ npm or yarn
- ✅ Git (for version control)

### On Windows Server:
- ✅ Windows Server 2016 or higher
- ✅ IIS (Internet Information Services) installed
- ✅ URL Rewrite Module for IIS ([Download](https://www.iis.net/downloads/microsoft/url-rewrite))
- ✅ Administrator access

---

## Step 1: Build the Application

### On Your Development Machine:

1. **Navigate to the frontend directory:**
   ```bash
   cd uniqueidentifier2/frontend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Build for IIS deployment:**
   ```bash
   npm run build:iis
   ```
   
   This will:
   - Run TypeScript compiler
   - Run ESLint checks
   - Build optimized production files
   - Create the `out` directory with all deployment files

4. **Verify the build:**
   - Check that the `out` directory exists
   - Verify `web.config` is present in the `out` directory
   - Confirm `index.html` and `assets/` folder are present

---

## Step 2: Prepare Windows Server

### Install URL Rewrite Module:

1. Download from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install on your Windows Server
3. Restart IIS after installation

### Enable Required IIS Features:

Open PowerShell as Administrator and run:

```powershell
# Enable IIS features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-LoggingLibraries
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestMonitor
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpTracing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionDynamic
```

---

## Step 3: Deploy to IIS

### Option A: Using IIS Manager GUI

1. **Open IIS Manager:**
   - Press `Win + R`
   - Type `inetmgr` and press Enter

2. **Create Application Pool:**
   - Right-click "Application Pools" → "Add Application Pool"
   - Name: `FileComparisonApp` (or your preferred name)
   - .NET CLR Version: `No Managed Code`
   - Managed Pipeline Mode: `Integrated`
   - Click OK

3. **Create Web Application:**
   - Expand your server in the tree
   - Right-click "Default Web Site" (or your site)
   - Select "Add Application"
   - Alias: `filecomparison` (or your preferred name)
   - Application Pool: Select `FileComparisonApp`
   - Physical Path: Browse to where you copied the `out` directory
     - Example: `C:\inetpub\wwwroot\filecomparison`
   - Click OK

4. **Copy Files:**
   - Copy the entire contents of the `out` directory to `C:\inetpub\wwwroot\filecomparison\`
   - Ensure `web.config` is in the root directory

5. **Set Permissions:**
   - Right-click the application folder → Properties → Security
   - Add `IIS_IUSRS` with Read & Execute permissions
   - Add `IUSR` with Read permissions

### Option B: Using PowerShell Script

Create and run this PowerShell script as Administrator:

```powershell
# Configuration
$appName = "FileComparisonApp"
$siteName = "Default Web Site"
$appPath = "filecomparison"
$physicalPath = "C:\inetpub\wwwroot\filecomparison"
$sourcePath = "C:\path\to\your\out\directory"

# Import IIS Module
Import-Module WebAdministration

# Create Application Pool
if (!(Test-Path "IIS:\AppPools\$appName")) {
    New-WebAppPool -Name $appName
    Set-ItemProperty "IIS:\AppPools\$appName" -Name managedRuntimeVersion -Value ""
}

# Create Physical Directory
if (!(Test-Path $physicalPath)) {
    New-Item -ItemType Directory -Path $physicalPath -Force
}

# Copy Files
Copy-Item -Path "$sourcePath\*" -Destination $physicalPath -Recurse -Force

# Create Web Application
if (!(Test-Path "IIS:\Sites\$siteName\$appPath")) {
    New-WebApplication -Name $appPath -Site $siteName -PhysicalPath $physicalPath -ApplicationPool $appName
}

# Set Permissions
$acl = Get-Acl $physicalPath
$accessRule1 = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$accessRule2 = New-Object System.Security.AccessControl.FileSystemAccessRule("IUSR", "Read", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule1)
$acl.SetAccessRule($accessRule2)
Set-Acl -Path $physicalPath -AclObject $acl

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Access your app at: http://localhost/$appPath" -ForegroundColor Cyan
```

---

## Step 4: Configure API Endpoint

### Update API Endpoint in Frontend:

If your backend API is on a different server, you'll need to configure CORS on the backend and set the API endpoint.

The frontend uses `localStorage` to store the API endpoint. You can:

1. **Set via Environment Switcher in the app**
2. **Pre-configure in the application**
3. **Set via browser console:**
   ```javascript
   localStorage.setItem('apiEndpoint', 'http://your-backend-server:8000');
   ```

---

## Step 5: Verify Deployment

1. **Open Browser:**
   - Navigate to `http://your-server/filecomparison` (or your configured path)

2. **Check Console:**
   - Press F12 to open browser console
   - Look for any errors
   - Verify all assets are loading

3. **Test Routing:**
   - Click through different pages
   - Verify that page refreshes work correctly
   - Check that browser back/forward buttons work

4. **Test API Connection:**
   - Go to Environment Switcher
   - Configure your backend API URL
   - Test the connection

---

## Step 6: SSL/HTTPS Configuration (Recommended)

### Add SSL Certificate:

1. **In IIS Manager:**
   - Select your site
   - Click "Bindings" in Actions panel
   - Click "Add"
   - Type: `https`
   - Port: `443`
   - SSL Certificate: Select or import your certificate
   - Click OK

2. **Force HTTPS Redirect:**
   - Add to `web.config` inside `<system.webServer>`:
   ```xml
   <rewrite>
     <rules>
       <rule name="HTTP to HTTPS redirect" stopProcessing="true">
         <match url="(.*)" />
         <conditions>
           <add input="{HTTPS}" pattern="off" ignoreCase="true" />
         </conditions>
         <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
       </rule>
     </rules>
   </rewrite>
   ```

---

## Troubleshooting

### Issue: 404 Errors on Page Refresh

**Solution:** Verify URL Rewrite Module is installed and `web.config` is present in the root directory.

### Issue: Static Files Not Loading

**Solution:** 
1. Check IIS permissions on the folder
2. Verify MIME types are configured in `web.config`
3. Check IIS logs in `C:\inetpub\logs\LogFiles`

### Issue: API Calls Failing

**Solution:**
1. Check CORS configuration on backend
2. Verify API endpoint is correctly configured
3. Check firewall rules between frontend and backend servers
4. Test API endpoint directly in browser

### Issue: Blank Page

**Solution:**
1. Open browser console (F12) and check for errors
2. Verify `index.html` is in the root directory
3. Check that `base` path in `vite.config.ts` matches your IIS application path
4. Ensure Application Pool is running

### Issue: JavaScript Errors

**Solution:**
1. Clear browser cache
2. Rebuild the application
3. Check browser compatibility (modern browsers required)

---

## Performance Optimization

### Enable Output Caching:

Add to `web.config`:

```xml
<system.webServer>
  <caching enabled="true" enableKernelCache="true">
    <profiles>
      <add extension=".js" policy="CacheUntilChange" kernelCachePolicy="CacheUntilChange" />
      <add extension=".css" policy="CacheUntilChange" kernelCachePolicy="CacheUntilChange" />
      <add extension=".jpg" policy="CacheUntilChange" kernelCachePolicy="CacheUntilChange" />
      <add extension=".png" policy="CacheUntilChange" kernelCachePolicy="CacheUntilChange" />
      <add extension=".svg" policy="CacheUntilChange" kernelCachePolicy="CacheUntilChange" />
    </profiles>
  </caching>
</system.webServer>
```

### Enable Compression:

Already configured in the provided `web.config`, but verify it's working:
- In IIS Manager → Compression
- Ensure both static and dynamic compression are enabled

---

## Updating the Application

### When you need to deploy updates:

1. **Build new version:**
   ```bash
   npm run build:iis
   ```

2. **Stop IIS Application Pool:**
   ```powershell
   Stop-WebAppPool -Name "FileComparisonApp"
   ```

3. **Copy new files:**
   - Delete old files from `C:\inetpub\wwwroot\filecomparison`
   - Copy new files from `out` directory
   - **Important:** Keep `web.config` or ensure the new one is copied

4. **Start IIS Application Pool:**
   ```powershell
   Start-WebAppPool -Name "FileComparisonApp"
   ```

5. **Clear browser cache or force refresh (Ctrl+F5)**

---

## Production Checklist

Before going live, ensure:

- [ ] SSL certificate is installed and HTTPS is enforced
- [ ] API endpoint is correctly configured
- [ ] Backend CORS is configured for the frontend domain
- [ ] IIS Application Pool is set to "No Managed Code"
- [ ] URL Rewrite Module is installed
- [ ] Permissions are correctly set (IIS_IUSRS, IUSR)
- [ ] Static compression is enabled
- [ ] Firewall rules allow HTTP/HTTPS traffic
- [ ] Error pages are configured
- [ ] Monitoring is set up (IIS logs, Application Insights, etc.)
- [ ] Backup strategy is in place
- [ ] Load testing has been performed

---

## Security Best Practices

1. **Remove unnecessary headers:**
   - Already configured in `web.config`

2. **Set security headers:**
   - X-Content-Type-Options: nosniff ✓
   - X-Frame-Options: SAMEORIGIN ✓
   - X-XSS-Protection: 1; mode=block ✓

3. **Disable directory browsing:**
   - In IIS Manager → Directory Browsing → Disable

4. **Request filtering:**
   - Configure file extension and size limits in IIS

5. **Keep IIS and Windows updated:**
   - Regularly apply security patches

---

## Monitoring and Logging

### IIS Logs Location:
```
C:\inetpub\logs\LogFiles\W3SVC[site-id]\
```

### View Application Logs:
```powershell
Get-EventLog -LogName Application -Source "IIS*" -Newest 50
```

### Monitor Performance:
- Open Performance Monitor (perfmon)
- Add counters:
  - Web Service → Current Connections
  - Process → % Processor Time
  - Memory → Available MBytes

---

## Support

For issues related to:
- **IIS Configuration:** Microsoft IIS documentation
- **URL Rewriting:** https://www.iis.net/learn/extensions/url-rewrite-module
- **Application Issues:** Check browser console and IIS logs

---

**Deployment Guide Version:** 1.0  
**Last Updated:** October 14, 2025  
**Compatible with:** IIS 8.5+, Windows Server 2016+
