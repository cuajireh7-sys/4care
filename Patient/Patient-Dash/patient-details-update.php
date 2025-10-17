<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

// Include shared database connection
require_once __DIR__ . '/../../Database-Connection/connection.php';

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
    'CIVIL_STATUS' => ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
    'BLOOD_TYPE' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
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
    
    return mb_substr($fileData, 0, VALIDATION_LIMITS['FILE_SIZE_MAX']);
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

// Allowed updatable columns with proper validation
$fields = [
    'middleName' => fn($v) => clean_text($v, VALIDATION_LIMITS['MIDDLE_NAME_MAX']),
    'gender' => fn($v) => clean_enum($v, VALIDATION_ENUMS['GENDER']),
    'age' => fn($v) => clean_numeric($v, 0, 150),
    'civilStatus' => fn($v) => clean_enum($v, VALIDATION_ENUMS['CIVIL_STATUS']),
    'bloodType' => fn($v) => clean_enum($v, VALIDATION_ENUMS['BLOOD_TYPE']),
    'religion' => fn($v) => clean_text($v, VALIDATION_LIMITS['RELIGION_MAX']),
    'work' => fn($v) => clean_text($v, VALIDATION_LIMITS['WORK_MAX']),
    'contact' => fn($v) => clean_text($v, VALIDATION_LIMITS['CONTACT_MAX']),
    'address' => fn($v) => clean_text($v, VALIDATION_LIMITS['ADDRESS_MAX']),
    'allergy' => fn($v) => clean_text($v, VALIDATION_LIMITS['TEXT_MAX']),
    'height_cm' => fn($v) => clean_numeric($v, 0, 300),
    'weight_kg' => fn($v) => clean_numeric($v, 0, 500),
    'medications' => fn($v) => clean_text($v, VALIDATION_LIMITS['LONG_TEXT_MAX']),
    'immunizationHistory' => fn($v) => clean_text($v, VALIDATION_LIMITS['LONG_TEXT_MAX']),
    'emergencyContact' => fn($v) => clean_text($v, VALIDATION_LIMITS['EMERGENCY_CONTACT_MAX']),
    'email' => fn($v) => clean_text($v, VALIDATION_LIMITS['EMAIL_MAX']),
    'barangay' => fn($v) => clean_numeric($v, 0, 999999),
    'motherName' => fn($v) => clean_text($v, VALIDATION_LIMITS['MOTHER_NAME_MAX']),
    'fatherName' => fn($v) => clean_text($v, VALIDATION_LIMITS['FATHER_NAME_MAX']),
    'birthDate' => fn($v) => clean_date($v),
    'birthOrder' => fn($v) => clean_numeric($v, 1, 20),
    'idUploadBase64' => fn($v) => validate_file_upload($v),
    'profilePhotoBase64' => fn($v) => validate_file_upload($v),
];

$updates = [];
$params = [];
foreach ($fields as $col => $san) {
    if (array_key_exists($col, $data)) {
        $val = $san($data[$col]);
        if ($val === null) { 
            continue; 
        }
        // Map frontend field names to database column names
        $dbCol = $col;
        if ($col === 'idUploadBase64') $dbCol = 'idPhoto';
        if ($col === 'profilePhotoBase64') $dbCol = 'profile_photo';
        $updates[] = "$dbCol = ?";
        $params[] = $val;
    }
}

try {
    $pdo = get_pdo();

    // Do not seed patient_details; edits must not create new patients

    if (empty($updates)) {
        send_success(ERROR_MESSAGES['NO_CHANGES']);
    }

    $sql = 'UPDATE patient_details SET ' . implode(', ', $updates) . ' WHERE email = ?';
    $params[] = $email;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    send_success(ERROR_MESSAGES['PATIENT_DETAILS_UPDATED']);
    
} catch (Throwable $e) {
    error_log('patient-details-update error: ' . $e->getMessage());
    send_error(ERROR_MESSAGES['SERVER_ERROR'] . ': ' . $e->getMessage(), 500);
}
?>