<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = admin_pdo();
    // Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user VARCHAR(100) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT NULL,
        context_json JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_user (user),
        INDEX idx_action (action)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    $stmt = $pdo->query('SELECT id, created_at AS timestamp, user, action, details
                         FROM admin_activity_logs
                         ORDER BY id DESC
                         LIMIT 500');
    $rows = $stmt->fetchAll();
    echo json_encode(['ok' => true, 'data' => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB error']);
}


