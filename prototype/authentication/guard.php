<?php
require_once __DIR__.'/common.php';
$user=currentUser();if(!$user){$script=str_replace('\\','/',$_SERVER['SCRIPT_NAME']);$base=preg_replace('~/(?:backend|authentication)/[^/]+$~','', $script);if($base===$script)$base=rtrim(str_replace('\\','/',dirname($script)),'/');header('Location: '.$base.'/authentication/login.php');exit;}
$_SESSION['display_name']=$user['display_name'];
