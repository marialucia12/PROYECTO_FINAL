// Datos a mano
const pedidos = [
    {
        cliente: "Carlos Mendoza",
        tipoGafa: "Lentes formulados, montura verde ",
        formulaOD: "-2.50",
        formulaOI: "-2.00",
        fechaPedido: "2024-11-01",
        estado: "Pendiente"
    },
    {
        cliente: "Ana López",
        tipoGafa: "Gafa de Sol, negras con dorado",
        formulaOD: "0.00",
        formulaOI: "0.00",
        fechaPedido: "2024-11-05",
        estado: "Listo para entregar"
    }
];

let pedidoSeleccionadoIndex = null;


function cargarPedidos() {
    const ordersTable = document.getElementById('orders-table').getElementsByTagName('tbody')[0];
    ordersTable.innerHTML = "";

    pedidos.forEach((pedido, index) => {
        const row = ordersTable.insertRow();
        row.innerHTML = `
            <td>${pedido.cliente}</td>
            <td>${pedido.tipoGafa}</td>
            <td>${pedido.formulaOD}</td>
            <td>${pedido.formulaOI}</td>
            <td>${pedido.fechaPedido}</td>
            <td id="estado-${index}">${pedido.estado}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="abrirModal(${index})">
                    <i class="fas fa-edit"></i> Cambiar Estado
                </button>
            </td>
        `;
    });
}


function abrirModal(index) {
    pedidoSeleccionadoIndex = index;
    $('#statusModal').modal('show');
}

document.getElementById('save-status').addEventListener('click', () => {
    const nuevoEstado = document.getElementById('status-select').value;
    pedidos[pedidoSeleccionadoIndex].estado = nuevoEstado;
    document.getElementById(`estado-${pedidoSeleccionadoIndex}`).innerText = nuevoEstado;
    $('#statusModal').modal('hide');
    alert("Estado del pedido actualizado correctamente.");
});

document.addEventListener('DOMContentLoaded', cargarPedidos);


function abrirModal(index) {
    pedidoSeleccionadoIndex = index;
    $('#statusModal').modal('show');
}

document.getElementById('save-status').addEventListener('click', () => {
    const nuevoEstado = document.getElementById('status-select').value;
    pedidos[pedidoSeleccionadoIndex].estado = nuevoEstado;
    document.getElementById(`estado-${pedidoSeleccionadoIndex}`).innerText = nuevoEstado;
    $('#statusModal').modal('hide');
    alert("Estado del pedido actualizado correctamente.");
});


document.addEventListener('DOMContentLoaded', cargarPedidos);


// Función para cerrar sesión
function cerrar() {
    localStorage.removeItem("usuario");
    location.href = "../../INDEX.HTML";
}
