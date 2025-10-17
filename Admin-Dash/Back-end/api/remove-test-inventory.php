<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once '../config/database.php';

try {
    $pdo = admin_pdo();
    $pdo->exec("CREATE TABLE IF NOT EXISTS inventory_management (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        supplier VARCHAR(255) NULL,
        expiry_date DATE NULL,
        location VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Names to remove (case-insensitive)
    $names = ['rose','alwyn','jireh'];
    $in  = str_repeat('?,', count($names) - 1) . '?';
    $sql = "DELETE FROM inventory_management WHERE LOWER(name) IN ($in)";
    $stmt = $pdo->prepare($sql);
    $ok = $stmt->execute(array_map('strtolower', $names));

    // Reset AUTO_INCREMENT after deletions to MAX(id)+1
    $maxId = (int)$pdo->query("SELECT IFNULL(MAX(id),0)+1 AS next_id FROM inventory_management")->fetchColumn();
    $pdo->exec("ALTER TABLE inventory_management AUTO_INCREMENT = {$maxId}");

    echo json_encode(['success' => true, 'deleted' => $stmt->rowCount(), 'next_id' => $maxId]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


