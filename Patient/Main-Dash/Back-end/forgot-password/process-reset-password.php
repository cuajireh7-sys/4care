<?php
declare(strict_types=1);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	$wantsJson = isset($_SERVER['HTTP_X_REQUESTED_WITH']) || (isset($_POST['ajax']) && $_POST['ajax'] === '1');
	if ($wantsJson) { header('Content-Type: application/json; charset=UTF-8'); echo json_encode(['ok' => false, 'error' => 'Method not allowed']); }
	else { echo 'Method not allowed'; }
	exit;
}

// Read inputs
$token = isset($_POST['token']) ? (string)$_POST['token'] : '';
$password = isset($_POST['password']) ? (string)$_POST['password'] : '';
$confirm = isset($_POST['confirm_password']) ? (string)$_POST['confirm_password'] : '';

// Detect AJAX for JSON response
$isAjax = (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') || 
          (isset($_POST['ajax']) && $_POST['ajax'] === '1');

// Debug: Log AJAX detection
error_log("AJAX Detection - HTTP_X_REQUESTED_WITH: " . ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? 'NOT SET'));
error_log("AJAX Detection - POST ajax: " . ($_POST['ajax'] ?? 'NOT SET'));
error_log("AJAX Detection - isAjax: " . ($isAjax ? 'TRUE' : 'FALSE'));

if ($isAjax) { 
    header('Content-Type: application/json; charset=UTF-8'); 
    error_log("Setting JSON content type header");
} else {
    error_log("NOT setting JSON content type - will redirect");
}

if ($token === '') {
	http_response_code(400);
	if ($isAjax) { echo json_encode(['ok' => false, 'error' => 'Missing token.']); }
	else { echo 'Missing token.'; }
	exit;
}

// Enhanced password validation
if ($password === '' || $confirm === '') {
	http_response_code(400);
	if ($isAjax) { echo json_encode(['ok' => false, 'error' => 'Please fill out all fields.']); }
	else { echo 'Please fill out all fields.'; }
	exit;
}
if ($password !== $confirm) {
	http_response_code(400);
	if ($isAjax) { echo json_encode(['ok' => false, 'error' => 'Passwords do not match.']); }
	else { echo 'Passwords do not match.'; }
	exit;
}

// Strong password validation (same as signup)
$passwordPattern = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_]).{8,}$/';
if (!preg_match($passwordPattern, $password)) {
	http_response_code(400);
	$errorMsg = 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*_).';
	if ($isAjax) { echo json_encode(['ok' => false, 'error' => $errorMsg]); }
	else { echo $errorMsg; }
	exit;
}

$tokenPlain = $token;

require_once __DIR__ . '/../../../../Database-Connection/connection.php';

try {
	$pdo = get_pdo();
	
	// Debug: Log successful database connection
	error_log("Database connection successful for password reset");
	
	// Debug: Log the token being used
	error_log("Reset password attempt with token: " . substr($token, 0, 10) . "...");

    // Find user by token - use patient_account as the source of truth
    $user = null;
    try {
        // Match your schema: reset_token_hash and reset_token_expires_at
        $stmt = $pdo->prepare('SELECT id, email, password_reset_expires_at FROM patient_account WHERE password_reset_token = ? LIMIT 1');
        $stmt->execute([$tokenPlain]);
        $user = $stmt->fetch();
    } catch (PDOException $e) {
        error_log('Lookup in patient_account failed: ' . $e->getMessage());
        $user = null;
    }

	// Debug: Log user lookup result
	error_log("User lookup result: " . ($user ? "Found user ID " . $user['id'] : "No user found"));

	if (!$user) {
		http_response_code(404);
		if ($isAjax) { echo json_encode(['ok' => false, 'error' => 'Invalid or used reset token.']); }
		else { echo 'Invalid or used reset token.'; }
		exit;
	}

    // Check expiration
    if (isset($user['password_reset_expires_at']) && $user['password_reset_expires_at'] !== null && strtotime($user['password_reset_expires_at']) < time()) {
        http_response_code(400);
        $msg = 'Reset token expired.';
        if ($isAjax) { echo json_encode(['ok' => false, 'error' => $msg]); }
        else { echo $msg; }
        exit;
    }

    // Update password and clear token in patient_account
	$newHash = password_hash($password, PASSWORD_DEFAULT);
    try {
        // Prefer password_hash column if present; otherwise try password
        $cols = $pdo->query("SHOW COLUMNS FROM patient_account")->fetchAll(PDO::FETCH_COLUMN, 0);
        $pwdCol = in_array('password_hash', $cols, true) ? 'password_hash' : (in_array('password', $cols, true) ? 'password' : null);
        if (!$pwdCol) { throw new PDOException('No password column found in patient_account'); }
        $upd = $pdo->prepare("UPDATE patient_account SET $pwdCol = ?, password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = ?");
        $result = $upd->execute([$newHash, (int)$user['id']]);
    } catch (PDOException $e) {
        error_log('Password update in patient_account failed: ' . $e->getMessage());
        throw $e;
    }
	
	// Debug: Log password update result
	error_log("Password update result: " . ($result ? "Success" : "Failed"));
	error_log("Rows affected: " . $upd->rowCount());

	if ($isAjax) {
		echo json_encode(['ok' => true, 'message' => 'Your password has been reset. You can now sign in.']);
		exit;
	}

	// For non-AJAX requests, redirect to main page
	header('Location: ../../4Care-Main.html');
	exit;
} catch (Throwable $e) {
	// Debug: Log the actual error
	error_log("Reset password error: " . $e->getMessage());
	error_log("Stack trace: " . $e->getTraceAsString());
	
	http_response_code(500);
	$errorMessage = 'Server error. Please try again.';
	if ($isAjax) { echo json_encode(['ok' => false, 'error' => $errorMessage]); }
	else { echo $errorMessage; }
	exit;
}
?>