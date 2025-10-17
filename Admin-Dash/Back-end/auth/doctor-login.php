<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
session_start();

require_once __DIR__ . '/../config/database.php';

$raw = file_get_contents('php://input');
$data = [];
if (is_string($raw) && $raw !== '') {
    $json = json_decode($raw, true);
    if (is_array($json)) { $data = $json; }
    // Fallback: handle urlencoded bodies sent with wrong header
    if (empty($data)) {
        $form = [];
        parse_str($raw, $form);
        if (is_array($form) && !empty($form)) { $data = $form; }
    }
}
if (empty($data)) { $data = $_POST ?: $_REQUEST; }

// Accept multiple field names from different frontends
$username = trim((string)($data['username'] ?? $data['email'] ?? $data['loginEmail'] ?? ''));
$password = (string)($data['password'] ?? $data['loginPassword'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Username and password are required.']);
    exit;
}

try {
    $pdo = admin_pdo();
    
    // Check what columns exist in the table
    $checkColumns = $pdo->query("SHOW COLUMNS FROM doctor_users");
    $existingColumns = $checkColumns->fetchAll(PDO::FETCH_COLUMN);
    
    // Determine which columns to select based on what exists
    $selectColumns = ['id'];
    $whereColumn = 'username';
    $passwordColumn = 'password_hash';
    $roleColumn = 'role';
    
    // If username column is missing but email exists, fall back to email
    $hasUsername = in_array('username', $existingColumns);
    $hasEmail = in_array('email', $existingColumns);
    if (!$hasUsername && !$hasEmail) {
        echo json_encode(['ok' => false, 'error' => 'Neither username nor email column found in doctor_users.']);
        exit;
    }
    
    // Check if password_hash column exists, if not use password
    if (!in_array('password_hash', $existingColumns)) {
        if (in_array('password', $existingColumns)) {
            $passwordColumn = 'password';
        } else {
            echo json_encode(['ok' => false, 'error' => 'Password column not found. Please run the database fix script.']);
            exit;
        }
    }
    
    // Add columns to select
    if ($hasUsername) { $selectColumns[] = 'username'; }
    if ($hasEmail) { $selectColumns[] = 'email'; }
    $selectColumns[] = $passwordColumn;
    // Include legacy plaintext column if it exists so fallback can work
    if (in_array('password', $existingColumns)) { $selectColumns[] = 'password'; }
    
    // Check if role column exists
    if (in_array('role', $existingColumns)) {
        $selectColumns[] = 'role';
    }
    
    // Build and execute query (accept identifier as username OR email when available)
    $selectClause = implode(', ', $selectColumns);
    // Normalize identifier for case-insensitive match
    $identifier = trim($username);
    if ($hasUsername && $hasEmail) {
        $stmt = $pdo->prepare("SELECT {$selectClause} FROM doctor_users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1");
        $stmt->execute([$identifier, $identifier]);
    } elseif ($hasUsername) {
        $stmt = $pdo->prepare("SELECT {$selectClause} FROM doctor_users WHERE LOWER(username) = LOWER(?) LIMIT 1");
        $stmt->execute([$identifier]);
    } else { // only email exists
        $stmt = $pdo->prepare("SELECT {$selectClause} FROM doctor_users WHERE LOWER(email) = LOWER(?) LIMIT 1");
        $stmt->execute([$identifier]);
    }
    $doctor = $stmt->fetch();

    // Validate password (support password_hash or legacy plaintext column)
    $isValid = false;
    if ($doctor) {
        $hash = (string)($doctor[$passwordColumn] ?? '');
        // Fallback: if selected column empty but a legacy 'password' exists, use it
        if ($hash === '' && isset($doctor['password'])) {
            $hash = (string)$doctor['password'];
        }
        if ($hash !== '') {
            $isBcrypt = (strpos($hash, '$2y$') === 0 || strpos($hash, '$2a$') === 0 || strpos($hash, '$2b$') === 0);
            $isArgon  = (strpos($hash, '$argon2') === 0);
            if ($isBcrypt || $isArgon) {
                $isValid = password_verify($password, $hash);
            } else {
                $isValid = hash_equals($hash, $password);
            }
        }
    }

    if (!$doctor || !$isValid) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Invalid credentials']);
        exit;
    }

    // Handle role validation
    $userRole = 'doctor'; // Default role
    if (in_array('role', $existingColumns) && array_key_exists('role', $doctor)) {
        $val = trim((string)$doctor['role']);
        $userRole = ($val === '' ? 'doctor' : strtolower($val));
    }
    
    // Validate that the user is actually a doctor
    if ($userRole !== 'doctor') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Access denied. This account is not authorized for doctor access.']);
        exit;
    }

    $_SESSION['doctor_id'] = (int)$doctor['id'];
    $_SESSION['doctor_username'] = $doctor['username'] ?? ($doctor['email'] ?? '');
    $_SESSION['doctor_role'] = $userRole;

    echo json_encode(['ok' => true, 'username' => ($_SESSION['doctor_username'] ?? ''), 'role' => $userRole]);
} catch (Throwable $e) {
    http_response_code(500);
    // Log the actual error for debugging (remove in production)
    error_log("Doctor login error: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
