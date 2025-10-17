<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Ensure no PHP notices/warnings leak into JSON
ini_set('display_errors', '0');
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../../../Database-Connection/connection.php';

// Define functions first
function sendEmailOtp(string $email, string $otp, string $firstName): bool {
    try {
        error_log("Starting email OTP send to: $email");
        
        // Use the EXACT same approach as the working forgot password email
        $mail = require __DIR__ . '/../mailer.php';
        error_log("Mailer loaded successfully");
        
        // Set up email exactly like the working forgot password
        $mail->setFrom($mail->Username, '4Care Health System');
        $mail->addReplyTo($mail->Username, '4Care Health System');
        $mail->addAddress($email);
        $mail->Subject = '4Care - Verification Code';
        
        $mail->Body = "
        <html>
        <body style='font-family: Arial, sans-serif;'>
            <h2>4Care Verification Code</h2>
            <p>Hello {$firstName},</p>
            <p>Your verification code is: <strong style='font-size: 24px; color: #2563eb;'>{$otp}</strong></p>
            <p>This code will expire in 2 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <br>
            <p>Best regards,<br>4Care Health System</p>
        </body>
        </html>";
        
        error_log("About to send email...");
        $result = $mail->send();
        error_log("Email send result: " . ($result ? 'SUCCESS' : 'FAILED'));
        error_log("OTP Email sent successfully to: " . $email);
        return $result;
        
    } catch (Exception $e) {
        error_log("OTP Email sending failed: " . $e->getMessage());
        error_log("Email error details: " . $e->getTraceAsString());
        return false;
    }
}

function sendSmsOtp($phone, $otp) {
    // For demo purposes, we'll just log the OTP
    // In production, integrate with SMS service like Twilio, Vonage, etc.
    error_log("SMS OTP for {$phone}: {$otp}");
    
    // Simulate SMS sending (replace with actual SMS service)
    return true;
}

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    error_log("Starting OTP generation...");
    $pdo = get_pdo();
    error_log("Database connection successful");
    
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = $_POST;
    }
    
    $email = strtolower(trim($data['email'] ?? ''));
    $phone = trim($data['phone'] ?? '');
    $method = $data['method'] ?? ''; // 'email' or 'phone'
    
    if ($method !== 'email' && $method !== 'phone') {
        throw new Exception('Invalid authentication method');
    }
    
    if ($method === 'email' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }
    
    if ($method === 'phone' && !preg_match('/^\+?[1-9]\d{1,14}$/', $phone)) {
        throw new Exception('Invalid phone number');
    }
    
    // Check if user exists
    $user = null;
    if ($method === 'email') {
        $stmt = $pdo->prepare('SELECT id, first_name, last_name, email FROM patient_account WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
    } else {
        $stmt = $pdo->prepare('SELECT id, first_name, last_name, email FROM patient_account WHERE email = ? LIMIT 1');
        $stmt->execute([$phone]);
        $user = $stmt->fetch();
    }
    
    if (!$user) {
        error_log("User not found for method: $method, email: $email, phone: $phone");
        throw new Exception('User not found');
    }
    
    error_log("User found: " . $user['first_name'] . " " . $user['last_name']);
    
    // Generate 6-digit OTP
    $otp = str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+2 minutes'));
    
    // Debug: Log the times
    $currentTime = date('Y-m-d H:i:s');
    error_log("OTP Generation - Current time: $currentTime");
    error_log("OTP Generation - Expires at: $expiresAt");
    error_log("OTP Generation - Time until expiry: " . (strtotime($expiresAt) - time()) . " seconds");
    
    // Store OTP in database
    error_log("Storing OTP in database: patient_id={$user['id']}, otp={$otp}, method={$method}");
    $stmt = $pdo->prepare('
        INSERT INTO patient_otp (patient_id, otp_code, method, expires_at, created_at) 
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        otp_code = VALUES(otp_code), 
        expires_at = VALUES(expires_at), 
        created_at = NOW()
    ');
    $result = $stmt->execute([$user['id'], $otp, $method, $expiresAt]);
    error_log("Database insert result: " . ($result ? 'SUCCESS' : 'FAILED'));
    
    // Send OTP via email or SMS
    error_log("About to send OTP via $method");
    if ($method === 'email') {
        $sent = sendEmailOtp($user['email'], $otp, $user['first_name']);
        error_log("Email OTP send result: " . ($sent ? 'SUCCESS' : 'FAILED'));
    } else {
        $sent = sendSmsOtp($user['email'], $otp);
        error_log("SMS OTP send result: " . ($sent ? 'SUCCESS' : 'FAILED'));
    }
    
    $response['success'] = true;
    $response['message'] = 'OTP sent successfully';
    $response['data'] = [
        'method' => $method,
        'target' => $user['email'],
        'expires_in' => 600 // 10 minutes in seconds
    ];
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    error_log('Generate OTP Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
} catch (Throwable $e) {
    $response['message'] = 'Server error: ' . $e->getMessage();
    error_log('Generate OTP Fatal Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
}

// Clean any prior output to avoid invalid JSON
ob_end_clean();
http_response_code(200);
echo json_encode($response);
?>
