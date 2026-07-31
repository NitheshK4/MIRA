// Package mira provides a native Go API client for the MIRA Autonomous Competitor Intelligence Engine.
package mira

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Client handles communication with the MIRA REST API backend.
type Client struct {
	BaseURL     string
	WorkspaceID string
	APIKey      string
	HTTPClient  *http.Client
}

// Option configures Client parameters.
type Option func(*Client)

// WithHTTPClient sets a custom http.Client.
func WithHTTPClient(hc *http.Client) Option {
	return func(c *Client) {
		c.HTTPClient = hc
	}
}

// WithAPIKey sets the authorization API key.
func WithAPIKey(key string) Option {
	return func(c *Client) {
		c.APIKey = key
	}
}

// WithWorkspaceID sets the workspace ID context.
func WithWorkspaceID(wsID string) Option {
	return func(c *Client) {
		c.WorkspaceID = wsID
	}
}

// NewClient initializes a new MIRA Go API Client.
func NewClient(baseURL string, opts ...Option) *Client {
	c := &Client{
		BaseURL:     strings.TrimRight(baseURL, "/"),
		WorkspaceID: "default",
		HTTPClient:  &http.Client{Timeout: 10 * time.Second},
	}
	for _, opt := range opts {
		opt(c)
	}
	return c
}

// HealthResponse represents health check payload.
type HealthResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	Timestamp string `json:"timestamp,omitempty"`
}

// Competitor represents a competitor entity.
type Competitor struct {
	ID        interface{} `json:"id"`
	Name      string      `json:"name"`
	URL       string      `json:"url"`
	Category  string      `json:"category,omitempty"`
	Frequency string      `json:"frequency,omitempty"`
	Status    string      `json:"status,omitempty"`
	CreatedAt string      `json:"created_at,omitempty"`
}

// CompetitorsResponse represents competitor list response.
type CompetitorsResponse struct {
	Success     bool         `json:"success"`
	Competitors []Competitor `json:"competitors"`
	Count       int          `json:"count,omitempty"`
	Error       string       `json:"error,omitempty"`
}

// Change represents detected intelligence change alert.
type Change struct {
	ID             interface{} `json:"id"`
	CompetitorID   interface{} `json:"competitor_id"`
	CompetitorName string      `json:"competitor_name,omitempty"`
	Category       string      `json:"category"`
	ImpactScore    int         `json:"impact_score"`
	Summary        string      `json:"summary"`
	Justification  string      `json:"justification,omitempty"`
	Recommendation string      `json:"recommendation,omitempty"`
	Timestamp      string      `json:"timestamp,omitempty"`
}

// ChangesResponse represents intelligence change list response.
type ChangesResponse struct {
	Success bool     `json:"success"`
	Changes []Change `json:"changes"`
	Count   int      `json:"count,omitempty"`
	Error   string   `json:"error,omitempty"`
}

// Battlecard represents generated competitor battlecard.
type Battlecard struct {
	CompetitorID interface{} `json:"competitor_id"`
	Name         string      `json:"name"`
	Overview     string      `json:"overview"`
	Strengths    []string    `json:"strengths"`
	Weaknesses   []string    `json:"weaknesses"`
	KillPoints   []string    `json:"kill_points"`
}

// BattlecardsResponse represents battlecards API response.
type BattlecardsResponse struct {
	Success     bool         `json:"success"`
	Battlecards []Battlecard `json:"battlecards"`
	Error       string       `json:"error,omitempty"`
}

// WarRoomRequest represents payload for War Room simulation.
type WarRoomRequest struct {
	Scenario      string        `json:"scenario,omitempty"`
	CompetitorIDs []interface{} `json:"competitor_ids,omitempty"`
}

// WarRoomResponse represents War Room simulation outcome.
type WarRoomResponse struct {
	Success            bool                   `json:"success"`
	SimulationID       string                 `json:"simulation_id,omitempty"`
	Scenario           string                 `json:"scenario,omitempty"`
	RecommendedAction  string                 `json:"recommended_action,omitempty"`
	StrategicPostures  map[string]interface{} `json:"postures,omitempty"`
	Error              string                 `json:"error,omitempty"`
}

// GetHealth fetches engine health status.
func (c *Client) GetHealth(ctx context.Context) (*HealthResponse, error) {
	var resp HealthResponse
	if err := c.do(ctx, http.MethodGet, "/health", nil, nil, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetCompetitors retrieves list of monitored competitors.
func (c *Client) GetCompetitors(ctx context.Context) (*CompetitorsResponse, error) {
	var resp CompetitorsResponse
	if err := c.do(ctx, http.MethodGet, "/api/competitors", nil, nil, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// AddCompetitor registers a new competitor for surveillance.
func (c *Client) AddCompetitor(ctx context.Context, name, targetURL string) (*CompetitorsResponse, error) {
	body := map[string]string{
		"name": name,
		"url":  targetURL,
	}
	var resp CompetitorsResponse
	if err := c.do(ctx, http.MethodPost, "/api/competitors", nil, body, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// TriggerScrape executes immediate scraping job for a competitor.
func (c *Client) TriggerScrape(ctx context.Context, competitorID interface{}) (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("/api/competitors/%v/scrape", competitorID)
	var resp map[string]interface{}
	if err := c.do(ctx, http.MethodPost, endpoint, nil, nil, &resp); err != nil {
		return nil, err
	}
	return resp, nil
}

// GetChanges fetches detected intelligence change alerts.
func (c *Client) GetChanges(ctx context.Context, limit int, competitorID interface{}) (*ChangesResponse, error) {
	q := url.Values{}
	if limit > 0 {
		q.Set("limit", strconv.Itoa(limit))
	}
	if competitorID != nil {
		q.Set("competitor_id", fmt.Sprintf("%v", competitorID))
	}
	var resp ChangesResponse
	if err := c.do(ctx, http.MethodGet, "/api/changes", q, nil, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetBattlecards retrieves generated battlecards.
func (c *Client) GetBattlecards(ctx context.Context) (*BattlecardsResponse, error) {
	var resp BattlecardsResponse
	if err := c.do(ctx, http.MethodGet, "/api/battlecards", nil, nil, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// SimulateWarRoom triggers War Room simulation.
func (c *Client) SimulateWarRoom(ctx context.Context, req WarRoomRequest) (*WarRoomResponse, error) {
	var resp WarRoomResponse
	if err := c.do(ctx, http.MethodPost, "/api/war-room/simulate", nil, req, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (c *Client) do(ctx context.Context, method, path string, q url.Values, body interface{}, result interface{}) error {
	fullURL := c.BaseURL + path
	if len(q) > 0 {
		fullURL += "?" + q.Encode()
	}

	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, fullURL, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Workspace-Id", c.WorkspaceID)
	req.Header.Set("User-Agent", "MIRA-Go-SDK/1.0.0")

	if c.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.APIKey)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %w", err)
	}
	defer res.Body.Close()

	respBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if res.StatusCode >= 400 {
		return fmt.Errorf("api error (status %d): %s", res.StatusCode, string(respBytes))
	}

	if result != nil && len(respBytes) > 0 {
		if err := json.Unmarshal(respBytes, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w (raw: %s)", err, string(respBytes))
		}
	}

	return nil
}
