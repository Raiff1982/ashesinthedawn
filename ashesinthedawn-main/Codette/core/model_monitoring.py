"""
Codette v3 Model Monitoring & Metrics System
Tracks performance metrics, generates reports, and provides alerts.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import statistics

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ModelMetrics:
    """Individual model performance snapshot."""
    timestamp: str
    model_name: str
    load_time_ms: float
    inference_time_ms: float
    memory_mb: float
    tokens_per_second: float
    error_rate: float
    cache_hit_rate: float
    success_count: int
    error_count: int


class MetricsCollector:
    """Collects and stores model performance metrics."""
    
    def __init__(self, metrics_dir: str = "./metrics"):
        self.metrics_dir = Path(metrics_dir)
        self.metrics_dir.mkdir(parents=True, exist_ok=True)
        self.metrics: List[ModelMetrics] = []
    
    def record_metric(self, metric: ModelMetrics) -> None:
        """Record a performance metric."""
        self.metrics.append(metric)
        self._persist_metric(metric)
    
    def _persist_metric(self, metric: ModelMetrics) -> None:
        """Save metric to file."""
        timestamp = datetime.now().strftime("%Y%m%d")
        metrics_file = self.metrics_dir / f"metrics_{timestamp}.jsonl"
        
        with open(metrics_file, 'a') as f:
            f.write(json.dumps(asdict(metric)) + '\n')
    
    def get_model_stats(self, model_name: str, window: int = 100) -> Dict[str, Any]:
        """Get statistics for a specific model."""
        model_metrics = [m for m in self.metrics[-window:] if m.model_name == model_name]
        
        if not model_metrics:
            return {'error': 'No metrics found'}
        
        inference_times = [m.inference_time_ms for m in model_metrics]
        memory_usage = [m.memory_mb for m in model_metrics]
        error_rates = [m.error_rate for m in model_metrics]
        
        return {
            'model_name': model_name,
            'sample_count': len(model_metrics),
            'inference_time': {
                'mean': statistics.mean(inference_times),
                'median': statistics.median(inference_times),
                'min': min(inference_times),
                'max': max(inference_times),
                'stdev': statistics.stdev(inference_times) if len(inference_times) > 1 else 0
            },
            'memory': {
                'mean': statistics.mean(memory_usage),
                'max': max(memory_usage),
                'min': min(memory_usage)
            },
            'error_rate': {
                'mean': statistics.mean(error_rates),
                'max': max(error_rates)
            },
            'throughput_tokens_per_second': statistics.mean([m.tokens_per_second for m in model_metrics])
        }
    
    def generate_report(self, period_days: int = 7) -> str:
        """Generate comprehensive metrics report."""
        unique_models = list(set(m.model_name for m in self.metrics))
        
        report = f"# Codette Model Performance Report\n"
        report += f"Generated: {datetime.now().isoformat()}\n"
        report += f"Period: Last {period_days} days\n"
        report += f"Models Analyzed: {len(unique_models)}\n\n"
        
        for model_name in unique_models:
            stats = self.get_model_stats(model_name)
            if 'error' not in stats:
                report += self._format_model_stats(stats)
        
        return report
    
    def _format_model_stats(self, stats: Dict[str, Any]) -> str:
        """Format statistics as readable text."""
        text = f"## {stats['model_name']}\n\n"
        text += f"**Inference Time (ms)**\n"
        text += f"- Mean: {stats['inference_time']['mean']:.2f}\n"
        text += f"- Median: {stats['inference_time']['median']:.2f}\n"
        text += f"- Range: {stats['inference_time']['min']:.2f} - {stats['inference_time']['max']:.2f}\n"
        text += f"- Std Dev: {stats['inference_time']['stdev']:.2f}\n\n"
        
        text += f"**Memory (MB)**\n"
        text += f"- Mean: {stats['memory']['mean']:.2f}\n"
        text += f"- Max: {stats['memory']['max']:.2f}\n"
        text += f"- Min: {stats['memory']['min']:.2f}\n\n"
        
        text += f"**Reliability**\n"
        text += f"- Error Rate: {stats['error_rate']['mean']:.2%}\n"
        text += f"- Throughput: {stats['throughput_tokens_per_second']:.2f} tokens/sec\n\n"
        
        return text


class PerformanceAnalyzer:
    """Analyzes model performance and provides insights."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.collector = metrics_collector
    
    def compare_models(self, model_names: List[str]) -> Dict[str, Any]:
        """Compare performance across models."""
        comparison = {}
        
        for model in model_names:
            stats = self.collector.get_model_stats(model)
            if 'error' not in stats:
                comparison[model] = {
                    'avg_inference_ms': stats['inference_time']['mean'],
                    'avg_memory_mb': stats['memory']['mean'],
                    'error_rate': stats['error_rate']['mean'],
                    'throughput': stats['throughput_tokens_per_second']
                }
        
        # Rank by inference time
        ranked = sorted(
            comparison.items(),
            key=lambda x: x[1]['avg_inference_ms']
        )
        
        return {
            'comparison': comparison,
            'ranking_by_speed': [name for name, _ in ranked],
            'fastest': ranked[0][0] if ranked else None,
            'slowest': ranked[-1][0] if ranked else None
        }
    
    def detect_anomalies(self, model_name: str, threshold_std: float = 2.0) -> List[Dict]:
        """Detect anomalous metric values."""
        model_metrics = [
            m for m in self.collector.metrics
            if m.model_name == model_name
        ]
        
        if len(model_metrics) < 10:
            return []
        
        # Analyze inference times
        inference_times = np.array([m.inference_time_ms for m in model_metrics])
        mean = np.mean(inference_times)
        std = np.std(inference_times)
        
        anomalies = []
        for metric in model_metrics:
            z_score = abs((metric.inference_time_ms - mean) / std) if std > 0 else 0
            if z_score > threshold_std:
                anomalies.append({
                    'timestamp': metric.timestamp,
                    'inference_time_ms': metric.inference_time_ms,
                    'z_score': z_score,
                    'severity': 'high' if z_score > 3 else 'medium'
                })
        
        return anomalies
    
    def get_health_score(self, model_name: str) -> float:
        """Calculate overall health score (0-100)."""
        stats = self.collector.get_model_stats(model_name)
        
        if 'error' in stats:
            return 0.0
        
        # Components
        inference_score = max(0, 100 - stats['inference_time']['mean'])
        error_score = max(0, 100 - (stats['error_rate']['mean'] * 100))
        memory_score = max(0, 100 - (stats['memory']['mean'] / 1000 * 100))
        
        # Weighted average
        health = (inference_score * 0.4 + error_score * 0.4 + memory_score * 0.2)
        return min(100, max(0, health))


class AlertManager:
    """Manages alerts based on performance thresholds."""
    
    def __init__(self):
        self.thresholds = {
            'error_rate_percent': 5.0,
            'memory_mb': 2000,
            'inference_time_ms': 500,
            'cache_hit_rate_percent': 50
        }
        self.alerts: List[Dict] = []
    
    def check_metrics(self, metric: ModelMetrics) -> List[str]:
        """Check metrics against thresholds and return alerts."""
        triggered_alerts = []
        
        if metric.error_rate * 100 > self.thresholds['error_rate_percent']:
            triggered_alerts.append(
                f"HIGH_ERROR_RATE: {metric.model_name} error rate {metric.error_rate:.2%}"
            )
        
        if metric.memory_mb > self.thresholds['memory_mb']:
            triggered_alerts.append(
                f"HIGH_MEMORY: {metric.model_name} using {metric.memory_mb:.0f}MB"
            )
        
        if metric.inference_time_ms > self.thresholds['inference_time_ms']:
            triggered_alerts.append(
                f"SLOW_INFERENCE: {metric.model_name} inference time {metric.inference_time_ms:.0f}ms"
            )
        
        if metric.cache_hit_rate < (self.thresholds['cache_hit_rate_percent'] / 100):
            triggered_alerts.append(
                f"LOW_CACHE_HIT: {metric.model_name} cache hit rate {metric.cache_hit_rate:.2%}"
            )
        
        self.alerts.extend([
            {'timestamp': datetime.now().isoformat(), 'alert': alert}
            for alert in triggered_alerts
        ])
        
        return triggered_alerts
    
    def set_threshold(self, metric_name: str, value: float) -> None:
        """Update alert thresholds."""
        if metric_name in self.thresholds:
            self.thresholds[metric_name] = value
            logger.info(f"Updated threshold {metric_name} to {value}")
        else:
            logger.warning(f"Unknown metric: {metric_name}")


class ModelReportGenerator:
    """Generates comprehensive model reports."""
    
    def __init__(self, metrics_collector: MetricsCollector, analyzer: PerformanceAnalyzer):
        self.collector = metrics_collector
        self.analyzer = analyzer
    
    def generate_full_report(self, output_file: str = "model_report.md") -> None:
        """Generate complete model analysis report."""
        unique_models = list(set(m.model_name for m in self.collector.metrics))
        
        report = "# Codette Model Analysis Report\n\n"
        report += f"**Generated**: {datetime.now().isoformat()}\n"
        report += f"**Total Metrics**: {len(self.collector.metrics)}\n"
        report += f"**Models**: {len(unique_models)}\n\n"
        
        # Comparison section
        report += "## Model Comparison\n\n"
        comparison = self.analyzer.compare_models(unique_models)
        
        report += "### Speed Ranking\n\n"
        for rank, model in enumerate(comparison['ranking_by_speed'], 1):
            info = comparison['comparison'][model]
            report += f"{rank}. **{model}**\n"
            report += f"   - Inference: {info['avg_inference_ms']:.2f}ms\n"
            report += f"   - Memory: {info['avg_memory_mb']:.2f}MB\n"
            report += f"   - Error Rate: {info['error_rate']:.2%}\n"
            report += f"   - Throughput: {info['throughput']:.2f} tokens/sec\n\n"
        
        # Health scores
        report += "## Model Health\n\n"
        for model in unique_models:
            health = self.analyzer.get_health_score(model)
            status = "?? Healthy" if health > 80 else ("?? Warning" if health > 60 else "?? Critical")
            report += f"- **{model}**: {health:.1f}/100 {status}\n"
        
        # Anomalies
        report += "\n## Detected Anomalies\n\n"
        for model in unique_models:
            anomalies = self.analyzer.detect_anomalies(model)
            if anomalies:
                report += f"### {model}\n"
                for anomaly in anomalies[:5]:
                    report += f"- {anomaly['timestamp']}: {anomaly['inference_time_ms']:.2f}ms (z-score: {anomaly['z_score']:.2f})\n"
        
        # Save report
        with open(output_file, 'w') as f:
            f.write(report)
        
        logger.info(f"Report saved to {output_file}")


if __name__ == "__main__":
    # Example usage
    collector = MetricsCollector()
    analyzer = PerformanceAnalyzer(collector)
    alert_manager = AlertManager()
    reporter = ModelReportGenerator(collector, analyzer)
    
    # Generate report
    reporter.generate_full_report("codette_model_report.md")
    
    print("Monitoring system initialized")
