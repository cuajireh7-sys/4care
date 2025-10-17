<?php
echo "PHP Version: " . phpversion() . "\n";
echo "PDO Available: " . (extension_loaded('pdo') ? 'YES' : 'NO') . "\n";
echo "PDO MySQL Available: " . (extension_loaded('pdo_mysql') ? 'YES' : 'NO') . "\n";
echo "MySQLi Available: " . (extension_loaded('mysqli') ? 'YES' : 'NO') . "\n";

if (extension_loaded('pdo_mysql')) {
    echo "PDO MySQL drivers: " . implode(', ', PDO::getAvailableDrivers()) . "\n";
} else {
    echo "ERROR: PDO MySQL driver not loaded!\n";
    echo "You need to enable extension=pdo_mysql in php.ini\n";
}
?>
