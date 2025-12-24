const API_BASE = '';

document.addEventListener('DOMContentLoaded', () => {
    const selectCajeros = document.getElementById('lista-cajeros');
    const spanCajeroActual = document.getElementById('cajero-actual');
    const inputClave = document.getElementById('clave-cajero');
    const form = document.getElementById('form-cambiar-cajero');
    const msgError = document.getElementById('mensaje-error-cajero');
    const msgOk = document.getElementById('mensaje-ok-cajero');

    function mostrarError(texto) {
        msgError.style.display = 'flex';
        msgError.querySelector('span').textContent = texto || 'Error al cambiar de cajero.';
        msgOk.style.display = 'none';
    }

    function mostrarOk(texto) {
        msgOk.style.display = 'flex';
        msgOk.querySelector('span').textContent = texto || 'Cambio realizado.';
        msgError.style.display = 'none';
    }

    function limpiarMensajes() {
        msgError.style.display = 'none';
        msgOk.style.display = 'none';
    }


    function cargarCajeroActual() {
        const cajero = sessionStorage.getItem('cajero_activo_usuario');
        if (cajero) {
            spanCajeroActual.textContent = cajero;
        } else {
            spanCajeroActual.textContent = 'Ninguno';
        }
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

            const cajeros = data.data || [];
            selectCajeros.innerHTML = '';

            cajeros
                .filter(c => c.estado === 'activo')
                .forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.usuario;
                    opt.textContent = c.usuario + ' - ' + c.nombre;
                    selectCajeros.appendChild(opt);
                });
        } catch (err) {
            console.error(err);
            mostrarError('Error de conexión al cargar cajeros.');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarMensajes();

        const usuario = selectCajeros.value;
        const clave = inputClave.value.trim();

        if (!usuario || !clave) {
            mostrarError('Seleccione un cajero e ingrese la contraseña.');
            return;
        }

        try {
            const res = await fetch(API_BASE + '/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, clave })
            });

            const data = await res.json();

            if (!data.ok) {
                mostrarError(data.mensaje || 'Datos incorrectos o cajero inactivo.');
                return;
            }

        
            sessionStorage.setItem('cajero_activo_usuario', usuario);
            mostrarOk('Cajero cambiado correctamente. Puede volver a la pantalla de ventas.');
            cargarCajeroActual();
            inputClave.value = '';
        } catch (err) {
            console.error(err);
            mostrarError('No se pudo conectar con el servidor.');
        }
    });

    document.getElementById('btn-cancelar-cambio').addEventListener('click', () => {
        limpiarMensajes();
        inputClave.value = '';
    });


    cargarCajeroActual();
    cargarCajeros();
});
