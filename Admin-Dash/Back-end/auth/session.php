<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
session_start();

if (!empty($_SESSION['admin_id'])) {
    echo json_encode([
        'ok' => true,
        'id' => (int)$_SESSION['admin_id'],
        'username' => (string)($_SESSION['admin_username'] ?? ''),
        'role' => (string)($_SESSION['admin_role'] ?? 'admin'),
    ]);
} else {
    http_response_code(401);
    echo json_encode(['ok' => false]);
}


