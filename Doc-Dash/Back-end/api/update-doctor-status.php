<?php
header('Content-Type: application/json');

// Database connection (replace with your actual connection details)
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "4care";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Get the raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

$status = $data['status'] ?? null;

if ($status === null || ($status !== 'online' && $status !== 'offline')) {
    echo json_encode(['success' => false, 'message' => 'Invalid status provided.']);
    exit();
}

// Assuming doctor ID is 1 for now, you might want to get this from a session or token
$doctor_id = 1; 

$stmt = $conn->prepare("UPDATE doctor_users SET hospital_status = ?, updated_at = NOW() WHERE id = ?");
$hospitalStatus = ($status === 'online') ? 1 : 0;
$stmt->bind_param("ii", $hospitalStatus, $doctor_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Doctor status updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update doctor status: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
