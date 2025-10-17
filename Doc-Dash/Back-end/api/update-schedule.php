<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();

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
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON input');
    }
    
    if (empty($data['id'])) {
        throw new Exception('Schedule ID is required');
    }
    
    // Update schedule
    $sql = "UPDATE calendar_schedules SET 
            title = ?, 
            description = ?, 
            start_date = ?, 
            start_time = ?, 
            end_time = ?, 
            event_type = ?, 
            duration_minutes = ?, 
            doctor_name = ?, 
            role = ?, 
            status = ?
            WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $data['title'] ?? '',
        $data['description'] ?? '',
        $data['start_date'] ?? '',
        $data['start_time'] ?? null,
        $data['end_time'] ?? null,
        $data['event_type'] ?? 'consultation',
        $data['duration_minutes'] ?? null,
        $data['doctor_name'] ?? null,
        $data['role'] ?? null,
        $data['status'] ?? 'scheduled',
        $data['id']
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Schedule updated successfully'
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
