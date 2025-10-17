<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $pdo = admin_pdo();

    // Helpers for schema safety (mirror Doc-Dash behavior)
    $tableExists = function(PDO $pdo, string $table): bool {
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
            $stmt->execute([$table]);
            return (int)$stmt->fetchColumn() > 0;
        } catch (Throwable $e) { return false; }
    };
    $hasColumn = function(PDO $pdo, string $table, string $column): bool {
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?");
            $stmt->execute([$table, $column]);
            return (int)$stmt->fetchColumn() > 0;
        } catch (Throwable $e) { return false; }
    };

    // Get search and filter parameters
    $search = $_GET['search'] ?? '';
    $barangay = $_GET['barangay'] ?? '';

    if (!$tableExists($pdo, 'patient_details')) {
        throw new Exception('Required table patient_details does not exist');
    }

    $params = [];
    $where = [];
    if ($search !== '') {
        $searchParam = "%$search%";
        $where[] = "(pd.first_name LIKE ? OR pd.last_name LIKE ? OR pd.email LIKE ? OR pd.phone LIKE ?)";
        $params[] = $searchParam; $params[] = $searchParam; $params[] = $searchParam; $params[] = $searchParam;
    }
    if (!empty($barangay) && strtolower((string)$barangay) !== 'all') {
        $where[] = "pd.barangay = ?";
        $params[] = $barangay;
    }

    // Check if genders and countries tables exist
    $gendersTableExists = $tableExists($pdo, 'genders');
    $countriesTableExists = $tableExists($pdo, 'countries');

    if ($gendersTableExists && $countriesTableExists) {
        $sql = "
        SELECT 
            pd.patient_id,
            pd.first_name,
            pd.last_name,
            pd.date_of_birth,
            pd.email,
            pd.phone,
            pd.address,
            pd.barangay,
            pd.city,
            pd.zip_code,
            " . ($hasColumn($pdo,'patient_details','created_at') ? 'pd.created_at' : 'NULL') . " AS created_at,
            " . ($hasColumn($pdo,'patient_details','patient_signup_date') ? 'pd.patient_signup_date' : 'NULL') . " AS patient_signup_date,
            " . ($hasColumn($pdo,'patient_details','profile_photo') ? 'pd.profile_photo' : 'NULL') . " AS profile_photo,
            g.gender_name,
            c.country_name,
            " . ($tableExists($pdo,'patient_medical_info') ? "(SELECT pmi2.blood_type FROM patient_medical_info pmi2 WHERE pmi2.patient_id = pd.patient_id ORDER BY pmi2.created_at DESC LIMIT 1)" : "NULL") . " AS blood_type_name,
            " . ($tableExists($pdo,'patient_medical_info') ? "(SELECT pmi3.allergies FROM patient_medical_info pmi3 WHERE pmi3.patient_id = pd.patient_id ORDER BY pmi3.created_at DESC LIMIT 1)" : "NULL") . " AS allergies,
            " . ($tableExists($pdo,'patient_medical_info') ? "(SELECT pmi4.conditions FROM patient_medical_info pmi4 WHERE pmi4.patient_id = pd.patient_id ORDER BY pmi4.created_at DESC LIMIT 1)" : "NULL") . " AS conditions,
            " . ($tableExists($pdo,'patient_medical_info') ? "COALESCE((SELECT pmi5.current_medications FROM patient_medical_info pmi5 WHERE pmi5.patient_id = pd.patient_id ORDER BY pmi5.created_at DESC LIMIT 1), 'None')" : "'None'") . " AS medications,
            " . ($tableExists($pdo,'patient_emergency_contacts') ? "(SELECT pec2.contact_name FROM patient_emergency_contacts pec2 WHERE pec2.patient_id = pd.patient_id AND pec2.is_primary = 1 ORDER BY pec2.created_at DESC LIMIT 1)" : "NULL") . " AS emergency_name,
            " . ($tableExists($pdo,'patient_emergency_contacts') ? "(SELECT pec3.relationship FROM patient_emergency_contacts pec3 WHERE pec3.patient_id = pd.patient_id AND pec3.is_primary = 1 ORDER BY pec3.created_at DESC LIMIT 1)" : "NULL") . " AS emergency_relationship,
            " . ($tableExists($pdo,'patient_emergency_contacts') ? "(SELECT pec4.phone FROM patient_emergency_contacts pec4 WHERE pec4.patient_id = pd.patient_id AND pec4.is_primary = 1 ORDER BY pec4.created_at DESC LIMIT 1)" : "NULL") . " AS emergency_phone
        FROM patient_details pd
        LEFT JOIN genders g ON pd.gender_id = g.gender_id
        LEFT JOIN countries c ON pd.country_id = c.country_id
        " . (empty($where) ? '' : (' WHERE ' . implode(' AND ', $where))) . "
        ORDER BY pd.patient_id ASC";
    } else {
        // Fallback query without joins to missing tables
        $sql = "
        SELECT 
            pd.patient_id,
            pd.first_name,
            pd.last_name,
            pd.date_of_birth,
            pd.email,
            pd.phone,
            pd.address,
            pd.barangay,
            pd.city,
            pd.zip_code,
            " . ($hasColumn($pdo,'patient_details','created_at') ? 'pd.created_at' : 'NULL') . " AS created_at,
            " . ($hasColumn($pdo,'patient_details','patient_signup_date') ? 'pd.patient_signup_date' : 'NULL') . " AS patient_signup_date,
            " . ($hasColumn($pdo,'patient_details','profile_photo') ? 'pd.profile_photo' : 'NULL') . " AS profile_photo,
            pd.gender as gender_name,
            'Philippines' as country_name,
            " . ($tableExists($pdo,'patient_medical_info') ? "(SELECT pmi2.blood_type FROM patient_medical_info pmi2 WHERE pmi2.patient_id = pd.patient_id ORDER BY pmi2.created_at DESC LIMIT 1)" : "NULL") . " AS blood_type_name,
            " . ($tableExists($pdo,'patient_medical_info') ? "(SELECT pmi3.allergies FROM patient_medical_info pmi3 WHERE pmi3.patient_id = pd.patient_id ORDER BY pmi3.created_at DESC LIMIT 1)" : "NULL") . " AS allergies,
            " . ($tableExists($pdo,'patient_medical_info') ? "(SELECT pmi4.conditions FROM patient_medical_info pmi4 WHERE pmi4.patient_id = pd.patient_id ORDER BY pmi4.created_at DESC LIMIT 1)" : "NULL") . " AS conditions,
            " . ($tableExists($pdo,'patient_medical_info') ? "COALESCE((SELECT pmi5.current_medications FROM patient_medical_info pmi5 WHERE pmi5.patient_id = pd.patient_id ORDER BY pmi5.created_at DESC LIMIT 1), 'None')" : "'None'") . " AS medications,
            " . ($tableExists($pdo,'patient_emergency_contacts') ? "(SELECT pec2.contact_name FROM patient_emergency_contacts pec2 WHERE pec2.patient_id = pd.patient_id AND pec2.is_primary = 1 ORDER BY pec2.created_at DESC LIMIT 1)" : "NULL") . " AS emergency_name,
            " . ($tableExists($pdo,'patient_emergency_contacts') ? "(SELECT pec3.relationship FROM patient_emergency_contacts pec3 WHERE pec3.patient_id = pd.patient_id AND pec3.is_primary = 1 ORDER BY pec3.created_at DESC LIMIT 1)" : "NULL") . " AS emergency_relationship,
            " . ($tableExists($pdo,'patient_emergency_contacts') ? "(SELECT pec4.phone FROM patient_emergency_contacts pec4 WHERE pec4.patient_id = pd.patient_id AND pec4.is_primary = 1 ORDER BY pec4.created_at DESC LIMIT 1)" : "NULL") . " AS emergency_phone
        FROM patient_details pd
        " . (empty($where) ? '' : (' WHERE ' . implode(' AND ', $where))) . "
        ORDER BY pd.patient_id ASC";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data for the frontend (match Admin UI expectations)
    $formatted_patients = [];
    foreach ($patients as $patient) {
        $firstName = trim($patient['first_name'] ?? '');
        $lastName = trim($patient['last_name'] ?? '');
        if ($firstName === '') $firstName = 'Unknown';
        if ($lastName === '') $lastName = 'Patient';

        $formatted_patients[] = [
            'id' => 'pat' . $patient['patient_id'],
            'patient_id' => $patient['patient_id'],
            'firstName' => $firstName,
            'lastName' => $lastName,
            'dob' => !empty($patient['date_of_birth']) ? date('d-m-Y', strtotime($patient['date_of_birth'])) : 'Not provided',
            'gender' => $patient['gender_name'] ?: 'Not provided',
            'email' => $patient['email'] ?: 'Not provided',
            'phone' => $patient['phone'] ?: 'Not provided',
            'address' => $patient['address'] ?: 'Not provided',
            'barangay' => $patient['barangay'] ?: 'Not provided',
            'city' => $patient['city'] ?: 'Not provided',
            'zipCode' => $patient['zip_code'] ?: 'Not provided',
            'country' => $patient['country_name'] ?: 'Not provided',
            'bloodType' => $patient['blood_type_name'] ?: 'Not provided',
            'allergies' => (!empty($patient['allergies']) && trim($patient['allergies']) !== '' ? $patient['allergies'] : 'Not provided'),
            'conditions' => (!empty($patient['conditions']) && trim($patient['conditions']) !== '' ? $patient['conditions'] : 'Not provided'),
            'medications' => (!empty($patient['medications']) && trim($patient['medications']) !== '' ? $patient['medications'] : 'Not provided'),
            'emergencyName' => $patient['emergency_name'] ?: 'Not provided',
            'emergencyRelationship' => $patient['emergency_relationship'] ?: 'Not provided',
            'emergencyPhone' => $patient['emergency_phone'] ?: 'Not provided',
            'additionalDetails' => [],
            'prescriptions' => [],
            'image' => $patient['profile_photo'] ?: ''
        ];
    }

    $response['success'] = true;
    $response['message'] = 'Patients loaded successfully';
    $response['data'] = $formatted_patients;

} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
