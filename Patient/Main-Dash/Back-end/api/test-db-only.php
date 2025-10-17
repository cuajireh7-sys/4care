<?php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../../Database-Connection/connection.php';
    $pdo = get_pdo();
    echo json_encode(['success' => true, 'message' => 'Database connection works']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
