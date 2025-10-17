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

    // Ensure table and columns exist (safe migrations)
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

        // Backfill status column if missing
        try { $pdo->exec("ALTER TABLE calendar_schedules ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled'"); } catch (Exception $e) {}
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
    $start_date = $input['start_date'] ?? '';
    
    // Validate required fields
    if (empty($id)) {
        throw new Exception('Schedule ID is required');
    }
    
    // Check if schedule exists first
    $checkSql = "SELECT id, title, start_date, status FROM calendar_schedules WHERE id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$id]);
    $schedule = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$schedule) {
        throw new Exception('Schedule not found');
    }
    
    // If already finished, return success
    if ($schedule['status'] === 'finished') {
        echo json_encode([
            'success' => true,
            'message' => 'Schedule already deleted',
            'data' => ['id' => $id, 'status' => 'already_finished']
        ]);
        return;
    }
    
    // Soft-delete: mark as finished instead of removing
    $sql = "UPDATE calendar_schedules SET status = 'finished' WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$id]);
    
    if ($result && $stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Schedule deleted successfully',
            'data' => ['id' => $id, 'title' => $schedule['title']]
        ]);
    } else {
        throw new Exception('Failed to delete schedule - no rows affected');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
