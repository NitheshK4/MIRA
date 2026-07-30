<?php

namespace Mira\Console;

use MiraClient;

/**
 * CLI Command runner for MIRA Intelligence Operations in PHP.
 */
class MiraCliCommand {
    private MiraClient $client;

    public function __construct(MiraClient $client) {
        $this->client = $client;
    }

    public function run(array $args): void {
        $command = $args[1] ?? 'help';

        switch ($command) {
            case 'health':
                $this->handleHealth();
                break;
            case 'list':
                $this->handleList();
                break;
            case 'scrape':
                $id = $args[2] ?? null;
                $this->handleScrape($id);
                break;
            case 'changes':
                $this->handleChanges();
                break;
            case 'help':
            default:
                $this->showHelp();
                break;
        }
    }

    private function handleHealth(): void {
        echo "🔍 Checking MIRA Backend Server Status...\n";
        $health = $this->client->getHealth();
        echo "Status: " . ($health['status'] ?? 'ERROR') . "\n";
        echo "Timestamp: " . ($health['timestamp'] ?? date('c')) . "\n";
    }

    private function handleList(): void {
        echo "🎯 Monitored Competitors List:\n";
        $competitors = $this->client->getCompetitors();
        if (empty($competitors)) {
            echo "No competitors found.\n";
            return;
        }

        foreach ($competitors as $c) {
            echo sprintf(" [%d] %s — %s\n", $c['id'] ?? 0, $c['name'] ?? 'Unknown', $c['url'] ?? 'N/A');
        }
    }

    private function handleScrape(?string $id): void {
        if (!$id) {
            echo "❌ Error: Competitor ID required. Usage: php mira.php scrape <competitor_id>\n";
            return;
        }

        echo "🚀 Triggering scraper for Competitor ID #{$id}...\n";
        $res = $this->client->triggerScrape($id);
        echo "Response: " . json_encode($res, JSON_PRETTY_PRINT) . "\n";
    }

    private function handleChanges(): void {
        echo "⚡ Recent Intelligence Changes:\n";
        $changes = $this->client->getChanges(5);
        foreach ($changes as $ch) {
            echo sprintf(" - [%s] Impact %s/10: %s\n", 
                $ch['competitor_name'] ?? 'Competitor', 
                $ch['impact_score'] ?? '5',
                $ch['summary'] ?? 'No summary'
            );
        }
    }

    private function showHelp(): void {
        echo "MIRA PHP CLI Tool\n";
        echo "Usage: php mira.php <command> [options]\n\n";
        echo "Available Commands:\n";
        echo "  health            Check connection status to MIRA backend\n";
        echo "  list              List all monitored competitors\n";
        echo "  scrape <id>       Trigger scraping run for a competitor ID\n";
        echo "  changes           Show top 5 recent intelligence change alerts\n";
        echo "  help              Show this help menu\n";
    }
}
