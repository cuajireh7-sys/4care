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

    $barangay = $_GET['barangay'] ?? '';
    if ($barangay === '') {
        throw new Exception('Missing barangay parameter');
    }

    // Resolve which timeline table and date field exist
    $timelineTable = 'patient_health_timeline';
    $dateField = 'entry_date';
    $typeField = 'type_of_checkup';

    try {
        $stmt = $pdo->query("DESCRIBE patient_health_timeline");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $columnNames = array_column($columns, 'Field');
        if (!in_array('entry_date', $columnNames)) {
            foreach (['checkup_date', 'created_at'] as $alt) {
                if (in_array($alt, $columnNames)) { $dateField = $alt; break; }
            }
        }
        if (!in_array('type_of_checkup', $columnNames)) {
            foreach (['checkup_type', 'type'] as $alt) {
                if (in_array($alt, $columnNames)) { $typeField = $alt; break; }
            }
        }
    } catch (Exception $e) {
        // fall back silently
    }

    // Count checkup types for patients belonging to the chosen barangay
    $sql = "
        SELECT ht.{$typeField} AS type_of_checkup, COUNT(*) AS count
        FROM {$timelineTable} ht
        INNER JOIN patient_details pd ON pd.patient_id = ht.patient_id
        WHERE pd.barangay = ?
        GROUP BY ht.{$typeField}
        ORDER BY count DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$barangay]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $labels = [];
    $counts = [];
    foreach ($rows as $row) {
        $labels[] = $row['type_of_checkup'] ?: 'N/A';
        $counts[] = (int)$row['count'];
    }

    $response['success'] = true;
    $response['data'] = [
        'barangay' => $barangay,
        'labels' => $labels,
        'counts' => $counts
    ];
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
