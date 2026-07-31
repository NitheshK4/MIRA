<?php
/**
 * MIRA (Market Intelligence & Research Automation) - PHP API Client
 * 
 * Provides a clean object-oriented PHP wrapper to interface with the 
 * MIRA Autonomous Competitor Intelligence Engine backend REST API.
 */

class MiraClient {
    private string $baseUrl;
    private string $workspaceId;
    private ?string $apiKey;
    private int $timeout;

    /**
     * Initialize the MIRA PHP API Client.
     *
     * @param string $baseUrl Base URL of the MIRA backend server (e.g., http://localhost:3000)
     * @param string $workspaceId Workspace scope identifier
     * @param string|null $apiKey Optional API key for authorization
     * @param int $timeout Request timeout in seconds
     */
    public function __construct(
        string $baseUrl = 'http://localhost:3000',
        string $workspaceId = 'default',
        ?string $apiKey = null,
        int $timeout = 10
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->workspaceId = $workspaceId;
        $this->apiKey = $apiKey;
        $this->timeout = $timeout;
    }

    /**
     * Check backend server health status.
     *
     * @return array
     */
    public function getHealth(): array {
        return $this->request('GET', '/health');
    }

    /**
     * Retrieve current workspace business profile.
     *
     * @return array
     */
    public function getProfile(): array {
        return $this->request('GET', '/api/profile');
    }

    /**
     * Update business profile.
     *
     * @param array $data Profile data (business_name, product_desc, customers, price_point)
     * @return array
     */
    public function updateProfile(array $data): array {
        return $this->request('POST', '/api/profile', $data);
    }

    /**
     * Retrieve list of monitored competitors.
     *
     * @return array
     */
    public function getCompetitors(): array {
        return $this->request('GET', '/api/competitors');
    }

    /**
     * Add a new competitor for autonomous monitoring.
     *
     * @param string $name Competitor company/product name
     * @param string $url Target website URL to scrape
     * @param array $options Additional metadata (category, frequency, tags)
     * @return array
     */
    public function addCompetitor(string $name, string $url, array $options = []): array {
        $payload = array_merge([
            'name' => $name,
            'url' => $url
        ], $options);
        return $this->request('POST', '/api/competitors', $payload);
    }

    /**
     * Trigger immediate scraper job for a competitor.
     *
     * @param int|string $competitorId
     * @return array
     */
    public function triggerScrape($competitorId): array {
        return $this->request('POST', "/api/competitors/{$competitorId}/scrape");
    }

    /**
     * Retrieve recent semantic change alerts detected across competitors.
     *
     * @param int $limit Maximum records to return
     * @param int|string|null $competitorId Optional competitor filter
     * @return array
     */
    public function getChanges(int $limit = 50, $competitorId = null): array {
        $query = ['limit' => $limit];
        if ($competitorId !== null) {
            $query['competitor_id'] = $competitorId;
        }
        return $this->request('GET', '/api/changes', null, $query);
    }

    /**
     * Retrieve auto-generated competitive battlecards.
     *
     * @return array
     */
    public function getBattlecards(): array {
        return $this->request('GET', '/api/battlecards');
    }

    /**
     * Helper method to execute cURL HTTP requests against MIRA REST API.
     *
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param string $endpoint API path
     * @param array|null $body Request payload for POST/PUT
     * @param array $queryParams Query parameters
     * @return array Decoded JSON response or status array
     */
    private function request(string $method, string $endpoint, ?array $body = null, array $queryParams = []): array {
        $url = $this->baseUrl . $endpoint;
        if (!empty($queryParams)) {
            $url .= '?' . http_build_query($queryParams);
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));

        $headers = [
            'Accept: application/json',
            'X-Workspace-Id: ' . $this->workspaceId
        ];

        if ($this->apiKey) {
            $headers[] = 'Authorization: Bearer ' . $this->apiKey;
        }

        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        @curl_close($ch);

        if ($error) {
            return [
                'success' => false,
                'error' => 'cURL Error: ' . $error,
                'code' => 0
            ];
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'error' => 'Invalid JSON Response from MIRA Backend',
                'raw' => $response,
                'code' => $httpCode
            ];
        }

        return $decoded;
    }
}
