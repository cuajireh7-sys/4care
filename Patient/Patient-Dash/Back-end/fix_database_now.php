<?php
// Direct database fix for calendar_schedules table
try {
    // Database connection
    $host = 'localhost';
    $dbname = '4care';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>🔧 Fixing Calendar Database Structure</h2>";
    echo "<p>This will fix the duplicate ID issue preventing delete operations.</p>";
    
    // Check current state
    $stmt = $pdo->query("SELECT id, COUNT(*) as count FROM calendar_schedules GROUP BY id HAVING count > 1");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($duplicates)) {
        echo "<p><strong>❌ Found duplicate IDs:</strong></p>";
        foreach ($duplicates as $dup) {
            echo "<p>ID {$dup['id']}: {$dup['count']} entries</p>";
        }
        
        // Get current max ID
        $stmt = $pdo->query("SELECT MAX(id) as max_id FROM calendar_schedules");
        $maxId = $stmt->fetch(PDO::FETCH_ASSOC)['max_id'] ?? 0;
        echo "<p><strong>Current max ID:</strong> $maxId</p>";
        
        // Fix duplicate IDs
        echo "<p><strong>🔧 Fixing duplicate IDs...</strong></p>";
        
        $stmt = $pdo->query("SELECT * FROM calendar_schedules WHERE id = 0 ORDER BY created_at");
        $zeroIdEntries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($zeroIdEntries as $entry) {
            $maxId++;
            $updateStmt = $pdo->prepare("UPDATE calendar_schedules SET id = ? WHERE id = 0 AND created_at = ? LIMIT 1");
            $updateStmt->execute([$maxId, $entry['created_at']]);
            echo "<p>✅ Updated '{$entry['title']}' to ID $maxId</p>";
        }
        
        echo "<p><strong>✅ Duplicate IDs fixed!</p>";
    } else {
        echo "<p><strong>✅ No duplicate IDs found.</p>";
    }
    
    // Ensure proper primary key structure
    echo "<p><strong>🔧 Ensuring proper primary key structure...</strong></p>";
    $pdo->exec("ALTER TABLE calendar_schedules MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY");
    echo "<p><strong>✅ Primary key structure updated!</p>";
    
    // Verify fix
    $stmt = $pdo->query("SELECT id, COUNT(*) as count FROM calendar_schedules GROUP BY id HAVING count > 1");
    $remainingDuplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($remainingDuplicates)) {
        echo "<p><strong>🎉 SUCCESS: Database structure is now correct!</strong></p>";
        echo "<p>Delete functionality should now work properly.</p>";
    } else {
        echo "<p><strong>❌ WARNING: Still found duplicate IDs:</strong></p>";
        foreach ($remainingDuplicates as $dup) {
            echo "<p>ID {$dup['id']}: {$dup['count']} entries</p>";
        }
    }
    
    // Show updated data
    $stmt = $pdo->query("SELECT id, title, start_date, start_time, end_time, event_type, doctor_name, role, status FROM calendar_schedules ORDER BY id");
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>📊 Updated Calendar Schedules:</h3>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'><th>ID</th><th>Title</th><th>Date</th><th>Time</th><th>Type</th><th>Doctor</th><th>Status</th></tr>";
    
    foreach ($entries as $entry) {
        $time = $entry['start_time'] . '-' . $entry['end_time'];
        echo "<tr>";
        echo "<td>{$entry['id']}</td>";
        echo "<td>{$entry['title']}</td>";
        echo "<td>{$entry['start_date']}</td>";
        echo "<td>$time</td>";
        echo "<td>{$entry['event_type']}</td>";
        echo "<td>{$entry['doctor_name']}</td>";
        echo "<td>{$entry['status']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<p><strong>✅ Database fix completed! You can now delete schedules properly.</strong></p>";
    
} catch (PDOException $e) {
    echo "<p><strong>❌ Database error:</strong> " . $e->getMessage() . "</p>";
} catch (Exception $e) {
    echo "<p><strong>❌ Error:</strong> " . $e->getMessage() . "</p>";
}
?>
