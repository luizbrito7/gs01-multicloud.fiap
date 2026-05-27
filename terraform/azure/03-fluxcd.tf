locals {
  flux_repo_url  = "https://github.com/luizbrito7/gs01-multicloud.fiap"
  flux_repo_path = "./fluxcd/apps/overlays/azure"
}

resource "helm_release" "flux" {
  name             = "flux2"
  repository       = "https://fluxcd-community.github.io/helm-charts"
  chart            = "flux2"
  version          = "~> 2.13"
  namespace        = "flux-system"
  create_namespace = true

  depends_on = [module.aks]
}

resource "helm_release" "flux_sync" {
  name       = "flux2-sync"
  repository = "https://fluxcd-community.github.io/helm-charts"
  chart      = "flux2-sync"
  version    = "~> 1.8"
  namespace  = "flux-system"

  set {
    name  = "gitRepository.spec.url"
    value = local.flux_repo_url
  }

  set {
    name  = "gitRepository.spec.ref.branch"
    value = "main"
  }

  set {
    name  = "kustomization.spec.path"
    value = local.flux_repo_path
  }

  set {
    name  = "kustomization.spec.decryption.provider"
    value = "sops"
  }

  set {
    name  = "kustomization.spec.decryption.secretRef.name"
    value = "sops-age"
  }

  depends_on = [helm_release.flux]
}
