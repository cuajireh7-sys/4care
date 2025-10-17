<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

/*
  Seed three doctor accounts (doctor2/3/4) with password = doctor123 and role=doctor.
  Visit: http://localhost/4care/Admin-Dash/Back-end/auth/seed-doctors.php
*/

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = admin_pdo();
    $pdo->beginTransaction();

    $hash = password_hash('doctor123', PASSWORD_DEFAULT);

    $rows = [
        ['DOC-002','Brian','Lopez','doc.brianlopez@example.com','1982-09-10','MD-234567','doctor2'],
        ['DOC-003','Carla','Reyes','doc.carlareyes@example.com','1987-03-22','MD-345678','doctor3'],
        ['DOC-004','Diego','Santos','doc.diegosantos@example.com','1990-11-05','MD-456789','doctor4'],
    ];

    // Ensure table columns (some installs may miss role or password_hash)
    $cols = $pdo->query("SHOW COLUMNS FROM doctor_users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('password_hash', $cols, true)) {
        // Create password_hash column if missing
        $pdo->exec("ALTER TABLE doctor_users ADD COLUMN password_hash VARCHAR(255) NULL");
    }
    if (!in_array('role', $cols, true)) {
        $pdo->exec("ALTER TABLE doctor_users ADD COLUMN role VARCHAR(32) NULL");
    }

    $ins = $pdo->prepare(
        'INSERT INTO doctor_users (employee_id, f_name, l_name, email, date_of_birth, license_number, username, password_hash, role)
         VALUES (:emp,:fn,:ln,:em,:dob,:lic,:un,:ph,:role)
         ON DUPLICATE KEY UPDATE f_name=VALUES(f_name), l_name=VALUES(l_name), email=VALUES(email),
         date_of_birth=VALUES(date_of_birth), license_number=VALUES(license_number), username=VALUES(username),
         password_hash=VALUES(password_hash), role=VALUES(role)'
    );

    $count = 0;
    foreach ($rows as [$emp,$fn,$ln,$em,$dob,$lic,$un]) {
        $ins->execute([
            ':emp'=>$emp,
            ':fn'=>$fn,
            ':ln'=>$ln,
            ':em'=>$em,
            ':dob'=>$dob,
            ':lic'=>$lic,
            ':un'=>$un,
            ':ph'=>$hash,
            ':role'=>'doctor',
        ]);
        $count += $ins->rowCount();
    }

    $pdo->commit();
    echo json_encode(['ok'=>true,'seeded_rows'=>$count,'password'=>'doctor123']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}


