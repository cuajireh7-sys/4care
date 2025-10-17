<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Accept JSON (fetch) or traditional form POST
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST; // fallback to form-encoded
}

// Inline login support (same file) to reduce files
if (($data['action'] ?? '') === 'login') {
    $emailLogin = strtolower(trim((string)($data['email'] ?? '')));
    $passwordLogin = (string)($data['password'] ?? '');
    if ($emailLogin === '' || $passwordLogin === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Email and password are required.']);
        exit;
    }

    try {
        require_once __DIR__ . '/../../../Database-Connection/connection.php';
        $pdo = get_pdo();
        
        // Debug: Log successful database connection
        error_log("Database connection successful for login");


        // Get user from patient_account table
        $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, password_hash FROM patient_account WHERE email = ? LIMIT 1');
        $stmt->execute([$emailLogin]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Wrong password.']);
            exit;
        }

        if (password_verify($passwordLogin, $user['password_hash'])) {
            echo json_encode([
                'ok' => true,
                'id' => (int)$user['id'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name'],
                'email' => $user['email']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Wrong password.']);
            exit;
        }
    } catch (Throwable $e) {
        // Log the actual error for debugging
        error_log("Login error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Server error. Please try again.']);
    }
    exit;
}

// Simple, strict sanitization
function clean_name(?string $v): string {
    $v = trim((string)$v);
    $v = preg_replace("/[^a-zA-Z\s'\-]/", '', $v);
    return substr($v, 0, 100);
}

function bad(string $m): void {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $m]);
    exit;
}

$firstName = clean_name($data['firstName'] ?? '');
$lastName  = clean_name($data['lastName'] ?? '');
$emailRaw  = strtolower(trim((string)($data['email'] ?? '')));
$email     = filter_var($emailRaw, FILTER_VALIDATE_EMAIL) ?: false;
$password  = (string)($data['password'] ?? '');

if ($firstName === '' || $lastName === '') {
    bad('First and last name are required.');
}
if ($email === false) {
    bad('A valid email is required.');
}
if (strlen($password) < 6) {
    bad('Password must be at least 6 characters.');
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

require_once __DIR__ . '/../../../Database-Connection/connection.php';

try {
    $pdo = get_pdo();

    // Ensure connection works and use patient_account table
    $check = $pdo->query('SELECT 1')->fetchColumn();

    // Reject duplicate email
    $stmt = $pdo->prepare('SELECT id FROM patient_account WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'Email already registered.']);
        exit;
    }

    $insert = $pdo->prepare('INSERT INTO patient_account (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)');
    $insert->execute([$firstName, $lastName, $email, $passwordHash]);

    echo json_encode(['ok' => true, 'message' => 'Registration successful']);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('Signup error: ' . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
exit;