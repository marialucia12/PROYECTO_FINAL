from fastapi import FastAPI, Request,Response
from fastapi.middleware.cors import CORSMiddleware
import jwt
import urllib
import uvicorn
import os
from dotenv import load_dotenv
import mysql.connector
import bcrypt
import random
import string
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO
import pytz 
from datetime import datetime
from reportlab.pdfgen import canvas




zona_horaria = pytz.timezone("America/Bogota")
fecha_actual = datetime.now(zona_horaria)
print(fecha_actual)


app = FastAPI()
# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#credenciales base de datos
load_dotenv()

SECRET_KEY = "fsdfsdfsdfsdfs"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

@app.post("/generate_token")
async def generate_token(username: str, password: str):
    if username == "admin" and password == "123456":
        access_token_expires = timedelta(minutes=5)
        access_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token}
    else:
        return {"message": "Credenciales incorrectas"}


@app.post("/verify_token")
async def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return {"message": "Token válido"}
    except jwt.ExpiredSignatureError:
        return {"message": "Token expirado"}
    except jwt.InvalidTokenError:
        return {"message": "Token inválido"}



DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'port': os.getenv('DB_PORT', 3306)
}

@app.post("/registrar")
async def registrar(request: Request):
    datos = await request.json()
    nombre = datos.get('nombre')
    apellido = datos.get('apellido')
    cc = datos.get('cc')
    correo = datos.get('correo')
    telefono = datos.get('telefono')
    direccion = datos.get('direccion')
    contraseña = datos.get('contraseña')

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM usuarios WHERE correo=%s', (correo,))
        if cursor.fetchone() is not None:
            cursor.close()
            conn.close()
            return {"success": "false", "mensaje": "Los datos ya se encuentran registrados"}
        else:
            cursor.execute('INSERT INTO roll (nombre_rol, correo) VALUES (%s, %s)', ("cliente", correo))
            roll_id = cursor.lastrowid
            
            # Encriptando la contraseña
            salt = bcrypt.gensalt()
            contraseña_hashed = bcrypt.hashpw(contraseña.encode('utf-8'), salt)

            cursor.execute('INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, documento_identidad, rol_id, contraseña) '
                        'VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
                        (nombre, apellido, correo, telefono, direccion, cc, roll_id, contraseña_hashed.decode('utf-8')))
            
            conn.commit()
            cursor.close()
            conn.close()
            return {"success": "true", "mensaje": "Se ha registrado de manera exitosa"}
    except mysql.connector.Error as err:
        print(str(err))
        return {"success": "false", "mensaje": "Error en la base de datos, inténtelo más tarde."}
    finally:
        cursor.close()
        conn.close()

@app.post("/iniciar")
async def iniciar_sesion(request: Request):
    datos = await request.json()
    usuario = datos.get('usuario')
    contraseña = datos.get('contraseña')

    try:
        # Conexión a la base de datos
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)  # Devuelve resultados como diccionario

        # Buscar el usuario en la tabla usuarios
        cursor.execute('SELECT id, contraseña, rol_id FROM usuarios WHERE correo = %s', (usuario,))
        resultado_usuario = cursor.fetchone()

        if resultado_usuario:
            # Comparar la contraseña
            if bcrypt.checkpw(contraseña.encode('utf-8'), resultado_usuario['contraseña'].encode('utf-8')):
                # Obtener el nombre del rol
                cursor.execute('SELECT nombre_rol FROM roll WHERE id = %s', (resultado_usuario['rol_id'],))
                resultado_rol = cursor.fetchone()

                if resultado_rol:
                    return {
                        "success": "true",
                        "mensaje": f"Bienvenido {usuario}",
                        "roll": resultado_rol['nombre_rol'],
                        "usuario_id": resultado_usuario['id']  # Devuelve el ID para usar en el frontend
                    }
                else:
                    return {"success": "false", "mensaje": "Error al obtener el rol del usuario."}
            else:
                return {"success": "false", "mensaje": "Correo o contraseña incorrectos."}
        else:
            return {"success": "false", "mensaje": "Correo o contraseña incorrectos."}

    except mysql.connector.Error as err:
        print(f"Error al conectar a la base de datos: {err}")
        return {"success": "false", "mensaje": "Error interno en el servidor."}
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



@app.post("/obtener_datos_usuario")
async def obtener_datos_usuario(request: Request):
    datos = await request.json()
    correo = datos.get("correo")

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            'SELECT nombre, apellido, documento_identidad, correo, telefono, direccion FROM usuarios WHERE correo=%s',
            (correo,)
        )
        usuario = cursor.fetchone()
        cursor.close()
        conn.close()

        if usuario:
            return {"success": "true", "data": usuario}
        else:
            return {"success": "false", "mensaje": "Usuario no encontrado."}
    except mysql.connector.Error as err:
        print(str(err))
        return {"success": "false", "mensaje": "Error en la base de datos, inténtelo más tarde."}
    finally:
        cursor.close()
        conn.close()


@app.post("/cambiar_contra")
async def cambiar_contra(request: Request):
    datos = await request.json()
    correo = datos.get("correo")
    contraseña_actual = datos.get("contraseñaActual")
    nueva_contraseña = datos.get("nuevaContraseña")

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM usuarios WHERE correo = %s", (correo,))
        usuario = cursor.fetchone()

        if usuario is None or usuario[8] is None:
            return {"success": "false", "mensaje": "Usuario no encontrado o contraseña no establecida."}
        
        # Verificar si la contraseña actual es correcta
        if not bcrypt.checkpw(contraseña_actual.encode('utf-8'), usuario[8].encode('utf-8')):
            return {"success": "false", "mensaje": "La contraseña actual es incorrecta."}

        # Encriptando la nueva contraseña
        salt = bcrypt.gensalt()
        nueva_contraseña_hashed = bcrypt.hashpw(nueva_contraseña.encode('utf-8'), salt)

        cursor.execute(
            "UPDATE usuarios SET contraseña = %s WHERE correo = %s",
            (nueva_contraseña_hashed.decode('utf-8'), correo)  # Nueva contraseña encriptada
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"success": "true", "mensaje": "Contraseña actualizada exitosamente."}
    except mysql.connector.Error as err:
        print(str(err))
        return {"success": "false", "mensaje": "Error en la base de datos, inténtelo más tarde."}
    finally:
        cursor.close()
        conn.close()


@app.post("/actualizar_usuario")
async def actualizar_usuario(request: Request):
    datos = await request.json()
    correo = datos.get("correo")
    nuevo_nombre = datos.get("nombre")
    nuevo_apellido = datos.get("apellido")
    nuevo_telefono = datos.get("telefono")
    nueva_direccion = datos.get("direccion")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Verificamos si el correo existe en la base de datos
        cursor.execute("SELECT * FROM usuarios WHERE correo = %s", (correo,))
        usuario = cursor.fetchone()
        
        if usuario is None:
            return {"success": "false", "mensaje": "Usuario no encontrado."}
        
        # Actualizamos los datos del usuario
        cursor.execute("""
            UPDATE usuarios
            SET nombre = %s, apellido = %s, telefono = %s, direccion = %s
            WHERE correo = %s
        """, (nuevo_nombre, nuevo_apellido, nuevo_telefono, nueva_direccion, correo))

        conn.commit()
        cursor.close()
        conn.close()
        return {"success": "true", "mensaje": "Datos actualizados exitosamente."}
    
    except mysql.connector.Error as err:
        print(str(err))
        return {"success": "false", "mensaje": "Error en la base de datos, inténtelo más tarde."}
    
    finally:
        cursor.close()
        conn.close()


@app.get("/obtener_usuarios")
def obtener_usuarios(request: Request):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
        SELECT 
            u.nombre, 
            u.apellido, 
            u.correo, 
            u.telefono, 
            u.direccion, 
            u.documento_identidad, 
            r.nombre_rol
        FROM usuarios u
        LEFT JOIN roll r ON u.rol_id = r.id
        """)
        usuarios = cursor.fetchall()  # Cambié a fetchall() para obtener todos los resultados
        print(usuarios)

        cursor.close()
        conn.close()

        return {"success": "true", "data": usuarios}
    except mysql.connector.Error as err:
        print(f"Error: {str(err)}")
        return {"success": "false", "mensaje": "Error en la base de datos, inténtelo más tarde."}



def generar_contraseña(longitud=6):
    """Genera una contraseña segura con letras y números."""
    caracteres = string.ascii_letters + string.digits
    return ''.join(random.choice(caracteres) for _ in range(longitud))


@app.post("/registrar_usuarios")
async def registrar_usuarios(request: Request):
    datos = await request.json()
    nombre = datos.get('nombre')
    apellido = datos.get('apellido')
    cc = datos.get('cc')
    correo = datos.get('correo')
    telefono = datos.get('telefono')
    direccion = datos.get('direccion')
    rol = datos.get('rol')

    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Verificar si el correo ya está registrado
        cursor.execute('SELECT * FROM usuarios WHERE correo = %s', (correo,))
        if cursor.fetchone():
            return {"success": False, "mensaje": "Los datos ya se encuentran registrados"}
        
        # Insertar el rol en la tabla 'roll'
        insert_rol_query = 'INSERT INTO roll (nombre_rol, correo) VALUES (%s, %s)'
        cursor.execute(insert_rol_query, (rol, correo))
        roll_id = cursor.lastrowid
        
        # Generar una contraseña segura
        contraseña = generar_contraseña()
        print(f"Contraseña generada: {contraseña}")
        
        # Hash de la contraseña
        salt = bcrypt.gensalt()
        contraseña_hashed = bcrypt.hashpw(contraseña.encode('utf-8'), salt)
        contraseña_decoded = contraseña_hashed.decode('utf-8')

        # Insertar el usuario en la tabla 'usuarios'
        insert_usuario_query = '''
            INSERT INTO usuarios 
            (nombre, apellido, correo, telefono, direccion, documento_identidad, rol_id, contraseña)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        '''
        valores_usuario = (
            nombre, 
            apellido, 
            correo, 
            telefono, 
            direccion, 
            cc, 
            roll_id, 
            contraseña_decoded
        )
        
        cursor.execute(insert_usuario_query, valores_usuario)
        conn.commit()

        # Enviar la contraseña al correo del usuario
        enviar_correo(correo, contraseña)
        
        return {
            "success": True, 
            "mensaje": "Se ha registrado de manera exitosa. La contraseña ha sido enviada al correo."
        }
        
    except mysql.connector.Error as err:
        print(f"Error MySQL: {str(err)}")
        return {
            "success": False, 
            "mensaje": "Error en la base de datos, inténtelo más tarde."
        }
    except Exception as e:
        print(f"Error general: {str(e)}")
        return {
            "success": False, 
            "mensaje": "Error inesperado, inténtelo más tarde."
        }
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def enviar_correo(destinatario, contraseña):
    """Envía un correo electrónico al usuario con su contraseña."""
    try:
        remitente = "luciamariahernandez830@gmail.com"
        contraseña_correo_app = "kbeq hmci yqmt nqez"

        mensaje = MIMEMultipart()
        mensaje['From'] = remitente
        mensaje['To'] = destinatario
        mensaje['Subject'] = "Registro exitoso - Contraseña de acceso"

        cuerpo = f"""
        Hola,

        Su registro ha sido exitoso. A continuación, encontrará su contraseña de acceso:

        Contraseña: {contraseña}

        Por favor, cámbiela después de iniciar sesión por motivos de seguridad.

        Saludos,
        El equipo de soporte.
        """
        mensaje.attach(MIMEText(cuerpo, 'plain'))

        servidor = smtplib.SMTP('smtp.gmail.com', 587)
        servidor.starttls()
        servidor.login(remitente, contraseña_correo_app)
        servidor.send_message(mensaje)
        servidor.quit()

        print(f"Correo enviado exitosamente a {destinatario}.")
    except Exception as e:
        print(f"Error al enviar correo: {e}")
        


@app.put("/actualizar_usuario")
async def actualizar_usuario(request: Request):
    datos = await request.json()
    nombre = datos.get("nombre")
    apellido = datos.get("apellido")
    correo = datos.get("correo")
    telefono = datos.get("telefono")
    direccion = datos.get("direccion")
    rol = datos.get("rol")

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Actualizar los datos del usuario
        query = '''
            UPDATE usuarios 
            SET nombre = %s, apellido = %s, telefono = %s, direccion = %s, rol_id = 
            (SELECT id FROM roll WHERE nombre_rol = %s LIMIT 1)
            WHERE correo = %s
        '''
        valores = (nombre, apellido, telefono, direccion, rol, correo)
        cursor.execute(query, valores)
        conn.commit()

        if cursor.rowcount > 0:
            return {"success": "true", "mensaje": "Usuario actualizado exitosamente."}
        else:
            return {"success": "false", "mensaje": "No se encontró el usuario o no se realizaron cambios."}
    except mysql.connector.Error as err:
        print(f"Error MySQL: {err}")
        return {"success": False, "mensaje": "Error en la base de datos. Inténtelo más tarde."}
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()





@app.post("/recuperar_cuenta")
async def recuperar_cuenta(request: Request):
    datos = await request.json()
    correo = datos.get('email')
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)      
        cursor.execute('SELECT * FROM usuarios WHERE correo = %s', (correo,))    
        if cursor.fetchone():
            contraseña=generar_contraseña()
            salt = bcrypt.gensalt()
            contraseña_hashed = bcrypt.hashpw(contraseña.encode('utf-8'), salt)
            contraseña_decoded = contraseña_hashed.decode('utf-8')
            enviar_correo(correo, contraseña)
            cursor.execute("""
            UPDATE usuarios
            SET contraseña = %
            WHERE correo = %s
        """, (contraseña_decoded, correo))
            return {"success": 'true', "mensaje": "Correo enviado exitosamente"}
        else:
            return {"success": 'false', "mensaje": "Confirme el correo ingresado"}
    except mysql.connector.Error as err:
        print(f"Error: {str(err)}")
        return {"success": "false", "mensaje": "Error en la base de datos, inténtelo más tarde."}
    
    
    
@app.post("/crear_cita")
async def crear_cita(request: Request):
    datos = await request.json()
    documento = datos.get('documento')
    fecha = datos.get('fecha')
    tipo_cita = datos.get('tipoCita')
    estado = "Pendiente"

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM usuarios WHERE documento_identidad=%s
""", (documento,))
        if cursor.fetchone():
            cursor.execute("""
                INSERT INTO citas (documento, fecha_cita, tipo_cita, estado)
                VALUES (%s, %s, %s, %s)
            """, (documento, fecha, tipo_cita, estado))

            conn.commit()
            return {"success":"true", "mensaje": "Cita creada exitosamente."}
        else:
            return {"success": "false", "mensaje": "Confirme el numero de documento ingresado."}

    except mysql.connector.Error as err:
        print(f"Error MySQL: {str(err)}")
        return {"success": False, "mensaje": "Error en la base de datos, inténtelo más tarde."}
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.get("/obtener_citas")
async def obtener_citas():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                id AS cita_id, 
                documento, 
                fecha_cita, 
                tipo_cita, 
                estado
            FROM citas
        """)
        citas = cursor.fetchall()

        return {"success": True, "data": citas}

    except mysql.connector.Error as err:
        print(f"Error MySQL: {str(err)}")
        return {"success": False, "mensaje": "Error en la base de datos, inténtelo más tarde."}
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.delete("/eliminar_cita/{cita_id}")
async def eliminar_cita(cita_id: int):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Verificar si la cita existe
        cursor.execute("SELECT * FROM citas WHERE id = %s", (cita_id,))
        cita = cursor.fetchone()

        if not cita:
            return {"success": False, "mensaje": "Cita no encontrada."}

        # Eliminar la cita
        cursor.execute("DELETE FROM citas WHERE id = %s", (cita_id,))
        conn.commit()

        return {"success": True, "mensaje": "Cita eliminada exitosamente."}

    except mysql.connector.Error as err:
        print(f"Error MySQL: {str(err)}")
        return {"success": False, "mensaje": "Error en la base de datos, inténtelo más tarde."}
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

#obtener todas las citas para el asesor 
@app.get("/get_citas")
def get_citas(request: Request):
    try:
        # Obtener la fecha actual en formato año-mes-día (sin la hora)
        fecha_actual = datetime.now().strftime('%Y-%m-%d')
        print(f"Fecha actual: {fecha_actual}")

        # Conectar a la base de datos
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Consulta optimizada usando JOIN para obtener las citas del día pendientes
        query_citas = '''
            SELECT 
                c.documento,
                c.fecha_cita,
                c.tipo_cita,
                CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo
            FROM 
                citas c
            JOIN 
                usuarios u ON u.documento_identidad = c.documento
            WHERE 
                c.estado = 'Pendiente' AND 
                DATE(c.fecha_cita) = %s;
        '''
        cursor.execute(query_citas)
        citas = cursor.fetchall()
        print(f"Citas: {citas}")

        # Cerrar la conexión
        cursor.close()
        conn.close()

        # Retornar las citas completas con la información del usuario
        print(f"Citas completas: {citas}")
        return {"success": True, "citas": citas}

    except mysql.connector.Error as err:
        print(f"Error de MySQL: {err}")
        return {"success": False, "mensaje": "Error al obtener las citas del día."}



#doctor
@app.get("/get_citas_dia")
def get_citas_dia(request: Request):
    try:
        # Obtener la fecha actual en formato año-mes-día (sin la hora)
        fecha_actual = datetime.now().strftime('%Y-%m-%d')
        print(f"Fecha actual: {fecha_actual}")

        # Conectar a la base de datos
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Consulta optimizada usando JOIN para obtener las citas del día pendientes
        query_citas = '''
            SELECT 
                c.documento,
                c.fecha_cita,
                c.tipo_cita,
                CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo
            FROM 
                citas c
            JOIN 
                usuarios u ON u.documento_identidad = c.documento
            WHERE 
                c.estado = 'Pendiente' AND 
                DATE(c.fecha_cita) = %s;
        '''
        cursor.execute(query_citas, (fecha_actual,))
        citas = cursor.fetchall()
        print(f"Citas: {citas}")

        # Cerrar la conexión
        cursor.close()
        conn.close()

        # Retornar las citas completas con la información del usuario
        print(f"Citas completas: {citas}")
        return {"success": True, "citas": citas}

    except mysql.connector.Error as err:
        print(f"Error de MySQL: {err}")
        return {"success": False, "mensaje": "Error al obtener las citas del día."}



@app.post("/guardar_resultado")
async def guardar_resultado(request: Request):
    datos = await request.json()
    usuario = datos.get('usuario')
    diagnostico = datos.get('diagnostico')
    ojo_derecho = datos.get('ojo_derecho')
    ojo_izquierdo = datos.get('ojo_izquierdo') 
    recomendaciones = datos.get('recomendaciones')

    # Formato del registro de gafas
    registro_gafas = "Ojo derecho: " + ojo_derecho + ", Ojo izquierdo: " + ojo_izquierdo

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        query = """
        INSERT INTO registro_clinico (correo, diagnostico, recomendaciones, registro_gafas)
        VALUES (%s, %s, %s, %s)
        """
        values = (usuario, diagnostico, recomendaciones, registro_gafas)

        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()

        return {"success": "true", "mensaje": "Se ha registrado de manera exitosa"}

    except mysql.connector.Error as err:
        print(str(err))
        return {"success": "false", "mensaje": "Error en la base de datos, inténtelo más tarde."}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/get_resultados/{correo}")
async def obtener_resultados(correo: str):
    try:
        # Conectar a la base de datos
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Consulta para unir datos de registro_clinico con usuarios (para obtener nombres)
        query = '''
            SELECT 
                rc.diagnostico,
                rc.receta_gafas,
                u_paciente.nombre AS nombre_paciente,
                u_doctor.nombre AS nombre_doctor,
                rc.fecha
            FROM 
                registro_clinico rc
            JOIN usuarios u_paciente ON rc.paciente_id = u_paciente.id
            JOIN usuarios u_doctor ON rc.doctor_id = u_doctor.id
            WHERE 
                u_paciente.correo = %s;
        '''
        cursor.execute(query, (correo,))
        resultados = cursor.fetchone()
        
        if resultados:
            return {"success": True, "resultados": resultados}
        else:
            return {"success": False, "mensaje": "No se encontraron resultados para este usuario."}
    except mysql.connector.Error as err:
        print(f"Error de MySQL: {err}")
        return {"success": False, "mensaje": "Error al obtener resultados."}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



#cliente
@app.get("/get_cita_info/{correo}")
async def obtener_cita_info(correo: str):
    try:
        # Conectar a la base de datos
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Consulta para obtener la información de la cita para un usuario
        query = '''
            SELECT 
                c.fecha_cita,
                CONCAT(d.nombre, ' ', d.apellido) AS doctor_asignado
            FROM 
                citas c
            JOIN 
                usuarios d ON c.documento_doctor = d.documento_identidad
            WHERE 
                c.estado = 'Pendiente' AND c.documento_paciente = %s;
        '''
        cursor.execute(query, (correo,))
        resultado = cursor.fetchone()

        if resultado:
            return {"success": True, "cita": resultado}
        else:
            return {"success": False, "mensaje": "No tienes citas activas pendientes."}
    except mysql.connector.Error as err:
        print(f"Error de MySQL: {err}")
        return {"success": False, "mensaje": "Error al obtener información de la cita."}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)




