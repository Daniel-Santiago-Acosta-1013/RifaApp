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

output "db_secret_arn" {
  value = aws_rds_cluster.db.master_user_secret[0].secret_arn
}

output "client_security_group_id" {
  value = aws_security_group.client.id
}

output "db_security_group_id" {
  value = aws_security_group.db.id
}

output "migration_artifact_bucket" {
  value = aws_s3_bucket.migration_artifacts.bucket
}

output "migration_codebuild_project_name" {
  value = aws_codebuild_project.migrations.name
}
