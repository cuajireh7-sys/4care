<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../../../phpmailer/vendor/autoload.php';

$mail = new PHPMailer(true);

$mail->SMTPDebug = SMTP::DEBUG_OFF;

$mail->isSMTP();
$mail->SMTPAuth = true;

$mail->Host = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
$mail->Port = (int)(getenv('SMTP_PORT') ?: 465);
$mail->Username = getenv('SMTP_USERNAME') ?: 'nathanielbautista0302@gmail.com';
$mail->Password = getenv('SMTP_PASSWORD') ?: 'alytetozuiobopui';
$mail->SMTPSecure = (getenv('SMTP_SECURE') ?: PHPMailer::ENCRYPTION_SMTPS);

$mail->isHTML(true);
$mail->CharSet = 'UTF-8';

return $mail;

?>