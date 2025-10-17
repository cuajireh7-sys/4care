<?php
// Resequence inventory_management.id to 1..N and enforce AUTO_INCREMENT (no zero ids)
// Usage: call this script once from a browser or via curl

require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');

try {
    $pdo = admin_pdo();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ensure table exists and id is AUTO_INCREMENT column
    $pdo->exec("CREATE TABLE IF NOT EXISTS inventory_management (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) DEFAULT NULL,
        supplier VARCHAR(255) DEFAULT NULL,
        expiry_date DATE DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        status ENUM('active','deleted') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Force AUTO_INCREMENT attribute on id
    $pdo->exec("ALTER TABLE inventory_management MODIFY COLUMN id INT UNSIGNED NOT NULL AUTO_INCREMENT");

    $pdo->beginTransaction();

    // Temporarily move ids out of the way to avoid PK collisions
    $pdo->exec("UPDATE inventory_management SET id = id + 1000000");

    // Resequence deterministically; prefer created_at then name
    $pdo->exec("SET @rownum := 0");
    $pdo->exec("UPDATE inventory_management
                SET id = (@rownum := @rownum + 1)
                ORDER BY created_at, name, id");

    // Set next AUTO_INCREMENT to MAX(id)+1
    $nextId = (int)$pdo->query("SELECT IFNULL(MAX(id),0) + 1 FROM inventory_management")->fetchColumn();
    $pdo->exec("ALTER TABLE inventory_management AUTO_INCREMENT = {$nextId}");

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'inventory_management ids resequenced to 1..N and AUTO_INCREMENT enforced',
        'next_auto_increment' => $nextId
    ]);
} catch (Throwable $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>




