package com.tienda.pagos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagos")
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("id") Long id;

    @Column(name = "pedido_id", nullable = false)
    @JsonProperty("pedido_id") Long pedidoId;

    @Column(name = "usuario_id", nullable = false)
    @JsonProperty("usuario_id") Long usuarioId;

    @Column(nullable = false, precision = 10, scale = 2)
    @JsonProperty("monto") BigDecimal monto;

    @Column(name = "metodo_pago", nullable = false)
    @JsonProperty("metodo_pago") String metodoPago;

    @Column(nullable = false)
    @JsonProperty("estado") String estado;

    @JsonProperty("motivo") String motivo;
    @JsonProperty("referencia") String referencia;
    @JsonProperty("guia") String guia;
    @JsonProperty("fecha") LocalDateTime fecha = LocalDateTime.now();
}
