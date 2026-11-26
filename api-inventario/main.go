package main

import (
	"net/http"
	"os"
	"strconv"
	"sync"

	"github.com/gin-gonic/gin"
)

type Item struct {
	ProductoID int `json:"producto_id"`
	Cantidad   int `json:"cantidad"`
}

type ReservaRequest struct {
	Items []Item `json:"items"`
}

var (
	mu         sync.Mutex
	inventario = map[int]int{1: 20, 2: 15, 3: 10, 4: 25, 5: 8, 6: 12}
)

func ok(c *gin.Context, codigo int, data any) {
	c.JSON(codigo, gin.H{"ok": true, "data": data})
}

func fallo(c *gin.Context, codigo int, msg string) {
	c.JSON(codigo, gin.H{"ok": false, "error": msg})
}

func consultar(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("producto_id"))
	if err != nil {
		fallo(c, http.StatusBadRequest, "producto_id debe ser numérico")
		return
	}
	mu.Lock()
	disp, existe := inventario[id]
	mu.Unlock()
	if !existe {
		fallo(c, http.StatusNotFound, "Producto no encontrado en inventario")
		return
	}
	ok(c, http.StatusOK, gin.H{"producto_id": id, "disponibles": disp})
}

func reservar(c *gin.Context) {
	var req ReservaRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Items) == 0 {
		fallo(c, http.StatusBadRequest, "Se requiere items: [{producto_id, cantidad}]")
		return
	}
	mu.Lock()
	defer mu.Unlock()
	// 1) Validar todo antes de descontar
	for _, it := range req.Items {
		if it.Cantidad <= 0 {
			fallo(c, http.StatusBadRequest, "cantidad debe ser mayor a 0")
			return
		}
		disp, existe := inventario[it.ProductoID]
		if !existe {
			fallo(c, http.StatusNotFound, "Producto "+strconv.Itoa(it.ProductoID)+" no existe en inventario")
			return
		}
		if disp < it.Cantidad {
			fallo(c, http.StatusBadRequest, "Stock insuficiente para producto "+strconv.Itoa(it.ProductoID))
			return
		}
	}
	// 2) Descontar
	resultado := make([]gin.H, 0, len(req.Items))
	for _, it := range req.Items {
		inventario[it.ProductoID] -= it.Cantidad
		resultado = append(resultado, gin.H{"producto_id": it.ProductoID, "disponibles": inventario[it.ProductoID]})
	}
	ok(c, http.StatusOK, resultado)
}

func reabastecer(c *gin.Context) {
	var it Item
	if err := c.ShouldBindJSON(&it); err != nil || it.ProductoID <= 0 {
		fallo(c, http.StatusBadRequest, "Se requiere producto_id y cantidad")
		return
	}
	if it.Cantidad <= 0 {
		fallo(c, http.StatusBadRequest, "cantidad debe ser mayor a 0")
		return
	}
	mu.Lock()
	inventario[it.ProductoID] += it.Cantidad
	disp := inventario[it.ProductoID]
	mu.Unlock()
	ok(c, http.StatusOK, gin.H{"producto_id": it.ProductoID, "disponibles": disp})
}

func main() {
	r := gin.Default()
	r.Use(corsMiddleware())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "servicio": "api-inventario"})
	})
	r.GET("/api/inventario/:producto_id", consultar)
	r.POST("/api/inventario/reservar", reservar)
	r.POST("/api/inventario/reabastecer", reabastecer)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8004"
	}
	r.Run("0.0.0.0:" + port)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
