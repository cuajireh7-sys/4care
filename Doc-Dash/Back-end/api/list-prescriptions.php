<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$email = isset($_GET['patient_email']) ? trim((string)$_GET['patient_email']) : '';
$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $pdo = get_pdo();
    
    if (empty($email)) {
        $response['message'] = 'Patient email is required';
        echo json_encode($response);
        exit();
    }
    
    // Debug: Log the email being searched
    error_log("Searching prescriptions for email: " . $email);
    
    // First, let's check if the prescriptions table exists and what data it contains
    $checkTable = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions'");
    $checkTable->execute();
    $tableExists = (int)$checkTable->fetchColumn() > 0;
    
    if (!$tableExists) {
        $response['message'] = 'Prescriptions table does not exist';
        error_log("Prescriptions table does not exist");
        echo json_encode($response);
        exit();
    }
    
    // Debug: Check all prescriptions in the table
    $allPrescriptions = $pdo->query("SELECT patient_email, full_name, doctor_name, COUNT(*) as count FROM prescriptions GROUP BY patient_email");
    $allData = $allPrescriptions->fetchAll();
    error_log("All prescriptions in database: " . print_r($allData, true));
    
    // Get prescriptions from the prescriptions table (same as doctor dashboard)
    $stmt = $pdo->prepare("
        SELECT 
            id,
            patient_email,
            full_name,
            doctor_name,
            prescribed_date,
            prescription_url,
            sent_status,
            created_at
        FROM prescriptions 
        WHERE patient_email = ? 
        ORDER BY created_at DESC
    ");
    
    $stmt->execute([$email]);
    $prescriptions = $stmt->fetchAll();
    
    // Debug: Log the results
    error_log("Found " . count($prescriptions) . " prescriptions for email: " . $email);
    
    $prescriptionList = [];
    foreach ($prescriptions as $prescription) {
        // Create a user-friendly filename
        $fileExtension = pathinfo($prescription['prescription_url'], PATHINFO_EXTENSION);
        $friendlyFileName = 'Prescription from ' . $prescription['doctor_name'] . ' - ' . date('M j, Y', strtotime($prescription['prescribed_date'])) . '.' . $fileExtension;
        
        $prescriptionList[] = [
            'id' => $prescription['id'],
            'patient_email' => $prescription['patient_email'],
            'full_name' => $prescription['full_name'],
            'doctor_name' => $prescription['doctor_name'],
            'prescribed_date' => $prescription['prescribed_date'],
            'file_path' => $prescription['prescription_url'], // Use prescription_url as file_path for compatibility
            'file_name' => $friendlyFileName, // User-friendly filename
            'file_type' => $fileExtension,
            'description' => 'Prescription from ' . $prescription['doctor_name'],
            'created_at' => $prescription['created_at'],
            'formatted_date' => date('M j, Y g:i A', strtotime($prescription['created_at'])),
            'formatted_prescribed_date' => $prescription['prescribed_date'] ? date('M j, Y', strtotime($prescription['prescribed_date'])) : 'N/A'
        ];
    }
    
    if (count($prescriptionList) > 0) {
        $response['success'] = true;
        $response['message'] = 'Prescriptions loaded successfully';
        $response['data'] = $prescriptionList;
    } else {
        $response['success'] = true;
        $response['message'] = 'No prescriptions found for email: ' . $email;
        $response['data'] = [];
        error_log("No prescriptions found for email: " . $email);
    }
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log("API Error: " . $e->getMessage());
}

echo json_encode($response);
?>


