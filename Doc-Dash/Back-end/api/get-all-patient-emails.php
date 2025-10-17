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
    
    // Get all patient emails from patient_account table
    // First check what columns exist
    $stmt = $pdo->query("DESCRIBE patient_account");
    $columns = $stmt->fetchAll();
    $columnNames = array_column($columns, 'Field');
    
    // Build query based on available columns
    $selectFields = ['email'];
    $orderBy = 'email';
    
    if (in_array('first_name', $columnNames) && in_array('last_name', $columnNames)) {
        $selectFields[] = 'CONCAT(first_name, \' \', last_name) as full_name';
        $selectFields[] = 'first_name';
        $selectFields[] = 'last_name';
        $orderBy = 'first_name, last_name';
    } elseif (in_array('name', $columnNames)) {
        $selectFields[] = 'name as full_name';
        $selectFields[] = 'name';
        $orderBy = 'name';
    } elseif (in_array('username', $columnNames)) {
        $selectFields[] = 'username as full_name';
        $selectFields[] = 'username';
        $orderBy = 'username';
    } else {
        // Fallback: use email as name
        $selectFields[] = 'email as full_name';
        $selectFields[] = 'email';
    }
    
    $query = "SELECT " . implode(', ', $selectFields) . " FROM patient_account WHERE email IS NOT NULL AND email != '' ORDER BY " . $orderBy;
    
    $stmt = $pdo->query($query);
    
    $patients = $stmt->fetchAll();
    
    $emailList = [];
    foreach ($patients as $patient) {
        $emailData = [
            'email' => $patient['email'],
            'full_name' => $patient['full_name']
        ];
        
        // Add additional fields if they exist
        if (isset($patient['first_name'])) {
            $emailData['first_name'] = $patient['first_name'];
        }
        if (isset($patient['last_name'])) {
            $emailData['last_name'] = $patient['last_name'];
        }
        if (isset($patient['name'])) {
            $emailData['name'] = $patient['name'];
        }
        if (isset($patient['username'])) {
            $emailData['username'] = $patient['username'];
        }
        
        $emailList[] = $emailData;
    }
    
    $response['success'] = true;
    $response['message'] = 'Patient emails loaded successfully';
    $response['data'] = $emailList;
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
