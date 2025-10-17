<?php
declare(strict_types=1);
// Deprecated legacy endpoint: do not use. Patient profile is handled in Back-end/patient-details-save.php (patient_profile only).
header('Content-Type: application/json; charset=UTF-8');
http_response_code(410);
echo json_encode(['ok' => false, 'error' => 'Deprecated endpoint. Use Back-end/patient-details-save.php']);
exit;

