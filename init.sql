
USE proje_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extra_data JSON
);

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) UNIQUE NOT NULL,
    page_permissions JSON,
    crud_permissions JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSON
);

CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSON
);

CREATE TABLE IF NOT EXISTS businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSON
);

CREATE TABLE IF NOT EXISTS uploaded_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20),
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
);

CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50),
    action_desc VARCHAR(500),
    performed_by VARCHAR(100) DEFAULT 'system',
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extra_data JSON
);

CREATE TABLE IF NOT EXISTS main_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    value JSON
);

DELIMITER //

CREATE FUNCTION get_user_role(p_username VARCHAR(100))
RETURNS VARCHAR(50)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_role VARCHAR(50);
    SELECT role INTO v_role FROM users WHERE username = p_username LIMIT 1;
    RETURN IFNULL(v_role, 'bilinmiyor');
END //

CREATE PROCEDURE assign_permissions(
    IN p_role VARCHAR(50),
    IN p_pages JSON,
    IN p_crud JSON
)
BEGIN
    INSERT INTO permissions (role, page_permissions, crud_permissions)
    VALUES (p_role, p_pages, p_crud)
    ON DUPLICATE KEY UPDATE
        page_permissions = p_pages,
        crud_permissions = p_crud;
END //

CREATE PROCEDURE add_system_log(
    IN p_action_type VARCHAR(50),
    IN p_desc VARCHAR(500),
    IN p_user VARCHAR(100)
)
BEGIN
    INSERT INTO system_logs (action_type, action_desc, performed_by)
    VALUES (p_action_type, p_desc, p_user);
END //

CREATE TRIGGER after_student_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (action_type, action_desc, performed_by)
    VALUES ('STUDENT_INSERT', CONCAT('Yeni ogrenci eklendi. ID: ', NEW.id), 'trigger');
END //

CREATE TRIGGER after_student_update
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (action_type, action_desc, performed_by)
    VALUES ('STUDENT_UPDATE', CONCAT('Ogrenci guncellendi. ID: ', NEW.id), 'trigger');
END //

CREATE TRIGGER after_student_delete
AFTER DELETE ON students
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (action_type, action_desc, performed_by)
    VALUES ('STUDENT_DELETE', CONCAT('Ogrenci silindi. ID: ', OLD.id), 'trigger');
END //

CREATE TRIGGER after_school_insert
AFTER INSERT ON schools
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (action_type, action_desc, performed_by)
    VALUES ('SCHOOL_INSERT', CONCAT('Yeni okul eklendi. ID: ', NEW.id), 'trigger');
END //

CREATE TRIGGER after_business_insert
AFTER INSERT ON businesses
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (action_type, action_desc, performed_by)
    VALUES ('BUSINESS_INSERT', CONCAT('Yeni isletme eklendi. ID: ', NEW.id), 'trigger');
END //

CREATE TRIGGER after_data_insert
AFTER INSERT ON main_data
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (action_type, action_desc, performed_by)
    VALUES ('DATA_INSERT', CONCAT('Yeni JSON verisi eklendi. ID: ', NEW.id), 'trigger');
END //

DELIMITER ;

INSERT INTO users (username, password, role) VALUES
('supervisor', 'supervisor123', 'Supervisor'),
('ogrenci1', 'ogrenci123', 'Ogrenci'),
('okul1', 'okul123', 'Okul'),
('isletme1', 'isletme123', 'Isletme');

INSERT INTO permissions (role, page_permissions, crud_permissions) VALUES
('Ogrenci', '["Ogrenci Listesi"]', '["read"]'),
('Okul', '["Okul Yonetimi", "Ogrenci Listesi"]', '["read", "update"]'),
('Isletme', '["Isletme Profili"]', '["read"]');

INSERT INTO students (data) VALUES
('{"ad": "Ali", "soyad": "Yilmaz", "numara": "2024001", "bolum": "Bilgisayar Programciligi"}'),
('{"ad": "Ayse", "soyad": "Demir", "numara": "2024002", "bolum": "Web Tasarimi"}'),
('{"ad": "Mehmet", "soyad": "Kaya", "numara": "2024003", "bolum": "Bilgisayar Programciligi"}');

INSERT INTO schools (data) VALUES
('{"ad": "Ege Universitesi", "sehir": "Izmir", "tur": "Devlet", "ogrenci_sayisi": 75000}'),
('{"ad": "Dokuz Eylul Universitesi", "sehir": "Izmir", "tur": "Devlet", "ogrenci_sayisi": 60000}');

INSERT INTO businesses (data) VALUES
('{"ad": "Tech Solutions", "sektor": "Yazilim", "sehir": "Izmir", "calisan_sayisi": 50}'),
('{"ad": "Web Agency", "sektor": "Dijital Pazarlama", "sehir": "Istanbul", "calisan_sayisi": 25}');