<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => '', 'id' => null];

try {
    $pdo = get_pdo();

    // Ensure table exists (patient_followup)
    // Ensure new patient_follow_ups table exists (normalized)
    $pdo->exec("CREATE TABLE IF NOT EXISTS patient_follow_ups (
        id INT NOT NULL AUTO_INCREMENT,
        patient_id INT NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        patient_email VARCHAR(255) NULL,
        follow_up_date DATE NOT NULL,
        notes VARCHAR(500) NULL,
        status ENUM('Pending','Done') NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_pf_patient (patient_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Backward-compat migrations for existing installs
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM patient_follow_ups")->fetchAll(PDO::FETCH_COLUMN, 0);
        if (!in_array('doctor_name', $cols, true)) { $pdo->exec("ALTER TABLE patient_follow_ups ADD COLUMN doctor_name VARCHAR(255) NOT NULL AFTER patient_id"); }
        if (!in_array('patient_email', $cols, true)) { $pdo->exec("ALTER TABLE patient_follow_ups ADD COLUMN patient_email VARCHAR(255) NULL AFTER doctor_name"); }
        if (!in_array('status', $cols, true)) { $pdo->exec("ALTER TABLE patient_follow_ups ADD COLUMN status ENUM('Pending','Done') NOT NULL DEFAULT 'Pending' AFTER notes"); }
    } catch (Throwable $m__) {}

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) { $data = $_POST; }

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    $patient_id = isset($data['patient_id']) ? (int)$data['patient_id'] : 0;
    $email = isset($data['email']) ? trim((string)$data['email']) : '';
    $doctor_name = isset($data['doctor_name']) ? trim((string)$data['doctor_name']) : '';
    $details = isset($data['details']) ? trim($data['details']) : '';
    $date = isset($data['date']) ? trim($data['date']) : '';
    $status = 'Pending';

    // Resolve patient_id from email if provided
    if ($patient_id <= 0 && $email !== '') {
        try {
            $stmt = $pdo->prepare('SELECT patient_id FROM patient_details WHERE LOWER(email) = LOWER(?) LIMIT 1');
            $stmt->execute([$email]);
            $pid = (int)$stmt->fetchColumn();
            if ($pid > 0) { $patient_id = $pid; }
        } catch (Throwable $__) {}
    }

    if ($patient_id <= 0 || $doctor_name === '' || $details === '' || $date === '') {
        $response['message'] = 'Missing required fields';
        echo json_encode($response);
        exit;
    }

    if ($id > 0) {
        $stmt = $pdo->prepare('UPDATE patient_follow_ups SET patient_id=?, doctor_name=?, patient_email=?, notes=?, follow_up_date=? WHERE id=?');
        $stmt->execute([$patient_id, $doctor_name, $email ?: null, $details, $date, $id]);
        $response['id'] = $id;
    } else {
        $stmt = $pdo->prepare('INSERT INTO patient_follow_ups (patient_id, doctor_name, patient_email, follow_up_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$patient_id, $doctor_name, $email ?: null, $date, $details, $status]);
        $response['id'] = (int)$pdo->lastInsertId();
    }

    $response['patient_id'] = $patient_id;

    $response['success'] = true;
    $response['message'] = 'Follow-up saved';
} catch (Throwable $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>


