CREATE TABLE IF NOT EXISTS hospitals (
 id CHAR(19) PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(254) NOT NULL UNIQUE,
 phone VARCHAR(30) NOT NULL,
 address VARCHAR(500) NOT NULL,
 password_hash VARCHAR(256) NOT NULL,
 status ENUM('normal','busy','overloaded','emergency') NOT NULL DEFAULT 'normal',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
 token_hash CHAR(64) PRIMARY KEY,
 hospital_id CHAR(19) NOT NULL,
 expires_at DATETIME(3) NOT NULL,
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
 INDEX (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recovery_tokens (
 token_hash CHAR(64) PRIMARY KEY,
 hospital_id CHAR(19) NOT NULL,
 expires_at DATETIME(3) NOT NULL,
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctors (
 id CHAR(36) PRIMARY KEY,
 hospital_id CHAR(19) NOT NULL,
 name VARCHAR(120) NOT NULL,
 specialty VARCHAR(120) NOT NULL,
 license VARCHAR(80) NOT NULL,
 phone VARCHAR(30) NOT NULL DEFAULT '',
 email VARCHAR(254) NOT NULL DEFAULT '',
 department VARCHAR(120) NOT NULL DEFAULT '',
 room VARCHAR(40) NOT NULL DEFAULT '',
 shift_start CHAR(5) NOT NULL DEFAULT '09:00',
 shift_end CHAR(5) NOT NULL DEFAULT '17:00',
 on_duty BOOLEAN NOT NULL DEFAULT FALSE,
 version INT NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 UNIQUE (hospital_id, license),
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wards (
 id CHAR(36) PRIMARY KEY,
 hospital_id CHAR(19) NOT NULL,
 name VARCHAR(120) NOT NULL,
 type ENUM('general','emergency','icu') NOT NULL,
 capacity INT NOT NULL,
 occupied INT NOT NULL DEFAULT 0,
 version INT NOT NULL DEFAULT 1,
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 UNIQUE (hospital_id, name),
 CHECK (capacity > 0 AND occupied >= 0 AND occupied <= capacity),
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tokens (
 id CHAR(36) PRIMARY KEY,
 hospital_id CHAR(19) NOT NULL,
 number INT NOT NULL,
 visit_date DATE NOT NULL,
 patient VARCHAR(120) NOT NULL,
 reason VARCHAR(500) NOT NULL,
 priority ENUM('routine','urgent','emergency') NOT NULL DEFAULT 'routine',
 status ENUM('waiting','in_progress','completed','cancelled') NOT NULL DEFAULT 'waiting',
 doctor_id CHAR(36),
 version INT NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 started_at DATETIME(3),
 completed_at DATETIME(3),
 UNIQUE (hospital_id, visit_date, number),
 INDEX (hospital_id, status, created_at),
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
 FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 hospital_id CHAR(19) NOT NULL,
 actor VARCHAR(254) NOT NULL,
 action VARCHAR(80) NOT NULL,
 details VARCHAR(500) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX (hospital_id, created_at),
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bed_history (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 hospital_id CHAR(19) NOT NULL,
 capacity INT NOT NULL,
 occupied INT NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX (hospital_id, created_at),
 FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB;
