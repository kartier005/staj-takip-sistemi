import os
import json
import time
import pika
import mysql.connector

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")

print("[*] CRUD Worker baslatiliyor...")

def connect_rabbitmq():
    for i in range(10):
        try:
            credentials = pika.PlainCredentials("admin", "admin123")
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
            )
            print("[✓] RabbitMQ baglantisi basarili!")
            return connection
        except Exception as e:
            print(f"[✗] RabbitMQ baglanti hatasi (deneme {i+1}/10): {e}")
            time.sleep(5)

    print("[✗] RabbitMQ'ya baglanilamadi! Worker durduruluyor.")
    exit(1)


def connect_mysql():
    for i in range(10):
        try:
            conn = mysql.connector.connect(
                host=MYSQL_HOST,
                user="myuser",
                password="mypassword123",
                database="proje_db"
            )
            print("[✓] MySQL baglantisi basarili!")
            return conn
        except Exception as e:
            print(f"[✗] MySQL baglanti hatasi (deneme {i+1}/10): {e}")
            time.sleep(5)

    print("[✗] MySQL'e baglanilamadi! Worker durduruluyor.")
    exit(1)

def on_request(ch, method, props, body):
    try:
        message = json.loads(body)
        operation = message.get("operation")
        table = message.get("table")

        print(f"[*] Istek alindi: {operation} - {table}")

        conn = connect_mysql()
        cursor = conn.cursor(dictionary=True)

        result = {}
        if operation == "read":
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()

            for row in rows:
                if row.get("data"):
                    try:
                        row["data"] = json.loads(row["data"])
                    except:
                        pass
                if row.get("created_at"):
                    row["created_at"] = str(row["created_at"])

            result = {"success": True, "data": rows}
        elif operation == "create":
            data = message.get("data", {})
            cursor.execute(
                f"INSERT INTO {table} (data) VALUES (%s)",
                (json.dumps(data),)
            )
            conn.commit()
            result = {"success": True, "message": f"{table} tablosuna kayit eklendi"}
        elif operation == "update":
            item_id = message.get("item_id")
            data = message.get("data", {})
            cursor.execute(
                f"UPDATE {table} SET data = %s WHERE id = %s",
                (json.dumps(data), item_id)
            )
            conn.commit()
            result = {"success": True, "message": f"{table} tablosunda {item_id} nolu kayit guncellendi"}
        elif operation == "delete":
            item_id = message.get("item_id")
            cursor.execute(
                f"DELETE FROM {table} WHERE id = %s",
                (item_id,)
            )
            conn.commit()
            result = {"success": True, "message": f"{table} tablosundan {item_id} nolu kayit silindi"}

        else:
            result = {"success": False, "message": f"Bilinmeyen islem: {operation}"}

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[✗] CRUD islem hatasi: {e}")
        result = {"success": False, "message": str(e)}

    ch.basic_publish(
        exchange="",
        routing_key=props.reply_to,
        properties=pika.BasicProperties(
            correlation_id=props.correlation_id
        ),
        body=json.dumps(result)
    )

    ch.basic_ack(delivery_tag=method.delivery_tag)
    print(f"[✓] Istek tamamlandi: {message.get('operation')} - {message.get('table')}")

if __name__ == "__main__":
    connection = connect_rabbitmq()
    channel = connection.channel()

    channel.queue_declare(queue="crud_queue")

    channel.basic_qos(prefetch_count=1)

    channel.basic_consume(
        queue="crud_queue",
        on_message_callback=on_request
    )

    print("[✓] CRUD Worker hazir! Mesaj bekleniyor...")
    channel.start_consuming()