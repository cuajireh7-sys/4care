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
    
    // Get current month
    $currentMonth = date('Y-m');
    
    // Get monthly data for the last 12 months for chart
    $monthlyData = [];
    for ($i = 11; $i >= 0; $i--) {
        $targetMonth = date('Y-m', strtotime("-$i months"));
        $monthlyData[$targetMonth] = [];
        
        // Get data for this specific month from health timeline
        $monthSql = "
            SELECT 
                pd.barangay,
                COUNT(ht.id) as visit_count
            FROM patient_health_timeline ht
            INNER JOIN patient_details pd ON ht.patient_id = pd.patient_id
            WHERE DATE_FORMAT(ht.entry_date, '%Y-%m') = ?
            AND pd.barangay IS NOT NULL 
            AND pd.barangay != ''
            GROUP BY pd.barangay
        ";
        
        $monthStmt = $pdo->prepare($monthSql);
        $monthStmt->execute([$targetMonth]);
        $monthResults = $monthStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($monthResults as $result) {
            $monthlyData[$targetMonth][$result['barangay']] = (int)$result['visit_count'];
        }
    }
    
    // Get all unique barangays for dropdown
    $barangaySql = "SELECT DISTINCT barangay FROM patient_details WHERE barangay IS NOT NULL AND barangay != '' ORDER BY barangay";
    $barangayStmt = $pdo->query($barangaySql);
    $allBarangays = $barangayStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Get current month data
    $currentMonthSql = "
        SELECT 
            pd.barangay,
            COUNT(ht.id) as visit_count
        FROM patient_health_timeline ht
        INNER JOIN patient_details pd ON ht.patient_id = pd.patient_id
        WHERE DATE_FORMAT(ht.entry_date, '%Y-%m') = ?
        AND pd.barangay IS NOT NULL 
        AND pd.barangay != ''
        GROUP BY pd.barangay
        ORDER BY visit_count DESC, pd.barangay ASC
    ";
    
    $currentStmt = $pdo->prepare($currentMonthSql);
    $currentStmt->execute([$currentMonth]);
    $currentResults = $currentStmt->fetchAll(PDO::FETCH_ASSOC);

    $response['success'] = true;
    $response['data'] = [
        'current_month' => $currentMonth,
        'current_data' => $currentResults,
        'monthly_data' => $monthlyData,
        'all_barangays' => $allBarangays
    ];
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
