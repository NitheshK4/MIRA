<?php

namespace Mira\Services;

/**
 * Service to format and generate competitive battlecard summary views.
 */
class BattlecardService {
    /**
     * Render battlecard markdown format into HTML presentation cards.
     *
     * @param array $battlecard Raw battlecard array from MIRA API
     * @return array Processed battlecard details
     */
    public function formatBattlecard(array $battlecard): array {
        $name = $battlecard['competitor_name'] ?? 'Unknown Competitor';
        $overview = $battlecard['overview'] ?? 'No overview available yet.';
        $strengths = $battlecard['strengths'] ?? [];
        $weaknesses = $battlecard['weaknesses'] ?? [];
        $landmines = $battlecard['landmines'] ?? [];

        return [
            'title' => "Battlecard: {$name}",
            'competitor' => $name,
            'overview' => $overview,
            'strengths' => is_array($strengths) ? $strengths : explode("\n", $strengths),
            'weaknesses' => is_array($weaknesses) ? $weaknesses : explode("\n", $weaknesses),
            'kill_shots' => is_array($landmines) ? $landmines : explode("\n", $landmines),
            'updated_at' => $battlecard['updated_at'] ?? date('Y-m-d')
        ];
    }
}
