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
    
    // Get patient_id from query parameter
    $patient_id = $_GET['patient_id'] ?? null;
    
    if (!$patient_id) {
        $response['message'] = 'Patient ID is required';
        echo json_encode($response);
        exit();
    }
    
    // Remove 'pat' prefix if present (e.g., 'pat1' -> '1')
    $patient_id = preg_replace('/^pat/', '', $patient_id);
    
    // Get prescriptions for the patient from prescriptions table
    // First try by patient_id, then fallback to email matching
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.patient_id,
            p.patient_email,
            p.full_name,
            p.doctor_name,
            p.prescribed_date,
            p.prescription_url,
            p.sent_status,
            p.created_at
        FROM prescriptions p
        WHERE p.patient_id = ? 
           OR (p.patient_id IS NULL AND p.patient_email IN (
               SELECT email FROM patient_details WHERE patient_id = ?
           ))
        ORDER BY p.created_at DESC
    ");
    
    $stmt->execute([$patient_id, $patient_id]);
    $prescriptions = $stmt->fetchAll();
    
    $prescriptionList = [];
    foreach ($prescriptions as $prescription) {
        $prescriptionList[] = [
            'id' => $prescription['id'],
            'patient_id' => $prescription['patient_id'],
            'patient_email' => $prescription['patient_email'],
            'patient_name' => $prescription['full_name'],
            'doctor_name' => $prescription['doctor_name'],
            'prescribed_date' => $prescription['prescribed_date'],
            'prescription_url' => $prescription['prescription_url'],
            'sent_status' => $prescription['sent_status'],
            'created_at' => $prescription['created_at'],
            'formatted_date' => date('M j, Y g:i A', strtotime($prescription['created_at']))
        ];
    }
    
    $response['success'] = true;
    $response['message'] = 'Patient prescriptions loaded successfully';
    $response['data'] = $prescriptionList;
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>

