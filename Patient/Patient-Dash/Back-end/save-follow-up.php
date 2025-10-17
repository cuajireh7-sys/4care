<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../../Database-Connection/connection.php';

function bad(string $m, int $c = 400): void { http_response_code($c); echo json_encode(['ok'=>false,'error'=>$m]); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    bad('Method not allowed', 405);
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

$email = trim((string)($data['email'] ?? ''));
$doctorId = (int)($data['doctor_id'] ?? 0);
$date = trim((string)($data['follow_up_date'] ?? ''));
$notes = trim((string)($data['notes'] ?? ''));

if ($email === '') bad('Email is required');
if ($doctorId <= 0) bad('Doctor is required');
if ($date === '') bad('Date is required');

try {
    $pdo = get_pdo();

    // Resolve patient_id via patient_details
    $stmt = $pdo->prepare('SELECT patient_id FROM patient_details WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $patientId = (int)$stmt->fetchColumn();
    if ($patientId <= 0) bad('Patient not found for this email', 404);

    // Validate doctor exists
    $d = $pdo->prepare('SELECT id FROM doctor_users WHERE id = ? AND status = "active"');
    $d->execute([$doctorId]);
    if (!$d->fetchColumn()) bad('Doctor not found or inactive', 404);

    // Insert follow-up
    $ins = $pdo->prepare('INSERT INTO patient_follow_ups (patient_id, doctor_id, follow_up_date, notes, created_at) VALUES (?,?,?,?, NOW())');
    $ins->execute([$patientId, $doctorId, $date, $notes]);

    echo json_encode(['ok' => true, 'message' => 'Follow-up saved']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>


