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

    // Ensure admin_users table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(100) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		role VARCHAR(50) NOT NULL DEFAULT 'admin',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Seed a default admin if table is empty (dev convenience)
    $count = (int)$pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
    if ($count === 0) {
        $defaultUser = 'admin';
        $defaultPass = password_hash('admin123', PASSWORD_DEFAULT);
        $seed = $pdo->prepare('INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)');
        $seed->execute([$defaultUser, $defaultPass, 'admin']);
    }

    $stmt = $pdo->prepare('SELECT id, username, password, role FROM admin_users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    // For now, accept either a hashed password or the plain default you seeded
    $isValid = false;
    if ($admin) {
        $hash = (string)($admin['password'] ?? '');
        $isValid = password_verify($password, $hash) || hash_equals($hash, $password);
    }

    if (!$admin || !$isValid) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Invalid credentials']);
        exit;
    }

    // Validate that the user is actually an admin
    if ($admin['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Access denied. This account is not authorized for admin access.']);
        exit;
    }

    $_SESSION['admin_id'] = (int)$admin['id'];
    $_SESSION['admin_username'] = $admin['username'];
    $_SESSION['admin_role'] = $admin['role'];

    echo json_encode(['ok' => true, 'username' => $admin['username'], 'role' => $admin['role']]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('Admin login error: ' . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}


