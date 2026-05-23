# 🎓 Staj Takip & Yönetim Sistemi

**Hazırlayan:** Kerem Atlı  
**Bölüm:** Ege Üniversitesi Bergama MYO - Bilgisayar Programcılığı

Mikroservis mimarisine sahip, rol tabanlı yetki yönetimli ve yapay zeka destekli staj takip sistemidir. Öğrenci, Okul ve İşletme verilerinin CRUD işlemleri, dosya yükleme/analiz ve GrapesJS editörü içerir.

---

## 🛠️ Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | ReactJS, TailwindCSS v4, Vite, GrapesJS |
| **Backend** | FastAPI (Python), Uvicorn |
| **Message Broker** | RabbitMQ (RPC Pattern & Pub/Sub) |
| **Cache & Session** | Redis |
| **Veritabanı** | MySQL 8.0 (JSON Data, Stored Procedures, Functions, Triggers) |
| **Yapay Zeka** | Google Gemini API (gemini-2.0-flash) |
| **Altyapı** | Docker & Docker Compose |

---

## 🚀 Projeyi Çalıştırma

Docker Desktop'un açık olduğundan emin olun, ardından proje dizininde:

```bash
docker-compose up --build -d
```

### Erişim Adresleri

| Servis | Adres |
|--------|-------|
| **Frontend Paneli** | [http://localhost:3000](http://localhost:3000) |
| **Backend API (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) (admin / admin123) |

---

## 📦 Docker Servisleri

`docker-compose.yml` ile 7 ayrı container ayağa kalkar:

| Servis | İmaj | Port | Açıklama |
|--------|------|------|----------|
| **mysql_db** | [mysql:8.0](https://hub.docker.com/_/mysql) | 3306 | Ana veritabanı |
| **rabbitmq** | [rabbitmq:3-management](https://hub.docker.com/_/rabbitmq) | 5672, 15672 | Mesaj kuyruğu |
| **redis** | [redis:7-alpine](https://hub.docker.com/_/redis) | 6379 | Session & cache |
| **api-gateway** | python:3.11-slim | 8000 | FastAPI backend |
| **crud-worker** | python:3.11-slim | - | RabbitMQ RPC consumer |
| **log-worker** | python:3.11-slim | - | Loglama consumer |
| **frontend** | node:20-alpine + nginx | 3000 | React arayüzü |

---

## 🗄️ Veritabanı Bilgileri

| Parametre | Değer |
|-----------|-------|
| Host | `localhost` (dışarıdan), `mysql_db` (Docker içi) |
| Port | `3306` |
| Database | `proje_db` |
| Root Şifresi | `rootpassword123` |
| Kullanıcı | `myuser` |
| Şifre | `mypassword123` |

**Tablolar:** `users`, `permissions`, `students`, `schools`, `businesses`, `uploaded_files`, `system_logs`

**Veritabanı Özellikleri:**
- ✅ **JSON** veri yapısı (students.data, schools.data, businesses.data)
- ✅ **Stored Procedure:** `assign_permissions()`, `add_system_log()`
- ✅ **Stored Function:** `get_total_records()`
- ✅ **Trigger:** `after_student_insert`, `after_school_insert`, `after_business_insert`, `after_student_delete`, `after_school_delete`, `after_business_delete`

---

## 🔑 Örnek Kullanıcılar

| Rol | Kullanıcı Adı | Şifre |
|-----|---------------|-------|
| **Supervisor** | `supervisor` | `supervisor123` |
| **Öğrenci** | `ogrenci1` | `ogrenci123` |
| **Okul** | `okul1` | `okul123` |
| **İşletme** | `isletme1` | `isletme123` |

### Rol Açıklamaları
- **Supervisor:** Tüm yetkilere sahip yönetici. Diğer rollerin sayfa erişimlerini ve CRUD yetkilerini atar. Sistem loglarını görür.
- **Öğrenci / Okul / İşletme:** Supervisor tarafından atanan sayfalara ve CRUD işlemlerine erişebilir.

---

## 🔗 Mimari Yapı

```
Kullanıcı (Browser)
      │
      ▼
  [Frontend]  ─── React + TailwindCSS + GrapesJS (Nginx)
      │
      ▼
  [API Gateway]  ─── FastAPI (Uvicorn)
      │
      ├──► [Redis]  ─── Session & Cache
      │
      ├──► [MySQL]  ─── Veritabanı (JSON, SP, Trigger)
      │
      ├──► [RabbitMQ] ──► [CRUD Worker]  ─── RPC ile veri işlemleri
      │                 ──► [Log Worker]   ─── Fire-and-forget loglama
      │
      └──► [Gemini AI]  ─── Dosya analizi & HTML dönüşümü
```

---

## 🧠 Yapay Zeka & Dosya İşlemleri

- **Dosya Yükleme:** `.txt`, `.png`, `.jpg`, `.jpeg`, `.pdf`, `.docx`, `.xlsx` uzantıları kabul edilir
- **Gemini AI Analizi:** Yüklenen txt/docx dosyalarının içeriği Gemini 2.0 Flash modeline gönderilir ve GrapesJS uyumlu HTML'e dönüştürülür
- **GrapesJS Editörü:** AI'ın ürettiği HTML kodu sürükle-bırak editörde düzenlenebilir

---

## 🔗 GitHub Linki

> **GitHub Deposu:** https://github.com/kartier005/staj-takip-sistemi
