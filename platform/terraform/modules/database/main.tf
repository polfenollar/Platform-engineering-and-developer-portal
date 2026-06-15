# ==============================================================================
# Terraform — RDS PostgreSQL Module (Free Tier: db.t3.micro)
# ==============================================================================

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for DB subnet group"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.environment}-db-subnet"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.project}-${var.environment}-db-subnet"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_db_instance" "postgres" {
  identifier     = "${var.project}-${var.environment}-postgres"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp2"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  publicly_accessible = false
  skip_final_snapshot = var.environment != "prod"
  multi_az            = false

  backup_retention_period = var.environment == "prod" ? 7 : 1

  tags = {
    Name        = "${var.project}-${var.environment}-postgres"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "address" {
  description = "RDS address"
  value       = aws_db_instance.postgres.address
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}
