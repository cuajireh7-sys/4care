<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();
    // Table: doctor_users (id, first_name, last_name, email, status)
    $stmt = $pdo->query('SELECT id, first_name, last_name, email FROM doctor_users WHERE status = "active" ORDER BY last_name, first_name');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    echo json_encode(['ok' => true, 'data' => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>


