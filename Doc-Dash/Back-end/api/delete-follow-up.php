<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => ''];

try {
    $pdo = get_pdo();
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) { $data = $_POST; }

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid follow-up id']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM patient_follow_ups WHERE id = ?');
    $stmt->execute([$id]);

    $response['success'] = true;
    $response['message'] = 'Follow-up deleted';
} catch (Throwable $e) {
    http_response_code(500);
    $response['message'] = 'Server error';
}

echo json_encode($response);
?>


