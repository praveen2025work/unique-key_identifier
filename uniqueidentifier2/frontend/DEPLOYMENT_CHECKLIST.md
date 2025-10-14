# IIS Deployment Checklist

## Pre-Deployment

### Development Environment
- [ ] All changes committed to Git
- [ ] Code reviewed and tested
- [ ] Linter passes with no errors (`npm run lint`)
- [ ] Build completes successfully (`npm run build:prod`)
- [ ] Test build locally (`npm run preview`)

### Configuration
- [ ] Update `.env.production` with correct API endpoint
- [ ] Update backend URL in production config
- [ ] Review and update version number in `package.json`
- [ ] Verify CORS settings on backend

## Windows Server Preparation

### IIS Installation
- [ ] IIS is installed and running
- [ ] **URL Rewrite Module** is installed (CRITICAL!)
  - Download: https://www.iis.net/downloads/microsoft/url-rewrite
- [ ] Application Pool created
- [ ] Application Pool set to "No Managed Code"

### Permissions
- [ ] Deployment folder created (e.g., `C:\inetpub\wwwroot\file-comparison-app`)
- [ ] IIS_IUSRS has Read & Execute permissions
- [ ] IUSR has Read & Execute permissions

### Firewall
- [ ] Port 80 (HTTP) open in Windows Firewall
- [ ] Port 443 (HTTPS) open if using SSL
- [ ] Backend API port accessible from frontend server

## Build Process

### Step 1: Build Application
```bash
cd uniqueidentifier2/frontend
npm install
npm run build:prod
```

### Step 2: Verify Build Output
- [ ] `dist` folder created
- [ ] `dist/index.html` exists
- [ ] `dist/web.config` exists (copied from public folder)
- [ ] `dist/assets/` folder contains JS and CSS files
- [ ] Build size is reasonable (check for large bundles)

## Deployment

### File Transfer
- [ ] Backup existing deployment (if updating)
- [ ] Copy entire `dist` folder contents to server
- [ ] Verify all files copied successfully
- [ ] Check file permissions on server

### IIS Configuration
- [ ] Website/Application created in IIS Manager
- [ ] Physical path points to deployment folder
- [ ] Port configured (80 or custom)
- [ ] Host name configured (if using domain)
- [ ] Application Pool assigned
- [ ] URL Rewrite rules visible in IIS Manager

### Testing - Initial
- [ ] Website starts without errors
- [ ] Access homepage: `http://server-ip/`
- [ ] Homepage loads correctly
- [ ] No JavaScript errors in browser console (F12)
- [ ] CSS styles loading correctly

### Testing - Routing
- [ ] Navigate to different pages in the app
- [ ] Refresh page on a route (should not 404)
- [ ] Browser back/forward buttons work
- [ ] Direct URL access works (e.g., `http://server-ip/workflow`)

### Testing - API Integration
- [ ] Backend API is running
- [ ] API endpoint URL is correct in frontend
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors in console
- [ ] Data loads from backend

### Testing - Functionality
- [ ] File upload works
- [ ] Analysis runs successfully
- [ ] Results display correctly
- [ ] Downloads work (CSV, Excel)
- [ ] All dropdowns function properly
- [ ] Search/filter features work
- [ ] Navigation works
- [ ] Workflow monitoring displays correctly

## Post-Deployment

### Monitoring
- [ ] Check IIS logs: `C:\inetpub\logs\LogFiles\`
- [ ] Check Windows Event Viewer for errors
- [ ] Monitor application performance
- [ ] Set up health check monitoring

### Documentation
- [ ] Update deployment date
- [ ] Document any issues encountered
- [ ] Update server documentation
- [ ] Notify team of deployment

### Optimization (Optional)
- [ ] Enable HTTPS/SSL
- [ ] Configure HTTP/2
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Enable Gzip compression

## Rollback Plan

### If Issues Occur
- [ ] Stop IIS site
- [ ] Restore from backup folder
- [ ] Restart IIS site
- [ ] Verify old version working
- [ ] Investigate issues
- [ ] Fix and redeploy

### Rollback Commands (PowerShell)
```powershell
Stop-Website -Name "FileComparisonApp"
Remove-Item "C:\inetpub\wwwroot\file-comparison-app\*" -Recurse -Force
Copy-Item "C:\inetpub\backups\[backup-folder]\*" "C:\inetpub\wwwroot\file-comparison-app" -Recurse
Start-Website -Name "FileComparisonApp"
```

## Common Issues & Solutions

### Issue: 404 on Page Refresh
- **Check**: URL Rewrite Module installed?
- **Check**: web.config in deployment root?
- **Check**: Rewrite rules showing in IIS Manager?

### Issue: Blank Page
- **Check**: Browser console for errors (F12)
- **Check**: All asset files copied?
- **Check**: MIME types configured?

### Issue: API Calls Failing
- **Check**: API endpoint URL correct?
- **Check**: Backend running?
- **Check**: CORS enabled on backend?
- **Check**: Firewall not blocking?

### Issue: Slow Loading
- **Check**: Compression enabled?
- **Check**: Caching configured?
- **Check**: Asset sizes reasonable?

## Sign-Off

### Deployment Team
- [ ] Deployed by: ________________
- [ ] Date/Time: ________________
- [ ] Version: ________________

### Testing Team
- [ ] Tested by: ________________
- [ ] Date/Time: ________________
- [ ] Status: ☐ Pass  ☐ Fail

### Approval
- [ ] Approved by: ________________
- [ ] Date/Time: ________________
- [ ] Notes: ________________

---

**Remember:**
- Always backup before deploying
- Test thoroughly before going live
- Have a rollback plan ready
- Monitor for the first 24 hours after deployment

