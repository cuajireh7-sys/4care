<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => '', 'timeline_id' => null];

try {
    $pdo = get_pdo();
    
    // Get the POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Debug logging
    error_log('patient-portal-save-health-timeline.php - Raw input: ' . $input);
    error_log('patient-portal-save-health-timeline.php - Decoded data: ' . print_r($data, true));
    error_log('patient-portal-save-health-timeline.php - Patient ID received: ' . $data['patient_id']);
    
    // If no JSON data, try regular POST data
    if (!$data) {
        $data = $_POST;
        error_log('patient-portal-save-health-timeline.php - Using POST data: ' . print_r($data, true));
    }
    
    if (!$data) {
        $response['message'] = 'No data received';
        echo json_encode($response);
        exit();
    }
    
    // Validate required fields (entry_date removed)
    $required_fields = ['patient_id', 'type_of_checkup', 'description'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            $response['message'] = "Required field missing: $field";
            echo json_encode($response);
            exit();
        }
    }
    
    // Always use positive patient_id linked to patient_details.id
    $rawPatientId = is_string($data['patient_id']) ? preg_replace('/^pat/i', '', (string)$data['patient_id']) : $data['patient_id'];
    $patient_id = (int)$rawPatientId;
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Check if patient_health_timeline table exists, otherwise use health_timeline
    $tblExists = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_health_timeline'");
    $tblExists->execute();
    $useNewTable = (int)$tblExists->fetchColumn() > 0;
    
    $tableName = $useNewTable ? 'patient_health_timeline' : 'health_timeline';
    $idColumn = $useNewTable ? 'id' : 'timeline_id';
    
    // Insert health timeline entry
    $stmt = $pdo->prepare("
        INSERT INTO $tableName (patient_id, type_of_checkup, description) 
        VALUES (?, ?, ?)
    ");
    
    $stmt->execute([
        $patient_id,
        $data['type_of_checkup'],
        $data['description']
    ]);
    
    $timeline_id = $pdo->lastInsertId();
    
    $pdo->commit();
    
    $response['success'] = true;
    $response['message'] = 'Health timeline entry saved successfully';
    $response['timeline_id'] = $timeline_id;
    $response['patient_id_used'] = $patient_id;
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $response['message'] = 'Error: ' . $e->getMessage();
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $response['message'] = 'Fatal error: ' . $e->getMessage();
}

echo json_encode($response);
?>
