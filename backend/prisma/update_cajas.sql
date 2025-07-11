-- Insertar una sucursal predeterminada
INSERT INTO "Sucursal" (nombre, direccion, telefono, activa, "createdAt", "updatedAt") 
VALUES ('Sucursal Principal', 'Dirección Predeterminada', 'Tel: 000-000', true, NOW(), NOW());

-- Obtener el ID de la sucursal recién creada
DO $$
DECLARE
    new_sucursal_id INTEGER;
BEGIN
    SELECT id INTO new_sucursal_id FROM "Sucursal" ORDER BY id LIMIT 1;

    -- Actualizar todas las cajas existentes para asignarles la sucursal predeterminada
    UPDATE "Caja" SET "sucursalId" = new_sucursal_id WHERE "sucursalId" IS NULL;
END $$; 