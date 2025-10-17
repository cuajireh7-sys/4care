<?php
header('Content-Type: application/json');

try {
    echo json_encode(['success' => true, 'message' => 'Basic test works']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
