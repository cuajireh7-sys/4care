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

    // Prefer doctor_users_backup (username), then fallback to doctor_users, then doctor_details
    $names = [];
    try {
        // doctor_users_backup first
        $stmt = $pdo->query("DESCRIBE doctor_users_backup");
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (in_array('username', $cols)) {
            $rows = $pdo->query("SELECT DISTINCT username FROM doctor_users_backup WHERE username IS NOT NULL AND username != '' ORDER BY username ASC")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) { $names[] = trim($r['username']); }
        } else {
            // Fallback to doctor_users
            $stmt = $pdo->query("DESCRIBE doctor_users");
            $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
            if (in_array('username', $cols)) {
                $rows = $pdo->query("SELECT DISTINCT username FROM doctor_users WHERE username IS NOT NULL AND username != '' ORDER BY username ASC")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) { $names[] = trim($r['username']); }
            } elseif (in_array('firstName', $cols) && in_array('lastName', $cols)) {
                $rows = $pdo->query("SELECT firstName, lastName FROM doctor_users WHERE (firstName IS NOT NULL OR lastName IS NOT NULL)")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) {
                    $full = trim(($r['firstName'] ?? '') . ' ' . ($r['lastName'] ?? ''));
                    if ($full !== '') $names[] = $full;
                }
            } elseif (in_array('name', $cols)) {
                $rows = $pdo->query("SELECT name FROM doctor_users WHERE name IS NOT NULL AND name != ''")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) { $names[] = $r['name']; }
            }
        }
    } catch (Throwable $e) {
        // ignore
    }

    // Fallback doctor_details
    if (count($names) === 0) {
        try {
            $stmt = $pdo->query("DESCRIBE doctor_details");
            $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
            if (in_array('firstName', $cols) && in_array('lastName', $cols)) {
                $rows = $pdo->query("SELECT firstName, lastName FROM doctor_details WHERE (firstName IS NOT NULL OR lastName IS NOT NULL)")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) {
                    $full = trim(($r['firstName'] ?? '') . ' ' . ($r['lastName'] ?? ''));
                    if ($full !== '') $names[] = $full;
                }
            }
        } catch (Throwable $e) {
            // ignore
        }
    }

    // Deduplicate and sort
    $names = array_values(array_unique($names));
    sort($names, SORT_NATURAL | SORT_FLAG_CASE);

    $response['success'] = true;
    $response['message'] = 'Doctor names loaded';
    $response['data'] = $names;

} catch (Throwable $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
