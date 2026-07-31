# 🐍 MIRA Python Subsystem & API Client

This module adds **Python** support to MIRA (**Market Intelligence & Research Automation**). It includes an object-oriented Python API client SDK (`mira_sdk`), a command-line interface (`mira.py`), data export utilities (`export.py`), and test suites.

---

## 📁 Subsystem Components

- **`mira_sdk/`**: Python package containing `MiraClient` API wrapper.
- **`mira.py`**: Command-Line Interface (CLI) for running MIRA actions from terminal or automation scripts.
- **`export.py`**: Script for exporting intelligence reports to **CSV** or **JSON**.
- **`tests/test_mira_client.py`**: `unittest` suite for verifying client operations.

---

## 🚀 Quick Start

### 1. Installation / Setup

Zero external dependencies required (uses standard library `urllib` / `json`):

```bash
cd python
```

### 2. Using `MiraClient` in Python Code

```python
from mira_sdk import MiraClient

# Initialize Client
client = MiraClient(base_url="http://localhost:3000", workspace_id="default")

# Check server health
health = client.get_health()
print("Health Status:", health)

# Fetch monitored competitors
competitors = client.get_competitors()
print("Competitors:", competitors)

# Add a competitor
client.add_competitor("Acme Corp", "https://acme.com")

# Trigger immediate scraping job
client.trigger_scrape(competitor_id=1)

# Fetch recent intelligence change alerts
changes = client.get_changes(limit=10)
print("Recent Changes:", changes)

# Run War Room simulation
simulation = client.simulate_war_room(scenario="Competitor drops pricing by 20%")
print("Simulation Results:", simulation)
```

---

## 💻 Python CLI Usage

```bash
# Check server health
python3 python/mira.py health

# List competitors
python3 python/mira.py competitors list

# Add competitor
python3 python/mira.py competitors add "Acme Corp" "https://acme.com"

# Trigger scrape
python3 python/mira.py competitors scrape 1

# View intelligence changes
python3 python/mira.py changes --limit 10

# Export data to CSV or JSON
python3 python/export.py --format csv --output report.csv
```

---

## 🧪 Running Tests

```bash
python3 -m unittest discover -s python/tests
```
