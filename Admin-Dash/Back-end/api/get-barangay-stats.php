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
    
    // Get current month and year
    $currentMonth = date('Y-m');
    $currentYear = date('Y');
    
    // Get barangay parameter (optional)
    $barangay = $_GET['barangay'] ?? '';
    $month = $_GET['month'] ?? $currentMonth;
    
    // Check which health timeline table exists and get its structure
    $timelineTable = 'health_timeline'; // Default to health_timeline
    $dateField = 'entry_date'; // Default date field
    $idField = 'id'; // Default ID field
    
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'patient_health_timeline'");
        if ($stmt->rowCount() > 0) {
            $timelineTable = 'patient_health_timeline';
            // Check what fields exist in this table
            $descStmt = $pdo->query("DESCRIBE patient_health_timeline");
            $columns = $descStmt->fetchAll(PDO::FETCH_ASSOC);
            $columnNames = array_column($columns, 'Field');
            
            // Find the correct ID field
            if (in_array('timeline_id', $columnNames)) {
                $idField = 'timeline_id';
            } elseif (in_array('id', $columnNames)) {
                $idField = 'id';
            }
            
            // Find the correct date field
            foreach (['entry_date', 'checkup_date', 'created_at'] as $field) {
                if (in_array($field, $columnNames)) {
                    $dateField = $field;
                    break;
                }
            }
        }
    } catch (Exception $e) {
        // Use default health_timeline table
    }
    
    // Build the query to get patient visits by barangay from health timeline
    // Join health timeline with patient_details to get barangay info
    $sql = "
        SELECT 
            pd.barangay,
            COUNT(ht.{$idField}) as visit_count,
            DATE_FORMAT(ht.{$dateField}, '%Y-%m') as visit_month
        FROM {$timelineTable} ht
        INNER JOIN patient_details pd ON ht.patient_id = pd.patient_id
        WHERE DATE_FORMAT(ht.{$dateField}, '%Y-%m') = ?
        AND pd.barangay IS NOT NULL 
        AND pd.barangay != ''
    ";
    
    $params = [$month];
    
    // Add barangay filter if specified
    if (!empty($barangay) && $barangay !== 'all') {
        // Handle both number format and "Barangay X" format
        $barangayFilter = is_numeric($barangay) ? $barangay : $barangay;
        $sql .= " AND (pd.barangay = ? OR pd.barangay = ?)";
        $params[] = $barangayFilter;
        $params[] = "Barangay " . $barangayFilter;
    }
    
    $sql .= " GROUP BY pd.barangay, DATE_FORMAT(ht.entry_date, '%Y-%m') ORDER BY pd.barangay";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get monthly data for the last 12 months for chart
    $monthlyData = [];
    for ($i = 11; $i >= 0; $i--) {
        $targetMonth = date('Y-m', strtotime("-$i months"));
        $monthlyData[$targetMonth] = [];
        
        // Get data for this specific month
        $monthSql = "
            SELECT 
                pd.barangay,
                COUNT(ht.{$idField}) as visit_count
            FROM {$timelineTable} ht
            INNER JOIN patient_details pd ON ht.patient_id = pd.patient_id
            WHERE DATE_FORMAT(ht.{$dateField}, '%Y-%m') = ?
            AND pd.barangay IS NOT NULL 
            AND pd.barangay != ''
        ";
        
        if (!empty($barangay) && $barangay !== 'all') {
            // Handle both number format and "Barangay X" format
            $barangayFilter = is_numeric($barangay) ? $barangay : $barangay;
            $monthSql .= " AND (pd.barangay = ? OR pd.barangay = ?)";
            $monthStmt = $pdo->prepare($monthSql);
            $monthStmt->execute([$targetMonth, $barangayFilter, "Barangay " . $barangayFilter]);
        } else {
            $monthStmt = $pdo->prepare($monthSql);
            $monthStmt->execute([$targetMonth]);
        }
        
        $monthResults = $monthStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($monthResults as $result) {
            $monthlyData[$targetMonth][$result['barangay']] = (int)$result['visit_count'];
        }
    }
    
    // Get all unique barangays for dropdown
    $barangaySql = "SELECT DISTINCT barangay FROM patient_details WHERE barangay IS NOT NULL AND barangay != '' ORDER BY barangay";
    $barangayStmt = $pdo->query($barangaySql);
    $allBarangays = $barangayStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // If no data found, provide sample data for testing
    if (empty($results) && empty($monthlyData)) {
        // Create sample data for demonstration
        $sampleData = [];
        for ($i = 11; $i >= 0; $i--) {
            $targetMonth = date('Y-m', strtotime("-$i months"));
            $sampleData[$targetMonth] = [
                'Barangay 546' => rand(5, 25),
                'Barangay 547' => rand(3, 20),
                'Barangay 548' => rand(2, 15)
            ];
        }
        $monthlyData = $sampleData;
    }
    
    $response['success'] = true;
    $response['message'] = 'Barangay stats loaded successfully';
    $response['data'] = [
        'current_month_data' => $results,
        'monthly_data' => $monthlyData,
        'all_barangays' => $allBarangays,
        'current_month' => $month,
        'current_year' => $currentYear,
        'timeline_table_used' => $timelineTable,
        'date_field_used' => $dateField,
        'id_field_used' => $idField,
        'debug_info' => [
            'total_results' => count($results),
            'has_monthly_data' => !empty($monthlyData),
            'barangay_filter' => $barangay
        ]
    ];
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
