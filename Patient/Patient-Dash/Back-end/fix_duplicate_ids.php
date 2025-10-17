<?php
// Direct fix for calendar_schedules duplicate IDs
try {
    // Database connection
    $host = 'localhost';
    $dbname = '4care';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>🔧 Fixing Calendar Database - Duplicate IDs</h2>";
    
    // Get current max ID
    $stmt = $pdo->query("SELECT MAX(id) as max_id FROM calendar_schedules");
    $maxId = $stmt->fetch(PDO::FETCH_ASSOC)['max_id'] ?? 0;
    echo "<p><strong>Current max ID:</strong> $maxId</p>";
    
    // Find all entries with id = 0
    $stmt = $pdo->query("SELECT * FROM calendar_schedules WHERE id = 0 ORDER BY created_at");
    $zeroIdEntries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($zeroIdEntries)) {
        echo "<p><strong>✅ No duplicate IDs found. Database is already correct.</strong></p>";
        return;
    }
    
    echo "<p><strong>Found " . count($zeroIdEntries) . " entries with ID = 0:</strong></p>";
    echo "<ul>";
    foreach ($zeroIdEntries as $entry) {
        echo "<li>ID: {$entry['id']}, Title: '{$entry['title']}', Date: {$entry['start_date']}, Status: {$entry['status']}</li>";
    }
    echo "</ul>";
    
    // Fix each entry with id = 0
    echo "<p><strong>🔧 Fixing duplicate IDs...</strong></p>";
    
    foreach ($zeroIdEntries as $entry) {
        $maxId++;
        
        // Update the entry with a new unique ID
        $updateStmt = $pdo->prepare("UPDATE calendar_schedules SET id = ? WHERE id = 0 AND title = ? AND start_date = ? AND created_at = ? LIMIT 1");
        $result = $updateStmt->execute([$maxId, $entry['title'], $entry['start_date'], $entry['created_at']]);
        
        if ($result && $updateStmt->rowCount() > 0) {
            echo "<p>✅ Updated '{$entry['title']}' to ID $maxId</p>";
        } else {
            echo "<p>❌ Failed to update '{$entry['title']}'</p>";
        }
    }
    
    // Ensure proper primary key structure
    echo "<p><strong>🔧 Ensuring proper primary key structure...</strong></p>";
    $pdo->exec("ALTER TABLE calendar_schedules MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY");
    echo "<p><strong>✅ Primary key structure updated!</p>";
    
    // Verify fix
    $stmt = $pdo->query("SELECT id, COUNT(*) as count FROM calendar_schedules GROUP BY id HAVING count > 1");
    $remainingDuplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($remainingDuplicates)) {
        echo "<p><strong>🎉 SUCCESS: All duplicate IDs fixed!</strong></p>";
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
        $statusColor = $entry['status'] === 'finished' ? '#dc3545' : '#28a745';
        
        echo "<tr>";
        echo "<td>{$entry['id']}</td>";
        echo "<td>{$entry['title']}</td>";
        echo "<td>{$entry['start_date']}</td>";
        echo "<td>$time</td>";
        echo "<td>{$entry['event_type']}</td>";
        echo "<td>{$entry['doctor_name']}</td>";
        echo "<td style='color: $statusColor; font-weight: bold;'>{$entry['status']}</td>";
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
