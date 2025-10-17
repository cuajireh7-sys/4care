<?php
// Simple test file to debug the forgot password API
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Test database connection
    $dbPath = __DIR__ . '/../../../Database-Connection/connection.php';
    if (!file_exists($dbPath)) {
        echo json_encode(['ok' => false, 'error' => 'Database connection file not found', 'path' => $dbPath]);
        exit;
    }
    
    require_once $dbPath;
    $pdo = get_pdo();
    
    // Test mailer path
    $mailerPath = __DIR__ . '/../mailer.php';
    if (!file_exists($mailerPath)) {
        echo json_encode(['ok' => false, 'error' => 'Mailer file not found', 'path' => $mailerPath]);
        exit;
    }
    
    // Test if patient_signup table exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM patient_signup LIMIT 1");
    $count = $stmt->fetchColumn();
    
    echo json_encode([
        'ok' => true, 
        'message' => 'All systems working',
        'patient_count' => $count,
        'db_path' => $dbPath,
        'mailer_path' => $mailerPath
    ]);
    
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage(), 'type' => 'Exception']);
} catch (Error $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage(), 'type' => 'Error']);
} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage(), 'type' => 'Throwable']);
}
?>












