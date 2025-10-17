<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
session_start();

require_once __DIR__ . '/../config/database.php';

// Require logged-in doctor
if (empty($_SESSION['doctor_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
    exit;
}

// Parse input (JSON or form-encoded)
$raw = file_get_contents('php://input');
$data = [];
if (is_string($raw) && $raw !== '') {
    $json = json_decode($raw, true);
    if (is_array($json)) { $data = $json; }
    if (empty($data)) {
        $form = [];
        parse_str($raw, $form);
        if (is_array($form) && !empty($form)) { $data = $form; }
    }
}
if (empty($data)) { $data = $_POST ?: $_REQUEST; }

$currentPassword = (string)($data['currentPassword'] ?? $data['current_password'] ?? '');
$newPassword = (string)($data['newPassword'] ?? $data['new_password'] ?? '');
$confirmPassword = (string)($data['confirmPassword'] ?? $data['confirm_password'] ?? '');

if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'All fields are required']);
    exit;
}

if (!hash_equals($newPassword, $confirmPassword)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'New passwords do not match']);
    exit;
}

// Basic strength check
if (strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Password must be at least 8 characters']);
    exit;
}

try {
    $pdo = admin_pdo();
    $doctorId = (int)$_SESSION['doctor_id'];

    // Check which password column exists
    $columnsStmt = $pdo->query("SHOW COLUMNS FROM doctor_users LIKE '%password%'");
    $passwordColumns = $columnsStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $passwordColumn = 'password_hash'; // Default to password_hash
    if (in_array('password', $passwordColumns) && !in_array('password_hash', $passwordColumns)) {
        $passwordColumn = 'password';
    }
    
    // Fetch current hash
    $stmt = $pdo->prepare("SELECT {$passwordColumn} FROM doctor_users WHERE id = ? LIMIT 1");
    $stmt->execute([$doctorId]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'User not found']);
        exit;
    }

    $stored = (string)($row[$passwordColumn] ?? '');
    $currentOk = password_verify($currentPassword, $stored) || hash_equals($stored, $currentPassword);
    if (!$currentOk) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Current password is incorrect']);
        exit;
    }

    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $upd = $pdo->prepare("UPDATE doctor_users SET {$passwordColumn} = ? WHERE id = ?");
    $upd->execute([$hashedPassword, $doctorId]);

    // Invalidate current session to force re-login
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']
        );
    }
    session_destroy();

    echo json_encode(['ok' => true, 'message' => 'Password updated successfully', 'loggedOut' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}


