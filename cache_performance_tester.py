#!/usr/bin/env python
"""
Cache Performance Testing & Analytics Script
Measures cache effectiveness, generates reports, and identifies optimization opportunities
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any
import statistics

# Configuration
API_URL = "http://localhost:8000"
CACHE_STATS_ENDPOINT = f"{API_URL}/codette/cache/stats"
CACHE_METRICS_ENDPOINT = f"{API_URL}/codette/cache/metrics"
CACHE_ANALYTICS_ENDPOINT = f"{API_URL}/codette/analytics/dashboard"
CACHE_STATUS_ENDPOINT = f"{API_URL}/codette/cache/status"
CHAT_ENDPOINT = f"{API_URL}/codette/chat"

class CachePerformanceTester:
    """Test and analyze cache performance"""
    
    def __init__(self):
        self.results: Dict[str, Any] = {
            "first_call_times": [],
            "cached_call_times": [],
            "cache_hits": 0,
            "cache_misses": 0,
            "test_queries": [],
        }
    
    def test_single_query(self, query: str, test_name: str = None) -> Dict[str, float]:
        """Test a single query with cache measurement"""
        headers = {"Content-Type": "application/json"}
        body = {"message": query, "session_id": f"perf-test-{int(time.time())}"}
        
        # First call (cache miss expected)
        start = time.time()
        try:
            resp1 = requests.post(CHAT_ENDPOINT, json=body, headers=headers, timeout=10)
            first_call_time = (time.time() - start) * 1000
            self.results["first_call_times"].append(first_call_time)
            self.results["cache_misses"] += 1
        except Exception as e:
            print(f"❌ First call failed: {e}")
            return {}
        
        # Wait a bit
        time.sleep(0.2)
        
        # Second call (cache hit expected)
        start = time.time()
        try:
            resp2 = requests.post(CHAT_ENDPOINT, json=body, headers=headers, timeout=10)
            cached_call_time = (time.time() - start) * 1000
            self.results["cached_call_times"].append(cached_call_time)
            self.results["cache_hits"] += 1
        except Exception as e:
            print(f"❌ Cached call failed: {e}")
            return {}
        
        speedup = first_call_time / max(cached_call_time, 0.1)
        
        test_name = test_name or query[:30]
        self.results["test_queries"].append({
            "query": query,
            "first_call_ms": round(first_call_time, 2),
            "cached_call_ms": round(cached_call_time, 2),
            "speedup": round(speedup, 2),
        })
        
        return {
            "first_call_ms": first_call_time,
            "cached_call_ms": cached_call_time,
            "speedup": speedup,
        }
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Retrieve current cache statistics"""
        try:
            resp = requests.get(CACHE_STATS_ENDPOINT, timeout=5)
            return resp.json()
        except Exception as e:
            print(f"❌ Failed to get cache stats: {e}")
            return {}
    
    def get_cache_metrics(self) -> Dict[str, Any]:
        """Retrieve detailed cache metrics"""
        try:
            resp = requests.get(CACHE_METRICS_ENDPOINT, timeout=5)
            return resp.json()
        except Exception as e:
            print(f"❌ Failed to get cache metrics: {e}")
            return {}
    
    def get_analytics_dashboard(self) -> Dict[str, Any]:
        """Retrieve analytics dashboard"""
        try:
            resp = requests.get(CACHE_ANALYTICS_ENDPOINT, timeout=5)
            return resp.json()
        except Exception as e:
            print(f"❌ Failed to get analytics dashboard: {e}")
            return {}
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Check cache backend status"""
        try:
            resp = requests.get(CACHE_STATUS_ENDPOINT, timeout=5)
            return resp.json()
        except Exception as e:
            print(f"❌ Failed to get cache status: {e}")
            return {}
    
    def generate_report(self) -> str:
        """Generate comprehensive performance report"""
        report = []
        report.append("═" * 80)
        report.append("CACHE PERFORMANCE ANALYSIS REPORT")
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("═" * 80)
        report.append("")
        
        # Cache Status
        cache_status = self.get_cache_status()
        if cache_status:
            report.append("CACHE BACKEND STATUS")
            report.append("─" * 80)
            mode = cache_status.get("current_mode", "unknown")
            report.append(f"  Current Mode: {mode}")
            backends = cache_status.get("cache_backends", {})
            for backend, status in backends.items():
                report.append(f"  {backend.replace('_', ' ').title()}: {status}")
            report.append("")
        
        # Test Results Summary
        if self.results["test_queries"]:
            report.append("QUERY PERFORMANCE TEST RESULTS")
            report.append("─" * 80)
            
            for test in self.results["test_queries"]:
                report.append(f"  Query: {test['query'][:50]}")
                report.append(f"    First call (uncached): {test['first_call_ms']}ms")
                report.append(f"    Cached call: {test['cached_call_ms']}ms")
                report.append(f"    Speedup: {test['speedup']}x faster")
                report.append("")
        
        # Aggregate Statistics
        if self.results["first_call_times"] and self.results["cached_call_times"]:
            report.append("AGGREGATE STATISTICS")
            report.append("─" * 80)
            
            avg_first = statistics.mean(self.results["first_call_times"])
            avg_cached = statistics.mean(self.results["cached_call_times"])
            avg_speedup = avg_first / max(avg_cached, 0.1)
            
            report.append(f"  Average first call: {avg_first:.2f}ms")
            report.append(f"  Average cached call: {avg_cached:.2f}ms")
            report.append(f"  Average speedup: {avg_speedup:.2f}x")
            
            if len(self.results["first_call_times"]) > 1:
                stdev_first = statistics.stdev(self.results["first_call_times"])
                stdev_cached = statistics.stdev(self.results["cached_call_times"])
                report.append(f"  Std dev (first call): {stdev_first:.2f}ms")
                report.append(f"  Std dev (cached): {stdev_cached:.2f}ms")
            
            report.append("")
        
        # Current Cache Metrics
        metrics = self.get_cache_metrics()
        if metrics and "performance_dashboard" in metrics:
            dashboard = metrics["performance_dashboard"]
            report.append("CURRENT CACHE PERFORMANCE")
            report.append("─" * 80)
            report.append(f"  Cache hit rate: {dashboard.get('cache_hit_rate', 'N/A')}")
            report.append(f"  Total requests: {dashboard.get('total_requests', 'N/A')}")
            report.append(f"  Cache hits: {dashboard.get('successful_hits', 'N/A')}")
            report.append(f"  Cache misses: {dashboard.get('cache_misses', 'N/A')}")
            
            latency = dashboard.get("average_latency_comparison", {})
            report.append(f"  Average cached response: {latency.get('cached_response_ms', 'N/A')}ms")
            report.append(f"  Average uncached response: {latency.get('uncached_response_ms', 'N/A')}ms")
            report.append(f"  Speedup multiplier: {latency.get('speedup_multiplier', 'N/A')}")
            
            saved = dashboard.get("cumulative_time_saved", {})
            report.append(f"  Total time saved: {saved.get('total_seconds', 'N/A')}s")
            
            report.append("")
        
        # Analytics Dashboard
        dashboard = self.get_analytics_dashboard()
        if dashboard and "analytics" in dashboard:
            analytics = dashboard["analytics"]
            
            report.append("OPTIMIZATION RECOMMENDATIONS")
            report.append("─" * 80)
            recommendations = analytics.get("optimization_recommendations", [])
            for rec in recommendations:
                report.append(f"  • {rec}")
            report.append("")
        
        # Final Summary
        report.append("SUMMARY")
        report.append("═" * 80)
        if self.results["first_call_times"] and self.results["cached_call_times"]:
            avg_speedup = (
                statistics.mean(self.results["first_call_times"]) / 
                max(statistics.mean(self.results["cached_call_times"]), 0.1)
            )
            report.append(f"✅ Cache performance: {avg_speedup:.2f}x speedup achieved")
            
            if avg_speedup > 5:
                report.append("✅ Excellent cache efficiency - maintain current TTL settings")
            elif avg_speedup > 2:
                report.append("✅ Good cache efficiency - consider monitoring for optimization")
            else:
                report.append("⚠️ Low cache efficiency - consider adjusting TTL or query patterns")
        else:
            report.append("⚠️ No test data available - run performance tests first")
        
        report.append("")
        
        return "\n".join(report)


def main():
    """Run performance tests"""
    tester = CachePerformanceTester()
    
    print("Starting Cache Performance Testing...\n")
    
    # Check cache status first
    print("Checking cache backend status...")
    status = tester.get_cache_status()
    if status:
        print(f"  Mode: {status.get('current_mode', 'unknown')}")
        print()
    
    # Test queries
    test_queries = [
        "how to use reverb in mixing",
        "compression techniques for vocals",
        "EQ strategies for drums",
        "mixing orchestral instruments",
        "audio production workflow",
    ]
    
    print("Running performance tests...")
    for i, query in enumerate(test_queries, 1):
        print(f"\n  Test {i}/{len(test_queries)}: {query[:40]}...")
        result = tester.test_single_query(query)
        if result:
            print(f"    First call: {result['first_call_ms']:.2f}ms")
            print(f"    Cached call: {result['cached_call_ms']:.2f}ms")
            print(f"    Speedup: {result['speedup']:.2f}x")
        time.sleep(0.5)
    
    # Generate and display report
    print("\n")
    report = tester.generate_report()
    print(report)
    
    # Save report to file
    with open("cache_performance_report.txt", "w") as f:
        f.write(report)
    print("📊 Report saved to: cache_performance_report.txt")


if __name__ == "__main__":
    main()
