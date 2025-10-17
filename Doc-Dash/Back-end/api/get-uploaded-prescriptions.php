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
    
    // Get all uploaded prescriptions from prescriptions table
    $stmt = $pdo->query("
        SELECT 
            p.id,
            p.patient_email,
            p.full_name,
            p.doctor_name,
            p.prescribed_date,
            p.prescription_url,
            p.sent_status,
            p.created_at
        FROM prescriptions p
        ORDER BY p.created_at DESC
    ");
    
    $prescriptions = $stmt->fetchAll();
    
    $prescriptionList = [];
    foreach ($prescriptions as $prescription) {
        $prescriptionList[] = [
            'id' => $prescription['id'],
            'patient_email' => $prescription['patient_email'],
            'patient_name' => $prescription['full_name'],
            'doctor_name' => $prescription['doctor_name'],
            'prescribed_date' => $prescription['prescribed_date'],
            'prescription_url' => $prescription['prescription_url'],
            'sent_status' => $prescription['sent_status'],
            'created_at' => $prescription['created_at'],
            'formatted_date' => date('M j, Y g:i A', strtotime($prescription['created_at'])),
            'formatted_prescribed_date' => $prescription['prescribed_date'] ? date('M j, Y', strtotime($prescription['prescribed_date'])) : 'N/A'
        ];
    }
    
    $response['success'] = true;
    $response['message'] = 'Uploaded prescriptions loaded successfully';
    $response['data'] = $prescriptionList;
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
