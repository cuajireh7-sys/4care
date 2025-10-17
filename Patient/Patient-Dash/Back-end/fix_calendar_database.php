<?php
// Fix calendar_schedules table structure
// This script will fix the primary key issue and ensure proper auto-increment

try {
    // Database connection
    $host = 'localhost';
    $dbname = '4care';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully.\n";
    
    // First, let's check the current structure
    $stmt = $pdo->query("SHOW CREATE TABLE calendar_schedules");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Current table structure:\n";
    echo $result['Create Table'] . "\n\n";
    
    // Check for duplicate IDs
    $stmt = $pdo->query("SELECT id, COUNT(*) as count FROM calendar_schedules GROUP BY id HAVING count > 1");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($duplicates)) {
        echo "Found duplicate IDs:\n";
        foreach ($duplicates as $dup) {
            echo "ID {$dup['id']}: {$dup['count']} entries\n";
        }
        
        // Fix duplicate IDs by updating all entries with id = 0
        echo "\nFixing duplicate IDs...\n";
        
        // Get the current max ID
        $stmt = $pdo->query("SELECT MAX(id) as max_id FROM calendar_schedules");
        $maxId = $stmt->fetch(PDO::FETCH_ASSOC)['max_id'] ?? 0;
        
        // Update entries with id = 0 to have sequential IDs
        $stmt = $pdo->query("SELECT * FROM calendar_schedules WHERE id = 0 ORDER BY created_at");
        $zeroIdEntries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($zeroIdEntries as $entry) {
            $maxId++;
            $updateStmt = $pdo->prepare("UPDATE calendar_schedules SET id = ? WHERE id = 0 AND created_at = ? LIMIT 1");
            $updateStmt->execute([$maxId, $entry['created_at']]);
            echo "Updated entry '{$entry['title']}' to ID $maxId\n";
        }
        
        echo "Duplicate IDs fixed!\n\n";
    } else {
        echo "No duplicate IDs found.\n\n";
    }
    
    // Ensure the id column is properly set as AUTO_INCREMENT PRIMARY KEY
    echo "Ensuring proper primary key structure...\n";
    $pdo->exec("ALTER TABLE calendar_schedules MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY");
    echo "Primary key structure updated!\n\n";
    
    // Verify the final structure
    $stmt = $pdo->query("SHOW CREATE TABLE calendar_schedules");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Final table structure:\n";
    echo $result['Create Table'] . "\n\n";
    
    // Check if there are any remaining duplicate IDs
    $stmt = $pdo->query("SELECT id, COUNT(*) as count FROM calendar_schedules GROUP BY id HAVING count > 1");
    $remainingDuplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($remainingDuplicates)) {
        echo "✅ SUCCESS: No duplicate IDs remaining. Table structure is now correct!\n";
    } else {
        echo "❌ WARNING: Still found duplicate IDs:\n";
        foreach ($remainingDuplicates as $dup) {
            echo "ID {$dup['id']}: {$dup['count']} entries\n";
        }
    }
    
    // Show current data
    $stmt = $pdo->query("SELECT id, title, start_date, start_time, end_time, event_type, doctor_name, role, status FROM calendar_schedules ORDER BY id");
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nCurrent calendar_schedules data:\n";
    echo "ID | Title | Date | Time | Type | Doctor | Role | Status\n";
    echo str_repeat("-", 80) . "\n";
    foreach ($entries as $entry) {
        echo sprintf("%2d | %-15s | %s | %s | %-10s | %-10s | %-10s | %s\n",
            $entry['id'],
            substr($entry['title'], 0, 15),
            $entry['start_date'],
            $entry['start_time'] . '-' . $entry['end_time'],
            $entry['event_type'],
            substr($entry['doctor_name'], 0, 10),
            substr($entry['role'], 0, 10),
            $entry['status']
        );
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
