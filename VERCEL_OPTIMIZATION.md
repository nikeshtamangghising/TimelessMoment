# Vercel Hobby Plan Optimization

## 🎯 Performance Solution for Limited Cron Jobs

This project has been optimized to work within **Vercel's Hobby plan limitations** while maintaining excellent performance through smart, event-driven updates.

## ⚡ What Changed

### Before (❌ Violated Hobby Limits)
- 4 separate cron jobs
- `update-scores` running **every hour** (24x/day) ❌
- Sitemap, cleanup, analytics each running daily
- Total: **27 cron executions/day**

### After (✅ Hobby Plan Compatible)
- **1 consolidated daily cron job** 
- Smart event-driven score updates
- Real-time performance maintained
- Total: **1 cron execution/day**

## 🧠 Smart Score Update System

### Event-Driven Updates
Instead of hourly batch updates, scores update intelligently based on user activity:

```typescript
// Automatically triggered when users:
// - View products
// - Add to cart  
// - Add to favorites
// - Make purchases

import { queueProductUpdate } from '@/lib/smart-score-updater';

// Queues product for batch update after activity
queueProductUpdate(productId);
```

### Intelligent Batching
- **Automatic batching**: Updates process in groups of 10 products
- **5-minute intervals**: Prevents excessive API calls
- **Debouncing**: Prevents update spam
- **Queue management**: Maximum 100 pending products

### Performance Benefits
- ⚡ **Real-time updates**: Scores update within minutes of activity
- 🎯 **Targeted updates**: Only active products get updated
- 💰 **Cost-effective**: No need to upgrade to Pro plan
- 🚀 **Better performance**: More responsive than hourly batches

## 📊 Admin Controls

### Manual Update API
```http
POST /api/admin/update-scores
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "action": "process-pending"    // Process queued updates
  "action": "force-full"         // Full update (use sparingly)  
  "action": "manual-update",     // Update specific products
  "productIds": [1, 2, 3]
}
```

### Status Monitoring
```http
GET /api/admin/update-scores
```

Returns:
```json
{
  "status": {
    "lastUpdate": "2024-01-15T10:30:00Z",
    "pendingProducts": 5,
    "updateInProgress": false,
    "timeSinceLastUpdate": 1800000
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Required for cron job security
CRON_SECRET=your-secure-cron-secret

# Optional: Admin API access
ADMIN_SECRET=your-admin-secret
```

### Smart Updater Settings
```typescript
// In src/lib/smart-score-updater.ts
const CONFIG = {
  BATCH_SIZE: 10,                    // Products per batch
  MIN_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes between batches
  FULL_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours for full update
  MAX_PENDING: 100,                  // Max queue size
};
```

## 🕐 Daily Maintenance Schedule

Single cron job runs at **2:00 AM UTC daily**:

1. **Product Scores** - Full update using smart updater
2. **Sitemap** - Regenerate with latest products/content
3. **Session Cleanup** - Remove expired sessions/tokens
4. **Email Analytics** - Process daily metrics
5. **Weekly Cleanup** - Remove old activity data (Sundays only)

## 📈 Performance Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Cron jobs/day | 27 | 1 | **96% reduction** |
| Update latency | Up to 1 hour | ~5 minutes | **92% faster** |
| Server load | High periodic spikes | Distributed | **Smoother** |
| Vercel cost | Requires Pro ($20/mo) | Hobby ($0) | **$240/year savings** |

## 🚀 Deployment Steps

1. **Update Environment Variables**
   ```bash
   CRON_SECRET=generate-secure-secret
   ```

2. **Deploy to Vercel**
   ```bash
   npm run build
   git add .
   git commit -m "Optimize for Vercel Hobby plan"
   git push origin main
   ```

3. **Verify Cron Job**
   - Check Vercel dashboard → Functions → Cron Jobs
   - Should show 1 job: `/api/cron/daily-maintenance`

4. **Test Admin Controls**
   ```bash
   # Get current status
   curl -H "Authorization: Bearer $ADMIN_SECRET" \
        https://your-app.vercel.app/api/admin/update-scores

   # Trigger manual update
   curl -X POST \
        -H "Authorization: Bearer $ADMIN_SECRET" \
        -H "Content-Type: application/json" \
        -d '{"action": "process-pending"}' \
        https://your-app.vercel.app/api/admin/update-scores
   ```

## 💡 Best Practices

### Development
- Use the admin API for testing updates locally
- Monitor the queue size during high-traffic periods
- Consider increasing `BATCH_SIZE` for very active sites

### Production
- Monitor Vercel function logs for any issues
- Set up alerts for failed daily maintenance
- Review queue status weekly via admin dashboard

### Scaling
If your site grows beyond this optimization:
- Consider upgrading to Vercel Pro for more cron flexibility
- Or migrate time-sensitive jobs to external cron services (GitHub Actions, etc.)

## 🔍 Troubleshooting

### Common Issues

**Queue filling up too fast?**
- Increase `MAX_PENDING` size
- Reduce `MIN_UPDATE_INTERVAL` for more frequent processing
- Consider upgrading to Pro for additional cron jobs

**Updates not processing?**
- Check admin status API for errors
- Verify `CRON_SECRET` environment variable
- Review Vercel function logs

**Performance regression?**
- Monitor database query performance
- Consider adding product score caching
- Check if recommendation engine needs optimization

---

This optimization maintains **excellent real-time performance** while staying within Vercel's Hobby plan limits, saving **$240/year** compared to upgrading to Pro just for cron jobs.