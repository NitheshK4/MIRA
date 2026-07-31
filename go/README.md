# 🐹 MIRA Go Subsystem & API Client

This module adds native **Go** support to MIRA (**Market Intelligence & Research Automation**). It includes a strongly-typed Go client library (`mira`), CLI binary source (`cmd/mira/main.go`), and unit tests.

---

## 📁 Subsystem Components

- **`mira.go`**: Struct-based Go API client wrapper (`mira.Client`) using standard library `net/http` and `context`.
- **`cmd/mira/main.go`**: Command-line interface tool.
- **`mira_test.go`**: Unit test suite using `net/http/httptest`.
- **`go.mod`**: Go module definition.

---

## 🚀 Quick Start

### 1. Using `mira` Client in Go Code

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/go"
)

func main() {
	// Initialize MIRA Client
	client := mira.NewClient(
		"http://localhost:3000",
		mira.WithWorkspaceID("default"),
		mira.WithAPIKey("optional-api-key"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch health
	health, err := client.GetHealth(ctx)
	if err != nil {
		log.Fatalf("Health check failed: %v", err)
	}
	fmt.Printf("Health: %+v\n", health)

	// Fetch competitors
	comps, err := client.GetCompetitors(ctx)
	if err != nil {
		log.Fatalf("Failed to fetch competitors: %v", err)
	}
	fmt.Printf("Found %d competitors\n", len(comps.Competitors))

	// Trigger scraper
	_, err = client.TriggerScrape(ctx, 1)

	// Run War Room Simulation
	sim, err := client.SimulateWarRoom(ctx, mira.WarRoomRequest{
		Scenario: "Competitor lowers enterprise tier pricing by 25%",
	})
	if err != nil {
		log.Fatalf("War room simulation failed: %v", err)
	}
	fmt.Printf("Simulation outcome: %+v\n", sim)
}
```

---

## 💻 Go CLI Usage

```bash
# Build binary
go build -o mira ./cmd/mira

# Check health
./mira -url http://localhost:3000 health

# List competitors
./mira competitors

# Add competitor
./mira competitors add "Acme Corp" "https://acme.com"

# Trigger scrape
./mira competitors scrape 1

# View intelligence changes
./mira changes

# Run War Room simulation
./mira warroom "Competitor launches new AI feature"
```

---

## 🧪 Running Tests

```bash
go test -v ./...
```
