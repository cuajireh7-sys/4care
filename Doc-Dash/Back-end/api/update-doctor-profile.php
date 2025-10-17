<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
session_start();

require_once __DIR__ . '/../../../Database-Connection/connection.php';

if (empty($_SESSION['doctor_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Accept JSON or form data
$raw = file_get_contents('php://input');
$data = [];
if (is_string($raw) && $raw !== '') {
    $json = json_decode($raw, true);
    if (is_array($json)) { $data = $json; }
    if (empty($data)) { parse_str($raw, $data); }
}
if (empty($data)) { $data = $_POST ?: $_REQUEST; }

$fields = [
    'employee_id', 'specialization', 'license_number', 'date_of_birth', 'phone_number', 'address',
    'years_of_experience', 'joined_date', 'education', 'certifications', 'department',
    'shift_details', 'emergency_contact', 'hospital_status', 'email', 'f_name', 'l_name'
];

$updates = [];
$params = [];
foreach ($fields as $f) {
    if (array_key_exists($f, $data)) {
        $updates[] = "$f = ?";
        $params[] = (string)$data[$f];
    }
}

if (empty($updates)) {
    echo json_encode(['success' => false, 'message' => 'No fields to update']);
    exit;
}

try {
    $pdo = get_pdo();
    $sql = 'UPDATE doctor_users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $params[] = (int)$_SESSION['doctor_id'];
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
