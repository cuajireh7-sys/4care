<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/database.php';

try {
    error_log("Getting doctor info...");
    $pdo = admin_pdo();
    
    // Get the current doctor's information
    // For now, we'll get the first doctor as an example
    // In a real application, you'd get this from the session
    $stmt = $pdo->prepare("
        SELECT 
            du.id,
            du.name,
            du.email,
            du.phone,
            du.dob,
            du.address,
            du.online_status,
            du.role,
            s.name as specialization_name,
            d.name as department_name,
            sh.name as current_shift_name,
            sh.start_time as shift_start_time,
            sh.end_time as shift_end_time
        FROM doctor_users du
        LEFT JOIN specializations s ON du.specialization_id = s.id
        LEFT JOIN departments d ON du.department_id = d.id
        LEFT JOIN shifts sh ON du.current_shift_id = sh.id
        WHERE du.role = 'doctor'
        ORDER BY du.id ASC
        LIMIT 1
    ");
    
    $stmt->execute();
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($doctor) {
        error_log("Doctor found: " . $doctor['name']);
        echo json_encode([
            'success' => true,
            'doctor' => $doctor
        ]);
    } else {
        error_log("No doctor found");
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
