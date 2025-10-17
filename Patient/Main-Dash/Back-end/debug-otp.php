<?php
// Debug version to find the exact error
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    echo "Starting debug...\n";
    
    // Test database connection
    require_once __DIR__ . '/../../../Database-Connection/connection.php';
    $pdo = get_pdo();
    echo "Database connected successfully\n";
    
    // Test mailer
    $mailerPath = __DIR__ . '/mailer.php';
    if (!file_exists($mailerPath)) {
        throw new Exception("Mailer file not found: " . $mailerPath);
    }
    echo "Mailer file exists\n";
    
    $mail = require $mailerPath;
    echo "Mailer loaded successfully\n";
    echo "Mailer username: " . $mail->Username . "\n";
    
    // Test basic email setup
    $mail->setFrom($mail->Username, '4Care Health System');
    $mail->addAddress('nathanielbautista0302@gmail.com');
    $mail->Subject = 'Test OTP Debug';
    $mail->Body = 'Test email from debug script';
    
    echo "Email setup complete\n";
    
    // Don't actually send, just test setup
    echo "All tests passed!\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
} catch (Throwable $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
?>
