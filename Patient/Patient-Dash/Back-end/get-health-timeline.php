<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
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
    
    // Get patient_id parameter
    $patient_id = $_GET['patient_id'] ?? '';
    
    if (empty($patient_id)) {
        $response['message'] = 'Patient ID is required';
        echo json_encode($response);
        exit();
    }
    
    // Check if patient_health_timeline table exists (preferred) or health_timeline (fallback)
    $tblExists = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_health_timeline'");
    $tblExists->execute();
    $useNewTable = (int)$tblExists->fetchColumn() > 0;
    
    if (!$useNewTable) {
        // Fallback to old table
        $tblExists = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_timeline'");
        $tblExists->execute();
        if ((int)$tblExists->fetchColumn() === 0) {
            $response['success'] = true;
            $response['message'] = 'Health timeline table missing';
            $response['data'] = [];
            echo json_encode($response);
            exit;
        }
    }

    $tableName = $useNewTable ? 'patient_health_timeline' : 'health_timeline';
    
    // Get health timeline entries for the patient; tolerate optional columns
    // Detect optional columns
    $cols = $pdo->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$tableName'")
                 ->fetchAll(PDO::FETCH_COLUMN);
    $hasDoctorName = in_array('doctor_name', $cols, true);
    $hasCheckupDate = in_array('checkup_date', $cols, true);
    $hasEntryDate = in_array('entry_date', $cols, true);

    // Determine primary key column flexibly
    $idCol = in_array('id', $cols, true) ? 'id' : (in_array('timeline_id', $cols, true) ? 'timeline_id' : null);
    $select = [];
    if ($idCol) $select[] = $idCol;
    $select[] = 'patient_id';
    if (in_array('type_of_checkup', $cols, true)) $select[] = 'type_of_checkup';
    if (in_array('description', $cols, true)) $select[] = 'description';
    if (in_array('created_at', $cols, true)) $select[] = 'created_at';
    if ($hasDoctorName) $select[] = 'doctor_name';
    if ($hasCheckupDate) $select[] = 'checkup_date';
    if ($hasEntryDate) $select[] = 'entry_date';
    if (in_array('updated_at', $cols)) $select[] = 'updated_at';

    $orderBy = 'updated_at DESC, created_at DESC';

    $sql = 'SELECT ' . implode(',', $select) . ' FROM ' . $tableName . ' WHERE patient_id = ? ORDER BY ' . $orderBy;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$patient_id]);
    $timeline_entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data for the frontend
    $formatted_entries = [];
    foreach ($timeline_entries as $entry) {
        $formatted_entries[] = [
            'id' => $idCol && isset($entry[$idCol]) ? $entry[$idCol] : null,
            'patient_id' => $entry['patient_id'] ?? null,
            'type_of_checkup' => $entry['type_of_checkup'] ?? null,
            'doctor_name' => isset($entry['doctor_name']) ? $entry['doctor_name'] : null,
            'checkup_date' => isset($entry['checkup_date']) ? $entry['checkup_date'] : null,
            'entry_date' => isset($entry['entry_date']) ? $entry['entry_date'] : null,
            'description' => $entry['description'] ?? null,
            'created_at' => $entry['created_at'] ?? null,
            'updated_at' => isset($entry['updated_at']) ? $entry['updated_at'] : null
        ];
    }
    
    $response['success'] = true;
    $response['message'] = 'Health timeline loaded successfully';
    $response['data'] = $formatted_entries;
    
} catch (Throwable $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
