<?php
// Test delete functionality
header('Content-Type: application/json');

try {
    // Database connection
    $host = 'localhost';
    $dbname = '4care';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get the schedule ID to delete (from URL parameter)
    $id = $_GET['id'] ?? '';
    
    if (empty($id)) {
        throw new Exception('Schedule ID is required');
    }
    
    // Check if schedule exists
    $checkStmt = $pdo->prepare("SELECT id, title, status FROM calendar_schedules WHERE id = ?");
    $checkStmt->execute([$id]);
    $schedule = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$schedule) {
        throw new Exception('Schedule not found');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Schedule found',
        'schedule' => $schedule
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
