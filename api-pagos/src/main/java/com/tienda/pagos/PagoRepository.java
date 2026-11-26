package com.tienda.pagos;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    Optional<Pago> findFirstByPedidoIdOrderByFechaDesc(Long pedidoId);
}
