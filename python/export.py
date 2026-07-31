#!/usr/bin/env python3
"""
MIRA (Market Intelligence & Research Automation) - Python Data Exporter
"""

import sys
import os
import csv
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mira_sdk.client import MiraClient


def export_data(base_url="http://localhost:3000", workspace_id="default", format_type="csv", output_path=None):
    client = MiraClient(base_url=base_url, workspace_id=workspace_id)
    changes_resp = client.get_changes(limit=500)

    if not isinstance(changes_resp, dict) or not changes_resp.get("success", True):
        print(f"Error fetching data from MIRA backend: {changes_resp.get('error', 'Unknown error')}")
        return False

    records = changes_resp.get("changes") or changes_resp.get("data") or []

    if format_type.lower() == "json":
        out_file = output_path or "mira_export.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
        print(f"Successfully exported {len(records)} records to {out_file}")
        return True

    # Default to CSV
    out_file = output_path or "mira_export.csv"
    headers = [
        "ID", "Competitor ID", "Competitor Name", "Category", 
        "Impact Score", "Summary", "Detected At"
    ]

    with open(out_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for r in records:
            writer.writerow([
                r.get("id", ""),
                r.get("competitor_id", ""),
                r.get("competitor_name", r.get("name", "")),
                r.get("category", ""),
                r.get("impact_score", ""),
                r.get("summary", ""),
                r.get("created_at", r.get("timestamp", ""))
            ])

    print(f"Successfully exported {len(records)} records to {out_file}")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export MIRA intelligence data")
    parser.add_argument("--url", default="http://localhost:3000", help="API Base URL")
    parser.add_argument("--workspace", default="default", help="Workspace ID")
    parser.add_argument("--format", choices=["csv", "json"], default="csv", help="Output format")
    parser.add_argument("--output", default=None, help="Output file path")

    args = parser.parse_args()
    export_data(
        base_url=args.url,
        workspace_id=args.workspace,
        format_type=args.format,
        output_path=args.output
    )
