# ==============================================================================
# Terraform — Staging Environment (AWS Free Tier)
# ==============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "developer-portal-staging-tf-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "developer-portal-staging-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "developer-portal"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "staging"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "SSH key pair name for EC2"
  type        = string
  default     = ""
}

# --- Networking ---
module "networking" {
  source      = "../../modules/networking"
  project     = var.project
  environment = var.environment
}

# --- k3s Cluster ---
module "k3s" {
  source            = "../../modules/k3s-cluster"
  project           = var.project
  environment       = var.environment
  subnet_id         = module.networking.public_subnet_ids[0]
  security_group_id = module.networking.security_group_id
  instance_type     = "t3.micro"
  key_name          = var.ssh_key_name
}

# --- Database (shared by both projects) ---
module "database" {
  source            = "../../modules/database"
  project           = var.project
  environment       = var.environment
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.security_group_id
  db_name           = "platform"
  db_password       = var.db_password
}

# --- Storage ---
module "storage" {
  source      = "../../modules/storage"
  project     = var.project
  environment = var.environment
}

# --- Outputs ---
output "k3s_public_ip" {
  description = "k3s server public IP"
  value       = module.k3s.public_ip
}

output "k3s_kubeconfig_cmd" {
  description = "Command to get kubeconfig"
  value       = module.k3s.k3s_kubeconfig_command
}

output "database_endpoint" {
  description = "RDS endpoint"
  value       = module.database.endpoint
}

output "ecr_urls" {
  description = "ECR repository URLs"
  value       = module.storage.ecr_repository_urls
}
