<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

// Ensure JSON error on unexpected fatals
set_exception_handler(function($e){
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    exit;
});
register_shutdown_function(function(){
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Server error: ' . $err['message']]);
    }
});

// Include database connection
require_once __DIR__ . '/../../../Database-Connection/connection.php';

// Validation and Sanitization Constants
const VALIDATION_LIMITS = [
    'EMAIL_MAX' => 191,
    'TEXT_MAX' => 255,
    'SHORT_TEXT_MAX' => 50,
    'MEDIUM_TEXT_MAX' => 100,
    'LONG_TEXT_MAX' => 65535,
    'CONTACT_MAX' => 15,
    'BARANGAY_MAX' => 10,
    'ADDRESS_MAX' => 100,
    'MIDDLE_NAME_MAX' => 30,
    'RELIGION_MAX' => 30,
    'WORK_MAX' => 50,
    'MOTHER_NAME_MAX' => 50,
    'FATHER_NAME_MAX' => 50,
    'BLOOD_TYPE_MAX' => 5,
    'GENDER_MAX' => 50,
    'EMERGENCY_CONTACT_MAX' => 100,
    'FILE_SIZE_MAX' => 2_000_000 // 2MB
];

const VALIDATION_ENUMS = [
    'GENDER' => ['Male', 'Female', 'Other'],
    'BLOOD_TYPE' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'COUNTRY' => ['US', 'CA', 'UK', 'AU', 'IN', 'JP', 'PH', 'other']
];

const ERROR_MESSAGES = [
    'METHOD_NOT_ALLOWED' => 'Method not allowed',
    'EMAIL_REQUIRED' => 'Email is required',
    'BIRTHDATE_REQUIRED' => 'Birthdate is required',
    'AGE_INVALID' => 'Age is invalid',
    'GENDER_INVALID' => 'Gender is invalid',
    'CIVIL_STATUS_INVALID' => 'Civil status is invalid',
    'CONTACT_REQUIRED' => 'Contact is required',
    'ADDRESS_REQUIRED' => 'Address is required',
    'BLOOD_TYPE_REQUIRED' => 'Blood type is required',
    'SERVER_ERROR' => 'Server error',
    'NO_CHANGES' => 'No changes',
    'PATIENT_DETAILS_SAVED' => 'Patient details saved.',
    'PATIENT_DETAILS_UPDATED' => 'Patient details updated'
];

// Utility Functions
function clean_text(?string $value, int $maxLength = VALIDATION_LIMITS['TEXT_MAX']): string {
    if ($value === null || $value === '') {
        return '';
    }
    
    $value = trim($value);
    $value = strip_tags($value);
    $value = preg_replace('/\s+/', ' ', $value);
    
    return mb_substr($value, 0, $maxLength);
}

function clean_enum(?string $value, array $allowed): ?string {
    $value = trim((string)$value);
    return in_array($value, $allowed, true) ? $value : null;
}

function clean_date(?string $value): ?string {
    $value = trim((string)$value);
    if ($value === '') return null;
    
    $date = date_create($value);
    return $date ? $date->format('Y-m-d') : null;
}

function clean_numeric($value, int $min = 0, int $max = PHP_INT_MAX): ?int {
    if (!is_numeric($value)) return null;
    
    $num = (int)$value;
    return ($num >= $min && $num <= $max) ? $num : null;
}

function send_error(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

function send_success(string $message, $data = null): void {
    $response = ['ok' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

function validate_file_upload(?string $fileData): ?string {
    if (!$fileData || !is_string($fileData)) {
        return null;
    }
    // Cap to max allowed length to avoid memory issues
    $data = (string)$fileData;
    if (strlen($data) > VALIDATION_LIMITS['FILE_SIZE_MAX']) {
        $data = substr($data, 0, VALIDATION_LIMITS['FILE_SIZE_MAX']);
    }
    return $data;
}

// Get request data
$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) { 
    $data = $_POST; 
}

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error(ERROR_MESSAGES['METHOD_NOT_ALLOWED'], 405);
}

$email = clean_text($data['email'] ?? '', VALIDATION_LIMITS['EMAIL_MAX']);
if ($email === '') {
    send_error(ERROR_MESSAGES['EMAIL_REQUIRED']);
}

// Lightweight permission check: ensure patient_account exists; allow self-edit
try {
    $pdo = get_pdo();
    $accountChk = $pdo->prepare('SELECT id FROM patient_account WHERE email = ? LIMIT 1');
    $accountChk->execute([$email]);
    if (!$accountChk->fetchColumn()) {
        send_error('Patient account not found for this email', 404);
    }
} catch (Throwable $e) {
    error_log('patient-details-update account check error: ' . $e->getMessage());
    send_error('Permission check failed', 500);
}

// Allowed updatable columns for patient_profile table (excluding firstName/lastName - they're in patient_account)
$patientProfileFields = [
    // Personal Information
    'birthDate' => fn($v) => clean_date($v),
    'age' => fn($v) => clean_numeric($v, 0, 150),
    'gender' => fn($v) => clean_enum($v, VALIDATION_ENUMS['GENDER']),
    
    // Contact Information
    'contact' => fn($v) => clean_text($v, VALIDATION_LIMITS['CONTACT_MAX']),
    'barangay' => fn($v) => clean_text($v, VALIDATION_LIMITS['BARANGAY_MAX']),
    'address' => fn($v) => clean_text($v, VALIDATION_LIMITS['ADDRESS_MAX']),
    'emergencyContact' => fn($v) => clean_text($v, VALIDATION_LIMITS['EMERGENCY_CONTACT_MAX']),
    
    // Profile Photo
    'profile_photo' => fn($v) => validate_file_upload($v),
];

$updates = [];
$params = [];
foreach ($patientProfileFields as $col => $san) {
    if (array_key_exists($col, $data)) {
        $val = $san($data[$col]);
        if ($val === null) { 
            continue; 
        }
        $updates[] = "$col = ?";
        $params[] = $val;
    }
}

try {
    // Ensure a row exists for this email in patient_profile and is linked to patient_account
    $exists = $pdo->prepare('SELECT id FROM patient_profile WHERE email = ? LIMIT 1');
    $exists->execute([$email]);
    if (!$exists->fetch()) {
        $accountIdStmt = $pdo->prepare('SELECT id FROM patient_account WHERE email = ? LIMIT 1');
        $accountIdStmt->execute([$email]);
        $patientAccountId = $accountIdStmt->fetchColumn();
        if (!$patientAccountId) {
            send_error('Patient account not found for this email', 404);
        }
        try {
            $seed = $pdo->prepare('INSERT INTO patient_profile (email, patient_account_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())');
            $seed->execute([$email, $patientAccountId]);
        } catch (PDOException $e) {
            // Ignore duplicate entry race condition
            if ($e->getCode() !== '23000') {
                throw $e;
            }
        }
    }

    // Only update patient_profile if there are updates for it
    if (!empty($updates)) {
        $sql = 'UPDATE patient_profile SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE email = ?';
        $params[] = $email;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // Update names in patient_account if provided
    $firstNameIncoming = isset($data['firstName']) ? clean_text($data['firstName'], VALIDATION_LIMITS['TEXT_MAX']) : null;
    $lastNameIncoming  = isset($data['lastName'])  ? clean_text($data['lastName'],  VALIDATION_LIMITS['TEXT_MAX']) : null;
    if (($firstNameIncoming !== null) || ($lastNameIncoming !== null)) {
        $setParts = [];
        $nameParams = [];
        if ($firstNameIncoming !== null && $firstNameIncoming !== '') { $setParts[] = 'first_name = ?'; $nameParams[] = $firstNameIncoming; }
        if ($lastNameIncoming  !== null && $lastNameIncoming  !== '') { $setParts[] = 'last_name = ?';  $nameParams[] = $lastNameIncoming;  }
        if (!empty($setParts)) {
            $sql = 'UPDATE patient_account SET ' . implode(', ', $setParts) . ' WHERE email = ?';
            $nameParams[] = $email;
            $pdo->prepare($sql)->execute($nameParams);
        }
    }

    send_success(ERROR_MESSAGES['PATIENT_DETAILS_UPDATED'], [
        'accountFirstName' => $firstNameIncoming,
        'accountLastName'  => $lastNameIncoming
    ]);
    
} catch (Throwable $e) {
    error_log('patient-details-update error: ' . $e->getMessage());
    error_log('patient-details-update stack trace: ' . $e->getTraceAsString());
    send_error(ERROR_MESSAGES['SERVER_ERROR'] . ': ' . $e->getMessage(), 500);
}
?>