<?php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../../../Database-Connection/connection.php';
    $pdo = get_pdo();
    
    // Get the latest OTP for Nathaniel
    $stmt = $pdo->prepare('
        SELECT patient_id, otp_code, method, expires_at, created_at, 
               NOW() as current_db_time,
               TIMESTAMPDIFF(SECOND, NOW(), expires_at) as seconds_until_expiry
        FROM patient_otp 
        WHERE patient_id = 1 
        ORDER BY created_at DESC 
        LIMIT 1
    ');
    $stmt->execute();
    $otpRecord = $stmt->fetch();
    
    if ($otpRecord) {
        echo json_encode([
            'success' => true,
            'otp_record' => $otpRecord,
            'php_current_time' => date('Y-m-d H:i:s'),
            'php_timestamp' => time()
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No OTP found']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
