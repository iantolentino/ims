<?php
require __DIR__.'/common.php';
if($_SERVER['REQUEST_METHOD']==='POST'){checkCsrf();$_SESSION=[];session_destroy();}header('Location: login.php');exit;
