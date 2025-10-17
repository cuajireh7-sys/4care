<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database connection
    $host = 'localhost';
    $dbname = '4care';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get JSON input
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    if (!$data) {
        // Try form data
        $data = $_POST;
    }
    
    if (!$data) {
        throw new Exception('No data received');
    }
    
    $id = $data['id'] ?? '';
    
    // Validate required fields
    if (empty($id)) {
        throw new Exception('Schedule ID is required');
    }
    
    // Check if schedule exists
    $checkStmt = $pdo->prepare("SELECT id, title FROM calendar_schedules WHERE id = ?");
    $checkStmt->execute([$id]);
    $schedule = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$schedule) {
        throw new Exception('Schedule not found');
    }
    
    // Delete schedule
    $sql = "DELETE FROM calendar_schedules WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$id]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Schedule deleted successfully',
            'deleted_schedule' => [
                'id' => $id,
                'title' => $schedule['title']
            ]
        ]);
    } else {
        throw new Exception('Failed to delete schedule');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>