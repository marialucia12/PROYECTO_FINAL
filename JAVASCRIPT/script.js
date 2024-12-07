console.log("xd");
function registrase() {
    nombre = document.getElementById('username').value
    apellido = document.getElementById('lastname').value
    cc = document.getElementById('usercc').value
    correo = document.getElementById('email').value
    telefono = document.getElementById('numero').value
    direccion = document.getElementById('direccion').value
    contraseña1 = document.getElementById('password').value
    contraseña2 = document.getElementById('confirm-password').value

    if (nombre === "" || apellido === "" || cc === "" || correo === "" || numero === "" || contraseña1 === "" || contraseña2 === "") {
        alert("Por favor, complete todos los campos.");
        return;
    }
    if (contraseña1 != contraseña2) {
        alert('confirme las contraseñas')
        return
    }

    const datos = {
        nombre: nombre,
        apellido: apellido,
        cc: cc,
        correo: correo,
        telefono: telefono,
        direccion: direccion,
        contraseña: contraseña1
    };

    // Enviar la solicitud POST a la API
    fetch("http://127.0.0.1:8000/registrar", {
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
                location.href = "login.html"
            } else {
                alert("Error: " + data.mensaje);
            }
        })
        .catch(error => {
            console.error('Error al registrar:', error);
            alert('Hubo un problema con el registro. Intente de nuevo más tarde.');
        });

    console.log('Datos enviados:', datos);
}


function iniciar() {
    usuario = document.getElementById('username').value
    contraseña = document.getElementById('password').value

    if (usuario === "" || contraseña === "") {
        alert("Por favor, complete todos los campos.");
        return;
    }
    const datos = {
        usuario: usuario,
        contraseña: contraseña
    }

    fetch("http://127.0.0.1:8000/iniciar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success === "true") {
                localStorage.setItem("usuario", usuario);
                alert(data.mensaje);
                if (data.roll === "cliente") {
                    location.href = "../HTML/cliente/cliente.html"
                }
                if (data.roll === "doctor") {
                    location.href = "../HTML/doctor/doctor.html"
                }
                if (data.roll === "asesor") {
                    location.href = "../HTML/asesor/asesor.html"
                }
                if (data.roll === "admin") {
                    location.href = "../HTML/admin/vistaAdmin.html"
                }
            } else {
                alert("Error: " + data.mensaje);
            }
        })
        .catch(error => {
            console.error('Error al registrar:', error);
            alert('Hubo un problema con el inicio. Intente de nuevo más tarde.');
        });

    console.log('Datos enviados:', datos);
}


// Modal recuperacion de contraseña 
function mostrarRecuperarContrasena() {
    $('#modal-recuperar').modal('show');
}

function recuperarContrasena() {
    const email = document.getElementById('email-recuperacion').value;
    const datos = {
        email: email
    }
    fetch("http://127.0.0.1:8000/recuperar_cuenta", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success === "true") {
                alert(data.mensaje)
            } else {
                alert("Error: " + data.mensaje);
            }
        })
        .catch(error => {
            console.error('Error al registrar:', error);
            alert('Hubo un problema con el inicio. Intente de nuevo más tarde.');
        });
}


function cerrar() {
    localStorage.removeItem("usuario");
    location.href = "../../INDEX.HTML";
    }

    

// // Mostrar u ocultar el campo de fórmula según la selección
// document.getElementById('necesitaGafas').addEventListener('change', function () {
//     const formulaContainer = document.getElementById('formulaContainer');
//     formulaContainer.classList.toggle('d-none', this.value !== 'si');
// });

// // Redirigir si no hay usuario
// const usuario = localStorage.getItem("usuario");
// if (!usuario) {
//     location.href = "../../INDEX.HTML";
// }




  
