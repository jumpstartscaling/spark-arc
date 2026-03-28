# Ion Arc Online Deployment Guide

## Overview

This is a **Docker-based hybrid deployment** that combines:
- **Static nginx server** (port 80) for serving Astro-generated HTML/CSS/JS
- **Node.js admin API** (port 3000) for PSEO rebuilds and JSON data management

The deployment uses **Coolify** with the Dockerfile for container orchestration.

## Architecture

```
┌─────────────────────────────────────┐
│           Coolify                   │
│  ┌─────────────────────────────────┐│
│  │        Docker Container         ││
│  │  ┌─────────────┐ ┌─────────────┐││
│  │  │   nginx     │ │  Node.js    │││
│  │  │   (port 80) │ │  (port 3000)│││
│  │  └─────────────┘ └─────────────┘││
│  │  Static files    Admin API       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Coolify Configuration

### Container Settings
- **Type**: Docker
- **Port**: Expose port 80 (nginx serves the primary domain)
- **Runtime**: Node 20 (handled by Dockerfile base image)
- **Build Method**: Use the repository Dockerfile

### Environment Variables (Build Time)
**Critical**: `PUBLIC_*` variables must be set at **build time**, not just runtime, because this is a static site.

```bash
# Required build-time variables
PUBLIC_SITE_URL=https://ion-arc.online
PUBLIC_N8N_WEBHOOK_URL=https://n8n.jumpstartscaling.com/webhook/...
PUBLIC_N8N_WEBHOOK_TEST_URL=https://n8n.jumpstartscaling.com/webhook-test/...

# Optional build-time variables
PUBLIC_GA_ID=G-XXXXXXXXXX
PUBLIC_CLARITY_ID=xxxxxxxxxx
PUBLIC_META_PIXEL_ID=000000000000000
```

### Environment Variables (Runtime)
```bash
# Required runtime variables
ADMIN_TOKEN=0000000000000000000000000000000000000000000000000000000000000000

# Optional runtime variables  
RENDER_PSEO=false
NODE_OPTIONS=--max-old-space-size=8192
```

## Required Volume Mounts

### 1. PSEO Data Persistence
```bash
/app/src/data/pseo
```
**Purpose**: Persists JSON data files updated via admin API  
**Consequences if missing**: JSON updates will be lost on container restart

### 2. Static Build Persistence  
```bash
/app/dist
```
**Purpose**: Persists built static files across container restarts and PSEO rebuilds  
**Consequences if missing**: Site will revert to initial build on restart

### Coolify Volume Configuration
In Coolify, configure these as **Persistent Volumes**:
- Type: Bind Mount or Volume
- Host Path: `/path/to/host/pseo-data` → Container Path: `/app/src/data/pseo`
- Type: Bind Mount or Volume  
- Host Path: `/path/to/host/dist` → Container Path: `/app/dist`

## Deployment Process

### Initial Deployment
1. **Configure Environment Variables** in Coolify
2. **Set Up Volume Mounts** for data persistence
3. **Trigger Initial Build** (core build without PSEO)
4. **Verify Core Site** is working
5. **Trigger PSEO Rebuild** via admin API for full content

### Subsequent Deployments
1. **Update Code** (if needed)
2. **Trigger Build** in Coolify (fast core build)
3. **PSEO Content** remains from previous build (persisted in volumes)
4. **Optional**: Trigger PSEO rebuild if content schema changed

## Admin API Usage

### Authentication
All admin endpoints require `Authorization: Bearer <ADMIN_TOKEN>` header.

### Endpoints

#### Rebuild PSEO Pages
```bash
curl -X POST https://ion-arc.online/api/admin/rebuild \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
- **Response**: 202 Accepted (immediate)
- **Process**: Background rebuild with hot-swap
- **Use**: Generate all 72+ PSEO pages

#### Update JSON Data
```bash
curl -X POST https://ion-arc.online/api/admin/update-json \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "locations.json", 
    "content": {...}
  }'
```
- **Response**: 200 OK
- **Process**: Write to `/app/src/data/pseo/`
- **Use**: Update location data, campaign configs, etc.

## Build Modes

### Core Build (Default)
- **Environment**: `RENDER_PSEO=false` or unset
- **Duration**: ~30 seconds
- **Output**: 3 core pages only
  - `index.html`
  - `insights/index.html` 
  - `thank-you/index.html`
- **Use**: Initial deployment, code updates

### Full PSEO Build
- **Environment**: `RENDER_PSEO=true`
- **Duration**: 5-10 minutes
- **Output**: All 72+ PSEO pages
  - Core pages + `/insights/*/roofing/` pages
- **Use**: Content updates, scheduled rebuilds

## Troubleshooting

### Common Issues

#### Build Fails with Missing Env Vars
**Symptom**: Build error about missing `PUBLIC_SITE_URL`  
**Fix**: Ensure `PUBLIC_*` variables are set in Coolify build environment

#### PSEO Pages Not Loading
**Symptom**: 404 errors on `/insights/*/roofing/` URLs  
**Fix**: Trigger admin API rebuild with `RENDER_PSEO=true`

#### JSON Updates Lost After Restart
**Symptom**: Data changes disappear after container restart  
**Fix**: Ensure `/app/src/data/pseo` volume mount is configured

#### Site Reverts to Initial Build
**Symptom**: PSEO pages disappear after restart  
**Fix**: Ensure `/app/dist` volume mount is configured

### Monitoring

#### Check Build Status in Coolify
- View build logs for compilation errors
- Monitor build duration (core vs PSEO)

#### Check Container Status
```bash
# Check nginx is serving
curl -I https://ion-arc.online/

# Check admin API is responding  
curl https://ion-arc.online/api/admin/rebuild \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Log Locations
- **Nginx logs**: Container logs (via Coolify)
- **Node.js logs**: Container logs (API requests, rebuilds)
- **Build logs**: Coolify build interface

## Security Considerations

### Admin Token Security
- Generate with `openssl rand -hex 32`
- Store as Coolify Secret
- Rotate periodically
- Never commit to repository

### Network Security
- Only port 80 exposed to internet
- Admin API only accessible via nginx proxy
- CORS headers configured for API endpoints

### File System Security
- JSON updates restricted to `/app/src/data/pseo/`
- File path validation prevents directory traversal
- Only `.json` files allowed

## Performance Optimization

### Static Caching
- CSS/JS: 1 year cache (immutable)
- HTML: 1 hour cache (freshness)
- Images: 1 year cache

### Build Performance
- Core builds: ~30 seconds
- PSEO builds: 5-10 minutes
- Hot-swap rebuilds: No downtime

### Memory Management
- Node.js memory limit: 8GB (configurable)
- Build-time memory optimization for large PSEO generation

## Backup Strategy

### Critical Data to Backup
1. **PSEO JSON Files**: `/app/src/data/pseo/`
2. **Built Static Files**: `/app/dist/`
3. **Environment Variables**: Coolify secrets

### Backup Frequency
- **JSON Files**: Daily (content changes)
- **Static Files**: Weekly (or after major rebuilds)
- **Environment**: As needed (when changed)

## Rollback Procedure

1. **Stop Container** in Coolify
2. **Restore `/app/dist`** from backup
3. **Restore `/app/src/data/pseo`** from backup  
4. **Restart Container**
5. **Verify Site Functionality**

## Support

For deployment issues:
1. Check Coolify logs
2. Verify environment variables
3. Confirm volume mounts
4. Test admin API endpoints
5. Review this documentation

---

# Verification Checklist

## Build Verification Tests

### Core Build Test (RENDER_PSEO=false)
```bash
# Run core build
RENDER_PSEO=false npm run build
```

**Expected Results:**
- ✅ Build completes in under 30 seconds
- ✅ Console shows: `🚫 PSEO build gating: RENDER_PSEO is not "true"`
- ✅ `dist/` contains only:
  - `index.html`
  - `insights/index.html`
  - `thank-you/index.html`
- ❌ No `dist/insights/*/roofing/` directories exist

### Full PSEO Build Test (RENDER_PSEO=true)
```bash
# Run full PSEO build
RENDER_PSEO=true npm run build
```

**Expected Results:**
- ✅ Build completes successfully (5-10 minutes)
- ✅ Console shows: `✅ PSEO build gating: RENDER_PSEO is "true"`
- ✅ All 72+ PSEO pages generated in `dist/insights/*/roofing/`
- ✅ Sample PSEO page exists: `dist/insights/austin-tx/roofing/emergency-repair.html`

## Manual Page Verification Checklist

### Core Functionality
- [ ] **Homepage loads**: `https://ion-arc.online/`
- [ ] **Insights listing loads**: `https://ion-arc.online/insights`
- [ ] **Thank-you page loads**: `https://ion-arc.online/thank-you`

### Dynamic Query Parameters
- [ ] **Thank-you with params**: `https://ion-arc.online/thank-you?city=Tampa&neighborhood=Downtown`
  - [ ] City text updates to "Tampa"
  - [ ] Neighborhood text updates to "Downtown"
  - [ ] Page title updates to "Thank you | Tampa"

### PSEO Pages (after rebuild)
- [ ] **Sample PSEO page loads**: `https://ion-arc.online/insights/austin-tx/roofing`
- [ ] **PSEO subpages load**: `https://ion-arc.online/insights/austin-tx/roofing/emergency-repair`
- [ ] **Multiple locations work**: Test different city/state combinations

### JavaScript Functionality
- [ ] **No console errors**: Browser console is clean
- [ ] **Form submission works**: Test lead form submission to n8n webhook
- [ ] **Client-side scripts load**: All interactive elements work

### SEO & Meta Tags
- [ ] **Canonical URLs**: Check `<link rel="canonical">` tags
- [ ] **Open Graph tags**: Verify social sharing metadata
- [ ] **Sitemap accessible**: `https://ion-arc.online/sitemap.xml`

## Admin API Verification

### Authentication Test
```bash
# Test without token (should fail)
curl -X POST https://ion-arc.online/api/admin/rebuild
# Expected: 401 Unauthorized

# Test with invalid token (should fail)  
curl -X POST https://ion-arc.online/api/admin/rebuild \
  -H "Authorization: Bearer invalid-token"
# Expected: 403 Forbidden
```

### Rebuild Endpoint Test
```bash
# Trigger rebuild (should succeed)
curl -X POST https://ion-arc.online/api/admin/rebuild \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 202 Accepted
# Response: {"message":"Rebuild started","status":"processing"}
```

**Verification Steps:**
1. [ ] **Immediate 202 response**: No waiting for build completion
2. [ ] **Background build starts**: Check Coolify logs for build process
3. [ ] **Hot-swap completes**: PSEO pages appear after build
4. [ ] **No downtime**: Site remains accessible during rebuild

### JSON Update Endpoint Test
```bash
# Test JSON update
curl -X POST https://ion-arc.online/api/admin/update-json \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.json",
    "content": {"test": "data", "timestamp": "2024-01-01"}
  }'
# Expected: 200 OK
# Response: {"message":"File updated successfully","filename":"test.json"}
```

**Verification Steps:**
1. [ ] **File created**: Check `/app/src/data/pseo/test.json` exists
2. [ ] **Content correct**: Verify JSON content matches request
3. [ ] **Path validation**: Test with invalid paths (should fail)
4. [ ] **File type validation**: Test with non-JSON files (should fail)

## Performance Verification

### Core Build Performance
- [ ] **Build time**: Under 30 seconds
- [ ] **Memory usage**: Within allocated limits
- [ ] **No memory leaks**: Build completes cleanly

### PSEO Build Performance  
- [ ] **Build time**: 5-10 minutes for full rebuild
- [ ] **Memory usage**: Doesn't exceed 8GB limit
- [ ] **Hot-swap speed**: New files appear quickly

### Runtime Performance
- [ ] **Page load speed**: Core pages load in <2 seconds
- [ ] **Static asset caching**: CSS/JS cached properly
- [ ] **nginx performance**: No 502/503 errors

## Security Verification

### Authentication Security
- [ ] **Token required**: All admin endpoints require valid token
- [ ] **Invalid tokens rejected**: 403 for wrong tokens
- [ ] **No token rejected**: 401 for missing tokens

### File System Security
- [ ] **Path traversal prevented**: Cannot write outside `/app/src/data/pseo/`
- [ ] **File type validation**: Only `.json` files allowed
- [ ] **Permission checks**: Cannot overwrite system files

### Network Security
- [ ] **Port exposure**: Only port 80 exposed externally
- [ ] **API access**: Admin API only via nginx proxy
- [ ] **CORS headers**: Proper CORS configuration

## Monitoring & Logging Verification

### Build Logs
- [ ] **Build gating logs**: PSEO enable/disable messages visible
- [ ] **Error logging**: Build failures properly logged
- [ ] **Progress indicators**: Build progress shown in logs

### Runtime Logs
- [ ] **API request logging**: Admin API calls logged
- [ ] **Error tracking**: Runtime errors captured
- [ ] **Performance metrics**: Response times logged

### Coolify Integration
- [ ] **Build status**: Coolify shows correct build status
- [ ] **Container health**: Container reports healthy status
- [ ] **Resource usage**: Memory/CPU usage within limits

## Rollback Verification

### Backup Restoration Test
1. [ ] **Create backup**: Backup current `/app/dist` and `/app/src/data/pseo`
2. [ ] **Make changes**: Update JSON files via API
3. [ ] **Stop container**: Stop in Coolify
4. [ ] **Restore backups**: Replace with backup files
5. [ ] **Start container**: Restart in Coolify
6. [ ] **Verify restoration**: Site returns to previous state

## Troubleshooting Verification

### Common Issues Test
- [ ] **Missing env vars**: Build fails appropriately with clear error
- [ ] **Missing volumes**: Container starts but data persistence fails
- [ ] **Invalid tokens**: API properly rejects unauthorized requests
- [ ] **Corrupted JSON**: API handles malformed JSON gracefully

### Performance Issues Test
- [ ] **Memory pressure**: System handles high memory usage
- [ ] **Concurrent requests**: API handles multiple simultaneous requests
- [ ] **Large JSON files**: System handles large data updates

## Documentation Verification

### Documentation Completeness
- [ ] **Environment variables**: All required vars documented
- [ ] **Volume mounts**: Required mounts clearly explained
- [ ] **API endpoints**: Complete API documentation
- [ ] **Troubleshooting**: Common issues and solutions documented

### Procedure Accuracy
- [ ] **Build commands**: Commands work as documented
- [ ] **API examples**: curl commands work exactly as shown
- [ ] **Coolify steps**: Coolify configuration steps are accurate
- [ ] **Verification steps**: All verification tests work

---

**Final Verification Checklist:**
- [ ] All core build tests pass
- [ ] All PSEO build tests pass  
- [ ] All manual page verification complete
- [ ] All admin API endpoints working
- [ ] Performance benchmarks met
- [ ] Security measures verified
- [ ] Monitoring and logging functional
- [ ] Documentation accurate and complete
- [ ] Rollback procedures tested
- [ ] Troubleshooting procedures verified

**Deployment Ready**: ✅ Only proceed to production deployment after all verification items are complete and tested.
