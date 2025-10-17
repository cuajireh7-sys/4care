<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $pdo = get_pdo();

    // Schema helpers
    $tableExists = function(PDO $pdo, string $table): bool {
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
            $stmt->execute([$table]);
            return (int)$stmt->fetchColumn() > 0;
        } catch (Throwable $e) { return false; }
    };
    $hasColumn = function(PDO $pdo, string $table, string $column): bool {
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?");
            $stmt->execute([$table, $column]);
            return (int)$stmt->fetchColumn() > 0;
        } catch (Throwable $e) { return false; }
    };
    
    // Get patient_id parameter
    $patient_id = $_GET['patient_id'] ?? '';
    
    // Debug logging
    error_log("Health Timeline API - Received patient_id: " . $patient_id);
    
    if (empty($patient_id)) {
        $response['message'] = 'Patient ID is required';
        echo json_encode($response);
        exit();
    }
    
    // Enforce numeric patient_id
    $patient_id = preg_replace('/[^0-9]/', '', (string)$patient_id);
    if ($patient_id === '') {
        $response['message'] = 'Invalid patient ID';
        echo json_encode($response);
        exit();
    }

    // Remove fallback via patient_signup; only use patient_health_timeline.patient_id linked to patient_details.patient_id
    $patient_signup_id = null;

    // Check what columns actually exist in patient_health_timeline table
    try {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM patient_health_timeline");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        error_log("Health Timeline API - Available columns: " . implode(', ', $columns));
    } catch (Exception $e) {
        error_log("Health Timeline API - Error checking columns: " . $e->getMessage());
        $response['message'] = 'Error accessing health timeline table: ' . $e->getMessage();
        echo json_encode($response);
        exit();
    }

    // Get health timeline entries for the patient - use only existing columns
    $select = [
        in_array('id', $columns) ? 'id' : 'timeline_id',
        'patient_id',
        'type_of_checkup',
        'description',
        'created_at'
    ];
    
    if (in_array('doctor_name', $columns)) {
        $select[] = 'doctor_name';
    }
    if (in_array('entry_date', $columns)) {
        $select[] = 'entry_date';
    } elseif (in_array('checkup_date', $columns)) {
        $select[] = 'checkup_date AS entry_date';
    } else {
        $select[] = 'created_at AS entry_date';
    }
    if (in_array('updated_at', $columns)) {
        $select[] = 'updated_at';
    }
    if (in_array('sent_status', $columns)) {
        $select[] = 'sent_status';
    }
    if (in_array('sent_email', $columns)) {
        $select[] = 'sent_email';
    }

    $orderBy = in_array('entry_date', $columns) ? 'entry_date' : (in_array('checkup_date', $columns) ? 'checkup_date' : 'created_at');

    $sql = "
        SELECT 
            " . implode(",\n            ", $select) . "
        FROM patient_health_timeline 
        WHERE patient_id = ?
        ORDER BY " . $orderBy . " DESC, created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $params = [$patient_id];
    $stmt->execute($params);
    $timeline_entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug logging
    error_log("Health Timeline API - SQL: " . $sql);
    error_log("Health Timeline API - Params: " . json_encode($params));
    error_log("Health Timeline API - Found " . count($timeline_entries) . " entries for patient_id: " . $patient_id);
    
    // Format the data for the frontend
    $formatted_entries = [];
    foreach ($timeline_entries as $entry) {
        $formatted_entries[] = [
            'id' => $entry['id'] ?? $entry['timeline_id'],
            'patient_id' => $entry['patient_id'],
            'type_of_checkup' => $entry['type_of_checkup'],
            'doctor_name' => $entry['doctor_name'] ?? 'N/A',
            'description' => $entry['description'],
            'entry_date' => $entry['entry_date'],
            'created_at' => $entry['created_at'],
            'updated_at' => $entry['updated_at'] ?? null,
            'sent_status' => $entry['sent_status'] ?? 'pending',
            'sent_email' => $entry['sent_email'] ?? null
        ];
    }
    
    $response['success'] = true;
    $response['message'] = 'Health timeline loaded successfully';
    $response['data'] = $formatted_entries;
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
