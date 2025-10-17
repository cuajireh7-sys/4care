<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => '', 'patient_id' => null, 'patient_code' => null];

try {
    $pdo = get_pdo();
    
    // Get the POST data (handle both JSON and form data)
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
    
    // Validate required fields (email required to prevent duplicates + allow follow-up linkage)
    $required_fields = ['firstName', 'lastName', 'dob', 'gender', 'phone', 'address', 'barangay', 'city', 'zipCode', 'email'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            $response['message'] = "Required field missing: $field";
            echo json_encode($response);
            exit();
        }
    }
    // Reject if patient with same email already exists in patient_details
    $dup = $pdo->prepare('SELECT patient_id FROM patient_details WHERE LOWER(email) = LOWER(?) LIMIT 1');
    $dup->execute([$data['email']]);
    if ($dup->fetch()) {
        $response['message'] = 'A patient with this email already exists.';
        echo json_encode($response);
        exit();
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Handle gender - use direct enum values instead of lookup table
    // Validate gender - accept full text values directly
    $valid_genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
    if (!in_array($data['gender'], $valid_genders)) {
        throw new Exception('Invalid gender. Please select Male, Female, Other, or Prefer not to say.');
    }
    
    // Generate next patient visible code like #00001
    $maxStmt = $pdo->query("SELECT MAX(CAST(SUBSTRING(patient_visible_id, 2) AS UNSIGNED)) AS max_seq FROM patient_details WHERE patient_visible_id REGEXP '^#[0-9]+' ");
    $maxRow = $maxStmt ? $maxStmt->fetch(PDO::FETCH_ASSOC) : null;
    $nextSeq = (int)($maxRow['max_seq'] ?? 0) + 1;
    $patientCode = '#' . str_pad((string)$nextSeq, 5, '0', STR_PAD_LEFT);

    // Insert patient, including generated patient_id code
    $stmt = $pdo->prepare("
        INSERT INTO patient_details (patient_visible_id, first_name, last_name, date_of_birth, gender, email, phone, address, barangay, city, zip_code) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $patientCode,
        $data['firstName'],
        $data['lastName'],
        $data['dob'],
        $data['gender'], // Use the gender value directly (full text)
        $data['email'],
        $data['phone'],
        $data['address'],
        $data['barangay'],
        $data['city'],
        $data['zipCode']
    ]);
    
    $patient_id = (int)$pdo->lastInsertId();
    if ($patient_id <= 0) { throw new Exception('Failed to generate patient ID'); }
    
    // Handle medical information in patient_medical_info table
    if (!empty($data['allergies']) || !empty($data['conditions']) || !empty($data['medications']) || !empty($data['bloodType'])) {
        $stmt = $pdo->prepare("
            INSERT INTO patient_medical_info (patient_id, blood_type, allergies, conditions, current_medications) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $patient_id,
            $data['bloodType'] ?? null, // Store blood type directly as string
            $data['allergies'] ?? null,
            $data['conditions'] ?? null,
            $data['medications'] ?? null
        ]);
    }
    
    // Handle emergency contact
    if (!empty($data['emergencyName']) && !empty($data['emergencyRelationship']) && !empty($data['emergencyPhone'])) {
        $stmt = $pdo->prepare("
            INSERT INTO patient_emergency_contacts (patient_id, contact_name, relationship, phone, is_primary) 
            VALUES (?, ?, ?, ?, 1)
        ");
        $stmt->execute([
            $patient_id,
            $data['emergencyName'],
            $data['emergencyRelationship'],
            $data['emergencyPhone']
        ]);
    }
    
    $pdo->commit();
    
    $response['success'] = true;
    $response['message'] = 'Patient registered successfully';
    $response['patient_id'] = $patient_id;
    $response['patient_code'] = $patientCode;
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $response['message'] = 'Error: ' . $e->getMessage();
}

// Check if this is a form submission (not AJAX)
if (isset($_POST['firstName'])) {
    // Redirect back to the form with success message
    if ($response['success']) {
        header('Location: ../../4Care-Doc.html?success=1&message=' . urlencode($response['message']));
    } else {
        header('Location: ../../4Care-Doc.html?error=1&message=' . urlencode($response['message']));
    }
    exit();
} else {
    // Return JSON for AJAX requests
    echo json_encode($response);
}
?>
