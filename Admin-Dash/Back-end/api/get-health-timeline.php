<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'database.php';

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $pdo = admin_pdo();
    
    // Get patient_id parameter
    $patient_id = $_GET['patient_id'] ?? '';
    
    if (empty($patient_id)) {
        $response['message'] = 'Patient ID is required';
        echo json_encode($response);
        exit();
    }
    
    // Prefer the unified patient_health_timeline table used by doctor dashboard; fallback to legacy health_timeline
    // Detect available columns dynamically to avoid errors
    $columns = [];
    try {
        $stmtCols = $pdo->prepare("SHOW COLUMNS FROM patient_health_timeline");
        $stmtCols->execute();
        $columns = $stmtCols->fetchAll(PDO::FETCH_COLUMN);
        $useNew = true;
    } catch (Throwable $e) {
        $useNew = false;
    }

    if ($useNew) {
        $select = [
            in_array('id', $columns) ? 'id' : 'timeline_id',
            'patient_id',
            'type_of_checkup',
            'description',
            'created_at'
        ];
        if (in_array('doctor_name', $columns)) $select[] = 'doctor_name';
        if (in_array('entry_date', $columns)) $select[] = 'entry_date';
        elseif (in_array('checkup_date', $columns)) $select[] = 'checkup_date AS entry_date';
        if (in_array('updated_at', $columns)) $select[] = 'updated_at';

        $orderBy = in_array('entry_date', $columns) ? 'entry_date' : (in_array('checkup_date', $columns) ? 'checkup_date' : 'created_at');

        $sql = 'SELECT ' . implode(',', $select) . ' FROM patient_health_timeline WHERE patient_id = ? ORDER BY ' . $orderBy . ' DESC, created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$patient_id]);
        $timeline_entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Legacy fallback
        $sql = "
            SELECT 
                timeline_id,
                patient_id,
                type_of_checkup,
                description,
                entry_date,
                created_at,
                updated_at
            FROM health_timeline 
            WHERE patient_id = ? 
            ORDER BY entry_date DESC, created_at DESC
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$patient_id]);
        $timeline_entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Format the data for the frontend
    $formatted_entries = [];
    foreach ($timeline_entries as $entry) {
        $formatted_entries[] = [
            'id' => $entry['id'] ?? $entry['timeline_id'],
            'patient_id' => $entry['patient_id'] ?? null,
            'type_of_checkup' => $entry['type_of_checkup'] ?? '',
            'doctor_name' => $entry['doctor_name'] ?? 'N/A',
            'description' => $entry['description'] ?? '',
            'entry_date' => $entry['entry_date'] ?? ($entry['created_at'] ?? null),
            'created_at' => $entry['created_at'] ?? null,
            'updated_at' => $entry['updated_at'] ?? null
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
