import os
import json
import time
import pika
import mysql.connector

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")

print("[*] Log Worker baslatiliyor...")

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

    print("[✗] RabbitMQ'ya baglanilamadi! Log Worker durduruluyor.")
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

    print("[✗] MySQL'e baglanilamadi! Log Worker durduruluyor.")
    exit(1)

def on_log_message(ch, method, props, body):
    try:
        message = json.loads(body)
        action_type = message.get("action_type", "UNKNOWN")
        description = message.get("description", "")
        username = message.get("username", "system")

        conn = connect_mysql()
        cursor = conn.cursor()

        cursor.callproc("add_system_log", [action_type, description, username])
        conn.commit()

        cursor.close()
        conn.close()

        print(f"[LOG] {action_type}: {description}")

    except Exception as e:
        print(f"[✗] Log kaydetme hatasi: {e}")

if __name__ == "__main__":
    connection = connect_rabbitmq()
    channel = connection.channel()

    channel.queue_declare(queue="log_queue", durable=True)

    channel.basic_consume(
        queue="log_queue",
        on_message_callback=on_log_message,
        auto_ack=True
    )

    print("[✓] Log Worker hazir! Log mesajlari bekleniyor...")
    channel.start_consuming()
