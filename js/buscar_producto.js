const API_BASE = '';
document.addEventListener('DOMContentLoaded', () => {
    const formBuscar = document.getElementById('form-buscar-productos');
    const inputTexto = document.getElementById('buscar-texto');
    const inputCodigo = document.getElementById('buscar-codigo');
    const tablaBody = document.querySelector('#tabla-buscar-productos tbody');
    const infoSeleccion = document.getElementById('info-seleccion');

    let productos = [];
    let indiceSeleccionado = -1;

    function limpiarTabla() {
        tablaBody.innerHTML = '';
        indiceSeleccionado = -1;
        actualizarInfoSeleccion();
    }

    function actualizarInfoSeleccion() {
        if (indiceSeleccionado < 0 || !productos[indiceSeleccionado]) {
            infoSeleccion.textContent = 'Ningún producto seleccionado.';
            return;
        }
        const p = productos[indiceSeleccionado];
        infoSeleccion.textContent =
            'Seleccionado: ' + p.codigo_barras + ' - ' + p.nombre;
    }

    function renderTabla() {
        limpiarTabla();
        productos.forEach((p, index) => {
            const tr = document.createElement('tr');

            tr.dataset.index = index.toString();

            const tdId = document.createElement('td');
            tdId.textContent = p.id;

            const tdCodigo = document.createElement('td');
            tdCodigo.textContent = p.codigo_barras;

            const tdNombre = document.createElement('td');
            tdNombre.textContent = p.nombre;

            const tdCantidad = document.createElement('td');
            tdCantidad.textContent = p.cantidad;

            const tdPrecio = document.createElement('td');
            tdPrecio.textContent = p.precio_unidad;

            tr.appendChild(tdId);
            tr.appendChild(tdCodigo);
            tr.appendChild(tdNombre);
            tr.appendChild(tdCantidad);
            tr.appendChild(tdPrecio);

            tr.addEventListener('click', () => seleccionarFila(index));
            tr.addEventListener('dblclick', confirmarSeleccion);

            tablaBody.appendChild(tr);
        });
    }

    function seleccionarFila(index) {
        const filas = tablaBody.querySelectorAll('tr');
        filas.forEach(f => f.classList.remove('seleccionado'));
        const fila = tablaBody.querySelector('tr[data-index="' + index + '"]');
        if (fila) {
            fila.classList.add('seleccionado');
            indiceSeleccionado = index;
            actualizarInfoSeleccion();
        }
    }

    function moverSeleccion(delta) {
        if (productos.length === 0) return;
        if (indiceSeleccionado < 0) {
            indiceSeleccionado = 0;
        } else {
            indiceSeleccionado += delta;
            if (indiceSeleccionado < 0) indiceSeleccionado = 0;
            if (indiceSeleccionado >= productos.length) indiceSeleccionado = productos.length - 1;
        }
        seleccionarFila(indiceSeleccionado);
    }

    function confirmarSeleccion() {
        if (indiceSeleccionado < 0 || !productos[indiceSeleccionado]) return;
        const producto = productos[indiceSeleccionado];

        
        sessionStorage.setItem('producto_seleccionado_codigo', producto.codigo_barras);

        
        window.location.href = 'index.html';
    }

    async function buscarProductos(event) {
        if (event) event.preventDefault();

        const texto = inputTexto.value.trim();
        const codigo = inputCodigo.value.trim();

        const params = new URLSearchParams();
        if (texto) params.append('texto', texto);
        if (codigo) params.append('codigo', codigo);

        const url = API_BASE + '/api/productos' + (params.toString() ? '?' + params.toString() : '');

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data.ok) {
                console.error(data.mensaje || 'Error al buscar productos.');
                productos = [];
                renderTabla();
                return;
            }

            productos = data.data || [];
            renderTabla();
        } catch (err) {
            console.error('Error de conexión al buscar productos.', err);
            productos = [];
            renderTabla();
        }
    }

    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moverSeleccion(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moverSeleccion(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            confirmarSeleccion();
        }
    });

    formBuscar.addEventListener('submit', buscarProductos);

    
    buscarProductos(null);
});
