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

    // Ensure calendar_schedules exists; migrate and drop legacy table if present
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

        $hasLegacy = $pdo->query("SHOW TABLES LIKE 'admin_schedules'")->rowCount() > 0;
        if ($hasLegacy) {
            $alreadyMigrated = $pdo->query("SELECT COUNT(*) AS c FROM calendar_schedules")->fetch()['c'] ?? 0;
            if ((int)$alreadyMigrated === 0) {
                $pdo->exec("INSERT INTO calendar_schedules (title, description, start_date, start_time, end_time, event_type)
                            SELECT title, description, start_date, start_time, end_time,
                                   COALESCE(event_type, 'consultation')
                            FROM admin_schedules");
            }
            $pdo->exec("DROP TABLE IF EXISTS admin_schedules");
        }
    })($pdo);
    
    // Get parameters
    $start_date = $_GET['start_date'] ?? date('Y-m-01'); // Default to first day of current month
    $end_date = $_GET['end_date'] ?? date('Y-m-t'); // Default to last day of current month
    $doctor_name = $_GET['doctor_name'] ?? '';
    $event_type = $_GET['event_type'] ?? '';
    
    $sql = "SELECT * FROM calendar_schedules WHERE start_date BETWEEN ? AND ?";
    $params = [$start_date, $end_date];
    
    if (!empty($event_type)) {
        $sql .= " AND event_type = ?";
        $params[] = $event_type;
    }
    
    $sql .= " ORDER BY start_date ASC, start_time ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Schedules loaded successfully',
        'data' => $schedules
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
