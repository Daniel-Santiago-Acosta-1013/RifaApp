data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "migration_artifacts" {
  bucket        = "${var.name_prefix}-migration-artifacts-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = merge(var.tags, { Name = "${var.name_prefix}-migration-artifacts" })
}

resource "aws_s3_bucket_public_access_block" "migration_artifacts" {
  bucket                  = aws_s3_bucket.migration_artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "migration_artifacts" {
  bucket = aws_s3_bucket.migration_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "migration_artifacts" {
  bucket = aws_s3_bucket.migration_artifacts.id

  rule {
    id     = "expire-migration-artifacts"
    status = "Enabled"

    expiration {
      days = 14
    }

    filter {
      prefix = "migrations/"
    }
  }
}

data "aws_iam_policy_document" "codebuild_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "migration_codebuild" {
  name               = "${var.name_prefix}-migration-codebuild-role"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy" "migration_codebuild" {
  name = "${var.name_prefix}-migration-codebuild"
  role = aws_iam_role.migration_codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.migration_artifacts.arn,
          "${aws_s3_bucket.migration_artifacts.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_rds_cluster.db.master_user_secret[0].secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:CreateNetworkInterfacePermission",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeDhcpOptions",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_codebuild_project" "migrations" {
  name          = "${var.name_prefix}-db-migrations"
  description   = "Runs RifaApp Sqitch migrations from inside the VPC."
  service_role  = aws_iam_role.migration_codebuild.arn
  build_timeout = 20
  tags          = var.tags

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_REGION"
      value = data.aws_region.current.name
    }

    environment_variable {
      name  = "MIGRATION_SOURCE_BUCKET"
      value = aws_s3_bucket.migration_artifacts.bucket
    }

    environment_variable {
      name  = "MIGRATION_SOURCE_KEY"
      value = ""
    }

    environment_variable {
      name  = "MIGRATION_COMMAND"
      value = "deploy"
    }

    environment_variable {
      name  = "DB_HOST"
      value = aws_rds_cluster.db.endpoint
    }

    environment_variable {
      name  = "DB_PORT"
      value = tostring(var.db_port)
    }

    environment_variable {
      name  = "DB_NAME"
      value = var.db_name
    }

    environment_variable {
      name  = "DB_USER"
      value = var.db_username
    }

    environment_variable {
      name  = "DB_SECRET_ARN"
      value = aws_rds_cluster.db.master_user_secret[0].secret_arn
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/${var.name_prefix}-db-migrations"
      stream_name = "sqitch"
      status      = "ENABLED"
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = <<-BUILDSPEC
      version: 0.2
      phases:
        install:
          commands:
            - apt-get update
            - apt-get install -y libdbd-pg-perl postgresql-client sqitch
            - sqitch --version
            - psql --version
        build:
          commands:
            - test -n "$MIGRATION_SOURCE_KEY"
            - aws s3 cp "s3://$MIGRATION_SOURCE_BUCKET/$MIGRATION_SOURCE_KEY" /tmp/rifaapp-sqitch.tar.gz
            - mkdir -p /tmp/rifaapp-migrations
            - tar -xzf /tmp/rifaapp-sqitch.tar.gz -C /tmp/rifaapp-migrations
            - export PGPASSWORD="$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET_ARN" --query SecretString --output text | python3 -c 'import json,sys; print(json.load(sys.stdin)["password"])')"
            - cd /tmp/rifaapp-migrations/rifaapp/db
            - SQITCH_TARGET="db:pg://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
            - sqitch "$MIGRATION_COMMAND" "$SQITCH_TARGET"
    BUILDSPEC
  }

  vpc_config {
    vpc_id             = var.vpc_id
    subnets            = var.private_subnet_ids
    security_group_ids = [aws_security_group.client.id]
  }
}
