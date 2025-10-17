<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$email = isset($_GET['email']) ? trim((string)$_GET['email']) : '';
if ($email === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email is required']);
    exit;
}

try {
    $pdo = get_pdo();

    // Resolve patient_id from patient_details by email
    $stmt = $pdo->prepare('SELECT patient_id FROM patient_details WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $patientId = $stmt->fetchColumn();
    if (!$patientId) {
        echo json_encode(['ok' => true, 'data' => []]);
        exit;
    }

    // Fetch follow-ups; prefer doctor_name field when available
    $sql = 'SELECT f.id, f.patient_id, f.follow_up_date, f.notes,
                   COALESCE(f.doctor_name, "Dr. Unknown") AS doctor_name
            FROM patient_follow_ups f
            WHERE f.patient_id = ?
            ORDER BY f.follow_up_date DESC, f.id DESC';
    $q = $pdo->prepare($sql);
    $q->execute([$patientId]);
    $rows = $q->fetchAll(PDO::FETCH_ASSOC) ?: [];

    echo json_encode(['ok' => true, 'data' => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>


