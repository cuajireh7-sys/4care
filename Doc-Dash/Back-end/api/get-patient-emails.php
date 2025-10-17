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
    
    // Get patient emails from patient_details table with Name | DOB | Email format
    $stmt = $pdo->query("
        SELECT DISTINCT email, first_name, last_name, date_of_birth 
        FROM patient_details 
        WHERE email IS NOT NULL AND email != '' 
        AND first_name IS NOT NULL AND last_name IS NOT NULL
        ORDER BY first_name, last_name
    ");
    
    $emails = $stmt->fetchAll();
    
    $emailList = [];
    foreach ($emails as $patient) {
        $fullName = trim($patient['first_name'] . ' ' . $patient['last_name']);
        $formattedDob = $patient['date_of_birth'] ? date('m-d-Y', strtotime($patient['date_of_birth'])) : 'N/A';
        
        $emailList[] = [
            'email' => $patient['email'],
            'display_name' => $fullName,
            'full_display' => "Name: {$fullName} | DOB: {$formattedDob} | Email: {$patient['email']}"
        ];
    }
    
    $response['success'] = true;
    $response['message'] = 'Patient emails loaded successfully';
    $response['data'] = $emailList;
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
