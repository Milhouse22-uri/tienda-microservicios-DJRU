package com.tienda.pagos;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

public record PagoRequest(
        @JsonProperty("pedido_id") Long pedidoId,
        @JsonProperty("usuario_id") Long usuarioId,
        @JsonProperty("monto") BigDecimal monto,
        @JsonProperty("metodo_pago") String metodoPago,
        @JsonProperty("items") List<Item> items) {

    public record Item(
            @JsonProperty("producto_id") Integer productoId,
            @JsonProperty("cantidad") Integer cantidad) {}
}
