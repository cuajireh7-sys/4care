<?php
declare(strict_types=1);

// Disable error display to prevent HTML output
ini_set('display_errors', '0');
ini_set('log_errors', '1');
header('Content-Type: application/json; charset=UTF-8');

$email = isset($_GET['email']) ? trim((string)$_GET['email']) : '';
if ($email === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email is required']);
    exit;
}

require_once __DIR__ . '/../../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();

    // Debug logging
    error_log('patient-details-get.php - Email: ' . $email);

    // First check if patient exists in patient_account
    $accountData = null;
    try {
        $stmt = $pdo->prepare('SELECT id, first_name, last_name, email AS signup_email, created_at FROM patient_account WHERE LOWER(email) = LOWER(?)');
        $stmt->execute([$email]);
        $accountData = $stmt->fetch();
    } catch (Throwable $e) {
        $accountData = null;
    }
    
    // Do NOT early-exit if signup/account row is missing; continue to resolve from other tables
    if (!$accountData) {
        error_log('patient-details-get.php - Patient not found in account table for email: ' . $email);
    }
    
    // Get patient profile data
    $profileData = null;
    try {
        $stmt = $pdo->prepare('SELECT * FROM patient_profile WHERE LOWER(email) = LOWER(?) LIMIT 1');
        $stmt->execute([$email]);
        $profileData = $stmt->fetch();
    } catch (Throwable $e) {
        $profileData = null;
    }

    // Resolve patient_id from patient_details (supports schemas with `patient_id` or `id`).
    $resolvedPatientId = null;
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM patient_details")->fetchAll(PDO::FETCH_COLUMN, 0);
        $idCol = in_array('patient_id', $cols, true) ? 'patient_id' : (in_array('id', $cols, true) ? 'id' : null);
        if ($idCol) {
            $stmt = $pdo->prepare("SELECT $idCol AS pid FROM patient_details WHERE LOWER(email) = LOWER(?) LIMIT 1");
            $stmt->execute([$email]);
            $row = $stmt->fetch();
            if ($row && isset($row['pid'])) {
                $resolvedPatientId = $row['pid'];
            }
        }
        // Do NOT seed patient_details here; only doctor registration may create rows
    } catch (Throwable $e) {
        // ignore
    }

    // Get patient data from legacy patient_details and child tables (fallback),
    // with graceful fallback behavior if patient_profile is not populated
    $patientData = null;
    try {
        $sql = "
            SELECT 
                pd.patient_id,
                pd.first_name,
                pd.last_name,
                pd.date_of_birth,
                pd.email,
                pd.phone,
                pd.address,
                pd.barangay,
                pd.city,
                pd.zip_code,
                pd.created_at,
                pd.registration_status,
                pd.registered_by_doctor_id,
                pd.registered_by_admin_id,
                pd.doctor_registration_date,
                pd.patient_signup_date,
                pd.profile_photo,
                pd.age,
                pd.height_cm,
                pd.weight_kg,
                pd.immunizationHistory AS legacy_immunization_history,
                g.gender_name,
                c.country_name,
                pmi.blood_type AS blood_type_name,
                COALESCE(pmi.allergies,'None') AS allergies,
                COALESCE(pmi.conditions,'None') AS conditions,
                COALESCE(pmi.current_medications,'None') AS medications,
                pec.contact_name AS emergency_name,
                pec.relationship AS emergency_relationship,
                pec.phone AS emergency_phone
            FROM patient_details pd
            LEFT JOIN genders g ON pd.gender_id = g.gender_id
            LEFT JOIN countries c ON pd.country_id = c.country_id
            LEFT JOIN patient_medical_info pmi ON pmi.patient_id = pd.patient_id
            LEFT JOIN patient_emergency_contacts pec ON pec.patient_id = pd.patient_id AND pec.is_primary = 1
            WHERE pd.email = ?
            ORDER BY pd.created_at DESC
            LIMIT 1
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$email]);
        $patientData = $stmt->fetch();

        // If nothing found, fallback to legacy patients table if it exists
        if (!$patientData) {
            try {
                $tbl2 = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients'");
                $tbl2->execute();
                if ((int)$tbl2->fetchColumn() > 0) {
                    $stmt = $pdo->prepare('SELECT * FROM patients WHERE email = ? ORDER BY created_at DESC LIMIT 1');
                    $stmt->execute([$email]);
                    $patientData = $stmt->fetch();
                }
            } catch (Throwable $e) {}
        }
    } catch (Exception $e) {
        error_log('patient-details-get.php - Error fetching patient data: ' . $e->getMessage());
        $patientData = null;
    }
    
    // Get health timeline data using resolved patient_id
    $healthTimelineData = [];
    try {
        $patientId = $resolvedPatientId; // previously resolved from patient_details
        if ($patientId) {
            // Prefer patient_health_timeline if present, otherwise fallback to health_timeline
            $tblCheck = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_health_timeline'");
            $tblCheck->execute();
            $useNew = (int)$tblCheck->fetchColumn() > 0;
            $tableName = $useNew ? 'patient_health_timeline' : 'health_timeline';
            $stmt = $pdo->prepare('SELECT * FROM ' . $tableName . ' WHERE patient_id = ? ORDER BY COALESCE(entry_date, created_at) DESC, created_at DESC');
            $stmt->execute([$patientId]);
            $healthTimelineData = $stmt->fetchAll();
        }
    } catch (Exception $e) {
        error_log('patient-details-get.php - Error fetching health timeline: ' . $e->getMessage());
        $healthTimelineData = [];
    }
    
    // Debug logging for health timeline
    error_log('patient-details-get.php - Health timeline data: ' . print_r($healthTimelineData, true));
    error_log('patient-details-get.php - Health timeline count: ' . count($healthTimelineData));
    
    // Verification removed

    // Combine and normalize output for UI
    $row = [];
    if ($profileData) {
        // Build normalized output from patient_profile + patient_account
        // Support both camelCase and snake_case DB schemas
        $row = [
            'patient_account_id' => $accountData['id'] ?? null,
            'signupEmail' => $accountData['signup_email'] ?? ($profileData['email'] ?? $email),
            'patient_id' => $resolvedPatientId,
            // Prefer names from profile when present, fallback to account
            'firstName' => $profileData['firstName']
                ?? $profileData['first_name']
                ?? ($accountData['first_name'] ?? null),
            'lastName' => $profileData['lastName']
                ?? $profileData['last_name']
                ?? ($accountData['last_name'] ?? null),
            'email' => $profileData['email'] ?? $email,
            'gender' => $profileData['gender'] ?? ($profileData['sex'] ?? null),
            'age' => $profileData['age'] ?? null,
            'birthDate' => $profileData['birthDate']
                ?? $profileData['birth_date']
                ?? $profileData['date_of_birth']
                ?? null,
            'contact' => $profileData['contact']
                ?? $profileData['phone']
                ?? $profileData['mobile']
                ?? null,
            'address' => $profileData['address'] ?? null,
            'barangay' => $profileData['barangay'] ?? null,
            'emergencyContact' => $profileData['emergencyContact']
                ?? $profileData['emergency_contact']
                ?? null,
            // Optional fields commonly used by UI
            'civilStatus' => $profileData['civilStatus']
                ?? $profileData['civil_status']
                ?? null,
            'bloodType' => $profileData['bloodType']
                ?? $profileData['blood_type']
                ?? null,
            'registrationDate' => $accountData['created_at']
                ?? $profileData['registrationDate']
                ?? $profileData['registration_date']
                ?? null,
            'profile_photo' => $profileData['profile_photo']
                ?? $profileData['profilePhoto']
                ?? null,
            'created_at' => $profileData['created_at'] ?? null,
            'updated_at' => $profileData['updated_at'] ?? null,
        ];
    } elseif ($patientData) {
        // Check if patient was registered by doctor/admin
        $isDoctorRegistered = true;
        $registrationStatus = 'verified';
        
        $row = [
            'signup_id' => $accountData['id'] ?? null,
            'signupEmail' => $accountData['signup_email'] ?? ($patientData['email'] ?? $email),
            'firstName' => $patientData['first_name'] ?? ($accountData['first_name'] ?? null),
            'lastName' => $patientData['last_name'] ?? ($accountData['last_name'] ?? null),
            'patient_id' => $patientData['patient_id'] ?? null,
            'email' => $patientData['email'] ?? null,
            'created_at' => $patientData['created_at'] ?? null,
            'registrationDate' => $accountData['created_at'] ?? ($patientData['patient_signup_date'] ?? null),
            
            // Registration status and permissions
            'registration_status' => $registrationStatus,
            'is_doctor_registered' => $isDoctorRegistered,
            'can_edit_profile' => true,
            
            // Patient details (only if verified)
            'dob' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['date_of_birth'] ?? null) : null,
            'birthDate' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['date_of_birth'] ?? null) : null,
            'gender' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['gender_name'] ?? ($patientData['gender'] ?? null)) : null,
            'phone' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['phone'] ?? null) : null,
            'contact' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['phone'] ?? null) : null,
            'address' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['address'] ?? null) : null,
            'barangay' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['barangay'] ?? null) : null,
            'city' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['city'] ?? null) : null,
            'zipCode' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['zip_code'] ?? null) : null,
            'country' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['country_name'] ?? null) : null,
            'bloodType' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['blood_type_name'] ?? null) : null,
            'allergies' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['allergies'] ?? null) : null,
            'conditions' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['conditions'] ?? null) : null,
            'medications' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['medications'] ?? null) : null,
            'emergencyName' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['emergency_name'] ?? null) : null,
            'emergencyRelationship' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['emergency_relationship'] ?? null) : null,
            'emergencyPhone' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['emergency_phone'] ?? null) : null,
            // Extra UI fields
            'profile_photo' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['profile_photo'] ?? null) : null,
            'age' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['age'] ?? null) : null,
            'height_cm' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['height_cm'] ?? null) : null,
            'weight_kg' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['weight_kg'] ?? null) : null,
            'immunizationHistory' => ($isDoctorRegistered && $registrationStatus === 'verified') ? ($patientData['legacy_immunization_history'] ?? null) : null,
        ];
    } else {
        // Minimal fallback when only account exists
        $row = [
            'patient_account_id' => $accountData['id'] ?? null,
            'signupEmail' => $accountData['signup_email'] ?? $email,
            'patient_id' => $resolvedPatientId,
            'firstName' => $accountData['first_name'] ?? null,
            'lastName' => $accountData['last_name'] ?? null,
            'email' => $email,
            'registrationDate' => $accountData['created_at'] ?? null,
            'registration_status' => 'pending',
            'can_edit_profile' => false,
        ];
    }

    // Always include account names for UI full name rendering
    $row['accountFirstName'] = $accountData['first_name'] ?? null;
    $row['accountLastName']  = $accountData['last_name'] ?? null;

    $row['health_timeline'] = $healthTimelineData;
    
    // Debug: Check if we have any patient data
    if (!$patientData) {
        error_log('patient-details-get.php - WARNING: No patient data found for email: ' . $email);
    } else {
        error_log('patient-details-get.php - SUCCESS: Patient data found with ' . count($patientData) . ' fields');
    }
    
    // Debug logging
    error_log('patient-details-get.php - Account data: ' . print_r($accountData, true));
    error_log('patient-details-get.php - Patients table data: ' . print_r($patientData, true));
    error_log('patient-details-get.php - Combined result: ' . print_r($row, true));
    
    error_log('patient-details-get.php - Returning data for email: ' . $email);
    echo json_encode(['ok' => true, 'data' => $row]);
} catch (Throwable $e) {
    error_log('patient-details-get.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

