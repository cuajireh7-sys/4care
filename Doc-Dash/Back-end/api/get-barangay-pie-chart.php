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

    // Top 5 barangays by patient count
    $sql = "
        SELECT barangay, COUNT(*) AS patient_count
        FROM patient_details
        WHERE barangay IS NOT NULL AND barangay <> ''
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

    $response['success'] = true;
    $response['data'] = [
        'labels' => $labels,
        'counts' => $counts,
        'total' => array_sum($counts)
    ];
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>