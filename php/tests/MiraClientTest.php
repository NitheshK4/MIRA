<?php

require_once __DIR__ . '/../MiraClient.php';
require_once __DIR__ . '/../src/Services/WarRoomSimulator.php';
require_once __DIR__ . '/../src/Services/BattlecardService.php';

use Mira\Services\WarRoomSimulator;
use Mira\Services\BattlecardService;

/**
 * Lightweight Standalone Test Suite for MIRA PHP Subsystem.
 */
class MiraClientTest {
    public function runTests(): void {
        echo "===========================================\n";
        echo "RUNNING MIRA PHP SUBSYSTEM TEST SUITE\n";
        echo "===========================================\n\n";

        $this->testMiraClientInstantiation();
        $this->testWarRoomSimulator();
        $this->testBattlecardService();

        echo "\n🎉 ALL MIRA PHP TESTS PASSED SUCCESSFULLY!\n";
    }

    private function testMiraClientInstantiation(): void {
        echo "Testing MiraClient Instantiation... ";
        $client = new MiraClient('http://localhost:3000', 'test_workspace');
        if (get_class($client) === 'MiraClient') {
            echo "✅ Passed!\n";
        } else {
            echo "❌ Failed!\n";
            exit(1);
        }
    }

    private function testWarRoomSimulator(): void {
        echo "Testing WarRoomSimulator Payoff Matrix Calculation... ";
        $sim = new WarRoomSimulator();
        $res = $sim->simulate('Acme Corp', 'pricing_cut', 8);

        if (
            isset($res['threat_level']) &&
            $res['threat_level'] === 'HIGH' &&
            count($res['recommended_counter_moves']) > 0
        ) {
            echo "✅ Passed!\n";
        } else {
            echo "❌ Failed!\n";
            exit(1);
        }
    }

    private function testBattlecardService(): void {
        echo "Testing BattlecardService Formatter... ";
        $service = new BattlecardService();
        $card = $service->formatBattlecard([
            'competitor_name' => 'CompetitorX',
            'overview' => 'Leading SaaS provider',
            'strengths' => ['Strong brand', 'Global footprint'],
            'weaknesses' => ['High pricing']
        ]);

        if ($card['title'] === 'Battlecard: CompetitorX' && count($card['strengths']) === 2) {
            echo "✅ Passed!\n";
        } else {
            echo "❌ Failed!\n";
            exit(1);
        }
    }
}

// Run test runner if executed directly
$testRunner = new MiraClientTest();
$testRunner->runTests();
