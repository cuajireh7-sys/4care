<?php
// Check current schedules in database
try {
    // Database connection
    $host = 'localhost';
    $dbname = '4care';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h3>📊 Current Calendar Schedules</h3>";
    
    // Get all schedules
    $stmt = $pdo->query("SELECT id, title, start_date, start_time, end_time, event_type, doctor_name, role, status, created_at FROM calendar_schedules ORDER BY id");
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($entries)) {
        echo "<div class='info'>No schedules found in database.</div>";
        return;
    }
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Title</th><th>Date</th><th>Time</th><th>Type</th><th>Doctor</th><th>Status</th><th>Created</th>";
    echo "</tr>";
    
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
        echo "<td>{$entry['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Summary
    $scheduledCount = count(array_filter($entries, function($e) { return $e['status'] === 'scheduled'; }));
    $finishedCount = count(array_filter($entries, function($e) { return $e['status'] === 'finished'; }));
    
    echo "<div class='info'>";
    echo "<strong>Summary:</strong> ";
    echo "Total: " . count($entries) . " schedules | ";
    echo "Scheduled: $scheduledCount | ";
    echo "Finished: $finishedCount";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div class='error'>❌ Database error: " . $e->getMessage() . "</div>";
} catch (Exception $e) {
    echo "<div class='error'>❌ Error: " . $e->getMessage() . "</div>";
}
?>
