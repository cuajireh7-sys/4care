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
    if (!$input) { throw new Exception('No data received'); }

    // Accept both numeric and string id
    $id = intval($input['id'] ?? ($input['item_id'] ?? 0));
    $name = trim($input['name'] ?? '');
    $quantity = intval($input['quantity'] ?? 0);
    $unit = trim($input['unit'] ?? '');
    $supplier = trim($input['supplier'] ?? '');
    $expiry_date = $input['expiry_date'] ?? null;
    $location = trim($input['location'] ?? '');

    if ($id <= 0 || $name === '' || $unit === '') {
        throw new Exception('Id, name and unit are required');
    }

    $stmt = $pdo->prepare("UPDATE inventory_management SET name=?, quantity=?, unit=?, supplier=?, expiry_date=?, location=? WHERE id=?");
    $ok = $stmt->execute([$name, $quantity, $unit, $supplier, $expiry_date, $location, $id]);
    if (!$ok) throw new Exception('Update failed');

    echo json_encode(['success' => true, 'message' => 'Item updated']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


