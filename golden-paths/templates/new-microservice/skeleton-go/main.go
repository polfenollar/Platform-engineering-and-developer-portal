package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
)

func main() {
	// Initialize structured logger (JSON)
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		slog.Info("root_endpoint_called", slog.String("method", r.Method))
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "Hello from Go microservice!"})
	})

	slog.Info("Starting Go server", slog.String("port", port))
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), nil); err != nil {
		slog.Error("Server failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
}
