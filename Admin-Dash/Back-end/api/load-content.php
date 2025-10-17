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
    
    // Get parameters
    $section_name = $_GET['section_name'] ?? '';
    $content_key = $_GET['content_key'] ?? '';
    
    if (empty($section_name)) {
        throw new Exception('Section name is required');
    }
    
    $sql = "SELECT content_key, content_value, content_type, updated_at 
            FROM admin_dashboard_content 
            WHERE section_name = ?";
    $params = [$section_name];
    
    if (!empty($content_key)) {
        $sql .= " AND content_key = ?";
        $params[] = $content_key;
    }
    
    $sql .= " ORDER BY updated_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($results)) {
        echo json_encode([
            'success' => true,
            'message' => 'No content found',
            'data' => []
        ]);
        exit;
    }
    
    // If specific content_key requested, return single item
    if (!empty($content_key)) {
        $content = $results[0];
        echo json_encode([
            'success' => true,
            'message' => 'Content loaded successfully',
            'data' => $content
        ]);
    } else {
        // Return all content for section
        echo json_encode([
            'success' => true,
            'message' => 'Content loaded successfully',
            'data' => $results
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
