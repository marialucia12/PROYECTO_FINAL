function obtenerDatosUsuario() {
    const correo = localStorage.getItem("usuario");

    const datos = { correo: correo };

    fetch("http://127.0.0.1:8000/obtener_datos_usuario", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success === "true") {
            console.log(data.data)
            mostrarDatosUsuario(data.data);
        } else {
            alert("Error: " + data.mensaje);
        }
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
        alert('Hubo un problema al obtener los datos. Intente de nuevo más tarde.');
    });
}

function mostrarDatosUsuario(usuario) {
    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('apellido').value = usuario.apellido;
    document.getElementById('identificacion').value = usuario.documento_identidad;
    document.getElementById('correo').value = usuario.correo;
    document.getElementById('telefono').value = usuario.telefono;
    document.getElementById('direccion').value = usuario.direccion;

    document.getElementById('nombreModal').value = usuario.nombre;
    document.getElementById('apellidoModal').value = usuario.apellido;
    document.getElementById('identificacionModal').value = usuario.documento_identidad;
    document.getElementById('correoModal').value = usuario.correo;
    document.getElementById('numeroModal').value = usuario.telefono;
    document.getElementById('direccionModal').value = usuario.direccion;

    document.getElementById('identificacionModal').disabled = true;
    document.getElementById('correoModal').disabled = true;
}
obtenerDatosUsuario()

function cambiarContraseña() {
    const correo = localStorage.getItem("usuario");
    const contraseñaActual = document.getElementById("contraseñaActual").value;
    const nuevaContraseña = document.getElementById("nuevaContraseña").value;
    const confirmarContraseña = document.getElementById("confirmarContraseña").value;

    if (!contraseñaActual || !nuevaContraseña || !confirmarContraseña) {
        alert("Por favor, complete todos los campos.");
        return;
    }
    if (nuevaContraseña !== confirmarContraseña) {
        alert("Las contraseñas no coinciden.");
        return;
    }
    const datos = {
        correo: correo,
        contraseñaActual: contraseñaActual,
        nuevaContraseña: nuevaContraseña
    };

    fetch("http://127.0.0.1:8000/cambiar_contra", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success === "true") {
                alert(data.mensaje);
                location.reload();
            } else {
                alert("Error: " + data.mensaje);
            }
        })
        .catch(error => {
            console.error("Error al cambiar la contraseña:", error);
            alert("Hubo un problema al cambiar la contraseña. Intente más tarde.");
        });
}



async function actualizarDatos() {
    // Obtenemos los valores de los campos del formulario
    const datos = {
        correo: document.getElementById('correoModal').value,
        nombre: document.getElementById('nombreModal').value,
        apellido: document.getElementById('apellidoModal').value,
        telefono: document.getElementById('numeroModal').value,
        direccion: document.getElementById('direccionModal').value,
        documento_identidad: document.getElementById('identificacionModal').value
    };

    // Hacemos la petición POST al backend
    const response = await fetch('http://127.0.0.1:8000/actualizar_usuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    });

    const resultado = await response.json();

    if (resultado.success === "true") {
        alert("Datos actualizados exitosamente.");
        location.reload()
    } else {
        alert("Error al actualizar los datos: " + resultado.mensaje);
    }
}


// Función para cerrar sesión
function cerrar() {
    localStorage.removeItem("usuario");
    location.href = "../../INDEX.HTML";
}