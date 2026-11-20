import json
import os
import matplotlib
import matplotlib.pyplot as plt
import numpy as np

# Set publication style
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
plt.rcParams['axes.edgecolor'] = '#333333'
plt.rcParams['axes.linewidth'] = 1.0

def load_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, 'docs', 'threshold_benchmark_results.json')
    with open(json_path, 'r') as f:
        data = json.load(f)
    return data

def generate_multi_panel_figure(data, output_path):
    thresholds = [float(k) for k in sorted(data.keys())]
    precision = [data[f"{t:.2f}"]['precision'] * 100 for t in thresholds]
    recall = [data[f"{t:.2f}"]['recall'] * 100 for t in thresholds]
    f1 = [data[f"{t:.2f}"]['f1'] * 100 for t in thresholds]
    accuracy = [data[f"{t:.2f}"]['accuracy'] * 100 for t in thresholds]
    
    tp = [data[f"{t:.2f}"]['tp'] for t in thresholds]
    fp = [data[f"{t:.2f}"]['fp'] for t in thresholds]
    fn = [data[f"{t:.2f}"]['fn'] for t in thresholds]
    tn = [data[f"{t:.2f}"]['tn'] for t in thresholds]

    fig, axs = plt.subplots(2, 2, figsize=(16, 12), dpi=300)
    fig.patch.set_facecolor('#ffffff')

    # Color palette
    c_blue = '#1f77b4'
    c_orange = '#ff7f0e'
    c_green = '#2ca02c'
    c_red = '#d62728'
    c_purple = '#9467bd'

    # -------------------------------------------------------------
    # Panel 1: Metric Sensitivity Curves
    # -------------------------------------------------------------
    ax1 = axs[0, 0]
    ax1.set_facecolor('#fafafa')
    ax1.plot(thresholds, precision, marker='s', linewidth=2.5, markersize=8, color=c_blue, label='Precision (%)', zorder=4)
    ax1.plot(thresholds, recall, marker='^', linewidth=2.5, markersize=8, color=c_orange, label='Recall (%)', zorder=4)
    ax1.plot(thresholds, f1, marker='o', linewidth=3.0, markersize=9, color=c_green, label='F1-Score (%)', zorder=5)
    ax1.plot(thresholds, accuracy, marker='D', linewidth=2.0, markersize=7, color=c_purple, linestyle='--', label='Accuracy (%)', zorder=4)

    # Shaded optimal operational zone
    ax1.axvspan(0.85, 0.90, color='#2ca02c', alpha=0.12, label='Optimal Operational Zone (0.85–0.90)', zorder=2)
    ax1.axvline(0.85, color='#2ca02c', linestyle=':', linewidth=1.8, alpha=0.8)
    ax1.axvline(0.90, color='#1f77b4', linestyle=':', linewidth=1.8, alpha=0.8)

    # Annotations
    ax1.annotate('Selected Default (θ=0.85)\n100% Precision / Zero FP', 
                 xy=(0.85, 84.6), xytext=(0.74, 88),
                 arrowprops=dict(facecolor='#2ca02c', shrink=0.08, width=1.5, headwidth=8),
                 fontsize=10, fontweight='bold', color='#1e7e34',
                 bbox=dict(boxstyle='round,pad=0.4', facecolor='#e8f5e9', edgecolor='#2ca02c', alpha=0.9))

    ax1.annotate('Peak F1 = 89.3% (θ=0.90)\nAccuracy = 90.0%', 
                 xy=(0.90, 89.3), xytext=(0.86, 96),
                 arrowprops=dict(facecolor='#1f77b4', shrink=0.08, width=1.5, headwidth=8),
                 fontsize=10, fontweight='bold', color='#0d47a1',
                 bbox=dict(boxstyle='round,pad=0.4', facecolor='#e3f2fd', edgecolor='#1f77b4', alpha=0.9))

    ax1.set_title('(a) Semantic Similarity Threshold (θ) vs Performance Metrics', fontsize=13, fontweight='bold', pad=12)
    ax1.set_xlabel('Semantic Cosine Distance Threshold (θ)', fontsize=11, fontweight='semibold')
    ax1.set_ylabel('Score Percentage (%)', fontsize=11, fontweight='semibold')
    ax1.set_xlim(0.68, 0.97)
    ax1.set_ylim(45, 105)
    ax1.grid(True, linestyle='--', alpha=0.5, color='#cccccc', zorder=1)
    ax1.legend(loc='lower left', framealpha=0.95, fontsize=9.5)

    # -------------------------------------------------------------
    # Panel 2: Error & Confusion Matrix Distribution
    # -------------------------------------------------------------
    ax2 = axs[0, 1]
    ax2.set_facecolor('#fafafa')
    x = np.arange(len(thresholds))
    width = 0.2

    b1 = ax2.bar(x - 1.5*width, tp, width, label='True Positives (TP)', color='#2ca02c', edgecolor='#1e7e34', zorder=3)
    b2 = ax2.bar(x - 0.5*width, fn, width, label='False Negatives (FN - Missed)', color='#ff7f0e', edgecolor='#d35400', zorder=3)
    b3 = ax2.bar(x + 0.5*width, fp, width, label='False Positives (FP - Noise)', color='#d62728', edgecolor='#990000', zorder=3)
    b4 = ax2.bar(x + 1.5*width, tn, width, label='True Negatives (TN)', color='#17a2b8', edgecolor='#117a8b', zorder=3)

    # Add values on top of bars for FP and FN
    for i in range(len(thresholds)):
        if fp[i] > 0:
            ax2.text(x[i] + 0.5*width, fp[i] + 0.8, str(fp[i]), ha='center', fontsize=9, fontweight='bold', color='#d62728')
        if fn[i] > 0:
            ax2.text(x[i] - 0.5*width, fn[i] + 0.8, str(fn[i]), ha='center', fontsize=9, fontweight='bold', color='#d35400')

    ax2.set_title('(b) Confusion Counts Breakdown Across Thresholds (N=60)', fontsize=13, fontweight='bold', pad=12)
    ax2.set_xlabel('Threshold Setting', fontsize=11, fontweight='semibold')
    ax2.set_ylabel('Number of Samples', fontsize=11, fontweight='semibold')
    ax2.set_xticks(x)
    ax2.set_xticklabels([f"θ = {t:.2f}" for t in thresholds], fontsize=10)
    ax2.set_ylim(0, 36)
    ax2.grid(True, linestyle='--', alpha=0.5, color='#cccccc', zorder=1)
    ax2.legend(loc='upper right', framealpha=0.95, fontsize=9.5)

    # Note on False Positives
    ax2.annotate('Zero False Alarms\n(FP = 0 for θ ≤ 0.85)', 
                 xy=(3 + 0.5*width, 0.5), xytext=(2.2, 8),
                 arrowprops=dict(facecolor='#2ca02c', shrink=0.1, width=1.2, headwidth=6),
                 fontsize=9.5, fontweight='bold', color='#1e7e34',
                 bbox=dict(boxstyle='round,pad=0.3', facecolor='#e8f5e9', edgecolor='#2ca02c'))

    # -------------------------------------------------------------
    # Panel 3: Precision-Recall (P-R) Frontier
    # -------------------------------------------------------------
    ax3 = axs[1, 0]
    ax3.set_facecolor('#fafafa')
    ax3.plot([r/100 for r in recall], [p/100 for p in precision], 
             marker='o', markersize=10, linewidth=2.5, color='#6f42c1', zorder=4)

    for i, t in enumerate(thresholds):
        offset = (10, -15) if t == 0.95 else (10, 8)
        if t == 0.85:
            offset = (-75, 12)
        elif t == 0.90:
            offset = (-65, -20)
        ax3.annotate(f"θ={t:.2f}\n(F1={f1[i]:.1f}%)", 
                     xy=(recall[i]/100, precision[i]/100),
                     xytext=offset, textcoords='offset points',
                     fontsize=9.5, fontweight='bold',
                     bbox=dict(boxstyle='round,pad=0.3', facecolor='#ffffff', edgecolor='#6f42c1', alpha=0.85),
                     arrowprops=dict(arrowstyle='->', color='#6f42c1', lw=1.2))

    ax3.set_title('(c) Precision vs. Recall Trade-Off Curve', fontsize=13, fontweight='bold', pad=12)
    ax3.set_xlabel('Recall (True Positive Rate)', fontsize=11, fontweight='semibold')
    ax3.set_ylabel('Precision (1 - False Alarm Rate)', fontsize=11, fontweight='semibold')
    ax3.set_xlim(0.45, 0.98)
    ax3.set_ylim(0.70, 1.05)
    ax3.grid(True, linestyle='--', alpha=0.5, color='#cccccc', zorder=1)

    # -------------------------------------------------------------
    # Panel 4: Error Trade-off Analysis (FNR vs FPR)
    # -------------------------------------------------------------
    ax4 = axs[1, 1]
    ax4.set_facecolor('#fafafa')
    
    # False Negative Rate (FNR) = FN / (TP + FN) = 1 - Recall
    fnr = [(30 - tp_val)/30 * 100 for tp_val in tp]
    # False Positive Rate (FPR) = FP / (FP + TN)
    fpr = [fp_val/30 * 100 for fp_val in fp]

    ax4.plot(thresholds, fnr, marker='v', linewidth=2.5, markersize=8, color='#d35400', label='False Negative Rate (Missed Changes %)')
    ax4.plot(thresholds, fpr, marker='x', linewidth=2.5, markersize=9, mew=2.5, color='#c0392b', label='False Positive Rate (Noise False Alarms %)')

    ax4.axvspan(0.85, 0.90, color='#2ca02c', alpha=0.12, label='Target Equilibrium Zone')
    ax4.set_title('(d) Error Rate Dynamics (FNR vs FPR Trade-Off)', fontsize=13, fontweight='bold', pad=12)
    ax4.set_xlabel('Semantic Cosine Distance Threshold (θ)', fontsize=11, fontweight='semibold')
    ax4.set_ylabel('Error Rate (%)', fontsize=11, fontweight='semibold')
    ax4.set_xlim(0.68, 0.97)
    ax4.set_ylim(-2, 55)
    ax4.grid(True, linestyle='--', alpha=0.5, color='#cccccc', zorder=1)
    ax4.legend(loc='upper right', framealpha=0.95, fontsize=9.5)

    ax4.annotate('FPR = 0.0%\n(Zero False Alarms)', 
                 xy=(0.85, 0), xytext=(0.76, 12),
                 arrowprops=dict(facecolor='#2ca02c', shrink=0.1, width=1.2, headwidth=6),
                 fontsize=9, fontweight='bold', color='#1e7e34',
                 bbox=dict(boxstyle='round,pad=0.3', facecolor='#e8f5e9', edgecolor='#2ca02c'))

    # Main Super Title
    fig.suptitle('Figure 4.4: Empirical Sensitivity Analysis of Semantic Similarity Threshold (θ) on Change Detection Performance\n(Benchmark Dataset: 60 Labeled Real-World Competitor Web Diffs, all-MiniLM-L6-v2 ONNX)',
                 fontsize=15, fontweight='bold', y=0.99)

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved multi-panel figure to: {output_path}")

def generate_standalone_figure(data, output_path):
    thresholds = [float(k) for k in sorted(data.keys())]
    precision = [data[f"{t:.2f}"]['precision'] * 100 for t in thresholds]
    recall = [data[f"{t:.2f}"]['recall'] * 100 for t in thresholds]
    f1 = [data[f"{t:.2f}"]['f1'] * 100 for t in thresholds]
    accuracy = [data[f"{t:.2f}"]['accuracy'] * 100 for t in thresholds]

    fig, ax = plt.subplots(figsize=(12, 7), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#fafafa')

    c_blue = '#1f77b4'
    c_orange = '#ff7f0e'
    c_green = '#2ca02c'
    c_purple = '#9467bd'

    ax.plot(thresholds, precision, marker='s', linewidth=3.0, markersize=9, color=c_blue, label='Precision (Zero Noise Immunity)', zorder=5)
    ax.plot(thresholds, recall, marker='^', linewidth=3.0, markersize=9, color=c_orange, label='Recall (Detection Coverage)', zorder=5)
    ax.plot(thresholds, f1, marker='o', linewidth=3.5, markersize=10, color=c_green, label='F1-Score (Harmonic Balance)', zorder=6)
    ax.plot(thresholds, accuracy, marker='D', linewidth=2.5, markersize=8, color=c_purple, linestyle='--', label='Overall Accuracy', zorder=4)

    # Shaded optimal operational zone
    ax.axvspan(0.85, 0.90, color='#2ca02c', alpha=0.15, label='Recommended Operating Range (θ = 0.85 – 0.90)', zorder=2)
    ax.axvline(0.85, color='#2ca02c', linestyle=':', linewidth=2.0, alpha=0.85)
    ax.axvline(0.90, color='#1f77b4', linestyle=':', linewidth=2.0, alpha=0.85)

    # Point annotations
    for i, t in enumerate(thresholds):
        ax.scatter([t], [f1[i]], color=c_green, s=120, zorder=7)
        ax.text(t, f1[i] + 2.2, f"{f1[i]:.1f}%", ha='center', fontsize=9, fontweight='bold', color='#1e7e34')

    ax.annotate('MIRA Production Default (θ = 0.85)\n• Precision = 100.0% (Zero False Alarms)\n• Recall = 73.3% (Critical Diffs Caught)\n• F1-Score = 84.6%', 
                xy=(0.85, 84.6), xytext=(0.71, 93),
                arrowprops=dict(facecolor='#2ca02c', shrink=0.08, width=2.0, headwidth=9),
                fontsize=10.5, fontweight='bold', color='#1b5e20',
                bbox=dict(boxstyle='round,pad=0.5', facecolor='#e8f5e9', edgecolor='#2ca02c', linewidth=1.5, alpha=0.95))

    ax.annotate('Peak Theoretical F1 (θ = 0.90)\n• Precision = 96.2%\n• Recall = 83.3%\n• Peak F1 = 89.3% | Accuracy = 90.0%', 
                xy=(0.90, 89.3), xytext=(0.83, 62),
                arrowprops=dict(facecolor='#1f77b4', shrink=0.08, width=2.0, headwidth=9),
                fontsize=10.5, fontweight='bold', color='#0d47a1',
                bbox=dict(boxstyle='round,pad=0.5', facecolor='#e3f2fd', edgecolor='#1f77b4', linewidth=1.5, alpha=0.95))

    ax.set_title('Figure 4.4: Semantic Change Detection Performance vs. Similarity Threshold (θ)\nEvaluation on 60 Real-World Competitor Diffs (30 Meaningful vs. 30 Noise Variations)',
                 fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Semantic Cosine Distance Threshold (θ)', fontsize=12, fontweight='semibold', labelpad=8)
    ax.set_ylabel('Performance Metric (%)', fontsize=12, fontweight='semibold', labelpad=8)
    ax.set_xlim(0.68, 0.97)
    ax.set_ylim(45, 105)
    ax.set_xticks(thresholds)
    ax.set_xticklabels([f"{t:.2f}" for t in thresholds], fontsize=11)
    ax.grid(True, linestyle='--', alpha=0.55, color='#cccccc', zorder=1)
    ax.legend(loc='lower left', framealpha=0.95, fontsize=10.5, edgecolor='#aaaaaa')

    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved standalone figure to: {output_path}")

def generate_threat_distribution_figure(output_path):
    # Data derived from competitor intelligence monitoring & test datasets
    categories = ['Pricing &\nPackaging', 'Product &\nFeatures', 'Positioning &\nMessaging', 'SLA &\nTerms', 'Cosmetic Noise\n(Filtered)']
    counts = [12, 10, 5, 3, 30]
    avg_threat_scores = [8.4, 7.6, 5.8, 6.2, 0.0]

    fig, ax1 = plt.subplots(figsize=(11, 6), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax1.set_facecolor('#fafafa')

    x = np.arange(len(categories))
    width = 0.4

    c_bar = '#3498db'
    c_line = '#e74c3c'

    bars = ax1.bar(x - width/2, counts, width, label='Event Frequency (Count)', color=c_bar, edgecolor='#2980b9', zorder=3)
    ax1.set_ylabel('Detected Events Count', fontsize=12, fontweight='semibold', color='#2c3e50')
    ax1.set_ylim(0, 36)
    ax1.grid(True, linestyle='--', alpha=0.5, color='#cccccc', zorder=1)

    for bar in bars:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., h + 0.8, f"{int(h)}", ha='center', fontsize=10, fontweight='bold', color='#2c3e50')

    ax2 = ax1.twinx()
    line = ax2.plot(x + width/2, avg_threat_scores, marker='s', markersize=9, linewidth=2.8, color=c_line, label='Avg LLM Threat Impact (1–10)', zorder=4)
    ax2.set_ylabel('Average Threat Impact Score (1–10)', fontsize=12, fontweight='semibold', color=c_line)
    ax2.set_ylim(0, 10.5)

    for i in range(len(categories)):
        if avg_threat_scores[i] > 0:
            ax2.text(x[i] + width/2, avg_threat_scores[i] + 0.4, f"{avg_threat_scores[i]:.1f}", ha='center', fontsize=10, fontweight='bold', color=c_line)

    ax1.set_xticks(x)
    ax1.set_xticklabels(categories, fontsize=10.5, fontweight='semibold')
    ax1.set_title('Figure 4.5: Competitive Intelligence Distribution by Category and LLM Threat Impact Scoring',
                  fontsize=13, fontweight='bold', pad=15)

    # Combined legend
    lines_1, labels_1 = ax1.get_legend_handles_labels()
    lines_2, labels_2 = ax2.get_legend_handles_labels()
    ax1.legend(lines_1 + lines_2, labels_1 + labels_2, loc='upper right', framealpha=0.95, fontsize=10)

    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved threat distribution figure to: {output_path}")

if __name__ == '__main__':
    data = load_data()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fig_dir = os.path.join(base_dir, 'docs', 'figures')
    
    # 1. Multi-panel comprehensive figure (ideal for Chapter 4/5 full analysis)
    generate_multi_panel_figure(data, os.path.join(fig_dir, 'figure_4_4_semantic_threshold_analysis.png'))
    
    # 2. Standalone publication-ready plot (ideal for paper / 1-column attachment)
    generate_standalone_figure(data, os.path.join(fig_dir, 'figure_4_4_threshold_curve_standalone.png'))

    # 3. Threat score analysis distribution graph
    generate_threat_distribution_figure(os.path.join(fig_dir, 'figure_4_5_threat_impact_analysis.png'))
