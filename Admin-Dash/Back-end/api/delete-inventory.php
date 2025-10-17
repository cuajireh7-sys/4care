<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/database.php';

try {
    $pdo = admin_pdo();
    $pdo->exec("CREATE TABLE IF NOT EXISTS inventory_management (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        supplier VARCHAR(255) NULL,
        expiry_date DATE NULL,
        location VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!$input) { $input = $_POST; }
    $id = intval($input['id'] ?? ($input['item_id'] ?? 0));
    if ($id <= 0) { throw new Exception('Invalid id'); }

    $stmt = $pdo->prepare("UPDATE inventory_management SET status='deleted' WHERE id=?");
    $ok = $stmt->execute([$id]);
    if (!$ok) throw new Exception('Delete failed');
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


