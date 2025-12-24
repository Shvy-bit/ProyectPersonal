


const API_BASE = ''; 

document.addEventListener('DOMContentLoaded', () => {
    const spanCajero = document.getElementById('cajero-activo');
    const spanNumVenta = document.getElementById('num-venta');
    const spanCantArt = document.getElementById('cantidad-articulos');
    const spanHora = document.getElementById('hora-actual');
    const spanFecha = document.getElementById('fecha-actual');
    const inputDocCliente = document.getElementById('doc-cliente');
    const cuerpoTabla = document.getElementById('tabla-detalle-venta');
    const inputCodigo = document.getElementById('codigo-barras');
    const inputCantidad = document.getElementById('cantidad-producto');
    const inputTotal = document.getElementById('total-pagar');
    const inputPago = document.getElementById('pago-cliente');
    const spanCambio = document.getElementById('cambio');
    const alertaInventario = document.getElementById('cantidad-inventario-bajo');

    let detalles = []; 
    let idCajero = null;

    
    function actualizarReloj() {
        const ahora = new Date();
        const hh = String(ahora.getHours()).padStart(2, '0');
        const mm = String(ahora.getMinutes()).padStart(2, '0');
        const ss = String(ahora.getSeconds()).padStart(2, '0');
        spanHora.textContent = `${hh}:${mm}:${ss}`;

        const dd = String(ahora.getDate()).padStart(2, '0');
        const mm2 = String(ahora.getMonth() + 1).padStart(2, '0');
        const yyyy = ahora.getFullYear();
        spanFecha.textContent = `${dd}/${mm2}/${yyyy}`;
    }
    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    
    function cargarCajeroActivo() {
        const usuario = sessionStorage.getItem('cajero_activo_usuario');
        const id = sessionStorage.getItem('cajero_activo_id'); 
        if (usuario) {
            spanCajero.textContent = usuario;
        } else {
            spanCajero.textContent = 'SIN CAJERO';
        }
        if (id) {
            idCajero = parseInt(id, 10);
        }
    }
    cargarCajeroActivo();

    
    function cargarProductoSeleccionado() {
        const codigo = sessionStorage.getItem('producto_seleccionado_codigo');
        if (codigo) {
            inputCodigo.value = codigo;
            sessionStorage.removeItem('producto_seleccionado_codigo');
        }
    }
    cargarProductoSeleccionado();

    
    function renderTabla() {
        cuerpoTabla.innerHTML = '';
        detalles.forEach((item, index) => {
            const tr = document.createElement('tr');

            const tdDesc = document.createElement('td');
            tdDesc.textContent = item.descripcion;

            const tdCant = document.createElement('td');
            tdCant.textContent = item.cantidad;

            const tdPU = document.createElement('td');
            tdPU.textContent = item.precio_unitario.toFixed(2);

            const tdSub = document.createElement('td');
            tdSub.textContent = item.subtotal.toFixed(2);

            tr.appendChild(tdDesc);
            tr.appendChild(tdCant);
            tr.appendChild(tdPU);
            tr.appendChild(tdSub);

            tr.addEventListener('dblclick', () => eliminarLinea(index));

            cuerpoTabla.appendChild(tr);
        });

        const totalArt = detalles.reduce((s, d) => s + d.cantidad, 0);
        spanCantArt.textContent = totalArt.toString();

        const total = detalles.reduce((s, d) => s + d.subtotal, 0);
        inputTotal.value = total.toFixed(2);

        calcularCambio();
    }

    function eliminarLinea(idx) {
        detalles.splice(idx, 1);
        renderTabla();
    }

    function calcularCambio() {
        const total = parseFloat(inputTotal.value) || 0;
        const pago = parseFloat(inputPago.value) || 0;
        const cambio = pago - total;
        spanCambio.textContent = cambio > 0 ? cambio.toFixed(2) : '0.00';
    }

    inputPago.addEventListener('input', calcularCambio);

    
    async function actualizarInventarioBajo() {
        try {
            const res = await fetch(API_BASE + '/api/inventario-bajo');
            const data = await res.json();
            if (!data.ok) return;
            const lista = data.data || [];
            alertaInventario.textContent = lista.length.toString();
        } catch (e) {
            console.error('Error inventario bajo', e);
        }
    }
    actualizarInventarioBajo();

    
    async function marcarProducto() {
        const codigo = inputCodigo.value.trim();
        const cantidad = parseInt(inputCantidad.value, 10) || 1;

        if (!codigo) return;

        try {
            const url = API_BASE + '/api/productos?codigo=' + encodeURIComponent(codigo);
            const res = await fetch(url);
            const data = await res.json();

            if (!data.ok || !data.data || data.data.length === 0) {
                alert('Producto no encontrado.');
                return;
            }

            const prod = data.data[0];

            const precio = parseFloat(prod.precio_unidad) || 0;
            const subtotal = precio * cantidad;

            detalles.push({
                id_producto: prod.id,
                codigo_barras: prod.codigo_barras,
                descripcion: prod.nombre,
                cantidad: cantidad,
                precio_unitario: precio,
                subtotal: subtotal
            });

            inputCodigo.value = '';
            inputCantidad.value = '1';
            renderTabla();
        } catch (e) {
            console.error('Error al marcar producto', e);
            alert('No se pudo obtener la información del producto.');
        }
    }

    document.getElementById('btn-marcar-producto').addEventListener('click', marcarProducto);
    inputCodigo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            marcarProducto();
        }
    });

    
    async function pagar() {
        if (!idCajero) {
            alert('Debe seleccionar un cajero antes de vender.');
            return;
        }
        if (detalles.length === 0) {
            alert('No hay productos en la venta.');
            return;
        }

        const total = parseFloat(inputTotal.value) || 0;
        const pago = parseFloat(inputPago.value) || 0;
        if (pago < total) {
            alert('El pago del cliente es menor al total.');
            return;
        }

        const ahora = new Date();
        const fecha = ahora.toISOString().slice(0, 10); 
        const hora = ahora.toTimeString().slice(0, 8);  

        const body = {
            fecha: fecha,
            hora: hora,
            id_cajero: idCajero,
            cliente_doc: inputDocCliente.value.trim() || null,
            total: total,
            detalles: detalles.map(d => ({
                id_producto: d.id_producto,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal
            }))
        };

        try {
            const res = await fetch(API_BASE + '/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'No se pudo registrar la venta.');
                return;
            }

            const idVenta = data.data && data.data.id ? data.data.id : null;
            if (idVenta) {
                spanNumVenta.textContent = String(idVenta).padStart(4, '0');
            }

            alert('Venta registrada correctamente.');
            
            detalles = [];
            renderTabla();
            inputDocCliente.value = '';
            inputPago.value = '';
            spanCambio.textContent = '0.00';

            
            actualizarInventarioBajo();
        } catch (e) {
            console.error('Error al registrar venta', e);
            alert('No se pudo conectar con el servidor para registrar la venta.');
        }
    }

    document.getElementById('btn-pagar').addEventListener('click', pagar);
});
