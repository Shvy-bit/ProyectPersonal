
from flask import Flask, request, jsonify
import mysql.connector

app = Flask(__name__)


DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "pos",
    "port": 3306,
    "auth_plugin": "mysql_native_password"
}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def respuesta_ok(data):
    return jsonify({"ok": True, "data": data})


def respuesta_error(mensaje, status=400):
    resp = jsonify({"ok": False, "mensaje": mensaje})
    resp.status_code = status
    return resp




@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    body = request.get_json(silent=True) or {}
    usuario = body.get("usuario", "").strip()
    clave = body.get("clave", "").strip()

    if not usuario or not clave:
        return respuesta_error("Usuario y contraseña son obligatorios.", 400)

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        
        
        cur.execute(
            """
            SELECT id, usuario, nombre
            FROM cajeros
            WHERE usuario = %s AND clave_hash = %s AND estado = 'activo'
            """,
            (usuario, clave)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return respuesta_error("Usuario o contraseña incorrectos.", 401)

        
        return respuesta_ok(row)
    except Exception as e:
        print("Error en admin_login:", e)
        return respuesta_error("Error interno del servidor.", 500)




@app.route("/api/cajeros", methods=["GET"])
def listar_cajeros():
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT id, usuario, nombre, estado
            FROM cajeros
            ORDER BY id
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return respuesta_ok(rows)
    except Exception as e:
        print("Error en listar_cajeros:", e)
        return respuesta_error("No se pudo obtener la lista de cajeros.", 500)


@app.route("/api/cajeros", methods=["POST"])
def crear_cajero():
    body = request.get_json(silent=True) or {}
    usuario = body.get("usuario", "").strip()
    nombre = body.get("nombre", "").strip()
    estado = body.get("estado", "activo")
    clave = body.get("clave", "").strip()

    if not usuario or not nombre or not clave:
        return respuesta_error("Usuario, nombre y contraseña son obligatorios.", 400)

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            INSERT INTO cajeros (usuario, nombre, clave_hash, estado)
            VALUES (%s, %s, %s, %s)
            """,
            (usuario, nombre, clave, estado)
        )
        conn.commit()
        nuevo_id = cur.lastrowid
        cur.execute(
            "SELECT id, usuario, nombre, estado FROM cajeros WHERE id = %s",
            (nuevo_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        return respuesta_ok(row)
    except mysql.connector.IntegrityError:
        return respuesta_error("El usuario de cajero ya existe.", 400)
    except Exception as e:
        print("Error en crear_cajero:", e)
        return respuesta_error("No se pudo crear el cajero.", 500)


@app.route("/api/cajeros/<int:cajero_id>", methods=["PUT"])
def actualizar_cajero(cajero_id):
    body = request.get_json(silent=True) or {}
    usuario = body.get("usuario", "").strip()
    nombre = body.get("nombre", "").strip()
    estado = body.get("estado", "activo")
    clave = body.get("clave", "").strip()

    if not usuario or not nombre:
        return respuesta_error("Usuario y nombre son obligatorios.", 400)

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        if clave:
            cur.execute(
                """
                UPDATE cajeros
                SET usuario = %s,
                    nombre = %s,
                    estado = %s,
                    clave_hash = %s
                WHERE id = %s
                """,
                (usuario, nombre, estado, clave, cajero_id)
            )
        else:
            cur.execute(
                """
                UPDATE cajeros
                SET usuario = %s,
                    nombre = %s,
                    estado = %s
                WHERE id = %s
                """,
                (usuario, nombre, estado, cajero_id)
            )

        conn.commit()

        cur.execute(
            "SELECT id, usuario, nombre, estado FROM cajeros WHERE id = %s",
            (cajero_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return respuesta_error("Cajero no encontrado.", 404)

        return respuesta_ok(row)
    except mysql.connector.IntegrityError:
        return respuesta_error("El usuario de cajero ya existe.", 400)
    except Exception as e:
        print("Error en actualizar_cajero:", e)
        return respuesta_error("No se pudo actualizar el cajero.", 500)


@app.route("/api/cajeros/<int:cajero_id>", methods=["DELETE"])
def eliminar_cajero(cajero_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM cajeros WHERE id = %s", (cajero_id,))
        conn.commit()
        filas = cur.rowcount
        cur.close()
        conn.close()

        if filas == 0:
            return respuesta_error("Cajero no encontrado.", 404)

        return respuesta_ok({"id": cajero_id})
    except Exception as e:
        print("Error en eliminar_cajero:", e)
        return respuesta_error("No se pudo eliminar el cajero.", 500)




@app.route("/api/productos", methods=["GET"])
def listar_productos():
    texto = request.args.get("texto", "").strip()
    codigo = request.args.get("codigo", "").strip()

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        base_query = """
            SELECT id, codigo_barras, nombre, descripcion,
                   cantidad, cantidad_minima, precio_unidad, estado
            FROM productos
            WHERE 1=1
        """
        params = []

        if texto:
            base_query += " AND (nombre LIKE %s OR descripcion LIKE %s)"
            like = f"%{texto}%"
            params.extend([like, like])

        if codigo:
            base_query += " AND codigo_barras LIKE %s"
            params.append(f"%{codigo}%")

        base_query += " ORDER BY nombre"

        cur.execute(base_query, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return respuesta_ok(rows)
    except Exception as e:
        print("Error en listar_productos:", e)
        return respuesta_error("No se pudo obtener la lista de productos.", 500)


@app.route("/api/inventario-bajo", methods=["GET"])
def inventario_bajo():
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT id, codigo_barras, nombre,
                   cantidad, cantidad_minima, precio_unidad
            FROM productos
            WHERE cantidad <= cantidad_minima
              AND estado = 'activo'
            ORDER BY nombre
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return respuesta_ok(rows)
    except Exception as e:
        print("Error en inventario_bajo:", e)
        return respuesta_error("No se pudo obtener el inventario bajo.", 500)




@app.route("/api/ventas", methods=["GET"])
def listar_ventas():
    desde = request.args.get("desde")
    hasta = request.args.get("hasta")
    cajero = request.args.get("cajero")
    num_venta = request.args.get("num_venta")

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT v.id, v.fecha, v.hora, c.usuario AS cajero,
                   v.cliente_doc, v.total
            FROM ventas v
            JOIN cajeros c ON v.id_cajero = c.id
            WHERE 1=1
        """
        params = []

        if desde:
            query += " AND v.fecha >= %s"
            params.append(desde)
        if hasta:
            query += " AND v.fecha <= %s"
            params.append(hasta)
        if cajero:
            query += " AND c.usuario = %s"
            params.append(cajero)
        if num_venta:
            query += " AND v.id = %s"
            params.append(num_venta)

        query += " ORDER BY v.fecha DESC, v.hora DESC, v.id DESC"

        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return respuesta_ok(rows)
    except Exception as e:
        print("Error en listar_ventas:", e)
        return respuesta_error("No se pudo obtener las ventas.", 500)


@app.route("/api/ventas", methods=["POST"])
def crear_venta():
    body = request.get_json(silent=True) or {}
    fecha = body.get("fecha")
    hora = body.get("hora")
    id_cajero = body.get("id_cajero")
    cliente_doc = body.get("cliente_doc")
    total = body.get("total")
    detalles = body.get("detalles", [])

    if not fecha or not hora or not id_cajero or not isinstance(detalles, list) or not detalles:
        return respuesta_error("Datos de venta incompletos.", 400)

    try:
        conn = get_connection()
        cur = conn.cursor()

        
        cur.execute(
            """
            INSERT INTO ventas (fecha, hora, id_cajero, cliente_doc, total)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (fecha, hora, id_cajero, cliente_doc, total)
        )
        id_venta = cur.lastrowid

        
        for item in detalles:
            id_producto = item.get("id_producto")
            cantidad = item.get("cantidad")
            precio_unitario = item.get("precio_unitario")
            subtotal = item.get("subtotal")

            cur.execute(
                """
                INSERT INTO detalle_ventas
                  (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (id_venta, id_producto, cantidad, precio_unitario, subtotal)
            )

            cur.execute(
                """
                UPDATE productos
                SET cantidad = cantidad - %s
                WHERE id = %s
                """,
                (cantidad, id_producto)
            )

        conn.commit()
        cur.close()
        conn.close()

        return respuesta_ok({"id": id_venta})
    except Exception as e:
        print("Error en crear_venta:", e)
        return respuesta_error("No se pudo registrar la venta.", 500)


if __name__ == "__main__":
    app.run(debug=True)
