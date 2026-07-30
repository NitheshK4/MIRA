#!/usr/bin/env php
<?php
/**
 * MIRA Intelligence Engine — PHP Command Line Utility
 */

require_once __DIR__ . '/MiraClient.php';
require_once __DIR__ . '/src/Console/MiraCliCommand.php';

use Mira\Console\MiraCliCommand;

$apiUrl = getenv('MIRA_API_URL') ?: 'http://localhost:3000';
$client = new MiraClient($apiUrl);

$cli = new MiraCliCommand($client);
$cli->run($argv);
