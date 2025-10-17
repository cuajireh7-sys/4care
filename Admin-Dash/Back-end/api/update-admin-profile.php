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
    
    // Get JSON input
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    
    if (!$input) {
        // Try form data
        $input = $_POST;
    }
    
    if (!$input) {
        throw new Exception('No data received');
    }
    
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $current_password = $input['current_password'] ?? '';
    $new_password = $input['new_password'] ?? '';
    $confirm_password = $input['confirm_password'] ?? '';
    
    // Validate required fields
    if (empty($name) || empty($email)) {
        throw new Exception('Name and email are required');
    }
    
    // If password change is requested
    if (!empty($new_password)) {
        if (empty($current_password)) {
            throw new Exception('Current password is required to change password');
        }
        
        if ($new_password !== $confirm_password) {
            throw new Exception('New password and confirmation do not match');
        }
        
        if (strlen($new_password) < 6) {
            throw new Exception('New password must be at least 6 characters long');
        }
        
        // Verify current password
        $check_sql = "SELECT password FROM admin_users WHERE username = 'admin'";
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute();
        $admin_data = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin_data) {
            throw new Exception('Admin user not found');
        }
        
        // Simple plain text password comparison
        $stored_password = $admin_data['password'];
        
        if ($current_password !== $stored_password) {
            throw new Exception('Current password is incorrect');
        }
        
        // Store new password as plain text
        $plain_password = $new_password;
        
        // Update with new password
        $sql = "UPDATE admin_users SET name = ?, email = ?, phone = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = 'admin'";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$name, $email, $phone, $plain_password]);
    } else {
        // Update without password change
        $sql = "UPDATE admin_users SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE username = 'admin'";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$name, $email, $phone]);
    }
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'password_changed' => !empty($new_password)
            ]
        ]);
    } else {
        throw new Exception('Failed to update profile');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
