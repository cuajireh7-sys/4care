<?php
header('Content-Type: application/json');

if (!isset($_GET['token']) || empty($_GET['token'])) {
    echo json_encode(['ok' => false, 'error' => 'No token provided']);
    exit;
}

$token = $_GET['token'];

try {
    require_once __DIR__ . '/../../../../Database-Connection/connection.php';
    $pdo = get_pdo();

    // Validate against patient_account.password_reset_token
    $sql = 'SELECT * FROM patient_account WHERE password_reset_token = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['ok' => false, 'error' => 'Invalid or used reset token.']);
        exit;
    }

    if (isset($user['password_reset_expires_at']) && strtotime($user['password_reset_expires_at']) < time()) {
        echo json_encode(['ok' => false, 'error' => 'Reset token expired.']);
        exit;
    }

    echo json_encode(['ok' => true, 'message' => 'Reset token is still valid.']);

} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Database error']);
}
?>