<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $pdo = get_pdo();
    // Prefer new normalized table; fall back to legacy if not present
    try {
        $pdo->query("SELECT 1 FROM patient_follow_ups LIMIT 1");
        $stmt = $pdo->query('SELECT f.id, f.patient_id, f.doctor_name, f.patient_email, f.follow_up_date AS date, f.notes AS details, f.status, f.created_at
                             FROM patient_follow_ups f ORDER BY f.follow_up_date DESC, f.id DESC');
    } catch (Throwable $__) {
        $stmt = $pdo->query('SELECT id, patient_id, patient_display_id, patient_name, details, date, status, created_at, updated_at FROM patient_followup ORDER BY date DESC, id DESC');
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $response['success'] = true;
    $response['message'] = 'Follow-ups loaded';
    $response['data'] = $rows;
} catch (Throwable $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>


