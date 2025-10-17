<?php
// Simple version without database modification
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'error' => 'Invalid request method']);
    exit;
}

$email = isset($_POST["email"]) ? trim($_POST["email"]) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address']);
    exit;
}

try {
    // Log start
    error_log("Simple password reset request for: " . $email);
    
    // Check database connection (correct path)
    $dbPath = __DIR__ . '/../../../../Database-Connection/connection.php';
    if (!file_exists($dbPath)) {
        error_log("Database file not found: " . $dbPath);
        echo json_encode(['ok' => false, 'error' => 'Database configuration error']);
        exit;
    }
    
    require_once $dbPath;
    $pdo = get_pdo();
    
    // Check if email exists
    $checkStmt = $pdo->prepare('SELECT id FROM patient_account WHERE email = ?');
    $checkStmt->execute([$email]);
    $user = $checkStmt->fetch();
    
    if (!$user) {
        echo json_encode(['ok' => false, 'error' => 'Email address not found in our system']);
        exit;
    }
    
    error_log("User found, ID: " . $user['id']);
    
    // Generate token and expiry
    $token = bin2hex(random_bytes(16));
    $expiry = date('Y-m-d H:i:s', time() + 60 * 30); // 30 minutes

    // Persist only to patient_account columns: password_reset_token, password_reset_expires_at
    $stmt = $pdo->prepare('UPDATE patient_account SET password_reset_token = ?, password_reset_expires_at = ? WHERE email = ?');
    $result = $stmt->execute([$token, $expiry, $email]);
    error_log("Token update completed to patient_account.password_reset_token/expires");
    
    if ($result) {
        // Check mailer
        $mailerPath = __DIR__ . '/../mailer.php';
        if (!file_exists($mailerPath)) {
            echo json_encode(['ok' => false, 'error' => 'Email system not configured']);
            exit;
        }
        
        try {
            $mail = require $mailerPath;

            // Set up email: use authenticated sender address to avoid avatar/rewriting by Gmail
            $mail->setFrom($mail->Username, '4Care Health System');
            $mail->addReplyTo($mail->Username, '4Care Health System');
            $mail->addAddress($email);
            $mail->Subject = '4Care - Password Reset Request';
            
            // Create reset URL
            $baseUrl = 'http://localhost/4care/Patient/Main-Dash/reset-password.html';
            $resetUrl = $baseUrl . '?token=' . $token;
            
            // Simple email body (no button, link only)
            $mail->Body = "
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>4Care Password Reset</h2>
                <p>Use the link below to reset your password (expires in 30 minutes):</p>
                <p><a href='{$resetUrl}'>{$resetUrl}</a></p>
            </body>
            </html>";
            
            $mail->send();
            error_log("Email sent successfully to: " . $email);
            echo json_encode(['ok' => true, 'message' => 'Password reset email sent successfully. Please check your inbox.']);
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            echo json_encode(['ok' => false, 'error' => 'Failed to send email: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['ok' => false, 'error' => 'Failed to process password reset request']);
    }
    
} catch (Exception $e) {
    error_log("Password reset error: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Error: ' . $e->getMessage()]);
} catch (Error $e) {
    error_log("Fatal error: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'System error: ' . $e->getMessage()]);
}
?>
