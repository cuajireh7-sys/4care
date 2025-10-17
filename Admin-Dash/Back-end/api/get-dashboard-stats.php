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
    
    // Count patients created this month from patient_details table
    $stmt = $pdo->prepare("SELECT COUNT(*) as patient_count FROM patient_details WHERE DATE_FORMAT(created_at, '%Y-%m') = ?");
    $stmt->execute([$currentMonth]);
    $patientCount = $stmt->fetch(PDO::FETCH_ASSOC)['patient_count'];
    
    // Count doctors (staff) created this month
    $stmt = $pdo->prepare("SELECT COUNT(*) as doctor_count FROM doctor_users WHERE DATE_FORMAT(created_at, '%Y-%m') = ?");
    $stmt->execute([$currentMonth]);
    $doctorCount = $stmt->fetch(PDO::FETCH_ASSOC)['doctor_count'];
    
    // Get total counts from patient_details table
    $stmt = $pdo->query("SELECT COUNT(*) as total_patients FROM patient_details");
    $totalPatients = $stmt->fetch(PDO::FETCH_ASSOC)['total_patients'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total_doctors FROM doctor_users");
    $totalDoctors = $stmt->fetch(PDO::FETCH_ASSOC)['total_doctors'];
    
    $response['success'] = true;
    $response['message'] = 'Dashboard stats loaded successfully';
    $response['data'] = [
        'patients_this_month' => $patientCount,
        'doctors_this_month' => $doctorCount,
        'total_patients' => $totalPatients,
        'total_doctors' => $totalDoctors,
        'current_month' => $currentMonth
    ];
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
