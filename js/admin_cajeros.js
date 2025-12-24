const API_BASE = '';

document.addEventListener('DOMContentLoaded', () => {
    const tablaBody = document.querySelector('#tabla-cajeros tbody');
    const totalCajerosSpan = document.getElementById('total-cajeros');

    const form = document.getElementById('form-cajero');
    const tituloForm = document.getElementById('titulo-form-cajero');

    const inputId = document.getElementById('cajero-id');
    const inputUsuario = document.getElementById('cajero-usuario');
    const inputNombre = document.getElementById('cajero-nombre');
    const inputClave = document.getElementById('cajero-clave');
    const selectEstado = document.getElementById('cajero-estado');

    const btnNuevo = document.getElementById('btn-nuevo-cajero');
    const btnCancelar = document.getElementById('btn-cancelar-edicion');

    const msgError = document.getElementById('mensaje-error-cajero');
    const msgErrorTexto = document.getElementById('texto-error-cajero');
    const msgOk = document.getElementById('mensaje-ok-cajero');
    const msgOkTexto = document.getElementById('texto-ok-cajero');

    let cajeros = [];
    let cajeroSeleccionadoId = null;


    function mostrarError(texto) {
        msgErrorTexto.textContent = texto || 'Ocurrió un error.';
        msgError.style.display = 'flex';
        msgOk.style.display = 'none';
    }

    function mostrarOk(texto) {
        msgOkTexto.textContent = texto || 'Operación realizada correctamente.';
        msgOk.style.display = 'flex';
        msgError.style.display = 'none';
    }

    function limpiarMensajes() {
        msgError.style.display = 'none';
        msgOk.style.display = 'none';
    }


    async function cargarCajeros() {
        limpiarMensajes();
        try {
            const res = await fetch(API_BASE + '/api/cajeros');
            const data = await res.json();

            if (!data.ok) {
                mostrarError(data.mensaje || 'No se pudo obtener la lista de cajeros.');
                return;
            }

            cajeros = data.data || [];
            renderTablaCajeros();
        } catch (err) {
            mostrarError('Error de conexión al obtener cajeros.');
            console.error(err);
        }
    }


    function renderTablaCajeros() {
        tablaBody.innerHTML = '';

        cajeros.forEach(cajero => {
            const tr = document.createElement('tr');

            const tdId = document.createElement('td');
            tdId.textContent = cajero.id;

            const tdUsuario = document.createElement('td');
            tdUsuario.textContent = cajero.usuario;

            const tdNombre = document.createElement('td');
            tdNombre.textContent = cajero.nombre;

            const tdEstado = document.createElement('td');
            tdEstado.textContent = cajero.estado === 'activo' ? 'Activo' : 'Inactivo';

            const tdAcciones = document.createElement('td');

            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.classList.add('btn-accion');
            btnEditar.addEventListener('click', () => editarCajero(cajero));

            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.classList.add('btn-accion');
            btnEliminar.addEventListener('click', () => eliminarCajero(cajero));

            tdAcciones.appendChild(btnEditar);
            tdAcciones.appendChild(btnEliminar);

            tr.appendChild(tdId);
            tr.appendChild(tdUsuario);
            tr.appendChild(tdNombre);
            tr.appendChild(tdEstado);
            tr.appendChild(tdAcciones);

            tablaBody.appendChild(tr);
        });

        totalCajerosSpan.textContent = cajeros.length.toString();
    }


    function prepararNuevoCajero() {
        limpiarMensajes();
        cajeroSeleccionadoId = null;
        inputId.value = '';
        inputUsuario.value = '';
        inputNombre.value = '';
        inputClave.value = '';
        selectEstado.value = 'activo';
        tituloForm.textContent = 'Nuevo cajero';
    }


    function editarCajero(cajero) {
        limpiarMensajes();
        cajeroSeleccionadoId = cajero.id;
        inputId.value = cajero.id;
        inputUsuario.value = cajero.usuario;
        inputNombre.value = cajero.nombre;
        inputClave.value = '';
        selectEstado.value = cajero.estado;
        tituloForm.textContent = 'Editar cajero';
    }


    async function guardarCajero(event) {
        event.preventDefault();
        limpiarMensajes();

        const payload = {
            usuario: inputUsuario.value.trim(),
            nombre: inputNombre.value.trim(),
            estado: selectEstado.value
        };

        if (!payload.usuario || !payload.nombre) {
            mostrarError('Usuario y nombre son obligatorios.');
            return;
        }

    
        const clave = inputClave.value.trim();
        if (clave) {
            payload.clave = clave;
        }

        let url = API_BASE + '/api/cajeros';
        let method = 'POST';

        if (cajeroSeleccionadoId) {
            url = API_BASE + '/api/cajeros/' + encodeURIComponent(cajeroSeleccionadoId);
            method = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.ok) {
                mostrarError(data.mensaje || 'No se pudo guardar el cajero.');
                return;
            }

            mostrarOk('Cajero guardado correctamente.');
            prepararNuevoCajero();
            await cargarCajeros();
        } catch (err) {
            mostrarError('Error de conexión al guardar el cajero.');
            console.error(err);
        }
    }


    async function eliminarCajero(cajero) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar al cajero "' + cajero.nombre + '"?'
        );
        if (!confirmar) return;

        limpiarMensajes();

        const url = API_BASE + '/api/cajeros/' + encodeURIComponent(cajero.id);

        try {
            const res = await fetch(url, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!data.ok) {
                mostrarError(data.mensaje || 'No se pudo eliminar el cajero.');
                return;
            }

            mostrarOk('Cajero eliminado correctamente.');
            await cargarCajeros();
        } catch (err) {
            mostrarError('Error de conexión al eliminar el cajero.');
            console.error(err);
        }
    }


    form.addEventListener('submit', guardarCajero);
    btnNuevo.addEventListener('click', prepararNuevoCajero);
    btnCancelar.addEventListener('click', prepararNuevoCajero);


    prepararNuevoCajero();
    cargarCajeros();
});
