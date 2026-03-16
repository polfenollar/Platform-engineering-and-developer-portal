# ==============================================================================
# Terraform — S3 & ECR Storage Module (Free Tier)
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

variable "ecr_repositories" {
  description = "List of ECR repository names"
  type        = list(string)
  default = [
    "veyor-frontend",
    "veyor-backend",
    "veyor-quoting",
    "veyor-agents",
    "biomedical-api",
    "biomedical-workers"
  ]
}

# --- S3 Bucket for Terraform State ---
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project}-${var.environment}-tf-state"

  tags = {
    Name        = "${var.project}-${var.environment}-tf-state"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- DynamoDB for Terraform State Locking ---
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "${var.project}-${var.environment}-tf-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "${var.project}-${var.environment}-tf-lock"
    Project     = var.project
    Environment = var.environment
  }
}

# --- ECR Repositories ---
resource "aws_ecr_repository" "services" {
  for_each = toset(var.ecr_repositories)

  name                 = "${var.project}/${each.value}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = each.value
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Lifecycle policy: keep last 10 images
resource "aws_ecr_lifecycle_policy" "cleanup" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# --- Outputs ---
output "terraform_state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_lock_table" {
  description = "DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_lock.name
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}
