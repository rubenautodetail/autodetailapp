#!/bin/bash

# Strapi API Token
TOKEN="dff283817a522111350b211dbd32883d7c6f04f6dbd4456c6d771258c6d6f9d916c9a255855339bdbe365bc11daa9c7a6739a4ae92dc5fa8abe0009d11d6fe16c1b46ddde959d381347029841f24759fd4d7691155949e862fa3bd13aea738435d405488dae99b35b517541c5222dfedbc64cd76e6c5234dc461b3d41e656483"
BASE_URL="http://localhost:1337"

echo "🌍 Creating Spanish localizations for Services and Add-ons..."
echo ""

# Service 1: Interior Detail (documentId: dq7wgb872dkwpz3qoahvc1yu)
echo "📝 Creating Spanish localization for Interior Detail..."
curl -X POST "${BASE_URL}/api/services/dq7wgb872dkwpz3qoahvc1yu/localizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Detalle Interior",
    "description": "Limpieza y acondicionamiento interior completo. Perfecto para mantener la cabina de tu vehículo.",
    "basePrice": 89.99,
    "durationMinutes": 120,
    "checklist": [
      "Aspirar todos los asientos, piso y maletero",
      "Limpiar y acondicionar cuero/vinilo",
      "Limpiar tablero y consola",
      "Limpiar paneles de puertas y portavasos",
      "Limpiar ventanas (interior)",
      "Aplicación de ambientador"
    ],
    "sortOrder": 1,
    "locale": "es"
  }'
echo ""

# Service 2: Exterior Detail (documentId: jcfjt0dz5g3rbxglkj4q3k46)
echo "📝 Creating Spanish localization for Exterior Detail..."
curl -X POST "${BASE_URL}/api/services/jcfjt0dz5g3rbxglkj4q3k46/localizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Detalle Exterior",
    "description": "Lavado profesional a mano y brillo exterior. Tu vehículo lucirá como recién salido del concesionario.",
    "basePrice": 79.99,
    "durationMinutes": 90,
    "checklist": [
      "Lavado a mano con jabón premium",
      "Limpieza de rines y llantas",
      "Limpieza de guardafangos",
      "Restauración de molduras exteriores",
      "Limpieza de ventanas (exterior)",
      "Aplicación de cera rápida en spray"
    ],
    "sortOrder": 2,
    "locale": "es"
  }'
echo ""

# Service 3: Full Detail Package (documentId: kdj3yoi0y4dztbcqq68ouvo7)
echo "📝 Creating Spanish localization for Full Detail Package..."
curl -X POST "${BASE_URL}/api/services/kdj3yoi0y4dztbcqq68ouvo7/localizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paquete Detalle Completo",
    "description": "El detalle definitivo que combina servicio completo interior y exterior. ¡Mejor valor!",
    "basePrice": 149.99,
    "durationMinutes": 180,
    "checklist": [
      "✨ Todos los servicios de Detalle Interior",
      "✨ Todos los servicios de Detalle Exterior",
      "Limpieza de compartimento del motor (solo exterior)",
      "Limpieza de faros",
      "Inspección completa del vehículo"
    ],
    "sortOrder": 3,
    "locale": "es"
  }'
echo ""

# Add-on 1: Premium Wax (documentId: i5eaz07ho8slt73zlasp0um4)
echo "📝 Creating Spanish localization for Premium Wax..."
curl -X POST "${BASE_URL}/api/add-ons/i5eaz07ho8slt73zlasp0um4/localizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cera Premium",
    "description": "Cera de carnauba de alta calidad para brillo duradero y protección",
    "price": 29.99,
    "durationMinutes": 30,
    "checklist": [
      "Aplicar cera premium de carnauba",
      "Pulir a mano hasta obtener brillo"
    ],
    "sortOrder": 1,
    "locale": "es"
  }'
echo ""

# Add-on 2: Tire Shine & Dressing (documentId: a1yy221e5iy1f87kksjf0rb1)
echo "📝 Creating Spanish localization for Tire Shine & Dressing..."
curl -X POST "${BASE_URL}/api/add-ons/a1yy221e5iy1f87kksjf0rb1/localizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Brillo de Llantas",
    "description": "Tratamiento profesional para llantas con brillo negro profundo",
    "price": 15.99,
    "durationMinutes": 15,
    "checklist": [
      "Aplicar brillo a las 4 llantas",
      "Tratamiento de guardafangos"
    ],
    "sortOrder": 2,
    "locale": "es"
  }'
echo ""

# Add-on 3: Pet Hair Removal (documentId: y1oxqltx2eea53oozvkw3plt)
echo "📝 Creating Spanish localization for Pet Hair Removal..."
curl -X POST "${BASE_URL}/api/add-ons/y1oxqltx2eea53oozvkw3plt/localizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Remoción de Pelo de Mascota",
    "description": "Limpieza profunda para remover pelo de mascota de asientos y alfombras",
    "price": 34.99,
    "durationMinutes": 45,
    "checklist": [
      "Usar herramientas especializadas para pelo de mascota",
      "Aspirado profundo de todas las superficies",
      "Acabado con rodillo quitapelusas"
    ],
    "sortOrder": 3,
    "locale": "es"
  }'
echo ""

# Add-on 4: Headlight Restoration (documentId: i5wf9ee780pzkmkzo6dqu667)
echo "📝 Creating Spanish localization for Headlight Restoration..."
curl -X POST "${BASE_URL}/api/add-ons/i5wf9ee780pzkmkzo6dqu667/localizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restauración de Faros",
    "description": "Restaurar faros opacos a claridad como nuevos",
    "price": 44.99,
    "durationMinutes": 60,
    "checklist": [
      "Lijar faros en húmedo",
      "Pulir con compuesto",
      "Aplicar sellador UV"
    ],
    "sortOrder": 4,
    "locale": "es"
  }'
echo ""

echo "✅ All Spanish localizations created successfully!"
