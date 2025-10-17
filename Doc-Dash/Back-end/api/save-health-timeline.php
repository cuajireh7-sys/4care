<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => '', 'timeline_id' => null];

try {
    $pdo = get_pdo();
    
    // Get the POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // If no JSON data, try regular POST data
    if (!$data) {
        $data = $_POST;
    }
    
    if (!$data) {
        $response['message'] = 'No data received';
        echo json_encode($response);
        exit();
    }
    
    // Validate required fields
    $required_fields = ['patient_id', 'type_of_checkup', 'description', 'entry_date'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            $response['message'] = "Required field missing: $field";
            echo json_encode($response);
            exit();
        }
    }
    
    // Optional doctor_name field
    $doctor_name = $data['doctor_name'] ?? 'N/A';
    
    // Debug logging
    error_log("Health Timeline Save - Patient ID: " . $data['patient_id']);
    error_log("Health Timeline Save - Data: " . json_encode($data));
    
    // Check if patient_health_timeline table exists, create if not (outside transaction)
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'patient_health_timeline'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        // Try to create with FK first
        $createTableSql = "CREATE TABLE patient_health_timeline (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            type_of_checkup VARCHAR(255) NOT NULL,
            doctor_name VARCHAR(255) DEFAULT 'N/A',
            description TEXT NOT NULL,
            entry_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            -- Foreign key constraint for data integrity
            CONSTRAINT fk_timeline_patient 
                FOREIGN KEY (patient_id) REFERENCES patient_details(patient_id) 
                ON DELETE CASCADE ON UPDATE CASCADE,
                
            -- Index for better performance
            INDEX idx_patient_date (patient_id, entry_date DESC),
            INDEX idx_created_at (created_at DESC)
        ) ENGINE=InnoDB";
        try {
            $pdo->exec($createTableSql);
            error_log("Health Timeline - Created patient_health_timeline table with FK");
        } catch (Exception $e) {
            // Fallback: create without FK (FK caused errno 150)
            error_log("Health Timeline - FK create failed, falling back without FK: " . $e->getMessage());
            $fallbackSql = "CREATE TABLE patient_health_timeline (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                type_of_checkup VARCHAR(255) NOT NULL,
                doctor_name VARCHAR(255) DEFAULT 'N/A',
                description TEXT NOT NULL,
                entry_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_patient_date (patient_id, entry_date DESC),
                INDEX idx_created_at (created_at DESC)
            ) ENGINE=InnoDB";
            $pdo->exec($fallbackSql);
            error_log("Health Timeline - Created patient_health_timeline table WITHOUT FK (fallback)");
        }
    } else {
        // Check if entry_date column exists, add if missing
        $stmt = $pdo->prepare("SHOW COLUMNS FROM patient_health_timeline LIKE 'entry_date'");
        $stmt->execute();
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE patient_health_timeline ADD COLUMN entry_date DATE NOT NULL DEFAULT '2024-01-01'");
            error_log("Health Timeline - Added missing entry_date column");
        }
        
        // Check if doctor_name column exists, add if missing
        $stmt = $pdo->prepare("SHOW COLUMNS FROM patient_health_timeline LIKE 'doctor_name'");
        $stmt->execute();
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE patient_health_timeline ADD COLUMN doctor_name VARCHAR(255) DEFAULT 'N/A'");
            error_log("Health Timeline - Added missing doctor_name column");
        }
    }
    
    // Start transaction after table setup
    $pdo->beginTransaction();
    
    // Insert health timeline entry
    $stmt = $pdo->prepare("
        INSERT INTO patient_health_timeline (patient_id, type_of_checkup, doctor_name, description, entry_date) 
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['patient_id'],
        $data['type_of_checkup'],
        $doctor_name,
        $data['description'],
        $data['entry_date']
    ]);
    
    $timeline_id = $pdo->lastInsertId();
    
    $pdo->commit();
    
    $response['success'] = true;
    $response['message'] = 'Health timeline entry saved successfully';
    $response['timeline_id'] = $timeline_id;
    
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Health Timeline Save Error: " . $e->getMessage());
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
