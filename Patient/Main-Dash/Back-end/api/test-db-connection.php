<?php
header('Content-Type: application/json');

try {
    error_log("Testing database connection...");
    require_once __DIR__ . '/../../../../Database-Connection/connection.php';
    $pdo = get_pdo();
    error_log("Database connection successful");
    
    // Test a simple query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM patient_account");
    $result = $stmt->fetch();
    error_log("Query result: " . $result['count'] . " patients");
    
    echo json_encode(['success' => true, 'message' => 'Database works', 'count' => $result['count']]);
    
} catch (Exception $e) {
    error_log("Database test error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
