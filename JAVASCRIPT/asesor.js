
async function addUser() {
    // Obtener los valores del formulario
    const nombre = document.getElementById("addUserNombre").value.trim();
    const apellido = document.getElementById("addUserApellido").value.trim();
    const cc = document.getElementById("addUserDocumento").value.trim();
    const correo = document.getElementById("addUserCorreo").value.trim();
    const telefono = document.getElementById("addUserTelefono").value.trim();
    const direccion = document.getElementById("addUserDireccion").value.trim();
    const rol = document.getElementById("addUserRol").value.trim();

    // Validación simple
    if (!nombre || !apellido || !cc || !correo || !telefono || !direccion || !rol) {
        alert("Por favor, complete todos los campos antes de agregar un usuario.");
        return;
    }

    // Crear el objeto de datos
    const datosUsuario = {
        nombre,
        apellido,
        cc,
        correo,
        telefono,
        direccion,
        rol,
    };

    try {
        // Realizar una solicitud al servidor
        const respuesta = await fetch("http://127.0.0.1:8000/registrar_usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(datosUsuario), // Enviar datos correctamente
        });

        // Comprobar si la respuesta fue exitosa
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const resultado = await respuesta.json();

        // Manejo de la respuesta del servidor
        if (resultado.success === "true") {
            alert(resultado.mensaje);
            // Actualizar la tabla de usuarios
            actualizarTablaUsuarios(datosUsuario);

            // Cerrar el modal
            const modalElement = document.getElementById("registerClientModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modalInstance.hide();
        } else {
            alert(resultado.mensaje || "Hubo un problema al registrar el usuario.");
        }
    } catch (error) {
        console.error("Error al agregar el usuario:", error);
        alert("Hubo un problema al agregar el usuario. Inténtelo de nuevo más tarde.");
    }
}

function filtrarCitas() {
    const filtro = document.getElementById("searchDocument").value.toLowerCase();
    const filas = document.querySelectorAll("tbody tr");

    filas.forEach(fila => {
        const documento = fila.cells[0].textContent.toLowerCase();
        fila.style.display = documento.includes(filtro) ? "" : "none";
    });
}

// Eventos
document.getElementById("searchDocument").addEventListener("input", filtrarCitas);

document.addEventListener("DOMContentLoaded", async function () {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
        location.href = "../../INDEX.HTML";
        return;
    }

    async function obtenerCitasDia() {
        try {
            const response = await fetch('http://127.0.0.1:8000/get_citas_dia');
            const data = await response.json();

            if (data.success) {
                mostrarCitas(data.citas);
            } else {
                alert(`Error: ${data.mensaje}`);
            }
        } catch (error) {
            console.error("Error al obtener las citas del día:", error);
            alert("Hubo un error al obtener las citas.");
        }
    }

    function mostrarCitas(citas) {
        const citasDiaTable = document.querySelector("tbody");
        citasDiaTable.innerHTML = ""; // Limpiar la tabla

        citas.forEach(cita => {
            const filaHTML = `
                <tr>
                    <td>${cita.documento}</td>
                    <td>${cita.nombre_completo}</td>
                    <td>
                        <button class="btn btn-success btn-sm justify-content-center" onclick="confirmarCita('${cita.documento}')">
                            <i class="bi bi-check-circle"></i> Confirmar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="cancelarCita('${cita.documento}')">
                            <i class="bi bi-x-circle"></i> Cancelar
                        </button>
                    </td>
                </tr>`;
            citasDiaTable.insertAdjacentHTML('beforeend', filaHTML);
        });
    }

    function filtrarCitas() {
        const filtro = document.getElementById("searchDocument").value.toLowerCase();
        const filas = document.querySelectorAll("tbody tr");

        filas.forEach(fila => {
            const documento = fila.cells[0].textContent.toLowerCase();
            fila.style.display = documento.includes(filtro) ? "" : "none";
        });
    }

    // Eventos
    document.getElementById("searchDocument").addEventListener("input", filtrarCitas);

    // Funciones de acción
    window.confirmarCita = (documento) => {
        alert(`Cita confirmada para el documento: ${documento}`);
        // Aquí puedes realizar la llamada al backend para confirmar la cita
    };

    window.cancelarCita = (documento) => {
        alert(`Cita cancelada para el documento: ${documento}`);
        // Aquí puedes realizar la llamada al backend para cancelar la cita
    };

    // Cargar citas del día al cargar la página
    await obtenerCitasDia();
});





async function cancelarCita(citaId) {
    try {
        // Validar que citaId sea un número
        if (!Number.isInteger(citaId)) {
            throw new Error("El ID de la cita no es válido.");
        }

        // Llamar al endpoint de eliminación
        const response = await fetch(`http://127.0.0.1:8000/eliminar_cita/${citaId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert("Cita cancelada exitosamente.");
            obtenerCitasDia(); // Actualizar la tabla
        } else {
            alert("Error al cancelar cita: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error al cancelar la cita:", error);
        alert("No se pudo cancelar la cita. Inténtalo más tarde.");
    }
}




// Función para cerrar sesión
function cerrar() {
    localStorage.removeItem("usuario");
    location.href = "../../INDEX.HTML";
}