output "db_cluster_endpoint" {
  value = aws_rds_cluster.db.endpoint
}

output "db_reader_endpoint" {
  value = aws_rds_cluster.db.reader_endpoint
}

output "db_port" {
  value = var.db_port
}

output "db_name" {
  value = var.db_name
}

output "db_username" {
  value = var.db_username
}

output "client_security_group_id" {
  value = aws_security_group.client.id
}

output "db_security_group_id" {
  value = aws_security_group.db.id
}
