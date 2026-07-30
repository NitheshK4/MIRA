<?php
/**
 * MIRA (Market Intelligence & Research Automation)
 * PHP Server-Side Rendered (SSR) Frontend Dashboard
 */

require_once __DIR__ . '/MiraClient.php';

$apiUrl = $_ENV['MIRA_API_URL'] ?? 'http://localhost:3000';
$workspaceId = $_GET['workspace'] ?? 'default';

$client = new MiraClient($apiUrl, $workspaceId);
$health = $client->getHealth();
$isOnline = isset($health['status']) && $health['status'] === 'ok';

// Process Scrape Action if POST request sent
$actionMessage = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'scrape' && !empty($_POST['competitor_id'])) {
        $res = $client->triggerScrape($_POST['competitor_id']);
        $actionMessage = isset($res['message']) ? $res['message'] : 'Scrape job triggered successfully!';
    }
}

// Fetch dashboard data from API
$competitors = $isOnline ? $client->getCompetitors() : [];
$changes = $isOnline ? $client->getChanges(10) : [];
$battlecards = $isOnline ? $client->getBattlecards() : [];

// Handle cases where response might be wrapped or non-array
if (!is_array($competitors)) $competitors = [];
if (!is_array($changes)) $changes = [];
if (!is_array($battlecards)) $battlecards = [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MIRA — PHP Intelligence Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #090d16;
            --bg-secondary: #111827;
            --bg-card: #1f2937;
            --border-color: #374151;
            --text-main: #f9fafb;
            --text-muted: #9ca3af;
            --accent-purple: #8b5cf6;
            --accent-cyan: #06b6d4;
            --accent-green: #10b981;
            --accent-red: #ef4444;
            --accent-yellow: #f59e0b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        header {
            background: rgba(17, 24, 39, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.25rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a78bfa, #38bdf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.25rem 0.65rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .badge-online { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-offline { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-php { background: rgba(139, 92, 246, 0.15); color: var(--accent-purple); border: 1px solid rgba(139, 92, 246, 0.3); }

        .container {
            max-width: 1300px;
            margin: 2rem auto;
            padding: 0 1.5rem;
            width: 100%;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .card {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.25rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-main);
        }

        .stat-number {
            font-size: 2.25rem;
            font-weight: 700;
            color: var(--accent-cyan);
            font-family: 'JetBrains Mono', monospace;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
        }

        .table th, .table td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .table th {
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: none;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent-purple), #6366f1);
            color: white;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .btn-secondary {
            background: var(--bg-card);
            color: var(--text-main);
            border: 1px solid var(--border-color);
        }
        .btn-secondary:hover { background: #374151; }

        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--accent-green);
            color: var(--accent-green);
            font-size: 0.9rem;
        }

        .code-block {
            font-family: 'JetBrains Mono', monospace;
            background: var(--bg-primary);
            padding: 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            color: #38bdf8;
            overflow-x: auto;
        }

        footer {
            margin-top: auto;
            border-top: 1px solid var(--border-color);
            padding: 1.5rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.85rem;
        }
    </style>
</head>
<body>

    <header>
        <div class="logo">
            ⚡ MIRA <span style="font-size:0.85rem; color: var(--text-muted); font-weight:400;">PHP Intelligence Portal</span>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
            <span class="badge badge-php">PHP 8.2 Engine</span>
            <?php if ($isOnline): ?>
                <span class="badge badge-online">● Backend Online</span>
            <?php else: ?>
                <span class="badge badge-offline">● Backend Offline</span>
            <?php endif; ?>
        </div>
    </header>

    <div class="container">
        <?php if ($actionMessage): ?>
            <div class="alert">
                <?= htmlspecialchars($actionMessage) ?>
            </div>
        <?php endif; ?>

        <!-- Stat Cards -->
        <div class="grid">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Monitored Competitors</span>
                    <span style="font-size:1.25rem;">🎯</span>
                </div>
                <div class="stat-number"><?= count($competitors) ?></div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">Recent Intelligence Alerts</span>
                    <span style="font-size:1.25rem;">⚡</span>
                </div>
                <div class="stat-number"><?= count($changes) ?></div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">Active Battlecards</span>
                    <span style="font-size:1.25rem;">⚔️</span>
                </div>
                <div class="stat-number"><?= count($battlecards) ?></div>
            </div>
        </div>

        <!-- Competitor List & Trigger Section -->
        <div class="card" style="margin-bottom: 2rem;">
            <div class="card-header">
                <span class="card-title">Competitor Surveillance Grid</span>
                <a href="export.php?format=csv" class="btn btn-secondary">📥 Export CSV (PHP)</a>
            </div>
            
            <?php if (empty($competitors)): ?>
                <p style="color: var(--text-muted); text-align:center; padding: 2rem;">
                    No competitors currently registered or API backend unreachable.
                </p>
            <?php else: ?>
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Competitor</th>
                            <th>Target URL</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($competitors as $comp): ?>
                            <tr>
                                <td><span class="code-block">#<?= htmlspecialchars($comp['id'] ?? 'N/A') ?></span></td>
                                <td><strong><?= htmlspecialchars($comp['name'] ?? 'Unknown') ?></strong></td>
                                <td><a href="<?= htmlspecialchars($comp['url'] ?? '#') ?>" target="_blank" style="color:var(--accent-cyan); text-decoration:none;"><?= htmlspecialchars($comp['url'] ?? '') ?></a></td>
                                <td>
                                    <form method="POST" style="display:inline;">
                                        <input type="hidden" name="action" value="scrape">
                                        <input type="hidden" name="competitor_id" value="<?= htmlspecialchars($comp['id'] ?? '') ?>">
                                        <button type="submit" class="btn btn-primary">🚀 Scrape Now</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>

    <footer>
        MIRA PHP Dashboard • Server-Side Rendered Intelligence Interface • Running on PHP <?= PHP_VERSION ?>
    </footer>

</body>
</html>
