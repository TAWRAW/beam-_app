-- Migration: Table social_integrations pour stocker les tokens OAuth
-- Date: 20 octobre 2025
-- Description: Permet aux utilisateurs de connecter leurs comptes sociaux (Facebook, LinkedIn, Instagram)

-- Créer la table social_integrations
CREATE TABLE IF NOT EXISTS social_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'linkedin', 'instagram')),

  -- Tokens OAuth (chiffrés)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Informations du compte connecté
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  platform_name TEXT,
  platform_email TEXT,

  -- Métadonnées
  scope TEXT[], -- Permissions accordées
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0, -- Compteur d'erreurs consécutives
  last_error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte d'unicité: un utilisateur ne peut avoir qu'une connexion par plateforme
  UNIQUE(user_id, platform)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_integrations_user_id ON social_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_social_integrations_platform ON social_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_social_integrations_expires ON social_integrations(token_expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_social_integrations_active ON social_integrations(user_id, platform, is_active);

-- Commentaires
COMMENT ON TABLE social_integrations IS 'Stocke les connexions OAuth des utilisateurs aux réseaux sociaux';
COMMENT ON COLUMN social_integrations.access_token IS 'Token d''accès chiffré (AES-256-GCM)';
COMMENT ON COLUMN social_integrations.refresh_token IS 'Token de rafraîchissement chiffré (optionnel selon plateforme)';
COMMENT ON COLUMN social_integrations.error_count IS 'Compteur d''erreurs consécutives (réinitialisé après succès)';

-- RLS (Row Level Security)
ALTER TABLE social_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres intégrations
CREATE POLICY "Users can view own integrations"
  ON social_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON social_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON social_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON social_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Fonction pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_social_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_integrations_updated_at
  BEFORE UPDATE ON social_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_social_integrations_updated_at();

-- Fonction helper: Récupérer intégrations actives d'un utilisateur
CREATE OR REPLACE FUNCTION get_active_integrations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  platform TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  platform_username TEXT,
  platform_name TEXT,
  scope TEXT[],
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.platform,
    si.access_token,
    si.refresh_token,
    si.token_expires_at,
    si.platform_user_id,
    si.platform_username,
    si.platform_name,
    si.scope,
    si.last_used_at
  FROM social_integrations si
  WHERE si.user_id = p_user_id
    AND si.is_active = true
  ORDER BY si.platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper: Récupérer intégrations expirant bientôt
CREATE OR REPLACE FUNCTION get_expiring_integrations(p_days_before INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  platform TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.user_id,
    si.platform,
    si.access_token,
    si.refresh_token,
    si.token_expires_at,
    si.platform_user_id
  FROM social_integrations si
  WHERE si.is_active = true
    AND si.token_expires_at IS NOT NULL
    AND si.token_expires_at < NOW() + (p_days_before || ' days')::INTERVAL
    AND si.token_expires_at > NOW()
  ORDER BY si.token_expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper: Marquer une intégration comme utilisée
CREATE OR REPLACE FUNCTION mark_integration_used(p_integration_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE social_integrations
  SET
    last_used_at = NOW(),
    error_count = 0,
    last_error_message = NULL
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper: Enregistrer une erreur d'intégration
CREATE OR REPLACE FUNCTION record_integration_error(
  p_integration_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE social_integrations
  SET
    error_count = error_count + 1,
    last_error_message = p_error_message,
    -- Désactiver après 5 erreurs consécutives
    is_active = CASE WHEN error_count + 1 >= 5 THEN false ELSE is_active END
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions sur les fonctions
GRANT EXECUTE ON FUNCTION get_active_integrations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_integrations(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION mark_integration_used(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION record_integration_error(UUID, TEXT) TO service_role;
