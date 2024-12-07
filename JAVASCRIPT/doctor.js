document.addEventListener("DOMContentLoaded", function() {
    // Verificar si el usuario está autenticado
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
        location.href = "../../INDEX.HTML";  // Redirigir si no está autenticado
    }

    // Función para obtener las citas del día
    function obtenerCitasDia() {
        fetch('http://127.0.0.1:8000/get_citas_dia')  // Realizamos la solicitud GET al endpoint
            .then(response => response.json())  // Convertimos la respuesta a JSON
            .then(data => {
                console.log(data);

                if (data.success) {
                    // Procesar citas pendientes
                    const citas = data.citas;
                    const citasDiaTable = document.querySelector("tbody");
                    citasDiaTable.innerHTML = "";  // Limpiar la tabla antes de agregar nuevas filas

                    // Recorrer las citas y agregarlas a la tabla
                    citas.forEach(cita => {
                        const tr = document.createElement("tr");

                        // Crear celdas con la información de cada cita
                        const tdDocumento = document.createElement("td");
                        tdDocumento.textContent = cita.documento;

                        const tdNombre = document.createElement("td");
                        tdNombre.textContent = cita.nombre_completo;

                        const tdAcciones = document.createElement("td");
                        const btnResultados = document.createElement("button");
                        btnResultados.className = "btn btn-outline-primary btn-sm";
                        btnResultados.setAttribute("data-bs-toggle", "modal");
                        btnResultados.setAttribute("data-bs-target", "#modalResultado");
                        btnResultados.innerHTML = '<i class="bi bi-pencil"></i> Resultados';
                        tdAcciones.appendChild(btnResultados);

                        // Agregar las celdas a la fila
                        tr.appendChild(tdDocumento);
                        tr.appendChild(tdNombre);
                        tr.appendChild(tdAcciones);

                        // Agregar la fila a la tabla
                        citasDiaTable.appendChild(tr);
                    });
                } else {
                    alert("Error: " + data.mensaje);  // Mostrar mensaje de error si no hay citas
                }
            })
            .catch(error => {
                console.error("Error al obtener las citas del día:", error);
                alert("Hubo un error al obtener las citas.");
            });
    }

    // Llamar la función para cargar las citas del día al cargar la página
    obtenerCitasDia();
});

// Función para guardar los resultados
function guardar() {
    // Obtener valores de los campos de formulario
    const dianotico = document.getElementById('necesitaGafas')?.value.trim(); 
    const ojo_derecho = document.getElementById('formula_derecho')?.value.trim();
    const ojo_izquierdo = document.getElementById('formula_izquierda')?.value.trim();
    const recomendaciones = document.getElementById('recomendaciones')?.value.trim();
    
    if (!dianotico || !ojo_derecho || !ojo_izquierdo || !recomendaciones) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    // Recuperar el usuario del localStorage
    const usuario = localStorage.getItem("usuario");

    // Datos a enviar en la solicitud POST
    const datos = {
        usuario: usuario,
        dianotico: dianotico,
        ojo_derecho: ojo_derecho,
        ojo_izquierdo: ojo_izquierdo,
        recomendaciones: recomendaciones
    };

    try {
        // Realizar la solicitud POST para guardar los resultados
        fetch("http://127.0.0.1:8000/guardar_resultado", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success === "true") {
                alert(data.mensaje);  // Mostrar mensaje de éxito
            } else {
                alert(data.mensaje);  // Mostrar mensaje de error
            }
        })
        .catch(error => {
            console.error('Error al registrar:', error);
            alert('Hubo un problema con el registro. Intente de nuevo más tarde.');
        });
    } catch (error) {
        console.error("Error al realizar la solicitud:", error);
        alert("Hubo un error al procesar la solicitud. Por favor, intenta de nuevo.");
    }
}

// Función para cerrar sesión
function cerrar() {
    localStorage.removeItem("usuario");
    location.href = "../../INDEX.HTML";  // Redirigir al inicio
}
