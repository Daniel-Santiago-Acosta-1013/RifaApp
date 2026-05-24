resource "aws_security_group" "client" {
  name   = "${var.name_prefix}-db-client"
  vpc_id = var.vpc_id
  tags   = merge(var.tags, { Name = "${var.name_prefix}-db-client-sg" })

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db" {
  name   = "${var.name_prefix}-db"
  vpc_id = var.vpc_id
  tags   = merge(var.tags, { Name = "${var.name_prefix}-db-sg" })

  ingress {
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.client.id]
    description     = "Allow clients to reach Aurora"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_subnet_group" "db" {
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = merge(var.tags, { Name = "${var.name_prefix}-db-subnets" })
}

resource "aws_rds_cluster" "db" {
  cluster_identifier      = "${var.name_prefix}-aurora"
  engine                  = var.db_engine
  engine_version          = var.db_engine_version
  database_name           = var.db_name
  master_username         = var.db_username
  master_password         = var.db_password
  snapshot_identifier     = var.db_snapshot_identifier
  port                    = var.db_port
  vpc_security_group_ids  = [aws_security_group.db.id]
  db_subnet_group_name    = aws_db_subnet_group.db.name
  backup_retention_period = var.db_backup_retention
  storage_encrypted       = true
  deletion_protection     = var.db_deletion_protection
  skip_final_snapshot     = var.db_skip_final_snapshot
  apply_immediately       = var.db_apply_immediately
  copy_tags_to_snapshot   = true
  tags                    = var.tags
}

resource "aws_rds_cluster_instance" "writer" {
  identifier           = "${var.name_prefix}-aurora-writer"
  cluster_identifier   = aws_rds_cluster.db.id
  instance_class       = var.db_instance_class
  engine               = aws_rds_cluster.db.engine
  engine_version       = aws_rds_cluster.db.engine_version
  publicly_accessible  = var.db_publicly_accessible
  db_subnet_group_name = aws_db_subnet_group.db.name
  apply_immediately    = var.db_apply_immediately
  promotion_tier       = 0
  tags                 = var.tags
}

resource "aws_rds_cluster_instance" "readers" {
  count                = var.db_reader_instance_count
  identifier           = "${var.name_prefix}-aurora-reader-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.db.id
  instance_class       = var.db_instance_class
  engine               = aws_rds_cluster.db.engine
  engine_version       = aws_rds_cluster.db.engine_version
  publicly_accessible  = var.db_publicly_accessible
  db_subnet_group_name = aws_db_subnet_group.db.name
  apply_immediately    = var.db_apply_immediately
  promotion_tier       = 1
  tags                 = var.tags
}
