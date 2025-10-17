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

    // Ensure inventory_management table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS inventory_management (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        supplier VARCHAR(255) NULL,
        expiry_date DATE NULL,
        location VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    // Get JSON input
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    
    if (!$input) {
        // Try form data
        $input = $_POST;
    }
    
    // Debug: Log the raw input
    error_log("Raw input: " . $raw_input);
    error_log("Parsed input: " . print_r($input, true));
    
    if (!$input) {
        throw new Exception('No data received');
    }
    
    $section_name = $input['section_name'] ?? '';
    $content_key = $input['content_key'] ?? '';
    $content_value = $input['content_value'] ?? '';
    $content_type = $input['content_type'] ?? 'text';
    
    if (empty($section_name) || empty($content_key)) {
        throw new Exception('Section name and content key are required');
    }
    
    // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert
    $sql = "INSERT INTO admin_dashboard_content (section_name, content_key, content_value, content_type) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            content_value = VALUES(content_value), 
            content_type = VALUES(content_type),
            updated_at = CURRENT_TIMESTAMP";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$section_name, $content_key, $content_value, $content_type]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Content saved successfully',
            'data' => [
                'section_name' => $section_name,
                'content_key' => $content_key,
                'content_value' => $content_value,
                'content_type' => $content_type
            ]
        ]);
    } else {
        throw new Exception('Failed to save content');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
