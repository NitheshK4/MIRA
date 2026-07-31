package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/NitheshK4/Autonomous-Competitor-Intelligence-Engine/go"
)

func printJSON(v interface{}) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "JSON encode error: %v\n", err)
		return
	}
	fmt.Println(string(b))
}

func main() {
	baseURL := flag.String("url", "http://localhost:3000", "MIRA API Base URL")
	workspaceID := flag.String("workspace", "default", "Workspace Scope ID")
	apiKey := flag.String("api-key", "", "API Authorization Key")
	flag.Parse()

	args := flag.Args()
	if len(args) == 0 {
		fmt.Println("Usage: mira [flags] <subcommand> [args]")
		fmt.Println("Subcommands: health, competitors, changes, battlecards, warroom")
		os.Exit(0)
	}

	client := mira.NewClient(
		*baseURL,
		mira.WithWorkspaceID(*workspaceID),
		mira.WithAPIKey(*apiKey),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cmd := args[0]
	switch cmd {
	case "health":
		res, err := client.GetHealth(ctx)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		printJSON(res)

	case "competitors":
		if len(args) > 1 && args[1] == "add" && len(args) >= 4 {
			res, err := client.AddCompetitor(ctx, args[2], args[3])
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error: %v\n", err)
				os.Exit(1)
			}
			printJSON(res)
			return
		}
		if len(args) > 1 && args[1] == "scrape" && len(args) >= 3 {
			res, err := client.TriggerScrape(ctx, args[2])
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error: %v\n", err)
				os.Exit(1)
			}
			printJSON(res)
			return
		}
		res, err := client.GetCompetitors(ctx)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		printJSON(res)

	case "changes":
		res, err := client.GetChanges(ctx, 20, nil)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		printJSON(res)

	case "battlecards":
		res, err := client.GetBattlecards(ctx)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		printJSON(res)

	case "warroom":
		scenario := ""
		if len(args) > 1 {
			scenario = args[1]
		}
		res, err := client.SimulateWarRoom(ctx, mira.WarRoomRequest{Scenario: scenario})
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		printJSON(res)

	default:
		fmt.Fprintf(os.Stderr, "Unknown subcommand: %s\n", cmd)
		os.Exit(1)
	}
}
