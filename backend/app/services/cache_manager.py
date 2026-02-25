from typing import Any, Optional
from cachetools import TTLCache
import asyncio
import time
import hashlib
import json

class CacheManager:
    """
    Global cache manager to coordinate caching across all services
    and avoid duplicate data loading.
    """
    
    def __init__(self):
        # Main cache for session data
        self.session_cache = TTLCache(maxsize=20, ttl=3600)  # 1 hour
        
        # Cache for computed metrics to avoid recalculating
        self.metrics_cache = TTLCache(maxsize=100, ttl=1800)  # 30 minutes
        
        # Cache for driver comparisons
        self.comparison_cache = TTLCache(maxsize=50, ttl=1800)  # 30 minutes
        
        # Track cache hits/misses for optimization
        self.cache_stats = {
            'hits': 0,
            'misses': 0,
            'session_loads': 0
        }
    
    def generate_cache_key(self, *args, **kwargs) -> str:
        """Generate a consistent cache key from arguments"""
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_str = json.dumps(key_data, default=str, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get_session_data(self, key: str) -> Optional[Any]:
        """Get cached session data"""
        if key in self.session_cache:
            self.cache_stats['hits'] += 1
            return self.session_cache[key]
        self.cache_stats['misses'] += 1
        return None
    
    def set_session_data(self, key: str, data: Any) -> None:
        """Cache session data"""
        self.session_cache[key] = data
        self.cache_stats['session_loads'] += 1
    
    def get_metrics(self, key: str) -> Optional[Any]:
        """Get cached metrics"""
        if key in self.metrics_cache:
            self.cache_stats['hits'] += 1
            return self.metrics_cache[key]
        self.cache_stats['misses'] += 1
        return None
    
    def set_metrics(self, key: str, metrics: Any) -> None:
        """Cache computed metrics"""
        self.metrics_cache[key] = metrics
    
    def get_comparison(self, key: str) -> Optional[str]:
        """Get cached comparison result"""
        if key in self.comparison_cache:
            self.cache_stats['hits'] += 1
            return self.comparison_cache[key]
        self.cache_stats['misses'] += 1
        return None
    
    def set_comparison(self, key: str, result: str) -> None:
        """Cache comparison result"""
        self.comparison_cache[key] = result
    
    def get_cache_stats(self) -> dict:
        """Get cache performance statistics"""
        total_requests = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = (self.cache_stats['hits'] / total_requests) * 100 if total_requests > 0 else 0
        
        return {
            'hit_rate': round(hit_rate, 2),
            'total_requests': total_requests,
            'session_loads': self.cache_stats['session_loads'],
            'cache_sizes': {
                'sessions': len(self.session_cache),
                'metrics': len(self.metrics_cache),
                'comparisons': len(self.comparison_cache)
            }
        }
    
    def clear_cache(self, cache_type: Optional[str] = None) -> None:
        """Clear specific cache or all caches"""
        if cache_type == 'sessions':
            self.session_cache.clear()
        elif cache_type == 'metrics':
            self.metrics_cache.clear()
        elif cache_type == 'comparisons':
            self.comparison_cache.clear()
        else:
            # Clear all caches
            self.session_cache.clear()
            self.metrics_cache.clear()
            self.comparison_cache.clear()
            self.cache_stats = {'hits': 0, 'misses': 0, 'session_loads': 0}

# Global cache manager instance
_cache_manager = None

def get_cache_manager() -> CacheManager:
    """Get the global cache manager instance"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager