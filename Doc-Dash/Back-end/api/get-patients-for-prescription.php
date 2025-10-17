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
    
    // Get patients from patient_details table with Patient ID | Name | DOB format
    $stmt = $pdo->query("
        SELECT patient_id, first_name, last_name, email, date_of_birth
        FROM patient_details 
        WHERE first_name IS NOT NULL AND last_name IS NOT NULL
        ORDER BY patient_id
    ");
    
    $patients = $stmt->fetchAll();
    
    $patientList = [];
    foreach ($patients as $patient) {
        $formattedId = '#' . str_pad($patient['patient_id'], 5, '0', STR_PAD_LEFT);
        $fullName = $patient['first_name'] . ' ' . $patient['last_name'];
        $formattedDob = $patient['date_of_birth'] ? date('m-d-Y', strtotime($patient['date_of_birth'])) : 'N/A';
        
        $patientList[] = [
            'patient_id' => $patient['patient_id'],
            'formatted_id' => $formattedId,
            'full_name' => $fullName,
            'email' => $patient['email'],
            'date_of_birth' => $formattedDob,
            'display_text' => "Patient ID: {$formattedId} | Name: {$fullName} | DOB: {$formattedDob}"
        ];
    }
    
    $response['success'] = true;
    $response['message'] = 'Patients loaded successfully';
    $response['data'] = $patientList;
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
