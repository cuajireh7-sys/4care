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
    
    // Get the last 2 patients registered (most recent first)
    // Check if genders and countries tables exist, if not use direct gender field
    $gendersTableExists = false;
    $countriesTableExists = false;
    
    try {
        $pdo->query("SELECT 1 FROM genders LIMIT 1");
        $gendersTableExists = true;
    } catch (Exception $e) {
        $gendersTableExists = false;
    }
    
    try {
        $pdo->query("SELECT 1 FROM countries LIMIT 1");
        $countriesTableExists = true;
    } catch (Exception $e) {
        $countriesTableExists = false;
    }
    
    if ($gendersTableExists && $countriesTableExists) {
        $sql = "
            SELECT 
                pd.patient_id,
                pd.first_name,
                pd.last_name,
                pd.email,
                pd.phone,
                pd.created_at,
                'Active' as registration_status,
                g.gender_name,
                c.country_name,
                pd.barangay,
                pd.city
            FROM patient_details pd
            LEFT JOIN genders g ON pd.gender_id = g.gender_id
            LEFT JOIN countries c ON pd.country_id = c.country_id
            ORDER BY pd.created_at DESC
            LIMIT 2
        ";
    } else {
        // Fallback query without joins to missing tables
        $sql = "
            SELECT 
                pd.patient_id,
                pd.first_name,
                pd.last_name,
                pd.email,
                pd.phone,
                pd.created_at,
                'Active' as registration_status,
                pd.gender as gender_name,
                'Philippines' as country_name,
                pd.barangay,
                pd.city
            FROM patient_details pd
            ORDER BY pd.created_at DESC
            LIMIT 2
        ";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data
    $formattedPatients = [];
    foreach ($patients as $patient) {
        $formattedPatients[] = [
            'patient_id' => $patient['patient_id'],
            'patient_id_formatted' => '#' . str_pad($patient['patient_id'], 5, '0', STR_PAD_LEFT),
            'name' => $patient['first_name'] . ' ' . $patient['last_name'],
            'email' => $patient['email'],
            'phone' => $patient['phone'],
            'gender' => $patient['gender_name'],
            'location' => $patient['barangay'] . ', ' . $patient['city'],
            'country' => $patient['country_name'],
            'registration_status' => $patient['registration_status'],
            'created_at' => $patient['created_at'],
            'formatted_date' => date('M d, Y', strtotime($patient['created_at'])),
            'formatted_time' => date('h:i A', strtotime($patient['created_at']))
        ];
    }
    
    $response['success'] = true;
    $response['message'] = 'New patients loaded successfully';
    $response['data'] = $formattedPatients;
    
} catch (Exception $e) {
    $response['message'] = 'Error loading new patients: ' . $e->getMessage();
    error_log('get-new-patients.php error: ' . $e->getMessage());
}

echo json_encode($response);
?>