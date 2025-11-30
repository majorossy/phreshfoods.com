# phind.us Operations Guide

Quick reference for common development operations. Use these plans as standardized procedures.

---

## 🔄 REFRESH PLAN

**Purpose:** Update location data from Google Sheets when content changes.

### Quick Refresh (Single Type)
```bash
# Choose the type you updated:
npm run process-data:farms        # Farm stands only
npm run process-data:cheese       # Cheese shops only
npm run process-data:fish         # Fish mongers only
npm run process-data:butchers     # Butchers only
npm run process-data:antiques     # Antique shops only
npm run process-data:breweries    # Breweries only
npm run process-data:wineries     # Wineries only
npm run process-data:sugar-shacks # Sugar shacks only
```

### Full Refresh (All Types)
```bash
npm run process-data
```

### Refresh Symbols Guide
| Symbol | Meaning | API Calls |
|--------|---------|-----------|
| ✓ | No changes | 0 |
| 📦 | Product changes only | 0 |
| ⚠ | Location changes | 2-3 per location |
| ⭐ | New location | 2-3 per location |

### When to Refresh
- ✅ After updating Google Sheets data
- ✅ After adding new locations
- ✅ After changing addresses/contact info
- ❌ NOT needed for code-only changes

### Post-Refresh
If dev server is running, restart it to pick up new data:
```bash
# If using dev:full, restart it
# If using separate processes, restart backend only
```

---

## 🚀 STANDUP PLAN

**Purpose:** Start development environment using existing data files.

### Prerequisites
Data files must exist in `backend/data/`. If missing, run **REFRESH PLAN** first.

### Quick Start
```bash
npm run dev:full
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Separate Processes (If Needed)
```bash
# Terminal 1 - Backend
npm run start:backend

# Terminal 2 - Frontend
npm run dev
```

### Verify Running
1. Open http://localhost:5173
2. Map should load with markers
3. Click a shop card to test overlay

---

## 🛑 SHUTDOWN PLAN

**Purpose:** Cleanly stop all services and optionally prepare for commit.

### Quick Shutdown
```bash
# If running dev:full, just Ctrl+C in that terminal

# Or kill all node processes for this project
pkill -f "node.*phindus"
```

### Find and Kill Specific Processes
```bash
# Find what's running on our ports
lsof -i :3000    # Backend
lsof -i :5173    # Frontend (Vite)

# Kill by PID
kill <PID>
```

### Pre-Commit Checks (Optional)
Before committing, run quality checks:
```bash
npm run check:all    # typecheck + lint + tests
```

### Clean Shutdown with Cache Clear
```bash
# Stop processes
pkill -f "node.*phindus"

# Clear build caches (if having issues)
npm run clean:cache
```

---

## 🧹 CLEAN PLAN

**Purpose:** Reset environment when things get weird.

### Light Clean (Caches Only)
```bash
npm run clean:cache
```

### Full Clean (Nuclear Option)
```bash
npm run clean              # Removes node_modules, dist, data
npm install                # Reinstall dependencies
npm run process-data       # Regenerate data files
```

---

## 🔍 DEBUG PLAN

**Purpose:** Troubleshoot common issues.

### Data Issues
```bash
# Check if data files exist and have content
wc -l backend/data/*.json

# View sample of data
head -c 1000 backend/data/farmStandsData.json | jq '.[0]'

# Force regenerate all data
rm backend/data/*.json
npm run process-data
```

### API Issues
```bash
# Test backend directly
curl http://localhost:3000/api/locations | jq 'length'

# Check backend logs
npm run start:backend  # Watch for errors

# Debug mode with extra output
npm run dev:debug
```

### Build Issues
```bash
# Check for TypeScript errors
npm run typecheck

# Check for lint errors
npm run lint

# Analyze bundle size
npm run analyze
```

### Port Conflicts
```bash
# Check what's using our ports
lsof -i :3000
lsof -i :5173

# Kill processes on those ports
lsof -ti :3000 | xargs kill -9
lsof -ti :5173 | xargs kill -9
```

---

## 📋 QUICK REFERENCE

| Operation | Command |
|-----------|---------|
| Start dev | `npm run dev:full` |
| Refresh all data | `npm run process-data` |
| Refresh farms only | `npm run process-data:farms` |
| Refresh cheese only | `npm run process-data:cheese` |
| Refresh breweries | `npm run process-data:breweries` |
| Type check | `npm run typecheck` |
| Full quality check | `npm run check:all` |
| Build frontend | `npm run build:frontend` |
| Kill all | `pkill -f "node.*phindus"` |

---

## 🎯 Common Scenarios

### "I just cloned the repo"
```bash
npm install
npm run process-data
npm run dev:full
```

### "I updated the Google Sheet"
```bash
npm run process-data:farms  # or whichever type
# Restart dev server if running
```

### "Something's broken, start fresh"
```bash
npm run clean
npm install
npm run process-data
npm run dev:full
```

### "I want to commit my changes"
```bash
npm run check:all
git add .
git commit -m "your message"
```
