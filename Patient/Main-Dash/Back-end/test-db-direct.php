<?php
// Test database connection directly
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=4care;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "SUCCESS: Database connected!\n";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM patient_account");
    $result = $stmt->fetch();
    echo "Patient accounts in database: " . $result['count'] . "\n";
    
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Error Code: " . $e->getCode() . "\n";
}
?>
