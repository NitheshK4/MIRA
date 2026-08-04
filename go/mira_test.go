package mira_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	mira "github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/go"
)

func TestGetHealth(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			t.Errorf("Expected path /health, got %s", r.URL.Path)
		}
		if r.Header.Get("X-Workspace-Id") != "test-ws" {
			t.Errorf("Expected workspace test-ws, got %s", r.Header.Get("X-Workspace-Id"))
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mira.HealthResponse{
			Status:  "ok",
			Version: "2.0.0",
		})
	}))
	defer ts.Close()

	client := mira.NewClient(ts.URL, mira.WithWorkspaceID("test-ws"))
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	res, err := client.GetHealth(ctx)
	if err != nil {
		t.Fatalf("GetHealth failed: %v", err)
	}
	if res.Status != "ok" || res.Version != "2.0.0" {
		t.Errorf("Unexpected health response: %+v", res)
	}
}

func TestGetCompetitors(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/competitors" {
			t.Errorf("Expected path /api/competitors, got %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mira.CompetitorsResponse{
			Success: true,
			Competitors: []mira.Competitor{
				{ID: 1, Name: "Acme Corp", URL: "https://acme.com"},
			},
		})
	}))
	defer ts.Close()

	client := mira.NewClient(ts.URL)
	ctx := context.Background()

	res, err := client.GetCompetitors(ctx)
	if err != nil {
		t.Fatalf("GetCompetitors failed: %v", err)
	}
	if !res.Success || len(res.Competitors) != 1 {
		t.Fatalf("Unexpected response: %+v", res)
	}
	if res.Competitors[0].Name != "Acme Corp" {
		t.Errorf("Expected competitor name Acme Corp, got %s", res.Competitors[0].Name)
	}
}

func TestAddCompetitor(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("Expected POST, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mira.CompetitorsResponse{
			Success: true,
			Competitors: []mira.Competitor{
				{ID: 2, Name: "Globex", URL: "https://globex.com"},
			},
		})
	}))
	defer ts.Close()

	client := mira.NewClient(ts.URL)
	res, err := client.AddCompetitor(context.Background(), "Globex", "https://globex.com")
	if err != nil {
		t.Fatalf("AddCompetitor failed: %v", err)
	}
	if !res.Success {
		t.Errorf("Expected success true")
	}
}

func TestTriggerScrape(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/competitors/1/scrape" {
			t.Errorf("Expected path /api/competitors/1/scrape, got %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Check enqueued successfully.",
		})
	}))
	defer ts.Close()

	client := mira.NewClient(ts.URL)
	res, err := client.TriggerScrape(context.Background(), 1)
	if err != nil {
		t.Fatalf("TriggerScrape failed: %v", err)
	}
	if res["success"] != true {
		t.Errorf("Expected success true")
	}
}

func TestSimulateWarRoom(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/war-room/simulate" {
			t.Errorf("Expected path /api/war-room/simulate, got %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mira.WarRoomResponse{
			Success:  true,
			Scenario: "Price Cut 30%",
		})
	}))
	defer ts.Close()

	client := mira.NewClient(ts.URL)
	res, err := client.SimulateWarRoom(context.Background(), mira.WarRoomRequest{
		Scenario: "Price Cut 30%",
	})
	if err != nil {
		t.Fatalf("SimulateWarRoom failed: %v", err)
	}
	if !res.Success || res.Scenario != "Price Cut 30%" {
		t.Errorf("Unexpected simulation response: %+v", res)
	}
}
