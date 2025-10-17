<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

$email = isset($_GET['email']) ? trim((string)$_GET['email']) : '';
if ($email === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email is required']);
    exit;
}

require_once __DIR__ . '/../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();

    $stmt = $pdo->prepare(
        'SELECT pd.*, ps.id AS signup_id, ps.firstName, ps.lastName
         FROM patient_signup ps
         LEFT JOIN patient_details pd ON pd.email = ps.email
         WHERE ps.email = ?
         ORDER BY pd.created_at DESC
         LIMIT 1'
    );
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['ok' => true, 'data' => null]);
        exit;
    }
    echo json_encode(['ok' => true, 'data' => $row]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}
exit;

