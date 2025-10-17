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
    
    // Ensure calendar_schedules exists; migrate then drop legacy admin_schedules if present
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

        // If legacy table exists, migrate minimal fields then drop it
        $hasLegacy = $pdo->query("SHOW TABLES LIKE 'admin_schedules'")->rowCount() > 0;
        if ($hasLegacy) {
            // Copy only the needed columns if not already migrated
            $alreadyMigrated = $pdo->query("SELECT COUNT(*) AS c FROM calendar_schedules")->fetch()['c'] ?? 0;
            if ((int)$alreadyMigrated === 0) {
                $pdo->exec("INSERT INTO calendar_schedules (title, description, start_date, start_time, end_time, event_type)
                            SELECT title, description, start_date, start_time, end_time,
                                   COALESCE(event_type, 'consultation')
                            FROM admin_schedules");
            }
            // Drop legacy table to avoid confusion
            $pdo->exec("DROP TABLE IF EXISTS admin_schedules");
        }

        // Ensure optional columns exist (safe on repeated runs)
        try { $pdo->exec("ALTER TABLE calendar_schedules ADD COLUMN IF NOT EXISTS duration_minutes INT NULL"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE calendar_schedules ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255) NULL"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE calendar_schedules ADD COLUMN IF NOT EXISTS role VARCHAR(100) NULL"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE calendar_schedules DROP COLUMN IF EXISTS updated_at"); } catch (Exception $e) {}
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
    
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $start_date = $input['start_date'] ?? '';
    $start_time = $input['start_time'] ?? '';
    $end_time = $input['end_time'] ?? '';
    $event_type = $input['event_type'] ?? 'consultation';
    $duration_minutes = isset($input['duration_minutes']) ? (int)$input['duration_minutes'] : null;
    $doctor_name = $input['doctor_name'] ?? null;
    $role = $input['role'] ?? null;
    
    // Validate required fields
    if (empty($title) || empty($start_date)) {
        throw new Exception('Title and start date are required');
    }
    
    // Insert new schedule (doctor calendar)
    $sql = "INSERT INTO calendar_schedules (title, description, start_date, start_time, end_time, event_type, duration_minutes, doctor_name, role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $title, $description, $start_date, $start_time, $end_time, $event_type, $duration_minutes, $doctor_name, $role
    ]);
    
    if ($result) {
        $schedule_id = $pdo->lastInsertId();
        
        // Log the new schedule for real-time events
        error_log("New schedule created: ID $schedule_id, Title: $title, Date: $start_date");
        
        echo json_encode([
            'success' => true,
            'message' => 'Schedule created successfully',
            'data' => [
                'id' => $schedule_id,
                'title' => $title,
                'start_date' => $start_date,
                'event_type' => $event_type
            ]
        ]);
    } else {
        throw new Exception('Failed to create schedule');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
