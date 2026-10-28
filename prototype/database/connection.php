<?php
// Local prototype connection. Production MySQL/MariaDB configuration is not implemented yet.
function prototypeDb(): PDO {
    $db = new PDO('sqlite:' . __DIR__ . '/prototype.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA foreign_keys=ON');
    return $db;
}
