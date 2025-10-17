<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');


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

// Map and validate inputs
$firstName = clean_text($data['firstName'] ?? '', VALIDATION_LIMITS['MEDIUM_TEXT_MAX']);
$lastName = clean_text($data['lastName'] ?? '', VALIDATION_LIMITS['MEDIUM_TEXT_MAX']);
$birthdate = clean_date($data['birthDate'] ?? null);
$age = clean_numeric($data['age'] ?? null, 0, 150);
$gender = clean_enum($data['gender'] ?? null, VALIDATION_ENUMS['GENDER']);


// Clean text inputs with appropriate limits
$contact = clean_text($data['contact'] ?? '', VALIDATION_LIMITS['CONTACT_MAX']);
$barangay = clean_text($data['barangay'] ?? '', VALIDATION_LIMITS['BARANGAY_MAX']);
$address = clean_text($data['address'] ?? '', VALIDATION_LIMITS['ADDRESS_MAX']);
$emergencyContact = clean_text($data['emergencyContact'] ?? '', VALIDATION_LIMITS['EMERGENCY_CONTACT_MAX']);

// Validate file uploads
$photoBase64 = validate_file_upload($data['profile_photo'] ?? null);

// Linkage key: email from login/session (provided by frontend)
$email = clean_text($data['email'] ?? '', VALIDATION_LIMITS['EMAIL_MAX']);

// Basic validations
if (!$birthdate) send_error(ERROR_MESSAGES['BIRTHDATE_REQUIRED']);
if ($age === null) send_error(ERROR_MESSAGES['AGE_INVALID']);
if (!$gender) send_error(ERROR_MESSAGES['GENDER_INVALID']);
if ($contact === '') send_error(ERROR_MESSAGES['CONTACT_REQUIRED']);
if ($address === '') send_error(ERROR_MESSAGES['ADDRESS_REQUIRED']);

try {
    $pdo = get_pdo();

    // Get patient_account_id from patient_account table
    $accountStmt = $pdo->prepare('SELECT id FROM patient_account WHERE email = ? LIMIT 1');
    $accountStmt->execute([$email]);
    $patientAccountId = $accountStmt->fetchColumn();
    
    if (!$patientAccountId) {
        send_error('Patient account not found for this email', 404);
    }
    
    // Insert into patient_profile table (without firstName/lastName - they're in patient_account)
    $sql = "INSERT INTO patient_profile (
                patient_account_id, email,
                birthDate, age, gender,
                contact, barangay, address, emergencyContact,
                profile_photo
            ) VALUES (?,?,?,?,?,?,?,?,?,?)";
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        $patientAccountId,
        $email,
        $birthdate,
        $age,
        $gender,
        $contact,
        $barangay,
        $address,
        $emergencyContact,
        $photoBase64,
    ]);

    // No longer writing to patient_details. Profile data is stored only in patient_profile.
    
    send_success(ERROR_MESSAGES['PATIENT_DETAILS_SAVED']);
    
} catch (Throwable $e) {
    error_log('patient-details-save error: ' . $e->getMessage());
    send_error(ERROR_MESSAGES['SERVER_ERROR'] . ': ' . $e->getMessage(), 500);
}

