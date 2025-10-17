<?php
// Resequence inventory_management.id to 1..N in the Doctor-side DB (get_pdo) and enforce AUTO_INCREMENT

require_once __DIR__ . '/../js/config.php'; // if get_pdo is defined elsewhere, adjust include
require_once __DIR__ . '/../api/utils.php'; // fallback if needed; adjust as per your project

header('Content-Type: application/json');

try {
    if (!function_exists('get_pdo')) {
        // Try Doc-Dash DB bootstrap
        require_once __DIR__ . '/../config/database.php';
    }
    if (!function_exists('get_pdo')) {
        throw new Exception('get_pdo() not found for Doc-Dash database connection');
    }

    $pdo = get_pdo();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ensure table exists and id is AUTO_INCREMENT
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

    $pdo->exec("ALTER TABLE inventory_management MODIFY COLUMN id INT UNSIGNED NOT NULL AUTO_INCREMENT");

    $pdo->beginTransaction();

    // Move ids out of the way to avoid PK collisions (also converts any 0 ids)
    $pdo->exec("UPDATE inventory_management SET id = id + 1000000");

    // Resequence deterministically
    $pdo->exec("SET @rownum := 0");
    $pdo->exec("UPDATE inventory_management
                SET id = (@rownum := @rownum + 1)
                ORDER BY created_at, name, id");

    // Set next AUTO_INCREMENT
    $nextId = (int)$pdo->query("SELECT IFNULL(MAX(id),0) + 1 FROM inventory_management")->fetchColumn();
    $pdo->exec("ALTER TABLE inventory_management AUTO_INCREMENT = {$nextId}");

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Doc-Dash: inventory_management ids resequenced to 1..N and AUTO_INCREMENT enforced',
        'next_auto_increment' => $nextId
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>


