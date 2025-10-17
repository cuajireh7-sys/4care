<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
session_start();

if (!empty($_SESSION['doctor_id'])) {
    echo json_encode([
        'ok' => true,
        'id' => (int)$_SESSION['doctor_id'],
        'username' => (string)($_SESSION['doctor_username'] ?? ''),
        'role' => (string)($_SESSION['doctor_role'] ?? 'doctor'),
    ]);
} else {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
}


