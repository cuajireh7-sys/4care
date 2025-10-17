<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/database.php';

// Accept JSON body or form POST
$raw = file_get_contents('php://input');
$input = null;
if ($raw) {
    $input = json_decode($raw, true);
}
if (!is_array($input)) {
    $input = $_POST ?? [];
}

$user = trim((string)($input['user'] ?? ''));
$action = trim((string)($input['action'] ?? ''));
$details = trim((string)($input['details'] ?? ''));
$context = $input['context'] ?? null; // optional structured payload

if ($user === '' || $action === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    $pdo = admin_pdo();
    // Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user VARCHAR(100) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_user (user),
        INDEX idx_action (action)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    $stmt = $pdo->prepare('INSERT INTO admin_activity_logs (user, action, details, created_at)
                           VALUES (:user, :action, :details, NOW())');
    $stmt->execute([
        ':user' => $user,
        ':action' => $action,
        ':details' => $details
    ]);

    echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB error']);
}


