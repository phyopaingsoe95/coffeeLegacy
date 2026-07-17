package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

type Booking struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Service   string    `json:"service"`
	Date      string    `json:"date"`
	Time      string    `json:"time"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

type CoffeeProfile struct {
	Acidity    int `json:"acidity"`
	Body       int `json:"body"`
	Sweetness  int `json:"sweetness"`
	Aroma      int `json:"aroma"`
	Aftertaste int `json:"aftertaste"`
}

type ProfileResponse struct {
	Success        bool   `json:"success"`
	RecommendedBean string `json:"recommended_bean"`
	Description    string `json:"description"`
	RoastLevel     string `json:"roast_level"`
	FlavorNotes    string `json:"flavor_notes"`
}

var (
	bookingsFile = "bookings.json"
	bookingsMu   sync.Mutex
)

func main() {
	// Static file handler serving from ./public
	fs := http.FileServer(http.Dir("./public"))
	http.Handle("/", fs)

	// API routes
	http.HandleFunc("/api/book", handleBook)
	http.HandleFunc("/api/profile", handleProfileAnalyze)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("☕ Coffee Specialist Server running at http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleBook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var b Booking
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if b.Name == "" || b.Email == "" || b.Date == "" || b.Service == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	b.ID = fmt.Sprintf("BK-%d", time.Now().UnixNano())
	b.CreatedAt = time.Now()

	// Append booking to local bookings.json file
	bookingsMu.Lock()
	defer bookingsMu.Unlock()

	var currentBookings []Booking
	if _, err := os.Stat(bookingsFile); err == nil {
		data, err := os.ReadFile(bookingsFile)
		if err == nil {
			json.Unmarshal(data, &currentBookings)
		}
	}

	currentBookings = append(currentBookings, b)
	updatedData, err := json.MarshalIndent(currentBookings, "", "  ")
	if err == nil {
		os.WriteFile(bookingsFile, updatedData, 0644)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"booking_id": b.ID,
		"message":    fmt.Sprintf("Thank you %s! Your booking for %s on %s is confirmed.", b.Name, b.Service, b.Date),
	})
}

func handleProfileAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var p CoffeeProfile
	err := json.NewDecoder(r.Body).Decode(&p)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Dynamic Coffee Recommendation Algorithm based on Taste Profiles
	var resp ProfileResponse
	resp.Success = true

	// Analyze dimensions: Acidity, Body, Sweetness, Aroma, Aftertaste (0-100 scales)
	if p.Acidity > 70 && p.Sweetness > 60 {
		resp.RecommendedBean = "Ethiopia Yirgacheffe (Kochere)"
		resp.RoastLevel = "Light Roast"
		resp.FlavorNotes = "Bergamot, Jasmine, Peach, Lemon Tea"
		resp.Description = "A stellar high-elevation washed coffee. The elevated acidity and sweetness provide a clean, floral, and tea-like elegance that sparkles on the palate."
	} else if p.Body > 70 && p.Aftertaste > 70 {
		resp.RecommendedBean = "Sumatra Mandheling (Double Picked)"
		resp.RoastLevel = "Medium-Dark Roast"
		resp.FlavorNotes = "Dark Chocolate, Cedar, Earthy, Licorice"
		resp.Description = "Deep, heavy-bodied, and beautifully rustic. Processed using the traditional wet-hulled method, it features minimal acidity and a persistent sweet, herbaceous finish."
	} else if p.Sweetness > 70 && p.Body > 50 {
		resp.RecommendedBean = "Colombia Finca El Paraiso"
		resp.RoastLevel = "Medium Roast"
		resp.FlavorNotes = "Red Velvet, Strawberry, Vanilla Cream"
		resp.Description = "An outstanding anaerobic-fermentation coffee. This processing method locks in sugars, yielding an incredibly rich, dessert-like sweetness and heavy berry-cream flavors."
	} else if p.Aroma > 70 && p.Acidity > 50 {
		resp.RecommendedBean = "Kenya Nyeri (Peaberry)"
		resp.RoastLevel = "Light-Medium Roast"
		resp.FlavorNotes = "Blackcurrant, Blackberry, Grapefruit, Brown Sugar"
		resp.Description = "Kenya Peaberry is renowned for its intense aromatic bloom and rich, dark-berry profile. A punchy cup with complex phosphoric acidity."
	} else {
		resp.RecommendedBean = "Guatemala Huehuetenango"
		resp.RoastLevel = "Medium Roast"
		resp.FlavorNotes = "Milk Chocolate, Red Apple, Toffee"
		resp.Description = "A perfectly balanced, crowd-pleasing origin. Moderate body, smooth apple-like acidity, and a comforting chocolate-caramel sweetness."
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
