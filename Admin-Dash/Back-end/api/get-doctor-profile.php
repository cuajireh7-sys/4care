<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/database.php';

try {
    $pdo = admin_pdo();
    
    // Get the current doctor's complete profile information
    $stmt = $pdo->prepare("
        SELECT 
            du.id,
            du.username,
            du.name,
            du.email,
            du.phone,
            du.dob,
            du.address,
            du.online_status,
            du.role,
            du.created_at,
            du.updated_at,
            s.name as specialization_name,
            s.id as specialization_id,
            d.name as department_name,
            d.id as department_id,
            sh.name as current_shift_name,
            sh.id as current_shift_id,
            sh.start_time as shift_start_time,
            sh.end_time as shift_end_time
        FROM doctor_users du
        LEFT JOIN specializations s ON du.specialization_id = s.id
        LEFT JOIN departments d ON du.department_id = d.id
        LEFT JOIN shifts sh ON du.current_shift_id = sh.id
        WHERE du.role = 'doctor'
        ORDER BY du.id ASC
        LIMIT 1
    ");
    
    $stmt->execute();
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($doctor) {
        // Get professional info
        $stmt = $pdo->prepare("
            SELECT license_number, employee_id, experience_years, joined_date, salary, status
            FROM doctor_professional_info 
            WHERE doctor_id = ?
        ");
        $stmt->execute([$doctor['id']]);
        $professionalInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get education
        $stmt = $pdo->prepare("
            SELECT degree, institution, graduation_year, gpa
            FROM doctor_education 
            WHERE doctor_id = ?
            ORDER BY graduation_year DESC
        ");
        $stmt->execute([$doctor['id']]);
        $education = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get certifications
        $stmt = $pdo->prepare("
            SELECT certification_name, issuing_organization, issue_date, expiry_date, certification_number
            FROM doctor_certifications 
            WHERE doctor_id = ?
            ORDER BY issue_date DESC
        ");
        $stmt->execute([$doctor['id']]);
        $certifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get emergency contacts
        $stmt = $pdo->prepare("
            SELECT contact_name, relationship, phone, email, address, is_primary
            FROM doctor_emergency_contacts 
            WHERE doctor_id = ?
            ORDER BY is_primary DESC
        ");
        $stmt->execute([$doctor['id']]);
        $emergencyContacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get shift assignments
        $stmt = $pdo->prepare("
            SELECT 
                dsa.assigned_date,
                dsa.is_active,
                s.name as shift_name,
                s.start_time,
                s.end_time
            FROM doctor_shift_assignments dsa
            JOIN shifts s ON dsa.shift_id = s.id
            WHERE dsa.doctor_id = ?
            ORDER BY dsa.assigned_date DESC
        ");
        $stmt->execute([$doctor['id']]);
        $shiftAssignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Combine all data
        $completeProfile = array_merge($doctor, [
            'professional_info' => $professionalInfo,
            'education' => $education,
            'certifications' => $certifications,
            'emergency_contacts' => $emergencyContacts,
            'shift_assignments' => $shiftAssignments
        ]);
        
        echo json_encode([
            'success' => true,
            'data' => $completeProfile
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No doctor found'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>