<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once '../config/database.php';

try {
    $pdo = admin_pdo();
    // Ensure table exists with AUTO_INCREMENT on id
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

    // Force id column to be AUTO_INCREMENT
    $pdo->exec("ALTER TABLE inventory_management MODIFY COLUMN id INT UNSIGNED NOT NULL AUTO_INCREMENT");

    // Reassign any rows with id = 0 to the next available ids using a session variable
    $pdo->exec("SET @next := (SELECT IFNULL(MAX(id),0) FROM inventory_management)");
    // Order by creation/name to keep deterministic order
    $pdo->exec("UPDATE inventory_management SET id = (@next := @next + 1) WHERE id = 0 ORDER BY created_at, name");

    // Set AUTO_INCREMENT to MAX(id)+1 after fixes
    $maxId = (int)$pdo->query("SELECT IFNULL(MAX(id),0)+1 AS next_id FROM inventory_management")->fetchColumn();
    $pdo->exec("ALTER TABLE inventory_management AUTO_INCREMENT = {$maxId}");

    echo json_encode(['success' => true, 'message' => 'inventory_management.id set to AUTO_INCREMENT and zero ids normalized', 'next_id' => $maxId]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


