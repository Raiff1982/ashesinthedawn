"""
Thread-Safe Cache System with Redis Fallback
Provides production-ready caching for Codette AI server with multi-worker support
"""

import hashlib
import json
import time
import logging
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

# ============================================================================
# ABSTRACT CACHE INTERFACE
# ============================================================================

class CacheBackend(ABC):
    """Abstract base class for cache backends"""
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl: int) -> None:
        """Set value in cache with TTL"""
        pass
    
    @abstractmethod
    def delete(self, key: str) -> None:
        """Delete value from cache"""
        pass
    
    @abstractmethod
    def clear(self) -> None:
        """Clear all cache entries"""
        pass
    
    @abstractmethod
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        pass

# ============================================================================
# IN-MEMORY CACHE (Thread-Safe with Lock)
# ============================================================================

import threading

class InMemoryCache(CacheBackend):
    """Thread-safe in-memory cache for single-worker deployments"""
    
    def __init__(self, ttl_seconds: int = 300):
        self.cache: Dict[str, Any] = {}
        self.timestamps: Dict[str, float] = {}
        self.ttl = ttl_seconds
        self.lock = threading.RLock()  # Reentrant lock for thread safety
        
        # Metrics
        self.metrics = {
            "hits": 0,
            "misses": 0,
            "total_requests": 0,
            "started_at": time.time()
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Thread-safe get operation"""
        with self.lock:
            self.metrics["total_requests"] += 1
            
            if key not in self.cache:
                self.metrics["misses"] += 1
                return None
            
            # Check if expired
            age = time.time() - self.timestamps[key]
            if age > self.ttl:
                del self.cache[key]
                del self.timestamps[key]
                self.metrics["misses"] += 1
                return None
            
            self.metrics["hits"] += 1
            return self.cache[key]
    
    def set(self, key: str, value: Any, ttl: int = None) -> None:
        """Thread-safe set operation"""
        with self.lock:
            self.cache[key] = value
            self.timestamps[key] = time.time()
    
    def delete(self, key: str) -> None:
        """Thread-safe delete operation"""
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                del self.timestamps[key]
    
    def clear(self) -> None:
        """Thread-safe clear operation"""
        with self.lock:
            self.cache.clear()
            self.timestamps.clear()
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            uptime = time.time() - self.metrics["started_at"]
            hit_rate = (self.metrics["hits"] / self.metrics["total_requests"] * 100) if self.metrics["total_requests"] > 0 else 0
            
            return {
                "backend": "in_memory",
                "entries": len(self.cache),
                "ttl_seconds": self.ttl,
                "hits": self.metrics["hits"],
                "misses": self.metrics["misses"],
                "total_requests": self.metrics["total_requests"],
                "hit_rate_percent": round(hit_rate, 2),
                "uptime_seconds": round(uptime, 1),
                "thread_safe": True
            }

# ============================================================================
# REDIS CACHE (Multi-Worker Production)
# ============================================================================

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available - install with: pip install redis")

class RedisCache(CacheBackend):
    """Redis-backed cache for multi-worker production deployments"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0", ttl_seconds: int = 300):
        if not REDIS_AVAILABLE:
            raise ImportError("Redis package not installed. Install with: pip install redis")
        
        self.ttl = ttl_seconds
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.metrics_key = "codette:cache:metrics"
        
        # Test connection
        try:
            self.redis_client.ping()
            logger.info(f"? Redis cache connected: {redis_url}")
        except redis.ConnectionError as e:
            logger.error(f"? Redis connection failed: {e}")
            raise
        
        # Initialize metrics if not exist
        if not self.redis_client.exists(self.metrics_key):
            self._init_metrics()
    
    def _init_metrics(self):
        """Initialize metrics in Redis"""
        metrics = {
            "hits": 0,
            "misses": 0,
            "total_requests": 0,
            "started_at": time.time()
        }
        self.redis_client.hset(self.metrics_key, mapping=metrics)
    
    def _increment_metric(self, metric: str):
        """Thread-safe metric increment"""
        self.redis_client.hincrby(self.metrics_key, metric, 1)
    
    def get(self, key: str) -> Optional[Any]:
        """Get from Redis cache"""
        self._increment_metric("total_requests")
        
        value = self.redis_client.get(key)
        if value is None:
            self._increment_metric("misses")
            return None
        
        self._increment_metric("hits")
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    
    def set(self, key: str, value: Any, ttl: int = None) -> None:
        """Set in Redis cache with TTL"""
        ttl = ttl or self.ttl
        serialized = json.dumps(value) if not isinstance(value, str) else value
        self.redis_client.setex(key, ttl, serialized)
    
    def delete(self, key: str) -> None:
        """Delete from Redis cache"""
        self.redis_client.delete(key)
    
    def clear(self) -> None:
        """Clear all cache entries (use with caution in production)"""
        # Only clear keys with our prefix
        pattern = "codette:*"
        cursor = 0
        while True:
            cursor, keys = self.redis_client.scan(cursor, match=pattern, count=100)
            if keys:
                self.redis_client.delete(*keys)
            if cursor == 0:
                break
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics from Redis"""
        metrics = self.redis_client.hgetall(self.metrics_key)
        
        hits = int(metrics.get("hits", 0))
        misses = int(metrics.get("misses", 0))
        total = int(metrics.get("total_requests", 0))
        started_at = float(metrics.get("started_at", time.time()))
        
        hit_rate = (hits / total * 100) if total > 0 else 0
        uptime = time.time() - started_at
        
        return {
            "backend": "redis",
            "entries": self.redis_client.dbsize(),
            "ttl_seconds": self.ttl,
            "hits": hits,
            "misses": misses,
            "total_requests": total,
            "hit_rate_percent": round(hit_rate, 2),
            "uptime_seconds": round(uptime, 1),
            "thread_safe": True,
            "multi_worker_safe": True
        }

# ============================================================================
# UNIFIED CACHE MANAGER
# ============================================================================

class CacheManager:
    """
    Unified cache manager with automatic backend selection
    - Uses Redis if available (production multi-worker)
    - Falls back to thread-safe in-memory cache (development single-worker)
    """
    
    def __init__(self, redis_url: Optional[str] = None, ttl_seconds: int = 300):
        self.ttl = ttl_seconds
        self.backend: CacheBackend
        
        # Try Redis first for production
        if redis_url and REDIS_AVAILABLE:
            try:
                self.backend = RedisCache(redis_url, ttl_seconds)
                logger.info("? Using Redis cache backend (production-ready)")
            except Exception as e:
                logger.warning(f"??  Redis failed, falling back to in-memory: {e}")
                self.backend = InMemoryCache(ttl_seconds)
                logger.info("? Using in-memory cache backend (development)")
        else:
            self.backend = InMemoryCache(ttl_seconds)
            if not REDIS_AVAILABLE:
                logger.info("??  Redis not available - using in-memory cache")
            else:
                logger.info("? Using in-memory cache backend (development)")
    
    def get_cache_key(self, *args) -> str:
        """Generate consistent cache key from arguments"""
        key_text = ":".join(str(arg) for arg in args)
        return f"codette:{hashlib.md5(key_text.encode()).hexdigest()}"
    
    def get(self, *args) -> Optional[Any]:
        """Get value from cache"""
        key = self.get_cache_key(*args)
        return self.backend.get(key)
    
    def set(self, *args, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache"""
        key = self.get_cache_key(*args[:-1] if len(args) > 1 else args)
        self.backend.set(key, value, ttl or self.ttl)
    
    def delete(self, *args) -> None:
        """Delete value from cache"""
        key = self.get_cache_key(*args)
        self.backend.delete(key)
    
    def clear(self) -> None:
        """Clear all cache"""
        self.backend.clear()
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return self.backend.stats()
    
    def get_backend_type(self) -> str:
        """Get current backend type"""
        return self.backend.stats()["backend"]

# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    import os
    
    # Example 1: Development (in-memory)
    cache = CacheManager(ttl_seconds=300)
    
    # Example 2: Production with Redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    cache_prod = CacheManager(redis_url=redis_url, ttl_seconds=300)
    
    # Test operations
    cache.set("message", "test", "file.txt", value={"result": "data"})
    result = cache.get("message", "test", "file.txt")
    print(f"Cached result: {result}")
    
    # Get stats
    print(f"Cache stats: {cache.stats()}")
