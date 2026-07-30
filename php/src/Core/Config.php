<?php

namespace Mira\Core;

/**
 * Configuration manager for MIRA PHP Environment.
 */
class Config {
    private array $settings;

    public function __construct(array $overrides = []) {
        $this->settings = array_merge([
            'api_base_url' => getenv('MIRA_API_URL') ?: 'http://localhost:3000',
            'workspace_id' => getenv('MIRA_WORKSPACE') ?: 'default',
            'timeout' => 15,
            'log_file' => __DIR__ . '/../../mira_php.log',
            'enable_cache' => true,
            'cache_ttl' => 300,
        ], $overrides);
    }

    public function get(string $key, $default = null) {
        return $this->settings[$key] ?? $default;
    }

    public function set(string $key, $value): void {
        $this->settings[$key] = $value;
    }

    public function getApiUrl(): string {
        return rtrim($this->get('api_base_url'), '/');
    }
}
