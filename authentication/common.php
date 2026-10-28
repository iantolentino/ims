<?php
require_once __DIR__.'/../database/connection.php';
if(session_status()!==PHP_SESSION_ACTIVE){session_set_cookie_params(['httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off']);session_start();}
function authDb(): PDO { $db=prototypeDb();$db->exec("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'staff', active INTEGER NOT NULL DEFAULT 0, reset_requested INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)");return $db; }
function esc($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
function csrf(){if(empty($_SESSION['auth_csrf']))$_SESSION['auth_csrf']=bin2hex(random_bytes(32));return $_SESSION['auth_csrf'];}
function checkCsrf(){if(!hash_equals(csrf(),$_POST['csrf']??''))throw new Exception('Session expired. Refresh and try again.');}
function currentUser(){if(empty($_SESSION['user_id']))return null;$q=authDb()->prepare('SELECT id,username,display_name,role,active FROM accounts WHERE id=?');$q->execute([$_SESSION['user_id']]);$user=$q->fetch(PDO::FETCH_ASSOC);return $user && $user['active']?$user:null;}
