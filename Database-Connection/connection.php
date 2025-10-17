<?php
declare(strict_types=1);

// Database connection for patient signup system
// Reuse same DB configuration as Admin backend

const DB_CONFIG = [
    'HOST' => '127.0.0.1',
    'NAME' => '4care',
    'USER' => 'root',
    'PASS' => '',
    'CHARSET' => 'utf8mb4',
];

const PDO_OPTIONS = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', 
        DB_CONFIG['HOST'], 
        DB_CONFIG['NAME'], 
        DB_CONFIG['CHARSET']
    );
    
    try {
        $pdo = new PDO($dsn, DB_CONFIG['USER'], DB_CONFIG['PASS'], PDO_OPTIONS);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        throw new Exception("Database connection failed. Please try again later.");
    }
}
