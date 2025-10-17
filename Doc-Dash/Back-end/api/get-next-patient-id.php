<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();
    $maxStmt = $pdo->query("SELECT MAX(CAST(SUBSTRING(patient_visible_id, 2) AS UNSIGNED)) AS max_seq FROM patient_details WHERE patient_visible_id REGEXP '^#[0-9]+'");
    $maxRow = $maxStmt ? $maxStmt->fetch(PDO::FETCH_ASSOC) : null;
    $nextSeq = (int)($maxRow['max_seq'] ?? 0) + 1;
    $patientCode = '#' . str_pad((string)$nextSeq, 5, '0', STR_PAD_LEFT);
    echo json_encode(['success' => true, 'patient_code' => $patientCode]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


