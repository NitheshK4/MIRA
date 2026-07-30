<?php

namespace Mira\Services;

/**
 * Competitive War Room Simulator in PHP.
 * Evaluates game-theory strategic payoffs and counter-move recommendations.
 */
class WarRoomSimulator {
    /**
     * Simulate market response scenarios for a competitor move.
     *
     * @param string $competitorName Name of competitor executing strategy
     * @param string $strategyType 'pricing_cut', 'feature_launch', 'positioning_shift', 'marketing_push'
     * @param int $impactScore Score between 1 and 10
     * @return array Simulation payoff matrix and action items
     */
    public function simulate(string $competitorName, string $strategyType, int $impactScore): array {
        $strategies = [
            'pricing_cut' => [
                'threat_level' => 'HIGH',
                'counter_moves' => [
                    'Highlight superior ROI and premium feature set',
                    'Offer targeted 15% renewal incentive to high-risk churn accounts',
                    'Launch comparative side-by-side battlecard page'
                ],
                'payoff_matrix' => [
                    'match_price' => ['our_retention' => 0.85, 'margin_impact' => -0.20],
                    'differentiate' => ['our_retention' => 0.78, 'margin_impact' => 0.05],
                    'ignore' => ['our_retention' => 0.60, 'margin_impact' => 0.00]
                ]
            ],
            'feature_launch' => [
                'threat_level' => 'MEDIUM-HIGH',
                'counter_moves' => [
                    'Fast-follow feature roadmap sprint',
                    'Emphasize stability and enterprise integrations',
                    'Publish customer case study focusing on performance'
                ],
                'payoff_matrix' => [
                    'fast_follow' => ['our_retention' => 0.90, 'margin_impact' => -0.10],
                    'reframe' => ['our_retention' => 0.82, 'margin_impact' => 0.00]
                ]
            ],
            'positioning_shift' => [
                'threat_level' => 'MEDIUM',
                'counter_moves' => [
                    'Update GTM sales collateral',
                    'Re-train sales reps on key differentiators',
                    'Adjust homepage hero value proposition'
                ],
                'payoff_matrix' => [
                    'counter_position' => ['our_retention' => 0.88, 'margin_impact' => -0.02]
                ]
            ]
        ];

        $scenario = $strategies[$strategyType] ?? [
            'threat_level' => 'INFORMATIONAL',
            'counter_moves' => ['Monitor next scheduled crawl update'],
            'payoff_matrix' => ['monitor' => ['our_retention' => 0.95, 'margin_impact' => 0.00]]
        ];

        return [
            'timestamp' => date('c'),
            'competitor' => $competitorName,
            'strategy_type' => $strategyType,
            'impact_score' => $impactScore,
            'threat_level' => $scenario['threat_level'],
            'recommended_counter_moves' => $scenario['counter_moves'],
            'payoff_matrix' => $scenario['payoff_matrix'],
            'recommended_strategy' => $impactScore >= 7 ? 'Execute Direct Counter-Campaign' : 'Monitor & Maintain Value Prop'
        ];
    }
}
