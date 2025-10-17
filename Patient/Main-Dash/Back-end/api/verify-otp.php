<?php
declare(strict_types=1);

// Ensure no PHP notices/warnings leak into JSON
ini_set('display_errors', '0');
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../../../Database-Connection/connection.php';

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $pdo = get_pdo();
    
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = $_POST;
    }
    
    $otpCode = trim($data['otp_code'] ?? '');
    $email = strtolower(trim($data['email'] ?? ''));
    
    if (empty($otpCode) || strlen($otpCode) !== 6) {
        throw new Exception('Invalid OTP code');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }
    
    // Get user info by email only
    $stmt = $pdo->prepare('SELECT id, first_name, last_name, email FROM patient_account WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    // Verify OTP - First check if any OTP exists (even expired ones)
    $stmt = $pdo->prepare('
        SELECT otp_code, expires_at, created_at 
        FROM patient_otp 
        WHERE patient_id = ? AND method = ?
        ORDER BY created_at DESC 
        LIMIT 1
    ');
    $stmt->execute([$user['id'], 'email']);
    $otpRecord = $stmt->fetch();
    
    if (!$otpRecord) {
        throw new Exception('No OTP found for this user and method');
    }
    
    // Debug: Log the times
    $currentTime = date('Y-m-d H:i:s');
    $expiresAt = $otpRecord['expires_at'];
    $createdAt = $otpRecord['created_at'];
    
    error_log("OTP Debug - Current time: $currentTime");
    error_log("OTP Debug - Created at: $createdAt");
    error_log("OTP Debug - Expires at: $expiresAt");
    error_log("OTP Debug - Time until expiry: " . (strtotime($expiresAt) - time()) . " seconds");
    
    // Check if OTP is expired
    if (strtotime($expiresAt) <= time()) {
        throw new Exception("OTP has expired. Expired at: $expiresAt, Current time: $currentTime");
    }
    
    if (!hash_equals($otpRecord['otp_code'], $otpCode)) {
        throw new Exception('Invalid OTP code');
    }
    
    // OTP is valid, clean up old OTPs
    $stmt = $pdo->prepare('DELETE FROM patient_otp WHERE patient_id = ? AND method = ?');
    $stmt->execute([$user['id'], 'email']);
    
    // Start session
    session_start();
    $_SESSION['patient_id'] = $user['id'];
    $_SESSION['patient_name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['patient_email'] = $user['email'];
    $_SESSION['authenticated'] = true;
    $_SESSION['auth_method'] = 'email';
    
    $response['success'] = true;
    $response['message'] = 'OTP verified successfully';
    $response['data'] = [
        'patient_id' => $user['id'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'auth_method' => 'email'
    ];
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    error_log('Verify OTP Error: ' . $e->getMessage());
} catch (Throwable $e) {
    $response['message'] = 'Server error: ' . $e->getMessage();
    error_log('Verify OTP Fatal Error: ' . $e->getMessage());
}

// Clean any prior output to avoid invalid JSON
ob_end_clean();
http_response_code(200);
echo json_encode($response);
?>
