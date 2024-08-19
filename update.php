<?php
//update.php

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

if ($received_data->table != '') {
	if ($received_data->query != '') {
		$config = json_decode(file_get_contents("./config.json"));
        $connect = new PDO(
            "mysql:host=$config->DB_host; dbname=$config->DB_dbname; charset=utf8",
            $config->DB_username,
            $config->DB_password
        );
		$data = array();
		$query = "
		UPDATE " . mysql_escape_mimic($received_data->table) . "
		SET ";
		foreach ($received_data->query as $key => $value) {
			if ($key != "id" && $key != "pass") {
				$query .= "`" . mysql_escape_mimic($key) . "` = '" . mysql_escape_mimic($value) . "', ";
			}
		}
		$query = substr($query, 0, -2);
		$query .= "WHERE `id` = '" . mysql_escape_mimic($received_data->query->id) . "' AND `pass` = '" . mysql_escape_mimic($received_data->query->pass) . "'";
		if($received_data->table == "pp_link"){
			$query .= " AND `memberid` = '". mysql_escape_mimic($received_data->query->memberid) ."'";
		}
		$statement = $connect->prepare($query);
		$response = $statement->execute();
		$data = [
			'response' => $response,
		];
		echo json_encode($data);
	}
} else {
	http_response_code(404);
}