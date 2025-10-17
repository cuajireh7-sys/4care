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
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data || empty($data['timeline_id']) || empty($data['patient_email'])) {
        $response['message'] = 'Required data missing: timeline_id or patient_email';
        echo json_encode($response);
        exit();
    }

    $timeline_id = (int)$data['timeline_id'];
    $patient_email = $data['patient_email'];

    // Verify timeline exists (support id or timeline_id column)
    $col = 'timeline_id';
    try {
        $chk = $pdo->prepare("SHOW COLUMNS FROM patient_health_timeline LIKE 'id'");
        $chk->execute();
        if ($chk->rowCount() > 0) { $col = 'id'; }
    } catch (Throwable $e) {}
    $stmt = $pdo->prepare("SELECT $col FROM patient_health_timeline WHERE $col = ?");
    $stmt->execute([$timeline_id]);
    if ($stmt->rowCount() === 0) {
        $response['message'] = 'Timeline entry not found';
        echo json_encode($response);
        exit();
    }

    // Ensure auxiliary columns to track sent status (add if missing)
    try {
        $pdo->exec("ALTER TABLE patient_health_timeline ADD COLUMN sent_status ENUM('pending','sent') NULL DEFAULT NULL");
    } catch (Throwable $e) { /* ignore if exists */ }
    try {
        $pdo->exec("ALTER TABLE patient_health_timeline ADD COLUMN sent_email VARCHAR(255) NULL DEFAULT NULL");
    } catch (Throwable $e) { /* ignore if exists */ }
    try {
        $pdo->exec("ALTER TABLE patient_health_timeline ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    } catch (Throwable $e) { /* ignore if exists */ }

    // Update
    $stmt = $pdo->prepare("UPDATE patient_health_timeline SET sent_status = 'sent', sent_email = ?, updated_at = NOW() WHERE $col = ?");
    $stmt->execute([$patient_email, $timeline_id]);

    if ($stmt->rowCount() > 0) {
        $response['success'] = true;
        $response['message'] = 'Timeline entry sent successfully to ' . $patient_email;
    } else {
        $response['message'] = 'Failed to update timeline status';
    }

} catch (Throwable $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
