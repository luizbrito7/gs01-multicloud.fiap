resource "cloudflare_pages_project" "frontend" {
  account_id        = var.cloudflare_account_id
  name              = "gs01-${local.project}-${local.env}"
  production_branch = "main"

  source {
    type = "github"
    config {
      owner                         = "luizbrito7"
      repo_name                     = "gs01-multicloud.fiap"
      production_branch             = "main"
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
    }
  }

  build_config {
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = "app/frontend"
  }

  deployment_configs {
    production {
      environment_variables = {
        VITE_API_URL = "https://api-${local.project}.${var.cloudflare_zone_name}"
      }
    }
  }
}

resource "cloudflare_pages_domain" "frontend" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.frontend.name
  domain       = "multicloud.${var.cloudflare_zone_name}"
}
