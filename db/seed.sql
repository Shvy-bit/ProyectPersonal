USE pos;
DELETE FROM detalle_ventas;
DELETE FROM ventas;
DELETE FROM productos;
DELETE FROM cajeros;

INSERT INTO cajeros (usuario, nombre, clave_hash, estado) VALUES
('caja1', 'Cajero Principal', 'hash_demo_1', 'activo'),
('caja2', 'Cajero Secundario', 'hash_demo_2', 'activo'),
('caja3', 'Cajero Inactivo', 'hash_demo_3', 'inactivo');

INSERT INTO productos (codigo_barras, nombre, descripcion, cantidad, cantidad_minima, precio_unidad, estado) VALUES
('775000000001', 'Alimento balanceado cerdo 40kg', 'Saco 40kg', 50, 10, 120.00, 'activo'),
('775000000002', 'Alimento balanceado pollo 40kg', 'Saco 40kg', 20, 5, 115.50, 'activo'),
('775000000003', 'Maíz molido 25kg', 'Saco 25kg', 8, 10, 70.00, 'activo'),  
('775000000004', 'Sal mineralizada 10kg', 'Bolsa 10kg', 3, 5, 45.00, 'activo'),
('775000000005', 'Pelet para cerdo 25kg', 'Saco 25kg', 100, 20, 130.00, 'activo');

INSERT INTO ventas (fecha, hora, id_cajero, cliente_doc, total)
VALUES (CURRENT_DATE, CURRENT_TIME, 1, '12345678', 310.00);

INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
(LAST_INSERT_ID(), 1, 1, 120.00, 120.00),
(LAST_INSERT_ID(), 2, 1, 115.50, 115.50),
(LAST_INSERT_ID(), 3, 1, 74.50, 74.50);

UPDATE productos SET cantidad = cantidad - 1 WHERE id IN (1, 2, 3);