# CACHE.md


# Redis Caching Guide - Xenia Backend

This document explains how to use Redis caching in the Xenia backend to improve performance and reduce database load.

## 📋 Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Cache Configuration](#cache-configuration)
- [Cache Invalidation](#cache-invalidation)
- [API Endpoints](#api-endpoints)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What is Caching?

Caching stores frequently accessed data in Redis (in-memory database) to avoid repeated database queries, resulting in:

- ⚡ **Faster response times** (milliseconds vs seconds)
- 🔋 **Reduced database load** (fewer MongoDB queries)
- 💰 **Cost savings** (lower database usage)
- 📈 **Better scalability** (handle more requests)

### Technology Stack

- **Redis Provider**: Upstash (serverless-friendly for Vercel)
- **Redis Client**: ioredis
- **Cache Strategy**: Cache-aside (lazy loading)

---

## How It Works

### Cache Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Check Redis     │◄── Cache Key: xenia:/api/users:{}
└────┬───────┬────┘
     │       │
  HIT│       │MISS
     │       │
     ▼       ▼
┌─────────┐ ┌──────────────┐
│ Return  │ │ Query        │
│ Cached  │ │ Database     │
│ Data    │ └──────┬───────┘
└─────────┘        │
                   ▼
              ┌──────────────┐
              │ Save to      │
              │ Redis        │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Return Data  │
              └──────────────┘
```

### Cache Key Format

```
{prefix}:{path}:{queryString}
```

**Examples:**
```
xenia:/api/users:{}
xenia:/api/users/123:{}
xenia:/api/users:{"role":"admin"}
```

---

## Quick Start

### 1. Apply Caching to a Route

```typescript
import { cache } from '../middleware/cache';

// Cache for 5 minutes (default)
router.get('/users', cache(), getUsersHandler);

// Cache for 10 minutes
router.get('/users/:id', cache({ EX: 600 }), getUserHandler);

// Cache for 30 minutes
router.get('/products', cache({ EX: 1800 }), getProductsHandler);
```

### 2. Clear Cache When Data Changes

```typescript
import { clearCache } from '../middleware/cache';

export const createUserHandler = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    
    // Clear related cache
    await clearCache('xenia:/api/users:*');
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
```

---

## Usage Examples

### Example 1: Cache All Users Endpoint

```typescript
// src/routes/userRoutes.ts
import { Router } from 'express';
import { cache } from '../middleware/cache';
import { getUsersHandler } from '../controllers/userController';

const router = Router();

// Cache for 5 minutes
router.get('/', cache({ EX: 300 }), getUsersHandler);

export default router;
```

### Example 2: Cache with Custom Prefix

```typescript
// Cache product data separately from user data
router.get('/products', 
  cache({ EX: 1800, prefix: 'products' }), 
  getProductsHandler
);
```

### Example 3: Apply Caching to All Routes in a Module

```typescript
// src/routes/api.routes.ts
import { Router } from 'express';
import { cache } from '../middleware/cache';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';

const router = Router();

// Cache all user routes for 10 minutes
router.use('/users', cache({ EX: 600 }), userRoutes);

// Cache all product routes for 30 minutes
router.use('/products', cache({ EX: 1800 }), productRoutes);

export default router;
```

### Example 4: Conditional Caching

```typescript
// Don't cache if user is admin
const conditionalCache = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next(); // Skip cache for admins
  }
  return cache({ EX: 300 })(req, res, next);
};

router.get('/users', conditionalCache, getUsersHandler);
```

---

## Cache Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `EX` | number | `300` | Cache expiry time in seconds |
| `prefix` | string | `'xenia'` | Cache key prefix |

### Recommended Cache Times

| Data Type | Cache Time | Reason |
|-----------|------------|--------|
| **Static data** | 1 hour (3600s) | Rarely changes |
| **User profiles** | 10 minutes (600s) | Occasional updates |
| **Lists/Collections** | 5 minutes (300s) | Frequently updated |
| **Search results** | 2 minutes (120s) | Very dynamic |
| **Real-time data** | No cache | Changes constantly |

### Example Configuration

```typescript
// Static content (rarely changes)
router.get('/categories', cache({ EX: 3600 }), getCategoriesHandler);

// User data (moderate updates)
router.get('/users/:id', cache({ EX: 600 }), getUserHandler);

// Lists (frequent updates)
router.get('/users', cache({ EX: 300 }), getUsersHandler);

// Search (very dynamic)
router.get('/search', cache({ EX: 120 }), searchHandler);

// Real-time (don't cache)
router.get('/live-stats', getStatsHandler); // No cache
```

---

## Cache Invalidation

### Manual Cache Clearing

```typescript
import { clearCache } from '../middleware/cache';

// Clear all users cache
await clearCache('xenia:/api/users:*');

// Clear specific user cache
await clearCache('xenia:/api/users/123:*');

// Clear all cache
await clearCache('xenia:*');

// Clear by custom prefix
await clearCache('products:*');
```

### Automatic Cache Invalidation

```typescript
// src/controllers/userController.ts
import { clearCache } from '../middleware/cache';

// Clear cache after CREATE
export const createUserHandler = async (req, res, next) => {
  const user = await userService.createUser(req.body);
  await clearCache('xenia:/api/users:*'); // Clear list cache
  res.status(201).json({ success: true, data: user });
};

// Clear cache after UPDATE
export const updateUserHandler = async (req, res, next) => {
  const user = await userService.updateUser(req.params.id, req.body);
  await clearCache(`xenia:/api/users/${req.params.id}:*`); // Clear specific user
  await clearCache('xenia:/api/users:*'); // Clear list cache
  res.json({ success: true, data: user });
};

// Clear cache after DELETE
export const deleteUserHandler = async (req, res, next) => {
  await userService.deleteUser(req.params.id);
  await clearCache('xenia:/api/users:*'); // Clear all users cache
  res.json({ success: true, message: 'User deleted' });
};
```

---

## API Endpoints

### Clear All Cache

```bash
DELETE /api/cache/clear-all
Headers: x-secret-key: your-secret-key
```

**Response:**
```json
{
  "success": true,
  "message": "Cleared 15 cache entries"
}
```

### Clear Specific Cache Pattern

```bash
DELETE /api/cache/clear/api/users
Headers: x-secret-key: your-secret-key
```

**Response:**
```json
{
  "success": true,
  "message": "Cleared 5 cache entries for pattern: xenia:api/users:*"
}
```

### Testing Cache

```bash
# First request (Cache MISS - slow)
curl -X GET https://xenia-26-server.vercel.app/api/users \
  -H "x-secret-key: your-key"

# Response includes: "cached": false

# Second request (Cache HIT - fast)
curl -X GET https://xenia-26-server.vercel.app/api/users \
  -H "x-secret-key: your-key"

# Response includes: "cached": true, "cacheKey": "xenia:/api/users:{}"
```

---

## Best Practices

### ✅ DO

1. **Cache GET requests only** - POST/PUT/DELETE should not be cached
   ```typescript
   ✅ router.get('/users', cache(), getUsersHandler);
   ❌ router.post('/users', cache(), createUserHandler); // Wrong!
   ```

2. **Set appropriate expiry times** - Balance freshness vs performance
   ```typescript
   ✅ router.get('/static-data', cache({ EX: 3600 })); // 1 hour for static
   ✅ router.get('/dynamic-data', cache({ EX: 120 })); // 2 min for dynamic
   ```

3. **Clear cache when data changes**
   ```typescript
   ✅ await clearCache('xenia:/api/users:*'); // After update
   ```

4. **Use specific cache keys** - Clear only what's needed
   ```typescript
   ✅ await clearCache(`xenia:/api/users/${userId}:*`); // Specific user
   ❌ await clearCache('xenia:*'); // Clears everything!
   ```

5. **Monitor cache performance** - Check logs for HIT/MISS ratio
   ```
   2026-01-02 12:00:00 info: ✅ Cache HIT for: xenia:/api/users:{}
   2026-01-02 12:00:05 info: ❌ Cache MISS for: xenia:/api/users/123:{}
   ```

### ❌ DON'T

1. **Don't cache personalized data** - Each user has different data
   ```typescript
   ❌ router.get('/my-profile', cache(), getMyProfileHandler);
   ✅ router.get('/my-profile', getMyProfileHandler); // No cache
   ```

2. **Don't cache sensitive data** - Security risk
   ```typescript
   ❌ router.get('/payments', cache(), getPaymentsHandler);
   ```

3. **Don't use very long cache times for dynamic data**
   ```typescript
   ❌ router.get('/live-feed', cache({ EX: 3600 })); // Too long!
   ✅ router.get('/live-feed', cache({ EX: 60 })); // 1 minute max
   ```

4. **Don't forget to clear cache on updates**
   ```typescript
   ❌ // Update user but forget to clear cache
   const user = await updateUser(id, data);
   res.json(user); // Old data still cached!
   
   ✅ // Correct way
   const user = await updateUser(id, data);
   await clearCache(`xenia:/api/users/${id}:*`);
   res.json(user);
   ```

---

## Troubleshooting

### Issue: Cache Not Working

**Symptoms:** All requests show "Cache MISS"

**Solutions:**
1. Check Redis connection:
   ```bash
   # Check Vercel environment variables
   REDIS_URL is set correctly
   ```

2. Check logs:
   ```
   ❌ Redis error: connect ECONNREFUSED
   ```

3. Verify middleware is applied:
   ```typescript
   // Make sure cache() is in the route
   router.get('/users', cache(), getUsersHandler);
   ```

### Issue: Stale Data Returned

**Symptoms:** Old data returned after update

**Solutions:**
1. Clear cache after mutations:
   ```typescript
   await clearCache('xenia:/api/users:*');
   ```

2. Reduce cache expiry time:
   ```typescript
   cache({ EX: 60 }) // 1 minute instead of 5
   ```

### Issue: Redis Connection Timeout

**Symptoms:** "Redis connection timeout" errors

**Solutions:**
1. Check Upstash Redis is running
2. Verify `REDIS_URL` environment variable
3. Check Upstash dashboard for quota limits

### Issue: Cache Growing Too Large

**Symptoms:** Slow Redis performance

**Solutions:**
1. Use shorter expiry times
2. Clear old cache patterns:
   ```typescript
   await clearCache('xenia:old-endpoint:*');
   ```

3. Check Redis memory usage in Upstash dashboard

---

## Performance Metrics

### Expected Improvements

| Metric | Without Cache | With Cache | Improvement |
|--------|--------------|------------|-------------|
| Response Time | 200-500ms | 10-50ms | **5-10x faster** |
| DB Queries | Every request | First request only | **90%+ reduction** |
| API Throughput | 100 req/s | 500+ req/s | **5x increase** |

### Monitoring Cache Performance

Check your logs for cache statistics:

```
✅ Cache HIT for: xenia:/api/users:{}
❌ Cache MISS for: xenia:/api/users/123:{}
💾 Cached data for: xenia:/api/users:{} (expires in 300s)
```

**Good cache performance**: 70-90% cache HIT rate
**Poor cache performance**: Below 50% cache HIT rate

# 🔒 Rate Limiting

Rate limiting is applied alongside secret-key authentication:

- **Public endpoints**: 300 requests per 15 minutes
- **Protected API endpoints**: 100 requests per 15 minutes
- **Sensitive operations**: 10 requests per 15 minutes

## Rate Limit Headers

Every response includes rate limit information:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1704196200
```

---


## Additional Resources

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Upstash Documentation](https://docs.upstash.com/redis)
- [ioredis Documentation](https://github.com/redis/ioredis)

---

## Support

For questions or issues related to caching:

1. Check this documentation first
2. Review logs in Vercel dashboard
3. Check Upstash Redis dashboard
4. Contact the backend team

---

**Last Updated:** January 2, 2026  
**Maintained By:** Xenia Backend Team
```

This documentation covers everything your team needs to know about using Redis caching in your Xenia backend!

