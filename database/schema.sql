CREATE DATABASE IF NOT EXISTS doctor 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE doctor;

-- ============================================
-- Table: doctors
-- ============================================
DROP TABLE IF EXISTS patient_doctors;
DROP TABLE IF EXISTS health_metrics;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;

CREATE TABLE doctors (
  id INT(11) NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male','female','other') NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(50) DEFAULT NULL,
  state VARCHAR(50) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  emergency_contact VARCHAR(100) DEFAULT NULL,
  emergency_phone VARCHAR(20) DEFAULT NULL,
  medical_license_number VARCHAR(50) NOT NULL,
  specialization VARCHAR(50) DEFAULT NULL,
  years_of_experience VARCHAR(10) NOT NULL,
  qualifications TEXT NOT NULL,
  consultation_fee DECIMAL(10,2) NOT NULL,
  current_hospital VARCHAR(200) NOT NULL,
  hospital_address TEXT NOT NULL,
  available_hours VARCHAR(100) DEFAULT NULL,
  languages VARCHAR(200) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  verification_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastLogin TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  UNIQUE KEY medical_license_number (medical_license_number),
  KEY specialization (specialization),
  KEY verification_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: patients
-- ============================================
CREATE TABLE patients (
  id INT(11) NOT NULL AUTO_INCREMENT,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  dateOfBirth DATE DEFAULT NULL,
  gender ENUM('Male','Female','Other') NOT NULL,
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(100) DEFAULT NULL,
  pincode VARCHAR(20) DEFAULT NULL,
  emergencyContact VARCHAR(100) DEFAULT NULL,
  emergencyPhone VARCHAR(20) DEFAULT NULL,
  bloodGroup VARCHAR(10) DEFAULT NULL,
  allergies TEXT DEFAULT NULL,
  medicalHistory TEXT DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  agreeTerms TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastLogin TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
  profile_img LONGBLOB DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: medical_records
-- ============================================
CREATE TABLE medical_records (
  id INT(11) NOT NULL AUTO_INCREMENT,
  patient_id VARCHAR(50) NOT NULL,
  doctor_id INT(11) NOT NULL,
  examination_type VARCHAR(100) NOT NULL,
  diagnosis TEXT NOT NULL,
  prescription TEXT DEFAULT NULL,
  next_checkup_date DATE DEFAULT NULL,
  additional_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (id),
  KEY patient_id (patient_id),
  KEY doctor_id (doctor_id),
  KEY created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: health_metrics
-- ============================================
CREATE TABLE health_metrics (
  id INT(11) NOT NULL AUTO_INCREMENT,
  patient_id INT(11) NOT NULL,
  metric_type ENUM('blood_pressure','blood_sugar','weight','heart_rate') NOT NULL,
  value_systolic INT(11) DEFAULT NULL,
  value_diastolic INT(11) DEFAULT NULL,
  value_numeric DECIMAL(10,2) DEFAULT NULL,
  unit VARCHAR(20) DEFAULT NULL,
  status ENUM('normal','warning','critical') DEFAULT 'normal',
  recorded_date DATE NOT NULL,
  recorded_time TIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY patient_id (patient_id),
  KEY metric_type (metric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: patient_doctors
-- ============================================
CREATE TABLE patient_doctors (
  id INT(11) NOT NULL AUTO_INCREMENT,
  patient_id INT(11) NOT NULL,
  doctor_id INT(11) NOT NULL,
  linked_date DATETIME NOT NULL,
  status ENUM('active','inactive','pending') DEFAULT 'active',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY patient_id (patient_id),
  KEY doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
