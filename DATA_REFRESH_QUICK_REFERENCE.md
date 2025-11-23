# Data Refresh - Quick Reference Card

## Commands

### Refresh All Types
```bash
npm run process-data
```

### Refresh Specific Type

| Command | Updates |
|---------|---------|
| `npm run process-data:farms` | Farm stands only |
| `npm run process-data:cheese` | Cheese shops only |
| `npm run process-data:fish` | Fish mongers only |
| `npm run process-data:butchers` | Butchers only |
| `npm run process-data:antiques` | Antique shops only |

### Alternative Syntax
```bash
npm run process-data -- --type=farms
npm run process-data -- --type=cheese
# etc.
```

## Output Symbols

| Symbol | Meaning | API Calls |
|--------|---------|-----------|
| ✓ | No changes detected | 0 (saved) |
| 📦 | Product changes only | 0 (saved) |
| ⚠ | Location info changed | 2-3 |
| ⭐ | New location | 2-3 |

## What Triggers API Calls?

### FREE (0 API calls):
- ✅ Product availability changes (beef, pork, eggs, etc.)
- ✅ No changes at all
- ✅ Social media updates

### COSTS API CALLS (2-3 each):
- 💰 Name changes
- 💰 Address changes
- 💰 Phone changes
- 💰 Website changes
- 💰 New locations

## Cost Estimates

| Scenario | API Calls | Cost |
|----------|-----------|------|
| Update 10 product availabilities | 0 | $0 |
| Add 5 new locations | 10-15 | $0.10-0.15 |
| Change 3 addresses | 6-9 | $0.06-0.09 |
| Full refresh (no changes) | 0 | $0 |
| Full refresh (all new, 119 locations) | 240-360 | $2.40-3.60 |

## Typical Monthly Cost (Manual Refresh)

**Expected: $0.50-$2.00/month**
- 2-4 manual runs per month
- ~5-10 locations changed per run
- Product updates are free

**Compare to old hourly refresh: $26-30/month**

## After Running

1. Check the summary:
   ```
   ✅ Successfully processed 19 farm_stand locations
   💰 API Calls Made: 6
   💚 API Calls Skipped (cached): 32
   📊 Cost Savings: 84%
   ```

2. Restart your server (if running):
   ```bash
   # Kill the running server (Ctrl+C) and restart:
   npm run start:backend
   ```

3. Verify on website that changes appear

## Pro Tips

- **Only updated farms?** Use `npm run process-data:farms` (faster)
- **Testing changes?** Run the command, it won't cost anything if nothing changed
- **Want to force full refresh?** Delete JSON files in `backend/data/` first
- **Production deployment?** Run `npm run process-data` after deploying

## Troubleshooting

**Data not showing?**
- Did you restart the server?
- Check JSON files exist in `backend/data/`

**Too many API calls?**
- Verify what actually changed in Google Sheets
- Check for accidental whitespace/formatting changes

**API errors?**
- Check API key is configured: `GOOGLE_API_KEY_BACKEND` in `.env`
- Verify key restrictions in Google Cloud Console
