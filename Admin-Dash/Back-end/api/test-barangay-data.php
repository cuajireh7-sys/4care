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
    
    // Check what tables exist
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch()) {
        $tables[] = $row[0];
    }
    
    // Check patient_details structure
    $patientDetailsStructure = [];
    try {
        $stmt = $pdo->query("DESCRIBE patient_details");
        $patientDetailsStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $patientDetailsStructure = ['error' => $e->getMessage()];
    }
    
    // Check health timeline tables
    $healthTimelineExists = in_array('health_timeline', $tables);
    $patientHealthTimelineExists = in_array('patient_health_timeline', $tables);
    
    // Get sample data from patient_details
    $samplePatients = [];
    try {
        $stmt = $pdo->query("SELECT patient_id, barangay FROM patient_details WHERE barangay IS NOT NULL LIMIT 5");
        $samplePatients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $samplePatients = ['error' => $e->getMessage()];
    }
    
    // Get sample data from health timeline
    $sampleTimeline = [];
    if ($healthTimelineExists) {
        try {
            $stmt = $pdo->query("SELECT patient_id, entry_date FROM health_timeline LIMIT 5");
            $sampleTimeline = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $sampleTimeline = ['error' => $e->getMessage()];
        }
    }
    
    $response['success'] = true;
    $response['message'] = 'Database structure analyzed';
    $response['data'] = [
        'available_tables' => $tables,
        'patient_details_structure' => $patientDetailsStructure,
        'health_timeline_exists' => $healthTimelineExists,
        'patient_health_timeline_exists' => $patientHealthTimelineExists,
        'sample_patients' => $samplePatients,
        'sample_timeline' => $sampleTimeline
    ];
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
