const API_BASE = '';

document.addEventListener('DOMContentLoaded', () => {
    const formFiltros = document.getElementById('form-filtros-inventario');
    const inputNombre = document.getElementById('filtro-buscar-nombre');
    const inputCodigo = document.getElementById('filtro-buscar-codigo');
    const chkBajo = document.getElementById('filtro-inventario-bajo');

    const tablaBody = document.querySelector('#tabla-inventario tbody');
    const spanTotal = document.getElementById('total-productos-mostrados');

    const btnAgregar = document.getElementById('btn-agregar-producto');
    const btnEditar = document.getElementById('btn-editar-producto');
    const btnEliminar = document.getElementById('btn-eliminar-producto');

    let productos = [];
    let idSeleccionado = null;

    function limpiarSeleccion() {
        idSeleccionado = null;
        const filas = tablaBody.querySelectorAll('tr');
        filas.forEach(f => f.classList.remove('seleccionado'));
    }

    function seleccionarFila(id) {
        idSeleccionado = id;
        const filas = tablaBody.querySelectorAll('tr');
        filas.forEach(f => {
            if (parseInt(f.dataset.id, 10) === id) {
                f.classList.add('seleccionado');
            } else {
                f.classList.remove('seleccionado');
            }
        });
    }

    function renderTabla() {
        tablaBody.innerHTML = '';

        productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.dataset.id = p.id;

            if (p.cantidad <= p.cantidad_minima) {
                tr.classList.add('inventario-bajo');
            }

            const tdId = document.createElement('td');
            tdId.textContent = p.id;

            const tdCodigo = document.createElement('td');
            tdCodigo.textContent = p.codigo_barras;

            const tdNombre = document.createElement('td');
            tdNombre.textContent = p.nombre;

            const tdCant = document.createElement('td');
            tdCant.textContent = p.cantidad;

            const tdMin = document.createElement('td');
            tdMin.textContent = p.cantidad_minima;

            const tdPrecio = document.createElement('td');
            tdPrecio.textContent = p.precio_unidad;

            const tdAcciones = document.createElement('td');
            tdAcciones.textContent = 'Doble clic para editar';

            tr.appendChild(tdId);
            tr.appendChild(tdCodigo);
            tr.appendChild(tdNombre);
            tr.appendChild(tdCant);
            tr.appendChild(tdMin);
            tr.appendChild(tdPrecio);
            tr.appendChild(tdAcciones);

            tr.addEventListener('click', () => seleccionarFila(p.id));
            tr.addEventListener('dblclick', () => irAEditarProducto(p.id));

            tablaBody.appendChild(tr);
        });

        spanTotal.textContent = productos.length.toString();
    }

    async function cargarProductos(event) {
        if (event) event.preventDefault();

        const params = new URLSearchParams();
        const texto = inputNombre.value.trim();
        const codigo = inputCodigo.value.trim();

        if (texto) params.append('texto', texto);
        if (codigo) params.append('codigo', codigo);

        const url = API_BASE + '/api/productos' + (params.toString() ? '?' + params.toString() : '');

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data.ok) {
                console.error(data.mensaje || 'Error al obtener productos.');
                productos = [];
            } else {
                productos = data.data || [];
            }

            if (chkBajo.checked) {
                productos = productos.filter(p => p.cantidad <= p.cantidad_minima);
            }

            limpiarSeleccion();
            renderTabla();
        } catch (err) {
            console.error('Error de conexión al obtener productos.', err);
            productos = [];
            limpiarSeleccion();
            renderTabla();
        }
    }

    function irAAgregarProducto() {
        
        window.location.href = 'producto_form.html';
    }

    function irAEditarProducto(id) {
        if (!id) return;
        
        window.location.href = 'producto_form.html?id=' + encodeURIComponent(id);
    }

    async function eliminarProductoSeleccionado() {
        if (!idSeleccionado) {
            alert('Primero seleccione un producto en la tabla.');
            return;
        }

        const prod = productos.find(p => p.id === idSeleccionado);
        const nombre = prod ? prod.nombre : idSeleccionado;

        const confirmar = window.confirm('¿Eliminar el producto "' + nombre + '"?');
        if (!confirmar) return;

        try {
            const res = await fetch(API_BASE + '/api/productos/' + encodeURIComponent(idSeleccionado), {
                method: 'DELETE'
            });
            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'No se pudo eliminar el producto.');
                return;
            }

            alert('Producto eliminado correctamente.');
            await cargarProductos(null);
        } catch (err) {
            console.error('Error al eliminar producto.', err);
            alert('No se pudo conectar con el servidor.');
        }
    }

    
    formFiltros.addEventListener('submit', cargarProductos);
    formFiltros.addEventListener('reset', () => {
        setTimeout(() => cargarProductos(null), 0);
    });

    chkBajo.addEventListener('change', () => cargarProductos(null));

    btnAgregar.addEventListener('click', irAAgregarProducto);
    btnEditar.addEventListener('click', () => {
        if (!idSeleccionado) {
            alert('Primero seleccione un producto en la tabla.');
            return;
        }
        irAEditarProducto(idSeleccionado);
    });
    btnEliminar.addEventListener('click', eliminarProductoSeleccionado);

    
    cargarProductos(null);
});
