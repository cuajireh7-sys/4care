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

    $doctors = [];

    // Prefer doctor_users table with employee_id and name fields
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM doctor_users")->fetchAll(PDO::FETCH_COLUMN);
        $hasEmp = in_array('employee_id', $cols, true);
        $hasF = in_array('f_name', $cols, true);
        $hasL = in_array('l_name', $cols, true);
        $hasUsername = in_array('username', $cols, true);
        $hasName = in_array('name', $cols, true);

        if ($hasEmp && ($hasF || $hasL)) {
            $stmt = $pdo->query("SELECT employee_id, COALESCE(CONCAT(TRIM(f_name),' ',TRIM(l_name)), TRIM(f_name), TRIM(l_name)) AS full_name FROM doctor_users WHERE employee_id IS NOT NULL AND employee_id <> '' ORDER BY l_name, f_name");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $label = trim((string)($r['full_name'] ?? ''));
                if ($label === '') { $label = (string)$r['employee_id']; }
                $doctors[] = [
                    'employee_id' => (string)$r['employee_id'],
                    'name' => $label,
                ];
            }
        } elseif ($hasEmp && $hasName) {
            $stmt = $pdo->query("SELECT employee_id, name FROM doctor_users WHERE employee_id IS NOT NULL AND employee_id <> '' ORDER BY name");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $doctors[] = [
                    'employee_id' => (string)$r['employee_id'],
                    'name' => trim((string)$r['name']),
                ];
            }
        } elseif ($hasUsername) {
            // Fallback to usernames if names are not structured
            $stmt = $pdo->query("SELECT username FROM doctor_users WHERE username IS NOT NULL AND username <> '' ORDER BY username");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $doctors[] = [
                    'employee_id' => (string)$r['username'],
                    'name' => trim((string)$r['username']),
                ];
            }
        }
    } catch (Throwable $__) { /* ignore and try fallbacks */ }

    // Final fallback: doctor_details table
    if (count($doctors) === 0) {
        try {
            $cols = $pdo->query("SHOW COLUMNS FROM doctor_details")->fetchAll(PDO::FETCH_COLUMN);
            $hasEmp = in_array('employee_id', $cols, true);
            $hasF = in_array('firstName', $cols, true) || in_array('f_name', $cols, true);
            $hasL = in_array('lastName', $cols, true) || in_array('l_name', $cols, true);

            if ($hasF || $hasL) {
                $stmt = $pdo->query("SELECT 
                    " . ($hasEmp ? "employee_id" : "id AS employee_id") . ",
                    COALESCE(CONCAT(TRIM(COALESCE(firstName,f_name)),' ',TRIM(COALESCE(lastName,l_name))), TRIM(COALESCE(firstName,f_name)), TRIM(COALESCE(lastName,l_name))) AS full_name
                    FROM doctor_details ORDER BY lastName, l_name, firstName, f_name");
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) {
                    $label = trim((string)($r['full_name'] ?? ''));
                    if ($label === '') { $label = (string)$r['employee_id']; }
                    $doctors[] = [
                        'employee_id' => (string)$r['employee_id'],
                        'name' => $label,
                    ];
                }
            }
        } catch (Throwable $__) { /* ignore */ }
    }

    // Deduplicate by employee_id
    $uniq = [];
    $out = [];
    foreach ($doctors as $d) {
        $key = $d['employee_id'] . '|' . $d['name'];
        if (isset($uniq[$key])) continue;
        $uniq[$key] = true;
        $out[] = $d;
    }

    // Sort by display name natural order
    usort($out, function($a,$b){ return strnatcasecmp($a['name'], $b['name']); });

    $response['success'] = true;
    $response['data'] = $out;
    $response['message'] = 'Doctors loaded';
} catch (Throwable $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>


