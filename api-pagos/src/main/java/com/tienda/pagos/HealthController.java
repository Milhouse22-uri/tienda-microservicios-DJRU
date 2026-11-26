package com.tienda.pagos;

import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true, "servicio", "api-pagos");
    }
}
