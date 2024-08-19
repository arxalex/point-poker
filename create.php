<?php
//create.php

$received_data = json_decode(file_get_contents("php://input"));

function mysql_escape_mimic($inp)
{
    if (is_array($inp))
        return array_map(__METHOD__, $inp);

    if (!empty($inp) && is_string($inp)) {
        return str_replace(array('\\', "\0", "\n", "\r", "'", '"', "\x1a"), array('\\\\', '\\0', '\\n', '\\r', "\\'", '\\"', '\\Z'), $inp);
    }

    return $inp;
}

function has_duplicate($received_data, $ignore, $connect)
{
	$data = array();
	$query = "SELECT * FROM `" . mysql_escape_mimic($received_data->table) . "`";
	$i = 0;
	foreach ($received_data->query as $key => $value) {
		if (!in_array($key, $ignore)) {
			if ($i++ == 0) {
				$query .= "WHERE `" . mysql_escape_mimic($key) . "` = '" . mysql_escape_mimic($value) . "' ";
			} else {
				$query .= "AND `" . mysql_escape_mimic($key) . "` = '" . mysql_escape_mimic($value) . "' ";
			}
		}
	}
	$query .= "
	ORDER BY id DESC";
	$statement = $connect->prepare($query);
	$statement->execute();
	while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
		$data[] = $row;
	}
	return count($data) > 0;
}

function insert($received_data, $ignore, $connect)
{
	$data = array();
	if (has_duplicate($received_data, $ignore, $connect)) {
		$data = [
			'response' => false,
		];
	} else {
		$query = "INSERT INTO " . mysql_escape_mimic($received_data->table);
		$keys = '';
		$values = '';
		foreach ($received_data->query as $key => $value) {
			$keys .= "`" . mysql_escape_mimic($key) . "`, ";
			if ($value == "DEFAULT") {
				$values .= "DEFAULT, ";
			} else {
				$values .= "'" . mysql_escape_mimic($value) . "', ";
			}
		}
		$query .= " (" . substr($keys, 0, -2) . ") VALUES (" . substr($values, 0, -2) . ")";
		$statement = $connect->prepare($query);
		$response = $statement->execute();

		$data = [
			"id" => $connect->lastInsertId(),
			"pass" => $received_data->query->pass,
			"response" => $response,
		];
	}
	return json_encode($data, JSON_UNESCAPED_UNICODE);
}

if ($received_data->table != '') {
	if ($received_data->query != '') {
		$config = json_decode(file_get_contents("./config.json"));
        $connect = new PDO(
            "mysql:host=$config->DB_host; dbname=$config->DB_dbname; charset=utf8",
            $config->DB_username,
            $config->DB_password
        );
		$data = array();
		if ($received_data->table == 'pp_link') {
			$ignore = ['pass', 'linkid', 'name', 'rate'];
		} elseif ($received_data->table == 'pp_members') {
			$ignore = ['id'];
		} elseif ($received_data->table == 'pp_sessions') {
			$ignore = [];
		}
		echo insert($received_data, $ignore, $connect);
	}
} else {
	http_response_code(404);
}
