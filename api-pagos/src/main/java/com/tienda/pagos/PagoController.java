package com.tienda.pagos;

import java.math.BigDecimal;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/pagos")
public class PagoController {

    private static final Logger log = LoggerFactory.getLogger(PagoController.class);
    private static final BigDecimal LIMITE = new BigDecimal("50000");

    private final PagoRepository repo;
    private final RestClient http = RestClient.builder()
            .requestFactory(new JdkClientHttpRequestFactory())  // soporta PATCH
            .build();

    @Value("${servicios.inventario}") String inventarioUrl;
    @Value("${servicios.carrito}") String carritoUrl;
    @Value("${servicios.pedidos}") String pedidosUrl;
    @Value("${servicios.envios}") String enviosUrl;

    public PagoController(PagoRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/procesar")
    public ResponseEntity<Map<String, Object>> procesar(@RequestBody(required = false) PagoRequest req) {
        // 1. Validación
        String invalido = validar(req);
        if (invalido != null) return error(400, invalido);

        Pago pago = new Pago();
        pago.pedidoId = req.pedidoId();
        pago.usuarioId = req.usuarioId();
        pago.monto = req.monto();
        pago.metodoPago = req.metodoPago();
        pago.referencia = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 2. Simulación de la pasarela
        if ("tarjeta_rechazada".equalsIgnoreCase(req.metodoPago()) || req.monto().compareTo(LIMITE) > 0) {
            pago.estado = "RECHAZADO";
            pago.motivo = "Pago rechazado por el banco emisor";
            return ok(200, repo.save(pago));
        }

        // 3. Reservar inventario
        List<Map<String, Object>> items = req.items().stream()
                .map(i -> Map.<String, Object>of("producto_id", i.productoId(), "cantidad", i.cantidad()))
                .toList();
        try {
            http.post().uri(inventarioUrl + "/api/inventario/reservar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("items", items))
                    .retrieve().toBodilessEntity();
        } catch (HttpClientErrorException e) {
            pago.estado = "RECHAZADO";
            pago.motivo = "Sin existencias suficientes";
            repo.save(pago);
            return error(400, pago.motivo);
        } catch (Exception e) {
            log.error("No se pudo contactar api-inventario: {}", e.getMessage());
            return error(500, "No se pudo contactar api-inventario");
        }

        // 4. Registrar pago aprobado
        pago.estado = "APROBADO";
        pago = repo.save(pago);

        // 5. Generar guía de envío
        try {
            Map<?, ?> resp = http.post().uri(enviosUrl + "/api/envios/generar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("pedido_id", req.pedidoId()))
                    .retrieve().body(Map.class);
            Object data = resp != null ? resp.get("data") : null;
            if (data instanceof Map<?, ?> d && d.get("guia") != null) pago.guia = d.get("guia").toString();
        } catch (Exception e) {
            log.error("Error generando guía: {}", e.getMessage());
        }

        // 6. Actualizar pedido a pagado
        try {
            Map<String, Object> cuerpo = new HashMap<>();
            cuerpo.put("estado", "pagado");
            if (pago.guia != null) cuerpo.put("guia", pago.guia);
            http.patch().uri(pedidosUrl + "/api/pedidos/" + req.pedidoId() + "/estado")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(cuerpo)
                    .retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.error("Error actualizando pedido: {}", e.getMessage());
        }

        // 7. Vaciar carrito
        try {
            http.delete().uri(carritoUrl + "/api/carrito/" + req.usuarioId() + "/vaciar")
                    .retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.error("Error vaciando carrito: {}", e.getMessage());
        }

        // 8. Guardar guía y responder
        return ok(201, repo.save(pago));
    }

    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<Map<String, Object>> porPedido(@PathVariable Long pedidoId) {
        return repo.findFirstByPedidoIdOrderByFechaDesc(pedidoId)
                .map(p -> ok(200, p))
                .orElseGet(() -> error(404, "No hay pagos para el pedido " + pedidoId));
    }

    private String validar(PagoRequest r) {
        if (r == null) return "Cuerpo JSON requerido";
        if (r.pedidoId() == null || r.usuarioId() == null) return "pedido_id y usuario_id son obligatorios";
        if (r.monto() == null || r.monto().signum() <= 0) return "monto debe ser mayor a 0";
        if (r.metodoPago() == null || r.metodoPago().isBlank()) return "metodo_pago es obligatorio";
        if (r.items() == null || r.items().isEmpty()) return "items es obligatorio";
        for (PagoRequest.Item i : r.items()) {
            if (i.productoId() == null || i.cantidad() == null || i.cantidad() <= 0)
                return "Cada item requiere producto_id y cantidad > 0";
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> ok(int codigo, Object data) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("data", data);
        return ResponseEntity.status(codigo).body(body);
    }

    private ResponseEntity<Map<String, Object>> error(int codigo, String mensaje) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", false);
        body.put("error", mensaje);
        return ResponseEntity.status(codigo).body(body);
    }
}
