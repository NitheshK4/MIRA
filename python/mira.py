#!/usr/bin/env python3
"""
MIRA (Market Intelligence & Research Automation) - Python CLI Interface
"""

import sys
import os
import argparse
import json

# Ensure python package is importable from local path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mira_sdk.client import MiraClient


def print_json(data):
    print(json.dumps(data, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="MIRA Autonomous Competitor Intelligence CLI (Python)"
    )
    parser.add_argument(
        "--url", default="http://localhost:3000", help="MIRA API backend base URL"
    )
    parser.add_argument(
        "--workspace", default="default", help="Workspace ID"
    )
    parser.add_argument("--api-key", default=None, help="API Authorization Key")
    parser.add_argument(
        "--raw-json", action="store_true", help="Output raw JSON response"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Health command
    subparsers.add_parser("health", help="Check MIRA engine health")

    # Profile command
    subparsers.add_parser("profile", help="View business profile")

    # Competitors command
    comp_parser = subparsers.add_parser("competitors", help="Manage competitors")
    comp_sub = comp_parser.add_subparsers(dest="comp_action")
    comp_sub.add_parser("list", help="List monitored competitors")
    
    add_parser = comp_sub.add_parser("add", help="Add new competitor")
    add_parser.add_argument("name", help="Competitor name")
    add_parser.add_argument("target_url", help="Competitor website URL")

    scrape_parser = comp_sub.add_parser("scrape", help="Trigger immediate scrape")
    scrape_parser.add_argument("id", help="Competitor ID")

    # Changes command
    changes_parser = subparsers.add_parser("changes", help="View detected intelligence changes")
    changes_parser.add_argument("--limit", type=int, default=20, help="Max records")
    changes_parser.add_argument("--competitor", type=int, default=None, help="Competitor ID filter")

    # Battlecards command
    subparsers.add_parser("battlecards", help="Fetch generated battlecards")

    # War Room command
    warroom_parser = subparsers.add_parser("warroom", help="Run War Room simulation")
    warroom_parser.add_argument("--scenario", default=None, help="Scenario description")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    client = MiraClient(
        base_url=args.url, workspace_id=args.workspace, api_key=args.api_key
    )

    try:
        if args.command == "health":
            res = client.get_health()
        elif args.command == "profile":
            res = client.get_profile()
        elif args.command == "competitors":
            action = args.comp_action or "list"
            if action == "list":
                res = client.get_competitors()
            elif action == "add":
                res = client.add_competitor(args.name, args.target_url)
            elif action == "scrape":
                res = client.trigger_scrape(args.id)
            else:
                comp_parser.print_help()
                sys.exit(1)
        elif args.command == "changes":
            res = client.get_changes(limit=args.limit, competitor_id=args.competitor)
        elif args.command == "battlecards":
            res = client.get_battlecards()
        elif args.command == "warroom":
            res = client.simulate_war_room(scenario=args.scenario)
        else:
            parser.print_help()
            sys.exit(1)

        print_json(res)

    except Exception as e:
        print(f"Error executing MIRA command: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
