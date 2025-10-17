<?php
header('Content-Type: application/json');
session_start();
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include database connection
require_once '../../Database-Connection/connection.php';

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
if (empty($input['patientId']) || empty($input['patientName']) || empty($input['medications']) || !is_array($input['medications'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Patient ID, patient name and medications are required']);
    exit;
}

try {
    // Require logged-in doctor; use session-based identity
    if (empty($_SESSION['doctor_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Not authenticated as a doctor']);
        exit;
    }
    $doctorId = (int)$_SESSION['doctor_id'];

    // Start transaction
    $conn->begin_transaction();
    
    // Get patient ID from patient ID or name
    $patientIdInput = trim($input['patientId']);
    $patientName = trim($input['patientName']);
    
    // First try to find by visible code in patient_details, then by full name or email
    $patientQuery = "SELECT patient_id AS id FROM patient_details WHERE patient_visible_id = ? OR CONCAT(first_name, ' ', last_name) = ? OR email = ?";
    $patientStmt = $conn->prepare($patientQuery);
    $patientStmt->bind_param("sss", $patientIdInput, $patientName, $patientName);
    $patientStmt->execute();
    $patientResult = $patientStmt->get_result();
    
    if ($patientResult->num_rows === 0) {
        throw new Exception('Patient not found. Please check the Patient ID and name.');
    }
    
    $patient = $patientResult->fetch_assoc();
    $patientId = $patient['id'];
    
    // Create prescription record
    $prescriptionDate = date('Y-m-d H:i:s');
    $generalInstructions = '';
    
    // Insert into patient_prescription master table
    $prescriptionQuery = "INSERT INTO patient_prescription (patient_id, doctor_id, prescription_date, general_instructions, created_at) VALUES (?, ?, ?, ?, ?)";
    $prescriptionStmt = $conn->prepare($prescriptionQuery);
    $prescriptionStmt->bind_param("iisss", $patientId, $doctorId, $prescriptionDate, $generalInstructions, $prescriptionDate);
    
    if (!$prescriptionStmt->execute()) {
        throw new Exception('Failed to create prescription record');
    }
    
    $prescriptionId = $conn->insert_id;
    
    // Insert medications
    // Insert into patient_prescription_items detail table
    $medicationQuery = "INSERT INTO patient_prescription_items (prescription_id, medication_name, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?)";
    $medicationStmt = $conn->prepare($medicationQuery);
    
    foreach ($input['medications'] as $medication) {
        if (empty($medication['medication']) || empty($medication['dosage']) || empty($medication['frequency'])) {
            continue; // Skip incomplete medications
        }
        
        $medicationStmt->bind_param("isssss", 
            $prescriptionId,
            $medication['medication'],
            $medication['dosage'],
            $medication['frequency'],
            $medication['duration'] ?? '',
            ''
        );
        
        if (!$medicationStmt->execute()) {
            throw new Exception('Failed to save medication: ' . $medication['medication']);
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Prescription saved successfully',
        'prescriptionId' => $prescriptionId,
        'medicationsCount' => count($input['medications'])
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Close statements
    if (isset($patientStmt)) $patientStmt->close();
    if (isset($prescriptionStmt)) $prescriptionStmt->close();
    if (isset($medicationStmt)) $medicationStmt->close();
    $conn->close();
}
?>