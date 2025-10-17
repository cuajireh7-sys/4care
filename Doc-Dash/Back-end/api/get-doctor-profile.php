<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../../../Database-Connection/connection.php';
// Use the logged-in doctor's ID
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (empty($_SESSION['doctor_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}
$sessionDoctorId = (int)$_SESSION['doctor_id'];

try {
    $pdo = get_pdo();
    
    // First check which columns exist in the table
    $columnsResult = $pdo->query("SHOW COLUMNS FROM doctor_users");
    $existingColumns = $columnsResult->fetchAll(PDO::FETCH_COLUMN);
    
    // Build dynamic SELECT query based on existing columns
    $selectFields = ['id', 'employee_id', 'f_name', 'l_name', 'email', 'hospital_status', 'created_at', 'updated_at'];
    
    // Add optional fields if they exist
    $optionalFields = [
        'phone_number', 'date_of_birth', 'address', 'education', 
        'license_number', 'specialization', 'department', 
        'years_of_experience', 'joined_date', 'shift_details'
    ];
    
    foreach ($optionalFields as $field) {
        if (in_array($field, $existingColumns)) {
            $selectFields[] = $field;
        }
    }
    
    $selectQuery = "SELECT " . implode(', ', $selectFields) . " FROM doctor_users WHERE id = :id LIMIT 1";
    
    $stmt = $pdo->prepare($selectQuery);
    $stmt->execute([':id' => $sessionDoctorId]);
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($doctor) {
        // Fetch data from all related tables
        $relatedData = [];
        
        // Get phone numbers
        try {
            $phoneStmt = $pdo->prepare("SELECT phone_number, phone_type FROM doctor_phone_numbers WHERE doctor_id = ? ORDER BY is_primary DESC");
            $phoneStmt->execute([$doctor['id']]);
            $relatedData['phone_numbers'] = $phoneStmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($relatedData['phone_numbers'])) {
                $doctor['phone_number'] = $relatedData['phone_numbers'][0]['phone_number'];
            }
        } catch (Exception $e) {
            $relatedData['phone_numbers'] = [];
        }
        
        // Get addresses
        try {
            $addressStmt = $pdo->prepare("SELECT street_address, city, state, zip_code, country, address_type FROM doctor_addresses WHERE doctor_id = ? ORDER BY is_primary DESC");
            $addressStmt->execute([$doctor['id']]);
            $relatedData['addresses'] = $addressStmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($relatedData['addresses'])) {
                $primaryAddress = $relatedData['addresses'][0];
                $doctor['address'] = $primaryAddress['street_address'] . ', ' . $primaryAddress['city'] . ', ' . $primaryAddress['country'];
            }
        } catch (Exception $e) {
            $relatedData['addresses'] = [];
        }
        
        // Get education
        try {
            $educationStmt = $pdo->prepare("SELECT degree, institution, graduation_year, field_of_study, gpa, honors, website_url FROM doctor_education WHERE doctor_id = ? ORDER BY graduation_year DESC");
            $educationStmt->execute([$doctor['id']]);
            $relatedData['education'] = $educationStmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($relatedData['education'])) {
                $primaryEducation = $relatedData['education'][0];
                $doctor['education'] = $primaryEducation['degree'] . ', ' . $primaryEducation['institution'] . ' (' . $primaryEducation['graduation_year'] . ')';
            }
        } catch (Exception $e) {
            $relatedData['education'] = [];
        }
        
        // Get certifications
        try {
            $certStmt = $pdo->prepare("SELECT certification_name, issued_date, expiry_date FROM doctor_certifications WHERE doctor_id = ? ORDER BY issued_date DESC");
            $certStmt->execute([$doctor['id']]);
            $relatedData['certifications'] = $certStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $relatedData['certifications'] = [];
        }
        
        // Get specializations
        try {
            $specStmt = $pdo->prepare("SELECT specialization_name, years_experience, board_certified FROM doctor_specializations WHERE doctor_id = ? ORDER BY is_primary DESC");
            $specStmt->execute([$doctor['id']]);
            $relatedData['specializations'] = $specStmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($relatedData['specializations'])) {
                $primarySpec = $relatedData['specializations'][0];
                $doctor['specialization'] = $primarySpec['specialization_name'];
                $doctor['years_of_experience'] = $primarySpec['years_experience'];
            }
        } catch (Exception $e) {
            $relatedData['specializations'] = [];
        }
        
        // Get emergency contacts
        try {
            $emergencyStmt = $pdo->prepare("SELECT contact_name, relationship, contact_phone_number FROM doctor_emergency_contacts WHERE doctor_id = ? ORDER BY created_at ASC");
            $emergencyStmt->execute([$doctor['id']]);
            $relatedData['emergency_contacts'] = $emergencyStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $relatedData['emergency_contacts'] = [];
        }
        
        // Get work history
        try {
            $workStmt = $pdo->prepare("SELECT position_title, hospital_name, department, start_date, end_date, is_current FROM doctor_work_history WHERE doctor_id = ? ORDER BY start_date DESC");
            $workStmt->execute([$doctor['id']]);
            $relatedData['work_history'] = $workStmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($relatedData['work_history'])) {
                $currentWork = $relatedData['work_history'][0];
                $doctor['department'] = $currentWork['department'];
                $doctor['joined_date'] = $currentWork['start_date'];
            }
        } catch (Exception $e) {
            $relatedData['work_history'] = [];
        }
        // Format the data for the frontend
        $formattedData = [
            'id' => $doctor['id'],
            'employee_id' => $doctor['employee_id'],
            'username' => 'Dr. ' . $doctor['f_name'] . ' ' . $doctor['l_name'],
            'name' => 'Dr. ' . $doctor['f_name'] . ' ' . $doctor['l_name'],
            'f_name' => $doctor['f_name'],
            'l_name' => $doctor['l_name'],
            'email' => $doctor['email'],
            'hospital_status' => $doctor['hospital_status'],
            'online_status' => $doctor['hospital_status'] ? '1' : '0',
            'specialization' => $doctor['specialization'] ?? 'General Medicine',
            'specialization_name' => $doctor['specialization'] ?? 'General Medicine',
            'phone' => $doctor['phone_number'] ?? 'N/A',
            'phone_number' => $doctor['phone_number'] ?? 'N/A',
            'dob' => $doctor['date_of_birth'] ?? 'N/A',
            'date_of_birth' => $doctor['date_of_birth'] ?? 'N/A',
            'address' => $doctor['address'] ?? 'N/A',
            'education' => $doctor['education'] ?? 'N/A',
            'license_number' => $doctor['license_number'] ?? 'N/A',
            'department' => $doctor['department'] ?? 'General Medicine',
            'years_of_experience' => $doctor['years_of_experience'] ?? 0,
            'joined_date' => $doctor['joined_date'] ?? 'N/A',
            'shift_details' => $doctor['shift_details'] ?? 'N/A',
            'role' => 'doctor',
            'created_at' => $doctor['created_at'],
            'updated_at' => $doctor['updated_at'],
            // Include all related data
            'phone_numbers' => $relatedData['phone_numbers'],
            'addresses' => $relatedData['addresses'],
            'education_history' => $relatedData['education'],
            'certifications' => $relatedData['certifications'],
            'specializations' => $relatedData['specializations'],
            'emergency_contacts' => $relatedData['emergency_contacts'],
            'work_history' => $relatedData['work_history']
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $formattedData
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
