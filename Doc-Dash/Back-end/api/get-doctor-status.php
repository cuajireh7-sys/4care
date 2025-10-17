<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();

    // Assuming doctor ID is 1 for now, you might want to get this from a session or token
    $doctor_id = 1;

    $stmt = $pdo->prepare('SELECT hospital_status FROM doctor_users WHERE id = ?');
    $stmt->execute([$doctor_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $status = $row['hospital_status'] ? 'online' : 'offline';
        echo json_encode(['success' => true, 'status' => $status]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Doctor not found.']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>
