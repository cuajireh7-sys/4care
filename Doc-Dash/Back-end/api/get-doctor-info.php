<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();
    
    // Get the current doctor's basic info from simplified doctor_users table
    $stmt = $pdo->prepare("
        SELECT 
            id,
            employee_id,
            f_name,
            l_name,
            email,
            hospital_status
        FROM doctor_users 
        WHERE id = 1
        LIMIT 1
    ");
    
    $stmt->execute();
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($doctor) {
        // Format the data for the frontend
        $formattedData = [
            'id' => $doctor['id'],
            'employee_id' => $doctor['employee_id'],
            'name' => 'Dr. ' . $doctor['f_name'] . ' ' . $doctor['l_name'],
            'email' => $doctor['email'],
            'specialization' => 'General Medicine', // Default value
            'specialization_name' => 'General Medicine', // Default value
            'hospital_status' => $doctor['hospital_status']
        ];
        
        echo json_encode([
            'success' => true,
            'doctor' => $formattedData
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No doctor found'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
