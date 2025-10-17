<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

// Simple utility endpoint to reset passwords for doctor2/doctor3/doctor4 to 'doctor123'
// Usage (local): http://localhost/4care/Admin-Dash/Back-end/auth/reset-doctor-passwords.php

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = admin_pdo();
    $pdo->beginTransaction();

    $newHash = password_hash('doctor123', PASSWORD_DEFAULT);

    $usernames = ['doctor2','doctor3','doctor4'];
    $stmt = $pdo->prepare('UPDATE doctor_users SET password_hash = :hash WHERE username = :u LIMIT 1');
    $updated = 0;
    foreach ($usernames as $u) {
        $stmt->execute([':hash' => $newHash, ':u' => $u]);
        $updated += $stmt->rowCount();
    }

    $pdo->commit();
    echo json_encode(['ok' => true, 'updated' => $updated, 'info' => 'Passwords set to doctor123']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) { $pdo->rollBack(); }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}


