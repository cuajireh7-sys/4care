<?php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../../../Database-Connection/connection.php';
    $pdo = get_pdo();
    
    $email = 'nathanielbautista0302@gmail.com';
    error_log("Looking up user: $email");
    
    $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, phone_number FROM patient_account WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user) {
        error_log("User found: " . $user['first_name'] . " " . $user['last_name']);
        echo json_encode(['success' => true, 'message' => 'User found', 'user' => $user]);
    } else {
        error_log("User not found");
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    
} catch (Exception $e) {
    error_log("User lookup error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
