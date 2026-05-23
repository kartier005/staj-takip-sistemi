import os
import json
import uuid
import pika
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import redis
import google.generativeai as genai

app = FastAPI(title="Proje API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

ALLOWED_EXTENSIONS = ["txt", "png", "jpg", "jpeg", "pdf", "docx", "xlsx"]

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

print("[✓] API Gateway baslatildi!")

def get_db():
    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user="myuser",
            password="mypassword123",
            database="proje_db"
        )
        return conn
    except Exception as e:
        print(f"[✗] MySQL baglanti hatasi: {e}")
        raise HTTPException(status_code=500, detail="Veritabani baglanti hatasi")


def check_extension(filename):
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Gecersiz dosya uzantisi: .{extension}. Izin verilenler: {ALLOWED_EXTENSIONS}"
        )
    return extension


def send_to_rabbitmq(queue_name, data):
    """
    RabbitMQ RPC istegi gonder ve cevabi bekle.
    Exclusive callback queue olusturur, correlation_id ile eslestirir.
    """
    try:
        credentials = pika.PlainCredentials("admin", "admin123")
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
        )
        channel = connection.channel()

        result = channel.queue_declare(queue="", exclusive=True)
        callback_queue = result.method.queue

        response = None
        corr_id = str(uuid.uuid4())

        def on_response(ch, method, props, body):
            nonlocal response
            if props.correlation_id == corr_id:
                response = json.loads(body)

        channel.basic_consume(
            queue=callback_queue,
            on_message_callback=on_response,
            auto_ack=True
        )

        channel.basic_publish(
            exchange="",
            routing_key=queue_name,
            properties=pika.BasicProperties(
                reply_to=callback_queue,
                correlation_id=corr_id,
            ),
            body=json.dumps(data)
        )

        while response is None:
            connection.process_data_events()

        connection.close()
        return response

    except Exception as e:
        print(f"[✗] RabbitMQ RPC hatasi: {e}")
        raise HTTPException(status_code=500, detail="Mesaj kuyrugu hatasi")


def send_log(action_type, description, username="system"):
    """
    RabbitMQ'ya log mesaji gonder (fire-and-forget).
    log_queue kuyruğuna durable mesaj gonderir, cevap beklemez.
    """
    try:
        credentials = pika.PlainCredentials("admin", "admin123")
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
        )
        channel = connection.channel()

        channel.queue_declare(queue="log_queue", durable=True)

        log_data = {
            "action_type": action_type,
            "description": description,
            "username": username
        }
        channel.basic_publish(
            exchange="",
            routing_key="log_queue",
            body=json.dumps(log_data),
            properties=pika.BasicProperties(delivery_mode=2)  # Kalici mesaj
        )

        connection.close()
        print(f"[LOG] {action_type}: {description}")

    except Exception as e:
        print(f"[✗] Log gonderilemedi: {e}")

@app.post("/api/auth/login")
async def login(body: dict):
    username = body.get("username")
    password = body.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Kullanici adi ve sifre gerekli")

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM users WHERE username = %s AND password = %s",
            (username, password)
        )
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Gecersiz kullanici adi veya sifre")

        session_id = str(uuid.uuid4())
        session_data = {
            "user_id": user["id"],
            "username": user["username"],
            "role": user["role"]
        }
        redis_client.setex(
            f"session:{session_id}",
            3600,  # 1 saat TTL
            json.dumps(session_data)
        )

        send_log("LOGIN", f"{username} giris yapti", username)

        print(f"[✓] Kullanici giris yapti: {username}")

        return {
            "status": "success",
            "session_id": session_id,
            "user": {
                "user_id": user["id"],
                "username": user["username"],
                "role": user["role"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[✗] Login hatasi: {e}")
        raise HTTPException(status_code=500, detail="Giris islemi basarisiz")
    finally:
        cursor.close()
        conn.close()


@app.post("/api/auth/logout")
async def logout(body: dict):
    session_id = body.get("session_id")

    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID gerekli")

    redis_client.delete(f"session:{session_id}")

    send_log("LOGOUT", "Kullanici cikis yapti")

    print(f"[✓] Session silindi: {session_id}")

    return {"status": "success", "message": "Cikis yapildi"}


@app.get("/api/auth/me")
async def get_me(session_id: str):
    session_data = redis_client.get(f"session:{session_id}")

    if not session_data:
        raise HTTPException(status_code=401, detail="Gecersiz veya suresi dolmus oturum")

    user = json.loads(session_data)
    return {"status": "success", "user": user}

@app.get("/api/permissions")
async def get_all_permissions():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM permissions")
        rows = cursor.fetchall()

        permissions = {}
        for row in rows:
            role = row.get("role", "")
            page_perms = json.loads(row["page_permissions"]) if row.get("page_permissions") else []
            crud_perms = json.loads(row["crud_permissions"]) if row.get("crud_permissions") else []
            permissions[role] = {
                "page_permissions": page_perms,
                "crud_permissions": crud_perms
            }

        return {"status": "success", "permissions": permissions}

    except Exception as e:
        print(f"[✗] Yetki okuma hatasi: {e}")
        raise HTTPException(status_code=500, detail="Yetkiler alinamadi")
    finally:
        cursor.close()
        conn.close()


@app.get("/api/permissions/{role}")
async def get_role_permissions(role: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM permissions WHERE role = %s", (role,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Rol bulunamadi")

        if row.get("page_permissions"):
            row["page_permissions"] = json.loads(row["page_permissions"])
        if row.get("crud_permissions"):
            row["crud_permissions"] = json.loads(row["crud_permissions"])

        return {"status": "success", "data": row}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[✗] Yetki okuma hatasi: {e}")
        raise HTTPException(status_code=500, detail="Yetki alinamadi")
    finally:
        cursor.close()
        conn.close()


@app.put("/api/permissions/{role}")
async def update_permissions(role: str, body: dict):
    page_permissions = body.get("page_permissions", [])
    crud_permissions = body.get("crud_permissions", [])

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.callproc("assign_permissions", [
            role,
            json.dumps(page_permissions),
            json.dumps(crud_permissions)
        ])
        conn.commit()

        send_log("PERMISSION_UPDATE", f"{role} rolunun yetkileri guncellendi")

        print(f"[✓] Yetkiler guncellendi: {role}")

        return {"status": "success", "message": f"{role} yetkileri guncellendi"}

    except Exception as e:
        print(f"[✗] Yetki guncelleme hatasi: {e}")
        raise HTTPException(status_code=500, detail="Yetki guncellenemedi")
    finally:
        cursor.close()
        conn.close()

ALLOWED_TABLES = ["students", "schools", "businesses"]


@app.get("/api/crud/{table}")
async def crud_read(table: str):
    if table not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Gecersiz tablo adi")

    result = send_to_rabbitmq("crud_queue", {
        "operation": "read",
        "table": table
    })

    return result


@app.post("/api/crud/{table}")
async def crud_create(table: str, body: dict):
    if table not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Gecersiz tablo adi")

    data = body.get("data", {})

    result = send_to_rabbitmq("crud_queue", {
        "operation": "create",
        "table": table,
        "data": data
    })

    send_log("CREATE", f"{table} tablosuna yeni kayit eklendi")

    return result


@app.put("/api/crud/{table}/{item_id}")
async def crud_update(table: str, item_id: int, body: dict):
    if table not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Gecersiz tablo adi")

    data = body.get("data", {})

    result = send_to_rabbitmq("crud_queue", {
        "operation": "update",
        "table": table,
        "item_id": item_id,
        "data": data
    })

    send_log("UPDATE", f"{table} tablosunda {item_id} nolu kayit guncellendi")

    return result


@app.delete("/api/crud/{table}/{item_id}")
async def crud_delete(table: str, item_id: int):
    if table not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Gecersiz tablo adi")

    result = send_to_rabbitmq("crud_queue", {
        "operation": "delete",
        "table": table,
        "item_id": item_id
    })

    send_log("DELETE", f"{table} tablosundan {item_id} nolu kayit silindi")

    return result

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_type = check_extension(file.filename)

    try:
        file_path = f"uploads/{file.filename}"
        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO uploaded_files (filename, file_type, uploaded_by) VALUES (%s, %s, %s)",
            (file.filename, file_type, "system")
        )
        conn.commit()
        cursor.close()
        conn.close()

        text_content = None

        if file_type == "txt":
            text_content = contents.decode("utf-8", errors="ignore")

        elif file_type == "docx":
            from docx import Document
            doc = Document(file_path)
            text_content = "\n".join([p.text for p in doc.paragraphs])

        send_log("UPLOAD", f"{file.filename} dosyasi yuklendi")

        print(f"[✓] Dosya yuklendi: {file.filename}")

        return {
            "status": "success",
            "filename": file.filename,
            "file_type": file_type,
            "text_content": text_content,
            "message": "Dosya basariyla yuklendi"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[✗] Dosya yukleme hatasi: {e}")
        raise HTTPException(status_code=500, detail="Dosya yuklenemedi")

@app.post("/api/ai/analyze")
async def ai_analyze(body: dict):
    content = body.get("content", "")
    filename = body.get("filename", "bilinmeyen")

    try:
        if GEMINI_API_KEY:
            model = genai.GenerativeModel("gemini-2.0-flash")

            prompt = (
                "Su metni analiz et ve GrapesJS editorunde kullanilabilecek "
                "guzel HTML yapisina donustur. Sadece HTML kodu ver, aciklama yapma:\n\n"
                + content
            )

            response = model.generate_content(prompt)
            html_content = response.text
            html_content = html_content.replace("```html", "").replace("```", "").strip()

        else:
            print("[!] Gemini API key bulunamadi, mock HTML olusturuluyor")
            html_content = (
                f"<div><h1>{filename}</h1>"
                f"<p>{content[:200]}</p>"
                f"<p>Bu icerik AI analizi olmadan olusturulmustur.</p></div>"
            )

        send_log("AI_ANALYZE", f"{filename} icerigi analiz edildi")

        print(f"[✓] AI analiz tamamlandi: {filename}")

        return {
            "status": "success",
            "html": html_content,
            "filename": filename
        }

    except Exception as e:
        print(f"[✗] AI analiz hatasi: {e}")
        raise HTTPException(status_code=500, detail="AI analiz basarisiz")

@app.get("/api/logs")
async def get_logs(limit: int = 100):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM system_logs ORDER BY log_time DESC LIMIT %s",
            (limit,)
        )
        logs = cursor.fetchall()

        for log in logs:
            if log.get("log_time"):
                log["log_time"] = str(log["log_time"])
            if log.get("extra_data"):
                try:
                    log["extra_data"] = json.loads(log["extra_data"])
                except:
                    pass

        return {"status": "success", "logs": logs}

    except Exception as e:
        print(f"[✗] Log okuma hatasi: {e}")
        raise HTTPException(status_code=500, detail="Loglar alinamadi")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "api-gateway"}