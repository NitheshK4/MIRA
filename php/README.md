# 🐘 MIRA PHP Subsystem & API Client

This module adds **PHP** support to MIRA (**Market Intelligence & Research Automation**). It includes a lightweight, server-side rendered (SSR) PHP frontend portal and an object-oriented PHP API client for interacting with MIRA's REST backend.

---

## 📁 Subsystem Components

- **`MiraClient.php`**: Object-oriented PHP SDK client wrapper for MIRA REST API.
- **`index.php`**: Server-Side Rendered (SSR) PHP Frontend Dashboard with competitor surveillance grid, real-time status badges, and manual scrape trigger buttons.
- **`export.php`**: PHP script for exporting competitor intelligence reports to **CSV** or **JSON**.

---

## 🚀 Quick Start (Running PHP Portal)

### 1. Requirements
- PHP 7.4+ or PHP 8.x
- `curl` extension enabled in PHP

### 2. Launch Local PHP Server
Run the built-in PHP development server from the root of the repository:

```bash
php -S localhost:8000 -t php
```

Open your browser and navigate to:
```
http://localhost:8000
```

---

## 💻 Using `MiraClient.php` in Custom PHP Apps

```php
<?php
require_once __DIR__ . '/php/MiraClient.php';

// Initialize Client
$mira = new MiraClient('http://localhost:3000', 'default');

// Fetch monitored competitors
$competitors = $mira->getCompetitors();

// Trigger immediate scraping job for competitor #1
$mira->triggerScrape(1);

// Fetch recent intelligence change alerts
$changes = $mira->getChanges(10);
print_r($changes);
```
