<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

try {
    $pdo = admin_pdo();

    // Ensure calendar_schedules exists and drop legacy table if present
    (function(PDO $pdo) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS calendar_schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            start_date DATE NOT NULL,
            start_time TIME NULL,
            end_time TIME NULL,
            event_type VARCHAR(50) DEFAULT 'consultation',
            duration_minutes INT NULL,
            doctor_name VARCHAR(255) NULL,
            role VARCHAR(100) NULL,
            status VARCHAR(50) DEFAULT 'scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("DROP TABLE IF EXISTS admin_schedules");
    })($pdo);
    
    // Get JSON input
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    
    if (!$input) {
        // Try form data
        $input = $_POST;
    }
    
    if (!$input) {
        throw new Exception('No data received');
    }
    
    $id = $input['id'] ?? '';
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $start_date = $input['start_date'] ?? '';
    $start_time = $input['start_time'] ?? '';
    $end_date = $input['end_date'] ?? $start_date;
    $end_time = $input['end_time'] ?? '';
    $event_type = $input['event_type'] ?? 'consultation';
    $duration_minutes = isset($input['duration_minutes']) ? (int)$input['duration_minutes'] : null;
    $doctor_name = $input['doctor_name'] ?? null;
    $role = $input['role'] ?? null;
    $status = $input['status'] ?? 'scheduled';
    $doctor_name = $input['doctor_name'] ?? '';
    $patient_name = $input['patient_name'] ?? '';
    $location = $input['location'] ?? '';
    $notes = $input['notes'] ?? '';
    
    // Validate required fields
    if (empty($id)) {
        throw new Exception('Schedule ID is required');
    }
    
    if (empty($title) || empty($start_date)) {
        throw new Exception('Title and start date are required');
    }
    
    // Update schedule
    $sql = "UPDATE calendar_schedules SET 
            title = ?, description = ?, start_date = ?, start_time = ?, 
            end_time = ?, event_type = ?, duration_minutes = ?, doctor_name = ?, role = ?
            WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $title, $description, $start_date, $start_time, $end_time, 
        $event_type, $duration_minutes, $doctor_name, $role, $id
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Schedule updated successfully',
            'data' => [
                'id' => $id,
                'title' => $title,
                'start_date' => $start_date,
                'event_type' => $event_type
            ]
        ]);
    } else {
        throw new Exception('Failed to update schedule');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
