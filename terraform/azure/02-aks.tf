module "aks" {
  source  = "Azure/aks/azurerm"
  version = "~> 11.0"

  prefix              = "${local.project}-${local.env}"
  cluster_name        = "aks-${local.project}-${local.env}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  kubernetes_version  = "1.33"

  vnet_subnet = {
    id = azurerm_subnet.aks.id
  }

  network_plugin             = "azure"
  net_profile_service_cidr   = "10.100.0.0/16"
  net_profile_dns_service_ip = "10.100.0.10"

  agents_size  = "Standard_B2s"
  agents_count = 1

  auto_scaling_enabled = true
  agents_min_count     = 1
  agents_max_count     = 2

  role_based_access_control_enabled = false

  log_analytics_workspace_enabled = false

  depends_on = [azurerm_resource_group.main]
}

output "configure_kubectl" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${module.aks.aks_name}"
}
