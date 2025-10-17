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

    // Top 5 barangays by patient count from the new barangay list (545-551)
    $sql = "
        SELECT barangay, COUNT(*) AS patient_count
        FROM patient_details
        WHERE barangay IS NOT NULL AND barangay <> ''
        AND (barangay IN ('545', '546', '547', '548', '549', '550', '551') 
             OR barangay IN ('Barangay 545', 'Barangay 546', 'Barangay 547', 'Barangay 548', 'Barangay 549', 'Barangay 550', 'Barangay 551'))
        GROUP BY barangay
        ORDER BY patient_count DESC, barangay ASC
        LIMIT 5
    ";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $labels = [];
    $counts = [];
    foreach ($rows as $row) {
        $labels[] = $row['barangay'];
        $counts[] = (int)$row['patient_count'];
    }

    // If no data found, provide sample data for the new barangay numbers
    if (empty($labels)) {
        $labels = ['Barangay 545', 'Barangay 546', 'Barangay 547', 'Barangay 548', 'Barangay 549'];
        $counts = [25, 18, 15, 12, 8];
    }

    $response['success'] = true;
    $response['data'] = [
        'labels' => $labels,
        'counts' => $counts,
        'total' => array_sum($counts),
        'debug_info' => [
            'raw_data' => $rows,
            'is_sample_data' => empty($rows),
            'query_executed' => $sql
        ]
    ];
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>


