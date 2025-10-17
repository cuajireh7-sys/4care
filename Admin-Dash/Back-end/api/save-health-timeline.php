<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'database.php';

$response = ['success' => false, 'message' => '', 'timeline_id' => null];

try {
    $pdo = admin_pdo();
    
    // Get the POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // If no JSON data, try regular POST data
    if (!$data) {
        $data = $_POST;
    }
    
    if (!$data) {
        $response['message'] = 'No data received';
        echo json_encode($response);
        exit();
    }
    
    // Validate required fields
    $required_fields = ['patient_id', 'type_of_checkup', 'description'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            $response['message'] = "Required field missing: $field";
            echo json_encode($response);
            exit();
        }
    }
    
    // Set entry_date to current date if not provided
    if (empty($data['entry_date'])) {
        $data['entry_date'] = date('Y-m-d');
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Insert health timeline entry
    $stmt = $pdo->prepare("
        INSERT INTO health_timeline (patient_id, type_of_checkup, description, entry_date) 
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['patient_id'],
        $data['type_of_checkup'],
        $data['description'],
        $data['entry_date']
    ]);
    
    $timeline_id = $pdo->lastInsertId();
    
    $pdo->commit();
    
    $response['success'] = true;
    $response['message'] = 'Health timeline entry saved successfully';
    $response['timeline_id'] = $timeline_id;
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
