<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => ''];

try {
    $pdo = get_pdo();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['prescription_id']) || !isset($input['patient_email'])) {
        $response['message'] = 'Missing required fields: prescription_id and patient_email';
        echo json_encode($response);
        exit();
    }
    
    $prescription_id = $input['prescription_id'];
    $patient_email = $input['patient_email'];
    
    // Validate prescription exists
    $stmt = $pdo->prepare("SELECT * FROM prescriptions WHERE id = ?");
    $stmt->execute([$prescription_id]);
    $prescription = $stmt->fetch();
    
    if (!$prescription) {
        $response['message'] = 'Prescription not found';
        echo json_encode($response);
        exit();
    }
    
    // Check what columns exist in prescriptions table
    $stmt = $pdo->query("DESCRIBE prescriptions");
    $columns = $stmt->fetchAll();
    $columnNames = array_column($columns, 'Field');
    
    // Build update query based on available columns
    $updateFields = ["sent_status = 'sent'", "patient_email = ?"];
    $params = [$patient_email];
    
    if (in_array('updated_at', $columnNames)) {
        $updateFields[] = "updated_at = NOW()";
    } elseif (in_array('created_at', $columnNames)) {
        $updateFields[] = "created_at = NOW()";
    }
    
    $params[] = $prescription_id; // Add prescription_id as last parameter
    
    $query = "UPDATE prescriptions SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    
    if ($stmt->rowCount() > 0) {
        $response['success'] = true;
        $response['message'] = 'Prescription sent successfully to ' . $patient_email;
    } else {
        $response['message'] = 'Failed to update prescription status';
    }
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
