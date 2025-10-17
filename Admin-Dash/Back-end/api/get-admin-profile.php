<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

try {
    $pdo = admin_pdo();
    
    // Get admin profile data
    $sql = "SELECT name, email, phone, created_at, updated_at FROM admin_users WHERE username = 'admin'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $admin_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin_data) {
        throw new Exception('Admin profile not found');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile loaded successfully',
        'data' => $admin_data
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
