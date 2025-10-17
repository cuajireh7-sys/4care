<?php
// Check database status
try {
    // Database connection
    $host = 'localhost';
    $dbname = '4care';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "📊 Database Status Check\n";
    echo str_repeat("=", 50) . "\n\n";
    
    // Check for duplicate IDs
    $stmt = $pdo->query("SELECT id, COUNT(*) as count FROM calendar_schedules GROUP BY id HAVING count > 1");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($duplicates)) {
        echo "❌ ISSUE FOUND: Duplicate IDs detected:\n";
        foreach ($duplicates as $dup) {
            echo "   ID {$dup['id']}: {$dup['count']} entries\n";
        }
        echo "\n🔧 SOLUTION: Run the database fix tool to resolve this issue.\n\n";
    } else {
        echo "✅ GOOD: No duplicate IDs found.\n\n";
    }
    
    // Check table structure
    $stmt = $pdo->query("SHOW CREATE TABLE calendar_schedules");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $createTable = $result['Create Table'];
    
    if (strpos($createTable, 'AUTO_INCREMENT') !== false) {
        echo "✅ GOOD: Table has AUTO_INCREMENT configured.\n\n";
    } else {
        echo "❌ ISSUE: Table missing AUTO_INCREMENT configuration.\n\n";
    }
    
    // Show current data
    $stmt = $pdo->query("SELECT id, title, start_date, start_time, end_time, event_type, doctor_name, role, status FROM calendar_schedules ORDER BY id");
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📋 Current calendar_schedules data (" . count($entries) . " entries):\n";
    echo str_repeat("-", 100) . "\n";
    echo sprintf("%-3s | %-20s | %-10s | %-12s | %-10s | %-15s | %-10s | %-10s\n", 
        "ID", "Title", "Date", "Time", "Type", "Doctor", "Role", "Status");
    echo str_repeat("-", 100) . "\n";
    
    foreach ($entries as $entry) {
        $time = $entry['start_time'] . '-' . $entry['end_time'];
        echo sprintf("%-3s | %-20s | %-10s | %-12s | %-10s | %-15s | %-10s | %-10s\n",
            $entry['id'],
            substr($entry['title'], 0, 20),
            $entry['start_date'],
            substr($time, 0, 12),
            substr($entry['event_type'], 0, 10),
            substr($entry['doctor_name'], 0, 15),
            substr($entry['role'], 0, 10),
            $entry['status']
        );
    }
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "Status check completed.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
