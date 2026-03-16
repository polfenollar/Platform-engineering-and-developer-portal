# ==============================================================================
# Terraform — Dev Environment (LocalStack / kind)
# ==============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # For dev, state is stored locally
  # For staging/prod, use S3 backend (see staging/backend.tf)
}

provider "aws" {
  region = "us-east-1"

  # Dev environment uses LocalStack
  # Uncomment these for local development with LocalStack:
  # endpoints {
  #   s3       = "http://localhost:4566"
  #   ec2      = "http://localhost:4566"
  #   rds      = "http://localhost:4566"
  #   dynamodb = "http://localhost:4566"
  #   ecr      = "http://localhost:4566"
  # }
  # access_key = "test"
  # secret_key = "test"
  # skip_credentials_validation = true
  # skip_requesting_account_id  = true
  # skip_metadata_api_check     = true
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "developer-portal"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}

# --- Storage (S3 + ECR) ---
module "storage" {
  source      = "../../modules/storage"
  project     = var.project
  environment = var.environment
}

# --- Outputs ---
output "ecr_urls" {
  description = "ECR repository URLs"
  value       = module.storage.ecr_repository_urls
}

output "state_bucket" {
  description = "Terraform state bucket"
  value       = module.storage.terraform_state_bucket
}
