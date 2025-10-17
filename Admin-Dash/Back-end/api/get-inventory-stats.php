<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/database.php';

try {
    $pdo = admin_pdo();
    // Ensure table exists (no-op if already exists)
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

    // Parameters
    $lowStockThreshold = isset($_GET['low_stock_threshold']) ? (int)$_GET['low_stock_threshold'] : 10;
    $expiringDays = isset($_GET['expiring_days']) ? (int)$_GET['expiring_days'] : 30;

    // Total active items
    $total = (int)$pdo->query("SELECT COUNT(*) FROM inventory_management WHERE status <> 'deleted'")->fetchColumn();

    // Low stock items
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM inventory_management WHERE status <> 'deleted' AND quantity <= ?");
    $stmt->execute([$lowStockThreshold]);
    $lowStock = (int)$stmt->fetchColumn();

    // Expiring soon items
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM inventory_management WHERE status <> 'deleted' AND expiry_date IS NOT NULL AND expiry_date <> '0000-00-00' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)");
    $stmt->execute([$expiringDays]);
    $expiringSoon = (int)$stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => [
            'total_items' => $total,
            'low_stock' => $lowStock,
            'expiring_soon' => $expiringSoon,
            'params' => [ 'low_stock_threshold' => $lowStockThreshold, 'expiring_days' => $expiringDays ]
        ]
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


