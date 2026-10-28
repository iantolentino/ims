<?php
require __DIR__ . "/../authentication/guard.php";
$kind=$_GET['kind']??'';
$fields=[
 'assets'=>['asset_id'=>'Asset ID','serial'=>'Serial number','name'=>'Item name','category'=>'Category','brand'=>'Brand','model'=>'Model','specifications'=>'Specifications','employee'=>'Employee','department'=>'Department','site'=>'Site','room'=>'Room','status'=>'Status','condition'=>'Condition','purchase_cost'=>'Purchase cost','supplier'=>'Supplier','invoice'=>'Invoice / PO','warranty'=>'Warranty expiry','notes'=>'Notes'],
 'supplies'=>['sku'=>'Item ID / SKU','name'=>'Item name','category'=>'Category','location'=>'Location','quantity'=>'Quantity on hand','reorder'=>'Reorder level','supplier'=>'Supplier','unit_cost'=>'Unit cost','notes'=>'Notes'],
 'licenses'=>['name'=>'License / subscription','provider'=>'Provider','location'=>'Location / site','seats'=>'Total seats','assigned'=>'Assigned seats','assignments'=>'Assignments','cost'=>'Cost','frequency'=>'Billing frequency','renewal'=>'Renewal date','expiry'=>'Expiry date','documents'=>'Document reference','notes'=>'Notes']];
if(!isset($fields[$kind])){http_response_code(400);exit('Invalid register.');}
$db=prototypeDb();
$start=$_GET['start']??'';$end=$_GET['end']??'';$params=[$kind];$sql='SELECT data,created_at FROM records WHERE kind=? AND deleted_at IS NULL';
if($start!=='' || $end!==''){$zone=new DateTimeZone('Asia/Manila');$utc=new DateTimeZone('UTC');$valid=function($v){$d=DateTimeImmutable::createFromFormat('!Y-m-d',$v);return $d && $d->format('Y-m-d')===$v;};if(!$valid($start)||!$valid($end)||$start>$end){http_response_code(400);exit('Choose a valid date range.');}$from=(new DateTimeImmutable($start.' 00:00:00',$zone))->setTimezone($utc);$until=(new DateTimeImmutable($end.' 00:00:00',$zone))->modify('+1 day')->setTimezone($utc);$sql.=' AND created_at >= ? AND created_at < ?';$params[]=$from->format('Y-m-d H:i:s');$params[]=$until->format('Y-m-d H:i:s');}
$sql.=' ORDER BY id DESC';$stmt=$db->prepare($sql);$stmt->execute($params);
header('Content-Type: text/csv; charset=UTF-8');header('Content-Disposition: attachment; filename="'.$kind.'-register.csv"');
$out=fopen('php://output','w');fwrite($out,"\xEF\xBB\xBF");fputcsv($out,array_merge(['Date added (Philippine time)'],array_values($fields[$kind])));
function csvSafe($value){$value=(string)$value;return preg_match('/^[\s\x00-\x1f]*[=+\-@]/u',$value)?"'".$value:$value;}
while($row=$stmt->fetch(PDO::FETCH_ASSOC)){$d=json_decode($row['data'],true)?:[];$values=[(new DateTimeImmutable($row['created_at'],new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('Asia/Manila'))->format('Y-m-d H:i:s')];foreach($fields[$kind] as $key=>$label)$values[]=csvSafe($d[$key]??'');fputcsv($out,$values);}fclose($out);
