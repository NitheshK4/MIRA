<?php
/**
 * MIRA Intelligence Data Exporter (PHP)
 * 
 * Exports competitor intelligence data, battlecards, and semantic changes
 * in CSV or JSON format via PHP backend.
 */

require_once __DIR__ . '/MiraClient.php';

$format = strtolower($_GET['format'] ?? 'csv');
$apiUrl = $_ENV['MIRA_API_URL'] ?? 'http://localhost:3000';
$client = new MiraClient($apiUrl);

$competitors = $client->getCompetitors();
$changes = $client->getChanges(100);

if ($format === 'json') {
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="mira_intel_report.json"');
    echo json_encode([
        'exported_at' => date('c'),
        'competitors' => $competitors,
        'changes' => $changes
    ], JSON_PRETTY_PRINT);
    exit;
}

// Default CSV export
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="mira_intel_report.csv"');

$output = fopen('php://output', 'w');
fputcsv($output, ['Competitor ID', 'Competitor Name', 'URL', 'Change Category', 'Impact Score', 'Summary', 'Detected At']);

if (is_array($changes)) {
    foreach ($changes as $change) {
        fputcsv($output, [
            $change['competitor_id'] ?? '',
            $change['competitor_name'] ?? '',
            $change['url'] ?? '',
            $change['category'] ?? 'General',
            $change['impact_score'] ?? '5',
            $change['summary'] ?? '',
            $change['created_at'] ?? date('Y-m-d H:i:s')
        ]);
    }
}

fclose($output);
exit;
