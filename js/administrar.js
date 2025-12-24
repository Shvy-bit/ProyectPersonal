const API_BASE = '';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login-admin');
    const inputUsuario = document.getElementById('admin-usuario');
    const inputClave = document.getElementById('admin-clave');
    const mensajeError = document.getElementById('mensaje-error-login');

    function mostrarError(texto) {
        mensajeError.style.display = 'flex';
        mensajeError.querySelector('span').textContent = texto || 'Error al iniciar sesión.';
    }

    function ocultarError() {
        mensajeError.style.display = 'none';
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        ocultarError();

        const usuario = inputUsuario.value.trim();
        const clave = inputClave.value.trim();

        if (!usuario || !clave) {
            mostrarError('Debe ingresar usuario y contraseña.');
            return;
        }

        const payload = { usuario, clave };

        try {
            const res = await fetch(API_BASE + '/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!data.ok) {
                mostrarError(data.mensaje || 'Usuario o contraseña incorrectos.');
                return;
            }
            window.location.href = 'admin_cajeros.html';
        } catch (err) {
            console.error(err);
            mostrarError('No se pudo conectar con el servidor.');
        }
    });
});
