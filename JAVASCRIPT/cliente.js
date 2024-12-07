async function solicitarCita() {
    // Obtenemos los valores necesarios para la solicitud
    const documento = document.getElementById("documento").value; // Asegúrate de tener un campo con este ID
    const fecha = document.getElementById("fecha").value; // Asegúrate de tener un campo con este ID
    const tipoCita = document.getElementById("tipoCita").value; // Asegúrate de tener un campo con este ID

    // Verificamos que los valores no estén vacíos
    if (!documento || !fecha || !tipoCita) {
        alert("Por favor completa todos los campos antes de enviar la solicitud.");
        return;
    }

    // Creamos el objeto 'datos'
    const datos = {
        documento: documento,
        fecha: fecha,
        tipoCita: tipoCita
    };

    try {
        fetch("http://127.0.0.1:8000/crear_cita", {
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
                } else {
                    alert(data.mensaje);
                } 
            })
            .catch(error => {
                console.error('Error al registrar:', error);
                alert('Hubo un problema con el inicio. Intente de nuevo más tarde.');
            });
    } catch (error) {
        console.error("Error al realizar la solicitud:", error);
        alert("Hubo un error al procesar la solicitud. Por favor, intenta de nuevo.");
    }
}

function mostrarModalResultados() {
    const correoUsuario = localStorage.getItem("usuario");

    if (!correoUsuario) {
        alert("Por favor, inicie sesión primero.");
        return;
    }

    fetch(`http://127.0.0.1:8000/get_resultados/${correoUsuario}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const resultados = data.resultados;
                document.getElementById('contenidoModalResultados').innerHTML = `
                    <p><strong>Diagnóstico:</strong> ${resultados.diagnostico}</p>
                    <p><strong>Receta de Gafas:</strong> ${resultados.receta_gafas}</p>
                    <p><strong>Paciente:</strong> ${resultados.nombre_paciente}</p>
                    <p><strong>Doctor Asignado:</strong> ${resultados.nombre_doctor}</p>
                    <p><strong>Fecha del Examen:</strong> ${new Date(resultados.fecha).toLocaleDateString()}</p>
                `;
            } else {
                document.getElementById('contenidoModalResultados').innerHTML = `
                    <p>${data.mensaje}</p>
                `;
            }

            const modal = new bootstrap.Modal(document.getElementById('modalResultados'));
            modal.show();
        })
        .catch(error => {
            console.error("Error al obtener los resultados:", error);
            alert("No se pudo cargar los resultados.");
        });
}


document.addEventListener('DOMContentLoaded', function () {
    obtenerInformacionCita();
  });

  async function obtenerInformacionCita() {
    try {
      const correoUsuario = localStorage.getItem("usuario"); // Obtener el correo del usuario desde localStorage

      if (!correoUsuario) {
        alert("Por favor, inicia sesión para ver la información de tu cita.");
        document.getElementById('fechaCita').innerText = "No estás autenticado.";
        document.getElementById('doctorAsignado').innerText = "-";
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/get_cita_info/${correoUsuario}`);
      const data = await response.json();

      if (data.success) {
        // Formatear fecha al estilo local para mejor experiencia de usuario
        const fecha = new Date(data.cita.fecha_cita).toLocaleDateString();
        document.getElementById('fechaCita').innerText = fecha;
        document.getElementById('doctorAsignado').innerText = data.cita.doctor_asignado;
      } else {
        document.getElementById('fechaCita').innerText = "No tienes citas pendientes.";
        document.getElementById('doctorAsignado').innerText = "-";
      }
    } catch (error) {
      console.error("Error al obtener información de la cita:", error);
      alert("No se pudo cargar la información de la cita.");
      document.getElementById('fechaCita').innerText = "Error al cargar.";
      document.getElementById('doctorAsignado').innerText = "-";
    }
  }

// Función para cerrar sesión
function cerrar() {
    localStorage.removeItem("usuario");
    location.href = "../../INDEX.HTML";
}



