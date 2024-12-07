const userTable = document.getElementById("userTable");

// Función para obtener usuarios desde la API
async function fetchUsuarios() {
    try {
        const response = await fetch("http://127.0.0.1:8000/obtener_usuarios");
        const data = await response.json();

        if (data.success === "true") {
            renderTable(data.data);
        } else {
            alert("No se pudieron obtener los usuarios: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        alert("Error al obtener usuarios.");
    }
}

// Renderizar la tabla con los usuarios
function renderTable(usuarios) {
    userTable.innerHTML = "";  // Limpiar la tabla antes de agregar los datos
    usuarios.forEach((usuario, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${usuario.nombre}</td>
            <td>${usuario.correo}</td>
            <td>${usuario.documento_identidad}</td>
            <td>${usuario.nombre_rol || "Sin rol"}</td>
            <td>
    <button class="btn btn-primary btn-sm" 
        onclick="showEditUserModal(this)" 
        data-usuario='${JSON.stringify(usuario)}'>
        Editar
    </button>
</td>

        `;
        userTable.appendChild(row);
    });
}

// Llamar a la función al cargar la página
document.addEventListener("DOMContentLoaded", fetchUsuarios);

// Función para mostrar el modal de agregar usuario
function showAddUserModal() {
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

// Función para mostrar el modal de editar usuario
function showEditUserModal(button) {
    const usuario = JSON.parse(button.getAttribute('data-usuario')); // Recuperamos el objeto usuario desde el atributo data-usuario

    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();

    // Rellenar los campos del modal con la información del usuario seleccionado
    document.getElementById('editUserNombre').value = usuario.nombre || '';
    document.getElementById('editUserApellido').value = usuario.apellido || '';
    document.getElementById('editUserCorreo').value = usuario.correo || '';
    document.getElementById('editUserTelefono').value = usuario.telefono || ''; // Si no hay teléfono, dejar vacío
    document.getElementById('editUserDireccion').value = usuario.direccion || ''; // Si no hay dirección, dejar vacío
    document.getElementById('editUserRol').value = usuario.nombre_rol || ''; // Si no hay rol, dejar vacío
}

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
        nombre: nombre,
        apellido: apellido,
        cc: cc,
        correo: correo,
        telefono: telefono,
        direccion: direccion,
        rol: rol
    };

    try {
        // Realizar una solicitud al servidor para agregar el usuario
        const respuesta = await fetch('http://127.0.0.1:8000/registrar_usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosUsuario)
        });

        const resultado = await respuesta.json();

        if (resultado.success === "true") {
            alert(resultado.mensaje); // Mostrar mensaje de éxito
            document.getElementById("addUserForm").reset();
            // Opcional: Actualizar la tabla de usuarios (puedes implementar esta función)
            // actualizarTablaUsuarios();
        } else {
            alert(resultado.mensaje); // Mostrar mensaje de error
        }
    } catch (error) {
        console.error("Error al agregar el usuario:", error);
        alert("Hubo un problema al agregar el usuario. Inténtelo de nuevo más tarde.");
    }
}

async function saveUser() {
    // Obtener los valores del formulario
    const nombre = document.getElementById("editUserNombre").value.trim();
    const apellido = document.getElementById("editUserApellido").value.trim();
    const correo = document.getElementById("editUserCorreo").value.trim();
    const telefono = document.getElementById("editUserTelefono").value.trim();
    const direccion = document.getElementById("editUserDireccion").value.trim();
    const rol = document.getElementById("editUserRol").value.trim();

    // Validación simple
    if (!nombre || !apellido || !correo || !telefono || !direccion || !rol) {
        alert("Por favor, complete todos los campos antes de guardar.");
        return;
    }

    // Crear el objeto de datos
    const datosUsuario = {
        nombre: nombre,
        apellido: apellido,
        correo: correo,
        telefono: telefono,
        direccion: direccion,
        rol: rol
    };

    try {
        // Realizar una solicitud al servidor para guardar los datos del usuario
        const respuesta = await fetch('http://127.0.0.1:8000/actualizar_usuario', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosUsuario)
        });

        const resultado = await respuesta.json();

        if (resultado.success === "true") {
            alert(resultado.mensaje); // Mostrar mensaje de éxito
            // Opcional: cerrar el modal o actualizar la tabla de usuarios
            window.location.reload()

        } else {
            alert("Error: " + resultado.mensaje); // Mostrar mensaje de error
        }
    } catch (error) {
        console.error("Error al guardar los datos del usuario:", error);
        alert("Hubo un problema al guardar los datos. Inténtelo de nuevo más tarde.");
    }
}


// Función para cerrar sesión
    function cerrar() {
    localStorage.removeItem("usuario");
    location.href = "../../INDEX.HTML";
}
