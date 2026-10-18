<?php
header('Content-Type: application/json');
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || empty($data['fields'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please fill out all required fields.']);
    exit;
}

$file = __DIR__ . '/rsvps.jsonl';
@file_put_contents($file, json_encode([
    'timestamp' => date('c'),
    'fields' => $data['fields']
]) . "\n", FILE_APPEND | LOCK_EX);

echo json_encode([
    'ok' => true,
    'demo' => true,
    'message' => 'Thank you! Your response has been sent to the couple.'
]);
