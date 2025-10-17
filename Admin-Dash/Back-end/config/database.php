<?php
declare(strict_types=1);

// Basic PDO connection used by Admin backend
// Reuse same DB as patient app

const ADMIN_DB = [
    'HOST' => '127.0.0.1',
    'NAME' => '4care',
    'USER' => 'root',
    'PASS' => '',
    'CHARSET' => 'utf8mb4',
];

const ADMIN_PDO_OPTIONS = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

function admin_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', ADMIN_DB['HOST'], ADMIN_DB['NAME'], ADMIN_DB['CHARSET']);
    $pdo = new PDO($dsn, ADMIN_DB['USER'], ADMIN_DB['PASS'], ADMIN_PDO_OPTIONS);
    return $pdo;
}


