<?php
require __DIR__ . "/../authentication/guard.php";
// Local prototype: activity dates are stored in UTC by SQLite.
date_default_timezone_set('Asia/Manila');
function validDate($value) { $d=DateTime::createFromFormat('!Y-m-d',$value); return $d && $d->format('Y-m-d')===$value; }
$start=$_GET['start']??''; $end=$_GET['end']??''; $kind=$_GET['kind']??'all';
if(!validDate($start) || !validDate($end) || $start>$end || !in_array($kind,['all','assets','supplies','licenses'],true)) { http_response_code(400); exit('Choose a valid start date and end date. The start date must not be after the end date.'); }
$db=prototypeDb();
$sql='SELECT e.created_at,e.type,e.detail,r.kind,r.data,r.deleted_at FROM events e JOIN records r ON r.id=e.record_id WHERE e.created_at >= ? AND e.created_at < ? AND r.deleted_at IS NULL AND e.type <> ?';
$zone=new DateTimeZone('Asia/Manila');$utc=new DateTimeZone('UTC');$from=(new DateTimeImmutable($start.' 00:00:00',$zone))->setTimezone($utc);$until=(new DateTimeImmutable($end.' 00:00:00',$zone))->modify('+1 day')->setTimezone($utc);$params=[$from->format('Y-m-d H:i:s'),$until->format('Y-m-d H:i:s'),'Deleted'];
if($kind!=='all'){$sql.=' AND r.kind=?';$params[]=$kind;}$sql.=' ORDER BY e.created_at DESC,e.id DESC';$stmt=$db->prepare($sql);$stmt->execute($params);
header('Content-Type: text/csv; charset=UTF-8');header('Content-Disposition: attachment; filename="activity-report-'.$start.'-to-'.$end.'.csv"');
$out=fopen('php://output','w');fwrite($out,"\xEF\xBB\xBF");
function safe($value){$value=(string)$value;return preg_match('/^[\s\x00-\x1f]*[=+\-@]/u',$value)?"'".$value:$value;}
fputcsv($out,['Timestamp (Philippine time)','Register','Record','ID / SKU','Activity','Details']);
while($row=$stmt->fetch(PDO::FETCH_ASSOC)){$d=json_decode($row['data'],true)?:[];fputcsv($out,array_map('safe',[(new DateTimeImmutable($row['created_at'],$utc))->setTimezone($zone)->format('Y-m-d H:i:s'),$row['kind'],$d['name']??'', $d['asset_id']??$d['sku']??'', $row['type'],$row['detail']]));}fclose($out);
